var express = require('express');
var bodyParser = require('body-parser');
var queryString = require('query-string');
var request = require('request');
var fs = require('fs');
var _ = require('underscore');

var data = {
    followers: require('./data/followers.json'),
    following: require('./data/following.json'),
    exclude: {
        followers: require('./data/exclude/followers.json'),
        following: require('./data/exclude/following.json')
    }
};

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

app.use('/static', express.static(__dirname + '/static'));

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    //jsonPrint(res, data);
    res.sendFile(__dirname + '/views/index.html');
});

app.post('/retrieve_access_token', function (req, res) {
    res.redirect(getServerAuthorizeUrl());
});

app.get('/redirect', function (req, res) {

    var errorResponse = {
        error: req[GET].error,
        reason: req[GET].error_reason,
        description: req[GET].error_description
    };

    if (errorResponse.error) {
        jsonPrint(res, errorResponse);
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
    jsonPrint(res, getJSONResult(data[p], p));
});

app.get('/follow/single/exclude/:p', function (req, res) {
    var p = req.params.p;
    jsonPrint(res, getJSONResult(data['exclude'][p], 'exclude ' + p));
});

app.get('/follow/mutual', function (req, res) {
    var followersJSON = data['followers'];
    var followingJSON = data['following'];
    var json = {};
    var intersection = _.intersection(Object.keys(followersJSON), Object.keys(followingJSON));
    for(var i in intersection) {
        if (intersection.hasOwnProperty(i)) {
            var key = intersection[i];

            if (followersJSON.hasOwnProperty(key) && !json.hasOwnProperty(key)) {
                json[key] = followersJSON[key];
            }
            if (followingJSON.hasOwnProperty(key) && !json.hasOwnProperty(key)) {
                json[key] = followingJSON[key];
            }
        }
    }
    jsonPrint(res, getJSONResult(json, ('mutual(followers, following)')));
});

// :following/:followers
app.get('/follow/multi/:p1/:p2/:p3', function(req, res) {
    var p1 = req.params.p1;
    var p2 = req.params.p2;
    var p3 = req.params.p3;
    var json1 = data[p1];
    var json2 = data[p2];
    var excludeJson = data['exclude'][p1];
    var json = {};
    for(var i in json1) {
        if (json1.hasOwnProperty(i) && !json2.hasOwnProperty(i)) {
            if (p3 !== 'exclude' || Object.keys(excludeJson).length === 0 || !excludeJson.hasOwnProperty(i)) {
                json[i] = json1[i];
            }
        }
    }
    jsonPrint(res, getJSONResult(json, (p1+'-'+p2)));
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
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(json));
}

/**
 * Usage:
 *
 * readJSONFile(filepath, function (err, json) {
 *  if (err) {
 *      // fail
 *   } else {
 *      // success
 *   }
 * });
 *
 * @param filename
 * @param callback
 */
// function readJSONFile(filename, callback) {
//     fs.readFile(filename, function (err, data) {
//         if(err) {
//             callback(err);
//             return;
//         }
//         try {
//             callback(null, JSON.parse(data));
//         } catch(exception) {
//             callback(exception);
//         }
//     });
// }

function getJSONResult(json, title) {
    return {
        title: title,
        total: json && typeof json === 'object' ? Object.keys(json).length : 0,
        json: json
    };
}