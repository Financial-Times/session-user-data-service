"use strict";

const assert = require('assert');
const proxyquire =  require('proxyquire');
const consoleLogger = require('../../../app/utils/consoleLogger');

consoleLogger.disable();

const mocks = {
	'mongodb': {
		MongoClient: {
			connect: function (connectionString, callback) {
				if (connectionString === 'invalid') {
					callback(new Error("Connection string not valid."));
				} else {
					callback(null, {
						on: () => {}
					});
				}
			}
		}
	}
};

const db = proxyquire('../../../app/services/db.js', {
	'mongodb': mocks['mongodb']
});

describe('db', function() {
	describe('getConnection', function () {
		it('should return an error when invalid connection string is provided', function (done) {
			db.getConnection('invalid', function (err, connection) {
				assert.ok(err, "Error is returned.");
				assert.ok(connection === undefined || connection === null, "No connection object is returned.");

				done();
			});
		});

		it('should return the connection object if a connection can be established', function (done) {
			db.getConnection('valid', function (err, connection) {
				assert.equal(err, null, "Error is not set.");
				assert.ok(connection && typeof connection === 'object', "Connection object is returned.");

				db.getConnection('valid', function (err, connectionSubs) {
					assert.equal(err, null, "Subsequent request: Error is not set.");
					assert.equal(connectionSubs, connection, "Subsequent request: The connection object on subsequent request is the same (cached).");
				});

				done();
			});
		});
	});
});
