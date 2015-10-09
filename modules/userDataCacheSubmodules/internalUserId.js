"use strict";

var db = require('../../services/db');
var erightsToUuid = require('../../services/erightsToUuid');


var internalUserIdCachePrefix = 'internal-user-id-';
var fetchInternalUserId = function (userId, callback) {
	erightsToUuid.getUuid(userId, function (errUuid, uuid) {
		if (errUuid) {
			callback(errUuid);
			return;
		}

		if (uuid) {
			callback(null, uuid);
			return;
		} else {
			callback(new Error("Not a valid user ID."));
		}
	});
};
var updateInternalUserIdCache = function (userId, internalUserId) {
	try {
		db.getConnection(function (errConn, connection) {
			if (errConn) {
				return;
			}

			connection.collection('users').update({
				_id: internalUserIdCachePrefix + userId
			}, {
				userId: internalUserId
			}, {
				upsert: true
			});
		});
	} catch (e) {
		console.log('Exception, updateInternalUserIdCache', e);

		return;
	}
};
exports.getInternalUserId = function (userId, callback) {
	try {
		db.getConnection(function (errConn, connection) {
			if (errConn) {
				console.log(userId, 'cache is down, load it from the services');

				fetchInternalUserId(userId, callback);
				return;
			}

			connection.collection('users').find({
				_id: internalUserIdCachePrefix + userId
			}).toArray(function (errDb, dbEntries) {
				if (errDb) {
					console.log(userId, 'cache is down, load it from the services');

					fetchInternalUserId(userId, callback);
					return;
				}

				if (dbEntries && dbEntries.length) {
					var record = dbEntries[0];

					callback(null, record.userId);
				} else {
					fetchInternalUserId(userId, function (errFetch, livefyreUserId) {
						if (errFetch) {
							callback(errFetch);
							return;
						}

						callback(null, livefyreUserId);

						updateInternalUserIdCache(userId, livefyreUserId);
					});
				}
			});
		});
	} catch (e) {
		callback(e);
	}
};
