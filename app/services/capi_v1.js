"use strict";

const env = require('../../env');
const consoleLogger = require('../utils/consoleLogger');

var ftApiClient = require('ft-api-client')(env.capi.key, {
	pollForPages: false
});


var getArticleData = function (uuid, callback) {
	if (typeof callback !== 'function') {
		throw new Error("capi_v1.getArticleData: callback not provided");
	}

	ftApiClient.get(uuid)
		.then(function (article) {
			callback(null, article);
		}, function (err) {
			if (err && err.statusCode !== 404) {
				consoleLogger.error('CAPI error', err);
			}

			callback(err);
		});
};

exports.getArticleData = getArticleData;
