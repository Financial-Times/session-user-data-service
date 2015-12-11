"use strict";

const env = require('../../env');
const consoleLogger = require('../utils/consoleLogger');
const Timer = require('../utils/Timer');

var ftApiClient = require('ft-api-client')(env.capi.key, {
	pollForPages: false
});


const endTimer = function (timer, uuid) {
	let elapsedTime = timer.getElapsedTime();
	if (elapsedTime > 5000) {
		consoleLogger.warn(uuid, 'capi_v1.getArticleData: high response time', elapsedTime + 'ms');
	} else {
		consoleLogger.info(uuid, 'capi_v1.getArticleData: response time', elapsedTime + 'ms');
	}
};


var getArticleData = function (uuid, callback) {
	if (typeof callback !== 'function') {
		throw new Error("capi_v1.getArticleData: callback not provided");
	}

	let timer = new Timer();

	ftApiClient.get(uuid)
		.then(function (article) {
			endTimer(timer, uuid);

			callback(null, article);
		}, function (err) {
			if (err && err.statusCode !== 404) {
				consoleLogger.warn('CAPI error', err);
			}

			endTimer(timer, uuid);

			callback(err);
		});
};

exports.getArticleData = getArticleData;
