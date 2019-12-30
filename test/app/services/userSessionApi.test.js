"use strict";

const assert = require('assert');
const proxyquire =  require('proxyquire');
const consoleLogger = require('../../../app/utils/consoleLogger');

const RequestMock = require('../../../mocks/request');


consoleLogger.disable();

const sessions = {
	normal: {
		id: '15f24g4grg',
		sessionData: {
			"uuid": '3f330864-1c0f-443e-a6b3-cf8a3b536a52',
			"creationTime": 1443537221493,
			"rememberMe": true
		}
	}
};
let sessionsBySessId = {};
sessionsBySessId[sessions.normal.id] = sessions.normal.sessionData;

const env = {
	sessionApi: {
		url: 'http://session-api/get?sessionId={sessionId}',
		key: 'session-api-key'
	}
};

const requestMock = new RequestMock({
	items: [
		{
			url: env.sessionApi.url,
			handler: function (config) {
				if (!config.options || config.options.headers['FT-Api-Key'] !== env.sessionApi.key) {
					config.callback(null, {
						statusCode: 401
					});
					return;
				}

				if (sessionsBySessId[config.matches.queryParams.sessionId]) {
					config.callback(null, {
						statusCode: 200,
						body: JSON.stringify(sessionsBySessId[config.matches.queryParams.sessionId])
					});
				} else if (config.matches.queryParams.sessionId.indexOf('down') !== -1) {
					config.callback(null, {
						statusCode: 503
					});
				} else {
					config.callback(null, {
						statusCode: 401
					});
				}
			}
		}
	],
	global: true
});

const userSessionApi = proxyquire('../../../app/services/userSessionApi.js', {
	request: requestMock.mock,
	'../../env': env
});

describe('userSessionApi', function() {
	describe('getSessionData', function () {
		it('should return error when the call to the service returns error', function (done) {
			userSessionApi.getSessionData('service-down', function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should not return user details if the session is expired', function (done) {
			userSessionApi.getSessionData('invalid', function (err, data) {
				assert.ok(err, "Error is set.");
				assert.equal(err.statusCode, 401, "401 status code.");
				assert.equal(data, null, "Null is returned which shows that the session is not valid.");

				done();
			});
		});

		it('should return user details without errors if valid session ID is provided', function (done) {
			userSessionApi.getSessionData(sessions.normal.id, function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, sessions.normal.sessionData, "The response is returned and filtered to return only 'uuid', 'creationTime' and 'rememberMe'.");

				done();
			});
		});
	});
});
