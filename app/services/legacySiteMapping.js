"use strict";

const db = require('./db');
const env = require('../../env');

const defaultSiteId = parseInt(env.livefyre.defaultSiteId, 10);

exports.getSiteId = function (articleId, callback) {
	if (typeof callback !== 'function') {
		throw new Error("legacySiteMapping.getSiteId: callback not provided");
	}

	try {
		db.getConnection(env.mongo.uri, function (err, connection) {
			if (err) {
				callback(err);
				return;
			}

			connection.collection('legacy_site_mapping').find({
				_id: articleId
			}).toArray(function (err, dbEntries) {
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
	} catch (e) {
		callback(e);
	}
};
