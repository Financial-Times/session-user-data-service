"use strict";

var db = require('../../services/db');
var livefyreService = require('../../services/livefyre');
var livefyrePreferredUserId = require('./livefyrePreferredUserId');
var sessionAndUuid = require('./sessionAndUuid');
var _ = require('lodash');


var livefyreAuthTokenCachePrefix = 'livefyre-auth-token-by-user-id-';
var generateLivefyreAuthToken = function (config, callback) {
	livefyrePreferredUserId.get(config.userId, function (errLfUserId, lfUserId) {
		if (errLfUserId) {
			callback(errLfUserId);
			return;
		}

		config.userId = lfUserId;

		livefyreService.generateAuthToken(config, callback);
	});
};
var updateLivefyreAuthTokenCache = function (userId, data) {
	try {
		db.getConnection(function (err, connection) {
			if (err) {
				return;
			}

			data.expireAt = new Date(data.expires);

			connection.collection('users').update({
				_id: livefyreAuthTokenCachePrefix + userId
			},
			data,
			{
				upsert: true
			});
		});
	} catch (e) {
		console.log('Exception, updateLivefyreAuthTokenCache', e);

		return;
	}
};
exports.get = function (config, callback) {
	try {
		var userUuid = config.userId;

		db.getConnection(function (errConn, connection) {
			if (errConn) {
				generateLivefyreAuthToken(config, callback);
				return;
			}

			connection.collection('users').find({
				_id: livefyreAuthTokenCachePrefix + userUuid
			}).toArray(function (errDb, dbEntries) {
				if (errDb) {
					console.log(config.articleId, 'cache is down, load it from the services');

					generateLivefyreAuthToken(config, callback);
					return;
				}

				if (dbEntries && dbEntries.length) {
					var record = dbEntries[0];

					callback(null, _.omit(record, ['_id', 'expireAt', 'deleteAt']));
				} else {
					generateLivefyreAuthToken(config, function (errToken, data) {
						if (errToken) {
							callback(errToken);
							return;
						}

						callback(null, data);

						updateLivefyreAuthTokenCache(userUuid, data);
					});
				}
			});
		});
	} catch (e) {
		callback(e);
	}
};




var livefyreAuthTokenCachePrefixBySession = 'livefyre-auth-token-by-session-id-';
var generateLivefyreAuthTokenBySession = function (config, callback) {
	sessionAndUuid.validateAndGetUserUuid(config.sessionId, function (errSess, data) {
		if (errSess) {
			callback(errSess);
			return;
		}

		if (data.valid) {
			var configForToken = {
				userId: data.uuid,
				displayName: 'test'
			};
			if (config.expires) {
				configForToken.expires = config.expires;
			}

			exports.get(configForToken, function (errLfAuthToken, authToken) {
				if (errLfAuthToken) {
					callback(errLfAuthToken);
					return;
				}

				callback(null, {
					token: authToken.token,
					expires: authToken.expires
				});
			});
		} else {
			callback(null, null);
		}
	});
};
var updateLivefyreAuthTokenCacheBySession = function (sessionId, data) {
	try {
		db.getConnection(function (err, connection) {
			if (err) {
				return;
			}

			data.expireAt = new Date(data.expires);

			connection.collection('users').update({
				_id: livefyreAuthTokenCachePrefixBySession + sessionId
			},
			data,
			{
				upsert: true
			});
		});
	} catch (e) {
		console.log('Exception, updateLivefyreAuthTokenCacheBySession', e);

		return;
	}
};

exports.getBySession = function (config, callback) {
	try {
		db.getConnection(function (errConn, connection) {
			if (errConn) {
				generateLivefyreAuthTokenBySession(config, callback);
				return;
			}

			connection.collection('users').find({
				_id: livefyreAuthTokenCachePrefixBySession + config.sessionId
			}).toArray(function (errDb, dbEntries) {
				if (errDb) {
					console.log(config.sessionId, 'cache is down, load it from the services');

					generateLivefyreAuthTokenBySession(config, callback);
					return;
				}

				if (dbEntries && dbEntries.length) {
					var record = dbEntries[0];

					callback(null, _.omit(record, ['_id', 'expireAt', 'deleteAt']));
				} else {
					generateLivefyreAuthTokenBySession(config, function (errToken, data) {
						if (errToken) {
							callback(errToken);
							return;
						}

						callback(null, data);

						updateLivefyreAuthTokenCacheBySession(config.sessionId, data);
					});
				}
			});
		});
	} catch (e) {
		callback(e);
	}
};
