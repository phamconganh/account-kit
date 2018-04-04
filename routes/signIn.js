const Mustache  = require('mustache');
const express = require('express');
const router= express.Router();
const loadFile = require('../models/loadFileHtml.js');
const db = require('../models/db.js');

const collectionName = 'users';

router.route('/')
	.post(function(request, response) {
		var collection = db.getClient().db().collection(collectionName);
		var data = {
			user_name: request.body.user_name,
			password: request.body.password
		}
		collection.findOne({
				"password": data.password,
				$or: [
					{"user_name.email": data.user_name},
					{"user_name.phone.number": data.user_name},
					{"user_name.phone.country_prefix": data.user_name},
					{"user_name.phone.national_number": data.user_name},
				]
			}, (function(err, docs) {
			if(err||!docs){
				response.send("<h1>Sai ten dang nhap hoac mat khau :( !</h1>");
			}else{
				data.user_id = docs.id;
				var html = Mustache.to_html(loadFile.loadSignInSuccess(), data);
				response.send(html);
			}
		}))
	})
	.get(function (request, response){
		var html = Mustache.to_html(loadFile.loadSignIn());
		response.send(html);
	});

module.exports = router;