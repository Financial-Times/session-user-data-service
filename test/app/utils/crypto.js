"use strict";

const assert = require('assert');
const proxyquire =  require('proxyquire');



const mocks = {
	env: {
		crypto: {
			key: 'g2ggrtg45g5ggr'
		}
	}
};

const crypto = proxyquire('../../../app/utils/crypto.js', {
	'../../env': mocks.env
});

describe('crypto', function() {
	it('should return the same string after encrypt/decrypt', function () {
		var str = 'gfsdfrg';

		var encrypted = crypto.encrypt(str);
		var strAfterEncryptDecrypt = crypto.decrypt(encrypted);

		assert.equal(strAfterEncryptDecrypt, str, "The encrypted/decrypted string is the same as the original.");
	});
});
