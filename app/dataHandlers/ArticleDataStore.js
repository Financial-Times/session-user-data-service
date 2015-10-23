"use strict";

const capi_v1 = require('../services/capi_v1');
const db = require('../services/db');
const livefyreService = require('../services/livefyre');
const consoleLogger = require('../utils/consoleLogger');
const mongoSanitize = require('mongo-sanitize');
const EventEmitter = require('events');
const env = require('../../env');
const urlParser = require('url');

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

			db.getConnection(env.mongo.uri, function (errConn, connection) {
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

			db.getConnection(env.mongo.uri, function (errConn, connection) {
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


	var getTagsByUrl = function (url) {
		if (url && url.endsWith('ft.com')) {
			var parsedUrl = urlParser.parse(url);
			var tags = [];

			var matches = parsedUrl.hostname.match(/([^\.]+)\.ft\.com$/);
			if (matches && matches.length) {
				switch (matches[1]) {
					case 'blogs':
						tags.push('blog');
						break;
					case 'discussions':
						tags.push('discussion');
						break;
					case 'ftalphaville':
						tags.push('alphaville');
						tags.push('blog');
						break;
					case 'lexicon':
						tags.push('lexicon');
						break;
					default:
						break;
				}
			}

			if (parsedUrl.hostname.endsWith('blogs.ft.com') || parsedUrl.hostname.endsWith('discussions.ft.com')) {
				matches = parsedUrl.pathname.match(/\/([^\/]+)/);
				if (matches && matches.length) {
					tags.push(matches[1]);
				}
			}

			return tags;
		}

		return [];
	};
	var fetchCapiTags = function (callback) {
		if (typeof callback !== 'function') {
			throw new Error("ArticleDataStore.fetchCapiTags: callback not provided");
		}

		consoleLogger.log(articleId, 'fetch article tags');

		capi_v1.getArticleData(articleId, function (errCapi, articleData) {
			if (errCapi) {
				callback(errCapi);

				return;
			}

			var tags = [];
			if (articleData.sections) {
				tags = tags.concat(articleData.sections.map(function (val) {return val.taxonomy + '.' + val.name}));
			}

			if (articleData.authors) {
				tags = tags.concat(articleData.authors.map(function (val) {return val.taxonomy + '.' + val.name}));
			}

			if (articleData.brand) {
				tags.push(articleData.brand.taxonomy + '.' + articleData.brand.name);
			}

			callback(null, tags);
		});
	};
	var upsertArticleTags = function (tags) {
		consoleLogger.log(articleId, 'upsert tags');
		upsertStoredData("tags", {
			data: tags,
			expires: new Date(new Date().getTime() + env.cacheExpiryHours.articles * 1000 * 60 * 60)
		});
	};
	this.getArticleTags = function (url, callback) {
		if (typeof callback !== 'function') {
			throw new Error("ArticleDataStore.getArticleTags: callback not provided");
		}

		try {
			getStoredData(function (errCache, storedData) {
				if (errCache) {
					// fetch
					consoleLogger.log(articleId, 'articleTags', 'error retrieving cache');
					consoleLogger.debug(articleId, errCache);
					fetchCapiTags(function (errFetch, tags) {
						if (errFetch) {
							callback(null, getTagsByUrl(url));
							return;
						}

						tags.concat(getTagsByUrl(url));
					});
					return;
				}

				if (storedData && storedData.tags) {
					consoleLogger.log(articleId, 'articleTags', 'data loaded from the cache');
					callback(null, storedData.tags.data.concat(getTagsByUrl(url)));

					if (new Date(storedData.tags.expires) < new Date()) {
						// expired, fetch and update
						consoleLogger.log(articleId, 'articleTags', 'data expired, refresh');
						fetchCapiTags(function (errFetch, tags) {
							if (errFetch) {
								return;
							}

							upsertArticleTags(tags);
						});
					}
				} else {
					// fetch and save
					consoleLogger.log(articleId, 'articleTags', 'not found in cache');
					fetchCapiTags(function (errFetch, tags) {
						if (errFetch) {
							callback(null, getTagsByUrl(url));
							return;
						}

						callback(null, tags.concat(getTagsByUrl(url)));

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
		self.getArticleTags(config.url, function (errTags, tags) {
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
			expires: new Date(shortLifetime ? new Date().getTime() + 1000 * 60 * 5 : new Date().getTime() + env.cacheExpiryHours.articles * 1000 * 60 * 60)
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
