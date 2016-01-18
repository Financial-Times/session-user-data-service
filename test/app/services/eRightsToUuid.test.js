"use strict";

const assert = require('assert');
const proxyquire =  require('proxyquire');
const consoleLogger = require('../../../app/utils/consoleLogger');

const RequestMock = require('../../../mocks/request');

consoleLogger.disable();


var userUuid = '3f330864-1c0f-443e-a6b3-cf8a3b536a52';
var eRightsId = 9352534;

var uuidWithoutErights = 'a86755e4-46a5-11e1-bc5f-00144feabdc0';

const env = {
	erightsToUuidService: {
		urls: {
			byUuid: 'http://erights-to-uuid/get?userId={userId}',
			byErights: 'http://erights-to-uuid/get?eRightsId={userId}'
		}
	}
};


var users = [
	{
		id: userUuid,
		deprecatedIds: {
			erightsId: eRightsId
		}
	},
	{
		id: uuidWithoutErights
	}
];
var usersByUuid = {};
usersByUuid[userUuid] = users[0];
usersByUuid[uuidWithoutErights] = users[1];

var usersByErights = {};
usersByErights[eRightsId] = users[0];

const requestMock = new RequestMock({
	items: [
		{
			url: env.erightsToUuidService.urls.byUuid,
			handler: function (config) {
				if (usersByUuid[config.matches.queryParams.userId]) {
					config.callback(null, {
						statusCode: 200,
						body: JSON.stringify({
							user: usersByUuid[config.matches.queryParams.userId]
						})
					});
				} else if (typeof usersByUuid[config.matches.queryParams.userId] === 'string' && usersByUuid[config.matches.queryParams.userId].indexOf('down') !== -1) {
					config.callback(null, {
						statusCode: 503
					});
				} else {
					config.callback(null, {
						statusCode: 404
					});
				}
			}
		},
		{
			url: env.erightsToUuidService.urls.byErights,
			handler: function (config) {
				if (usersByErights[config.matches.queryParams.eRightsId]) {
					config.callback(null, {
						statusCode: 200,
						body: JSON.stringify({
							user: usersByErights[config.matches.queryParams.eRightsId]
						})
					});
				} else if (typeof usersByErights[config.matches.queryParams.eRightsId] === 'string' && usersByErights[config.matches.queryParams.eRightsId].indexOf('down') !== -1) {
					config.callback(null, {
						statusCode: 503
					});
				} else {
					config.callback(null, {
						statusCode: 404
					});
				}
			}
		}
	],
	global: true
});

const eRightsToUuid = proxyquire('../../../app/services/eRightsToUuid.js', {
	request: requestMock.mock,
	'../../env': env
});

describe('eRightsToUuid', function() {
	describe('getUuid', function () {
		it('should return error when the call to the service returns error', function (done) {
			eRightsToUuid.getUuid('service-down', function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return the UUID without errors if valid UUID is provided', function (done) {
			eRightsToUuid.getUuid(userUuid, function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, userUuid, "The user's UUID is returned.");

				done();
			});
		});

		it('should return the UUID without errors if valid eRights ID is provided', function (done) {
			eRightsToUuid.getUuid(eRightsId, function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, userUuid, "The user's UUID is returned.");

				done();
			});
		});

		it('should return the UUID without errors if valid UUID is provided, even if the UUID does not have an eRightsId', function (done) {
			eRightsToUuid.getUuid(uuidWithoutErights, function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, uuidWithoutErights, "The user's UUID is returned.");

				done();
			});
		});

		it('should return null if the user does not exist', function (done) {
			eRightsToUuid.getUuid('not-found', function (err, data) {
				assert.ok(err, "Error is set.");
				assert.equal(err.statusCode, 404, "404 status code");
				assert.ok(data === undefined || data === null, "Data is null.");

				done();
			});
		});
	});

	describe('getERightsId', function () {
		it('should return error when the call to the service returns error', function (done) {
			eRightsToUuid.getERightsId('service-down', function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is null.");

				done();
			});
		});

		it('should return the eRights ID without errors if valid UUID is provided', function (done) {
			eRightsToUuid.getERightsId(userUuid, function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, eRightsId, "The user's eRights ID is returned.");

				done();
			});
		});

		it('should return the eRights ID without errors if valid eRights ID is provided', function (done) {
			eRightsToUuid.getERightsId(eRightsId, function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, eRightsId, "The user's eRights ID is returned.");

				done();
			});
		});

		it('should return null if the user does not have an eRights ID', function (done) {
			eRightsToUuid.getERightsId(uuidWithoutErights, function (err, data) {
				assert.ok(!err, "No error is returned.");
				assert.ok(data === undefined || data === null, "Data is null.");

				done();
			});
		});
	});
});
