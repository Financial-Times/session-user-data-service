"use strict";

module.exports = function (config) {
	var articleData = config.articleData || {};

	this.mock = (function () {
		return {
			get: function (uuid) {
				return new Promise((resolve, reject) => {
					if (articleData[uuid]) {
						resolve(articleData[uuid]);
						return;
					}

					if (uuid.indexOf('capi-down') !== -1) {
						reject({
							statusCode: 503
						});
						return;
					}

					reject({
						statusCode: 404
					});
				});
			}
		};
	}());

	if (config.global === true) {
		this.mock['@global'] = true;
	}
};
