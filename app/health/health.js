"use strict";

const config = require('./config.json');
const _ = require('lodash');
const async = require('async');
const consoleLogger = require('../utils/consoleLogger');

const healthServices = [];
config.checks.forEach(function (serviceName) {
	healthServices.push(require('./healthServices/' + serviceName));
});

var inErrorState = false;

const healthStatus = _.omit(config, 'checks');

var check = function () {
	var checksToRun = [];
	healthServices.forEach(function (healthService) {
		checksToRun.push(healthService.getHealth);
	});

	async.parallel(checksToRun, function (err, results) {
		if (err) {
			consoleLogger.error('health', 'global error', err);
			inErrorState = true;
			return;
		}

		inErrorState = false;
		healthStatus.checks = results;
	});

	setTimeout(check, 10000);
};
check();


exports.getChecks = function () {
	if (inErrorState) {
		return false;
	}

	return healthStatus;
};
