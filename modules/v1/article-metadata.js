"use strict";

var ftApiClient = require('ft-api-client')(process.env.CAPI_KEY, {
	pollForPages: false
});


exports.getArticleData = function (uuid, callback) {
	ftApiClient.get(uuid)
		.then(function (article) {
			callback(null, article);
		}, function (err) {
			console.log('CAPI error', err);

			callback(err);
		});
};

exports.getFilteredTags = function (uuid, callback) {
	exports.getArticleData(uuid, function (err, article) {
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
