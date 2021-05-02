define('admin/plugins/category-chatroom', ['settings'], function(Settings) {
	'use strict';
	/* globals $, app, socket, require */

	var ACP = {};

	ACP.init = function() {
		Settings.load('category-chatroom', $('.category-chatroom-settings'));

		$('#save').on('click', function() {
			Settings.save('category-chatroom', $('.category-chatroom-settings'), function() {
				app.alert({
					type: 'success',
					alert_id: 'category-chatroom-saved',
					title: 'Settings Saved',
					message: 'Please reload your NodeBB to apply these settings',
					clickfn: function() {
						socket.emit('admin.reload');
					}
				});
			});


		});
	};

	return ACP;
});