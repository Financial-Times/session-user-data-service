"use strict";

const express = require('express');
const router = express.Router();
const health = require('../health/health.js');


router.get('/__health', function (req, res, next) {
	var healthStatus = health.getChecks();

	if (!healthStatus) {
		res.sendStatus(503);
	} else {
		res.jsonp(healthStatus);
	}
});

module.exports = router;
