"use strict";

const request = require('request');

module.exports = request.defaults({
	timeout: 15000
});
