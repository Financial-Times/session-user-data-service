"use strict";

const assert = require('assert');
const proxyquire =  require('proxyquire');
const consoleLogger = require('../../../app/utils/consoleLogger');
const _ = require('lodash');

const NeedleMock = require('../../../mocks/needle');


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

const needleMock = new NeedleMock({
	env: env,
	usersEmailService: userData,
	global: true
});

const email = proxyquire('../../../app/services/email.js', {
	needle: needleMock.mock,
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
