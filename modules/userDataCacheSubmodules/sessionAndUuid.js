"use strict";

var db = require('../../services/db');
var userSessionApi = require('../../services/userSessionApi');
var _ = require('lodash');

var sessionCachePrefix = 'user-session-';
var updateSessionCache = function (sessionId, data) {
	try {
		db.getConnection(function (errConn, connection) {
			if (errConn) {
				return;
			}

			if (data.rememberMe === true) {
				data.deleteAt = new Date(new Date().getTime() + 31 * 24 * 1000 * 60 * 60); // a month
			} else {
				data.deleteAt = new Date(new Date().getTime() + 24 * 1000 * 60 * 60); // a day
			}

			connection.collection('users').update({
				_id: sessionCachePrefix + sessionId
			},
			data,
			{
				upsert: true
			});
		});
	} catch (e) {
		console.log('Exception, updateSessionCache', e);

		return;
	}
};
exports.validateAndGetUserUuid = function (sessionId, callback) {
	try {
		db.getConnection(function (errConn, connection) {
			if (errConn) {
				callback(errConn);
				return;
			}

			connection.collection('users').find({
				_id: sessionCachePrefix + sessionId
			}).toArray(function (errDb, dbEntries) {
				if (errDb) {
					console.log(sessionId, 'cache is down, load it from the services');

					userSessionApi.validateAndGetUserUuid(sessionId, callback);
					return;
				}

				if (dbEntries && dbEntries.length) {
					var record = dbEntries[0];

					callback(null, _.omit(record, ['_id', 'expireAt', 'deleteAt']));
				} else {
					userSessionApi.validateAndGetUserUuid(sessionId, function (errFetch, data) {
						if (errFetch) {
							callback(errFetch);
							return;
						}

						callback(null, data);

						if (data.valid) {
							updateSessionCache(sessionId, data);
						}
					});
				}
			});
		});
	} catch (e) {
		callback(e);
	}
};
