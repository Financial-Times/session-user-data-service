"use strict";

const assert = require('assert');
const proxyquire =  require('proxyquire');
const consoleLogger = require('../../../app/utils/consoleLogger');
const _ = require('lodash');

const RequestMock = require('../../../mocks/request');


consoleLogger.disable();

var userId = '3f330864-1c0f-443e-a6b3-cf8a3b536a52';
var userData = {};
userData[userId] = {
	email: 'testEmail',
	firstName: 'testFirstName',
	lastName: 'testLastName',
	otherParams: 'testOtherParams'
};

const env = {
	emailService: {
		url: 'http://email-service/get?userId={userId}',
		auth: {
			user: 'testUser',
			pass: 'testPass'
		}
	}
};

const requestMock = new RequestMock({
	items: [
		{
			url: env.emailService.url,
			handler: function (config) {
				if (!config.params || config.params.username !== env.emailService.auth.user || config.params.password !== env.emailService.auth.pass) {
					config.callback(null, {
						statusCode: 401
					});
					return;
				}

				if (userData[config.matches.queryParams.userId] !== -1) {
					config.callback(null, {
						statusCode: 200,
						body: JSON.stringify(userData[config.matches.queryParams.userId])
					});
				} else if (typeof config.matches.queryParams.userId === 'string' && config.matches.queryParams.userId.indexOf('down') !== -1) {
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

const email = proxyquire('../../../app/services/email.js', {
	request: requestMock.mock,
	'../../env': env
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
				assert.deepEqual(data, _.pick(userData[userId], ['email', 'firstName', 'lastName']), "The response is returned and filtered to return only 'email', 'firstName' and 'lastName'.");

				done();
			});
		});
	});
});
