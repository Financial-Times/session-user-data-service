"use strict";

var db = require('../../services/db');
var erightsToUuid = require('../../services/erightsToUuid');


var livefyrePreferredUserIdCachePrefix = 'livefyre-user-id-';
var fetchLivefyrePreferredUserId = function (userId, callback) {
	erightsToUuid.getERightsId(userId, function (errERights, erightsId) {
		if (errERights) {
			callback(errERights);
			return;
		}

		if (erightsId) {
			callback(null, erightsId);
			return;
		} else {
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
		}
	});
};
var updateLivefyrePreferredUserIdCache = function (userId, livefyreUserId) {
	try {
		db.getConnection(function (err, connection) {
			if (err) {
				return;
			}

			connection.collection('users').update({
				_id: livefyrePreferredUserIdCachePrefix + userId
			}, {
				userId: livefyreUserId
			}, {
				upsert: true
			});
		});
	} catch (e) {
		console.log('Exception, updateLivefyrePreferredUserIdCache', e);

		return;
	}
};
exports.get = function (userId, callback) {
	try {
		db.getConnection(function (errConn, connection) {
			if (errConn) {
				console.log(userId, 'cache is down, load it from the services');

				fetchLivefyrePreferredUserId(userId, callback);
				return;
			}

			connection.collection('users').find({
				_id: livefyrePreferredUserIdCachePrefix + userId
			}).toArray(function (errDb, dbEntries) {
				if (errDb) {
					console.log(userId, 'cache is down, load it from the services');

					fetchLivefyrePreferredUserId(userId, callback);
					return;
				}

				if (dbEntries && dbEntries.length) {
					var record = dbEntries[0];

					callback(null, record.userId);
					return;
				} else {
					fetchLivefyrePreferredUserId(userId, function (errFetch, livefyreUserId) {
						if (errFetch) {
							console.log('err livefyrePreferredUserId', errFetch);
							callback(errFetch);
							return;
						}

						callback(null, livefyreUserId);

						updateLivefyrePreferredUserIdCache(userId, livefyreUserId);
					});
				}
			});
		});
	} catch (e) {
		callback(e);
	}
};
