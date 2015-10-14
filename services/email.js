"use strict";

var needle = require('needle');
var _ = require('lodash');
var env = require('../env');


exports.getUserData = function (userId, callback) {
	var url = env.emailService.url;
	url = url.replace(/\{userId\}/g, userId);

	needle.get(url, {
		username: env.emailService.auth.user,
		password: env.emailService.auth.pass
	}, function (err, response) {
		if (err || response.statusCode !== 200 || !response.body) {
			console.log('userId', userId, 'User not found');

			callback(err || new Error("User not found."));
			return;
		}

		if (response.body) {
			console.log('userId', userId, 'user found');
			callback(null, _.pick(response.body, ['email', 'firstName', 'lastName']));
		} else {
			console.log('userId', userId, 'no user found');
			callback(new Error("No eRights ID found."));
		}
	});
};
