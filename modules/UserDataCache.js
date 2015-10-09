"use strict";

var db = require('../services/db');
var consoleLogger = require('./consoleLogger');
var mongoSanitize = require('mongo-sanitize');

var eRightsToUuid = require('../services/eRightsToUuid');

var UserDataCache = function (userId) {
	var cachedData = null;
	var self = this;

	var uuid = null;



	function getCachedData (callback) {
		if (typeof callback !== 'function') {
			throw new Error("ArticleDataCache.getCachedData: callback not provided");
		}

		if (cachedData) {
			consoleLogger.log(userId, 'cached data retrieved from memory');
			callback(null, cachedData);
			return;
		}

		db.getConnection(function (errConn, connection) {
			if (errConn) {
				consoleLogger.log(userId, 'error retrieving the cache');
				consoleLogger.debug(userId, errConn);

				callback(errConn);
				return;
			}

			connection.collection('users').find({
				_id: mongoSanitize(userId)
			}).toArray(function (errDb, data) {
				if (errDb) {
					consoleLogger.log(userId, 'cache retrieval failed');
					consoleLogger.debug(userId, errDb);
					callback(errDb);
					return;
				}

				if (data && data.length) {
					cachedData = data[0];
					consoleLogger.log(userId, 'cached data retrieved');
					consoleLogger.debug(userId, cachedData);

					callback(null, cachedData);
				} else {
					// find by lfUserId
					connection.collection('users').find({
						lfUserId: mongoSanitize(userId)
					}).toArray(function (errDbLfId, dataByLfId) {
						if (errDbLfId) {
							consoleLogger.log(userId, 'cache retrieval failed');
							consoleLogger.debug(userId, errDbLfId);
							callback(errDbLfId);
							return;
						}

						if (dataByLfId) {
							callback(null, dataByLfId);
						} else {
							consoleLogger.log(userId, 'no cached data found');
							callback(null, null);
						}
					});
				}
			});
		});
	}


	function upsertCachedData (field, data) {
		try {
			var setData = {};
			setData[mongoSanitize(field)] = data;

			db.getConnection(function (errConn, connection) {
				if (errConn) {
					consoleLogger.log(userId, 'upsert failed');
					consoleLogger.debug(errConn);
					return;
				}

				consoleLogger.log(userId, 'upsert cache');
				consoleLogger.debug(userId, 'field: ' + field, 'data:', data);

				connection.collection('users').update({
					_id: mongoSanitize(userId)
				}, {
					$set: setData
				}, {
					upsert: true
				});
			});
		} catch (e) {
			console.error(userId, 'Exception, upsertCachedData', e);
			return;
		}
	}


	function getUuidOfUserId (callback) {
		if (uuid) {
			consoleLogger.log(userId, 'getUuidOfUserId', 'return from the memory');
			callback(null, uuid);
			return;
		}

		getCachedData(function (errCache, userData) {
			if (errCache) {
				consoleLogger.log(userId, 'getUuidOfUserId', 'cache down, determine it');
				// cache is not available, determine UUID using the service
				eRightsToUuid.getUuid(userId, function (errUuid, userUuid) {
					if (errUuid) {
						consoleLogger.log(userId, 'getUuidOfUserId', 'error when determining');
						callback(errUuid);
						return;
					}

					if (userUuid) {
						consoleLogger.log(userId, 'getUuidOfUserId', 'determined');
						uuid = userUuid;
						userId = uuid;
						callback(null, uuid);
						return;
					} else {
						callback(new Error("User not found."));
					}
				});

				return;
			}

			if (userData && userData.uuid) {
				consoleLogger.log(userId, 'getUuidOfUserId', 'return from the cache');

				uuid = userData.uuid;
				userId = uuid;

				callback(null, uuid);
			} else {
				// user not cached, determine UUID using the service
				eRightsToUuid.getUuid(userId, function (errUuid, userUuid) {
					if (errUuid) {
						consoleLogger.log(userId, 'getUuidOfUserId', 'error when determining');
						callback(errUuid);
						return;
					}

					if (userUuid) {
						uuid = userUuid;
						userId = uuid;

						consoleLogger.log(userId, 'getUuidOfUserId', 'determined');

						callback(null, uuid);
					} else {
						consoleLogger.log(userId, 'getUuidOfUserId', 'user not found');
						callback(new Error("User not found."));
					}
				});
			}
		});
	}


	var fetchLivefyrePreferredUserId = function (callback) {
		eRightsToUuid.getERightsId(userId, function (errERights, erightsId) {
			if (errERights) {
				callback(errERights);
				return;
			}

			if (erightsId) {
				callback(null, erightsId);
				return;
			} else {
				// eRights does not exist, use UUID for Livefyre as well
				callback(null, uuid);
				return;
			}
		});
	};
	var upsertLivefyrePreferredUserId = function (lfUserId) {
		upsertCachedData('lfUserId', lfUserId);
	};
	this.getLivefyrePreferredUserId = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("UserDataCache.getLivefyrePreferredUserId: callback not provided");
		}

		try {
			getUuidOfUserId(function (errUuid) {
				if (errUuid) {
					callback(errUuid);
					return;
				}

				getCachedData(function (errCache, cachedData) {
					if (errCache) {
						// fetch
						consoleLogger.log(userId, 'getLivefyrePreferredUserId', 'error retrieving cache');
						consoleLogger.debug(userId, errCache);
						fetchLivefyrePreferredUserId(callback);
					}

					if (cachedData && cachedData.lfUserId) {
						consoleLogger.log(userId, 'getLivefyrePreferredUserId', 'data loaded from the cache');
						callback(null, cachedData.lfUserId);
					} else {
						// fetch and save
						consoleLogger.log(userId, 'getLivefyrePreferredUserId', 'not found in cache');
						fetchLivefyrePreferredUserId(function (errFetch, lfUserId) {
							if (errFetch) {
								callback(errFetch);
								return;
							}

							callback(null, lfUserId);

							upsertLivefyrePreferredUserId(lfUserId);
						});
					}
				});
			});
		} catch (e) {
			console.error(userId, 'Exception, getLivefyrePreferredUserId', e);
			callback(e);
		}
	};

	this.getPseudonym = function () {

	};

	this.getEmailPreferences = function () {

	};
};
module.exports = UserDataCache;
