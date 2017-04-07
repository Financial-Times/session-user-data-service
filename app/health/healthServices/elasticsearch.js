"use strict";

const _ = require('lodash');
const nEsClient = require('@financial-times/n-es-client');
const env = require('../../../env');
const consoleLogger = require('../../utils/consoleLogger');

const healthCheckModel = {
	id: 'next-elastic-search',
	name: 'Next Elastic Search',
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

	nEsClient.get('109842b8-71f4-11e5-9b9e-690fdae72044')
		.then(article => {
			currentHealth.ok = true;
			callCallback(null, _.omit(currentHealth, ['checkOutput']));
		})
		.catch(err => {
			currentHealth.ok = false;
			currentHealth.checkOutput = 'statusCode: ' + err.statusCode;
			callCallback(null, currentHealth);
			return;
		});

	// timeout after 15 seconds
	setTimeout(function () {
		currentHealth.ok = false;
		currentHealth.checkOutput = 'timeout';
		callCallback(null, currentHealth);
		return;
	}, 10000);
};
