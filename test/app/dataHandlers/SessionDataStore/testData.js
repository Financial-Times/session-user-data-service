"use strict";

const proxyquire =  require('proxyquire');
const MongodbMock = require('../../../../mocks/mongodb');
const LivefyreMock = require('../../../../mocks/livefyre');
const NeedleMock = require('../../../../mocks/needle');
const _ = require('lodash');


let sessionValidityHours = {
	remembered: 48,
	notRemembered: 24
};
const env = {
	sessionApi: {
		url: 'http://session-api.ft.com/get?sessionId={sessionId}',
		key: 'session-api-key'
	},
	sessionValidityHours: {
		remembered: sessionValidityHours.remembered,
		notRemembered: sessionValidityHours.notRemembered
	},
	crypto: {
		key: 'g2ggrtg45g5ggr'
	},
	erightsToUuidService: {
		urls: {
			byUuid: 'http://erights-to-uuid/get?userId={userId}',
			byErights: 'http://erights-to-uuid/get?eRightsId={userId}'
		}
	},
	'@global': true
};
const crypto = proxyquire('../../../../app/utils/crypto', {
	'../../env': env
});


const startDate = new Date();
const sessions = {
	rememberMe: {
		id: '5234324fwf4fdfgdfg',
		uuid: '676719cc-9507-4ac6-8dbd-8b9c935417a1',
		creationTime: startDate.getTime(),
		rememberMe: true
	},
	notRememberMe: {
		id: 'gr4r4ff5grtgrtg',
		uuid: 'c10a5958-d245-4df7-a7a1-86118defd2cb',
		creationTime: startDate.getTime(),
		rememberMe: false
	},
	rememberMeAlmostExpired: {
		id: 'g43grgrg54g',
		uuid: '27573a6e-4782-4059-92de-d59cd82f37bb',
		creationTime: new Date(startDate.getTime() - sessionValidityHours.remembered * 60 * 60 * 1000 + 60 * 1000).getTime(),
		rememberMe: true
	},
	notRememberMeAlmostExpired: {
		id: 'juykuy6j76h6',
		uuid: '6fa27221-04f6-45c5-ada5-4c27e49fc973',
		creationTime: new Date(startDate.getTime() - sessionValidityHours.notRemembered * 60 * 60 * 1000 + 60 * 1000).getTime(),
		rememberMe: false
	},
	cached: {
		id: 'g4ggtgrt5455544',
		uuid: '8d532ad3-c553-4e96-89b1-ee532f22aa8c',
		creationTime: startDate.getTime(),
		rememberMe: true,
		initialCache: {
			_id: 'g4ggtgrt5455544',
			sessionData: {
				uuid: '8d532ad3-c553-4e96-89b1-ee532f22aa8c',
				creationTime: startDate.getTime() - 60 * 1000,
				rememberMe: true
			},
			authMetadata: {
				token: 'cached token',
				pseudonym: 'test pseudonym',
				expires: new Date(new Date().getTime() + 60 * 60 * 1000).getTime(),
				emailPreferences: null
			},
			expireAt: new Date(new Date().getTime() + 60 * 60 * 1000)
		}
	},
	cached2: {
		id: 'g35g54fg5gr',
		uuid: 'c490e350-d112-4dd0-85fa-38816677b0d4',
		creationTime: startDate.getTime(),
		rememberMe: true,
		initialCache: {
			_id: 'g35g54fg5gr',
			sessionData: {
				uuid: 'c490e350-d112-4dd0-85fa-38816677b0d4',
				creationTime: startDate.getTime() - 60 * 1000,
				rememberMe: true
			},
			authMetadata: {
				token: 'cached token',
				pseudonym: 'test pseudonym',
				expires: new Date(new Date().getTime() + 60 * 60 * 1000).getTime(),
				emailPreferences: null
			},
			expireAt: new Date(new Date().getTime() + 60 * 60 * 1000)
		}
	},
	noPseudonym: {
		id: '23523453453423',
		uuid: '3f5a8765-28f8-40a9-b4f1-85c5159fb723',
		creationTime: startDate.getTime(),
		rememberMe: true
	},
	withPseudonymNoEmailPreference: {
		id: '453453434',
		uuid: 'cece1bfb-e311-4dcb-af3f-cf0e60e53477',
		creationTime: startDate.getTime(),
		rememberMe: true
	},
	withCompleteUserInfo: {
		id: '5f24f4fr',
		uuid: 'c5d80bda-d3cd-41bd-bb5a-e88a72287f07',
		creationTime: startDate.getTime(),
		rememberMe: true
	},
	withoutERightsId: {
		id: '32423423dfsdf',
		uuid: '814a0a54-bcf3-4eef-895e-6615886fd7da',
		creationTime: startDate.getTime(),
		rememberMe: true
	}
};

const users = {};
users[sessions.noPseudonym.uuid] = {
	id: sessions.noPseudonym.uuid,
	deprecatedIds: {
		erightsId: 5346345
	}
};
users[sessions.withPseudonymNoEmailPreference.uuid] = {
	id: sessions.withPseudonymNoEmailPreference.uuid,
	deprecatedIds: {
		erightsId: 325423
	},
	userData: {
		pseudonym: 'testPseudonym' + sessions.withPseudonymNoEmailPreference.uuid
	}
};
users[sessions.withCompleteUserInfo.uuid] = {
	id: sessions.withCompleteUserInfo.uuid,
	deprecatedIds: {
		erightsId: 22423434
	},
	userData: {
		pseudonym: 'testPseudonym' + sessions.withCompleteUserInfo.uuid,
		emailPreferences: {
			comments: 'never',
			likes: 'immediately',
			replies: 'likes',
			autoFollow: true
		}
	}
};
users[sessions.withoutERightsId.uuid] = {
	id: sessions.withoutERightsId.uuid,
	userData: {
		pseudonym: 'testPseudonym' + sessions.withoutERightsId.uuid
	}
};

let usersList = [];
for (let key in users) {
	if (users.hasOwnProperty(key)) {
		usersList.push(_.pick(users[key], ['id', 'deprecatedIds']));
	}
}


let usersMongoContent = [];
for (let key in users) {
	if (users.hasOwnProperty(key)) {
		if (users[key].userData) {
			let data = _.extend({_id: key}, users[key].userData);
			if (data.pseudonym) {
				data.pseudonym = crypto.encrypt(data.pseudonym);
			}
			usersMongoContent.push(data);
		}
	}
}


const sessionsById = {};
Object.keys(sessions).forEach(function (key, index) {
	sessionsById[sessions[key].id] = sessions[key];
});

const needleMock = new NeedleMock({
	env: env,
	sessions: sessionsById,
	usersErightsMapping: usersList,
	global: true
});

const mongodbMock = new MongodbMock({
	dbMock: {
		sessions: [
			_.extend({}, sessions.cached.initialCache, {pseudonym: crypto.encrypt(sessions.cached.initialCache.authMetadata.pseudonym)}),
			_.extend({}, sessions.cached2.initialCache, {pseudonym: crypto.encrypt(sessions.cached2.initialCache.authMetadata.pseudonym)}),
		],
		users: usersMongoContent
	},
	global: true
});

const livefyreMock = new LivefyreMock({
	global: true
});


exports.mockInstances = {
	mongodb: mongodbMock,
	livefyre: livefyreMock,
	needle: needleMock
};


exports.mocks = {
	mongodb: mongodbMock.mock,
	livefyre: livefyreMock.mock,
	needle: needleMock.mock,
	env: env
};
exports.sessions = sessions;
exports.sessionsById = sessionsById;
exports.users = users;
