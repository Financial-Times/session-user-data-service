"use strict";

const db = require('../services/db');
const consoleLogger = require('../utils/consoleLogger');
const mongoSanitize = require('mongo-sanitize');
const EventEmitter = require('events');
const eRightsToUuid = require('../services/eRightsToUuid');
const async = require('async');
const emailService = require('../services/email');
const crypto = require('../utils/crypto');
const env = require('../../env');

var UserDataStore = function (userId) {
	var storedData = null;
	var self = this;
	var storeEvents = new EventEmitter();

	let toBeRefreshed;



	let uuidCache = null;
	const getUuidOfUserId = function (callback) {
		if (uuidCache) {
			callback(null, uuidCache);
			return;
		}

		eRightsToUuid.getUuid(userId, function (errUuid, userUuid) {
			if (errUuid) {
				callback(errUuid);
				return;
			}

			if (userUuid) {
				uuidCache = userUuid;
				callback(null, userUuid);
			} else {
				callback();
			}
		});
	};

	let eRightsIdCache = null;
	const getERightsIdOfUserId = function (callback) {
		if (eRightsIdCache) {
			callback(null, eRightsIdCache);
			return;
		}

		eRightsToUuid.getERightsId(userId, function (errERights, userERightsId) {
			if (errERights) {
				callback(errERights);
				return;
			}

			if (userERightsId) {
				eRightsIdCache = userERightsId;
				callback(null, userERightsId);
			} else {
				callback();
			}
		});
	};


	var fetchingStoreInProgress = false;
	const getStoredData = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("UserDataStore.getStoredData: callback not provided");
		}

		if (storedData && !toBeRefreshed) {
			consoleLogger.log(userId, 'stored data retrieved from memory');
			callback(null, storedData);
			return;
		}

		storeEvents.once('storedDataFetched', function (err, data) {
			callback(err, data);
		});


		var done = function (err, data) {
			fetchingStoreInProgress = false;
			storeEvents.emit('storedDataFetched', err, data);
		};

		if (!fetchingStoreInProgress) {
			fetchingStoreInProgress = true;

			db.getConnection(env.mongo.uri, function (errConn, connection) {
				if (errConn) {
					consoleLogger.log(userId, 'error retrieving the cache');
					consoleLogger.debug(userId, errConn);

					done(errConn);
					return;
				}

				getUuidOfUserId(function (errUuid, userUuid) {
					if (errUuid) {
						callback(errUuid);
						return;
					}

					if (userUuid) {
						connection.collection('users').find({
							$or: [
								{_id: mongoSanitize(userUuid)},
								{lfUserId: mongoSanitize(userUuid)}
							]
						}).toArray(function (errDb, data) {
							if (errDb) {
								consoleLogger.log(userId, 'cache retrieval failed');
								consoleLogger.debug(userId, errDb);
								done(errDb);
								return;
							}

							if (data && data.length) {
								toBeRefreshed = false;
								storedData = data[0];

								if (!storedData.uuid) {
									upsertStoredData('uuid', userUuid);
								}

								consoleLogger.log(userId, 'cached data retrieved');
								consoleLogger.debug(userId, storedData);

								done(null, storedData);
							} else {
								getERightsIdOfUserId(function (errERights, userERightsId) {
									if (errERights) {
										callback(errERights);
										return;
									}

									if (userERightsId) {
										// find by lfUserId
										connection.collection('users').find({
											lfUserId: mongoSanitize(userERightsId)
										}).toArray(function (errDbLfId, dataByLfId) {
											if (errDbLfId) {
												consoleLogger.log(userId, 'cache retrieval failed');
												consoleLogger.debug(userId, errDbLfId);

												done(errDbLfId);
												return;
											}

											if (dataByLfId && dataByLfId.length) {
												toBeRefreshed = false;
												storedData = dataByLfId[0];

												upsertStoredData('_id', userUuid, {
													lfUserId: userERightsId
												});

												if (!storedData.uuid) {
													upsertStoredData('uuid', userUuid, {
														lfUserId: userERightsId
													});
												}

												done(null, storedData);
											} else {
												consoleLogger.log(userId, 'no cached data found, create an entry with the UUID.');

												upsertStoredData('uuid', userUuid);
												done(null, {
													uuid: userUuid
												});
											}
										});
									} else {
										callback(null, null);
									}
								});
							}
						});
					} else {
						callback(new Error("User not found"));
						return;
					}
				});
			});
		}
	};


	let atLeastOneUpdateMade = false;
	const upsertStoredData = function (field, data, customQuery, callback) {
		if (typeof customQuery === 'function' && !callback) {
			callback = customQuery;
			customQuery = false;
		}

		callback = callback || function () {};

		var setData = {};
		setData[mongoSanitize(field)] = data;

		db.getConnection(env.mongo.uri, function (errConn, connection) {
			if (errConn) {
				consoleLogger.log(userId, 'upsert failed');
				consoleLogger.debug(errConn);
				return;
			}

			consoleLogger.log(userId, 'upsert cache');
			consoleLogger.debug(userId, 'field: ' + field, 'data:', data);


			const upsert = function (query) {
				connection.collection('users').update(query, {
					$set: setData
				}, {
					upsert: true
				}, function (err, result) {
					if (err) {
						if (typeof callback === 'function') {
							callback(err);
						}
						return;
					}

					// reset storage cache
					toBeRefreshed = true;

					if (!atLeastOneUpdateMade && result !== 1) {
						atLeastOneUpdateMade = true;

						// insert, should set an expire
						consoleLogger.log(userId, 'upsert', 'new entry, set uuid if it was not set');

						if (!setData.hasOwnProperty('uuid')) {
							getUuidOfUserId(function (errUuid, userUuid) {
								if (errUuid) {
									callback(errUuid);
									return;
								}

								if (userUuid) {
									connection.collection('users').update(query, {
										$set: {
											'uuid': userUuid
										}
									});

									callback();
								} else {
									callback(new Error("User not found"));
									return;
								}
							});
						}
					}
				});
			};


			if (customQuery) {
				upsert(customQuery);
			} else {
				getUuidOfUserId(function (errUuid, userUuid) {
					if (errUuid) {
						callback(errUuid);
						return;
					}

					if (userUuid) {
						upsert({
							_id: mongoSanitize(userUuid)
						});
					} else {
						callback(new Error("User not found"));
						return;
					}
				});
			}
		});
	};


	const fetchLivefyrePreferredUserId = function (callback) {
		getERightsIdOfUserId(function (errERights, userERightsId) {
			if (errERights) {
				callback(errERights);
				return;
			}

			if (userERightsId) {
				callback(null, userERightsId);
				return;
			} else {
				// eRights does not exist, use UUID for Livefyre as well
				getUuidOfUserId(function (errUuid, userUuid) {
					if (errERights) {
						callback(errERights);
						return;
					}

					if (userUuid) {
						callback(null, userUuid);
						return;
					} else {
						callback(new Error("User does not exist."));
					}
				});
			}
		});
	};
	const upsertLivefyrePreferredUserId = function (lfUserId) {
		upsertStoredData('lfUserId', lfUserId);
	};
	this.getLivefyrePreferredUserId = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("UserDataStore.getLivefyrePreferredUserId: callback not provided");
		}

		if (!userId) {
			callback(new Error("User ID is not provided."));
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
	};



	this.getPseudonym = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("UserDataStore.getPseudonym: callback not provided");
		}

		if (!userId) {
			callback(new Error("User ID is not provided."));
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
				var pseudonym = crypto.decrypt(storedData.pseudonym);

				consoleLogger.log(userId, 'getPseudonym', 'data loaded from the cache');
				callback(null, pseudonym);
			} else {
				consoleLogger.log(userId, 'getPseudonym', 'user has no pseudonym');
				callback(null, null);
			}
		});
	};

	this.setPseudonym = function (pseudonym, callback) {
		if (typeof callback !== 'function') {
			throw new Error("UserDataStore.setPseudonym: callback not provided");
		}

		if (!userId) {
			callback(new Error("User ID is not provided."));
			return;
		}

		if (!pseudonym) {
			callback(new Error("Pseudonym is blank."));
		}

		getStoredData(function (errCache, storedData) {
			if (errCache) {
				// fetch
				consoleLogger.log(userId, 'setPseudonym', 'error with the storage');
				consoleLogger.debug(userId, errCache);
				callback(errCache);
				return;
			}

			upsertStoredData('pseudonym', crypto.encrypt(pseudonym), function (errUpsert) {
				if (errUpsert) {
					callback(errUpsert);
					return;
				}

				consoleLogger.log(userId, 'setPseudonym', 'set pseudonym ok');
				callback();
			});
		});
	};

	this.emptyPseudonym = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("UserDataStore.emptyPseudonym: callback not provided");
		}

		if (!userId) {
			callback(new Error("User ID is not provided."));
			return;
		}

		getStoredData(function (errCache, storedData) {
			if (errCache) {
				// fetch
				consoleLogger.log(userId, 'emptyPseudonym', 'error with the storage');
				consoleLogger.debug(userId, errCache);
				callback(errCache);
				return;
			}

			upsertStoredData('pseudonym', null, function (errUpsert) {
				if (errUpsert) {
					callback(errUpsert);
					return;
				}

				consoleLogger.log(userId, 'emptyPseudonym', 'empty pseudonym ok');
				callback();
			});
		});
	};



	this.getEmailPreferences = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("UserDataStore.getEmailPreferences: callback not provided");
		}

		if (!userId) {
			callback(new Error("User ID is not provided."));
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
	};

	this.setEmailPreferences = function (emailPreferences, callback) {
		if (typeof callback !== 'function') {
			throw new Error("UserDataStore.setEmailPreferences: callback not provided");
		}

		if (!userId) {
			callback(new Error("User ID is not provided."));
			return;
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
	};


	var fetchBasicUserInfo = function (callback) {
		getUuidOfUserId(function (errUuid, userUuid) {
			if (errUuid) {
				callback(errUuid);
				return;
			}

			emailService.getUserData(userUuid, function (err, data) {
				if (err) {
					callback(err);
					return;
				}

				callback(null, data);
			});
		});
	};
	this.getUserData = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("UserDataStore.getUserData: callback not provided");
		}

		if (!userId) {
			callback(new Error("User ID is not provided."));
			return;
		}

		let returnData = {};

		getUuidOfUserId(function (errUuid, userUuid) {
			if (errUuid) {
				callback(errUuid);
				return;
			}

			returnData.uuid = userUuid;

			self.getLivefyrePreferredUserId(function (errLfId, lfUserId) {
				if (errLfId) {
					callback(errLfId);
					return;
				}

				returnData.lfUserId = lfUserId;

				getStoredData(function (errCache, storedData) {
					if (errCache) {
						// fetch
						consoleLogger.log(userId, 'getUserData', 'error retrieving user data');
						consoleLogger.debug(userId, errCache);
						callback(errCache);
						return;
					}


					if (storedData) {
						if (storedData.pseudonym) {
							returnData.pseudonym = crypto.decrypt(storedData.pseudonym);
						}

						if (storedData.emailPreferences) {
							returnData.emailPreferences = storedData.emailPreferences;
						}

						if (storedData.email && storedData.firstName && storedData.lastName) {
							returnData.email = crypto.decrypt(storedData.email);
							returnData.firstName = crypto.decrypt(storedData.firstName);
							returnData.lastName = crypto.decrypt(storedData.lastName);

							callback(null, returnData);
							return;
						} else {
							fetchBasicUserInfo(function (errFetch, basicUserInfo) {
								if (errFetch) {
									callback(errFetch);
									return;
								}

								if (basicUserInfo) {
									if (basicUserInfo.hasOwnProperty('email')) {
										returnData.email = basicUserInfo.email;
									}
									if (basicUserInfo.firstName) {
										returnData.firstName = basicUserInfo.firstName;
									}
									if (basicUserInfo.lastName) {
										returnData.lastName = basicUserInfo.lastName;
									}

									self.updateBasicUserData(basicUserInfo);
								}

								callback(null, returnData);
							});
						}
					} else {
						fetchBasicUserInfo(function (errFetch, basicUserInfo) {
							if (errFetch) {
								callback(errFetch);
								return;
							}

							if (basicUserInfo) {
								if (basicUserInfo.email) {
									returnData.email = basicUserInfo.email;
								}
								if (basicUserInfo.firstName) {
									returnData.firstName = basicUserInfo.firstName;
								}
								if (basicUserInfo.lastName) {
									returnData.lastName = basicUserInfo.lastName;
								}

								self.updateBasicUserData(basicUserInfo);
							}

							callback(null, returnData);
						});
					}
				});
			});
		});
	};


	this.updateBasicUserData = function (userData, callback) {
		if (typeof callback !== 'function') {
			throw new Error("UserDataStore.updateBasicUserData: callback not provided");
		}

		async.parallel({
			email: function (callbackAsync) {
				if (userData.hasOwnProperty('email')) {
					upsertStoredData('email', crypto.encrypt(userData.email), function (err) {
						if (err) {
							callbackAsync(err);
							return;
						}

						callbackAsync();
					});
				} else {
					callbackAsync();
				}
			},
			firstName: function (callbackAsync) {
				if (userData.hasOwnProperty('firstName')) {
					upsertStoredData('firstName', crypto.encrypt(userData.firstName), function (err) {
						if (err) {
							callbackAsync(err);
							return;
						}

						callbackAsync();
					});
				} else {
					callbackAsync();
				}
			},
			lastName: function (callbackAsync) {
				if (userData.hasOwnProperty('lastName')) {
					upsertStoredData('lastName', crypto.encrypt(userData.lastName), function (err) {
						if (err) {
							callbackAsync(err);
							return;
						}

						callbackAsync();
					});
				} else {
					callbackAsync();
				}
			}
		}, function (errUpsert) {
			if (errUpsert) {
				callback(errUpsert);
				return;
			}

			callback();
		});
	};
};
module.exports = UserDataStore;
