"use strict";

const env = require('../../env');
const consoleLogger = require('../utils/consoleLogger');
const Timer = require('../utils/Timer');


var FtApi = require('ft-api-client');
var ftApiClient  = new FtApi({
	apiKey: env.capi.key,
	featureFlags: ['blogposts'],
	logLevel: FtApi.LOG_LEVEL_NONE
});


const endTimer = function (timer, uuid) {
	let elapsedTime = timer.getElapsedTime();
	if (elapsedTime > 5000) {
		consoleLogger.warn(uuid, 'capi_v1.getArticleData: service high response time', elapsedTime + 'ms');
	} else {
		consoleLogger.info(uuid, 'capi_v1.getArticleData: service response time', elapsedTime + 'ms');
	}
};


var getArticleData = function (uuid, callback) {
	if (typeof callback !== 'function') {
		throw new Error("capi_v1.getArticleData: callback not provided");
	}

	let timer = new Timer();

	ftApiClient.getItem(uuid, function (err, article) {
		endTimer(timer, uuid);

		if (err && (!err.statusCode || err.statusCode < 200 || err.statusCode >= 400) || !article) {
			consoleLogger.warn('CAPI error', err || new Error("Response null."));
			callback(err);
			return;
		}

		callback(null, article);
	});
};

exports.getArticleData = getArticleData;
