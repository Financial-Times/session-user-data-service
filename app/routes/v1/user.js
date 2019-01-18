"use strict";

const express = require('express');
const router = express.Router();
const userController = require('../../controllers/v1/user');
const checkOrigin = require('../../utils/checkOrigin');

router.use(checkOrigin());

/**
 * @api {get} v1/user/getauth Auth
 * @apiVersion 1.1.0
 * @apiGroup v1/user
 * @apiName getauth
 * @apiDescription Returns authentication information about the user.
 *
 * @apiParam {String} sessionId 	Session ID of the user. Optional, but if not present, FTSession cookie is used.
 *
 * @apiSuccess (success) {Object} 	auth 				Data about the user
 * @apiSuccess (success) {Boolean} 	auth.token 			Auth token of Livefyre. See [Livefyre documentation](http://answers.livefyre.com/developers/getting-started/tokens/auth/)
 * @apiSuccess (success) {Boolean} 	auth.expires 		Timestamp of when the token expires.
 * @apiSuccess (success) {Boolean} 	auth.displayName 	The user's pseudonym (nickname).
 * @apiSuccess (success) {Boolean} 	auth.settings 		The user's email notification settings.
 *
 * @apiSuccess (no pseudonym) {Object} 	auth 			Data about the user
 * @apiSuccess (no pseudonym) {Boolean} auth.pseudonym 	Pseudonym false is the flag that the user does not have a pseudonym yet.
 *
 *
 * @apiSuccessExample Full response
 *  HTTP/1.1 200 OK
 *   {
 *       "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJkb21haW4iOiJmdC0xHRV4567GGRVJDSoiOTAyNjUwMiIsImRpc3BsYXlfbmFtZSGS45681265dsSDGbjMiLCJleHBpcmVmdIDGKSDOaswLjQxNSwiaWF0IjoxNDQ3MDgzNTAxfQ.vDVUaBrd-qGFQFKvAEQMGSD45239SHDuCh_tXZR1WwRg",
 *       "expires": 1462635461193,
 *       "displayName": "the avenger",
 *       "settings": {
 *           "emailcomments": "hourly",
 *           "emaillikes": "never",
 *           "emailreplies": "immediately",
 *           "emailautofollow": "off"
 *       }
 *   }
 *
 *
 * @apiSuccessExample No pseudonym
 *  HTTP/1.1 200 OK
 *   {
 *      "pseudonym": false
 *   }
 *
 * @apiErrorExample {401} Unauthorized
 *  HTTP/1.1 401 Unauthorized
 *    Unauthorized
 */
router.get('/getauth', userController.getAuth);

/**
 * @api {get / post} v1/user/setPseudonym Set pseudonym
 * @apiVersion 1.1.0
 * @apiGroup v1/user
 * @apiName setPseudonym
 * @apiDescription Updates the user's pseudonym.
 *
 * @apiParam {String} pseudonym 	Required. Pseudonym to be set.
 * @apiParam {String} sessionId 	Session ID of the user. Optional, but if not present, FTSession cookie is used.
 *
 * @apiSuccess {String} status Status of the update.
 *
 * @apiError {String} status Status of the update.
 * @apiError {String} error Error message.
 *
 * @apiSuccessExample Full response
 *  HTTP/1.1 200 OK
 *   {
 *       "status": "ok"
 *   }
 *
 * @apiErrorExample {400} Pseudonym empty
 *  HTTP/1.1 400 Bad request
 *   {
 *       "status": "error",
 *       "error": "Pseudonym invalid or not provided."
 *   }
 *
 * @apiErrorExample {401} Not logged in
 *  HTTP/1.1 401 Unauthorized
 *   {
 *       "status": "error",
 *       "error": "User session is not valid."
 *   }
 */
router.get('/setPseudonym', userController.setPseudonym);
router.post('/setPseudonym', userController.setPseudonym);


/**
 * @api {get} v1/user/getPseudonym Get pseudonym
 * @apiVersion 1.1.0
 * @apiGroup v1/user
 * @apiName getPseudonym
 * @apiDescription Reads the user's pseudonym.
 *
 * @apiParam {String} userIds List of user IDs for which to fetch the pseudonyms, comma separated.
 *
 * @apiHeader {String} X-Api-Key Access API key.
 *
 *
 * @apiSuccessExample Full response
 *  HTTP/1.1 200 OK
 *   {
 *       "3f330864-1c0f-443e-a6b3-cf8a3b536a52": "pseu132"
 *   }
 *
 * @apiSuccessExample No pseudonym
 *  HTTP/1.1 200 OK
 *   {
 *       "3f330864-1c0f-443e-a6b3-cf8a3b536a52": false
 *   }
 *
 * @apiSuccessExample User not found
 *  HTTP/1.1 200 OK
 *   {
 *       "3f330864-1c0f-443e-a6b3-cf8a3b536a52": false
 *   }
 *
 * @apiErrorExample {400} No API key / no userId
 *  HTTP/1.1 400 Bad request
 *   {
 *       "error": "API key is missing."
 *   }
 *
 * @apiErrorExample {401} API key invalid
 *  HTTP/1.1 401 Unauthorized
 *   {
 *       "error": "API key is invalid."
 *   }
 */
router.get('/getPseudonym', userController.getPseudonym);



/**
 * @api {get / post} v1/user/updateuser Update user
 * @apiVersion 1.1.0
 * @apiGroup v1/user
 * @apiName updateUser
 * @apiDescription Updates the user's comments settings: pseudonym, email notification preferences.
 *
 * @apiParam {String} pseudonym 		Optional. Pseudonym to be set.
 * @apiParam {String} emailcomments 	Optional. Pseudonym to be set.
 * @apiParam {String} emaillikes 		Optional. Pseudonym to be set.
 * @apiParam {String} emailreplies 		Optional. Pseudonym to be set.
 * @apiParam {String} emailautofollow 	Optional. Pseudonym to be set.
 * @apiParam {String} sessionId 		Session ID of the user. Optional, but if not present, FTSession cookie is used.
 *
 * @apiSuccess {String} status Status of the update
 *
 * @apiError {String} status Status of the update.
 * @apiError {String} error Error message.
 *
 *
 * @apiSuccessExample Full response
 *  HTTP/1.1 200 OK
 *   {
 *       "status": "ok"
 *   }
 *
 *
 *  @apiErrorExample {401} Not logged in
 *  HTTP/1.1 401 Unauthorized
 *   {
 *       "status": "error",
 *       "error": "User session is not valid."
 *   }
 */
router.get('/updateuser', userController.updateUser);
router.post('/updateuser', userController.updateUser);


/**
 * @api {get / post} v1/user/emptyPseudonym Empty pseudonym
 * @apiVersion 1.1.0
 * @apiGroup v1/user
 * @apiName emptyPseudonym
 * @apiDescription Empties the user's pseudonym.
 *
 * @apiParam {String} sessionId 	Session ID of the user. Optional, but if not present, FTSession cookie is used.
 *
 * @apiSuccess {String} status Status of the update.
 *
 * @apiError {String} status Status of the update.
 * @apiError {String} error Error message.
 *
 * @apiSuccessExample Full response
 *  HTTP/1.1 200 OK
 *   {
 *       "status": "ok"
 *   }
 *
 *
 *  @apiErrorExample {401} Not logged in
 *  HTTP/1.1 401 Unauthorized
 *   {
 *       "status": "error",
 *       "error": "User session is not valid."
 *   }
 *
 */
router.get('/emptypseudonym', userController.emptyPseudonym);
router.post('/emptypseudonym', userController.emptyPseudonym);


/**
 * @api {post} v1/user/userUpdated User updated
 * @apiVersion 1.1.0
 * @apiGroup v1/user
 * @apiName userUpdated
 * @apiDescription Endpoint to notify this system that basic user information has changed.
 *
 * @apiParam (get) {String} 	apiKey 		Required. Only with a valid API key can this endpoint be called.
 * @apiParam (post) {String} 	email 		Required. Email address
 * @apiParam (post) {String} 	firstName 	Optional. First name
 * @apiParam (post) {String} 	lastName 	Optional. Last name
 *
 *
 * @apiSuccess {String} status 	Status of the update.
 *
 * @apiError {String} 	status 	Status of the update.
 * @apiError {String} 	error 	Error message.
 *
 * @apiSuccessExample Full response
 *  HTTP/1.1 200 OK
 *   {
 *       "status": "ok"
 *   }
 *
 *  @apiErrorExample {401} Not logged in
 *  HTTP/1.1 401 Unauthorized
 *   {
 *       "status": "error",
 *       "error": "User session is not valid."
 *   }
 *
 */
router.post('/userUpdated/:uuid', userController.updateUserBasicInfo);

router.get('/delete', userController.deleteUser);

module.exports = router;
