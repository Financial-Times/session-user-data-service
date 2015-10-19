"use strict";

const _ = require('lodash');
const email = require('../../services/email');
const env = require('../../../env');
const consoleLogger = require('../../utils/consoleLogger');

const healthCheckModel = {
	name: 'Email service - user profile',
	ok: false,
	technicalSummary: "Reads basic information about the users (email, firstName, lastName) on demand (when Livefyre asks for them).",
	severity: 2,
	businessImpact: "Livefyre will not get all the details it needs to create/update the user's Livefyre profile.",
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
		email.getUserData('3f330864-1c0f-443e-a6b3-cf8a3b536a52', function (err, data) {
			if (err) {
				currentHealth.ok = false;
				currentHealth.checkOutput = 'statusCode: ' + err.statusCode;
				callCallback(null, currentHealth);
				return;
			}

			currentHealth.ok = true;
			callCallback(null, _.pick(currentHealth, ['name', 'ok', 'lastUpdated']));
		});

		// timeout after 15 seconds
		setTimeout(function () {
			currentHealth.ok = false;
			currentHealth.checkOutput = 'timeout';
			callCallback(null, currentHealth);
			return;
		}, 15000);
	} catch (e) {
		consoleLogger.error('health', 'emailService', 'Exception', e);
		currentHealth.ok = false;
		currentHealth.checkOutput = 'Exception';
	}
};
