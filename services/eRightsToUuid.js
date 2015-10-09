"use strict";

var needle = require('needle');
var isUuid = require('../helpers/isUuid');

var byUuidUrl = 'https://depr-user-id-svc.memb.ft.com/deprecated-user-ids/v1?userId=';
var byErightsUrl = 'https://depr-user-id-svc.memb.ft.com/deprecated-user-ids/v1?=erightsId';

exports.getUuid = function (userId, callback) {
	if (typeof callback !== 'function') {
		throw new Error("eRightsToUuid.getUuid: callback not provided");
	}

	if (isUuid(userId)) {
		callback(null, userId);
		return;
	}

	needle.get(byErightsUrl + userId, function (err, response) {
		if (err || response.statusCode !== 200 || !response.body) {
			callback(err || new Error("User not found."));
		}

		callback(null, response.body.user.id);
	});
};

exports.getERightsId = function (userId, callback) {
	if (typeof callback !== 'function') {
		throw new Error("eRightsToUuid.getERightsId: callback not provided");
	}

	if (isUuid(userId)) {
		console.log('userId', userId, 'is uuid');

		console.log('api url', byUuidUrl + userId);

		needle.get(byUuidUrl + userId, function (err, response) {
			if (err || response.statusCode !== 200 || !response.body) {
				console.log('userId', userId, 'User not found');

				callback(err || new Error("User not found."));
				return;
			}

			if (response.body.user && response.body.user.deprecatedIds && response.body.user.deprecatedIds.erightsId) {
				console.log('userId', userId, 'erightsId found', response.body.user.deprecatedIds.erightsId);
				callback(null, response.body.user.deprecatedIds.erightsId);
			} else {
				console.log('userId', userId, 'no erightsID found');
				callback(new Error("No eRights ID found."));
			}
		});
	} else {
		callback(null, userId);
	}
};
