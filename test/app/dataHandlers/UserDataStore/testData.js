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

	getPseudonymWithoutPseudonym: {
		uuid: '85bfa0ae-ebd9-4434-84f3-3d48b4fc4a46',
		eRightsId: 42534534
	},
	getPseudonymWithoutPseudonym2: {
		uuid: '8e64ee84-b22a-4309-a71e-8dde5f04bbbe',
		eRightsId: 3453434
	},

	getPseudonymWithPseudonym: {
		uuid: '211452fd-2765-4d37-9b95-f3d8658b1dba',
		eRightsId: 52423423,
		initialData: {
			_id: '211452fd-2765-4d37-9b95-f3d8658b1dba',
			uuid: '211452fd-2765-4d37-9b95-f3d8658b1dba',
			lfUserId: 52423423,
			pseudonym: 'testPseudonym52423423'
		}
	},
	getPseudonymWithPseudonym2: {
		uuid: 'bd0b9ad1-cf53-47f4-a70c-4d3b1b5c1588',
		eRightsId: 24324234,
		initialData: {
			_id: 'bd0b9ad1-cf53-47f4-a70c-4d3b1b5c1588',
			uuid: 'bd0b9ad1-cf53-47f4-a70c-4d3b1b5c1588',
			lfUserId: 24324234,
			pseudonym: 'testPseudonym24324234'
		}
	},


	setPseudonymWithoutPseudonym: {
		uuid: '10aa90ee-2aa9-42b8-be4e-e6b2dac925c8',
		eRightsId: 945645
	},
	setPseudonymWithoutPseudonym2: {
		uuid: '38beafac-f4ff-4c7b-92c1-37b147b813bc',
		eRightsId: 23423423
	},
	setPseudonymWithoutPseudonym3: {
		uuid: '89fc7169-0865-422d-916b-d3bf82d0974b',
		eRightsId: 365646
	},

	setPseudonymWithPseudonym: {
		uuid: '399326ab-b0c4-4f97-bf78-a8f0fd918c6b',
		eRightsId: 54353453,
		initialData: {
			_id: '399326ab-b0c4-4f97-bf78-a8f0fd918c6b',
			uuid: '399326ab-b0c4-4f97-bf78-a8f0fd918c6b',
			lfUserId: 54353453,
			pseudonym: 'testPseudonym54353453'
		}
	},
	setPseudonymWithPseudonym2: {
		uuid: '2b4df1a4-a9b4-4491-a4e2-fcd2589758d8',
		eRightsId: 1534534,
		initialData: {
			_id: '2b4df1a4-a9b4-4491-a4e2-fcd2589758d8',
			uuid: '2b4df1a4-a9b4-4491-a4e2-fcd2589758d8',
			lfUserId: 1534534,
			pseudonym: 'testPseudonym1534534'
		}
	},



	emptyPseudonymWithoutPseudonym: {
		uuid: '1ea8f0ae-14f5-4c2e-a7b0-41aeceb06bfb',
		eRightsId: 34534534
	},
	emptyPseudonymWithoutPseudonym2: {
		uuid: 'f22f5f73-0a0f-48ec-9453-2646b811c9ef',
		eRightsId: 547565
	},

	emptyPseudonymWithPseudonym: {
		uuid: 'fdac9990-0d67-496d-a753-ab7dd05271a0',
		eRightsId: 5675644,
		initialData: {
			_id: 'fdac9990-0d67-496d-a753-ab7dd05271a0',
			uuid: 'fdac9990-0d67-496d-a753-ab7dd05271a0',
			lfUserId: 5675644,
			pseudonym: 'testPseudonym5675644'
		}
	},
	emptyPseudonymWithPseudonym2: {
		uuid: '2d6265c5-6ccb-47b7-8050-74cd1fe1b5c5',
		eRightsId: 7234643,
		initialData: {
			_id: '2d6265c5-6ccb-47b7-8050-74cd1fe1b5c5',
			uuid: '2d6265c5-6ccb-47b7-8050-74cd1fe1b5c5',
			lfUserId: 7234643,
			pseudonym: 'testPseudonym7234643'
		}
	},



	getEmailPrefWithoutPref: {
		uuid: '124fca0a-2d0e-4768-ae17-d05d6da8784f',
		eRightsId: 2353654
	},
	getEmailPrefWithoutPref2: {
		uuid: '4003625c-70c8-4072-a209-511a17aa682a',
		eRightsId: 8356334
	},

	getEmailPrefWithPartialPref: {
		uuid: '88bbc0db-fa20-4907-9c6f-67b5d7e5897e',
		eRightsId: 43635345,
		initialData: {
			_id: '88bbc0db-fa20-4907-9c6f-67b5d7e5897e',
			uuid: '88bbc0db-fa20-4907-9c6f-67b5d7e5897e',
			lfUserId: 43635345,
			emailPreferences: {
				comments: 'never',
				replies: 'immediately'
			}
		}
	},
	getEmailPrefWithPartialPref2: {
		uuid: '3e6a6c00-ad51-48ed-9e8d-1bfbb7a2d5df',
		eRightsId: 234232354,
		initialData: {
			_id: '3e6a6c00-ad51-48ed-9e8d-1bfbb7a2d5df',
			uuid: '3e6a6c00-ad51-48ed-9e8d-1bfbb7a2d5df',
			lfUserId: 234232354,
			emailPreferences: {
				comments: 'never',
				replies: 'immediately'
			}
		}
	},

	getEmailPrefWithPref: {
		uuid: '9a6608c0-dd6e-4594-9967-3c3543669ac8',
		eRightsId: 6345345,
		initialData: {
			_id: '9a6608c0-dd6e-4594-9967-3c3543669ac8',
			uuid: '9a6608c0-dd6e-4594-9967-3c3543669ac8',
			lfUserId: 6345345,
			emailPreferences: {
				comments: 'never',
				replies: 'never',
				likes: 'hourly',
				autoFollow: true
			}
		}
	},
	getEmailPrefWithPref2: {
		uuid: '0ee62941-17cb-4e3a-80d9-435c4da68156',
		eRightsId: 5242345,
		initialData: {
			_id: '0ee62941-17cb-4e3a-80d9-435c4da68156',
			uuid: '0ee62941-17cb-4e3a-80d9-435c4da68156',
			lfUserId: 5242345,
			emailPreferences: {
				comments: 'never',
				replies: 'never',
				likes: 'hourly',
				autoFollow: true
			}
		}
	},


	setEmailPrefInv: {
		uuid: '04a89ce5-ea6c-41d3-80fb-cf444db762b6',
		eRightsId: 5234234
	},
	setEmailPrefNoPrefSaved: {
		uuid: '7937eae4-90ea-45ac-ae38-b2697243876f',
		eRightsId: 2453454
	},
	setEmailPrefNoPrefSaved2: {
		uuid: '13eab900-6b41-48c6-9ce1-239d049fbcaf',
		eRightsId: 4534546
	},



	setEmailPrefPartiallySaved: {
		uuid: '5fa02487-5bd0-4690-b2d2-fb2294dfe781',
		eRightsId: 6747546,
		initialData: {
			_id: '5fa02487-5bd0-4690-b2d2-fb2294dfe781',
			uuid: '5fa02487-5bd0-4690-b2d2-fb2294dfe781',
			lfUserId: 6747546,
			emailPreferences: {
				comments: 'never',
				replies: 'never'
			}
		}
	},
	setEmailPrefPartiallySaved2: {
		uuid: '0b005ae2-1a8f-4fce-833a-b31aa97f1f5d',
		eRightsId: 7356443,
		initialData: {
			_id: '0b005ae2-1a8f-4fce-833a-b31aa97f1f5d',
			uuid: '0b005ae2-1a8f-4fce-833a-b31aa97f1f5d',
			lfUserId: 7356443,
			emailPreferences: {
				comments: 'never',
				replies: 'never'
			}
		}
	},


	setEmailPrefFullySaved: {
		uuid: 'a66bdc01-803e-4c3e-8ad3-f15a7968f01c',
		eRightsId: 63453452,
		initialData: {
			_id: 'a66bdc01-803e-4c3e-8ad3-f15a7968f01c',
			uuid: 'a66bdc01-803e-4c3e-8ad3-f15a7968f01c',
			lfUserId: 63453452,
			emailPreferences: {
				comments: 'hourly',
				replies: 'never',
				likes: 'immediately',
				autoFollow: false
			}
		}
	},
	setEmailPrefFullySaved2: {
		uuid: 'c875a97f-594b-4f19-a69a-b4aa04056614',
		eRightsId: 7345343,
		initialData: {
			_id: 'c875a97f-594b-4f19-a69a-b4aa04056614',
			uuid: 'c875a97f-594b-4f19-a69a-b4aa04056614',
			lfUserId: 7345343,
			emailPreferences: {
				comments: 'never',
				replies: 'never',
				likes: 'immediately',
				autoFollow: false
			}
		}
	},


	getUserDataWithoutInternalData: {
		uuid: '0a443648-7747-4f74-a55d-09b813676382',
		eRightsId: 42363453,
		basicUserInfo: {
			email: 'testEmail42363453',
			firstName: 'testfirstName42363453',
			lastName: 'testlastName42363453'
		}
	},
	getUserDataWithoutInternalData2: {
		uuid: 'a3d694f7-0b20-4b6a-9610-b0e2a5a08b1a',
		eRightsId: 6357434,
		basicUserInfo: {
			email: 'testEmail6357434',
			firstName: 'testfirstName6357434',
			lastName: 'testlastName6357434'
		}
	},
	getUserDataWithInternalData: {
		uuid: 'c1679582-eb58-42cd-bd3b-bf44bf7cb894',
		eRightsId: 2345234,
		basicUserInfo: {
			email: 'testEmail2345234',
			firstName: 'testfirstName2345234',
			lastName: 'testlastName2345234'
		},
		initialData: {
			_id: 'c1679582-eb58-42cd-bd3b-bf44bf7cb894',
			uuid: 'c1679582-eb58-42cd-bd3b-bf44bf7cb894',
			lfUserId: 2345234,
			emailPreferences: {
				comments: 'never',
				replies: 'never',
				likes: 'immediately',
				autoFollow: false
			},
			pseudonym: 'testPs2345234'
		}
	},
	getUserDataWithInternalData2: {
		uuid: '989b8ec0-658b-4163-8de1-cd1d4a9fd183',
		eRightsId: 634534,
		basicUserInfo: {
			email: 'testEmail634534',
			firstName: 'testfirstName634534',
			lastName: 'testlastName634534'
		},
		initialData: {
			_id: '989b8ec0-658b-4163-8de1-cd1d4a9fd183',
			uuid: '989b8ec0-658b-4163-8de1-cd1d4a9fd183',
			lfUserId: 634534,
			emailPreferences: {
				comments: 'never',
				replies: 'never',
				likes: 'immediately',
				autoFollow: false
			},
			pseudonym: 'testPs634534'
		}
	},

	getUserDataWithPartialData: {
		uuid: '3373133b-0927-4f55-a004-a884f5946d21',
		eRightsId: 236234,
		basicUserInfo: {
			email: 'testEmail236234',
			firstName: 'testfirstName236234'
		}
	},
	getUserDataWithPartialData2: {
		uuid: 'fddcdbf1-820f-4dc1-a364-6be5c6fea9a0',
		eRightsId: 7345453,
		basicUserInfo: {
			email: 'testEmail7345453',
			firstName: 'testfirstName7345453'
		}
	},
	getUserDataWithoutERightsId: {
		uuid: '3e79cb30-cd34-417f-b539-0c055abe92e7',
		basicUserInfo: {
			email: 'testEmail3e79cb30',
			firstName: 'testfirstName3e79cb30',
			lastName: 'testlastName3e79cb30'
		}
	},

	getUserDataCached: {
		uuid: '2f9897ef-1058-4328-9719-7dc893b89a47',
		eRightsId: 94564534,
		basicUserInfo: {
			email: 'testEmail94564534',
			firstName: 'testfirstName94564534',
			lastName: 'testlastName94564534'
		},
		initialData: {
			_id: '2f9897ef-1058-4328-9719-7dc893b89a47',
			uuid: '2f9897ef-1058-4328-9719-7dc893b89a47',
			lfUserId: 94564534,
			emailPreferences: {
				comments: 'never',
				replies: 'never',
				likes: 'immediately',
				autoFollow: false
			},
			email: 'testEMail',
			firstName: 'testFirstName',
			lastName: 'testLastName'
		}
	},
	getUserDataCached2: {
		uuid: '53db1fe0-484e-48a5-a01e-64f68598930f',
		eRightsId: 423634,
		basicUserInfo: {
			email: 'testEmail423634',
			firstName: 'testfirstName423634',
			lastName: 'testlastName423634'
		},
		initialData: {
			_id: '53db1fe0-484e-48a5-a01e-64f68598930f',
			uuid: '53db1fe0-484e-48a5-a01e-64f68598930f',
			lfUserId: 423634,
			emailPreferences: {
				comments: 'never',
				replies: 'never',
				likes: 'immediately',
				autoFollow: false
			},
			email: 'testEmail2',
			firstName: 'testFirstName',
			lastName: 'testLastName'
		}
	},


	updateBasicUserData_partial_notsaved: {
		uuid: '73d3541e-85c1-40f2-9894-f9947a399323',
		eRightsId: 623455
	},
	updateBasicUserData_partial_notsaved2: {
		uuid: 'edfebb47-848e-4ec9-8f70-bd9d3215b30e',
		eRightsId: 7345347
	},

	updateBasicUserData_full_notsaved: {
		uuid: 'f72450e7-6b88-4125-806c-09f2dc6468c4',
		eRightsId: 62343563
	},
	updateBasicUserData_full_notsaved2: {
		uuid: 'bc05e5ea-5251-47b2-96fa-fa87817c3faa',
		eRightsId: 3834545
	},

	updateBasicUserData_partial_partiallySaved: {
		uuid: '7edad54a-dc3d-44ae-8975-d2e242caf0d2',
		eRightsId: 7345345,
		initialData: {
			_id: '7edad54a-dc3d-44ae-8975-d2e242caf0d2',
			uuid: '7edad54a-dc3d-44ae-8975-d2e242caf0d2',
			eRightsId: 7345345,
			email: 'testEmail7345345',
			firstName: 'testFirstName7345345',
			lastName: null
		}
	},
	updateBasicUserData_partial_partiallySaved2: {
		uuid: '7ce4ec99-668d-4f4a-b251-bdd3b42dd0ad',
		eRightsId: 6245345,
		initialData: {
			_id: '7ce4ec99-668d-4f4a-b251-bdd3b42dd0ad',
			uuid: '7ce4ec99-668d-4f4a-b251-bdd3b42dd0ad',
			eRightsId: 6245345,
			email: 'testEmail6245345',
			firstName: 'testFirstName6245345',
			lastName: null
		}
	},

	updateBasicUserData_partial_saved: {
		uuid: '0fc4e40a-ffc5-4583-b4f5-de98234942a1',
		eRightsId: 723455,
		initialData: {
			_id: '0fc4e40a-ffc5-4583-b4f5-de98234942a1',
			uuid: '0fc4e40a-ffc5-4583-b4f5-de98234942a1',
			eRightsId: 723455,
			email: 'testEmail723455',
			firstName: 'testfirstName723455',
			lastName: 'testlastName723455'
		}
	},
	updateBasicUserData_partial_saved2: {
		uuid: 'cdc18a4e-5ad4-4db8-b0dc-bd6fa8808ac0',
		eRightsId: 6723454,
		initialData: {
			_id: 'cdc18a4e-5ad4-4db8-b0dc-bd6fa8808ac0',
			uuid: 'cdc18a4e-5ad4-4db8-b0dc-bd6fa8808ac0',
			eRightsId: 6723454,
			email: 'testEmail6723454',
			firstName: 'testfirstName6723454',
			lastName: 'testlastName6723454'
		}
	},

	updateBasicUserData_full_saved: {
		uuid: '8a24635e-f6e4-43d6-a3bc-ed8954e5c9ec',
		eRightsId: 13654654,
		initialData: {
			_id: '8a24635e-f6e4-43d6-a3bc-ed8954e5c9ec',
			uuid: '8a24635e-f6e4-43d6-a3bc-ed8954e5c9ec',
			eRightsId: 13654654,
			email: 'testEmail13654654',
			firstName: 'testFirstName13654654',
			lastName: 'testlastName13654654'
		}
	},
	updateBasicUserData_full_saved2: {
		uuid: '414946f8-ce60-4a25-93df-45a35f7f0b03',
		eRightsId: 6234364,
		initialData: {
			_id: '414946f8-ce60-4a25-93df-45a35f7f0b03',
			uuid: '414946f8-ce60-4a25-93df-45a35f7f0b03',
			eRightsId: 6234364,
			email: 'testEmail6234364',
			firstName: 'testFirstName6234364',
			lastName: 'testlastName6234364'
		}
	},
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

let usersEmailServiceData = {};
for (let key in users) {
	if (users.hasOwnProperty(key)) {
		if (users[key].basicUserInfo) {
			usersEmailServiceData[users[key].uuid] = users[key].basicUserInfo;
		}
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
	usersEmailService: usersEmailServiceData,
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
