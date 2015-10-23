"use strict";

const needle = require('needle');
const isUuid = require('../utils/isUuid');
const env = require('../../env');

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

	needle.get(byErightsUrl, function (err, response) {
		if (err || response.statusCode !== 200) {
			callback(err || {statusCode: 404, message: "User not found."});
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

	if (isUuid(userId)) {
		var byUuidUrl = env.erightsToUuidService.urls.byUuid;
		byUuidUrl = byUuidUrl.replace(/\{userId\}/g, userId);

		needle.get(byUuidUrl, function (err, response) {
			if (err || response.statusCode !== 200 || !response.body) {
				callback({statusCode: 404, message: "User not found."});
				return;
			}

			if (response.body.user && response.body.user.deprecatedIds && response.body.user.deprecatedIds.erightsId) {
				callback(null, response.body.user.deprecatedIds.erightsId);
			} else {
				callback({statusCode: 404, message: "No eRights ID found."});
			}
		});
	} else {
		callback(null, userId);
	}
};
