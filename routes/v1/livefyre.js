"use strict";

var express = require('express');
var router = express.Router();
var ArticleDataCache = require('../../modules/ArticleDataCache');
var SessionDataCache = require('../../modules/SessionDataCache');
var userDataCache = require('../../modules/userDataCache');
var livefyreService = require('../../services/livefyre');
var _ = require('lodash');
var async = require('async');
var consoleLogger = require('../../modules/consoleLogger');


router.get('/metadata', function(req, res, next) {
	if (!req.query.articleId) {
		res.status(400).send('"articleId" should be provided.');
		return;
	}

	var articleDataCache = new ArticleDataCache(req.query.articleId);
	articleDataCache.getArticleTags(function (err, tags) {
		if (err) {
			console.log('/v1/livefyre/metadata', '\nArticleId:', req.query.articleId, '\nError:', err);

			res.jsonp([]);
			articleDataCache.destroy();
			return;
		}

		articleDataCache.destroy();
		res.jsonp(tags);
	});
});


router.get('/getcollectiondetails', function (req, res, next) {
	if (!req.query.articleId || !req.query.title || !req.query.url) {
		res.status(400).send('"articleId", "url" and "title" should be provided.');
		return;
	}

	var config = {
		articleId: req.query.articleId,
		title: req.query.title,
		url: req.query.url
	};

	if (req.query.tags) {
		config.tags = req.query.tags.split(',').map(function (value) {return value.trim();});
	}

	var userSession;
	if (req.cookies && req.cookies['FTSession']) {
		userSession = req.cookies['FTSession'];
	}
	if (req.query.session) {
		userSession = req.query.session;
	}

	var articleDataCache = new ArticleDataCache(req.query.articleId);
	var sessionDataCache;
	if (userSession) {
		sessionDataCache = new SessionDataCache(userSession);
	}

	getLivefyreCollectionDetailsAuthRestricted(articleDataCache, sessionDataCache, config, function (err, data) {
		if (err) {
			if (typeof err === 'object' && err.statusCode) {
				res.sendStatus(err.statusCode);
				return;
			}

			console.log('/v1/livefyre/init', '\nConfig', config, '\nError', err);

			res.sendStatus(503);
			return;
		}

		res.jsonp(_.pick(data, ['siteId', 'articleId', 'collectionMeta']));
	});
});

router.get('/init', function (req, res, next) {
	if (!req.query.articleId || !req.query.title || !req.query.url || !req.query.el) {
		res.status(400).send('"articleId", "url", "title" and "el" (element ID) should be provided.');
		return;
	}

	var config = {
		articleId: req.query.articleId,
		title: req.query.title,
		url: req.query.url
	};

	if (req.query.tags) {
		config.tags = req.query.tags.split(',').map(function (value) {return value.trim();});
	}

	if (req.query.stream_type) {
		config.stream_type = req.query.stream_type;
	}

	var userSession;
	if (req.cookies && req.cookies['FTSession']) {
		userSession = req.cookies['FTSession'];
	}
	if (req.query.session) {
		userSession = req.query.session;
	}

	var articleDataCache = new ArticleDataCache(req.query.articleId);

	var sessionDataCache;
	if (userSession) {
		sessionDataCache = new SessionDataCache(userSession);
	}

	async.parallel({
		livefyre: function (callback) {
			getLivefyreCollectionDetailsAuthRestricted(articleDataCache, sessionDataCache, config, function (err, data) {
				if (err) {
					callback(err);
					return;
				}

				callback(null, data);
			});
		},
		auth: function (callback) {
			if (userSession) {
				sessionDataCache.getLivefyreAuthToken(function (errAuth, data) {
					if (errAuth) {
						callback(null, {
							servicesUp: false
						});
						return;
					}

					if (data) {
						callback(null, data);
					} else {
						callback(null, null);
					}
				});
			} else {
				callback(null, null);
			}
		}
	}, function (err, results) {
		if (err) {
			if (typeof err === 'object' && err.statusCode) {
				res.sendStatus(err.statusCode);
				return;
			}

			console.log('/v1/livefyre/init', '\nConfig', config, '\nError', err);

			res.sendStatus(503);
			return;
		}

		if (results.livefyre && results.livefyre.siteId) {
			results.livefyre.el = req.query.el;
		}

		res.jsonp({
			init: results.livefyre,
			auth: results.auth
		});
	});
});



router.get('/get_lf_bootstrap', function (req, res, next) {
	if (!req.query.uuid) {
		res.status(400).send('"uuid" should be provided.');
		return;
	}

	livefyreService.getBootstrapUrl(req.query.uuid, function (err, url) {
		if (err) {
			if (typeof err === 'object' && err['unclassified'] === true) {
				res.status(403).send('Unclassified article.');
				return;
			}

			console.log('/v1/livefyre/get_lf_bootstrap', '\nArticleId', req.query.uuid, '\nError', err);

			res.sendStatus(503);
		}

		if (req.query.datatype === 'html') {
			res.sendStatus(url);
		} else {
			res.jsonp({
				url: url
			});
		}
	});
});



var setPseudonym = function (req, res, next) {

};
router.get('/setPseudonym', setPseudonym);
router.post('/setPseudonym', setPseudonym);

var updateUser = function (req, res, next) {

};
router.get('/updateuser', updateUser);
router.post('/updateuser', updateUser);


router.get('/profile', function (req, res, next) {
	if (!req.query.id) {
		res.status(400).send('"id" (user ID) should be provided.');
	}

	userDataCache.getUserInfo(req.query.id, function (err, userData) {

	});
});

router.get('/emptypseudonym', function (req, res, next) {

});


module.exports = router;











/* helpers */
function fetchLivefyreCollectionDetails (articleDataCache, config, callback) {
	if (typeof callback !== 'function') {
		throw new Error("v1/livefyre.fetchLivefyreCollectionDetails: callback not provided");
	}

	articleDataCache.getLivefyreCollectionDetails(_.pick(config, ['title', 'url', 'tags', 'stream_type']), function (err, livefyreData) {
		if (err) {
			if (typeof err === 'object' && err['unclassified'] === true) {
				callback(null, {
					unclassified: true
				});
				return;
			}

			callback(err);
			return;
		}

		callback(null, livefyreData);
	});
}
function getLivefyreCollectionDetailsAuthRestricted (articleDataCache, sessionDataCache, config, callback) {
	if (typeof callback !== 'function') {
		throw new Error("v1/livefyre.getLivefyreCollectionDetailsAuthRestricted: callback not provided");
	}


	var callCallback = function () {
		articleDataCache.destroy();
		callback.apply(this, arguments);
	};

	articleDataCache.livefyreCollectionExists(function (err, exists) {
		if (err) {
			callCallback(err);
			return;
		}

		if (exists) {
			consoleLogger.log(config.articleId, 'auth restricted collection creation, collection exists');
			fetchLivefyreCollectionDetails(articleDataCache, config, function (errFetch, collectionDetails) {
				if (errFetch) {
					callCallback(errFetch);
					return;
				}

				callCallback(null, collectionDetails);
			});
		} else {
			consoleLogger.log(config.articleId, 'auth restricted collection creation, collection does not exist');

			if (sessionDataCache) {
				sessionDataCache.getSessionData(function (err, sessionData) {
					if (err) {
						callCallback(err);
						return;
					}

					if (sessionData) {
						fetchLivefyreCollectionDetails(articleDataCache, config, function (errFetch, collectionDetails) {
							if (errFetch) {
								callCallback(err);
								return;
							}

							callCallback(null, collectionDetails);
						});
					} else {
						callCallback({
							statusCode: 403
						});
					}
				});
			} else {
				callCallback({
					statusCode: 403
				});
			}
		}
	});
}
