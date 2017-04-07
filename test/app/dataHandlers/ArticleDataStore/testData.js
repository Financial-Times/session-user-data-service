"use strict";

const NEsClientMock = require('../../../../mocks/n-es-client');
const MongodbMock = require('../../../../mocks/mongodb');
const LivefyreMock = require('../../../../mocks/livefyre');
const RequestMock = require('../../../../mocks/request');


const articles = {
	normal: {
		id: 'a86755e4-46a5-11e1-bc5f-00144feabdc0',
		title: 'Test article',
		url: 'http://www.ft.com/cms/a86755e4-46a5-11e1-bc5f-00144feabdc0.html',
		siteId: 415343
	},
	noCollection: {
		id: '9fb85758-267d-4994-a9e5-dbfac8106170',
		title: 'Test article 3',
		url: 'http://www.ft.com/cms/e78d07ca-680f-11e5-a57f-21b88f7d973f.html',
		siteId: 523435
	},
	siteIdNotSetUp: {
		id: 'a3764583-6e2a-45ee-a19d-83303bfdb770',
		title: 'Site id not set up',
		url: 'http://www.ft.com/cms/a3764583-6e2a-45ee-a19d-83303bfdb770.html',
		siteId: 52465723
	},
	unclassified: {
		id: 'e78d07ca-680f-11e5-a57f-21b88f7d973f',
		title: 'Test article 3',
		url: 'http://www.ft.com/cms/e78d07ca-680f-11e5-a57f-21b88f7d973f.html',
		siteId: 'unclassified'
	},
	unclassified2: {
		id: 'e78d07ca-680f-11e5-a57f-21b88f7d343f',
		title: 'Test article 4',
		url: 'http://www.ft.com/cms/e78d07ca-680f-11e5-a57f-21b88f7d343f.html',
		siteId: 'unclassified'
	},
	blogs: {
		id: '1c0ad509-aa65-4973-99d2-d8ce64014144',
		title: 'Blog',
		url: 'http://blogs.ft.com/the-world/2015/10/why-delinquent-moldova-matters/',
		siteId: 415343
	},
	ftalphaville: {
		id: 'b0b220a8-d1df-4cd0-8550-52afdab22a65',
		title: 'FT Alphaville',
		url: 'http://ftalphaville.ft.com/2015/10/30/2143499/if-you-call-it-a-blockchain-its-not-a-competent-administration-story-anymore/',
		siteId: 415343
	},
	marketslive: {
		id: 'a0fd7c1e-3e02-459c-9b68-1487069cb976',
		title: 'MarketsLive',
		url: 'http://ftalphaville.ft.com/marketslive/2015-10-23/',
		siteId: 415343
	},
	longroom: {
		id: 'longroom123',
		title: 'Longroom',
		url: 'https://ftalphaville.ft.com/longroom/content/23432',
		siteId: 415343
	},
	lexicon: {
		id: '7409d30c-1c1a-4292-8045-383044e49fed',
		title: 'Lexicon',
		url: 'http://lexicon.ft.com/term?term=the-bullwhip-effect',
		siteId: 415343
	},
	cached: {
		id: 'd00e1a10-3309-471f-9e4c-f564d3ae0b91',
		title: 'Cached article',
		url: 'http://www.ft.com/cms/d00e1a10-3309-471f-9e4c-f564d3ae0b91.html',
		siteId: 415343,
		initialCache: {
			_id: 'd00e1a10-3309-471f-9e4c-f564d3ae0b91',
			tags: {
				data: [
					'tag1',
					'tag2'
				],
				expires: new Date(new Date().getTime() + 60 * 60 * 1000) // not expired
			},
			livefyre: {
				collectionExists: true,
				metadata: {
					data: {
						articleId: 'd00e1a10-3309-471f-9e4c-f564d3ae0b91',
						siteId: 415343,
						collectionMeta: 'cachedCollectionMeta',
						checksum: 'cachedChecksum'
					},
					expires: new Date(new Date().getTime() + 60 * 60 * 1000) // not expired
				}
			}
		}
	},
	toBeCached: {
		id: '2149f8ac-f9c0-47e0-a053-b8d9099acb85',
		title: 'To be cached',
		url: 'http://www.ft.com/cms/2149f8ac-f9c0-47e0-a053-b8d9099acb85.html',
		siteId: 415343
	},
	toBeUpdated: {
		id: '7c700a86-d7a8-46e7-b0bd-2d79f1ca3b52',
		title: 'To be updated',
		url: 'http://www.ft.com/cms/7c700a86-d7a8-46e7-b0bd-2d79f1ca3b52.html',
		siteId: 415343,
		initialCache: {
			_id: '7c700a86-d7a8-46e7-b0bd-2d79f1ca3b52',
			tags: {
				data: [
					'tag1',
					'tag2'
				],
				expires: new Date(new Date().getTime() - 60 * 1000) // expired
			},
			livefyre: {
				metadata: {
					data: {
						articleId: '7c700a86-d7a8-46e7-b0bd-2d79f1ca3b52',
						siteId: 415343,
						collectionMeta: 'expiredCollectionMeta',
						checksum: 'expiredChecksum'
					},
					expires: new Date(new Date().getTime() - 60 * 1000) // expired
				}
			}
		}
	},
	capiDown1: {
		id: 'capi-down1',
		title: 'CAPI down',
		url: 'http://www.ft.com/cms/capi-down1.html',
		siteId: 415343
	},
	capiDown2: {
		id: 'capi-down2',
		title: 'CAPI down',
		url: 'http://www.ft.com/cms/capi-down2.html',
		siteId: 415343
	},
	capiDownCached: {
		id: 'capi-down-cached',
		title: 'CAPI down cached',
		url: 'http://www.ft.com/cms/capi-down-cached.html',
		siteId: 415343,
		initialCache: {
			_id: 'capi-down-cached',
			tags: {
				data: [],
				shortTTL: true,
				expires: new Date(new Date().getTime() + 60 * 60 * 1000) // not expired
			}
		}
	}
};

let articleCollectionExists = [];
for (let key in articles) {
	if (articles.hasOwnProperty(key)) {
		if (key !== 'noCollection') {
			articleCollectionExists.push(articles[key].id);
		}
	}
}

let articlesById = {};
Object.keys(articles).forEach(function (key, index) {
	articlesById[articles[key].id] = articles[key];
});


const capiData = {
	annotations: [
		{
			"predicate": "http://www.ft.com/ontology/classification/isClassifiedBy",
			"prefLabel": "Brand1",
			"type": "BRAND",
			"directType": "http://www.ft.com/ontology/product/Brand"
		},
		{
			"predicate": "http://www.ft.com/ontology/annotation/hasAuthor",
			"prefLabel": "Author1",
			"type": "PERSON",
			"directType": "http://www.ft.com/ontology/person/Person"
		},
		{
			"predicate": "http://www.ft.com/ontology/annotation/hasAuthor",
			"prefLabel": "Author2",
			"type": "PERSON",
			"directType": "http://www.ft.com/ontology/person/Person"
		},
		{
			"predicate": "http://www.ft.com/ontology/classification/isClassifiedBy",
			"prefLabel": "Section1",
			"type": "SECTION",
			"directType": "http://www.ft.com/ontology/Section"
		},
		{
			"predicate": "http://www.ft.com/ontology/classification/isClassifiedBy",
			"prefLabel": "Section2",
			"type": "SECTION",
			"directType": "http://www.ft.com/ontology/Section"
		},
		{
			"predicate": "http://www.ft.com/ontology/annotation/mentions",
			"prefLabel": "Organisation1",
			"type": "ORGANISATION",
			"directType": "http://www.ft.com/ontology/organisation/Organisation"
		}
	]
};

const defaultTagListCollectionMeta = 'brand.Brand1,person.Author1,author.Author1,person.Author2,author.Author2,section.Section1,section.Section2,organisation.Organisation1';


var articleData = {};
Object.keys(articles).forEach(function (key, index) {
	articleData[articles[key].id] = capiData;
});
delete articleData['capi-down1'];
delete articleData['capi-down2'];
delete articleData['capi-down-cached'];


const env = {
	livefyre: {
		network: {
			name: 'ft-1',
			key: 'network-key'
		},
		defaultSiteId: 1412,
		siteKeys: {
			1: 'key1',
			2: 'key2',
			3: 'key3',
			415343: 'key415343',
			1412: 'key1412'
		},
		api: {
			collectionExistsUrl: 'http://{networkName}.collection-exists.livefyre.com/{articleIdBase64}',
			bootstrapUrl: 'http://bootstrap.{networkName}.fyre.co/bs3/{networkName}.fyre.co/{siteId}/{articleIdBase64}/bootstrap.html'
		}
	},
	mongo: {
		uri: 'mongo-uri'
	},
	capi: {
		key: 't23r',
		url: 'http://api.ft.com/{uuid}?key={apiKey}'
	},
	cacheExpiryHours: {
		articles: 1
	},
	validation: {
		pseudonym: {
			allowedCharacters: " !#$%'()*+,-./0123456789:;=?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~"
		}
	},
	'@global': true
};




const nEsClientMock = new NEsClientMock({
	articleData: articleData,
	global: true
});

let legacySiteMapping = [];
Object.keys(articles).forEach(function (key, index) {
	legacySiteMapping.push({
		_id: articles[key].id,
		siteId: articles[key].siteId
	});
});
const mongodbMock = new MongodbMock({
	dbMock: {
		legacy_site_mapping: legacySiteMapping,
		articles: [articles.cached.initialCache, articles.toBeUpdated.initialCache, articles.capiDownCached.initialCache]
	},
	global: true
});

const requestMock = new RequestMock({
	items: [
		{
			url: env.livefyre.api.collectionExistsUrl,
			handler: function (config) {
				let articleId = new Buffer(config.matches.urlParams.articleIdBase64, 'base64').toString();

				if (config.matches.urlParams.networkName !== env.livefyre.network.name) {
					config.callback(new Error("Network not found"));
					return;
				}

				if (articleCollectionExists.indexOf(articleId) !== -1) {
					config.callback(null, {
						statusCode: 200
					});
					return;
				}

				config.callback(null, {
					statusCode: 404
				});
			}
		}
	],
	global: true
});

const livefyreMock = new LivefyreMock({
	global: true
});




exports.mockInstances = {
	'n-es-client': nEsClientMock,
	mongodb: mongodbMock,
	livefyre: livefyreMock,
	request: requestMock
};

exports.articles = articles;
exports.defaultTagListCollectionMeta = defaultTagListCollectionMeta;
exports.mocks = {
	'n-es-client': nEsClientMock.mock,
	mongodb: mongodbMock.mock,
	livefyre: livefyreMock.mock,
	request: requestMock.mock,
	env: env
};
