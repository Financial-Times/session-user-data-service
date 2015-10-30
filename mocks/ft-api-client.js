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

						error(new Error("Not found"));
					}
				};
			}
		};
	}
	if (config.global === true) {
		this.mock['@global'] = true;
	}
}
