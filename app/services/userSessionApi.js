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

	try {
		var url = env.sessionApi.url;
		url = url.replace(/\{sessionId\}/g, sessionId);

		needle.get(url, options, function (err, response) {
			if (err) {
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
	} catch (e) {
		consoleLogger.error(sessionId, 'Session API validate', 'Error', e);

		callback(e);
	}
};
