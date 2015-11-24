"use strict";

module.exports = function (config) {
	config = config || {};

	this.mock = {
		getNetwork: function (networkName, networkKey) {
			return {
				buildLivefyreToken: function () {
					return config.systemToken;
				},
				buildUserAuthToken: function (userId, displayName, expires) {
					return JSON.stringify({
						userId: userId,
						displayName: displayName,
						expires: expires
					});
				},
				getSite: function (siteId, siteKey) {
					return {
						buildCollection: function (stream_type, title, articleId, url) {
							var data = {
								tags: '',
								networkName: networkName,
								networkKey: networkKey,
								siteId: siteId,
								siteKey: siteKey,
								streamType: stream_type,
								title: title,
								articleId: articleId,
								url: url
							};

							return {
								data: data,
								buildCollectionMetaToken: function () {
									return JSON.stringify({
										collectionMeta: data
									});
								},
								buildChecksum: function () {
									return JSON.stringify({
										checksum: data
									});
								}
							};
						}
					};
				},
				validateLivefyreToken: function (token) {
					if (token === config.validToken) {
						return true;
					}

					return false;
				}
			};
		},
		'@global': config.global === true ? true : false
	};
};
