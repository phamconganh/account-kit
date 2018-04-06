const express = require('express');
const router= express.Router();
const Guid = require('guid');
const Mustache  = require('mustache');
const Request  = require('request');
const Querystring  = require('querystring');
const loadFile = require('../models/loadFileHtml.js');
const db = require('../models/db.js');
const config = require('../config.json');

const bodyParser = require('body-parser');
const parseUrlencoded = bodyParser.urlencoded({ extended: false });

var csrf_guid = Guid.raw();
const account_kit_api_version = config.account_kit_api_version
const app_id = config.app_id;
const app_secret = config.app_secret;
var me_endpoint_base_url = config.me_endpoint_base_url;
var token_exchange_base_url = config.token_exchange_base_url;

const collectionName = 'users';


router.route('/')
	.post(parseUrlencoded, function(request, response) {
		// CSRF check
		if (request.body.csrf === csrf_guid) {
			// make code for access token of app
			var app_access_token = ['AA', app_id, app_secret].join('|');
			var params = {
				grant_type: 'authorization_code',
				code: request.body.code,
				access_token: app_access_token
			};

			// exchange tokens
			var token_exchange_url = token_exchange_base_url + '?' + Querystring.stringify(params);
			Request.get({url: token_exchange_url, json: true}, function(err, resp, respBody) {
				var data = {
					user_access_token: respBody.access_token,
					expires_at: Date.now() + respBody.token_refresh_interval_sec,
					user_id: respBody.id,
					password: request.body.password,
					user_name: {}
				};
				// get account details at /me endpoint
				var me_endpoint_url = me_endpoint_base_url + '?access_token=' + respBody.access_token;
				Request.get({url: me_endpoint_url, json:true }, function(err, resp, respBody) {
					if (respBody.phone) {
						data.user_name.phone = {};
						data.user_name.phone.number = respBody.phone.number;
						data.user_name.phone.country_prefix = respBody.phone.country_prefix;
						data.user_name.phone.national_number = respBody.phone.national_number;
					} else if (respBody.email) {
						data.user_name.email = respBody.email.address;
					}

					var collection = db.getClient().db().collection(collectionName);
					collection.findOne({
						"id": data.user_id
						//
					}
					, (function (err, result) {
						console.log(result);
						if (result){
							response.send("<h1>Account is exited :( !</h1>");
						}else{
							collection.insert({
								"id": data.user_id,
								"user_name": data.user_name,
								"password": data.password,
							}
							, (function(err) {
								if (err){
									response.send("<h1>Error with server :( !</h1>");
								}else{
									var html = Mustache.to_html(loadFile.loadSignInSuccess(), data);
									response.send(html);
								}
							}))
						}
					}))
					
				});
			});
		}
		else {
			someThingWentWrong();
		}
	})
	.get(function (request, response){
		var data = {
			app_id: app_id,
			csrf: csrf_guid,
			version: account_kit_api_version,
		};
		var html = Mustache.to_html(loadFile.loadSignUp(), data);
		response.send(html);
	});


function someThingWentWrong(response) {
	response.writeHead(200, {'Content-Type': 'text/html'});
	response.end("Something went wrong. :( ");
}

module.exports = router;

/**
 * chuyen user_name, redirect
 */