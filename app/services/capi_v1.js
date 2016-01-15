"use strict";

const env = require('../../env');
const consoleLogger = require('../utils/consoleLogger');
const request = require('request');
const Timer = require('../utils/Timer');

var capiUrl = env.capi.url.replace(/\{apiKey\}/g, env.capi.key);


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

	var url = capiUrl.replace(/\{uuid\}/g, uuid);
	request.get(url, {
		timeout: 10000
	}, function (err, response) {
		endTimer(timer, uuid);

		if (err || response.statusCode < 200 || response.statusCode >= 400 || !response.body) {
			if (err || response.statusCode !== 404) {
				consoleLogger.warn('CAPI error', err || new Error(response.statusCode));
			}

			callback({
				error: err,
				statusCode: response.statusCode
			});
			return;
		}

		callback(null, JSON.parse(response.body));
	});
};

exports.getArticleData = getArticleData;
