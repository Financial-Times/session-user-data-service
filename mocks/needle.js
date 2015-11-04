"use strict";

module.exports = function (config) {
	config = config || {};

	this.mock = {
		get: function (url, params, callback) {
			if (typeof params === 'function' && !callback) {
				callback = params;
				params = null;
			}


			// matchmaking
			let type;
			let match;

			if (config.env.emailService.url) {
				let matchEmailService = url.match(new RegExp(config.env.emailService.url.replace(/\{userId\}/, '(.*)').replace('?', '\\?')));
				if (matchEmailService && matchEmailService.length) {
					type = 'emailService';
					match = matchEmailService;
				}
			}

			if (config.env.erightsToUuidService.urls.byUuid && config.env.erightsToUuidService.urls.byErights) {
				let matchByUuid = url.match(new RegExp(config.env.erightsToUuidService.urls.byUuid.replace(/\{userId\}/, '(.*)').replace('?', '\\?')));
				let matchByErightsId = url.match(new RegExp(config.env.erightsToUuidService.urls.byErights.replace(/\{userId\}/, '(.*)').replace('?', '\\?')));

				if (matchByUuid && matchByUuid.length) {
					type = 'erightsToUuidService';
					match = matchByUuid;
				} else if (matchByErightsId && matchByErightsId.length) {
					type = 'erightsToUuidService';
					match = matchByErightsId;
				}
			}

			if (config.env.livefyre.api.collectionExistsUrl) {
				let collectionExistsRegExp = new RegExp(config.env.livefyre.api.collectionExistsUrl
															.replace(/\{networkName\}/g, '([^\.\/]+)')
															.replace(/\{articleIdBase64\}/g, '(.*)')
															.replace(/\?/g, '\\?'));
				let matchCollectionExistsUrl = url.match(collectionExistsRegExp);

				if (matchCollectionExistsUrl && matchCollectionExistsUrl.length) {
					type = 'livefyreCollectionExists';
					match = matchCollectionExistsUrl;
				}
			}


			if (config.env.sessionApi.url) {
				let matchSessionApi = url.match(new RegExp(config.env.sessionApi.url.replace(/\{sessionId\}/, '(.*)').replace('?', '\\?')));

				if (matchSessionApi && matchSessionApi.length) {
					type = 'sessionApi';
					match = matchSessionApi;
				}
			}



			let id;


			if (match && match.length) {
				switch (type) {
					case 'emailService':
						if (!params || params.username !== config.env.emailService.auth.user || params.password !== config.env.emailService.auth.pass) {
							callback(new Error("Not authenticated."));
							return;
						}

						id = match[1];
						if (config.usersEmailService[id] !== -1) {
							callback(null, {
								statusCode: 200,
								body: config.usersEmailService[id]
							});
						} else {
							callback(null, {
								statusCode: 404
							});
						}
						break;

					case 'erightsToUuidService':
						id = match[1];

						let usersByIds = {};
						let usersByErights = {};

						config.usersErightsMapping.forEach((user) => {
							usersByIds[user.id] = user;
							if (user.deprecatedIds && user.deprecatedIds.erightsId) {
								usersByErights[user.deprecatedIds.erightsId] = user;
							}
						});

						if (usersByIds[id] || usersByErights[parseInt(id, 10)]) {
							callback(null, {
								statusCode: 200,
								body: {
									"user": usersByIds[id] || usersByErights[parseInt(id, 10)]
								}
							});
						} else {
							callback(null, {
								statusCode: 404
							});
						}
						break;

					case 'livefyreCollectionExists':
						let networkName = match[1];
						let articleIdBase64 = match[2];
						let articleId = new Buffer(articleIdBase64, 'base64').toString();

						if (networkName !== config.env.livefyre.network.name) {
							callback(new Error("Network not found"));
							return;
						}

						if (config.articlesCollectionExists.indexOf(articleId) !== -1) {
							callback(null, {
								statusCode: 200
							});
							return;
						}

						callback(null, {
							statusCode: 404
						});
						break;

					case 'sessionApi':
						if (!params || params.headers.FT_Api_Key !== config.env.sessionApi.key) {
							callback(new Error("Not authenticated."));
							return;
						}

						if (config.sessions[match[1]]) {
							callback(null, {
								statusCode: 200,
								body: config.sessions[match[1]]
							});
						} else if (match[1].indexOf('down') !== -1) {
							callback(new Error("Service down"));
						} else {
							callback(null, {
								statusCode: 401
							});
						}
						break;

					default:
						throw "Not supported";
				}
			} else {
				throw "Not supported";
			}
		},
		post: function (url, params, callback) {
			if (typeof params === 'function' && !callback) {
				callback = params;
				params = null;
			}

			// matchmaking
			let type;
			let match;

			if (config.env.livefyre.api.pingToPullUrl) {
				let pingToPullRegExp = new RegExp(config.env.livefyre.api.pingToPullUrl
																.replace(/\{networkName\}/g, '([^\.\/]+)')
																.replace(/\{userId\}/g, '([^\.\/\?]+)')
																.replace(/\{token\}/g, '(.*)')
																.replace(/\?/g, '\\?'));
				let matchPingToPullUrl = url.match(pingToPullRegExp);

				if (matchPingToPullUrl && matchPingToPullUrl.length) {
					type = 'livefyrePingToPull';
					match = matchPingToPullUrl;
				}
			}


			if (match && match.length) {
				switch (type) {
					case 'livefyrePingToPull':
						let networkName = match[1];
						let userId = match[2];
						let token = match[3];

						if (networkName !== config.env.livefyre.network.name) {
							callback(new Error("Network not found"));
							return;
						}

						if (token !== config.systemToken) {
							callback(new Error("System token invalid"));
							return;
						}

						if (config.userIdsPingToPull.indexOf(userId) !== -1) {
							callback(null, {
								statusCode: 200
							});
							return;
						}

						callback(new Error("Ping to pull error."));
						break;
					default:
						throw "Not supported";
				}
			} else {
				throw "Not supported";
			}
		},
		'@global': config.global === true ? true : false
	};
};
