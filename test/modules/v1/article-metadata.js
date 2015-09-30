"use strict";

var assert = require("assert");
var proxyquire =  require('proxyquire');


var lastArgs = {
	'ft-api-client': {}
};

var mocks = {
	'ft-api-client': function () {
		return {
			get: function (uuid) {
				lastArgs['ft-api-client'].get = uuid;

				return {
					then: function (callback, error) {
						if (uuid === '1') {
							callback(true);
							return;
						}

						error("Not found");
					}
				};
			}
		};
	}
};

var articleMetadata = proxyquire('../../../modules/v1/article-metadata.js', {
	'ft-api-client': mocks['ft-api-client']
});

describe('v1/livefyre/metadata', function() {
	describe('getArticleData', function () {
		it('should call ftApiClient with the UUID that exists', function (done) {
			articleMetadata.getArticleData('1', function (err, data) {
				assert.equal(lastArgs['ft-api-client'].get, '1', 'UUID passed correctly to ft-api-client');
				assert.equal(err, null, "Error is not set.");
				assert.equal(data, true, "ft-api-client's response is correctly returned.");

				done();
			});
		});

		it('should return error if ftApiClient responds with error', function (done) {
			articleMetadata.getArticleData('asd', function (err, data) {
				assert.equal(err, 'Not found', "ft-api-client's error is returnd");
				assert(data === undefined || data === null, "Data is not set.");

				done();
			});
		});
	});
});
