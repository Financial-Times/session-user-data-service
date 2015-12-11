"use strict";

const needle = require('needle');
const isUuid = require('../utils/isUuid');
const env = require('../../env');
const consoleLogger = require('../utils/consoleLogger');
const Timer = require('../utils/Timer');

const endTimer = function (timer, serviceName, userId) {
	let elapsedTime = timer.getElapsedTime();
	if (elapsedTime > 5000) {
		consoleLogger.warn(userId, 'eRightsToUuid.'+ serviceName +': high response time', elapsedTime + 'ms');
	} else {
		consoleLogger.info(userId, 'eRightsToUuid.'+ serviceName +': response time', elapsedTime + 'ms');
	}
};

exports.getUuid = function (userId, callback) {
	if (typeof callback !== 'function') {
		throw new Error("eRightsToUuid.getUuid: callback not provided");
	}

	if (isUuid(userId)) {
		callback(null, userId);
		return;
	}

	var byErightsUrl = env.erightsToUuidService.urls.byErights;
	byErightsUrl = byErightsUrl.replace(/\{userId\}/g, userId);

	let timer = new Timer();

	needle.get(byErightsUrl, function (err, response) {
		endTimer(timer, 'getUuid', userId);

		if (err) {
			consoleLogger.warn(userId, 'eRightsToUuid service error', err);

			callback(err);
			return;
		} else if (response.statusCode !== 200 || !response.body) {
			callback();
			return;
		}

		if (response.body.user && response.body.user.id) {
			callback(null, response.body.user.id);
		} else {
			callback({statusCode: 404, message: "User not found."});
		}
	});
};

exports.getERightsId = function (userId, callback) {
	if (typeof callback !== 'function') {
		throw new Error("eRightsToUuid.getERightsId: callback not provided");
	}

	let timer;

	if (isUuid(userId)) {
		var byUuidUrl = env.erightsToUuidService.urls.byUuid;
		byUuidUrl = byUuidUrl.replace(/\{userId\}/g, userId);

		timer = new Timer();

		needle.get(byUuidUrl, function (err, response) {
			endTimer(timer, 'getERightsId', userId);

			if (err) {
				consoleLogger.warn(userId, 'eRightsToUuid service error', err);

				callback(err);
				return;
			} else if (response.statusCode !== 200 || !response.body) {
				callback();
				return;
			}

			if (response.body.user && response.body.user.deprecatedIds && response.body.user.deprecatedIds.erightsId) {
				callback(null, response.body.user.deprecatedIds.erightsId);
			} else {
				callback();
			}
		});
	} else {
		var byErightsUrl = env.erightsToUuidService.urls.byErights;
		byErightsUrl = byErightsUrl.replace(/\{userId\}/g, userId);

		timer = new Timer();

		needle.get(byErightsUrl, function (err, response) {
			endTimer(timer, 'getERightsId', userId);

			if (err) {
				consoleLogger.warn(userId, 'eRightsToUuid service error', err);

				callback(err);
				return;
			} else if (response.statusCode !== 200) {
				callback();
				return;
			}

			if (response.body.user && response.body.user.deprecatedIds && response.body.user.deprecatedIds.erightsId) {
				callback(null, response.body.user.deprecatedIds.erightsId);
			} else {
				callback();
			}
		});
	}
};
