"use strict";

const assert = require('assert');
const proxyquire =  require('proxyquire');
const consoleLogger = require('../../../app/utils/consoleLogger');

consoleLogger.disable();

var userUuid = '3f330864-1c0f-443e-a6b3-cf8a3b536a52';
var eRightsId = 9352534;

var uuidWithoutErights = 'a86755e4-46a5-11e1-bc5f-00144feabdc0';

const mocks = {
	needle: {
		get: function (url, callback) {
			var byUuid = url.match(new RegExp(mocks.env.erightsToUuidService.urls.byUuid.replace(/\{userId\}/, '(.*)').replace('?', '\\?')));
			var byErightsId = url.match(new RegExp(mocks.env.erightsToUuidService.urls.byErights.replace(/\{userId\}/, '(.*)').replace('?', '\\?')));

			var id;
			if (byUuid || byErightsId) {
				if (byUuid && byUuid.length) {
					id = byUuid[1];
				} else if (byErightsId && byErightsId.length) {
					id = byErightsId[1];
				}

				if (id === userUuid || parseInt(id, 10) === eRightsId) {
					callback(null, {
						statusCode: 200,
						body: {
							"user": {
								"id": userUuid,
								"deprecatedIds": {
									"erightsId": eRightsId
								}
							}
						}
					});
				} else if (id === uuidWithoutErights) {
					callback(null, {
						statusCode: 200,
						body: {
							"user": {
								"id": userUuid
							}
						}
					});
				} else {
					callback(null, {
						statusCode: 404
					});
				}
			} else {
				callback(new Error("Invalid URL."));
			}
		}
	},
	env: {
		erightsToUuidService: {
			urls: {
				byUuid: 'http://erights-to-uuid/get?userId={userId}',
				byErights: 'http://erights-to-uuid/get?eRightsId={userId}'
			}
		}
	}
};

const eRightsToUuid = proxyquire('../../../app/services/eRightsToUuid.js', {
	needle: mocks.needle,
	'../../env': mocks.env
});

describe('eRightsToUuid', function() {
	describe('getUuid', function () {
		it('should return error when the call to the service returns error', function (done) {
			eRightsToUuid.getUuid('not-found-user-id', function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.equal(err.statusCode, 404, "Status code 404 is set on the error.");
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
	});

	describe('getERightsId', function () {
		it('should return error when the call to the service returns error', function (done) {
			eRightsToUuid.getERightsId('not-found-user-id', function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.equal(err.statusCode, 404, "Status code 404 is set on the error.");
				assert.ok(data === undefined || data === null, "Data is not set.");

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

		it('should return error if the user does not have an eRights ID', function (done) {
			eRightsToUuid.getERightsId(uuidWithoutErights, function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.equal(err.statusCode, 404, "Status code 404 is set on the error.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});
	});
});
