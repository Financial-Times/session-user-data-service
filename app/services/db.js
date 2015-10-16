"use strict";

const env = require('../../env');
const MongoClient = require('mongodb').MongoClient;
let connection;


function getConnection (callback) {
	if (typeof callback !== 'function') {
		throw new Error("db.getConnection: callback not provided");
	}

	let callbackCalled = false;
	const callCallback = function (err, data) {
		if (!callbackCalled) {
			callbackCalled = true;

			callback(err, data);
		}
	};

	if (connection) {
		callCallback(null, connection);
		return;
	}

	MongoClient.connect(env.mongo.uri, function(err, dbConn) {
		if (err) {
			callCallback(err);
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
		callCallback(null, dbConn);
	});

	setTimeout(function () {
		callCallback({message: "Connection timeout"});
	}, 10000);
}

exports.getConnection = getConnection;
