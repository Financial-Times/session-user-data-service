"use strict";

const assert = require('assert');
const proxyquire =  require('proxyquire');

const env = {
	validation: {
		pseudonym: {
			allowedCharacters: " !#$%'()*+,-./0123456789:;=?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~"
		}
	}
};

const pseudonymSanitizer = proxyquire('../../../app/utils/pseudonymSanitizer.js', {
	'../../env': env
});


describe('pseudonymSanitizer', function() {
	describe('getNotAllowedCharacters', function () {
		assert.deepEqual(pseudonymSanitizer.getNotAllowedCharacters("gegf₧23ê4fr\\\""), ['₧', 'ê', '\\', '"'], "Not allowed characters correctly returned.");
		assert.deepEqual(pseudonymSanitizer.getNotAllowedCharacters("fshdfgr"), [], "Not allowed characters correctly returned.");
	});

	describe('sanitize', function () {
		assert.equal(pseudonymSanitizer.sanitize("gegf₧23ê4fr\\\""), "gegf234fr", "Not safe pseudonym correctly sanitized.");
		assert.deepEqual(pseudonymSanitizer.sanitize("fshdfgr"), 'fshdfgr', "Safe pseudonym left untouched.");
	});

	describe('validate', function () {
		assert.equal(pseudonymSanitizer.validate("gegf₧23ê4fr\\\""), false, "Not valid pseudonym correctly validated.");
		assert.deepEqual(pseudonymSanitizer.validate("fshdfgr"), true, "Valid pseudonym correctly validated.");
	});
});
