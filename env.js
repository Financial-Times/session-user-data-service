"use strict";

var config = {
	livefyre: {
		network: {
			name: process.env.LIVEFYRE_NETWORK_NAME,
			key:process.env.LIVEFYRE_NETWORK_KEY
		},
		defaultSiteId: process.env.DEFAULT_SITE_ID,
		siteKeys: {},
		api: {
			pingToPullUrl: process.env.LIVEFYRE_PING_TO_PULL_URL,
			collectionExistsUrl: process.env.LIVEFYRE_API_COLLECTION_EXISTS
		}
	},
	mongo: {
		uri: process.env.MONGOLAB_URI
	},
	capi: {
		key: process.env.CAPI_KEY
	},
	sessionApi: {
		url: process.env.SESSION_API_URL,
		key: process.env.SESSION_API_KEY
	},
	crypto: {
		key: process.env.CRYPTO_KEY
	},
	cacheExpiryHours: {
		articles: process.env.ARTICLE_CACHE_EXPIRY || 12
	},
	sessionValidityHours: {
		notRemembered: process.env.SESSION_CACHE_VALIDITY_NOT_REMEMBERED || 24,
		remembered: process.env.SESSION_CACHE_VALIDITY_REMEMBERED || 24 * 30 * 6
	},
	emailService: {
		url: process.env.EMAIL_SERVICE_URL,
		auth: {
			user: process.env.EMAIL_SERVICE_AUTH_USER,
			pass: process.env.EMAIL_SERVICE_AUTH_PASSWORD
		}
	},
	erightsToUuidService: {
		urls: {
			byUuid: process.env.ERIGHTS_TO_UUID_SERVICE_URL_BY_UUID,
			byErights: process.env.ERIGHTS_TO_UUID_SERVICE_URL_BY_ERIGHTS
		}
	},
	logger: {
		level: process.env.LOGGER_LEVEL,
		filter: process.env.LOGGER_FILTER
	},
	host: process.env.HOST || 'session-user-data-service.herokuapp.com',
	maintenanceModeOn: ['true', true].indexOf(process.env.MAINTENANCE_ON) !== -1 ? true : false,
	apiKeyForRestrictedEndpoints: process.env.API_KEY_FOR_RESTRICTED_ENDPOINTS
};

for (let key in process.env) {
	if (process.env.hasOwnProperty(key)) {
		var match = key.match(/LIVEFYRE_SITE_KEY_([0-9]+)/);
		if (match && match.length) {
			config.livefyre.siteKeys[match[1]] = process.env[key];
		}
	}
}

module.exports = config;
