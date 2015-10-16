"use strict";

const needle = require('needle');
const _ = require('lodash');
const env = require('../../env');


exports.getUserData = function (userId, callback) {
	var url = env.emailService.url;
	url = url.replace(/\{userId\}/g, userId);

	needle.get(url, {
		username: env.emailService.auth.user,
		password: env.emailService.auth.pass
	}, function (err, response) {
		if (err || response.statusCode !== 200 || !response.body) {
			callback(err || new Error("User not found."));
			return;
		}

		if (response.body) {
			callback(null, _.pick(response.body, ['email', 'firstName', 'lastName']));
		} else {
			callback(new Error("No eRights ID found."));
		}
	});
};
