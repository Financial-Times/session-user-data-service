"use strict";

var express = require('express');
var router = express.Router();
var capi_v1 = require('../../services/capi_v1.js');
var livefyreMetadata = require('../../modules/v1/livefyre-metadata.js');

/* GET home page. */
router.get('/metadata', function(req, res, next) {
	if (!req.query.articleId) {
		res.send(400, "articleId should be provided.");
		return;
	}

	capi_v1.getFilteredTags(req.query.articleId, function (err, tags) {
		if (err) {
			console.log('/v1/livefyre/metadata', 'Error', err);

			res.json([]);
			return;
		}

		res.json(tags);
	});
});

router.get('/getcollectiondetails', function (req, res, next) {
	if (!req.query.articleId || !req.query.title || !req.query.url) {
		res.send(400, "articleId, url and title should be provided.");
		return;
	}

	var config = {
		articleId: req.query.articleId,
		title: req.query.title,
		url: req.query.url
	};
	if (req.query.tags) {
		config.tags = req.query.tags;
	}
	if (req.query.stream_type) {
		config.stream_type = req.query.stream_type;
	}

	livefyreMetadata.getCollectionDetails(config, function (err, collectionDetails) {
		if (err) {
			console.log('/v1/livefyre/getcollectiondetails', 'Error', err);

			res.send(503);
			return;
		}

		res.json(collectionDetails);
	});
});

module.exports = router;
