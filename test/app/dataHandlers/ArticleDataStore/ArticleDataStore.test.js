"use strict";

const assert = require('assert');
const proxyquire =  require('proxyquire');
const consoleLogger = require('../../../../app/utils/consoleLogger');
const testData = require('./testData');

consoleLogger.disable();



const ArticleDataStore = proxyquire('../../../../app/dataHandlers/ArticleDataStore.js', {
	'ft-api-client': testData.mocks['ft-api-client'],
	mongodb: testData.mocks.mongodb,
	request: testData.mocks.request,
	livefyre: testData.mocks.livefyre,
	'../../env': testData.mocks.env
});

describe('ArticleDataStore', function() {
	describe('getArticleTags', function () {
		it('should throw error if no callback is provided', function () {
			let articleDataStore = new ArticleDataStore(testData.articles.normal.id);

			assert.throws(function () {
				articleDataStore.getArticleTags();
			}, Error);
			assert.throws(function () {
				articleDataStore.getArticleTags(testData.articles.normal.url);
			}, Error);
		});

		it('should return error if no article ID is provided', function (done) {
			let articleDataStore = new ArticleDataStore();

			articleDataStore.getArticleTags(testData.articles.normal.url, function (err, data) {
				assert.ok(err, "Error is set.");
				assert.ok(!data, "No data is set.");

				done();
			});
		});

		it("should work without URL as well (callback as first parameter)", function () {
			let articleDataStore = new ArticleDataStore();

			assert.doesNotThrow(function () {
				articleDataStore.getArticleTags(function () {});
			}, Error);
		});

		it("should return tags for URL only if ID is not found in CAPI", function (done) {
			let articleDataStore = new ArticleDataStore('notfound');

			articleDataStore.getArticleTags(testData.articles.blogs.url, function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, ['blog', 'the-world'], "Correct tags returned.");

				done();
			});
		});

		it("should return specific tags for blogs URL", function (done) {
			let articleDataStore = new ArticleDataStore('notfound');

			articleDataStore.getArticleTags(testData.articles.blogs.url, function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, ['blog', 'the-world'], "Correct tags returned.");

				done();
			});
		});

		it("should return specific tags for ftalphaville URL", function (done) {
			let articleDataStore = new ArticleDataStore('notfound');

			articleDataStore.getArticleTags(testData.articles.ftalphaville.url, function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, ['alphaville', 'blog'], "Correct tags returned.");

				done();
			});
		});

		it("should return specific tags for marketslive URL", function (done) {
			let articleDataStore = new ArticleDataStore('notfound');

			articleDataStore.getArticleTags(testData.articles.marketslive.url, function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, ['alphaville', 'blog'], "Correct tags returned.");

				done();
			});
		});

		it("should return specific tags for discussion/longroom URL", function (done) {
			let articleDataStore = new ArticleDataStore('notfound');

			articleDataStore.getArticleTags(testData.articles.longroom.url, function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, ['discussion', 'longroom'], "Correct tags returned.");

				done();
			});
		});

		it("should return specific tags for lexicon URL", function (done) {
			let articleDataStore = new ArticleDataStore('notfound');

			articleDataStore.getArticleTags(testData.articles.lexicon.url, function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, ['lexicon'], "Correct tags returned.");

				done();
			});
		});

		it("should return tags from CAPI", function (done) {
			let articleDataStore = new ArticleDataStore(testData.articles.normal.id);

			articleDataStore.getArticleTags(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, ['section.Section1', 'section.Section2', 'author.Author1', 'author.Author2', 'brand.Brand1'], "Correct tags returned.");

				done();
			});
		});


		it("should not cache data for article that is not found in CAPI", function (done) {
			let articleDataStore = new ArticleDataStore('notfound-capi');

			articleDataStore.getArticleTags(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, [], "Empty array is returned.");

				setTimeout(function () {
					var articleCache = testData.mockInstances.mongodb.findInDb('articles', {
						_id: 'notfound-capi'
					});

					assert.equal(articleCache.length, 0, "No cache is created.");

					done();
				}, 10);
			});
		});

		it("should return tags from cache, and the cache is not updated if it did not expire", function (done) {
			let articleDataStore = new ArticleDataStore(testData.articles.cached.id);

			articleDataStore.getArticleTags(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, ['tag1', 'tag2'], "Correct tags returned.");

				setTimeout(function () {
					var articleCache = testData.mockInstances.mongodb.findInDb('articles', {
						_id: testData.articles.cached.id
					});

					assert.equal(articleCache.length, 1, "Only 1 entry exists in DB for the article ID.");
					assert.deepEqual(articleCache[0].tags.data, ['tag1', 'tag2'], "Cache was not updated.");
					assert.equal(articleCache[0].tags.expires, testData.articles.cached.initialCache.tags.expires, "Expiry time of the cache did not modify.");

					done();
				}, 10);
			});
		});

		it("should return tags from cache concatenated with the ones obtained from the URL", function (done) {
			let articleDataStore = new ArticleDataStore(testData.articles.cached.id);

			articleDataStore.getArticleTags(testData.articles.lexicon.url, function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, ['tag1', 'tag2', 'lexicon'], "Correct tags returned.");

				done();
			});
		});

		it("should cache CAPI tags into the DB, but without URL tags", function (done) {
			let articleDataStore = new ArticleDataStore(testData.articles.toBeCached.id);

			var startTime = new Date();
			articleDataStore.getArticleTags(testData.articles.lexicon.url, function (err, data) {
				assert.ok(!err, "Error is not set.");

				setTimeout(function () {
					var endTime = new Date();

					var articleCache = testData.mockInstances.mongodb.findInDb('articles', {
						_id: testData.articles.toBeCached.id
					});

					assert.equal(articleCache.length, 1, "Only 1 entry exists in DB for the article ID.");
					assert.deepEqual(articleCache[0].tags.data, ['section.Section1', 'section.Section2', 'author.Author1', 'author.Author2', 'brand.Brand1'], "Correct tags cached.");
					assert.ok(articleCache[0].tags.expires >= new Date(startTime.getTime() + testData.mocks.env.cacheExpiryHours.articles * 60 * 60 * 1000) &&
							articleCache[0].tags.expires <= new Date(endTime.getTime() + testData.mocks.env.cacheExpiryHours.articles * 60 * 60 * 1000), "Expiry time of the cache is around the one specified in the configs.");

					done();
				}, 10);
			});
		});


		it("should return tags from cache even if it's expired, and async should update the cache", function (done) {
			let articleDataStore = new ArticleDataStore(testData.articles.toBeUpdated.id);

			var startTime = new Date();
			articleDataStore.getArticleTags(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, ['tag1', 'tag2'], "Correct tags returned.");

				setTimeout(function () {
					var endTime = new Date();

					var articleCache = testData.mockInstances.mongodb.findInDb('articles', {
						_id: testData.articles.toBeUpdated.id
					});

					assert.equal(articleCache.length, 1, "Only 1 entry exists in DB for the article ID.");
					assert.deepEqual(articleCache[0].tags.data, ['section.Section1', 'section.Section2', 'author.Author1', 'author.Author2', 'brand.Brand1'], "Correct tags cached.");
					assert.ok(articleCache[0].tags.expires >= new Date(startTime.getTime() + testData.mocks.env.cacheExpiryHours.articles * 60 * 60 * 1000) &&
							articleCache[0].tags.expires <= new Date(endTime.getTime() + testData.mocks.env.cacheExpiryHours.articles * 60 * 60 * 1000), "Expiry time of the cache is around the one specified in the configs.");

					done();
				}, 10);
			});
		});

		it("should flag if CAPI is down, and cache with short TTL", function (done) {
			let articleDataStore = new ArticleDataStore(testData.articles.capiDown1.id);

			var startTime = new Date();
			articleDataStore.getArticleTags(function (err, data, capiDown) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, [], "Emtpy tags");
				assert.equal(capiDown, true, "CAPI Down flagged.");

				setTimeout(function () {
					var endTime = new Date();

					var articleCache = testData.mockInstances.mongodb.findInDb('articles', {
						_id: testData.articles.capiDown1.id
					});

					assert.equal(articleCache.length, 1, "Only 1 entry exists in DB for the article ID.");
					assert.deepEqual(articleCache[0].tags.data, [], "Correct tags cached.");
					assert.equal(articleCache[0].tags.shortTTL, true, "Short TTL is saved in cache.");

					// expires in 5 minutes
					assert.ok(articleCache[0].tags.expires >= new Date(startTime.getTime() + 5 * 60 * 1000) &&
							articleCache[0].tags.expires <= new Date(endTime.getTime() + 5 * 60 * 1000), "Expiry time of the cache is a short TTL.");

					done();
				}, 10);
			});
		});

		it("should flag if CAPI was down and the data was cached with short TTL", function (done) {
			let articleDataStore = new ArticleDataStore(testData.articles.capiDownCached.id);

			articleDataStore.getArticleTags(function (err, data, capiDown) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, [], "Emtpy tags");
				assert.equal(capiDown, true, "CAPI Down flagged.");

				done();
			});
		});
	});



	describe('livefyreCollectionExists', function () {
		it('should throw error if no callback is provided', function () {
			let articleDataStore = new ArticleDataStore(testData.articles.normal.id);

			assert.throws(function () {
				articleDataStore.livefyreCollectionExists();
			}, Error);
		});

		it('should return error if no article ID is provided', function (done) {
			let articleDataStore = new ArticleDataStore();

			articleDataStore.livefyreCollectionExists(function (err, data) {
				assert.ok(err, "Error is set.");
				assert.ok(!data, "No data is set.");

				done();
			});
		});

		it("should return true if the collection exists, and should update the cache as well", function (done) {
			let articleDataStore = new ArticleDataStore(testData.articles.normal.id);

			articleDataStore.livefyreCollectionExists(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.equal(data, true, "Collection exists");

				setTimeout(function () {
					var articleCache = testData.mockInstances.mongodb.findInDb('articles', {
						_id: testData.articles.normal.id
					});

					assert.equal(articleCache.length, 1, "Only 1 entry exists in DB for the article ID.");
					assert.equal(articleCache[0].livefyre.collectionExists, true, "Collection exists cached.");

					done();
				}, 10);
			});
		});

		it("should return false if the collection does not exist, and should not update the cache", function (done) {
			let articleDataStore = new ArticleDataStore(testData.articles.noCollection.id);

			articleDataStore.livefyreCollectionExists(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.equal(data, false, "Collection does not exist");

				setTimeout(function () {
					var articleCache = testData.mockInstances.mongodb.findInDb('articles', {
						_id: testData.articles.noCollection.id
					});

					assert.equal(articleCache.length, 0, "No data saved in cache.");

					done();
				}, 10);
			});
		});

		it("should return true if the collection exists and saved in the cache", function (done) {
			let articleDataStore = new ArticleDataStore(testData.articles.cached.id);

			articleDataStore.livefyreCollectionExists(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.equal(data, true, "Collection exists");

				done();
			});
		});
	});


	describe('getLivefyreCollectionDetails', function () {
		it('should throw error if no callback is provided', function () {
			let articleDataStore = new ArticleDataStore(testData.articles.normal.id);

			assert.throws(function () {
				articleDataStore.getLivefyreCollectionDetails();
			}, Error);
		});

		it('should throw error if no config is provided', function () {
			let articleDataStore = new ArticleDataStore(testData.articles.normal.id);

			assert.throws(function () {
				articleDataStore.getLivefyreCollectionDetails(function (err, data) {

				});
			}, Error);
		});

		it('should return error if no article ID is provided', function (done) {
			let articleDataStore = new ArticleDataStore();

			articleDataStore.getLivefyreCollectionDetails({
				title: testData.articles.normal.title,
				url: testData.articles.normal.url
			}, function (err, data) {
				assert.ok(err, "Error is set.");
				assert.ok(!data, "No data is set.");

				done();
			});
		});

		it('should return error if no `url` is missing from the config', function (done) {
			let articleDataStore = new ArticleDataStore();

			articleDataStore.getLivefyreCollectionDetails({
				title: testData.articles.normal.title
			}, function (err, data) {
				assert.ok(err, "Error is set.");
				assert.ok(!data, "No data is set.");

				done();
			});
		});

		it('should return error if no `title` is missing from the config', function (done) {
			let articleDataStore = new ArticleDataStore();

			articleDataStore.getLivefyreCollectionDetails({
				url: testData.articles.normal.url
			}, function (err, data) {
				assert.ok(err, "Error is set.");
				assert.ok(!data, "No data is set.");

				done();
			});
		});

		it('should return error if articleId of ArticleDataStore and articleId from config are different', function (done) {
			let articleDataStore = new ArticleDataStore(testData.articles.normal.id);

			articleDataStore.getLivefyreCollectionDetails({
				url: testData.articles.noCollection.id
			}, function (err, data) {
				assert.ok(err, "Error is set.");
				assert.ok(!data, "No data is set.");

				done();
			});
		});

		it('should return specific error if the UUID is unclassified', function (done) {
			let articleDataStore = new ArticleDataStore(testData.articles.unclassified.id);

			articleDataStore.getLivefyreCollectionDetails({
				title: testData.articles.unclassified.title,
				url: testData.articles.unclassified.url
			}, function (err, data) {
				assert.deepEqual(err, {
					unclassified: true
				}, "Error is specific for unclassified testData.articles.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return error if legacySiteMapping is down and returns error', function (done) {
			var mongoUri = testData.mocks.env.mongo.uri;
			testData.mocks.env.mongo.uri = 'invalid';

			let articleDataStore = new ArticleDataStore(testData.articles.normal.id);

			articleDataStore.getLivefyreCollectionDetails({
				title: testData.articles.normal.title,
				url: testData.articles.normal.url
			}, function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				testData.mocks.env.mongo.uri = mongoUri;
				done();
			});
		});

		it('should return error if site key is not set', function (done) {
			let articleDataStore = new ArticleDataStore(testData.articles.siteIdNotSetUp.id);

			articleDataStore.getLivefyreCollectionDetails({
				articleId: testData.articles.siteIdNotSetUp.id,
				title: testData.articles.siteIdNotSetUp.title,
				url: testData.articles.siteIdNotSetUp.url
			}, function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return collection details without errors', function (done) {
			let articleDataStore = new ArticleDataStore(testData.articles.normal.id);

			articleDataStore.getLivefyreCollectionDetails({
				title: testData.articles.normal.title,
				url: testData.articles.normal.url
			}, function (err, data) {
				assert.ok(!err, "Error is not returned.");

				assert.deepEqual(data, {
					siteId: testData.articles.normal.siteId,
					articleId: testData.articles.normal.id,
					collectionMeta: JSON.stringify({
						collectionMeta: {
							tags: testData.defaultTagListCollectionMeta,
							networkName: testData.mocks.env.livefyre.network.name + '.fyre.co',
							networkKey: testData.mocks.env.livefyre.network.key,
							siteId: testData.articles.normal.siteId,
							siteKey: testData.mocks.env.livefyre.siteKeys[testData.articles.normal.siteId],
							streamType: 'livecomments',
							title: testData.articles.normal.title,
							articleId: testData.articles.normal.id,
							url: testData.articles.normal.url
						}
					}),
					checksum: JSON.stringify({
						checksum: {
							tags: testData.defaultTagListCollectionMeta,
							networkName: testData.mocks.env.livefyre.network.name + '.fyre.co',
							networkKey: testData.mocks.env.livefyre.network.key,
							siteId: testData.articles.normal.siteId,
							siteKey: testData.mocks.env.livefyre.siteKeys[testData.articles.normal.siteId],
							streamType: 'livecomments',
							title: testData.articles.normal.title,
							articleId: testData.articles.normal.id,
							url: testData.articles.normal.url
						}
					})
				}, "Collection details is correctly returned.");

				done();
			});
		});

		it('should return collection details with the tags provided (and escaped properly)', function (done) {
			let articleDataStore = new ArticleDataStore(testData.articles.blogs.id);

			articleDataStore.getLivefyreCollectionDetails({
				title: testData.articles.blogs.title,
				url: testData.articles.blogs.url,
				tags: ['tag1', 'tag2', 'tag 3']
			}, function (err, data) {
				assert.ok(!err, "Error is not returned.");

				assert.deepEqual(data, {
					siteId: testData.articles.blogs.siteId,
					articleId: testData.articles.blogs.id,
					collectionMeta: JSON.stringify({
						collectionMeta: {
							tags: testData.defaultTagListCollectionMeta + ',blog,the-world,tag1,tag2,tag_3',
							networkName: testData.mocks.env.livefyre.network.name + '.fyre.co',
							networkKey: testData.mocks.env.livefyre.network.key,
							siteId: testData.articles.blogs.siteId,
							siteKey: testData.mocks.env.livefyre.siteKeys[testData.articles.blogs.siteId],
							streamType: 'livecomments',
							title: testData.articles.blogs.title,
							articleId: testData.articles.blogs.id,
							url: testData.articles.blogs.url
						}
					}),
					checksum: JSON.stringify({
						checksum: {
							tags: testData.defaultTagListCollectionMeta + ',blog,the-world,tag1,tag2,tag_3',
							networkName: testData.mocks.env.livefyre.network.name + '.fyre.co',
							networkKey: testData.mocks.env.livefyre.network.key,
							siteId: testData.articles.blogs.siteId,
							siteKey: testData.mocks.env.livefyre.siteKeys[testData.articles.blogs.siteId],
							streamType: 'livecomments',
							title: testData.articles.blogs.title,
							articleId: testData.articles.blogs.id,
							url: testData.articles.blogs.url
						}
					})
				}, "Collection details is correctly returned.");

				done();
			});
		});

		it('should return collection details with the provided stream_type', function (done) {
			let articleDataStore = new ArticleDataStore(testData.articles.ftalphaville.id);

			articleDataStore.getLivefyreCollectionDetails({
				title: testData.articles.ftalphaville.title,
				url: testData.articles.ftalphaville.url,
				stream_type: 'liveblogs'
			}, function (err, data) {
				assert.ok(!err, "Error is not returned.");

				assert.deepEqual(data, {
					siteId: testData.articles.ftalphaville.siteId,
					articleId: testData.articles.ftalphaville.id,
					collectionMeta: JSON.stringify({
						collectionMeta: {
							tags: testData.defaultTagListCollectionMeta + ',alphaville,blog',
							networkName: testData.mocks.env.livefyre.network.name + '.fyre.co',
							networkKey: testData.mocks.env.livefyre.network.key,
							siteId: testData.articles.ftalphaville.siteId,
							siteKey: testData.mocks.env.livefyre.siteKeys[testData.articles.ftalphaville.siteId],
							streamType: 'liveblogs',
							title: testData.articles.ftalphaville.title,
							articleId: testData.articles.ftalphaville.id,
							url: testData.articles.ftalphaville.url
						}
					}),
					checksum: JSON.stringify({
						checksum: {
							tags: testData.defaultTagListCollectionMeta + ',alphaville,blog',
							networkName: testData.mocks.env.livefyre.network.name + '.fyre.co',
							networkKey: testData.mocks.env.livefyre.network.key,
							siteId: testData.articles.ftalphaville.siteId,
							siteKey: testData.mocks.env.livefyre.siteKeys[testData.articles.ftalphaville.siteId],
							streamType: 'liveblogs',
							title: testData.articles.ftalphaville.title,
							articleId: testData.articles.ftalphaville.id,
							url: testData.articles.ftalphaville.url
						}
					})
				}, "Collection details is correctly returned.");

				done();
			});
		});

		it("should return collection details from the cache", function (done) {
			let articleDataStore = new ArticleDataStore(testData.articles.cached.id);

			articleDataStore.getLivefyreCollectionDetails({
				title: testData.articles.cached.title,
				url: testData.articles.cached.url
			}, function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, testData.articles.cached.initialCache.livefyre.metadata.data, "Correct collection metadata returned.");

				setTimeout(function () {
					var articleCache = testData.mockInstances.mongodb.findInDb('articles', {
						_id: testData.articles.cached.id
					});

					assert.equal(articleCache.length, 1, "Only 1 entry exists in DB for the article ID.");
					assert.deepEqual(articleCache[0].livefyre.metadata.data, testData.articles.cached.initialCache.livefyre.metadata.data, "Cache was not updated.");
					assert.equal(articleCache[0].livefyre.metadata.expires, testData.articles.cached.initialCache.livefyre.metadata.expires, "Expiry time of the cache did not modify.");

					done();
				}, 10);
			});
		});


		it("should return collection metadata from cache even if it's expired, and async should update the cache", function (done) {
			let articleDataStore = new ArticleDataStore(testData.articles.toBeUpdated.id);

			var startTime = new Date();
			articleDataStore.getLivefyreCollectionDetails({
				title: testData.articles.toBeUpdated.title,
				url: testData.articles.toBeUpdated.url
			}, function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, testData.articles.toBeUpdated.initialCache.livefyre.metadata.data, "Correct collection metadata returned.");

				setTimeout(function () {
					var endTime = new Date();

					var articleCache = testData.mockInstances.mongodb.findInDb('articles', {
						_id: testData.articles.toBeUpdated.id
					});

					assert.equal(articleCache.length, 1, "Only 1 entry exists in DB for the article ID.");
					assert.deepEqual(articleCache[0].livefyre.metadata.data, {
						siteId: testData.articles.toBeUpdated.siteId,
						articleId: testData.articles.toBeUpdated.id,
						collectionMeta: JSON.stringify({
							collectionMeta: {
								tags: testData.defaultTagListCollectionMeta,
								networkName: testData.mocks.env.livefyre.network.name + '.fyre.co',
								networkKey: testData.mocks.env.livefyre.network.key,
								siteId: testData.articles.toBeUpdated.siteId,
								siteKey: testData.mocks.env.livefyre.siteKeys[testData.articles.toBeUpdated.siteId],
								streamType: 'livecomments',
								title: testData.articles.toBeUpdated.title,
								articleId: testData.articles.toBeUpdated.id,
								url: testData.articles.toBeUpdated.url
							}
						}),
						checksum: JSON.stringify({
							checksum: {
								tags: testData.defaultTagListCollectionMeta,
								networkName: testData.mocks.env.livefyre.network.name + '.fyre.co',
								networkKey: testData.mocks.env.livefyre.network.key,
								siteId: testData.articles.toBeUpdated.siteId,
								siteKey: testData.mocks.env.livefyre.siteKeys[testData.articles.toBeUpdated.siteId],
								streamType: 'livecomments',
								title: testData.articles.toBeUpdated.title,
								articleId: testData.articles.toBeUpdated.id,
								url: testData.articles.toBeUpdated.url
							}
						})
					}, "Correct tags cached.");
					assert.ok(articleCache[0].livefyre.metadata.expires >= new Date(startTime.getTime() + testData.mocks.env.cacheExpiryHours.articles * 60 * 60 * 1000) &&
							articleCache[0].livefyre.metadata.expires <= new Date(endTime.getTime() + testData.mocks.env.cacheExpiryHours.articles * 60 * 60 * 1000), "Expiry time of the cache is around the one specified in the configs.");

					done();
				}, 10);
			});
		});

		it("should cache with short TTL if CAPI is down", function (done) {
			let articleDataStore = new ArticleDataStore(testData.articles.capiDown2.id);

			var startTime = new Date();
			articleDataStore.getLivefyreCollectionDetails({
				title: testData.articles.capiDown2.title,
				url: testData.articles.capiDown2.url
			}, function (err, data) {
				assert.ok(!err, "Error is not set.");

				setTimeout(function () {
					var endTime = new Date();

					var articleCache = testData.mockInstances.mongodb.findInDb('articles', {
						_id: testData.articles.capiDown2.id
					});

					assert.equal(articleCache.length, 1, "Only 1 entry exists in DB for the article ID.");
					assert.deepEqual(articleCache[0].livefyre.metadata.data, {
						siteId: testData.articles.capiDown2.siteId,
						articleId: testData.articles.capiDown2.id,
						collectionMeta: JSON.stringify({
							collectionMeta: {
								tags: '',
								networkName: testData.mocks.env.livefyre.network.name + '.fyre.co',
								networkKey: testData.mocks.env.livefyre.network.key,
								siteId: testData.articles.capiDown2.siteId,
								siteKey: testData.mocks.env.livefyre.siteKeys[testData.articles.capiDown2.siteId],
								streamType: 'livecomments',
								title: testData.articles.capiDown2.title,
								articleId: testData.articles.capiDown2.id,
								url: testData.articles.capiDown2.url
							}
						}),
						checksum: JSON.stringify({
							checksum: {
								tags: '',
								networkName: testData.mocks.env.livefyre.network.name + '.fyre.co',
								networkKey: testData.mocks.env.livefyre.network.key,
								siteId: testData.articles.capiDown2.siteId,
								siteKey: testData.mocks.env.livefyre.siteKeys[testData.articles.capiDown2.siteId],
								streamType: 'livecomments',
								title: testData.articles.capiDown2.title,
								articleId: testData.articles.capiDown2.id,
								url: testData.articles.capiDown2.url
							}
						})
					}, "Correct tags cached.");

					// expires in 5 minutes
					assert.ok(articleCache[0].livefyre.metadata.expires >= new Date(startTime.getTime() + 5 * 60 * 1000) &&
							articleCache[0].livefyre.metadata.expires <= new Date(endTime.getTime() + 5 * 60 * 1000), "Expiry time of the cache is a short TTL.");

					done();
				}, 10);
			});
		});

		it("should cache with short TTL if CAPI was down (tags cached with short ttl)", function (done) {
			let articleDataStore = new ArticleDataStore(testData.articles.capiDownCached.id);

			var startTime = new Date();
			articleDataStore.getLivefyreCollectionDetails({
				title: testData.articles.capiDownCached.title,
				url: testData.articles.capiDownCached.url
			}, function (err, data) {
				assert.ok(!err, "Error is not set.");

				setTimeout(function () {
					var endTime = new Date();

					var articleCache = testData.mockInstances.mongodb.findInDb('articles', {
						_id: testData.articles.capiDownCached.id
					});

					assert.equal(articleCache.length, 1, "Only 1 entry exists in DB for the article ID.");
					assert.deepEqual(articleCache[0].livefyre.metadata.data, {
						siteId: testData.articles.capiDownCached.siteId,
						articleId: testData.articles.capiDownCached.id,
						collectionMeta: JSON.stringify({
							collectionMeta: {
								tags: '',
								networkName: testData.mocks.env.livefyre.network.name + '.fyre.co',
								networkKey: testData.mocks.env.livefyre.network.key,
								siteId: testData.articles.capiDownCached.siteId,
								siteKey: testData.mocks.env.livefyre.siteKeys[testData.articles.capiDownCached.siteId],
								streamType: 'livecomments',
								title: testData.articles.capiDownCached.title,
								articleId: testData.articles.capiDownCached.id,
								url: testData.articles.capiDownCached.url
							}
						}),
						checksum: JSON.stringify({
							checksum: {
								tags: '',
								networkName: testData.mocks.env.livefyre.network.name + '.fyre.co',
								networkKey: testData.mocks.env.livefyre.network.key,
								siteId: testData.articles.capiDownCached.siteId,
								siteKey: testData.mocks.env.livefyre.siteKeys[testData.articles.capiDownCached.siteId],
								streamType: 'livecomments',
								title: testData.articles.capiDownCached.title,
								articleId: testData.articles.capiDownCached.id,
								url: testData.articles.capiDownCached.url
							}
						})
					}, "Correct tags cached.");

					// expires in 5 minutes
					assert.ok(articleCache[0].livefyre.metadata.expires >= new Date(startTime.getTime() + 5 * 60 * 1000) &&
							articleCache[0].livefyre.metadata.expires <= new Date(endTime.getTime() + 5 * 60 * 1000), "Expiry time of the cache is a short TTL.");

					done();
				}, 10);
			});
		});
	});


	describe('getCommentCount', function () {
		it('should throw error if no callback is provided', function () {
			let articleDataStore = new ArticleDataStore(testData.articles.normal.id);

			assert.throws(function () {
				articleDataStore.getCommentCount();
			}, Error);
		});

		it('should return error if no article ID is provided', function (done) {
			let articleDataStore = new ArticleDataStore();

			articleDataStore.getCommentCount(function (err, data) {
				assert.ok(err, "Error is set.");
				assert.ok(!data, "No data is set.");

				done();
			});
		});

		it('should return 0 if the UUID is unclassified', function (done) {
			let articleDataStore = new ArticleDataStore(testData.articles.unclassified2.id);

			articleDataStore.getCommentCount(function (err, count) {
				assert.ok(!err, "Error is not returned.");
				assert.equal(count, 0, "0 count is returned.");

				setTimeout(function () {
					var articleCache = testData.mockInstances.mongodb.findInDb('articles', {
						_id: testData.articles.unclassified2.id
					});

					assert.equal(articleCache.length, 0, "No cache is created.");

					done();
				}, 10);
			});
		});

		it('should return 0 if the article does not exist', function (done) {
			let articleId = 'notexists-count';
			let articleDataStore = new ArticleDataStore(articleId);

			articleDataStore.getCommentCount(function (err, count) {
				assert.ok(!err, "Error is not returned.");
				assert.equal(count, 0, "0 count is returned.");

				setTimeout(function () {
					var articleCache = testData.mockInstances.mongodb.findInDb('articles', {
						_id: articleId
					});

					assert.equal(articleCache.length, 0, "No cache is created.");

					done();
				}, 10);
			});
		});

		it('should return error if legacySiteMapping returns error', function (done) {
			var mongoUri = testData.mocks.env.mongo.uri;
			testData.mocks.env.mongo.uri = 'invalid';

			let articleDataStore = new ArticleDataStore(testData.articles.cached.id);

			articleDataStore.getCommentCount(function (err, count) {
				assert.ok(err, "Error is returned.");
				assert.ok(count === undefined || count === null, "Data is not set.");

				testData.mocks.env.mongo.uri = mongoUri;

				done();
			});
		});

		it('should return the count if it\'s cached', function (done) {
			let articleDataStore = new ArticleDataStore(testData.articles.cached.id);

			articleDataStore.getCommentCount(function (err, count) {
				assert.ok(!err, "Error is not returned.");
				assert.equal(count, testData.articles.cached.initialCache.commentCount.count, "The count is returned.");

				setTimeout(function () {
					var articleCache = testData.mockInstances.mongodb.findInDb('articles', {
						_id: testData.articles.cached.id
					});

					assert.equal(articleCache.length, 1, "Cache is in place.");
					assert.deepEqual(articleCache[0].commentCount.expires, testData.articles.cached.initialCache.commentCount.expires, "Expiry date not modified.");

					done();
				}, 10);
			});
		});

		it('should fetch the count, return it, and cache it', function (done) {
			let articleDataStore = new ArticleDataStore(testData.articles.toBeCached.id);

			let startTime = new Date();
			articleDataStore.getCommentCount(function (err, count) {
				assert.ok(!err, "Error is not returned.");
				assert.equal(count, testData.articles.toBeCached.commentCount, "The count is returned.");

				setTimeout(function () {
					let endTime = new Date();

					var articleCache = testData.mockInstances.mongodb.findInDb('articles', {
						_id: testData.articles.toBeCached.id
					});

					assert.equal(articleCache.length, 1, "Cache is created.");
					assert.deepEqual(articleCache[0].commentCount.count, testData.articles.toBeCached.commentCount, "Count is cached correctly.");

					// expires in 5 minutes
					assert.ok(articleCache[0].commentCount.expires >= new Date(startTime.getTime() + 5 * 60 * 1000) &&
							articleCache[0].commentCount.expires <= new Date(endTime.getTime() + 5 * 60 * 1000), "Expiry time of the cache is a short TTL.");

					done();
				}, 10);
			});
		});


		it('should return the count if it\'s cached, and should update the cache if it\'s expired', function (done) {
			let articleDataStore = new ArticleDataStore(testData.articles.toBeUpdated.id);

			let startTime = new Date();
			articleDataStore.getCommentCount(function (err, count) {
				assert.ok(!err, "Error is not returned.");
				assert.equal(count, testData.articles.toBeUpdated.commentCount, "The count is re-fetched and returned.");

				setTimeout(function () {
					let endTime = new Date();

					var articleCache = testData.mockInstances.mongodb.findInDb('articles', {
						_id: testData.articles.toBeUpdated.id
					});

					assert.equal(articleCache.length, 1, "Cache is still in place.");
					assert.deepEqual(articleCache[0].commentCount.count, testData.articles.toBeUpdated.commentCount, "Count is cached correctly.");

					// expires in approx. 5 minutes
					assert.ok(articleCache[0].commentCount.expires >= new Date(startTime.getTime() + 5 * 60 * 1000) &&
							articleCache[0].commentCount.expires <= new Date(endTime.getTime() + 5 * 60 * 1000), "Expiry time of the cache is a short TTL.");

					done();
				}, 10);
			});
		});
	});
});
