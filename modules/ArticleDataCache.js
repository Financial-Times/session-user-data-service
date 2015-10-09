"use strict";

var capi_v1 = require('../services/capi_v1');
var db = require('../services/db');
var livefyreService = require('../services/livefyre');
var consoleLogger = require('./consoleLogger');
var mongoSanitize = require('mongo-sanitize');

var cacheConfig = {
	expireHours: 0.01
};

var ArticleDataCache = function (articleId) {
	var cachedData = null;
	var self = this;

	function getCachedData (callback) {
		if (typeof callback !== 'function') {
			throw new Error("ArticleDataCache.getCachedData: callback not provided");
		}

		if (cachedData) {
			consoleLogger.log(articleId, 'cached data retrieved from memory');
			callback(null, cachedData);
			return;
		}

		db.getConnection(function (errConn, connection) {
			if (errConn) {
				consoleLogger.log(articleId, 'error retrieving the cache');
				consoleLogger.debug(articleId, errConn);

				callback(errConn);
				return;
			}

			connection.collection('articles').find({
				_id: mongoSanitize(articleId)
			}).toArray(function (errDb, data) {
				if (errDb) {
					consoleLogger.log(articleId, 'cache retrieval failed');
					consoleLogger.debug(articleId, errDb);
					callback(errDb);
					return;
				}

				if (data && data.length) {
					cachedData = data[0];
					consoleLogger.log(articleId, 'cached data retrieved');
					consoleLogger.debug(articleId, cachedData);

					callback(null, cachedData);
				} else {
					consoleLogger.log(articleId, 'no cached data found');
					callback(null, null);
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
					consoleLogger.log(articleId, 'upsert failed');
					consoleLogger.debug(errConn);
					return;
				}

				consoleLogger.log(articleId, 'upsert cache');
				consoleLogger.debug(articleId, 'field: ' + field, 'data:', data);

				connection.collection('articles').update({
					_id: mongoSanitize(articleId)
				}, {
					$set: setData
				}, {
					upsert: true
				}, function (errUpsert) {
					if (errUpsert) {
						consoleLogger.log(articleId, 'upsert failed');
						consoleLogger.debug(articleId, errUpsert);
					}
				});
			});
		} catch (e) {
			console.error(articleId, 'Exception, upsertCachedData', e);
			return;
		}
	}



	var fetchArticleTags = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("ArticleDataCache.fetchArticleTags: callback not provided");
		}

		consoleLogger.log(articleId, 'fetch article tags');
		capi_v1.getFilteredTags(articleId, callback);
	};
	var upsertArticleTags = function (tags) {
		consoleLogger.log(articleId, 'upsert tags');
		upsertCachedData("tags", {
			data: tags,
			expires: new Date(new Date().getTime() + cacheConfig.expireHours * 1000 * 60 * 60)
		});
	};
	this.getArticleTags = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("ArticleDataCache.getArticleTags: callback not provided");
		}

		try {
			getCachedData(function (errCache, cachedData) {
				if (errCache) {
					// fetch
					consoleLogger.log(articleId, 'articleTags', 'error retrieving cache');
					consoleLogger.debug(articleId, errCache);
					fetchArticleTags(callback);
				}

				if (cachedData && cachedData.tags) {
					consoleLogger.log(articleId, 'articleTags', 'data loaded from the cache');
					callback(null, cachedData.tags.data);

					if (new Date(cachedData.tags.expires) < new Date()) {
						// expired, fetch and update
						consoleLogger.log(articleId, 'articleTags', 'data expired, refresh');
						fetchArticleTags(function (errFetch, tags) {
							if (errFetch) {
								return;
							}

							upsertArticleTags(tags);
						});
					}
				} else {
					// fetch and save
					consoleLogger.log(articleId, 'articleTags', 'not found in cache');
					fetchArticleTags(function (errFetch, tags) {
						if (errFetch) {
							callback(errFetch);
							return;
						}

						callback(null, tags);

						upsertArticleTags(tags);
					});
				}
			});
		} catch (e) {
			console.error(articleId, 'Exception, getArticleTags', e);
			callback(e);
		}
	};



	var determineCollectionExists = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("ArticleDataCache.determineCollectionExists: callback not provided");
		}

		consoleLogger.log(articleId, 'determine collection exists');
		livefyreService.collectionExists(articleId, callback);
	};
	var upsertCollectionExists = function () {
		consoleLogger.log(articleId, 'upsert collection exists');
		upsertCachedData("livefyre.collectionExists", true);
	};
	this.livefyreCollectionExists = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("ArticleDataCache.livefyreCollectionExists: callback not provided");
		}

		try {
			getCachedData(function (errCache, cachedData) {
				if (errCache) {
					// fetch
					determineCollectionExists(callback);
				}

				if (cachedData && cachedData.livefyre && cachedData.livefyre.collectionExists) {
					consoleLogger.log(articleId, 'collection exists, from cache');
					callback(null, true);
				} else {
					// fetch and save
					determineCollectionExists(function (errFetch, exists) {
						if (errFetch) {
							callback(errFetch);
							return;
						}

						callback(null, exists);

						if (exists) {
							upsertCollectionExists();
						}
					});
				}
			});
		} catch (e) {
			console.error(articleId, 'Exception, livefyreCollectionExists', e);
			callback(e);
		}
	};


	var fetchLivefyreCollectionDetails = function (config, callback) {
		if (typeof callback !== 'function') {
			throw new Error("ArticleDataCache.fetchLivefyreCollectionDetails: callback not provided");
		}

		consoleLogger.log(articleId, 'collectionDetails', 'fetch');
		self.getArticleTags(function (errTags, tags) {
			var capiDown = false;

			if (errTags) {
				tags = [];

				if (errTags.statusCode !== 404) {
					consoleLogger.log(articleId, 'collectionDetails', 'CAPI down, use short cache ttl');
					capiDown = true;
				}
			}

			if (!config.tags) {
				config.tags = [];
			}
			config.tags = config.tags.concat(tags);

			if (config.stream_type) {
				config.stream_type = config.stream_type;
			}

			consoleLogger.debug(articleId, 'collectionDetails', 'config generated', config);

			livefyreService.getCollectionDetails(config, function (errColl, collectionDetails) {
				if (errColl) {
					callback(errColl);
					return;
				}

				callback(null, collectionDetails, capiDown);
			});
		});
	};
	var upsertLivefyreCollectionDetails = function (collectionDetails, shortLifetime) {
		upsertCachedData("livefyre.metadata", {
			data: collectionDetails,
			expires: new Date(shortLifetime ? new Date().getTime() + 1000 * 60 * 5 : new Date().getTime() + cacheConfig.expireHours * 1000 * 60 * 60)
		});
	};
	this.getLivefyreCollectionDetails = function (config, callback) {
		if (typeof callback !== 'function') {
			throw new Error("ArticleDataCache.getLivefyreCollectionDetails: callback not provided");
		}

		if (config.articleId) {
			if (config.articleId !== articleId) {
				consoleLogger.error(articleId, 'ArticleID provided to the function is in conflict with the ArticleDataCache\'s articleId');
				callback(new Error("Article ID provided is in conflict."));
				return;
			}
		}
		config.articleId = articleId;

		try {
			getCachedData(function (errCache, cachedData) {
				if (errCache) {
					// fetch
					consoleLogger.log(articleId, 'collectionDetails', 'cache down');
					consoleLogger.debug(articleId, errCache);

					fetchLivefyreCollectionDetails(config, callback);
				}

				if (cachedData && cachedData.livefyre && cachedData.livefyre.metadata) {
					consoleLogger.log(articleId, 'collectionDetails', 'loaded from cache');
					callback(null, cachedData.livefyre.metadata.data);

					if (new Date(cachedData.livefyre.metadata.expires) < new Date()) {
						// expired, fetch and update
						consoleLogger.log(articleId, 'collectionDetails', 'cache expired');
						fetchLivefyreCollectionDetails(config, function (errFetch, collectionDetails, capiDown) {
							if (errFetch) {
								return;
							}

							upsertLivefyreCollectionDetails(collectionDetails, capiDown);
						});
					}
				} else {
					// fetch and save
					consoleLogger.log(articleId, 'collectionDetails', 'not found in cache');
					fetchLivefyreCollectionDetails(config, function (errFetch, collectionDetails, capiDown) {
						if (errFetch) {
							callback(errFetch);
							return;
						}

						callback(null, collectionDetails);

						upsertLivefyreCollectionDetails(collectionDetails, capiDown);
					});
				}
			});
		} catch (e) {
			callback(e);
		}
	};

	this.destroy = function () {
		cachedData = null;
	};
};
module.exports = ArticleDataCache;
