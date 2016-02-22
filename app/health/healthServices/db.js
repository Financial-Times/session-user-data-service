"use strict";

const _ = require('lodash');
const db = require('../../services/db');
const env = require('../../../env');
const consoleLogger = require('../../utils/consoleLogger');

const healthCheckModel = {
	id: 'mongodb',
	name: 'Mongo DB connection',
	ok: false,
	technicalSummary: "MongoDB is used to store information about the users, cache for article data and session data, and legacy site mapping for Livefyre",
	severity: 1,
	businessImpact: "Comments is down completely.",
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
		db.getConnection(env.mongo.uri, function (errConn, connection) {
			if (errConn) {
				currentHealth.ok = false;
				currentHealth.checkOutput = "Connection is down. See the logs of the application on heroku.";
				callCallback(null, currentHealth);
				return;
			}

			connection.collection('legacy_site_mapping').find({
				_id: '6c3a02c2-606b-11e5-9846-de406ccb37f2'
			}, function (errQuery) {
				if (errQuery) {
					currentHealth.ok = false;
					currentHealth.checkOutput = "Error while making a query. See the logs of the application on heroku.";
					callCallback(null, currentHealth);
					return;
				}

				currentHealth.ok = true;
				callCallback(null, _.omit(currentHealth, ['checkOutput']));
			});
		});

		// timeout after 15 seconds
		setTimeout(function () {
			currentHealth.ok = false;
			currentHealth.checkOutput = 'timeout';
			callCallback(null, currentHealth);
			return;
		}, 10000);
	} catch (e) {
		consoleLogger.error('health', 'db', 'Exception', e);
		currentHealth.ok = false;
		currentHealth.checkOutput = 'Exception';
	}
};
