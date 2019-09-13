"use strict";

const consoleLogger = require('../../utils/consoleLogger');
const db = require('../../services/db');
const env = require('../../../env');
const crypto = require('../../utils/crypto');

function sendResponse(req, res, status, json) {
	var isJsonP = req.query.callback ? true : false;

	status = status || 200;

	res.status(isJsonP ? 200 : status).jsonp(json);
}

function validateApiKey(req, res, callback) {
	const apiKey = req.headers['x-api-key'] || req.query.apiKey;
	if (apiKey) {
		if (apiKey !== env.apiKeyForRestrictedEndpoints) {
			sendResponse(req, res, 401, {
				error: 'The API key is invalid.'
			});
			return false;
		} else {
			return true
		}
	} else {
		sendResponse(req, res, 400, {
			error: 'The API key is missing.'
		});
		return false;
	}
}

exports.available = function (req, res) {
	var pseudonym = req.params.pseudonym;

	if (validateApiKey(req, res)) {
		if (!pseudonym) {
			return res.status(400).json({
				success: false,
				error: 'Pseudonym is missing'
			});
		}

		db.getConnection(env.mongo.uri, function (errConn, connection) {
			if (errConn) {
				consoleLogger.warn(pseudonym, 'action failed', errConn);
				return res.status(503).json({
					success: false,
					error: 'Error with the connection to the database'
				});
			}

			var encryptedPseudonym = crypto.encrypt(pseudonym);

			connection.collection('users').find({
					'pseudonym': encryptedPseudonym
				}).toArray(function (errFindUsers, users) {
					if (errFindUsers) {
						return res.status(503).json({
							success: false,
							error: 'Error with finding the pseudonym from the users collection'
						});
					}

					return res.json({
						"available": users.length === 0
					});
			});
		});
	}
};
