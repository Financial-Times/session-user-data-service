"use strict";

const _ = require('lodash');
const userSessionApi = require('../../services/userSessionApi');
const env = require('../../../env');
const consoleLogger = require('../../utils/consoleLogger');

const healthCheckModel = {
	id: 'user-session-api',
	name: 'User Session API',
	ok: false,
	technicalSummary: "Verifies if a user is authenticated or not, and gets the user's UUID as well.",
	severity: 1,
	businessImpact: "No user related endpoints will work, new collections could not be created.",
	checkOutput: "",
	panicGuide: "http://"+ env.host +"/troubleshoot",
	lastUpdated: new Date().toISOString()
};

exports.getHealth = function (callback) {
	var callbackCalled = false;
	var callCallback = function (err, data) {
		if (!callbackCalled) {
			callbackCalled = true;

			if (data) {
				data.lastUpdated = new Date().toISOString();
			}
			callback.call(null, err, data);
		}
	};

	var currentHealth = _.clone(healthCheckModel);

	try {
		userSessionApi.getSessionData('3f330864-1c0f-443e-a6b3-cf8a3b536a52', function (err, response) {
			if (err && (err.error || err.statusCode >= 500)) {
				currentHealth.ok = false;
				currentHealth.checkOutput = "";
				callCallback(null, currentHealth);
				return;
			}

			currentHealth.ok = true;
			callCallback(null, _.omit(currentHealth, ['checkOutput']));
		});

		// timeout after 15 seconds
		setTimeout(function () {
			currentHealth.ok = false;
			currentHealth.checkOutput = 'timeout';
			callCallback(null, currentHealth);
			return;
		}, 10000);
	} catch (e) {
		consoleLogger.error('health', 'userSessionApi', 'Exception', e);
		currentHealth.ok = false;
		currentHealth.checkOutput = 'Exception';
	}
};
