"use strict";

const assert = require('assert');
const proxyquire =  require('proxyquire');
const consoleLogger = require('../../../app/utils/consoleLogger');
const MongodbMock = require('../../../mocks/mongodb');
const LivefyreMock = require('../../../mocks/livefyre');

consoleLogger.disable();


const articleDetails = {
	id: 'a86755e4-46a5-11e1-bc5f-00144feabdc0',
	title: 'Test article',
	url: 'http://www.ft.com/cms/a86755e4-46a5-11e1-bc5f-00144feabdc0.html',
	siteId: 415343
};
const articleDetailsWithSiteIdNotSetUp = {
	id: '3f330864-1c0f-443e-a6b3-cf8a3b536a52',
	title: 'Test article 2',
	url: 'http://www.ft.com/cms/3f330864-1c0f-443e-a6b3-cf8a3b536a52.html',
	siteId: 252346
};
const articleDetailsCollectionNotExists = {
	id: 'e78d07ca-680f-11e5-a57f-21b88f7d973f',
	title: 'Test article 3',
	url: 'http://www.ft.com/cms/e78d07ca-680f-11e5-a57f-21b88f7d973f.html',
	siteId: 523435
};

const articleDetailsUnclassified = {
	id: 'e78d07ca-680f-11e5-a57f-21b88f7d973f',
	title: 'Test article 3',
	url: 'http://www.ft.com/cms/e78d07ca-680f-11e5-a57f-21b88f7d973f.html',
	siteId: 'unclassified'
};

var siteMappingMock = {
	'legacy_site_mapping': [
		{
			_id: articleDetails.id,
			siteId: articleDetails.siteId
		},
		{
			_id: articleDetailsWithSiteIdNotSetUp.id,
			siteId: articleDetailsWithSiteIdNotSetUp.siteId
		},
		{
			_id: articleDetailsCollectionNotExists.id,
			siteId: articleDetailsCollectionNotExists.siteId
		},
		{
			_id: articleDetailsUnclassified.id,
			siteId: articleDetailsUnclassified.siteId
		}
	]
};





const userId = '3f330864-1c0f-443e-a6b3-cf8a3b536a52';
const displayName = 'testName';


const validToken = 'tafg342fefwef';

const systemToken = 'system-token';

const mocks = {
	needle: {
		get: function (url, callback) {
			var collectionExistsRegExp = new RegExp(mocks.env.livefyre.api.collectionExistsUrl
															.replace(/\{networkName\}/g, '([^\.\/]+)')
															.replace(/\{articleIdBase64\}/g, '(.*)')
															.replace(/\?/g, '\\?'));
			var matchCollectionExistsUrl = url.match(collectionExistsRegExp);


			if (matchCollectionExistsUrl && matchCollectionExistsUrl.length) {
				let networkName = matchCollectionExistsUrl[1];
				let articleIdBase64 = matchCollectionExistsUrl[2];
				let articleId = new Buffer(articleIdBase64, 'base64').toString();

				if (networkName !== mocks.env.livefyre.network.name) {
					callback(new Error("Network not found"));
					return;
				}

				if (articleId === articleDetails.id) {
					callback(null, {
						statusCode: 200
					});
					return;
				}

				if (articleId === articleDetailsCollectionNotExists.id) {
					callback(null, {
						statusCode: 404
					});
					return;
				}

				callback(null, {
					statusCode: 404
				});
			} else {
				callback(new Error("URL not matched."));
			}
		},
		post: function (url, callback) {
			var pingToPullRegExp = new RegExp(mocks.env.livefyre.api.pingToPullUrl
															.replace(/\{networkName\}/g, '([^\.\/]+)')
															.replace(/\{userId\}/g, '([^\.\/\?]+)')
															.replace(/\{token\}/g, '(.*)')
															.replace(/\?/g, '\\?'));
			var matchPingToPullUrl = url.match(pingToPullRegExp);


			if (matchPingToPullUrl && matchPingToPullUrl.length) {
				let networkName = matchPingToPullUrl[1];
				let thisUserId = matchPingToPullUrl[2];
				let token = matchPingToPullUrl[3];

				if (networkName !== mocks.env.livefyre.network.name) {
					callback(new Error("Network not found"));
					return;
				}

				if (token !== systemToken) {
					callback(new Error("System token invalid"));
					return;
				}

				if (userId === thisUserId) {
					callback(null, {
						statusCode: 200
					});
					return;
				}

				callback(new Error("Ping to pull error."));
			} else {
				callback(new Error("URL not matched."));
			}
		},
		'@global': true
	},
	env: {
		livefyre: {
			network: {
				name: 'ft',
				key: 'network-key'
			},
			defaultSiteId: 1412,
			siteKeys: {
				1: 'key1',
				2: 'key2',
				3: 'key3',
				415343: 'key415343',
				1412: 'key1412'
			},
			api: {
				collectionExistsUrl: 'http://{networkName}.collection-exists.livefyre.com/{articleIdBase64}',
				pingToPullUrl: 'http://{networkName}.ping-to-pull.livefyre.com/{userId}?token={token}',
				bootstrapUrl: 'http://bootstrap.{networkName}.fyre.co/bs3/{networkName}.fyre.co/{siteId}/{articleIdBase64}/bootstrap.html'
			}
		},
		mongo: {
			uri: 'mongo-uri-livefyre'
		},
		'@global': true
	}
};

const mongodbMock = new MongodbMock({
	dbMock: siteMappingMock,
	global: true
});
const livefyreMock = new LivefyreMock({
	systemToken: systemToken,
	validToken: validToken,
	global: true
});

const livefyreService = proxyquire('../../../app/services/livefyre.js', {
	'livefyre': livefyreMock.mock,
	'../../env': mocks.env,
	'needle': mocks.needle,
	'mongodb': mongodbMock.mock
});

describe('livefyreService', function() {
	describe('getCollectionDetails', function () {
		it('should return error if the UUID is unclassified', function (done) {
			livefyreService.getCollectionDetails({
				articleId: articleDetailsUnclassified.id,
				title: articleDetailsUnclassified.title,
				url: articleDetailsUnclassified.url
			}, function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return error if legacySiteMapping returns error', function (done) {
			livefyreService.getCollectionDetails({
				articleId: 'invalid-uuid',
				title: articleDetails.title,
				url: articleDetails.url
			}, function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return error if site key is not set', function (done) {
			livefyreService.getCollectionDetails({
				articleId: articleDetailsWithSiteIdNotSetUp.id,
				title: articleDetailsWithSiteIdNotSetUp.title,
				url: articleDetailsWithSiteIdNotSetUp.url
			}, function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return error if articleId is omitted', function (done) {
			livefyreService.getCollectionDetails({
				title: articleDetails.title,
				url: articleDetails.url
			}, function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return error if title is omitted', function (done) {
			livefyreService.getCollectionDetails({
				articleId: articleDetails.id,
				url: articleDetails.url
			}, function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return error if url is omitted', function (done) {
			livefyreService.getCollectionDetails({
				title: articleDetails.title,
				articleId: articleDetails.id
			}, function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return collection details without errors', function (done) {
			livefyreService.getCollectionDetails({
				articleId: articleDetails.id,
				title: articleDetails.title,
				url: articleDetails.url
			}, function (err, data) {
				assert.ok(!err, "Error is not returned.");
				assert.deepEqual(data, {
					siteId: articleDetails.siteId,
					articleId: articleDetails.id,
					collectionMeta: {
						collectionMeta: {
							tags: '',
							networkName: mocks.env.livefyre.network.name + '.fyre.co',
							networkKey: mocks.env.livefyre.network.key,
							siteId: articleDetails.siteId,
							siteKey: mocks.env.livefyre.siteKeys[articleDetails.siteId],
							streamType: 'livecomments',
							title: articleDetails.title,
							articleId: articleDetails.id,
							url: articleDetails.url
						}
					},
					checksum: {
						checksum: {
							tags: '',
							networkName: mocks.env.livefyre.network.name + '.fyre.co',
							networkKey: mocks.env.livefyre.network.key,
							siteId: articleDetails.siteId,
							siteKey: mocks.env.livefyre.siteKeys[articleDetails.siteId],
							streamType: 'livecomments',
							title: articleDetails.title,
							articleId: articleDetails.id,
							url: articleDetails.url
						}
					}
				}, "Collection details is correctly returned.");

				done();
			});
		});

		it('should return collection details with the tags provided (and escaped properly)', function (done) {
			livefyreService.getCollectionDetails({
				articleId: articleDetails.id,
				title: articleDetails.title,
				url: articleDetails.url,
				tags: ['tag1', 'tag2', 'tag 3']
			}, function (err, data) {
				assert.ok(!err, "Error is not returned.");
				assert.deepEqual(data, {
					siteId: articleDetails.siteId,
					articleId: articleDetails.id,
					collectionMeta: {
						collectionMeta: {
							tags: 'tag1,tag2,tag_3',
							networkName: mocks.env.livefyre.network.name + '.fyre.co',
							networkKey: mocks.env.livefyre.network.key,
							siteId: articleDetails.siteId,
							siteKey: mocks.env.livefyre.siteKeys[articleDetails.siteId],
							streamType: 'livecomments',
							title: articleDetails.title,
							articleId: articleDetails.id,
							url: articleDetails.url
						}
					},
					checksum: {
						checksum: {
							tags: 'tag1,tag2,tag_3',
							networkName: mocks.env.livefyre.network.name + '.fyre.co',
							networkKey: mocks.env.livefyre.network.key,
							siteId: articleDetails.siteId,
							siteKey: mocks.env.livefyre.siteKeys[articleDetails.siteId],
							streamType: 'livecomments',
							title: articleDetails.title,
							articleId: articleDetails.id,
							url: articleDetails.url
						}
					}
				}, "Collection details is correctly returned.");

				done();
			});
		});

		it('should return collection details with the provided stream_type', function (done) {
			livefyreService.getCollectionDetails({
				articleId: articleDetails.id,
				title: articleDetails.title,
				url: articleDetails.url,
				stream_type: 'liveblogs'
			}, function (err, data) {
				assert.ok(!err, "Error is not returned.");
				assert.deepEqual(data, {
					siteId: articleDetails.siteId,
					articleId: articleDetails.id,
					collectionMeta: {
						collectionMeta: {
							tags: '',
							networkName: mocks.env.livefyre.network.name + '.fyre.co',
							networkKey: mocks.env.livefyre.network.key,
							siteId: articleDetails.siteId,
							siteKey: mocks.env.livefyre.siteKeys[articleDetails.siteId],
							streamType: 'liveblogs',
							title: articleDetails.title,
							articleId: articleDetails.id,
							url: articleDetails.url
						}
					},
					checksum: {
						checksum: {
							tags: '',
							networkName: mocks.env.livefyre.network.name + '.fyre.co',
							networkKey: mocks.env.livefyre.network.key,
							siteId: articleDetails.siteId,
							siteKey: mocks.env.livefyre.siteKeys[articleDetails.siteId],
							streamType: 'liveblogs',
							title: articleDetails.title,
							articleId: articleDetails.id,
							url: articleDetails.url
						}
					}
				}, "Collection details is correctly returned.");

				done();
			});
		});
	});

	describe('getBootstrapUrl', function () {
		it('should return error if legacySiteMapping returns error', function (done) {
			livefyreService.getBootstrapUrl('invalid-uuid', function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return the URL', function (done) {
			livefyreService.getBootstrapUrl(articleDetails.id, function (err, data) {
				assert.ok(!err, "Error is not returned.");

				var url = mocks.env.livefyre.api.bootstrapUrl;
				url = url.replace(/\{networkName\}/g, mocks.env.livefyre.network.name);
				url = url.replace(/\{articleIdBase64\}/g, new Buffer(articleDetails.id).toString('base64'));
				url = url.replace(/\{siteId\}/g, articleDetails.siteId);

				assert.equal(data, url, "Bootstrap URL has the correct format and parameters.");

				done();
			});
		});
	});

	describe('collectionExists', function () {
		it('should return error if legacySiteMapping returns error', function (done) {
			livefyreService.collectionExists('invalid-uuid', function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return false if the collection does not exist', function (done) {
			livefyreService.collectionExists(articleDetailsCollectionNotExists.id, function (err, data) {
				assert.ok(!err, "Error is not returned.");
				assert.equal(data, false, "Collection does not exist.");

				done();
			});
		});

		it('should return true if the collection exists', function (done) {
			livefyreService.collectionExists(articleDetails.id, function (err, data) {
				assert.ok(!err, "Error is not returned.");
				assert.equal(data, true, "Collection exists.");

				done();
			});
		});
	});

	describe('generateAuthToken', function () {
		it('should return error if userId is omitted', function (done) {
			livefyreService.generateAuthToken({
				displayName: displayName
			}, function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return error if displayName is omitted', function (done) {
			livefyreService.generateAuthToken({
				userId: userId
			}, function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return token with default expires time', function (done) {
			livefyreService.generateAuthToken({
				userId: userId,
				displayName: displayName
			}, function (err, data) {
				assert.ok(!err, "Error is not returned.");
				assert.deepEqual(Object.keys(data), ['token', 'expires'], "Response has the expected fields.");
				assert.deepEqual(Object.keys(data.token), ['userId', 'displayName', 'expires'], "Token has the expected data.");
				assert.ok(Math.abs(new Date(new Date().getTime() + data.token.expires * 1000).getTime() - new Date(data.expires).getTime()) < 10, "Expires field and the expiration field in token point to the same date.");

				done();
			});
		});

		it('should return token with `expires` specified', function (done) {
			var start = new Date();
			var expiresIn = 60;
			livefyreService.generateAuthToken({
				userId: userId,
				displayName: displayName,
				expires: expiresIn
			}, function (err, data) {
				var end = new Date();

				assert.ok(!err, "Error is not returned.");
				assert.deepEqual(Object.keys(data), ['token', 'expires'], "Response has the expected fields.");
				assert.deepEqual(Object.keys(data.token), ['userId', 'displayName', 'expires'], "Token has the expected data.");
				assert.ok(Math.abs(new Date(new Date().getTime() + data.token.expires * 1000).getTime() - new Date(data.expires).getTime()) < 10, "Expires field and the expiration field in token point to the same date.");

				assert.ok(data.token.expires >= expiresIn - 1 && data.token.expires <= expiresIn + 1, "Expires value in the token states an expiration in approximately 24 hours.");
				assert.ok(data.expires >= new Date(start.getTime() + expiresIn * 1000).getTime() && data.expires <= new Date(end.getTime() + expiresIn * 1000).getTime(), "Expires value states an expiration data approximately in the specified time.");

				done();
			});
		});

		it('should return token with `expireAt` specified', function (done) {
			var start = new Date();
			var expiresIn = 60;
			var expiresAt = new Date(start.getTime() + expiresIn * 1000);
			livefyreService.generateAuthToken({
				userId: userId,
				displayName: displayName,
				expiresAt: expiresAt
			}, function (err, data) {
				assert.ok(!err, "Error is not returned.");
				assert.deepEqual(Object.keys(data), ['token', 'expires'], "Response has the expected fields.");
				assert.deepEqual(Object.keys(data.token), ['userId', 'displayName', 'expires'], "Token has the expected data.");
				assert.ok(Math.abs(new Date(new Date().getTime() + data.token.expires * 1000).getTime() - new Date(data.expires).getTime()) < 10, "Expires field and the expiration field in token point to the same date.");

				assert.ok(data.token.expires >= expiresIn - 1 && data.token.expires <= expiresIn + 1, "Expires value in the token states an expiration in approximately 24 hours.");
				assert.ok(Math.abs(data.expires - expiresAt.getTime()) < 10, "Expires value states an expiration data in the specified time.");

				done();
			});
		});
	});

	describe('validateToken', function () {
		it('should return false if the token is not valid', function () {
			var validation = livefyreService.validateToken('invalid-token');
			assert.equal(validation, false, "The token is not valid.");
		});

		it('should return false if the token is not valid', function () {
			var validation = livefyreService.validateToken(validToken);
			assert.equal(validation, true, "The token is valid.");
		});
	});

	describe('callPingToPull', function () {
		it('should return error if invalid user ID is specified', function (done) {
			livefyreService.callPingToPull('invalid-uuid', function (err) {
				assert.ok(err, "Error returned.");

				done();
			});
		});

		it('should call the service with no issues if valid user ID is specified', function (done) {
			livefyreService.callPingToPull(userId, function (err) {
				assert.ok(!err, "Error not returned.");

				done();
			});
		});
	});
});
