"use strict";

var db = require('../services/db');
var consoleLogger = require('../modules/consoleLogger');

var defaultSiteId = parseInt(process.env.defaultSiteId, 10);

exports.getSiteId = function (articleId, callback) {
	if (typeof callback !== 'function') {
		throw new Error("legacySiteMapping.getSiteId: callback not provided");
	}

	try {
		db.getConnection(function (err, connection) {
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
					consoleLogger.log(articleId, 'legacyMapping, mapping found in DB');
					if (dbEntries[0].siteId === 'unclassified') {
						callback({
							unclassified: true
						});
						return;
					}

					callback(null, dbEntries[0].siteId);
				} else {
					consoleLogger.log(articleId, 'legacyMapping, mapping not found in DB');
					callback(null, defaultSiteId);
				}
			});
		});
	} catch (e) {
		callback(e);
	}
};
