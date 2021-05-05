(function(module) {
	"use strict";

	var User = require.main.require('./src/user');
	var db = require.main.require('./src/database');
	var winston = require.main.require('winston');
	var express = require.main.require('express')
	var fs = require("fs")
	var path = require("path")
	var Joi = require("joi")

	// dev mode
	var log = true

	var deserializeObj = function(obj) {
		return obj instanceof Set ? `${obj.toString()} {${[...obj].join(",")}}`
		: obj instanceof Array ? `${obj.toString()} [${[...obj].join(",")}]`
		: obj instanceof Object ? `${obj.toString()} ${JSON.stringify(obj, null, 2)}`
		: obj.toString()
	}

	var logging = function() {
		if (!log) return
		var logOutput = [...arguments].map(deserializeObj).join(" ")
		winston.verbose("[plugin/category-chatroom] " + logOutput)
	}

	var Messaging = require("./lib/messaging").init({
		db,
		logging
	})

	var schema = {
		init: Joi.object({
			chat_id: Joi.string().min(1).required(),
			limit: Joi.number().min(1)
		}),
		message: Joi.object({
			chat_id: Joi.string().min(1).required(),
			message: Joi.string().min(1).required(),
		}),
		next: Joi.number().required()
	}

	var SocketPlugins = require.main.require('./src/socket.io/plugins');
	SocketPlugins.categoryChatroom = {};
	SocketPlugins.categoryChatroom.ping = function(socket, data, callback) { 
		logging("Got ping:", data)
		socket.emit("event:category-chatroom.pong", data)
		callback(null, data)
	};

	var validateSocket = async function(socket) {
		const { uid } = socket
		logging("Got init from uid:" + uid)
		if (!await User.exists(uid)) throw new Error(`${uid} is not a user!`)
	}

	SocketPlugins.categoryChatroom.init = async function(socket, data) {
		await validateSocket(socket)
		schema.init.validate(data)
		const { chat_id, limit = 50 } = data

		socket.emit("event:category-chatroom.pong", {
			message: `Retrieving ${limit} rows of chat history of ${chat_id}`
		})

		const history = await Messaging.getLastMessages(chat_id, limit)
		
		socket.emit("event:category-chatroom.history", {
			chat_id,
			history,
			back_track: true
		})

		return data
	};

	SocketPlugins.categoryChatroom.next = async function(socket, data) {
		await validateSocket(socket)
		schema.init.validate(data)
		const { chat_id, from } = data
		schema.next.validate(from)
		const fetchFrom = +from

		socket.emit("event:category-chatroom.pong", {
			message: `Retrieving a chats from row ${fetchFrom} of chat history of ${chat_id}`
		})

		const history = await Messaging.getMessages(chat_id, from)
		
		socket.emit("event:category-chatroom.history", {
			chat_id,
			history,
			back_track: false
		})

		return data
	};

	SocketPlugins.categoryChatroom.message = async function(socket, data) {
		await validateSocket(socket)
		schema.message.validate(data)
		const { chat_id, message, ack_id } = data
		const user = await User.getUserFields(socket.uid, ['uid', 'username', 'picture', 'status', 'lastonline', 'groupTitle']);
		const isAdmin = await User.isAdministrator(socket.uid)
		const isGlobalMod = await User.isGlobalModerator(socket.uid)
		logging("Got message of:", {
			chat_id, message
		})
		const status = await Messaging.sendMessage(chat_id, {
			...user,
			isAdmin, isGlobalMod
		}, message, socket.ip)
		socket.emit("event:category-chatroom.ack", {
			at: status.data.at,
			ack_id
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
    logging("Invoked router init")
		router.use("/category-chatroom", express.static('assets'))
		callback();
	};

	LB.initScript = function({ res }, callback) {
    logging("Invoked initScript, data:", data)
		callback(null, data);
	};

	LB.defineWidget = function(data, callback) {
    logging("Requested plugin widget, widget body: " + widget)
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
