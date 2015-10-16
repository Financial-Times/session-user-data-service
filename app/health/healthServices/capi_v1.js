"use strict";

const _ = require('lodash');
const capi_v1 = require('../../services/capi_v1');
const env = require('../../../env');
const consoleLogger = require('../../utils/consoleLogger');

const healthCheckModel = {
	name: 'Content API v1',
	ok: false,
	technicalSummary: "Reads tags of articles (sections, authors, brand)",
	severity: 3,
	businessImpact: "Livefyre collections will be created without tags.",
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
		capi_v1.getArticleData('109842b8-71f4-11e5-9b9e-690fdae72044', function (err, data) {
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
		consoleLogger.error('health', 'capi_v1', 'Exception', e);
		callCallback(null, 'Exception');
	}
};
