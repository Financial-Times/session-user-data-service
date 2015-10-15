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

exports.getFilteredTags = function (uuid, callback) {
	if (typeof callback !== 'function') {
		throw new Error("capi_v1.getFilteredTags: callback not provided");
	}

	getArticleData(uuid, function (err, article) {
		if (err) {
			callback(err);

			return;
		}

		var tags = [];
		if (article.sections) {
			tags = tags.concat(article.sections.map(function (val) {return val.taxonomy + '.' + val.name}));
		}

		if (article.authors) {
			tags = tags.concat(article.authors.map(function (val) {return val.taxonomy + '.' + val.name}));
		}


		if (article.brand) {
			tags.push(article.brand.taxonomy + '.' + article.brand.name);
		}

		callback(null, tags);
	});
};
