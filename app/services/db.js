"use strict";

const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const consoleLogger = require('../utils/consoleLogger');
const Timer = require('../utils/Timer');
const EventEmitter = require('events');

const endTimer = function (timer) {
	let elapsedTime = timer.getElapsedTime();
	if (elapsedTime > 5000) {
		consoleLogger.warn('db.getConnection: service high response time', elapsedTime + 'ms');
	} else {
		consoleLogger.info('db.getConnection: service response time', elapsedTime + 'ms');
	}
};

const connections = {};
const evts = new EventEmitter();
let connInProgress = false;


function getConnection (uri, callback) {
	if (typeof callback !== 'function') {
		throw new Error("db.getConnection: callback not provided");
	}

	if (connections[uri]) {
		callback(null, connections[uri]);
		return;
	}


	let eventHandled = false;
	evts.once('complete', function (err, conn) {
		if (!eventHandled) {
			eventHandled = true;

			callback(err, conn);
		}
	});


	if (!connInProgress) {
		let timer = new Timer();

		MongoClient.connect(uri, function(err, dbConn) {
			endTimer(timer);

			if (err) {
				consoleLogger.warn('Mongo connection failed', err);

				evts.emit('complete', err);
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
			evts.emit('complete', null, dbConn);
		});

		setTimeout(function () {
			evts.emit('complete', {message: "Connection timeout"});
		}, 10000);
	}
}

exports.getConnection = getConnection;
