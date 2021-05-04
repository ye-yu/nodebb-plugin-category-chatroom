(function(module) {
	"use strict";

	var User = require.main.require('./src/user');
	var db = require.main.require('./src/database');
	var winston = require.main.require('winston');
	var express = require.main.require('express')
	var fs = require("fs")
	var path = require("path")
	var Joi = require("joi")
	var Messaging = require("./lib/messaging").init({
		db,
		logging: winston.verbose
	})

	var schema = {
		init: Joi.object({
			chat_id: Joi.string().min(1).required(),
			limit: Joi.number().min(1)
		}),
		message: Joi.object({
			chat_id: Joi.string().min(1).required(),
			message: Joi.string().min(1).required(),
		})
	}

	var SocketPlugins = require.main.require('./src/socket.io/plugins');
	SocketPlugins.categoryChatroom = {};
	SocketPlugins.categoryChatroom.ping = function(socket, data, callback) { 
		winston.verbose("[plugin/category-chatroom] Got ping:", data)
		socket.emit("event:category-chatroom.pong", data)
		callback(null, data)
	};

	var validateSocket = async function(socket) {
		const { uid } = socket
		winston.verbose("[plugin/category-chatroom] Got init from uid:" + uid)
		if (!await User.exists(uid)) throw new Error(`${uid} is not a user!`)
	}

	SocketPlugins.categoryChatroom.init = async function(socket, data) {
		await validateSocket(socket)
		schema.init.validate(data)
		const { chat_id, limit = 50 } = data

		socket.emit("event:category-chatroom.pong", {
			message: `Retrieving ${limit} rows of chat history of ${chat_id}`
		})

		const history = await Messaging.getMessages(chat_id, limit)
		
		socket.emit("event:category-chatroom.history", {
			chat_id,
			history
		})

		return data
	};

	SocketPlugins.categoryChatroom.message = async function(socket, data) {
		await validateSocket(socket)
		schema.message.validate(data)
		const { chat_id, message } = data
		const user = await User.getUsersFields(socket.uid, ['uid', 'username', 'picture']);
		const now = Date.now()
		winston.verbose("Got user info of:", {
			user, now
		})
	}

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
