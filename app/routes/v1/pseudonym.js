'use strict';

const express = require('express');
const router = express.Router();
const pseudonymController = require('../../controllers/v1/pseudonym');
const checkAccess = require('../../utils/checkAccess');

router.use(checkAccess());

/**
 * @api {get} v1/pseudonym/available Pseudonym available
 * @apiVersion 1.1.0
 * @apiGroup v1/pseudonym
 * @apiName available
 * @apiDescription Checks if a pseudonym is available for use.
 *
 * @apiHeader {String} X-Api-Key Access API key
 *
 * @apiParam {String} pseudonym Required. Pseudonym used to search the database
 *
 * @apiSuccessExample Full response
 *  HTTP/1.1 200 OK
 *   {
 *       "available": true
 *   }
 *
 * @apiErrorExample {400} Missing pseudonym
 *  HTTP/1.1 400 Bad request
 *   {
 *       "success": false,
 *       "error": "Pseudonym is missing"
 *   }
**/

router.get('/available/:pseudonym', pseudonymController.available);

module.exports = router;
