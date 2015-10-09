"use strict";

var needle = require('needle');
var _ = require('lodash');


exports.getSessionData = function (session, callback) {
	if (typeof callback !== 'function') {
		throw new Error("userSessionApi.getSessionData: callback not provided");
	}

	var options = {
		headers: {
			'FT_Api_Key': process.env.SESSION_API_KEY
		}
	};

	try {
		needle.get('https://sessionapi.memb.ft.com/membership/sessions/' + session, options, function (err, response) {
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
		console.log('Session API validate', 'Error', e);

		callback(e);
	}
};
