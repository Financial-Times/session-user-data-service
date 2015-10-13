"use strict";

var capi_v1 = require('../services/capi_v1');
var db = require('../services/db');
var livefyreService = require('../services/livefyre');
var consoleLogger = require('../helpers/consoleLogger');
var mongoSanitize = require('mongo-sanitize');
var EventEmitter = require('events');

var cacheConfig = {
	expireHours: process.env.ARTICLE_CACHE_EXPIRY || 12
};

var ArticleDataStore = function (articleId) {
	var storedData = null;
	var self = this;
	var storeEvents = new EventEmitter();



	var fetchingStoreInProgress = false;
	function getStoredData (callback) {
		if (typeof callback !== 'function') {
			throw new Error("ArticleDataStore.getStoredData: callback not provided");
		}

		if (storedData) {
			consoleLogger.log(articleId, 'cached data retrieved from memory');
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

			db.getConnection(function (errConn, connection) {
				if (errConn) {
					consoleLogger.log(articleId, 'error retrieving the cache');
					consoleLogger.debug(articleId, errConn);

					fetchingStoreInProgress = false;
					done(errConn);
					return;
				}

				connection.collection('articles').find({
					_id: mongoSanitize(articleId)
				}).toArray(function (errDb, data) {
					if (errDb) {
						consoleLogger.log(articleId, 'cache retrieval failed');
						consoleLogger.debug(articleId, errDb);

						done(errDb);
						return;
					}

					if (data && data.length) {
						storedData = data[0];

						consoleLogger.log(articleId, 'cached data retrieved');
						consoleLogger.debug(articleId, storedData);

						done(null, storedData);
					} else {
						consoleLogger.log(articleId, 'no cached data found');
						done(null, null);
					}
				});
			});
		}
	}

	function upsertStoredData (field, data) {
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
			console.error(articleId, 'Exception, upsertStoredData', e);
			return;
		}
	}



	var fetchArticleTags = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("ArticleDataStore.fetchArticleTags: callback not provided");
		}

		consoleLogger.log(articleId, 'fetch article tags');
		capi_v1.getFilteredTags(articleId, callback);
	};
	var upsertArticleTags = function (tags) {
		consoleLogger.log(articleId, 'upsert tags');
		upsertStoredData("tags", {
			data: tags,
			expires: new Date(new Date().getTime() + cacheConfig.expireHours * 1000 * 60 * 60)
		});
	};
	this.getArticleTags = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("ArticleDataStore.getArticleTags: callback not provided");
		}

		try {
			getStoredData(function (errCache, storedData) {
				if (errCache) {
					// fetch
					consoleLogger.log(articleId, 'articleTags', 'error retrieving cache');
					consoleLogger.debug(articleId, errCache);
					fetchArticleTags(callback);
					return;
				}

				if (storedData && storedData.tags) {
					consoleLogger.log(articleId, 'articleTags', 'data loaded from the cache');
					callback(null, storedData.tags.data);

					if (new Date(storedData.tags.expires) < new Date()) {
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
			throw new Error("ArticleDataStore.determineCollectionExists: callback not provided");
		}

		consoleLogger.log(articleId, 'determine collection exists');
		livefyreService.collectionExists(articleId, callback);
	};
	var upsertCollectionExists = function () {
		consoleLogger.log(articleId, 'upsert collection exists');
		upsertStoredData("livefyre.collectionExists", true);
	};
	this.livefyreCollectionExists = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("ArticleDataStore.livefyreCollectionExists: callback not provided");
		}

		try {
			getStoredData(function (errCache, storedData) {
				if (errCache) {
					// fetch
					determineCollectionExists(callback);
					return;
				}

				if (storedData && storedData.livefyre && storedData.livefyre.collectionExists) {
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
			throw new Error("ArticleDataStore.fetchLivefyreCollectionDetails: callback not provided");
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
		upsertStoredData("livefyre.metadata", {
			data: collectionDetails,
			expires: new Date(shortLifetime ? new Date().getTime() + 1000 * 60 * 5 : new Date().getTime() + cacheConfig.expireHours * 1000 * 60 * 60)
		});
	};
	this.getLivefyreCollectionDetails = function (config, callback) {
		if (typeof callback !== 'function') {
			throw new Error("ArticleDataStore.getLivefyreCollectionDetails: callback not provided");
		}

		if (config.articleId) {
			if (config.articleId !== articleId) {
				consoleLogger.error(articleId, 'ArticleID provided to the function is in conflict with the ArticleDataStore\'s articleId');
				callback(new Error("Article ID provided is in conflict."));
				return;
			}
		}
		config.articleId = articleId;

		try {
			getStoredData(function (errCache, storedData) {
				if (errCache) {
					// fetch
					consoleLogger.log(articleId, 'collectionDetails', 'cache down');
					consoleLogger.debug(articleId, errCache);

					fetchLivefyreCollectionDetails(config, callback);
					return;
				}

				if (storedData && storedData.livefyre && storedData.livefyre.metadata) {
					consoleLogger.log(articleId, 'collectionDetails', 'loaded from cache');
					callback(null, storedData.livefyre.metadata.data);

					if (new Date(storedData.livefyre.metadata.expires) < new Date()) {
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
		storedData = null;
	};
};
module.exports = ArticleDataStore;
