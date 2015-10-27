"use strict";

const assert = require('assert');
const proxyquire =  require('proxyquire');
const consoleLogger = require('../../../app/utils/consoleLogger');

consoleLogger.disable();

var userId = '3f330864-1c0f-443e-a6b3-cf8a3b536a52';
var sessionId = '15f24g4grg';

const mocks = {
	needle: {
		get: function (url, params, callback) {
			if (!params || params.headers.FT_Api_Key !== mocks.env.sessionApi.key) {
				callback(new Error("Not authenticated."));
				return;
			}

			var match = url.match(new RegExp(mocks.env.sessionApi.url.replace(/\{sessionId\}/, '(.*)').replace('?', '\\?')));

			if (match && match.length) {
				if (match[1] === sessionId) {
					callback(null, {
						statusCode: 200,
						body: {
							"uuid": userId,
							"creationTime": 1443537221493,
							"rememberMe": true
						}
					});
				} else {
					callback(null, {
						statusCode: 401
					});
				}
			} else {
				callback(new Error("Invalid URL provided."));
			}
		}
	},
	env: {
		sessionApi: {
			url: 'http://session-api/get?sessionId={sessionId}',
			key: 'session-api-key'
		}
	}
};

const userSessionApi = proxyquire('../../../app/services/userSessionApi.js', {
	needle: mocks.needle,
	'../../env': mocks.env
});

describe('userSessionApi', function() {
	describe('getSessionData', function () {
		it('should return error when the call to the service returns error', function (done) {
			userSessionApi.getSessionData('invalid-or-expired-session', function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return user details without errors if valid session ID is provided', function (done) {
			userSessionApi.getSessionData(sessionId, function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, {
					"uuid": userId,
					"creationTime": 1443537221493,
					"rememberMe": true
				}, "The response is returned and filtered to return only 'uuid', 'creationTime' and 'rememberMe'.");

				done();
			});
		});


	});
});
