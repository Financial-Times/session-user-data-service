"use strict";

const assert = require('assert');
const proxyquire =  require('proxyquire');
const consoleLogger = require('../../../app/utils/consoleLogger');

consoleLogger.disable();

var userId = '3f330864-1c0f-443e-a6b3-cf8a3b536a52';

const mocks = {
	needle: {
		get: function (url, params, callback) {
			if (!params || params.username !== mocks.env.emailService.auth.user || params.password !== mocks.env.emailService.auth.pass) {
				callback(new Error("Not authenticated."));
				return;
			}

			var match = url.match(new RegExp(mocks.env.emailService.url.replace(/\{userId\}/, '(.*)').replace('?', '\\?')));

			if (match && match.length) {
				if (match[1] === userId) {
					callback(null, {
						statusCode: 200,
						body: {
							email: 'testEmail',
							firstName: 'testFirstName',
							lastName: 'testLastName',
							otherParams: 'testOtherParams'
						}
					});
				} else {
					callback(null, {
						statusCode: 404
					});
				}
			} else {
				callback(new Error("Invalid URL provided."));
			}
		}
	},
	env: {
		emailService: {
			url: 'http://email-service/get?userId={userId}',
			auth: {
				user: 'testUser',
				pass: 'testPass'
			}
		}
	}
};

const email = proxyquire('../../../app/services/email.js', {
	needle: mocks.needle,
	'../../env': mocks.env
});

describe('emailService', function() {
	describe('getUserData', function () {
		it('should return error when the call to the service returns error', function (done) {
			email.getUserData('invalid-uuid', function (err, data) {
				assert.ok(err, "Error is returned.");
				assert.ok(data === undefined || data === null, "Data is not set.");

				done();
			});
		});

		it('should return article data without errors if valid UUID is provided', function (done) {
			email.getUserData(userId, function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, {
					email: 'testEmail',
					firstName: 'testFirstName',
					lastName: 'testLastName'
				}, "The response is returned and filtered to return only 'email', 'firstName' and 'lastName'.");

				done();
			});
		});


	});
});
