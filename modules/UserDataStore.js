"use strict";

var db = require('../services/db');
var consoleLogger = require('../helpers/consoleLogger');
var mongoSanitize = require('mongo-sanitize');
var EventEmitter = require('events');
var sanitizer = require('sanitizer');
var eRightsToUuid = require('../services/eRightsToUuid');
var async = require('async');

var UserDataStore = function (userId) {
	var storedData = null;
	var self = this;
	var uuid = null;
	var storeEvents = new EventEmitter();


	var fetchingStoreInProgress = false;
	function getStoredData (callback) {
		if (typeof callback !== 'function') {
			throw new Error("ArticleDataCache.getStoredData: callback not provided");
		}

		if (storedData) {
			consoleLogger.log(userId, 'cached data retrieved from memory');
			callback(null, storedData);
			return;
		}

		storeEvents.once('cacheDataFetched', function (err, data) {
			callback(err, data);
		});


		var done = function (err, data) {
			fetchingStoreInProgress = false;
			storeEvents.emit('cacheDataFetched', err, data);
		};

		if (!fetchingStoreInProgress) {
			fetchingStoreInProgress = true;

			db.getConnection(function (errConn, connection) {
				if (errConn) {
					consoleLogger.log(userId, 'error retrieving the cache');
					consoleLogger.debug(userId, errConn);

					done(errConn);
					return;
				}

				connection.collection('users').find({
					_id: mongoSanitize(userId)
				}).toArray(function (errDb, data) {
					if (errDb) {
						consoleLogger.log(userId, 'cache retrieval failed');
						consoleLogger.debug(userId, errDb);
						done(errDb);
						return;
					}

					if (data && data.length) {
						storedData = data[0];
						consoleLogger.log(userId, 'cached data retrieved');
						consoleLogger.debug(userId, storedData);

						done(null, storedData);
					} else {
						// find by lfUserId
						connection.collection('users').find({
							lfUserId: mongoSanitize(userId)
						}).toArray(function (errDbLfId, dataByLfId) {
							if (errDbLfId) {
								consoleLogger.log(userId, 'cache retrieval failed');
								consoleLogger.debug(userId, errDbLfId);
								done(errDbLfId);
								return;
							}

							if (dataByLfId) {
								done(null, dataByLfId);
							} else {
								consoleLogger.log(userId, 'no cached data found');
								done(null, null);
							}
						});
					}
				});
			});
		}
	}


	function upsertStoredData (field, data, callback) {
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
				}, function (err) {
					if (err) {
						if (typeof callback === 'function') {
							callback(err);
						}
						return;
					}

					if (typeof callback === 'function') {
						callback();
					}
				});
			});
		} catch (e) {
			console.error(userId, 'Exception, upsertStoredData', e);
			return;
		}
	}


	function getUuidOfUserId (callback) {
		if (uuid) {
			consoleLogger.log(userId, 'getUuidOfUserId', 'return from the memory');
			callback(null, uuid);
			return;
		}

		getStoredData(function (errCache, userData) {
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
		upsertStoredData('lfUserId', lfUserId);
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

				getStoredData(function (errCache, storedData) {
					if (errCache) {
						// fetch
						consoleLogger.log(userId, 'getLivefyrePreferredUserId', 'error retrieving cache');
						consoleLogger.debug(userId, errCache);
						fetchLivefyrePreferredUserId(callback);
						return;
					}

					if (storedData && storedData.lfUserId) {
						consoleLogger.log(userId, 'getLivefyrePreferredUserId', 'data loaded from the cache');
						callback(null, storedData.lfUserId);
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



	this.getPseudonym = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("UserDataCache.getPseudonym: callback not provided");
		}

		try {
			getUuidOfUserId(function (errUuid) {
				if (errUuid) {
					callback(errUuid);
					return;
				}

				getStoredData(function (errCache, storedData) {
					if (errCache) {
						// fetch
						consoleLogger.log(userId, 'getPseudonym', 'error retrieving pseudonym');
						consoleLogger.debug(userId, errCache);
						callback(errCache);
						return;
					}

					if (storedData && storedData.pseudonym) {
						var sanitizedPseudonym = sanitizer.escape(storedData.pseudonym);

						consoleLogger.log(userId, 'getPseudonym', 'data loaded from the cache');
						callback(null, sanitizedPseudonym);
					} else {
						consoleLogger.log(userId, 'getPseudonym', 'user has no pseudonym');
						callback(null, null);
					}
				});
			});
		} catch (e) {
			console.error(userId, 'Exception, getPseudonym', e);
			callback(e);
		}
	};

	this.setPseudonym = function (pseudonym, callback) {
		if (typeof callback !== 'function') {
			throw new Error("UserDataCache.setPseudonym: callback not provided");
		}

		var sanitizedPseudonym = sanitizer.escape(pseudonym);
		if (!pseudonym || !sanitizedPseudonym) {
			callback(new Error("Pseudonym is blank."));
		}

		try {
			getUuidOfUserId(function (errUuid) {
				if (errUuid) {
					callback(errUuid);
					return;
				}

				getStoredData(function (errCache, storedData) {
					if (errCache) {
						// fetch
						consoleLogger.log(userId, 'setPseudonym', 'error with the storage');
						consoleLogger.debug(userId, errCache);
						callback(errCache);
						return;
					}

					upsertStoredData('pseudonym', pseudonym, function (errUpsert) {
						if (errUpsert) {
							callback(errUpsert);
							return;
						}

						consoleLogger.log(userId, 'setPseudonym', 'set pseudonym ok');
						callback();
					});
				});
			});
		} catch (e) {
			console.error(userId, 'Exception, setPseudonym', e);
			callback(e);
		}
	};



	this.getEmailPreferences = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("UserDataCache.getEmailPreferences: callback not provided");
		}

		try {
			getUuidOfUserId(function (errUuid) {
				if (errUuid) {
					callback(errUuid);
					return;
				}

				getStoredData(function (errCache, storedData) {
					if (errCache) {
						// fetch
						consoleLogger.log(userId, 'getEmailPreferences', 'error retrieving email preferences');
						consoleLogger.debug(userId, errCache);
						callback(errCache);
						return;
					}

					if (storedData && storedData.emailPreferences) {
						consoleLogger.log(userId, 'getEmailPreferences', 'data loaded from the cache');
						callback(null, storedData.emailPreferences);
					} else {
						consoleLogger.log(userId, 'getEmailPreferences', 'user has no email preference');
						callback(null, null);
					}
				});
			});
		} catch (e) {
			console.error(userId, 'Exception, getEmailPreferences', e);
			callback(e);
		}
	};

	this.setEmailPreferences = function (emailPreferences, callback) {
		if (typeof callback !== 'function') {
			throw new Error("UserDataCache.setEmailPreferences: callback not provided");
		}

		var validValues = ['never', 'immediately', 'hourly'];

		if (emailPreferences.comments) {
			if (validValues.indexOf(emailPreferences.comments) === -1) {
				consoleLogger.log(userId, 'setEmailPreferences', '"comments" value not valid');
				callback(new Error("Email preference values are not valid."));
				return;
			}
		} else {
			delete emailPreferences.comments;
		}

		if (emailPreferences.likes) {
			if (validValues.indexOf(emailPreferences.likes) === -1) {
				consoleLogger.log(userId, 'setEmailPreferences', '"likes" value not valid');
				callback(new Error("Email preference values are not valid."));
				return;
			}
		} else {
			delete emailPreferences.likes;
		}

		if (emailPreferences.replies) {
			if (validValues.indexOf(emailPreferences.replies) === -1) {
				consoleLogger.log(userId, 'setEmailPreferences', '"replies" value not valid');
				callback(new Error("Email preference values are not valid."));
				return;
			}
		} else {
			delete emailPreferences.replies;
		}

		if (emailPreferences.hasOwnProperty('autoFollow') && emailPreferences.autoFollow !== null) {
			if (typeof emailPreferences.autoFollow !== 'boolean') {
				consoleLogger.log(userId, 'setEmailPreferences', '"autoFollow" value not valid');
				callback(new Error("Email preference values are not valid."));
				return;
			}
		} else {
			delete emailPreferences.autoFollow;
		}

		try {
			getUuidOfUserId(function (errUuid) {
				if (errUuid) {
					callback(errUuid);
					return;
				}

				getStoredData(function (errCache, storedData) {
					if (errCache) {
						// fetch
						consoleLogger.log(userId, 'setEmailPreferences', 'error with the storage');
						consoleLogger.debug(userId, errCache);

						callback(errCache);
						return;
					}


					var upserts = {};
					var getUpsertFunction = function (key) {
						return function (callback) {
							upsertStoredData('emailPreferences.' + key, emailPreferences[key], function (errUpsert) {
								if (errUpsert) {
									callback(errUpsert);
									return;
								}

								callback();
							});
						};
					};
					for (let key in emailPreferences) {
						if (emailPreferences.hasOwnProperty(key)) {
							upserts[key] = getUpsertFunction(key);
						}
					}

					async.parallel(upserts, function (errUpserts, results) {
						if (errUpserts) {
							callback(errUpserts);
							return;
						}

						callback();
					});

				});
			});
		} catch (e) {
			console.error(userId, 'Exception, setEmailPreferences', e);
			callback(e);
		}
	};
};
module.exports = UserDataCache;
