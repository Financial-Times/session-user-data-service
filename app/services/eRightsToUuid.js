"use strict";

const request = require('request');
const isUuid = require('../utils/isUuid');
const env = require('../../env');
const consoleLogger = require('../utils/consoleLogger');
const Timer = require('../utils/Timer');

const endTimer = function (timer, serviceName, userId) {
	let elapsedTime = timer.getElapsedTime();
	if (elapsedTime > 5000) {
		consoleLogger.warn(userId, 'eRightsToUuid.'+ serviceName +': service high response time', elapsedTime + 'ms');
	} else {
		consoleLogger.info(userId, 'eRightsToUuid.'+ serviceName +': service response time', elapsedTime + 'ms');
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

	request.get(byErightsUrl, function (err, response) {
		endTimer(timer, 'getUuid', userId);

		if (err || response.statusCode < 200 || response.statusCode >= 400 || !response.body) {
			if (response.statusCode !== 404) {
				consoleLogger.warn(userId, 'eRightsToUuid service error', err || new Error(response.statusCode));
			}

			callback({
				err: err,
				statusCode: response.statusCode
			});
			return;
		}

		var data = JSON.parse(response.body);

		if (data && data.user && data.user.id) {
			callback(null, data.user.id);
		} else {
			callback({
				statusCode: 503,
				error: new Error("Unexpected response.")
			});
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

		request.get(byUuidUrl, function (err, response) {
			endTimer(timer, 'getERightsId', userId);

			if (err || response.statusCode < 200 || response.statusCode >= 400 || !response.body) {
				if (response.statusCode !== 404) {
					consoleLogger.warn(userId, 'eRightsToUuid service error', err || new Error(response.statusCode));
				}

				callback({
					err: err,
					statusCode: response.statusCode
				});
				return;
			}

			var data = JSON.parse(response.body);

			if (data && data.user && data.user.deprecatedIds && data.user.deprecatedIds.erightsId) {
				callback(null, data.user.deprecatedIds.erightsId);
			} else {
				callback({
					statusCode: 503,
					error: new Error("Unexpected response.")
				});
			}
		});
	} else {
		var byErightsUrl = env.erightsToUuidService.urls.byErights;
		byErightsUrl = byErightsUrl.replace(/\{userId\}/g, userId);

		timer = new Timer();

		request.get(byErightsUrl, function (err, response) {
			endTimer(timer, 'getERightsId', userId);

			if (err || response.statusCode < 200 || response.statusCode >= 400 || !response.body) {
				if (response.statusCode !== 404) {
					consoleLogger.warn(userId, 'eRightsToUuid service error', err || new Error(response.statusCode));
				}

				callback({
					err: err,
					statusCode: response.statusCode
				});
				return;
			}

			var data = JSON.parse(response.body);

			if (data && data.user && data.user.deprecatedIds && data.user.deprecatedIds.erightsId) {
				callback(null, data.user.deprecatedIds.erightsId);
			} else {
				callback({
					statusCode: 503,
					error: new Error("Unexpected response.")
				});
			}
		});
	}
};
