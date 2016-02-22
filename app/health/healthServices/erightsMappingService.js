"use strict";

const _ = require('lodash');
const email = require('../../services/email');
const env = require('../../../env');
const consoleLogger = require('../../utils/consoleLogger');

const healthCheckModel = {
	id: 'erights-mapping',
	name: 'eRights to UUID mapping service',
	ok: false,
	technicalSummary: "Maps eRights IDs (used by Livefyre) to UUIDs, and the other way around.",
	severity: 2,
	businessImpact: "User related endpoints will not work (unless all the data is cached).",
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
		email.getUserData('3f330864-1c0f-443e-a6b3-cf8a3b536a52', function (err, response) {
			if (err && (err.error || err.statusCode >= 500)) {
				currentHealth.ok = false;
				currentHealth.checkOutput = 'statusCode: ' + err.statusCode;
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
		consoleLogger.error('health', 'erightsMappingService', 'Exception', e);
		currentHealth.ok = false;
		currentHealth.checkOutput = 'Exception';
	}
};
