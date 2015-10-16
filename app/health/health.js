"use strict";

const config = require('./config.json');
const _ = require('lodash');
const async = require('async');

const healthServices = [];
config.checks.forEach(function (serviceName) {
	healthServices.push(require('./healthServices/' + serviceName));
});


const healthStatus = _.omit(config, 'checks');

var check = function () {
	var checksToRun = [];
	healthServices.forEach(function (healthService) {
		checksToRun.push(healthService.getHealth);
	});

	async.parallel(checksToRun, function (err, results) {
		if (err) {
			throw err;
		}

		healthStatus.checks = results;
	});

	setTimeout(check, 10000);
};
check();


exports.getChecks = function () {
	return healthStatus;
};
