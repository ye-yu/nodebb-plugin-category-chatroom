(function(module) {
	"use strict";

	var User = require.main.require('./src/user');
	var db = require.main.require('./src/database');
	var winston = require.main.require('winston');
	var express = require.main.require('express')
	var sse = require("@toverux/expresse")
	var fs = require("fs")
	var path = require("path")

	var constants = Object.freeze({
		'name': "Category Chatroom",
		'admin': {
			'icon': 'fa-star',
			'route': '/plugins/category-chatroom'
		}
	});

	var widget = fs.readFileSync(path.join(__dirname, "/static/lib/client/widget.html"), {
		encoding: "utf-8"
	})

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
		winston.verbose("[plugin/category-chatroom] Invoked router init")
		router.use("/category-chatroom", express.static('assets'))
		callback();
	};

	LB.initScript = function({ res }, callback) {
		winston.verbose("[plugin/category-chatroom] Invoked initScript, data:", data)
		callback(null, data);
	};

	LB.defineWidget = function(data, callback) {
		winston.verbose("[plugin/category-chatroom] Requested plugin widget, widget body: " + widget)
		data.push({
			widget: "category_chatbot",
			name: "Category Chatbot",
			description: "Add chatbot to your specific category",
			content: widget
		})
		callback(null, data)
	}

	LB.renderWidget = function(widgetObj, callback) {
		widgetObj.html = widget
		callback(null, widgetObj)
	}

	module.exports = LB;
}(module));
