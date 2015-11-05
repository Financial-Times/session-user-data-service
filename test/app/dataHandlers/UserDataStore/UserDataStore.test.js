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
	needle: testData.mocks.needle,
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


		it('should return eRightsID if the user has one, find by UUID, with only eRightsID saved', function (done) {
			let userDataStore = new UserDataStore(testData.users.withOnlyERightsIdSaved.uuid);

			userDataStore.getLivefyrePreferredUserId(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.equal(data, testData.users.withOnlyERightsIdSaved.eRightsId, "eRights ID is correctly returned.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.withOnlyERightsIdSaved.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry is still in place.");
					assert.deepEqual(userStorage[0]._id, testData.users.withOnlyERightsIdSaved.uuid, "_id is set");
					assert.deepEqual(userStorage[0].uuid, testData.users.withOnlyERightsIdSaved.uuid, "UUID is set");
					assert.deepEqual(userStorage[0].lfUserId, testData.users.withOnlyERightsIdSaved.eRightsId, "lfUserId is set");

					done();
				}, 10);
			});
		});

		it('should return eRightsID if the user has one, find by eRightsId, with only eRightsID saved', function (done) {
			let userDataStore = new UserDataStore(testData.users.withOnlyERightsIdSaved2.eRightsId);

			userDataStore.getLivefyrePreferredUserId(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.equal(data, testData.users.withOnlyERightsIdSaved2.eRightsId, "eRights ID is correctly returned.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.withOnlyERightsIdSaved2.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry is still in place.");
					assert.deepEqual(userStorage[0]._id, testData.users.withOnlyERightsIdSaved2.uuid, "_id is set");
					assert.deepEqual(userStorage[0].uuid, testData.users.withOnlyERightsIdSaved2.uuid, "UUID is set");
					assert.deepEqual(userStorage[0].lfUserId, testData.users.withOnlyERightsIdSaved2.eRightsId, "lfUserId is set");

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

		it('should return `null` if the user does not have a pseudonym', function (done) {
			let userDataStore = new UserDataStore(testData.users.withoutPseudonym.uuid);

			userDataStore.getPseudonym(function (err, data) {
				assert.ok(!err, "Error is not set.");
				assert.equal(data, null, "Null set.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.withoutPseudonym.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry created.");
					assert.deepEqual(userStorage[0]._id, testData.users.withoutPseudonym.uuid, "_id is set");
					assert.deepEqual(userStorage[0].uuid, testData.users.withoutPseudonym.uuid, "UUID is set");

					done();
				}, 10);
			});
		});

		it('should return the pseudonym if the user have one', function (done) {
			let userDataStore = new UserDataStore(testData.users.withPseudonym.uuid);

			userDataStore.getPseudonym(function (err, data) {
				console.log(data);
				assert.ok(!err, "Error is not set.");
				assert.equal(data, testData.users.withPseudonym.initialData.pseudonym, "Pseudonym returned in decrypted mode.");

				setTimeout(function () {
					var userStorage = testData.mockInstances.mongodb.findInDb('users', {
						_id: testData.users.withPseudonym.uuid
					});

					assert.equal(userStorage.length, 1, "DB entry created.");
					assert.deepEqual(userStorage[0]._id, testData.users.withPseudonym.uuid, "_id is set");
					assert.deepEqual(userStorage[0].uuid, testData.users.withPseudonym.uuid, "UUID is set");

					done();
				}, 10);
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

			userDataStore.setPseudonym('pseudonym', function (err, data) {
				assert.ok(err, "Error is set.");
				assert.ok(!data, "No data is set.");

				done();
			});
		});

		it('should return error if the user does not exist', function (done) {
			let userDataStore = new UserDataStore('notfound');

			userDataStore.setPseudonym('pseudonym', function (err, data) {
				assert.ok(err, "Error is set.");
				assert.ok(!data, "No data is set.");

				done();
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
	});

	describe('getUserData', function () {
		it('should throw error if no callback is provided', function () {
			let userDataStore = new UserDataStore(testData.users.withERightsId);

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
	});
});
