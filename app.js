var express = require('express');
var bodyParser = require('body-parser');
var queryString = require('query-string');
var request = require('request');

var instagram = {
    client: {
        id: '',
        secret: '',
        redirect_uri: 'http://localhost:8081/redirect'
    },
    endpoints: {
        server: {
            authorize: 'https://api.instagram.com/oauth/authorize/?client_id={client_id}&redirect_uri={redirect_url}&response_type=code',
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