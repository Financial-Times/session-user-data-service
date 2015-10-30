"use strict";

const assert = require('assert');
const proxyquire =  require('proxyquire');
const consoleLogger = require('../../../app/utils/consoleLogger');
const MongodbMock = require('../../../mocks/mongodb');

consoleLogger.disable();

var articleId = '3f330864-1c0f-443e-a6b3-cf8a3b536a52';
var siteIdForArticleId = 5142;

var articleIdUnclassified = 'a86755e4-46a5-11e1-bc5f-00144feabdc0';

const mocks = {
	env: {
		livefyre: {
			defaultSiteId: 1412
		},
		mongo: {
			uri: 'mongo-uri-legacySiteMapping'
		},
		'@global': true
	}
};
var mongoUri = mocks.env.mongo.uri;


var mongodbMock = new MongodbMock({
	dbMock: {
		'legacy_site_mapping': [
			{
				_id: articleId,
				siteId: siteIdForArticleId
			},
			{
				_id: articleIdUnclassified,
				siteId: 'unclassified'
			}
		]
	},
	global: true
});

const legacySiteMapping = proxyquire('../../../app/services/legacySiteMapping.js', {
	'mongodb': mongodbMock.mock,
	'../../env': mocks.env
});

describe('legacySiteMapping', function() {
	describe('getSiteId', function () {
		it('should return error when no connection could be obtained with MongoDB', function (done) {
			mocks.env.mongo.uri = 'invalid';

			legacySiteMapping.getSiteId('invalid-uuid', function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "No siteId returned.");

				done();
			});
		});

		it('should return siteId from the mapping file if the UUID is found in the MongoDB', function (done) {
			mocks.env.mongo.uri = mongoUri;

			legacySiteMapping.getSiteId(articleId, function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.equal(data, siteIdForArticleId, "Site ID is returned from the mapping file.");

				done();
			});
		});

		it('should return unclassified response if the UUID is found in the MongoDB with the flag `unclassified`', function (done) {
			mocks.env.mongo.uri = mongoUri;

			legacySiteMapping.getSiteId(articleIdUnclassified, function (err, data) {
				assert.deepEqual(err, {
					unclassified: true
				}, "Unclassified response is returned.");
				assert.ok(data === undefined || data === null, "No siteId returned.");

				done();
			});
		});

		it('should return the default site ID if the UUID is not found in the MongoDB', function (done) {
			mocks.env.mongo.uri = mongoUri;

			legacySiteMapping.getSiteId('any-other-id', function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, mocks.env.livefyre.defaultSiteId, "Default site ID is returned.");

				done();
			});
		});
	});
});
