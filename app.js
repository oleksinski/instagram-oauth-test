var express = require('express');
var bodyParser = require('body-parser');
var queryString = require('query-string');
var request = require('request');
var fs = require('fs');

var instagram = {
    client: {
        id: '{CLIENT_ID}', // get on https://www.instagram.com/developer
        secret: '{CLIENT_SECRET}', // get on https://www.instagram.com/developer
        redirect_uri: '{REDIRECT_URL}' // get on https://www.instagram.com/developer
    },
    endpoints: {
        server: {
            authorize: 'https://api.instagram.com/oauth/authorize/?client_id={client_id}&redirect_uri={redirect_url}&response_type=code&scope=follower_list',
            access_token: 'https://api.instagram.com/oauth/access_token?client_id={client_id}&client_secret={client_secret}&grant_type=authorization_code&redirect_uri={redirect_url}&code={code}'
        },
        client: {
            authorize: 'https://api.instagram.com/oauth/authorize/?client_id={client_id}&redirect_uri={redirect_url}&response_type=token'
        }
    }
};

var GET = 'query';
var POST = 'body';

var app = express();

app.use(express.static('public'));

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/' + 'index.html');
});

app.post('/retrieve_access_token', function (req, res) {
    console.log('Got a POST request');
    res.redirect(getServerAuthorizeUrl());
});

app.get('/redirect', function (req, res) {

    var errorResponse = {
        error: req[GET].error,
        reason: req[GET].error_reason,
        description: req[GET].error_description
    };

    if (errorResponse.error) {
        res.end(JSON.stringify(errorResponse));
    } else {
        var code = req[GET].code;

        if (code) {

            var url = getServerAccessTokenUrl(code);
            var urlParts = url.split('?');
            var baseUrl = urlParts[0];
            var queryParams = queryString.parse(urlParts[1]);

            request.post({
                url: baseUrl,
                form: queryParams
            }, function (err, httpResponse, body) {

                var isError = err || !(httpResponse && httpResponse.statusCode == 200);

                var data = {};
                try {
                    data = JSON.parse(body);
                } catch (e) {
                    data = {};
                }

                if (isError) {
                    if (!data) {
                        data = {error: 'Error retrieving access token'};
                    }
                    jsonPrint(res, data);
                } else {
                    // Response from Instagram API
                    //
                    // {
                    //     "access_token": "...",
                    //     "user": {
                    //     "id": "...",
                    //         "username": "...",
                    //         "full_name": "...",
                    //         "profile_picture": "..."
                    //     }
                    // }

                    jsonPrint(res, data);
                }
            });

        } else {
            jsonPrint(res, {error: 'No code received'});
        }
    }

});

// === Proceed files /data/followers.json & /data/following.json === //

app.get('/follow/single/:p', function (req, res) {
    var p = req.params.p;
    readJSONFile(__dirname + '/data/' + p + '.json', function (err, json) {
        if (err) {
            jsonPrint(res, err);
        } else {
            var users = {};
            var size = 0;
            for(var i in json) {
                if (json.hasOwnProperty(i)) {
                    users[i] = json[i];
                    size++;
                }
            }
            jsonPrint(res, {
                title: p,
                total: size,
                users: json
            });
        }
    });
});

// :following/:followers
app.get('/follow/multi/:p1/:p2', function(req, res) {
    var p1 = req.params.p1;
    var p2 = req.params.p2;
    readJSONFile(__dirname + '/data/' + p1 + '.json', function (err, json1) {
        if (err) {
            jsonPrint(res, err);
        } else {
            readJSONFile(__dirname + '/data/' + p2 + '.json', function (err, json2) {
                if (err) {
                    jsonPrint(res, err);
                } else {
                    var json = {};
                    var size = 0;
                    for(var i in json1) {
                        if (json1.hasOwnProperty(i) && !json2.hasOwnProperty(i)) {
                            json[i] = json1[i];
                            size++;
                        }
                    }
                    jsonPrint(res, {
                        title: p1 + ' - ' + p2,
                        total: size,
                        users: json
                    });
                }
            });
        }
    });
});

app.listen(8081, function () {});

// ----

function getServerAuthorizeUrl() {
    var url = instagram.endpoints.server.authorize;
    url = url.replace('{client_id}', instagram.client.id);
    url = url.replace('{redirect_url}', instagram.client.redirect_uri);
    return url;
}

function getServerAccessTokenUrl(code) {
    var url = instagram.endpoints.server.access_token;
    url = url.replace('{client_id}', instagram.client.id);
    url = url.replace('{client_secret}', instagram.client.secret);
    url = url.replace('{redirect_url}', instagram.client.redirect_uri);
    url = url.replace('{code}', code);
    return url;
}

function jsonPrint(res, json) {
    res.end(JSON.stringify(json));
}

function readJSONFile(filename, callback) {
    fs.readFile(filename, function (err, data) {
        if(err) {
            callback(err);
            return;
        }
        try {
            callback(null, JSON.parse(data));
        } catch(exception) {
            callback(exception);
        }
    });
}