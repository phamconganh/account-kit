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
					user_id: respBody.id
				};
				// get account details at /me endpoint
				var me_endpoint_url = me_endpoint_base_url + '?access_token=' + respBody.access_token;
				Request.get({url: me_endpoint_url, json:true }, function(err, resp, respBody) {
					if (respBody.phone) {
						data.user_name = respBody.phone.number;
						// *** '+84....'
					} else if (respBody.email) {
						data.user_name = respBody.email.address;
					}
					//*** do callback nen data.user_name duoc gan muon-> cho vao callback
					var collection = db.getClient().db().collection(collectionName);
					collection.findOne(
						{"id": data.user_id
						// ,$or: [
						// 		{"user_name.email": data.user_name},
						// 		{"user_name.phone.number": data.user_name},
						// 		{"user_name.phone.country_prefix": data.user_name},
						// 		{"user_name.phone.national_number": data.user_name},
						// 	]
						}
						//
					, (function(err, doc) {
						if (err || !doc){
							response.send("<h1>Account is not exit :( !</h1>");
						}else{
							collection.updateOne(
								{ "id" : data.user_id
								// ,$or: [
								// 		{"user_name.email": data.user_name},
								// 		{"user_name.phone.number": data.user_name},
								// 		{"user_name.phone.country_prefix": data.user_name},
								// 		{"user_name.phone.national_number": data.user_name},
								// 	]
								}
								//
							, { $set: {
								"token.access_token" : data.user_access_token ,
								"token.expires_at": data.expires_at,
							} }
							, function(err, result) {
								if(err||!result){
									response.send("<h1>Error with server :( !</h1>");
								}else{
									var param = {
										user_access_token: data.user_access_token
									}
									var urlChangePassword = '/forgot_password/' + 'change?' + Querystring.stringify(param);
									response.redirect(urlChangePassword);
								}
							});
						}
					}))
				});
			});
		}
		else {
			someThingWentWrong()
		}
	})
	.get(function (request, response){
		var data = {
			app_id: app_id,
			csrf: csrf_guid,
			version: account_kit_api_version,
		};
		var html = Mustache.to_html(loadFile.loadForgotPassword(), data);
		response.send(html);
	});

// xu ly khi mat khau khong khop va redirect khi dang sua mat khau thanh cong
router.route('/:params')
	.post(function (request, response){
		if (request.query.user_access_token){
			var data = {
				user_access_token: request.query.user_access_token,
				expires_at: +Date.now(),
				user_name: 'error',
				user_id: 'error'
			}
			var collection = db.getClient().db().collection(collectionName);
			collection.findOne({
				"token.access_token": data.user_access_token,
				"token.expires_at": {$gt : data.expires_at}
			}, (function(err, doc) {
				if (err||!doc){
					collection.update(
						{
							"token.access_token": data.user_access_token, 
							"token.expires_at": {$lte : data.expires_at
						} 
					}
					, { $unset: { "token": 1} }
					, {multi: true}
					, function(err, result) {
						if(err||!result){
							response.send("<h1>Error with server :( !</h1>");
						}else{
							response.send("<h1>Token is expired!</h1>");
						}
					});
				}
				data.password = request.body.new_password;
				if (data.password){
					collection.updateOne(
						{
							"token.access_token": data.user_access_token,
							"token.expires_at": {$gt : data.expires_at}
						}
					, { $set: { "password" : data.password } }
					, function(err, result) {
						if(err||!result){
							response.send("<h1>Error with server :( !</h1>");
						}else{
							collection.update(
								{
									"token.access_token": data.user_access_token
								}
							, { $unset: { "token" : 1} }
							, {multi: true}
							, function(err, result) {
								if(err||!result){
									response.send("<h1>Error with server :( !</h1>");
								}else{
									if(doc.user_name){
										// Loi sau khi nhap khong khop mat khau maf F5 -> userName null
										if (doc.user_name.email) data.user_name = doc.user_name.email;
										if (doc.user_name.phone.number) data.user_name = doc.user_name.phone.number;
									}
									data.user_id = doc.id;
									if(data.password&&data.user_name){
										var html = Mustache.to_html(loadFile.loadSignInSuccess(),data);
										response.send(html);
									}else{
										response.redirect('/sign_in');//?????
									}
								}
							});
						}
					});
				}else{
					someThingWentWrong(response);
				}
			}))
		}
		else {
			someThingWentWrong(response);
		}
	})
	.get(function (request, response){
		if(request.query.user_access_token){
			var data = {
				url: '/forgot_password' + request.url,
			}
			var html = Mustache.to_html(loadFile.loadEditPassword(),data);
			response.send(html);
		}else{
			someThingWentWrong(response);
		}
	})

function someThingWentWrong(response) {
	response.writeHead(200, {'Content-Type': 'text/html'});
	response.end("Something went wrong. :( ");
}

module.exports = router;

/**
 * chuyen user_name, redirect
 */