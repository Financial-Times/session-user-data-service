"use strict";

const request = require('request');
const _ = require('lodash');
const env = require('../../env');
const consoleLogger = require('../utils/consoleLogger');
const Timer = require('../utils/Timer');

const endTimer = function (timer) {
	let elapsedTime = timer.getElapsedTime();
	if (elapsedTime > 5000) {
		consoleLogger.warn('userSessionApi.getSessionData: service high response time', elapsedTime + 'ms');
	} else {
		consoleLogger.info('userSessionApi.getSessionData: service response time', elapsedTime + 'ms');
	}
};


exports.getSessionData = function (sessionId, callback) {
	if (typeof callback !== 'function') {
		throw new Error("userSessionApi.getSessionData: callback not provided");
	}

	var options = {
		headers: {
			'FT_Api_Key': env.sessionApi.key
		}
	};

	var url = env.sessionApi.url;
	url = url.replace(/\{sessionId\}/g, sessionId);

	let timer = new Timer();

	request.get(url, options, function (err, response) {
		endTimer(timer);

		if (err || !response || response.statusCode < 200 || response.statusCode >= 400 || !response.body) {
			if (err || !response || response.statusCode !== 404) {
				consoleLogger.warn(sessionId, 'sessionAPI error', err || new Error(response ? response.statusCode : 'No response'));
			}

			callback({
				error: err,
				statusCode: response ? response.statusCode : null
			});
			return;
		}

		var data = JSON.parse(response.body);

		if (data) {
			var responseBody = _.pick(data, ['uuid', 'creationTime', 'rememberMe']);
			callback(null, responseBody);
		} else {
			callback({
				statusCode: 503,
				error: new Error("Unexpected response.")
			});
		}
	});
};
