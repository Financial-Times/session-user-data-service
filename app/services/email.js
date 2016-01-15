"use strict";

const request = require('request');
const _ = require('lodash');
const env = require('../../env');
const consoleLogger = require('../utils/consoleLogger');
const Timer = require('../utils/Timer');

const endTimer = function (timer, userId) {
	let elapsedTime = timer.getElapsedTime();
	if (elapsedTime > 5000) {
		consoleLogger.warn(userId, 'email.getUserData: service high response time', elapsedTime + 'ms');
	} else {
		consoleLogger.info(userId, 'email.getUserData: service response time', elapsedTime + 'ms');
	}
};


exports.getUserData = function (userId, callback) {
	var url = env.emailService.url;
	url = url.replace(/\{userId\}/g, userId);

	let timer = new Timer();

	request.get(url, {
		username: env.emailService.auth.user,
		password: env.emailService.auth.pass
	}, function (err, response) {
		endTimer(timer, userId);

		if (err || !response|| response.statusCode < 200 || response.statusCode >= 400 || !response.body) {
			if (err || !response || response.statusCode !== 404) {
				consoleLogger.warn(userId, 'email service error', new Error(response ? response.statusCode : 'No response'));
			}

			callback({
				error: err,
				statusCode: response.statusCode
			});
			return;
		}

		var data = JSON.parse(response.body);
		if (data) {
			callback(null, _.pick(data, ['email', 'firstName', 'lastName']));
		} else {
			callback({
				error: new Error("User not found."),
				statusCode: 404
			});
		}
	});
};
