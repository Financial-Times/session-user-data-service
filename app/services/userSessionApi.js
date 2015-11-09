"use strict";

const needle = require('needle');
const _ = require('lodash');
const env = require('../../env');
const consoleLogger = require('../utils/consoleLogger');


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

	needle.get(url, options, function (err, response) {
		if (err) {
			consoleLogger.warn(sessionId, 'sessionAPI error', err);

			callback(err);
			return;
		}

		if (response.statusCode !== 200) {
			callback(null, null);
			return;
		}

		var responseBody = _.pick(response.body, ['uuid', 'creationTime', 'rememberMe']);

		callback(null, responseBody);
	});
};
