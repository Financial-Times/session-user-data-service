"use strict";

const nEsClient = require('@financial-times/n-es-client');
const db = require('../services/db');
const livefyreService = require('../services/livefyre');
const consoleLogger = require('../utils/consoleLogger');
const mongoSanitize = require('mongo-sanitize');
const EventEmitter = require('events');
const env = require('../../env');
const urlParser = require('url');
const Timer = require('../utils/Timer');


var ArticleDataStore = function (articleId) {
	var storedData = null;
	var self = this;
	var storeEvents = new EventEmitter();



	let toBeRefreshed;
	var fetchingStoreInProgress = false;
	function getStoredData (callback) {
		if (typeof callback !== 'function') {
			throw new Error("ArticleDataStore.getStoredData: callback not provided");
		}

		if (storedData && !toBeRefreshed) {
			consoleLogger.log(articleId, 'cached data retrieved from memory');
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
					consoleLogger.warn('ArticleDataStore.getStoredData: service high response time', elapsedTime + 'ms');
				} else {
					consoleLogger.info('ArticleDataStore.getStoredData: service response time', elapsedTime + 'ms');
				}

				fetchingStoreInProgress = false;
				storeEvents.emit('storedDataFetched', err, data);
			};

			db.getConnection(env.mongo.uri, function (errConn, connection) {
				if (errConn) {
					consoleLogger.warn(articleId, 'error retrieving the cache', errConn);

					fetchingStoreInProgress = false;
					done(errConn);
					return;
				}

				connection.collection('articles').find({
					_id: mongoSanitize(articleId)
				}).maxTimeMS(env.timeouts.queries).toArray(function (errDb, data) {
					if (errDb) {
						consoleLogger.warn(articleId, 'cache retrieval failed', errDb);

						done(errDb);
						return;
					}

					if (data && data.length) {
						storedData = data[0];
						toBeRefreshed = false;

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
		var setData = {};
		setData[mongoSanitize(field)] = data;

		db.getConnection(env.mongo.uri, function (errConn, connection) {
			if (errConn) {
				consoleLogger.warn(articleId, 'upsert failed', errConn);
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
					consoleLogger.warn(articleId, 'upsert failed', errUpsert);
				}

				// reset storage cache
				toBeRefreshed = true;
			});
		});
	}


	var getTagsByUrl = function (url) {
		if (url) {
			var parsedUrl = urlParser.parse(url);

			var tags = [];

			if (parsedUrl && parsedUrl.hostname) {
				var matches = parsedUrl.hostname.match(/([^\.]+)\.ft\.com$/);
				if (matches && matches.length) {
					switch (matches[1]) {
						case 'blogs':
							tags.push('blog');
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

				if (parsedUrl.hostname.endsWith('blogs.ft.com')) {
					matches = parsedUrl.pathname.match(/\/([^\/]+)/);
					if (matches && matches.length) {
						tags.push(matches[1]);
					}
				}

				if (parsedUrl.hostname.endsWith('ftalphaville.ft.com') && parsedUrl.pathname.indexOf('longroom') !== -1) {
					tags.push('longroom');
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

		nEsClient.get(articleId)
			.then(article => {
				var tags = [];

				if (article && article.annotations) {
					article.annotations.forEach(annotation => {
						const tag = `${annotation.type.toLowerCase()}.${annotation.prefLabel}`;
						if (!tags.includes(tag)) {
							tags.push(tag);
						}

						if (annotation.type === 'PERSON' && annotation.predicate === 'http://www.ft.com/ontology/annotation/hasAuthor') {
							const tag = `author.${annotation.prefLabel}`;
							if (!tags.includes(tag)) {
								tags.push(tag);
							}
						}
					})
				}

				callback(null, tags);
			})
			.catch(callback);
	};
	var upsertArticleTags = function (tags, shortTTL) {
		consoleLogger.log(articleId, 'upsert tags');

		var dataToBeSaved = {
			data: tags,
			expires: new Date(shortTTL ? new Date().getTime() + 1000 * 60 * 5 : new Date().getTime() + env.cacheExpiryHours.articles * 1000 * 60 * 60)
		};
		if (shortTTL) {
			dataToBeSaved.shortTTL = true;
		}

		upsertStoredData("tags", dataToBeSaved);
	};
	this.getArticleTags = function (url, callback) {
		if (typeof url === 'function') {
			callback = url;
			url = null;
		}

		if (typeof callback !== 'function') {
			throw new Error("ArticleDataStore.getArticleTags: callback not provided");
		}

		if (!articleId) {
			callback(new Error("Article ID is not provided."));
			return;
		}

		getStoredData(function (errCache, storedData) {
			if (errCache) {
				// fetch

				fetchCapiTags(function (errFetch, tags) {
					if (errFetch) {
						callback(null, getTagsByUrl(url), errFetch.statusCode !== 404 ? true : false);
						return;
					}

					callback(null, tags.concat(getTagsByUrl(url)));
				});
				return;
			}

			if (storedData && storedData.tags) {
				consoleLogger.log(articleId, 'articleTags', 'data loaded from the cache');

				callback(null, storedData.tags.data.concat(getTagsByUrl(url)), storedData.tags.shortTTL ? true : false);

				if (new Date(storedData.tags.expires) < new Date()) {
					// expired, fetch and update
					consoleLogger.log(articleId, 'articleTags', 'data expired, refresh');
					fetchCapiTags(function (errFetch, tags) {
						if (errFetch) {
							if (errFetch.statusCode !== 404) {
								upsertArticleTags([], true);
							}
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
						callback(null, getTagsByUrl(url), errFetch.statusCode !== 404 ? true : false);

						if (errFetch.statusCode !== 404) {
							upsertArticleTags([], true);
						}
						return;
					}

					callback(null, tags.concat(getTagsByUrl(url)));

					upsertArticleTags(tags);
				});
			}
		});
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

		if (!articleId) {
			callback(new Error("Article ID is not provided"));
			return;
		}

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
	};


	var fetchLivefyreCollectionDetails = function (config, callback) {
		if (typeof callback !== 'function') {
			throw new Error("ArticleDataStore.fetchLivefyreCollectionDetails: callback not provided");
		}

		consoleLogger.log(articleId, 'collectionDetails', 'fetch');

		self.getArticleTags(config.url, function (errTags, tags, capiDown) {
			if (errTags) {
				tags = [];

				if (errTags.statusCode !== 404) {
					capiDown = true;
				}
			}

			if (capiDown) {
				consoleLogger.log(articleId, 'collectionDetails', 'CAPI down, use short cache ttl');
			}

			if (!config.tags) {
				config.tags = [];
			}
			config.tags = tags.concat(config.tags);

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
	var upsertLivefyreCollectionDetails = function (collectionDetails, shortTTL) {
		upsertStoredData("livefyre.metadata", {
			data: collectionDetails,
			expires: new Date(shortTTL ? new Date().getTime() + 1000 * 60 * 5 : new Date().getTime() + env.cacheExpiryHours.articles * 1000 * 60 * 60)
		});
	};
	this.getLivefyreCollectionDetails = function (config, callback) {
		if (typeof callback !== 'function') {
			throw new Error("ArticleDataStore.getLivefyreCollectionDetails: callback not provided");
		}

		if (!config || !config.title || !config.url) {
			callback(new Error("Config is incomplete. Title and url are required."));
			return;
		}

		if (config.articleId) {
			if (config.articleId !== articleId) {
				consoleLogger.error(articleId, 'ArticleID provided to the function is in conflict with the ArticleDataStore\'s articleId');
				callback(new Error("Article ID provided is in conflict."));
				return;
			}
		}
		config.articleId = articleId;

		getStoredData(function (errCache, storedData) {
			if (errCache) {
				// fetch
				consoleLogger.log(articleId, 'collectionDetails', 'cache down');

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
	};

	this.destroy = function () {
		storedData = null;
	};
};
module.exports = ArticleDataStore;
