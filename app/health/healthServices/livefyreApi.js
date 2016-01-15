"use strict";

const _ = require('lodash');
const request = require('request');
const env = require('../../../env');
const consoleLogger = require('../../utils/consoleLogger');

const healthCheckModel = {
	name: 'Livefyre API',
	ok: false,
	technicalSummary: "Livefyre API is used to determine if a collection exists, if not then the creation will be limited to authenticated users only.",
	severity: 2,
	businessImpact: "New collections could not be created. Collections that exist and are cached will work fine.",
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
		var url = env.livefyre.api.collectionExistsUrl;
		url = url.replace(/\{networkName\}/g, env.livefyre.network.name);
		url = url.replace(/\{articleIdBase64\}/g, new Buffer('e78d07ca-680f-11e5-a57f-21b88f7d973f').toString('base64'));
		url = url.replace(/\{siteId\}/g, env.livefyre.defaultSiteId);

		request.get(url, function (err, response) {
			if (err || response.statusCode >= 500 || !response.body) {
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
		consoleLogger.error('health', 'livefyreApi', 'Exception', e);
		currentHealth.ok = false;
		currentHealth.checkOutput = 'Exception';
	}
};
