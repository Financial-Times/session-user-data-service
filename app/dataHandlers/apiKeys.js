"use strict";

const db = require('../services/db');
const consoleLogger = require('../utils/consoleLogger');
const mongoSanitize = require('mongo-sanitize');
const env = require('../../env');

exports.validate = function (apiKey, callback) {
	db.getConnection(env.mongo.uri, function (errConn, connection) {
		if (errConn) {
			callback(errConn);
			consoleLogger.warn('No Mongo connection', errConn);
			return;
		}

		connection.collection('apiKeys').find({
			_id: mongoSanitize(apiKey)
		}).maxTimeMS(env.timeouts.queries).toArray(function (errDb, data) {
			if (errDb) {
				callback(errDb);
				consoleLogger.warn('error validating the api key', errDb);
				return;
			}

			if (data && data.length) {
				callback(null, true);
			} else {
				callback(null, false);
			}
		});
	});
};
