"use strict";

var db = require('../services/db');
var userSessionApi = require('../services/userSessionApi');
var livefyreService = require('../services/livefyre');
var consoleLogger = require('./consoleLogger');
var mongoSanitize = require('mongo-sanitize');
var UserDataCache = require('./UserDataCache');

var SessionDataCache = function (sessionId) {
	var cachedData = null;
	var self = this;
	var atLeastOneUpdateMade = false;
	var userDataCache = null;



	function getCachedData (callback) {
		if (typeof callback !== 'function') {
			throw new Error("ArticleDataCache.getCachedData: callback not provided");
		}

		if (cachedData) {
			consoleLogger.log(sessionId, 'cached data retrieved from memory');
			callback(null, cachedData);
			return;
		}

		db.getConnection(function (errConn, connection) {
			if (errConn) {
				consoleLogger.log(sessionId, 'error retrieving the cache');
				consoleLogger.debug(sessionId, errConn);

				callback(errConn);
				return;
			}

			connection.collection('sessions').find({
				_id: mongoSanitize(sessionId)
			}).toArray(function (errDb, data) {
				if (errDb) {
					consoleLogger.log(sessionId, 'cache retrieval failed');
					consoleLogger.debug(sessionId, errDb);
					callback(errDb);
					return;
				}

				if (data && data.length) {
					cachedData = data[0];
					consoleLogger.log(sessionId, 'cached data retrieved');
					consoleLogger.debug(sessionId, cachedData);

					callback(null, cachedData);
				} else {
					consoleLogger.log(sessionId, 'no cached data found');
					callback(null, null);
				}
			});
		});
	}

	function upsertCachedData (field, data, expireAt) {
		try {
			var setData = {};
			setData[mongoSanitize(field)] = data;

			db.getConnection(function (errConn, connection) {
				if (errConn) {
					consoleLogger.log(sessionId, 'upsert failed');
					consoleLogger.debug(errConn);
					return;
				}

				consoleLogger.log(sessionId, 'upsert cache');
				consoleLogger.debug(sessionId, 'field: ' + field, 'data:', data);

				connection.collection('sessions').update({
					_id: mongoSanitize(sessionId)
				}, {
					$set: setData
				}, {
					upsert: true
				}, function (errUpsert, result) {
					if (errUpsert) {
						consoleLogger.log(sessionId, 'upsert failed');
						consoleLogger.debug(sessionId, errUpsert);
						return;
					}

					if (!atLeastOneUpdateMade && result !== 1) {
						atLeastOneUpdateMade = true;

						// insert, should set an expire
						consoleLogger.log(sessionId, 'upsert', 'new entry, set expiration to', new Date(expireAt));

						connection.collection('sessions').update({
							_id: mongoSanitize(sessionId)
						}, {
							$set: {
								'expireAt': new Date(expireAt)
							}
						});
					}
				});
			});
		} catch (e) {
			console.error(sessionId, 'Exception, upsertCachedData', e);
			return;
		}
	}


	function getUserDataCache (callback) {
		if (userDataCache) {
			callback(null, userDataCache);
		}

		self.getSessionData(function (errSess, sessionData) {
			if (errSess) {
				callback(errSess);
				return;
			}

			if (sessionData) {
				userDataCache = new UserDataCache(sessionData.uuid);
				callback(null, userDataCache);
			} else {
				callback(null, null);
			}
		});
	}

	function getExpirationDate (creationTime, remembered) {
		creationTime = new Date(creationTime);

		var expirationDate;
		if (remembered) {
			// aprox. 6 months from creation time
			expirationDate = new Date(creationTime.getTime() + 1000 * 60 * 60 * 24 * 30 * 6);
		} else {
			// 24 hours from creation time
			expirationDate = new Date(creationTime.getTime() + 1000 * 60 * 60 * 24);
		}

		consoleLogger.log(sessionId, 'getExpirationDate', 'creationTime:', creationTime, 'remembered:', remembered, 'expirationDate:', expirationDate);
		return expirationDate;
	}



	var fetchSessionData = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("SessionDataCache.fetchSessionData: callback not provided");
		}

		consoleLogger.log(sessionId, 'fetch session data');
		userSessionApi.getSessionData(sessionId, callback);
	};
	var upsertSessionData = function (sessionData) {
		consoleLogger.log(sessionId, 'upsert session data');
		upsertCachedData('sessionData', sessionData, getExpirationDate(sessionData.creationTime, sessionData.rememberMe));
	};
	this.getSessionData = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("SessionDataCache.getSessionData: callback not provided");
		}

		try {
			getCachedData(function (errCache, cachedData) {
				if (errCache) {
					// fetch
					consoleLogger.log(sessionId, 'getSessionData', 'error retrieving cache');
					consoleLogger.debug(sessionId, errCache);
					fetchSessionData(callback);
				}

				if (cachedData && cachedData.sessionData) {
					consoleLogger.log(sessionId, 'getSessionData', 'data loaded from the cache');
					callback(null, cachedData.sessionData);
				} else {
					// fetch and save
					consoleLogger.log(sessionId, 'getSessionData', 'not found in cache');
					fetchSessionData(function (errFetch, sessionData) {
						if (errFetch) {
							callback(errFetch);
							return;
						}

						callback(null, sessionData);

						upsertSessionData(sessionData);
					});
				}
			});
		} catch (e) {
			console.error(sessionId, 'Exception, getSessionData', e);
			callback(e);
		}
	};


	var generateLivefyreAuthToken = function (callback) {
		self.getSessionData(function (errSess, sessionData) {
			if (errSess) {
				callback(errSess);
				return;
			}

			if (sessionData) {
				getUserDataCache(function (errUserCache, userDataCache) {
					if (errUserCache) {
						callback(errUserCache);
						return;
					}

					userDataCache.getLivefyrePreferredUserId(function (errLfUserId, lfUserId) {
						if (errLfUserId) {
							callback(errLfUserId);
							return;
						}

						var configForToken = {
							userId: lfUserId,
							displayName: 'test',
							expiresAt: getExpirationDate(sessionData.creationTime, sessionData.rememberMe)
						};

						livefyreService.generateAuthToken(configForToken, function (errLfAuthToken, authToken) {
							if (errLfAuthToken) {
								callback(errLfAuthToken);
								return;
							}

							callback(null, {
								token: authToken.token,
								expires: authToken.expires
							});
						});
					});
				});
			} else {
				callback(null, null);
			}
		});
	};
	var upsertLivefyreAuthToken = function (livefyreData) {
		consoleLogger.log(sessionId, 'upsert livefyre auth token');
		upsertCachedData('livefyreData', livefyreData, livefyreData.expires);
	};
	this.getLivefyreAuthToken = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("SessionDataCache.getLivefyreAuthToken: callback not provided");
		}

		try {
			getCachedData(function (errCache, cachedData) {
				if (errCache) {
					// fetch
					consoleLogger.log(sessionId, 'getLivefyreAuthToken', 'error retrieving cache');
					consoleLogger.debug(sessionId, errCache);
					generateLivefyreAuthToken(callback);
				}

				if (cachedData && cachedData.livefyreData) {
					consoleLogger.log(sessionId, 'getLivefyreAuthToken', 'data loaded from the cache');
					callback(null, cachedData.livefyreData);
				} else {
					// fetch and save
					consoleLogger.log(sessionId, 'getLivefyreAuthToken', 'not found in cache');
					generateLivefyreAuthToken(function (errFetch, livefyreData) {
						if (errFetch) {
							callback(errFetch);
							return;
						}

						callback(null, livefyreData);

						if (livefyreData) {
							upsertLivefyreAuthToken(livefyreData);
						}
					});
				}
			});
		} catch (e) {
			console.error(sessionId, 'Exception, getLivefyreAuthToken', e);
			callback(e);
		}
	};
};
module.exports = SessionDataCache;
