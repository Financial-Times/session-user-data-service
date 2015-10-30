"use strict";


module.exports = function (config) {
	config = config || {};
	let dbMock = config.dbMock || {};

	const findInDb = (collection, query) => {
		let keys = Object.keys(query);
		let itemsFound = [];

		dbMock[collection].forEach((item) => {
			let foundIt = true;

			keys.forEach((key) => {
				if (item[key] !== query[key]) {
					foundIt = false;
				}
			});

			if (foundIt) {
				itemsFound.push(item);
			}
		});

		return itemsFound;
	};

	this.mock = {
		MongoClient: {
			connect: function (connectionString, callback) {
				if (connectionString === 'invalid') {
					callback(new Error("Connection string not valid."));
				} else {
					callback(null, {
						on: () => {},
						collection: function (collectionName) {
							if (dbMock[collectionName]) {
								return {
									find: function (query) {
										return {
											toArray(callbackFind) {
												if (query) {
													callbackFind(null, findInDb(collectionName, query));
												} else {
													callbackFind(new Error("Invalid query."));
													return;
												}
											}
										};
									}
								};
							} else {
								throw new Error("Collection does not exist.");
							}
						}
					});
				}
			}
		},
		'@global': config.global === true ? true : false
	};
};
