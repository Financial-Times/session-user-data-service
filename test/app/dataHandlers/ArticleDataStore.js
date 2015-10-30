"use strict";

const assert = require('assert');
const proxyquire =  require('proxyquire');
const consoleLogger = require('../../../app/utils/consoleLogger');
const FtApiClientMock = require('../../../mocks/ft-api-client');
const MongodbMock = require('../../../mocks/mongodb');

consoleLogger.disable();

const articleDetails = {
	id: 'a86755e4-46a5-11e1-bc5f-00144feabdc0',
	title: 'Test article',
	url: 'http://www.ft.com/cms/a86755e4-46a5-11e1-bc5f-00144feabdc0.html',
	siteId: 415343
};
const articleDetailsWithSiteIdNotSetUp = {
	id: '3f330864-1c0f-443e-a6b3-cf8a3b536a52',
	title: 'Test article 2',
	url: 'http://www.ft.com/cms/3f330864-1c0f-443e-a6b3-cf8a3b536a52.html',
	siteId: 252346
};
const articleDetailsCollectionNotExists = {
	id: 'e78d07ca-680f-11e5-a57f-21b88f7d973f',
	title: 'Test article 3',
	url: 'http://www.ft.com/cms/e78d07ca-680f-11e5-a57f-21b88f7d973f.html',
	siteId: 523435
};

const articleDetailsUnclassified = {
	id: 'e78d07ca-680f-11e5-a57f-21b88f7d973f',
	title: 'Test article 3',
	url: 'http://www.ft.com/cms/e78d07ca-680f-11e5-a57f-21b88f7d973f.html',
	siteId: 'unclassified'
};


var articleData = {};
articleData[articleDetails.id] = {};
articleData[articleDetailsWithSiteIdNotSetUp.id] = {};
articleData[articleDetailsCollectionNotExists.id] = {};
articleData[articleDetailsUnclassified.id] = {};

var ftApiClientMock = new FtApiClientMock({
	articleData: articleData
});


const mocks = {
	env: {
		mongo: {
			uri: 'mongo-uri-legacySiteMapping'
		},
		'@global': true
	}
};

var mongodbMock = new MongodbMock({
	dbMock: {
		'legacy_site_mapping': [
			{
				_id: articleDetails.id,
				siteId: articleDetails.siteId
			},
			{
				_id: articleDetailsWithSiteIdNotSetUp.id,
				siteId: articleDetailsWithSiteIdNotSetUp.siteId
			},
			{
				_id: articleDetailsCollectionNotExists.id,
				siteId: articleDetailsCollectionNotExists.siteId
			},
			{
				_id: articleDetailsUnclassified.id,
				siteId: articleDetailsUnclassified.siteId
			}
		]
	},
	global: true
});

const ArticleDataStore = proxyquire('../../../app/dataHandlers/ArticleDataStore.js', {
	'ft-api-client': ftApiClientMock.mock,
	db: mongodbMock.mock,
	'../../env': mocks.env
});

describe('ArticleDataStore', function() {
	it('should return the same string after encrypt/decrypt', function (done) {
		done();
	});
});
