"use strict";

var livefyre = require('livefyre');
var legacySiteMapping = require('./legacySiteMapping');
const request = require('../utils/request_with_defaults.js');
var consoleLogger = require('../utils/consoleLogger');
var env = require('../../env');
var urlParser = require('url');
const Timer = require('../utils/Timer');
const async = require('async');

const endTimer = function (timer, serviceName, url) {
	let elapsedTime = timer.getElapsedTime();
	if (elapsedTime > 5000) {
		consoleLogger.warn('livefyre.'+ serviceName +': service high response time', elapsedTime + 'ms', url);
	} else {
		consoleLogger.info('livefyre.'+ serviceName +': service response time', elapsedTime + 'ms', url);
	}
};

var network = livefyre.getNetwork(env.livefyre.network.name + '.fyre.co', env.livefyre.network.key);

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

	var parsedUrl = urlParser.parse(config.url);
	if (!parsedUrl || !parsedUrl.host || parsedUrl.host.indexOf('.') === -1) {
		callback(new Error('"url" is not a valid URL.'));
		return;
	}

	var stream_type = config.stream_type || 'livecomments';

	legacySiteMapping.getSiteId(config.articleId, function (err, siteId) {
		if (err) {
			callback(err);
			return;
		}

		if (env.livefyre.siteKeys[siteId]) {
			try {
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
			} catch (e) {
				callback(e);
			}
		} else {
			callback(new Error("SiteID is not configured properly."));
		}
	});
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


		var url = env.livefyre.api.bootstrapUrl;
		url = url.replace(/\{networkName\}/g, env.livefyre.network.name);
		url = url.replace(/\{articleIdBase64\}/g, new Buffer(articleId).toString('base64'));
		url = url.replace(/\{siteId\}/g, siteId);

		callback(null, url);
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

		let timer = new Timer();

		request.get(url, function (err, response) {
			endTimer(timer, 'collectionExists', url);

			if (err || !response || response.statusCode < 200 || response.statusCode >= 400) {
				if (err || !response || response.statusCode !== 404) {
					consoleLogger.warn(articleId, 'livefyre.collectionExists error', err || new Error(response ? response.statusCode : 'No response'));
				}

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
		return;
	}

	var now = new Date();

	var expires = 60 * 60 * 24; // default is 24 hours
	if (config.expires) {
		expires = config.expires;
	}
	if (config.expiresAt) {
		expires = (new Date(config.expiresAt).getTime() - now.getTime()) / 1000;
	}

	var authToken = network.buildUserAuthToken(config.userId + '', config.displayName, expires);

	callback(null, {
		token: authToken,
		expires: new Date(now.getTime() + expires * 1000).getTime()
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
	url = url.replace(/\{networkName\}/g, env.livefyre.network.name)
		.replace(/\{userId\}/g, userId)
		.replace(/\{token\}/g, getSystemToken());

	let timer = new Timer();

	request.post(url, function (err, response) {
		endTimer(timer, 'callPingToPull', url);

		if (err || !response || response.statusCode < 200 || response.statusCode >= 400) {
			if (err || !response || response.statusCode !== 404) {
				consoleLogger.warn(userId, 'livefyre.pingToPull error', err || new Error(response ? response.statusCode : 'No response'));
			}

			callback({
				error: err,
				statusCode: response ? response.statusCode : null
			});
			return;
		}

		callback();
	});
};

exports.getModerationRights = function (token, callback) {
	if (typeof callback !== 'function') {
		throw new Error("livefyre.getModerationRights: callback not provided");
	}

	if (!token) {
		callback({
			statusCode: 400,
			error: new Error("'token' should be provided.")
		});
		return;
	}

	let url = env.livefyre.api.userProfileUrl;
	url = url.replace(/\{networkName\}/g, env.livefyre.network.name);

	let timer = new Timer();

	request.get(url + '?lftoken=' + token, (err, response) => {
		endTimer(timer, 'getModerationRights', url + '?lftoken=' + token);

		if (err || !response || response.statusCode < 200 || response.statusCode >= 400 || !response.body) {
			if (err || !response || response.statusCode !== 404) {
				consoleLogger.warn('livefyre.getModerationRights error', err || new Error(response ? response.statusCode : 'No response'));
			}

			callback({
				error: err,
				statusCode: response ? response.statusCode : null
			});
			return;
		}

		var data = JSON.parse(response.body);

		if (data && data.data && data.data.modScopes) {
			callback(null, data.data.modScopes);
		} else {
			callback({
				statusCode: 503,
				error: new Error("Unexpected response.")
			});
		}
	});
};

exports.getCommentCount = function (articleId, callback) {
	if (typeof callback !== 'function') {
		throw new Error("livefyre.getCommentCount: callback not provided");
	}

	if (!articleId) {
		callback(new Error("articleId should be provided."));
		return;
	}

	legacySiteMapping.getSiteId(articleId, function (err, siteId) {
		if (err) {
			callback(err);
			return;
		}

		let url = env.livefyre.api.commentCountUrl;
		url = url.replace(/\{networkName\}/g, env.livefyre.network.name);
		url = url.replace(/\{siteIdArticleIdBase64\}/g, new Buffer(siteId + ":" + articleId).toString('base64'));

		let timer = new Timer();

		request.get(url, function (err, response) {
			endTimer(timer, 'commentCount', url);

			let body;
			if (response && response.body) {
				try {
					body = JSON.parse(response.body);
				} catch (e) {
					body = null;
				}
			} else {
				body = null;
			}

			if (err || !response || response.statusCode < 200 || response.statusCode >= 400 || !body) {
				if (err || !response || response.statusCode !== 404) {
					consoleLogger.warn(articleId, 'livefyre.commentCount error', err || new Error(response ? response.statusCode : 'No response'));
				}

				callback({
					error: err,
					statusCode: response ? response.statusCode : null
				});
				return;
			}

			if (body && body.data && Object.keys(body.data).length) {
				callback(null, body);
			} else {
				callback({
					error: new Error("Article not found"),
					statusCode: 404
				});
			}
		});
	});
};


exports.getCommentCounts = function (articleIds, callback) {
	if (typeof callback !== 'function') {
		throw new Error("livefyre.getCommentCounts: callback not provided");
	}

	if (!articleIds) {
		callback(new Error("articleIds should be provided."));
		return;
	}

	if (!articleIds.length) {
		callback();
		return;
	}

	const articleSiteIds = {};

	const siteIdFetchFunctions = [];
	articleIds.forEach(articleId => {
		siteIdFetchFunctions.push((done) => {
			legacySiteMapping.getSiteId(articleId, (err, siteId) => {
				if (err) {
					done(null, null);
					return;
				}

				done(null, siteId);
			});
		});
	});
	async.parallel(siteIdFetchFunctions, (err, siteIds) => {
		if (err) {
			callback(err);
			return;
		}

		siteIds.forEach((siteId, index) => {
			if (siteId) {
				if (!articleSiteIds[siteId]) {
					articleSiteIds[siteId] = [];
				}

				articleSiteIds[siteId].push(articleIds[index]);
			}
		});

		let siteIdArticleIdString = "";
		Object.keys(articleSiteIds).forEach(siteId => {
			if (siteIdArticleIdString) {
				siteIdArticleIdString += '|';
			}
			siteIdArticleIdString += siteId + ':';

			articleSiteIds[siteId].forEach((articleId, index) => {
				if (index !== 0) {
					siteIdArticleIdString += ',';
				}
				siteIdArticleIdString += articleId;
			});
		});

		let url = env.livefyre.api.commentCountUrl;
		url = url.replace(/\{networkName\}/g, env.livefyre.network.name);
		url = url.replace(/\{siteIdArticleIdBase64\}/g, new Buffer(siteIdArticleIdString).toString('base64'));

		let timer = new Timer();

		request.get(url, function (err, response) {
			endTimer(timer, 'commentCounts', url);

			let body;
			if (response && response.body) {
				try {
					body = JSON.parse(response.body);
				} catch (e) {
					body = null;
				}
			} else {
				body = null;
			}

			if (err || !response || response.statusCode < 200 || response.statusCode >= 400 || !body) {
				if (err || !response || response.statusCode !== 404) {
					consoleLogger.warn(articleIds, 'livefyre.commentCounts error', err || new Error(response ? response.statusCode : 'No response'));
				}

				callback({
					error: err,
					statusCode: response ? response.statusCode : null
				});
				return;
			}

			callback(null, body);
		});
	});
};


exports.getHottestArticle = function (query, callback) {
	if (typeof query === 'function') {
		callback = query;
		query = null;
	}

	if (typeof callback !== 'function') {
		throw new Error("livefyre.getHottestArticle: callback not provided");
	}

	let url = env.livefyre.api.heatIndexUrl;
	url = url.replace(/\{networkName\}/g, env.livefyre.network.name);

	let queryString = "";
	if (query) {
		Object.keys(query).forEach((key) => {
			if (typeof query[key] === 'string') {
				queryString += `&${key}=${query[key]}`;
			} else if (query[key] instanceof Array) {
				query[key].forEach((value) => {
					queryString += `&${key}=${value}`;
				});
			}
		});
	}

	if (queryString) {
		queryString = queryString.substr(1);
	}

	let timer = new Timer();
	request.get(`${url}?${queryString}`, function (err, response) {
		endTimer(timer, 'hottestArticle', url);

		let body;
		if (response && response.body) {
			try {
				body = JSON.parse(response.body);
			} catch (e) {
				body = null;
			}
		} else {
			body = null;
		}

		if (err || !response || response.statusCode < 200 || response.statusCode >= 400 || !body) {
			if (err || !response || response.statusCode !== 404) {
				consoleLogger.warn('livefyre.getHottestArticle error', err || new Error(response ? response.statusCode : 'No response'));
			}

			callback({
				error: err,
				statusCode: response ? response.statusCode : null
			});
			return;
		}

		callback(null, body);
	});
};
