"use strict";

const db = require('./db');
const env = require('../../env');
const Timer = require('../utils/Timer');
const consoleLogger = require('../utils/consoleLogger');

const endTimer = function (timer, articleId) {
	let elapsedTime = timer.getElapsedTime();
	if (elapsedTime > 5000) {
		consoleLogger.warn(articleId, 'legacySiteMapping.getSiteId: service high response time', elapsedTime + 'ms');
	} else {
		consoleLogger.info(articleId, 'legacySiteMapping.getSiteId: service response time', elapsedTime + 'ms');
	}
};

const defaultSiteId = parseInt(env.livefyre.defaultSiteId, 10);

exports.getSiteId = function (articleId, callback) {
	if (typeof callback !== 'function') {
		throw new Error("legacySiteMapping.getSiteId: callback not provided");
	}

	let timer = new Timer();

	db.getConnection(env.mongo.uri, function (err, connection) {
		if (err) {
			callback(err);
			return;
		}

		connection.collection('legacy_site_mapping').find({
			_id: articleId
		}).toArray(function (err, dbEntries) {
			endTimer(timer, articleId);

			if (err) {
				callback(err);
				return;
			}

			if (dbEntries && dbEntries.length && dbEntries[0].siteId) {
				if (dbEntries[0].siteId === 'unclassified') {
					callback({
						unclassified: true
					});
					return;
				}

				callback(null, dbEntries[0].siteId);
			} else {
				callback(null, defaultSiteId);
			}
		});
	});
};
