"use strict";

const assert = require('assert');
const proxyquire =  require('proxyquire');
const consoleLogger = require('../../../app/utils/consoleLogger');

consoleLogger.disable();

const mocks = {
	'ft-api-client': function () {
		return {
			get: function (uuid) {
				return {
					then: function (callback, error) {
						if (uuid === '109842b8-71f4-11e5-9b9e-690fdae72044') {
							callback({});
							return;
						}

						error(new Error("Not found"));
					}
				};
			}
		};
	}
};

const capi_v1 = proxyquire('../../../app/services/capi_v1.js', {
	'ft-api-client': mocks['ft-api-client']
});

describe('capi_v1', function() {
	describe('getArticleData', function () {
		it('should return article data when valid UUID is provided', function (done) {
			capi_v1.getArticleData('109842b8-71f4-11e5-9b9e-690fdae72044', function (err, data) {
				assert.equal(err, null, "Error is not set.");
				assert.ok(data && typeof data === 'object', "The response is correctly returned.");

				done();
			});
		});

		it('should return error if ftApiClient responds with error', function (done) {
			capi_v1.getArticleData('invalid-uuid', function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});
	});
});
