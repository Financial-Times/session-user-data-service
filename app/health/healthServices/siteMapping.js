"use strict";

const _ = require('lodash');
const legacySiteMapping = require('../../services/legacySiteMapping');
const env = require('../../../env');
const consoleLogger = require('../../utils/consoleLogger');

const healthCheckModel = {
	name: 'Legacy livefyre site mapping',
	ok: false,
	technicalSummary: "Articles published before 24th Sept 2015 are mapped to Livefyre sites based on a mapping file. This is stored in MongoDB.",
	severity: 1,
	businessImpact: "No article related functionality will work.",
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
		legacySiteMapping.getSiteId('6c3a02c2-606b-11e5-9846-de406ccb37f2', function (err, data) {
			if (err) {
				currentHealth.ok = false;
				currentHealth.checkOutput = "";
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
		consoleLogger.error('health', 'siteMapping', 'Exception', e);
		callCallback(null, 'Exception');
	}
};
