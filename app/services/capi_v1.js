"use strict";

const env = require('../../env');

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
			console.log('CAPI error', err);

			callback(err);
		});
};

exports.getArticleData = getArticleData;
