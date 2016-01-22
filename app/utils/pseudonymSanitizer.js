"use strict";

const env = require('../../env');

exports.getNotAllowedCharacters = function (pseudonym) {
	let notAllowedCharacters = [];

	console.log('allowedCharacters', env.validation.pseudonym.allowedCharacters);
	for (let i=0; i<pseudonym.length; i++) {
		if (env.validation.pseudonym.allowedCharacters.indexOf(pseudonym[i]) === -1) {
			notAllowedCharacters.push(pseudonym[i]);
		}
	}

	return notAllowedCharacters;
};

exports.sanitize = function (pseudonym) {
	let pseudonymSanitized = "";
	for (let i=0; i<pseudonym.length; i++) {
		if (env.validation.pseudonym.allowedCharacters.indexOf(pseudonym[i]) !== -1) {
			pseudonymSanitized += pseudonym[i];
		}
	}

	return pseudonymSanitized;
};

exports.validate = function (pseudonym) {
	let notAllowedCharacters = exports.getNotAllowedCharacters(pseudonym);

	if (notAllowedCharacters.length) {
		return false;
	}

	return true;
};
