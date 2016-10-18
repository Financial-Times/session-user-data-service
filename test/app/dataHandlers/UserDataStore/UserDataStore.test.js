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


const UserDataStore = proxyquire('../../../../app/dataHandlers/UserDataStore.js', {
	mongodb: testData.mocks.mongodb,
	request: testData.mocks.request,
	'../../env': testData.mocks.env
});

describe('UserDataStore', function() {
	describe('getLivefyrePreferredUserId', function () {
		it('should throw error if no callback is provided', function () {
			let userDataStore = new UserDataStore(testData.users.withERightsId);

			assert.throws(function () {
				userDataStore.getLivefyrePreferredUserId();
			}, Error);
		});

		it('should return error if no user ID is provided', function (done) {
			let userDataStore = new UserDataStore();

			userDataStore.getLivefyrePreferredUserId(function (err, data) {
				assert.ok(err, "Error is set.");
				assert.ok(!data, "No data is set.");

				done();
			});
		});

		it('should return error if the user does not exist', function (done) {
			let userDataStore = new UserDataStore('notfound');

			userDataStore.getLivefyrePreferredUserId(function (err, data) {
				assert.ok(err, "Error is set.");
				assert.ok(!data, "No data is set.");

				done();
			});
		});

		it('should return eRightsID if the user has one, find by UUID, cache it', function (done) {
			let userDataStore = new UserDataStore(testData.users.withERightsId.uuid);

			userDataStore.getLivefyrePreferredUserId(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.equal(data, testData.users.withERightsId.eRightsId, "eRights ID is correctly returned.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.withERightsId.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry is created.");
					assert.deepEqual(userStorage[0]._id, testData.users.withERightsId.uuid, "_id is set");
					assert.deepEqual(userStorage[0].uuid, testData.users.withERightsId.uuid, "UUID is set");
					assert.deepEqual(userStorage[0].lfUserId, testData.users.withERightsId.eRightsId, "lfUserId is set");

					done();
				}, 10);
			});
		});

		it('should return eRightsID if the user has one, find by eRightsId, cache it', function (done) {
			let userDataStore = new UserDataStore(testData.users.withERightsId2.eRightsId);

			userDataStore.getLivefyrePreferredUserId(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.equal(data, testData.users.withERightsId2.eRightsId, "eRights ID is correctly returned.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.withERightsId2.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry is created.");
					assert.deepEqual(userStorage[0]._id, testData.users.withERightsId2.uuid, "_id is set");
					assert.deepEqual(userStorage[0].uuid, testData.users.withERightsId2.uuid, "UUID is set");
					assert.deepEqual(userStorage[0].lfUserId, testData.users.withERightsId2.eRightsId, "lfUserId is set");

					done();
				}, 10);
			});
		});

		it('should return UUID if the user has no eRigthtsId, find by UUID, cache it', function (done) {
			let userDataStore = new UserDataStore(testData.users.withoutERightsId.uuid);

			userDataStore.getLivefyrePreferredUserId(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.equal(data, testData.users.withoutERightsId.uuid, "UUID is correctly returned.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.withoutERightsId.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry is created.");
					assert.deepEqual(userStorage[0]._id, testData.users.withoutERightsId.uuid, "_id is set");
					assert.deepEqual(userStorage[0].uuid, testData.users.withoutERightsId.uuid, "UUID is set");
					assert.deepEqual(userStorage[0].lfUserId, testData.users.withoutERightsId.uuid, "lfUserId is set");

					done();
				}, 10);
			});
		});

		it('should return eRightsID if the user has one, find by UUID, with IDs already saved', function (done) {
			let userDataStore = new UserDataStore(testData.users.withIdsCached.uuid);

			userDataStore.getLivefyrePreferredUserId(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.equal(data, testData.users.withIdsCached.eRightsId, "eRights ID is correctly returned.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.withIdsCached.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry is still in place.");

					done();
				}, 10);
			});
		});

		it('should return eRightsID if the user has one, find by eRightsId, with IDs already saved', function (done) {
			let userDataStore = new UserDataStore(testData.users.withIdsCached.eRightsId);

			userDataStore.getLivefyrePreferredUserId(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.equal(data, testData.users.withIdsCached.eRightsId, "eRights ID is correctly returned.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.withIdsCached.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry is still in place.");

					done();
				}, 10);
			});
		});
	});

	describe('getPseudonym', function () {
		it('should throw error if no callback is provided', function () {
			let userDataStore = new UserDataStore(testData.users.withERightsId);

			assert.throws(function () {
				userDataStore.getPseudonym();
			}, Error);
		});

		it('should return error if no user ID is provided', function (done) {
			let userDataStore = new UserDataStore();

			userDataStore.getPseudonym(function (err, data) {
				assert.ok(err, "Error is set.");
				assert.ok(!data, "No data is set.");

				done();
			});
		});

		it('should return error if the user does not exist', function (done) {
			let userDataStore = new UserDataStore('notfound');

			userDataStore.getPseudonym(function (err, data) {
				assert.ok(err, "Error is set.");
				assert.ok(!data, "No data is set.");

				done();
			});
		});

		it('should return `null` if the user does not have a pseudonym, by UUID', function (done) {
			let userDataStore = new UserDataStore(testData.users.getPseudonymWithoutPseudonym.uuid);

			userDataStore.getPseudonym(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.equal(data, null, "Null set.");

				done();
			});
		});

		it('should return `null` if the user does not have a pseudonym, by eRightsId', function (done) {
			let userDataStore = new UserDataStore(testData.users.getPseudonymWithoutPseudonym2.eRightsId);

			userDataStore.getPseudonym(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.equal(data, null, "Null set.");

				done();
			});
		});

		it('should return the pseudonym if the user have one, by UUID', function (done) {
			let userDataStore = new UserDataStore(testData.users.getPseudonymWithPseudonym.uuid);

			userDataStore.getPseudonym(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.equal(data, testData.users.getPseudonymWithPseudonym.initialData.pseudonym, "Pseudonym returned in decrypted mode.");

				done();
			});
		});

		it('should return the pseudonym if the user have one, by eRightsId', function (done) {
			let userDataStore = new UserDataStore(testData.users.getPseudonymWithPseudonym2.eRightsId);

			userDataStore.getPseudonym(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.equal(data, testData.users.getPseudonymWithPseudonym2.initialData.pseudonym, "Pseudonym returned in decrypted mode.");

				done();
			});
		});
	});

	describe('setPseudonym', function () {
		it('should throw error if no callback is provided', function () {
			let userDataStore = new UserDataStore(testData.users.withERightsId);

			assert.throws(function () {
				userDataStore.setPseudonym('pseudonym');
			}, Error);
		});

		it('should return error if no user ID is provided', function (done) {
			let userDataStore = new UserDataStore();

			userDataStore.setPseudonym('pseudonym', function (err) {
				assert.ok(err, "Error is set.");

				done();
			});
		});

		it('should return error if the user does not exist', function (done) {
			let userDataStore = new UserDataStore('notfound');

			userDataStore.setPseudonym('pseudonym', function (err) {
				assert.ok(err, "Error is set.");
				done();
			});
		});

		it('should return error if the pseudonym is blank', function (done) {
			let userDataStore = new UserDataStore(testData.users.setPseudonymWithoutPseudonym.uuid);

			userDataStore.setPseudonym('', function (err) {
				assert.ok(err, "Error is set.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.setPseudonymWithoutPseudonym.uuid
					});

					assert.equal(userStorage.length, 0, "DB entry not created.");

					done();
				}, 10);
			});
		});

		it('should set the pseudonym if the user does not have it yet, by UUID', function (done) {
			let userDataStore = new UserDataStore(testData.users.setPseudonymWithoutPseudonym2.uuid);

			let pseudonym = 'testPs';
			userDataStore.setPseudonym(pseudonym, function (err) {
				assert.ok(!err, "Error is not set.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.setPseudonymWithoutPseudonym2.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry created.");
					assert.deepEqual(userStorage[0]._id, testData.users.setPseudonymWithoutPseudonym2.uuid, "_id is set");
					assert.deepEqual(userStorage[0].uuid, testData.users.setPseudonymWithoutPseudonym2.uuid, "UUID is set");
					assert.deepEqual(userStorage[0].pseudonym, crypto.encrypt(pseudonym), "Pseudonym is encrypted and saved.");

					done();
				}, 10);
			});
		});

		it('should set the pseudonym if the user does not have it yet, by eRightsId', function (done) {
			let userDataStore = new UserDataStore(testData.users.setPseudonymWithoutPseudonym3.eRightsId);

			let pseudonym = 'testPs';
			userDataStore.setPseudonym(pseudonym, function (err) {
				assert.ok(!err, "Error is not set.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.setPseudonymWithoutPseudonym3.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry created.");
					assert.deepEqual(userStorage[0]._id, testData.users.setPseudonymWithoutPseudonym3.uuid, "_id is set");
					assert.deepEqual(userStorage[0].uuid, testData.users.setPseudonymWithoutPseudonym3.uuid, "UUID is set");
					assert.deepEqual(userStorage[0].pseudonym, crypto.encrypt(pseudonym), "Pseudonym is encrypted and saved.");

					done();
				}, 10);
			});
		});


		it('should update the pseudonym if the user has one, by UUID', function (done) {
			let userDataStore = new UserDataStore(testData.users.setPseudonymWithPseudonym.uuid);

			let pseudonym = 'testPs';
			userDataStore.setPseudonym(pseudonym, function (err) {
				assert.ok(!err, "Error is not set.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.setPseudonymWithPseudonym.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry still in place.");
					assert.deepEqual(userStorage[0]._id, testData.users.setPseudonymWithPseudonym.uuid, "_id is set");
					assert.deepEqual(userStorage[0].uuid, testData.users.setPseudonymWithPseudonym.uuid, "UUID is set");
					assert.deepEqual(userStorage[0].pseudonym, crypto.encrypt(pseudonym), "Pseudonym is encrypted and saved.");

					done();
				}, 10);
			});
		});

		it('should update the pseudonym if the user has one, by eRightsId', function (done) {
			let userDataStore = new UserDataStore(testData.users.setPseudonymWithPseudonym2.eRightsId);

			let pseudonym = 'testPs';
			userDataStore.setPseudonym(pseudonym, function (err) {
				assert.ok(!err, "Error is not set.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.setPseudonymWithPseudonym2.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry still in place.");
					assert.deepEqual(userStorage[0]._id, testData.users.setPseudonymWithPseudonym2.uuid, "_id is set");
					assert.deepEqual(userStorage[0].uuid, testData.users.setPseudonymWithPseudonym2.uuid, "UUID is set");
					assert.deepEqual(userStorage[0].pseudonym, crypto.encrypt(pseudonym), "Pseudonym is encrypted and saved.");

					done();
				}, 10);
			});
		});
	});

	describe('emptyPseudonym', function () {
		it('should throw error if no callback is provided', function () {
			let userDataStore = new UserDataStore(testData.users.withERightsId);

			assert.throws(function () {
				userDataStore.emptyPseudonym();
			}, Error);
		});

		it('should return error if no user ID is provided', function (done) {
			let userDataStore = new UserDataStore();

			userDataStore.emptyPseudonym(function (err, data) {
				assert.ok(err, "Error is set.");
				assert.ok(!data, "No data is set.");

				done();
			});
		});

		it('should return error if the user does not exist', function (done) {
			let userDataStore = new UserDataStore('notfound');

			userDataStore.emptyPseudonym(function (err, data) {
				assert.ok(err, "Error is set.");
				assert.ok(!data, "No data is set.");

				done();
			});
		});



		it('should empty the pseudonym to null if the user does not have it yet, by UUID', function (done) {
			let userDataStore = new UserDataStore(testData.users.emptyPseudonymWithoutPseudonym.uuid);

			userDataStore.emptyPseudonym(function (err) {
				assert.ok(!err, "Error is not set.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.emptyPseudonymWithoutPseudonym.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry created.");
					assert.deepEqual(userStorage[0]._id, testData.users.emptyPseudonymWithoutPseudonym.uuid, "_id is set");
					assert.deepEqual(userStorage[0].uuid, testData.users.emptyPseudonymWithoutPseudonym.uuid, "UUID is set");
					assert.deepEqual(userStorage[0].pseudonym, null, "Pseudonym is encrypted and saved.");

					done();
				}, 10);
			});
		});

		it('should empty the pseudonym to null if the user does not have it yet, by eRightsId', function (done) {
			let userDataStore = new UserDataStore(testData.users.emptyPseudonymWithoutPseudonym2.eRightsId);

			userDataStore.emptyPseudonym(function (err) {
				assert.ok(!err, "Error is not set.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.emptyPseudonymWithoutPseudonym2.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry created.");
					assert.deepEqual(userStorage[0]._id, testData.users.emptyPseudonymWithoutPseudonym2.uuid, "_id is set");
					assert.deepEqual(userStorage[0].uuid, testData.users.emptyPseudonymWithoutPseudonym2.uuid, "UUID is set");
					assert.deepEqual(userStorage[0].pseudonym, null, "Pseudonym is encrypted and saved.");

					done();
				}, 10);
			});
		});


		it('should empty the pseudonym if the user has one, by UUID', function (done) {
			let userDataStore = new UserDataStore(testData.users.emptyPseudonymWithPseudonym.uuid);

			userDataStore.emptyPseudonym(function (err) {
				assert.ok(!err, "Error is not set.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.emptyPseudonymWithPseudonym.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry still in place.");
					assert.deepEqual(userStorage[0]._id, testData.users.emptyPseudonymWithPseudonym.uuid, "_id is set");
					assert.deepEqual(userStorage[0].uuid, testData.users.emptyPseudonymWithPseudonym.uuid, "UUID is set");
					assert.deepEqual(userStorage[0].pseudonym, null, "Pseudonym is encrypted and saved.");

					done();
				}, 10);
			});
		});

		it('should empty the pseudonym if the user has one, by eRightsId', function (done) {
			let userDataStore = new UserDataStore(testData.users.emptyPseudonymWithPseudonym2.eRightsId);

			userDataStore.emptyPseudonym(function (err) {
				assert.ok(!err, "Error is not set.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.emptyPseudonymWithPseudonym2.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry still in place.");
					assert.deepEqual(userStorage[0]._id, testData.users.emptyPseudonymWithPseudonym2.uuid, "_id is set");
					assert.deepEqual(userStorage[0].uuid, testData.users.emptyPseudonymWithPseudonym2.uuid, "UUID is set");
					assert.deepEqual(userStorage[0].pseudonym, null, "Pseudonym is encrypted and saved.");

					done();
				}, 10);
			});
		});
	});

	describe('getEmailPreferences', function () {
		it('should throw error if no callback is provided', function () {
			let userDataStore = new UserDataStore(testData.users.withERightsId);

			assert.throws(function () {
				userDataStore.getEmailPreferences();
			}, Error);
		});

		it('should return error if no user ID is provided', function (done) {
			let userDataStore = new UserDataStore();

			userDataStore.getEmailPreferences(function (err, data) {
				assert.ok(err, "Error is set.");
				assert.ok(!data, "No data is set.");

				done();
			});
		});

		it('should return error if the user does not exist', function (done) {
			let userDataStore = new UserDataStore('notfound');

			userDataStore.getEmailPreferences(function (err, data) {
				assert.ok(err, "Error is set.");
				assert.ok(!data, "No data is set.");

				done();
			});
		});


		it('should return `null` if the user does not have a pseudonym, by UUID', function (done) {
			let userDataStore = new UserDataStore(testData.users.getEmailPrefWithoutPref.uuid);

			userDataStore.getEmailPreferences(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.equal(data, null, "Null set.");

				done();
			});
		});

		it('should return `null` if the user does not have a pseudonym, by eRightsId', function (done) {
			let userDataStore = new UserDataStore(testData.users.getEmailPrefWithoutPref2.eRightsId);

			userDataStore.getEmailPreferences(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.equal(data, null, "Null set.");

				done();
			});
		});

		it('should return the email preferences if the user have them set, by UUID', function (done) {
			let userDataStore = new UserDataStore(testData.users.getEmailPrefWithPartialPref.uuid);

			userDataStore.getEmailPreferences(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, testData.users.getEmailPrefWithPartialPref.initialData.emailPreferences, "Saved email preferences returned.");

				done();
			});
		});

		it('should return the email preferences if the user have them set, by eRightsId', function (done) {
			let userDataStore = new UserDataStore(testData.users.getPseudonymWithPseudonym2.eRightsId);

			userDataStore.getEmailPreferences(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, testData.users.getPseudonymWithPseudonym2.initialData.emailPreferences, "Saved email preferences returned.");

				done();
			});
		});

		it('should return the email preferences if the user have them set, by UUID', function (done) {
			let userDataStore = new UserDataStore(testData.users.getEmailPrefWithPref.uuid);

			userDataStore.getEmailPreferences(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, testData.users.getEmailPrefWithPref.initialData.emailPreferences, "Saved email preferences returned.");

				done();
			});
		});

		it('should return the email preferences if the user have them set, by eRightsId', function (done) {
			let userDataStore = new UserDataStore(testData.users.getEmailPrefWithPref2.eRightsId);

			userDataStore.getEmailPreferences(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data, testData.users.getEmailPrefWithPref2.initialData.emailPreferences, "Saved email preferences returned.");

				done();
			});
		});
	});

	describe('setEmailPreferences', function () {
		it('should throw error if no callback is provided', function () {
			let userDataStore = new UserDataStore(testData.users.withERightsId);

			assert.throws(function () {
				userDataStore.setEmailPreferences({});
			}, Error);
		});

		it('should return error if no user ID is provided', function (done) {
			let userDataStore = new UserDataStore();

			userDataStore.setEmailPreferences({}, function (err, data) {
				assert.ok(err, "Error is set.");
				assert.ok(!data, "No data is set.");

				done();
			});
		});

		it('should return error if the user does not exist', function (done) {
			let userDataStore = new UserDataStore('notfound');

			userDataStore.setEmailPreferences({}, function (err, data) {
				assert.ok(err, "Error is set.");
				assert.ok(!data, "No data is set.");

				done();
			});
		});



		it('should return error if the `comments` field has invalid value', function (done) {
			let userDataStore = new UserDataStore(testData.users.setEmailPrefInv.uuid);

			let comments = 'daily';

			userDataStore.setEmailPreferences({
				comments: comments
			}, function (err) {
				assert.ok(err, "Error is set.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.setEmailPrefInv.uuid
					});

					assert.equal(userStorage.emailPreferences, undefined, "No email preference is saved.");

					done();
				}, 10);
			});
		});

		it('should return error if the `likes` field has invalid value', function (done) {
			let userDataStore = new UserDataStore(testData.users.setEmailPrefInv.uuid);

			let likes = 'now';

			userDataStore.setEmailPreferences({
				likes: likes
			}, function (err) {
				assert.ok(err, "Error is set.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.setEmailPrefInv.uuid
					});

					assert.equal(userStorage.emailPreferences, undefined, "No email preference is saved.");

					done();
				}, 10);
			});
		});

		it('should return error if the `replies` field has invalid value', function (done) {
			let userDataStore = new UserDataStore(testData.users.setEmailPrefInv.uuid);

			let replies = 'instantly';

			userDataStore.setEmailPreferences({
				replies: replies
			}, function (err) {
				assert.ok(err, "Error is set.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.setEmailPrefInv.uuid
					});

					assert.equal(userStorage.emailPreferences, undefined, "No email preference is saved.");

					done();
				}, 10);
			});
		});

		it('should return error if the `autoFollow` field has invalid value', function (done) {
			let userDataStore = new UserDataStore(testData.users.setEmailPrefInv.uuid);

			let autoFollow = 'off';

			userDataStore.setEmailPreferences({
				autoFollow: autoFollow
			}, function (err) {
				assert.ok(err, "Error is set.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.setEmailPrefInv.uuid
					});

					assert.equal(userStorage.emailPreferences, undefined, "No email preference is saved.");

					done();
				}, 10);
			});
		});

		it('should set the email preferences, no pref saved, by UUID', function (done) {
			let userDataStore = new UserDataStore(testData.users.setEmailPrefNoPrefSaved.uuid);

			let emailPreferences = {
				comments: 'never',
				likes: 'hourly',
				replies: 'immediately',
				autoFollow: false
			};
			userDataStore.setEmailPreferences(emailPreferences, function (err) {
				assert.ok(!err, "Error is not set.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.setEmailPrefNoPrefSaved.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry created.");
					assert.deepEqual(userStorage[0]._id, testData.users.setEmailPrefNoPrefSaved.uuid, "_id is set");
					assert.deepEqual(userStorage[0].uuid, testData.users.setEmailPrefNoPrefSaved.uuid, "UUID is set");
					assert.deepEqual(userStorage[0].emailPreferences, emailPreferences, "Email preferences is saved.");

					done();
				}, 10);
			});
		});


		it('should set the email preferences, no pref saved, by eRightsId', function (done) {
			let userDataStore = new UserDataStore(testData.users.setEmailPrefNoPrefSaved2.eRightsId);

			let emailPreferences = {
				comments: 'never',
				likes: 'hourly',
				replies: 'immediately',
				autoFollow: false
			};
			userDataStore.setEmailPreferences(emailPreferences, function (err) {
				assert.ok(!err, "Error is not set.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.setEmailPrefNoPrefSaved2.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry created.");
					assert.deepEqual(userStorage[0]._id, testData.users.setEmailPrefNoPrefSaved2.uuid, "_id is set");
					assert.deepEqual(userStorage[0].uuid, testData.users.setEmailPrefNoPrefSaved2.uuid, "UUID is set");
					assert.deepEqual(userStorage[0].emailPreferences, emailPreferences, "Email preferences is saved.");

					done();
				}, 10);
			});
		});


		it('should update the email preferences by merging it (maintaining the ones that are not updated), pref partially saved, by UUID', function (done) {
			let userDataStore = new UserDataStore(testData.users.setEmailPrefPartiallySaved.uuid);

			let emailPreferences = {
				likes: 'hourly',
				replies: 'immediately'
			};
			userDataStore.setEmailPreferences(emailPreferences, function (err) {
				assert.ok(!err, "Error is not set.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.setEmailPrefPartiallySaved.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry created.");
					assert.deepEqual(userStorage[0]._id, testData.users.setEmailPrefPartiallySaved.uuid, "_id is set");
					assert.deepEqual(userStorage[0].uuid, testData.users.setEmailPrefPartiallySaved.uuid, "UUID is set");
					assert.deepEqual(userStorage[0].emailPreferences,
							_.extend({}, testData.users.setEmailPrefPartiallySaved.initialData.emailPreferences, emailPreferences),
							"Email preferences is saved.");

					done();
				}, 10);
			});
		});


		it('should update the email preferences by merging it (maintaining the ones that are not updated), pref partially saved, by eRightsId', function (done) {
			let userDataStore = new UserDataStore(testData.users.setEmailPrefPartiallySaved2.uuid);

			let emailPreferences = {
				likes: 'hourly',
				replies: 'immediately'
			};
			userDataStore.setEmailPreferences(emailPreferences, function (err) {
				assert.ok(!err, "Error is not set.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.setEmailPrefPartiallySaved2.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry created.");
					assert.deepEqual(userStorage[0]._id, testData.users.setEmailPrefPartiallySaved2.uuid, "_id is set");
					assert.deepEqual(userStorage[0].uuid, testData.users.setEmailPrefPartiallySaved2.uuid, "UUID is set");
					assert.deepEqual(userStorage[0].emailPreferences,
							_.extend({}, testData.users.setEmailPrefPartiallySaved2.initialData.emailPreferences, emailPreferences),
							"Email preferences is saved.");

					done();
				}, 10);
			});
		});



		it('should update the email preferences by merging it (maintaining the ones that are not updated), pref fully saved, by UUID', function (done) {
			let userDataStore = new UserDataStore(testData.users.setEmailPrefFullySaved.uuid);

			let emailPreferences = {
				replies: 'hourly',
				autoFollow: true
			};
			userDataStore.setEmailPreferences(emailPreferences, function (err) {
				assert.ok(!err, "Error is not set.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.setEmailPrefFullySaved.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry created.");
					assert.deepEqual(userStorage[0]._id, testData.users.setEmailPrefFullySaved.uuid, "_id is set");
					assert.deepEqual(userStorage[0].uuid, testData.users.setEmailPrefFullySaved.uuid, "UUID is set");
					assert.deepEqual(userStorage[0].emailPreferences,
							_.extend({}, testData.users.setEmailPrefFullySaved.initialData.emailPreferences, emailPreferences),
							"Email preferences is saved.");

					done();
				}, 10);
			});
		});


		it('should update the email preferences by merging it (maintaining the ones that are not updated), pref fully saved, by eRightsId', function (done) {
			let userDataStore = new UserDataStore(testData.users.setEmailPrefFullySaved2.uuid);

			let emailPreferences = {
				replies: 'hourly',
				autoFollow: true
			};
			userDataStore.setEmailPreferences(emailPreferences, function (err) {
				assert.ok(!err, "Error is not set.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.setEmailPrefFullySaved2.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry created.");
					assert.deepEqual(userStorage[0]._id, testData.users.setEmailPrefFullySaved2.uuid, "_id is set");
					assert.deepEqual(userStorage[0].uuid, testData.users.setEmailPrefFullySaved2.uuid, "UUID is set");
					assert.deepEqual(userStorage[0].emailPreferences,
							_.extend({}, testData.users.setEmailPrefFullySaved2.initialData.emailPreferences, emailPreferences),
							"Email preferences is saved.");

					done();
				}, 10);
			});
		});
	});

	describe('getUserData', function () {
		it('should throw error if no callback is provided', function () {
			let userDataStore = new UserDataStore(testData.users.withERightsId.uuid);

			assert.throws(function () {
				userDataStore.getUserData();
			}, Error);
		});

		it('should return error if no user ID is provided', function (done) {
			let userDataStore = new UserDataStore();

			userDataStore.getUserData(function (err, data) {
				assert.ok(err, "Error is set.");
				assert.ok(!data, "No data is set.");

				done();
			});
		});

		it('should return error if the user does not exist', function (done) {
			let userDataStore = new UserDataStore('notfound');

			userDataStore.getUserData(function (err, data) {
				assert.ok(err, "Error is set.");
				assert.ok(!data, "No data is set.");

				done();
			});
		});


		it('should return error if the email service is down and the user does not have his data saved', function (done) {
			let userDataStore = new UserDataStore('service-down');

			userDataStore.getUserData(function (err, data) {
				assert.ok(err, "Error is set.");
				assert.ok(!data, "No data is set.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: 'service-down'
					});

					assert.equal(userStorage.length, 0, "DB entry not created.");

					done();
				}, 10);
			});
		});

		it('should fetch from the email service, do not cache the email and return the user\'s data, by UUID', function (done) {
			let userDataStore = new UserDataStore(testData.users.getUserDataWithoutInternalData.uuid);

			userDataStore.getUserData(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data,
					_.extend({
						uuid: testData.users.getUserDataWithoutInternalData.uuid,
						lfUserId: testData.users.getUserDataWithoutInternalData.eRightsId,
					}, testData.users.getUserDataWithoutInternalData.basicUserInfo), "Data is correct.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.getUserDataWithoutInternalData.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry created.");
					assert.deepEqual(userStorage[0]._id, testData.users.getUserDataWithoutInternalData.uuid, "_id is set");
					assert.deepEqual(userStorage[0].uuid, testData.users.getUserDataWithoutInternalData.uuid, "UUID is set");
					assert.deepEqual(userStorage[0].lfUserId, testData.users.getUserDataWithoutInternalData.eRightsId, "lfUserId is set");
					assert.ok(!userStorage[0].hasOwnProperty('email'), "Email is not cached.");
					assert.ok(!userStorage[0].hasOwnProperty('firstName'), "First name is not cached.");
					assert.ok(!userStorage[0].hasOwnProperty('lastName'), "Last name is not cached.");

					done();
				}, 10);
			});
		});

		it('should fetch from the email service, do not cache the email and return the user\'s data, by eRightsId', function (done) {
			let userDataStore = new UserDataStore(testData.users.getUserDataWithoutInternalData2.eRightsId);

			userDataStore.getUserData(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data,
					_.extend({
						uuid: testData.users.getUserDataWithoutInternalData2.uuid,
						lfUserId: testData.users.getUserDataWithoutInternalData2.eRightsId,
					}, testData.users.getUserDataWithoutInternalData2.basicUserInfo), "Data is correct.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.getUserDataWithoutInternalData2.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry created.");
					assert.deepEqual(userStorage[0]._id, testData.users.getUserDataWithoutInternalData2.uuid, "_id is set");
					assert.deepEqual(userStorage[0].uuid, testData.users.getUserDataWithoutInternalData2.uuid, "UUID is set");
					assert.deepEqual(userStorage[0].lfUserId, testData.users.getUserDataWithoutInternalData2.eRightsId, "lfUserId is set");
					assert.ok(!userStorage[0].hasOwnProperty('email'), "Email is not cached.");
					assert.ok(!userStorage[0].hasOwnProperty('firstName'), "First name is not cached.");
					assert.ok(!userStorage[0].hasOwnProperty('lastName'), "Last name is not cached.");

					done();
				}, 10);
			});
		});


		it('should fetch from the email service, do not cache the email and return the user\'s data, by UUID', function (done) {
			let userDataStore = new UserDataStore(testData.users.getUserDataWithInternalData.uuid);

			userDataStore.getUserData(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data,
					_.extend({
						uuid: testData.users.getUserDataWithInternalData.uuid,
						lfUserId: testData.users.getUserDataWithInternalData.eRightsId,
						pseudonym: testData.users.getUserDataWithInternalData.initialData.pseudonym,
						emailPreferences: testData.users.getUserDataWithInternalData.initialData.emailPreferences
					}, testData.users.getUserDataWithInternalData.basicUserInfo), "Data is correct.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.getUserDataWithInternalData.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry created.");
					assert.ok(!userStorage[0].hasOwnProperty('email'), "Email is not cached.");
					assert.ok(!userStorage[0].hasOwnProperty('firstName'), "First name is not cached.");
					assert.ok(!userStorage[0].hasOwnProperty('lastName'), "Last name is not cached.");

					done();
				}, 10);
			});
		});

		it('should fetch from the email service, do not cache the email and return the user\'s data, by eRightsId', function (done) {
			let userDataStore = new UserDataStore(testData.users.getUserDataWithInternalData2.eRightsId);

			userDataStore.getUserData(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data,
					_.extend({
						uuid: testData.users.getUserDataWithInternalData2.uuid,
						lfUserId: testData.users.getUserDataWithInternalData2.eRightsId,
						pseudonym: testData.users.getUserDataWithInternalData2.initialData.pseudonym,
						emailPreferences: testData.users.getUserDataWithInternalData2.initialData.emailPreferences
					}, testData.users.getUserDataWithInternalData2.basicUserInfo), "Data is correct.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.getUserDataWithInternalData2.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry created.");
					assert.ok(!userStorage[0].hasOwnProperty('email'), "Email is not cached.");
					assert.ok(!userStorage[0].hasOwnProperty('firstName'), "First name is not cached.");
					assert.ok(!userStorage[0].hasOwnProperty('lastName'), "Last name is not cached.");

					done();
				}, 10);
			});
		});



		it('should fetch from the email service, do not cache email and return the user\'s data, without eRightsId', function (done) {
			let userDataStore = new UserDataStore(testData.users.getUserDataWithoutERightsId.uuid);

			userDataStore.getUserData(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.deepEqual(data,
					_.extend({
						uuid: testData.users.getUserDataWithoutERightsId.uuid,
						lfUserId: testData.users.getUserDataWithoutERightsId.uuid,
					}, testData.users.getUserDataWithoutERightsId.basicUserInfo), "Data is correct.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.getUserDataWithoutERightsId.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry created.");
					assert.deepEqual(userStorage[0]._id, testData.users.getUserDataWithoutERightsId.uuid, "_id is set");
					assert.deepEqual(userStorage[0].uuid, testData.users.getUserDataWithoutERightsId.uuid, "UUID is set");
					assert.deepEqual(userStorage[0].lfUserId, testData.users.getUserDataWithoutERightsId.uuid, "lfUserId is set");
					assert.ok(!userStorage[0].hasOwnProperty('email'), "Email is not cached.");
					assert.ok(!userStorage[0].hasOwnProperty('firstName'), "First name is not cached.");
					assert.ok(!userStorage[0].hasOwnProperty('lastName'), "Last name is not cached.");

					done();
				}, 10);
			});
		});
	});
});
