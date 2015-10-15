"use strict";

const env = require('../../env');
const MongoClient = require('mongodb').MongoClient;
let connection;


function getConnection (callback) {
	if (typeof callback !== 'function') {
		throw new Error("db.getConnection: callback not provided");
	}

	if (connection) {
		callback(null, connection);
		return;
	}

	MongoClient.connect(env.mongo.uri, function(err, dbConn) {
		if (err) {
			callback(err);
			return;
		}

		dbConn.on('close', function() {
			connection = null;

			if (this._callBackStore) {
				for(var key in this._callBackStore._notReplied) {
					if (this._callBackStore._notReplied.hasOwnProperty(key)) {
						this._callHandler(key, null, 'Connection Closed!');
					}
				}
			}
		});

		connection = dbConn;
		callback(null, dbConn);
	});
}

exports.getConnection = getConnection;
