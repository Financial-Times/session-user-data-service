"use strict";

const assert = require('assert');
const proxyquire =  require('proxyquire');
const consoleLogger = require('../../../app/utils/consoleLogger');
const FtApiClientMock = require('../../../mocks/ft-api-client');

consoleLogger.disable();

var articleId = '109842b8-71f4-11e5-9b9e-690fdae72044';
var articleData = {};
articleData[articleId] = {};

var ftApiClientMock = new FtApiClientMock({
	articleData: articleData
});

const capi_v1 = proxyquire('../../../app/services/capi_v1.js', {
	'ft-api-client': ftApiClientMock.mock
});

describe('capi_v1', function() {
	describe('getArticleData', function () {
		it('should return article data when valid UUID is provided', function (done) {
			capi_v1.getArticleData(articleId, function (err, data) {
				assert.equal(err, null, "Error is not set.");
				assert.ok(data && typeof data === 'object', "The response is correctly returned.");

				done();
			});
		});

		it('should return error if ftApiClient responds with error', function (done) {
			capi_v1.getArticleData('capi-down', function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});
	});
});
