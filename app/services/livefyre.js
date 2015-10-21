"use strict";

var livefyre = require('livefyre');
var legacySiteMapping = require('./legacySiteMapping');
var needle = require('needle');
var consoleLogger = require('../utils/consoleLogger');
var env = require('../../env');

var network = livefyre.getNetwork(env.livefyre.network.name + '@fyre.co', env.livefyre.network.key);

var systemTokenCache = {
	token: null,
	expiresAt: null
};
var getSystemToken = function () {
	if (systemTokenCache.token && systemTokenCache.expiresAt < new Date()) {
		return systemTokenCache.token;
	}

	systemTokenCache.token = network.buildLivefyreToken();
	systemTokenCache.expiresAt = new Date(new Date().getTime() + 1000 * 60 * 60 * 23.5);

	return systemTokenCache.token;
};


exports.getCollectionDetails = function (config, callback) {
	if (typeof callback !== 'function') {
		throw new Error("livefyre.getCollectionDetails: callback not provided");
	}

	if (!config.title || !config.articleId || !config.url) {
		callback(new Error("articleId, title and url should be provided."));
		return;
	}

	try {
		var stream_type = config.stream_type || 'livecomments';

		legacySiteMapping.getSiteId(config.articleId, function (err, siteId) {
			if (err) {
				callback(err);
				return;
			}

			if (env.livefyre.siteKeys[siteId]) {
				var site = network.getSite(siteId, env.livefyre.siteKeys[siteId]);

				var collection = site.buildCollection(stream_type, config.title, config.articleId, config.url);
				if (config.tags) {
					collection.data.tags = config.tags.join(',').replace(/ /g, '_');
				}

				var collectionMeta = collection.buildCollectionMetaToken();
				var checksum = collection.buildChecksum();

				if (collectionMeta) {
					callback(null, {
						siteId: siteId,
						articleId: config.articleId,
						collectionMeta: collectionMeta,
						checksum: checksum
					});
				}
			} else {
				callback(new Error("SiteID is not configured properly."));
			}
		});
	} catch (e) {
		consoleLogger.error(config.articleId, 'Livefyre getCollectionDetails', 'Error', e);

		callback(e);
	}
};

exports.getBootstrapUrl = function (articleId, callback) {
	if (typeof callback !== 'function') {
		throw new Error("livefyre.getBootstrapUrl: callback not provided");
	}

	legacySiteMapping.getSiteId(articleId, function (err, siteId) {
		if (err) {
			callback(err);
			return;
		}

		callback(null, 'http://bootstrap.'+ env.livefyre.network.name +'.fyre.co/bs3/'+ env.livefyre.network.name +'.fyre.co/'+ siteId +'/'+ new Buffer(articleId).toString('base64') +'/bootstrap.html');
	});
};

exports.collectionExists = function (articleId, callback) {
	if (typeof callback !== 'function') {
		throw new Error("livefyre.collectionExists: callback not provided");
	}

	var url = env.livefyre.api.collectionExistsUrl;

	url = url.replace(/\{networkName\}/g, env.livefyre.network.name);
	url = url.replace(/\{articleIdBase64\}/g, new Buffer(articleId).toString('base64'));

	legacySiteMapping.getSiteId(articleId, function (err, siteId) {
		if (err) {
			callback(err);
			return;
		}

		url = url.replace(/\{siteId\}/g, siteId);

		needle.get(url, function (err, response) {
			if (err || response.statusCode !== 200) {
				callback(null, false);
				return;
			}

			callback(null, true);
		});
	});
};

exports.generateAuthToken = function (config, callback) {
	if (typeof callback !== 'function') {
		throw new Error("livefyre.generateAuthToken: callback not provided");
	}

	if (!config.userId || !config.displayName) {
		callback(new Error('"userId" and "displayName" should be provided.'));
	}

	var expires = 60 * 60 * 24; // default is 24 hours
	if (config.expires) {
		expires = config.expires;
	}
	if (config.expiresAt) {
		expires = (new Date(config.expiresAt).getTime() - new Date().getTime()) / 1000;
	}

	var authToken = network.buildUserAuthToken(config.userId + '', config.displayName, expires);

	callback(null, {
		token: authToken,
		expires: new Date(new Date().getTime() + expires * 1000).getTime()
	});
};

exports.validateToken = function (token) {
	try {
		return network.validateLivefyreToken(token);
	} catch (e) {
		consoleLogger.warn('Exception, livefyre.validateToken', e);
		return false;
	}
};

exports.callPingToPull = function (userId, callback) {
	if (typeof callback !== 'function') {
		throw new Error("livefyre.callPingToPull: callback not provided");
	}

	var url = env.livefyre.api.pingToPullUrl;
	url.replace(/\{networkName\}/g, env.livefyre.network.name)
		.replace(/\{user_id\}/g, userId)
		.replace(/\{token\}/g, getSystemToken());

	needle.post(url, function (err, response) {
		if (err) {
			callback(err);
			return;
		}

		if (response.statusCode !== 200) {
			callback(new Error(response.statusCode));
		} else {
			callback();
		}
	});
};
