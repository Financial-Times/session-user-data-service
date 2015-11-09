"use strict";

const assert = require('assert');
const proxyquire =  require('proxyquire');
const consoleLogger = require('../../../../app/utils/consoleLogger');
const _ = require('lodash');

const testData = require('./testData');

const crypto = proxyquire('../../../../app/utils/crypto', {
	'../../env': testData.mocks.env
});

consoleLogger.disable();


const SessionDataStore = proxyquire('../../../../app/dataHandlers/SessionDataStore.js', {
	mongodb: testData.mocks.mongodb,
	needle: testData.mocks.needle,
	livefyre: testData.mocks.livefyre,
	'../../env': testData.mocks.env
});

describe('SessionDataStore', function() {
	describe('getSessionData', function () {
		it('should throw error if no callback is provided', function () {
			let sessionDataStore = new SessionDataStore(testData.sessions.rememberMe.id);

			assert.throws(function () {
				sessionDataStore.getSessionData();
			}, Error);
		});

		it('should return error if no session ID is provided', function (done) {
			let sessionDataStore = new SessionDataStore();

			sessionDataStore.getSessionData(function (err, data) {
				assert.ok(err, "Error is set.");
				assert.ok(!data, "No data is set.");

				done();
			});
		});

		it('should return session data, and cache it (rememberMe)', function (done) {
			let sessionDataStore = new SessionDataStore(testData.sessions.rememberMe.id);

			sessionDataStore.getSessionData(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, _.pick(testData.sessions.rememberMe, ['uuid', 'creationTime', 'rememberMe']), "Session data correctly returned.");

				setTimeout(function () {
					var sessionCache = testData.mockInstances.mongodb.findInDb('sessions', {
						_id: testData.sessions.rememberMe.id
					});

					assert.equal(sessionCache.length, 1, "Cache is created.");
					assert.deepEqual(sessionCache[0].sessionData, _.pick(testData.sessions.rememberMe, ['uuid', 'creationTime', 'rememberMe']), "Data is cached.");
					assert.deepEqual(sessionCache[0].expireAt, new Date(testData.sessions.rememberMe.creationTime + testData.mocks.env.sessionValidityHours.remembered * 60 * 60 * 1000), "Expires in " + testData.mocks.env.sessionValidityHours.remembered + " hours after creation time.");

					done();
				}, 10);
			});
		});

		it('should return session data, and cache it (not rememberMe)', function (done) {
			let sessionDataStore = new SessionDataStore(testData.sessions.notRememberMe.id);

			sessionDataStore.getSessionData(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, _.pick(testData.sessions.notRememberMe, ['uuid', 'creationTime', 'rememberMe']), "Session data correctly returned.");

				setTimeout(function () {
					var sessionCache = testData.mockInstances.mongodb.findInDb('sessions', {
						_id: testData.sessions.notRememberMe.id
					});

					assert.equal(sessionCache.length, 1, "Cache is created.");
					assert.deepEqual(sessionCache[0].sessionData, _.pick(testData.sessions.notRememberMe, ['uuid', 'creationTime', 'rememberMe']), "Data is cached.");
					assert.deepEqual(sessionCache[0].expireAt, new Date(testData.sessions.notRememberMe.creationTime + testData.mocks.env.sessionValidityHours.notRemembered * 60 * 60 * 1000), "Expires in " + testData.mocks.env.sessionValidityHours.notRememberMe + " hours after creation time.");

					done();
				}, 10);
			});
		});


		it('should return session data, and cache it (rememberMe, almost expired)', function (done) {
			let sessionDataStore = new SessionDataStore(testData.sessions.rememberMeAlmostExpired.id);

			let startTime = new Date();
			sessionDataStore.getSessionData(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, _.pick(testData.sessions.rememberMeAlmostExpired, ['uuid', 'creationTime', 'rememberMe']), "Session data correctly returned.");

				setTimeout(function () {
					let endTime = new Date();

					var sessionCache = testData.mockInstances.mongodb.findInDb('sessions', {
						_id: testData.sessions.rememberMeAlmostExpired.id
					});

					assert.equal(sessionCache.length, 1, "Cache is created.");
					assert.deepEqual(sessionCache[0].sessionData, _.pick(testData.sessions.rememberMeAlmostExpired, ['uuid', 'creationTime', 'rememberMe']), "Data is cached.");
					assert.ok(sessionCache[0].expireAt >= new Date(startTime.getTime() + 4 * 60 * 60 * 1000) &&
							sessionCache[0].expireAt <= new Date(endTime.getTime() + 4 * 60 * 60 * 1000), "Expires in the minimum of 4 hours from now.");

					done();
				}, 10);
			});
		});

		it('should return session data, and cache it (not rememberMe, almost expired)', function (done) {
			let sessionDataStore = new SessionDataStore(testData.sessions.notRememberMeAlmostExpired.id);

			let startTime = new Date();
			sessionDataStore.getSessionData(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, _.pick(testData.sessions.notRememberMeAlmostExpired, ['uuid', 'creationTime', 'rememberMe']), "Session data correctly returned.");

				setTimeout(function () {
					let endTime = new Date();

					var sessionCache = testData.mockInstances.mongodb.findInDb('sessions', {
						_id: testData.sessions.notRememberMeAlmostExpired.id
					});

					assert.equal(sessionCache.length, 1, "Cache is created.");
					assert.deepEqual(sessionCache[0].sessionData, _.pick(testData.sessions.notRememberMeAlmostExpired, ['uuid', 'creationTime', 'rememberMe']), "Data is cached.");
					assert.ok(sessionCache[0].expireAt >= new Date(startTime.getTime() + 4 * 60 * 60 * 1000) &&
							sessionCache[0].expireAt <= new Date(endTime.getTime() + 4 * 60 * 60 * 1000), "Expires in the minimum of 4 hours from now.");

					done();
				}, 10);
			});
		});


		it('should return session data from cache if available', function (done) {
			let sessionDataStore = new SessionDataStore(testData.sessions.cached.id);

			sessionDataStore.getSessionData(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, testData.sessions.cached.initialCache.sessionData, "Session data correctly returned.");

				setTimeout(function () {
					var sessionCache = testData.mockInstances.mongodb.findInDb('sessions', {
						_id: testData.sessions.cached.id
					});

					assert.equal(sessionCache.length, 1, "Cache is still in place.");
					assert.deepEqual(sessionCache[0].expireAt, testData.sessions.cached.initialCache.expireAt, "Expiry time not modified.");

					done();
				}, 10);
			});
		});
	});

	describe('getAuthMetadata', function () {
		it('should throw error if no callback is provided', function () {
			let sessionDataStore = new SessionDataStore(testData.sessions.rememberMe.id);

			assert.throws(function () {
				sessionDataStore.getAuthMetadata();
			}, Error);
		});

		it('should return error if no session ID is provided', function (done) {
			let sessionDataStore = new SessionDataStore();

			sessionDataStore.getAuthMetadata(function (err, data) {
				assert.ok(err, "Error is set.");
				assert.ok(!data, "No data is set.");

				done();
			});
		});

		it('should return auth metadata from the cache', function (done) {
			let sessionDataStore = new SessionDataStore(testData.sessions.cached.id);

			sessionDataStore.getAuthMetadata(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, testData.sessions.cached.initialCache.authMetadata, "Auth metadata correctly read from cache and the pseudonym is decrypted.");

				setTimeout(function () {
					var sessionCache = testData.mockInstances.mongodb.findInDb('sessions', {
						_id: testData.sessions.cached.id
					});

					assert.equal(sessionCache.length, 1, "Cache is still in place.");
					assert.deepEqual(sessionCache[0].expireAt, testData.sessions.cached.initialCache.expireAt, "Expiry time not modified.");

					done();
				}, 10);
			});
		});

		it('should return pseudonym false if the user does not have a pseudonym', function (done) {
			let sessionDataStore = new SessionDataStore(testData.sessions.noPseudonym.id);

			sessionDataStore.getAuthMetadata(function (err, data) {
				assert.ok(!err, "Error is not set.");

				assert.equal(data, false, "Pseudonym false returned");

				setTimeout(function () {
					var sessionCache = testData.mockInstances.mongodb.findInDb('sessions', {
						_id: testData.sessions.noPseudonym.id
					});

					assert.equal(sessionCache.length, 1, "Session cache created.");
					assert.equal(sessionCache[0].authMetadata, undefined, "Session cache does not contain authMetadata.");

					done();
				}, 10);
			});
		});

		it('should return pseudonym false if the user does not have a pseudonym 2', function (done) {
			let sessionDataStore = new SessionDataStore(testData.sessions.noPseudonym.id);

			sessionDataStore.getAuthMetadata(function (err, data) {
				assert.ok(!err, "Error is not set.");

				assert.equal(data, false, "Pseudonym false returned");

				setTimeout(function () {
					var sessionCache = testData.mockInstances.mongodb.findInDb('sessions', {
						_id: testData.sessions.noPseudonym.id
					});

					assert.equal(sessionCache.length, 1, "Session cache created.");
					assert.equal(sessionCache[0].authMetadata, undefined, "Session cache does not contain authMetadata.");

					done();
				}, 10);
			});
		});

		it('should return authMetadata correctly if the user has a pseudonym, and caches it', function (done) {
			let sessionDataStore = new SessionDataStore(testData.sessions.withPseudonymNoEmailPreference.id);

			sessionDataStore.getAuthMetadata(function (err, data) {
				assert.ok(!err, "Error is not returned.");
				assert.deepEqual(Object.keys(data), ['token', 'expires', 'pseudonym', 'emailPreferences'], "Response has the expected fields.");
				assert.deepEqual(data.emailPreferences, null, "No email preference.");

				assert.deepEqual(Object.keys(data.token), ['userId', 'displayName', 'expires'], "Token has the expected fields.");
				assert.equal(data.token.userId, testData.users[testData.sessions.withPseudonymNoEmailPreference.uuid].deprecatedIds.erightsId, "ErightsID is used if available.");
				assert.equal(data.token.displayName, testData.users[testData.sessions.withPseudonymNoEmailPreference.uuid].userData.pseudonym, "Display name put into the token in a decrypyted form.");

				assert.deepEqual(new Date(data.expires), new Date(testData.sessions.withPseudonymNoEmailPreference.creationTime + testData.mocks.env.sessionValidityHours.remembered * 60 * 60 * 1000), "Expires in " + testData.mocks.env.sessionValidityHours.remembered + " hours after creation time.");
				assert.ok(Math.abs(new Date(new Date().getTime() + data.token.expires * 1000).getTime() - new Date(data.expires).getTime()) < 10, "Expires field and the expiration field in token point to the same date.");

				setTimeout(function () {
					var sessionCache = testData.mockInstances.mongodb.findInDb('sessions', {
						_id: testData.sessions.withPseudonymNoEmailPreference.id
					});

					assert.equal(sessionCache.length, 1, "Session cache created.");
					assert.deepEqual(sessionCache[0].authMetadata, _.extend({}, data, {pseudonym: crypto.encrypt(data.pseudonym)}), "authMetadata cached and pseudonym encrypted.");

					done();
				}, 10);
			});
		});

		it('should return authMetadata correctly if the user has a pseudonym and email preferences, and caches it', function (done) {
			let sessionDataStore = new SessionDataStore(testData.sessions.withCompleteUserInfo.id);

			sessionDataStore.getAuthMetadata(function (err, data) {
				assert.ok(!err, "Error is not returned.");
				assert.deepEqual(Object.keys(data), ['token', 'expires', 'pseudonym', 'emailPreferences'], "Response has the expected fields.");
				assert.deepEqual(data.emailPreferences, testData.users[testData.sessions.withCompleteUserInfo.uuid].userData.emailPreferences, "Email preference set.");

				assert.deepEqual(Object.keys(data.token), ['userId', 'displayName', 'expires'], "Token has the expected fields.");
				assert.equal(data.token.userId, testData.users[testData.sessions.withCompleteUserInfo.uuid].deprecatedIds.erightsId, "ErightsID is used if available.");
				assert.equal(data.token.displayName, testData.users[testData.sessions.withCompleteUserInfo.uuid].userData.pseudonym, "Display name put into the token in a decrypyted form.");

				assert.deepEqual(new Date(data.expires), new Date(testData.sessions.withCompleteUserInfo.creationTime + testData.mocks.env.sessionValidityHours.remembered * 60 * 60 * 1000), "Expires in " + testData.mocks.env.sessionValidityHours.remembered + " hours after creation time.");
				assert.ok(Math.abs(new Date(new Date().getTime() + data.token.expires * 1000).getTime() - new Date(data.expires).getTime()) < 10, "Expires field and the expiration field in token point to the same date.");

				setTimeout(function () {
					var sessionCache = testData.mockInstances.mongodb.findInDb('sessions', {
						_id: testData.sessions.withCompleteUserInfo.id
					});

					assert.equal(sessionCache.length, 1, "Session cache created.");
					assert.deepEqual(sessionCache[0].authMetadata, _.extend({}, data, {pseudonym: crypto.encrypt(data.pseudonym)}), "authMetadata cached and pseudonym encrypted.");

					done();
				}, 10);
			});
		});

		it('should return authMetadata with UUID only if the user does not have an eRights ID', function (done) {
			let sessionDataStore = new SessionDataStore(testData.sessions.withoutERightsId.id);

			sessionDataStore.getAuthMetadata(function (err, data) {
				assert.ok(!err, "Error is not returned.");
				assert.deepEqual(Object.keys(data), ['token', 'expires', 'pseudonym', 'emailPreferences'], "Response has the expected fields.");
				assert.deepEqual(data.emailPreferences, null, "No email preference.");

				assert.deepEqual(Object.keys(data.token), ['userId', 'displayName', 'expires'], "Token has the expected fields.");
				assert.equal(data.token.userId, testData.users[testData.sessions.withoutERightsId.uuid].id, "UUID is used if eRights ID is not available.");
				assert.equal(data.token.displayName, testData.users[testData.sessions.withoutERightsId.uuid].userData.pseudonym, "Display name put into the token in a decrypyted form.");

				assert.deepEqual(new Date(data.expires), new Date(testData.sessions.withoutERightsId.creationTime + testData.mocks.env.sessionValidityHours.remembered * 60 * 60 * 1000), "Expires in " + testData.mocks.env.sessionValidityHours.remembered + " hours after creation time.");
				assert.ok(Math.abs(new Date(new Date().getTime() + data.token.expires * 1000).getTime() - new Date(data.expires).getTime()) < 10, "Expires field and the expiration field in token point to the same date.");

				setTimeout(function () {
					var sessionCache = testData.mockInstances.mongodb.findInDb('sessions', {
						_id: testData.sessions.withoutERightsId.id
					});

					assert.equal(sessionCache.length, 1, "Session cache created.");
					assert.deepEqual(sessionCache[0].authMetadata, _.extend({}, data, {pseudonym: crypto.encrypt(data.pseudonym)}), "authMetadata cached and pseudonym encrypted.");

					done();
				}, 10);
			});
		});
	});

	describe('invalidate', function () {
		it('should delete the cache completely', function (done) {
			let sessionDataStore = new SessionDataStore(testData.sessions.cached2.id);

			var sessionCache = testData.mockInstances.mongodb.findInDb('sessions', {
				_id: testData.sessions.cached2.id
			});
			assert.equal(sessionCache.length, 1, "Session cache is in place.");

			sessionDataStore.invalidate(function () {
				sessionCache = testData.mockInstances.mongodb.findInDb('sessions', {
					_id: testData.sessions.cached2.id
				});

				assert.equal(sessionCache.length, 0, "Session cache deleted.");

				done();
			});
		});
	});
});
