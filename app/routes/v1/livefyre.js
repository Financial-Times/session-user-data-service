"use strict";

const express = require('express');
const router = express.Router();
const livefyreControllerV1 = require('../../controllers/v1/livefyre.js');


/**
 * @api {get} /metadata Get article tags.
 * @apiVersion 1
 * @apiName Metadata
 * @apiGroup Livefyre
 *
 * @apiParam {ObjectId} articleId Article UUID.
 * @apiParam {ObjectId} url Url of the article. Optional.
 *
 * @apiSuccess {Array} tags List of tags based on CAPI and the URL of the article.
 *
* @apiSuccessExample Success-Response:
 *  HTTP/1.1 200 OK
 *   [
 *     "sections.Companies",
 *     "sections.Retail & Consumer",
 *     "sections.Retail",
 *     "sections.Companies By Region",
 *     "sections.UK Companies",
 *     "authors.Naomi Ronvick",
 *     "discussion",
 *     "longroom"
 *   ]
 */
router.get('/metadata', livefyreControllerV1.metadata);


router.get('/getcollectiondetails', livefyreControllerV1.getCollectionDetails);


router.get('/init', livefyreControllerV1.init);

router.get('/get_lf_bootstrap', livefyreControllerV1.getLfBootstrap);

router.get('/profile', livefyreControllerV1.profile);


module.exports = router;












