"use strict";

const express = require('express');
const router = express.Router();
const health = require('../health/health.js');


router.get('/__health', function (req, res, next) {
	res.jsonp(health.getChecks());
});

module.exports = router;
