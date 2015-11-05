"use strict";

const proxyquire =  require('proxyquire');
const MongodbMock = require('../../../../mocks/mongodb');
const NeedleMock = require('../../../../mocks/needle');
const _ = require('lodash');


const env = {
	crypto: {
		key: 'g2ggrtg45g5ggr'
	},
	erightsToUuidService: {
		urls: {
			byUuid: 'http://erights-to-uuid/get?userId={userId}',
			byErights: 'http://erights-to-uuid/get?eRightsId={userId}'
		}
	},
	emailService: {
		url: 'http://email-service/get?userId={userId}',
		auth: {
			user: 'testUser',
			pass: 'testPass'
		}
	},
	'@global': true
};
const crypto = proxyquire('../../../../app/utils/crypto', {
	'../../env': env
});


const users = {
	withERightsId: {
		uuid: 'a85d4fc2-648a-4c08-a3dc-d4c2325a7b82',
		eRightsId: 53242342
	},
	withERightsId2: {
		uuid: 'ba795881-de02-4e9d-8783-72739c0c4aa3',
		eRightsId: 45345234234
	},
	withoutERightsId: {
		uuid: '41d6d86a-d965-418f-987c-db264690e285'
	},
	withIdsCached: {
		uuid: '768a4b0e-d82d-4026-999d-2b0eaf40471b',
		eRightsId: 5234234,
		initialData: {
			_id: '768a4b0e-d82d-4026-999d-2b0eaf40471b',
			uuid: '768a4b0e-d82d-4026-999d-2b0eaf40471b',
			lfUserId: 5234234
		}
	},
	withOnlyERightsIdSaved: {
		uuid: 'f83cc6db-5e7b-4723-848d-7583d88a2d3e',
		eRightsId: 3634543534,
		initialData: {
			lfUserId: 3634543534
		}
	},
	withOnlyERightsIdSaved2: {
		uuid: '2445cf00-1ca5-43e5-bc65-75a496b4a510',
		eRightsId: 234234234,
		initialData: {
			lfUserId: 234234234
		}
	},

	withoutPseudonym: {
		uuid: '85bfa0ae-ebd9-4434-84f3-3d48b4fc4a46',
		eRightsId: 42534534,
		initialData: {
			_id: '85bfa0ae-ebd9-4434-84f3-3d48b4fc4a46',
			uuid: '85bfa0ae-ebd9-4434-84f3-3d48b4fc4a46',
			lfUserId: 42534534
		}
	},
	withPseudonym: {
		uuid: '211452fd-2765-4d37-9b95-f3d8658b1dba',
		eRightsId: 52423423,
		initialData: {
			_id: '211452fd-2765-4d37-9b95-f3d8658b1dba',
			uuid: '211452fd-2765-4d37-9b95-f3d8658b1dba',
			lfUserId: 52423423,
			pseudonym: 'testPseudonym52423423'
		}
	}
};


let usersErightsMapping = [];
for (let key in users) {
	if (users.hasOwnProperty(key)) {
		let data = {};
		data.id = users[key].uuid;

		if (users[key].eRightsId) {
			data.deprecatedIds = {
				erightsId: users[key].eRightsId
			};
		}

		usersErightsMapping.push(data);
	}
}


let usersMongoContent = [];
for (let key in users) {
	if (users.hasOwnProperty(key)) {
		if (users[key].initialData) {
			let data = _.extend({}, users[key].initialData);
			if (data.pseudonym) {
				data.pseudonym = crypto.encrypt(data.pseudonym);
			}
			if (data.firstName) {
				data.firstName = crypto.encrypt(data.firstName);
			}
			if (data.lastName) {
				data.lastName = crypto.encrypt(data.lastName);
			}
			if (data.email) {
				data.email = crypto.encrypt(data.email);
			}
			usersMongoContent.push(data);
		}
	}
}



const mongodbMock = new MongodbMock({
	dbMock: {
		users: usersMongoContent
	},
	global: true
});


const needleMock = new NeedleMock({
	env: env,
	usersEmailService: {},
	usersErightsMapping: usersErightsMapping,
	global: true
});


exports.mockInstances = {
	mongodb: mongodbMock,
	needle: needleMock
};


exports.mocks = {
	mongodb: mongodbMock.mock,
	needle: needleMock.mock,
	env: env
};

exports.users = users;
