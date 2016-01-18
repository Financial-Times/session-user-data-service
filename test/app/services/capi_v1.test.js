"use strict";

const assert = require('assert');
const proxyquire =  require('proxyquire');
const consoleLogger = require('../../../app/utils/consoleLogger');
const RequestMock = require('../../../mocks/request');

consoleLogger.disable();

var articleId = '109842b8-71f4-11e5-9b9e-690fdae72044';
var articleData = {};
articleData[articleId] = {};

const env = {
	capi: {
		key: '324ef',
		url: 'http://api.ft.com/{uuid}?key={apiKey}'
	},
	'@global': true
};

var requestMock = new RequestMock({
	items: [
		{
			url: env.capi.url,
			handler: function (config) {
				if (config.matches.urlParams.uuid && config.matches.urlParams.uuid.indexOf('down') !== -1) {
					config.callback(null, {
						statusCode: 503
					});
					return;
				}

				if (config.matches.queryParams.key !== env.capi.key) {
					config.callback(null, {
						statusCode: 403
					});
					return;
				}

				if (config.matches.urlParams.uuid === articleId) {
					config.callback(null, {
						statusCode: 200,
						body: JSON.stringify(articleData[config.matches.urlParams.uuid])
					});

					return;
				} else {
					config.callback(null, {
						statusCode: 404
					});
					return;
				}
			}
		},
	],
	global: true
});

const capi_v1 = proxyquire('../../../app/services/capi_v1.js', {
	'request': requestMock.mock,
	'../../env': env
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
