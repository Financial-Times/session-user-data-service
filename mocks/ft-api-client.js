"use strict";

module.exports = function (config) {
	var articleData = config.articleData || {};

	this.mock = function () {
		return {
			get: function (uuid) {
				return {
					then: function (callback, error) {
						if (articleData[uuid]) {
							callback(articleData[uuid]);
							return;
						}

						if (uuid.indexOf('capi-down') !== -1) {
							error({
								statusCode: 503
							});
							return;
						}

						error({
							statusCode: 404
						});
					}
				};
			}
		};
	};

	if (config.global === true) {
		this.mock['@global'] = true;
	}
};
