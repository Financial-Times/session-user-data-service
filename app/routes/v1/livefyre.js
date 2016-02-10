"use strict";

const express = require('express');
const router = express.Router();
const livefyreControllerV1 = require('../../controllers/v1/livefyre.js');


/**
 * @api {get} v1/livefyre/metadata Metadata
 * @apiVersion 1.1.0
 * @apiGroup v1/livefyre
 * @apiName metadata
 * @apiDescription Returns the list of tags of an article based on CAPI and the URL structure.
 *
 * @apiParam {String} articleId 	Required. ID of the article.
 * @apiParam {String} url 			Required. Url of the article.
 *
 * @apiSuccess 	{Array} - 	List of tags based on CAPI and the URL of the article.
 * @apiError  	{Array} - 	Empty list
 *
 * @apiSuccessExample Success
 *  HTTP/1.1 200 OK
 *   [
 *     "sections.World",
 *     "authors.Naomi Ronvick",
 *     "brand.The World",
 *     "blog",
 *     "the-world"
 *   ]
 *
 * @apiSuccessExample  No tags found
 *  HTTP/1.1 200 OK
 *   []
 */
router.get('/metadata', livefyreControllerV1.metadata);


/**
 * @api {get} v1/livefyre/getcollectiondetails Get collection details
 * @apiVersion 1.1.0
 * @apiGroup v1/livefyre
 * @apiName getcollectiondetails
 * @apiDescription Generates information needed by Livefyre about the article.
 *
 * @apiParam {String} articleId 	Required. ID of the article.
 * @apiParam {String} url 			Required. Url of the article.
 * @apiParam {String} title 		Required. Title of the article.
 * @apiParam {String} stream_type 	Optional. Can be one of 'livecomments', 'liveblog', 'livechat'. Default is 'livecomments'.
 * @apiParam {String} tags 			Optional. Additional tags for the collection (added to the CAPI and URL based tags). Comma separated.
 * @apiParam {String} sessionId 	Session ID of the user. Optional, but if not present, FTSession cookie is used.
 *
 * @apiSuccess (success) {Number} siteId 			See [Livefyre documentation](http://answers.livefyre.com/developers/app-integrations/comments/#convConfigObject)
 * @apiSuccess (success) {String} articleId 		ID of the article, echo of the input parameter.
 * @apiSuccess (success) {String} collectionMeta 	See [Livefyre documentation](http://answers.livefyre.com/developers/app-integrations/comments/#convConfigObject)
 * @apiSuccess (success) {String} checksum 			See [Livefyre documentation](http://answers.livefyre.com/developers/app-integrations/comments/#convConfigObject)
 * @apiSuccess (success) {String} notAllowedToCreateCollection Present only if the user is not authenticated and the collection does not exist. In this case this user is not allowed to create the collection.
 *
 * @apiSuccessExample Normal success
 *  HTTP/1.1 200 OK
 *   {
 *      "siteId": 375297,
 *      "articleId": "e78d07ca-680f-11e5-a57f-21b88f7d973f",
 *      "collectionMeta": "eyJ0eXAiOiJKV16134HFOiJIUzI1NiJ9.eyJ0eXBlIjoiSHRGRGRjfg452iJLYXRoZXJpbmUgR2FycmV0dC1Db3ggc3RlcHMgYmFjayBpbiBBbGxpYW5jZSBUcnVzdCBzaGFrZS11cCIsImFydGljbGVJZCI6ImU3OGQwN2NhLTY4MGYtMTFlNS1hNTdmLTIxYjg4ZjdkOTczZiIsInVybCI6Imh0dHA6Ly93d3cuZnQuY29tL2ludGwvY21zL3MvMC9lNzhkMDdjYS02ODBmLTExZTUtYTU3Zi0yMWI4OGY3ZDk3M2YuaHRtbCIsInRhZ3MiOiJzZWN0aW9ucy5Db21wYW5pZXMsc2VjdGlvbnMuRmluYW5jaWFscyxzZWN0aW9ucy5GaW5hbmNpYWxfU2VydmljZXMsc2VjdGlvbnMuVUtfQ29tcGFuaWVzLGF1dGhvcnMuRGF2aWRfT2FrbGV5LGF1dGhvcnMuTmF0aGFsaWVfVGhvbWFzIiwiaXNzIjoidXJuOmxpdmVmeXJlOmZ0LTEuZnlyZS5jbzpzaXRlPTM3NzE5NyIsImlhdCI6MTQ0NzA3OTYwNH0.oW2sCELfPTlj_7JLVzVhhiM86mRpW56uYNDcP4D7Tj8",
 *      "checksum": "974b4240f9ad8423015612809be6990f"
 *   }
 *
 * @apiSuccessExample Not authenticated / no collection
 *  HTTP/1.1 200 OK
 *   {
 *      "siteId": 375297,
 *      "articleId": "e78d07ca-680f-11e5-a57f-21b88f7d973f",
 *      "collectionMeta": "eyJ0eXAiOiJKV16134HFOiJIUzI1NiJ9.eyJ0eXBlIjoiSHRGRGRjfg452iJLYXRoZXJpbmUgR2FycmV0dC1Db3ggc3RlcHMgYmFjayBpbiBBbGxpYW5jZSBUcnVzdCBzaGFrZS11cCIsImFydGljbGVJZCI6ImU3OGQwN2NhLTY4MGYtMTFlNS1hNTdmLTIxYjg4ZjdkOTczZiIsInVybCI6Imh0dHA6Ly93d3cuZnQuY29tL2ludGwvY21zL3MvMC9lNzhkMDdjYS02ODBmLTExZTUtYTU3Zi0yMWI4OGY3ZDk3M2YuaHRtbCIsInRhZ3MiOiJzZWN0aW9ucy5Db21wYW5pZXMsc2VjdGlvbnMuRmluYW5jaWFscyxzZWN0aW9ucy5GaW5hbmNpYWxfU2VydmljZXMsc2VjdGlvbnMuVUtfQ29tcGFuaWVzLGF1dGhvcnMuRGF2aWRfT2FrbGV5LGF1dGhvcnMuTmF0aGFsaWVfVGhvbWFzIiwiaXNzIjoidXJuOmxpdmVmeXJlOmZ0LTEuZnlyZS5jbzpzaXRlPTM3NzE5NyIsImlhdCI6MTQ0NzA3OTYwNH0.oW2sCELfPTlj_7JLVzVhhiM86mRpW56uYNDcP4D7Tj8",
 *      "checksum": "974b4240f9ad8423015612809be6990f",
 *      "notAllowedToCreateCollection": true
 *   }
 *
 * @apiSuccess (unclassified) {Boolean} unclassifiedArticle Relates to the legacy mapping of articles to different sites based on primary section/URL. If the URL was not mapped by the legacy mapping logic, flag it.
 *
 * @apiSuccessExample Unclassified article
 *  HTTP/1.1 200 OK
 *   {
 *      "unclassifiedArticle": true
 *   }
 */
router.get('/getcollectiondetails', livefyreControllerV1.getCollectionDetails);


/**
 * @api {get} v1/livefyre/init Init
 * @apiVersion 1.1.0
 * @apiGroup v1/livefyre
 * @apiName init
 * @apiDescription Endpoint to init the comments application. It returns both article and user informations.
 *
 * @apiParam {String} articleId 	Required. ID of the article.
 * @apiParam {String} url 			Required. Url of the article.
 * @apiParam {String} title 		Required. Title of the article.
 * @apiParam {String} el 			Required. ID of a DOM element in which the widget should be loaded. It is echoed in the response.
 * @apiParam {String} stream_type 	Optional. Can be one of 'livecomments', 'liveblog', 'livechat'. Default is 'livecomments'.
 * @apiParam {String} tags 			Optional. Additional tags for the collection (added to the default of CAPI and URL based tags). Comma separated.
 * @apiParam {String} sessionId 	Session ID of the user. Optional, but if not present, FTSession cookie is used.
 *
 * @apiSuccess (success) {Object} init 					Data about the article
 * @apiSuccess (success) {Number} init.siteId 			See [Livefyre documentation](http://answers.livefyre.com/developers/app-integrations/comments/#convConfigObject)
 * @apiSuccess (success) {String} init.articleId		Article ID.
 * @apiSuccess (success) {String} init.collectionMeta 	See [Livefyre documentation](http://answers.livefyre.com/developers/app-integrations/comments/#convConfigObject)
 * @apiSuccess (success) {String} init.checksum 		See [Livefyre documentation](http://answers.livefyre.com/developers/app-integrations/comments/#convConfigObject)
 * @apiSuccess (success) {String} init.notAllowedToCreateCollection Present only if the user is not authenticated and the collection does not exist. In this case this user is not allowed to create the collection.
 * @apiSuccess (success) {Object} auth 					Data about the user
 * @apiSuccess (success) {Boolean} auth.token 			Auth token of Livefyre. See [Livefyre documentation](http://answers.livefyre.com/developers/getting-started/tokens/auth/)
 * @apiSuccess (success) {Boolean} auth.expires 		Timestamp of when the token expires.
 * @apiSuccess (success) {Boolean} auth.displayName 	The user's pseudonym (nickname).
 * @apiSuccess (success) {Boolean} auth.settings 		The user's email notification settings.
 *
 * @apiSuccess (unclassified) {Object} init 						Data about the article
 * @apiSuccess (unclassified) {Boolean} init.unclassifiedArticle 	Relates to the legacy mapping of articles to different sites based on primary section/URL. If the URL was not mapped by the legacy mapping logic, flag it.
 *
 * @apiSuccess (no pseudonym) {Object} auth 						Data about the user
 * @apiSuccess (no pseudonym) {Boolean} auth.pseudonym 				Pseudonym false is the flag that the user does not have a pseudonym yet.
 *
 *
 * @apiSuccessExample Full response
 *  HTTP/1.1 200 OK
 *   {
 *       "init": {
 *           "siteId": 377197,
 *           "articleId": "e78d07ca-680f-11e5-a57f-21b88f7d973f",
 *           "collectionMeta": "eyJ0eXAiOiJKV1QiLCJhbGDHD253IUzI1NiJ9.eyJ0eXBlIjoi456GSHRFFHFdGl0bGUiOiJLYXRoZXJpg4dfGSD46b3ggc3RlcHMgYmFjayBpbiBBbGxpYW5jZSBUcnVzdCBzaGFrZS11cCIsImFydGljbGVJZCI6ImU3OGQwN2NhLTY4MGYtMTFlNS1hNTdmLTIxYjg4ZjdkOTczZiIsInVybCI6Imh0dHA6Ly93d3cuZnQuY29tL2ludGwvY21zL3MvMC9lNzhkMDdjYS02ODBmLTExZTUtYTU3Zi0yMWI4OGY3ZDk3M2YuaHRtbCIsInRhZ3MiOiJzZWN0aW9ucy5Db21wYW5pZXMsc2VjdGlvbnMuRmluYW5jaWFscyxzZWN0aW9ucy5GaW5hbmNpYWxfU2VydmljZXMsc2VjdGlvbnMuVUtfQ29tcGFuaWVzLGF1dGhvcnMuRGF2aWRfT2FrbGV5LGF1dGhvcnMuTmF0aGFsaWVfVGhvbWFzIiwiaXNzIjoidXJuOmxpdmVmeXJlOmZ0LTEuZnlyZS5jbzpzaXRlPTM3NzE5NyIsImlhdCI6MTQ0NzA3OTYwNH0.oW2sCELfPTlj_7JLVzVhhiM86mRpW56uYNDcP4D7Tj8",
 *           "checksum": "974b4cc0f9gf7813015612809be6990f",
 *           "el": "dom-element-id"
 *       },
 *       "auth": {
 *           "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJkb21haW4iOiJmdC0xHRV4567GGRVJDSoiOTAyNjUwMiIsImRpc3BsYXlfbmFtZSGS45681265dsSDGbjMiLCJleHBpcmVmdIDGKSDOaswLjQxNSwiaWF0IjoxNDQ3MDgzNTAxfQ.vDVUaBrd-qGFQFKvAEQMGSD45239SHDuCh_tXZR1WwRg",
 *           "expires": 1462635461193,
 *           "displayName": "the avenger",
 *           "settings": {
 *               "emailcomments": "hourly",
 *               "emaillikes": "never",
 *               "emailreplies": "immediately",
 *               "emailautofollow": "off"
 *           }
 *       }
 *   }
 *
 *
 *
 * @apiSuccessExample Unclassified article
 *  HTTP/1.1 200 OK
 *   {
 *      "init": {
 *          "unclassifiedArticle": true
 *      },
 *      "auth": {
 *          ....
 *      }
 *   }
 *
 * @apiSuccessExample No pseudonym
 *  HTTP/1.1 200 OK
 *   {
 *      "init": {
 *          ...
 *      },
 *      "auth": {
 *          "pseudonym": false
 *      }
 *   }
 */
router.get('/init', livefyreControllerV1.init);

/**
 * @api {get} v1/livefyre/get_lf_bootstrap Get livefyre bootstrap URL
 * @apiVersion 1.1.0
 * @apiGroup v1/livefyre
 * @apiName get_lf_bootstrap
 * @apiDescription See [Livefyre documentation](http://answers.livefyre.com/developers/advanced-topics/bootstrap-html/)
 *
 * @apiParam {String} uuid 		Required. ID of the article.
 *
 * @apiSuccess (success) {String} url URL which points to a ready rendered version of the comments widget.
 *
 * @apiSuccessExample Success
 *  HTTP/1.1 200 OK
 *   {
 *       "url": "https://bootstrap.ft-1.fyre.co/bs3/ft-1.fyre.co/377197/ZTc4ZDA3Y2EtNjgwZi0xMWU1LWE1N2YtMjFiODhmN2Q5NzNm/bootstrap.html"
 *   }
 */
router.get('/get_lf_bootstrap', livefyreControllerV1.getLfBootstrap);

/**
 * @api {get} v1/livefyre/commentcount Get comment count of an article
 * @apiVersion 1.1.0
 * @apiGroup v1/livefyre
 * @apiName commentcount
 * @apiDescription See [Livefyre API documentation](http://answers.livefyre.com/developers/api-reference/#link-content-count)
 *
 * @apiParam {String} articleId 		Required. ID of the article.
 *
 * @apiSuccess (success) {String} count 	The number of comments
 *
 * @apiSuccessExample Success
 *  HTTP/1.1 200 OK
 *   {
 *       "count": 4
 *   }
 */
router.get('/commentcount', livefyreControllerV1.getCommentCount);

/**
 * @api {get} v1/livefyre/profile User profile for Livefyre
 * @apiVersion 1.1.0
 * @apiGroup v1/livefyre
 * @apiName profile
 * @apiDescription Used for Livefyre's ping for pull mechanism. It returns the user's profile in a format that Livefyre understands. See [Livefyre documentation](http://answers.livefyre.com/developers/identity-integration/your-identity/#BuildTheResponse)
 *
 * @apiParam {String} id 		Required. ID of the user (either eRights ID or UUID).
 * @apiParam {String} lftoken 	Required. System token of the Livefyre network. It should be valid in order the API to respond. See [Livefyre documentation](http://answers.livefyre.com/developers/libraries/methods/network/#link-buildlivefyretoken-nodejs)
 *
 * @apiSuccess (success) {String} id 			ID of the user (eRights ID if it exists, otherwise UUID)
 * @apiSuccess (success) {String} email 		Email address of the user
 * @apiSuccess (success) {String} first_name 	First name of the user
 * @apiSuccess (success) {String} last_name 	Last name of the user
 * @apiSuccess (success) {String} display_name 	Pseudonym (nickname) of the user
 * @apiSuccess (success) {String} email_notifications 			Email notifications
 * @apiSuccess (success) {String} email_notifications.comments 	Email notifications in case someone comments in a conversation the user is following
 * @apiSuccess (success) {String} email_notifications.likes 	Email notifications in case someone likes the user's comment
 * @apiSuccess (success) {String} email_notifications.replies 	Email notifications in case someone replies to the user's comment
 * @apiSuccess (success) {String} autofollow_conversations 		Auto-follow any conversation after the user posts a comment in it
 * @apiSuccess (success) {String} settings_url 					URL to the user's profile page
 *
 * @apiSuccessExample Success
 *  HTTP/1.1 200 OK
 *   {
 *       "id": "9036415",
 *       "email": "john.rush@ft.com",
 *       "first_name": "John",
 *       "last_name": "Rush",
 *       "display_name": "myname",
 *       "email_notifications": {
 *           "comments": "immediately",
 *           "likes": "never",
 *           "replies": "often"
 *       },
 *       "autofollow_conversations": "false",
 *       "settings_url": ""
 *   }
 */
router.get('/profile', livefyreControllerV1.profile);


module.exports = router;












