"use strict";

module.exports = function (config) {
	var articleData = config.articleData || {};

	this.mock = function () {
		return {
			getItem: function (uuid, callback) {
				if (articleData[uuid]) {
					callback(null, articleData[uuid]);
					return;
				}

				if (uuid.indexOf('capi-down') !== -1) {
					callback({
						statusCode: 503
					});
					return;
				}

				callback({
					statusCode: 404
				});
			}
		};
	};

	if (config.global === true) {
		this.mock['@global'] = true;
	}
};
