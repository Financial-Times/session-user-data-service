"use strict";

const express = require('express');
const router = express.Router();


router.get('/troubleshoot', function (req, res, next) {
	res.redirect('https://docs.google.com/document/d/1V5c50jxD4obd6Fb_p2P7V8LrIYtjYnAQLqm3_rap2UQ');
});

module.exports = router;
