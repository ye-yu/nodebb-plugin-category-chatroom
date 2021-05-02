(function(module) {
	"use strict";

	var User = require.main.require('./src/user');
	var db = require.main.require('./src/database');
	var winston = require.main.require('winston');
	var sse = require("@toverux/expresse")

	var constants = Object.freeze({
		'name': "Category Chatroom",
		'admin': {
			'icon': 'fa-star',
			'route': '/plugins/category-chatroom'
		}
	});

	var LB = {};

	LB.addMenuItem = function(data, callback) {
		data.authentication.push({
			"route": constants.admin.route,
			"icon": constants.admin.icon,
			"name": constants.name
		});

		callback(null, data);
	};

	LB.initRoute = function({ router }, callback) {
		callback();
	};

	LB.initScript = function(data, callback) {
		winston.verbose("[plugin/Category Chatroom] Invoked initScript, data:", data)
		callback();
	};

	module.exports = LB;
}(module));
