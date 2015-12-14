"use strict";

const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const consoleLogger = require('../utils/consoleLogger');
const Timer = require('../utils/Timer');

const endTimer = function (timer) {
	let elapsedTime = timer.getElapsedTime();
	if (elapsedTime > 5000) {
		consoleLogger.warn('db.getConnection: service high response time', elapsedTime + 'ms');
	} else {
		consoleLogger.info('db.getConnection: service response time', elapsedTime + 'ms');
	}
};

let connections = {};


function getConnection (uri, callback) {
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

	if (connections[uri]) {
		callCallback(null, connections[uri]);
		return;
	}


	let timer = new Timer();

	MongoClient.connect(uri, function(err, dbConn) {
		endTimer(timer);

		if (err) {
			consoleLogger.warn('Mongo connection failed', err);

			callCallback(err);
			return;
		}

		dbConn.on('close', function() {
			consoleLogger.warn('Mongo connection lost', err);

			connections[uri] = null;

			if (this._callBackStore) {
				for(var key in this._callBackStore._notReplied) {
					if (this._callBackStore._notReplied.hasOwnProperty(key)) {
						this._callHandler(key, null, 'Connection Closed!');
					}
				}
			}
		});

		connections[uri] = dbConn;
		callCallback(null, dbConn);
	});

	setTimeout(function () {
		callCallback({message: "Connection timeout"});
	}, 10000);
}

exports.getConnection = getConnection;
