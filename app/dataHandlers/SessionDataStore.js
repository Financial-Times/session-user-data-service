"use strict";

const db = require('../services/db');
const userSessionApi = require('../services/userSessionApi');
const livefyreService = require('../services/livefyre');
const consoleLogger = require('../utils/consoleLogger');
const mongoSanitize = require('mongo-sanitize');
const UserDataStore = require('./UserDataStore');
const crypto = require('../utils/crypto');
const async = require('async');
const EventEmitter = require('events');
const env = require('../../env');
const _ = require('lodash');
const Timer = require('../utils/Timer');
const pseudonymSanitizer = require('../utils/pseudonymSanitizer');

var SessionDataStore = function (sessionId) {
	var storedData = null;
	var self = this;
	var atLeastOneUpdateMade = false;
	var userDataStore = null;
	var storeEvents = new EventEmitter();


	let toBeRefreshed;
	var fetchingStoreInProgress = false;
	function getStoredData (callback) {
		if (typeof callback !== 'function') {
			throw new Error("SessionDataStore.getStoredData: callback not provided");
		}

		if (storedData && !toBeRefreshed) {
			consoleLogger.log(sessionId, 'cached data retrieved from memory');
			callback(null, storedData);
			return;
		}

		storeEvents.once('storedDataFetched', function (err, data) {
			callback(err, data);
		});


		if (!fetchingStoreInProgress) {
			fetchingStoreInProgress = true;

			let timer = new Timer();

			var done = function (err, data) {
				let elapsedTime = timer.getElapsedTime();
				if (elapsedTime > 5000) {
					consoleLogger.warn('SessionDataStore.getStoredData: service high response time', elapsedTime + 'ms');
				} else {
					consoleLogger.info('SessionDataStore.getStoredData: service response time', elapsedTime + 'ms');
				}

				fetchingStoreInProgress = false;
				storeEvents.emit('storedDataFetched', err, data);
			};

			db.getConnection(env.mongo.uri, function (errConn, connection) {
				if (errConn) {
					consoleLogger.warn(sessionId, 'error retrieving the cache', errConn);

					done(errConn);
					return;
				}

				connection.collection('sessions').find({
					_id: mongoSanitize(sessionId)
				}).maxTimeMS(env.timeouts.queries).toArray(function (errDb, data) {
					if (errDb) {
						consoleLogger.warn(sessionId, 'cache retrieval failed', errDb);

						done(errDb);
						return;
					}

					if (data && data.length) {
						storedData = data[0];
						toBeRefreshed = false;

						if (storedData.authMetadata && storedData.authMetadata.pseudonym) {
							storedData.authMetadata.pseudonym = crypto.decrypt(storedData.authMetadata.pseudonym);
						}

						consoleLogger.log(sessionId, 'cached data retrieved');
						consoleLogger.debug(sessionId, storedData);

						done(null, storedData);
					} else {
						consoleLogger.log(sessionId, 'no cached data found');
						done(null, null);
					}
				});
			});
		}
	}

	function upsertStoredData (field, data, expireAt) {
		var setData = {};
		setData[mongoSanitize(field)] = data;

		db.getConnection(env.mongo.uri, function (errConn, connection) {
			if (errConn) {
				consoleLogger.warn(sessionId, 'upsert failed', errConn);
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
					consoleLogger.warn(sessionId, 'upsert failed', errUpsert);
					return;
				}

				// reset storage cache
				toBeRefreshed = true;

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
	}

	function deleteStoredData (callback) {
		db.getConnection(env.mongo.uri, function (errConn, connection) {
			if (errConn) {
				consoleLogger.warn(sessionId, 'delete failed', errConn);
				callback(errConn);
				return;
			}

			consoleLogger.log(sessionId, 'delete cache');

			connection.collection('sessions').remove({
				_id: mongoSanitize(sessionId)
			}, function (errDelete) {
				if (errDelete) {
					consoleLogger.warn(sessionId, 'delete failed', errDelete);

					callback(errDelete);
					return;
				}

				storedData = null;
				callback();
			});
		});
	}




	this.getUserDataStore = function (callback) {
		if (userDataStore) {
			callback(null, userDataStore);
		}

		self.getSessionData(function (errSess, sessionData) {
			if (errSess) {
				callback(errSess);
				return;
			}

			if (sessionData) {
				userDataStore = new UserDataStore(sessionData.uuid);

				callback(null, userDataStore);
			} else {
				callback(null, null);
			}
		});
	};

	function getExpirationDate (creationTime, remembered) {
		creationTime = new Date(creationTime);

		var expirationDate;
		if (remembered) {
			// default aprox. 6 months from creation time
			expirationDate = new Date(creationTime.getTime() + 1000 * 60 * 60 * env.sessionValidityHours.remembered);

			// at least 4h from now (in case the session is about at the end of its life)
			if (expirationDate <= new Date(new Date().getTime() + 1000 * 60 * 60 * 4)) {
				// 4 hours
				expirationDate = new Date(new Date().getTime() + 1000 * 60 * 60 * 4);
			}
		} else {
			// default 24 hours from creation time
			expirationDate = new Date(creationTime.getTime() + 1000 * 60 * 60 * env.sessionValidityHours.notRemembered);

			// at least 4h from now (in case the session is about at the end of its life)
			if (expirationDate <= new Date(new Date().getTime() + 1000 * 60 * 60 * 4)) {
				// 4 hours
				expirationDate = new Date(new Date().getTime() + 1000 * 60 * 60 * 4);
			}
		}

		consoleLogger.debug(sessionId, 'getExpirationDate', 'creationTime:', creationTime, 'remembered:', remembered, 'expirationDate:', expirationDate);
		return expirationDate;
	}



	var fetchSessionData = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("SessionDataStore.fetchSessionData: callback not provided");
		}

		consoleLogger.log(sessionId, 'fetch session data');
		userSessionApi.getSessionData(sessionId, function (err, data) {
			if (err) {
				if ((err && err.statusCode && err.statusCode >= 500) || err.error) {
					callback(err);
					return;
				} else {
					data = null;
				}
			}

			consoleLogger.log(sessionId, 'session data fetched successfully');
			consoleLogger.debug(sessionId, 'session data:', data);
			callback(null, data);
		});
	};
	var upsertSessionData = function (sessionData) {
		consoleLogger.log(sessionId, 'upsert session data');
		upsertStoredData('sessionData', sessionData, getExpirationDate(sessionData.creationTime, sessionData.rememberMe));
	};
	this.getSessionData = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("SessionDataStore.getSessionData: callback not provided");
		}

		if (!sessionId) {
			callback(new Error("Session ID is not provided."));
			return;
		}

		getStoredData(function (errCache, storedData) {
			if (errCache) {
				// fetch
				consoleLogger.log(sessionId, 'getSessionData', 'error retrieving cache');
				fetchSessionData(callback);
				return;
			}

			if (storedData && storedData.sessionData) {
				consoleLogger.log(sessionId, 'getSessionData', 'data loaded from the cache');
				callback(null, storedData.sessionData);
			} else {
				// fetch and save
				consoleLogger.log(sessionId, 'getSessionData', 'not found in cache');
				fetchSessionData(function (errFetch, sessionData) {
					if (errFetch) {
						callback(errFetch);
						return;
					}

					callback(null, sessionData);

					if (sessionData) {
						upsertSessionData(sessionData);
					}
				});
			}
		});
	};


	var generateAuthMetadata = function (callback) {
		self.getSessionData(function (errSess, sessionData) {
			if (errSess) {
				callback(errSess);
				return;
			}

			if (sessionData) {
				self.getUserDataStore(function (errUserCache, userDataStore) {
					if (errUserCache) {
						callback(errUserCache);
						return;
					}

					userDataStore.getLivefyrePreferredUserId(function (errLfUserId, lfUserId) {
						if (errLfUserId) {
							callback(errLfUserId);
							return;
						}

						userDataStore.getPseudonym(function (errPseudonym, pseudonym) {
							if (errPseudonym) {
								callback(errPseudonym);
								return;
							}

							if (pseudonym) {
								let pseudonymSanitized = pseudonymSanitizer.sanitize(pseudonym);

								var configForToken = {
									userId: lfUserId,
									displayName: pseudonymSanitized,
									expiresAt: getExpirationDate(sessionData.creationTime, sessionData.rememberMe)
								};

								async.parallel({
									authToken: function (callbackAsync) {
										livefyreService.generateAuthToken(configForToken, function (errLfAuthToken, authToken) {
											if (errLfAuthToken) {
												callbackAsync(errLfAuthToken);
												return;
											}

											livefyreService.getModerationRights(authToken.token, function (errModRights, modRights) {
												if (errModRights) {
													callbackAsync(errModRights);
													return;
												}

												callbackAsync(null, {
													token: authToken.token,
													expires: authToken.expires,
													pseudonym: pseudonymSanitized,
													moderationRights: modRights
												});
											});
										});
									},
									emailPreferences: function (callbackAsync) {
										userDataStore.getEmailPreferences(function (errEmail, data) {
											if (errEmail) {
												callbackAsync(errEmail);
												return;
											}

											callbackAsync(null, data);
										});
									}
								}, function (errAsync, results) {
									if (errAsync) {
										callback(errAsync);
										return;
									}

									var returnData = results.authToken;
									returnData.emailPreferences = results.emailPreferences;

									callback(null, returnData);
								});
							} else {
								callback(null, false);
							}
						});
					});
				});
			} else {
				callback(null, null);
			}
		});
	};
	var upsertAuthMetadata = function (authMetadata) {
		consoleLogger.log(sessionId, 'upsert livefyre auth token');

		upsertStoredData('authMetadata', _.extend({}, authMetadata, {pseudonym: crypto.encrypt(authMetadata.pseudonym)}), authMetadata.expires);
	};
	this.getAuthMetadata = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("SessionDataStore.getAuthMetadata: callback not provided");
		}

		if (!sessionId) {
			callback(new Error("Session ID is not provided."));
			return;
		}

		getStoredData(function (errCache, storedData) {
			if (errCache) {
				// fetch
				consoleLogger.log(sessionId, 'getAuthMetadata', 'error retrieving cache');

				generateAuthMetadata(callback);
				return;
			}

			if (storedData && storedData.authMetadata) {
				consoleLogger.log(sessionId, 'getAuthMetadata', 'data loaded from the cache');
				callback(null, storedData.authMetadata);
			} else {
				// fetch and save
				consoleLogger.log(sessionId, 'getAuthMetadata', 'not found in cache');
				generateAuthMetadata(function (errFetch, authMetadata) {
					if (errFetch) {
						callback(errFetch);
						return;
					}

					callback(null, authMetadata);

					if (authMetadata) {
						upsertAuthMetadata(authMetadata);
					}
				});
			}
		});
	};



	this.invalidate = function (callback) {
		deleteStoredData(callback || function () {});
	};
};
module.exports = SessionDataStore;
