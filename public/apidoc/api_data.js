define({ "api": [
  {
    "type": "get",
    "url": "v1/livefyre/commentcount",
    "title": "Get comment count of an article",
    "version": "1.1.0",
    "group": "v1_livefyre",
    "name": "commentcount",
    "description": "<p>See <a href=\"https://api.livefyre.com/docs/apis/by-category/integration#operation=urn:livefyre:apis:bootstrap:operations:api:v1.1:public:comments:ncomments.json:method=get\">Livefyre API documentation</a></p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "articleId",
            "description": "<p>Required. ID of the article.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "success": [
          {
            "group": "success",
            "type": "String",
            "optional": false,
            "field": "count",
            "description": "<p>The number of comments</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success",
          "content": "HTTP/1.1 200 OK\n {\n     \"count\": 4\n }",
          "type": "json"
        }
      ]
    },
    "filename": "app/routes/v1/livefyre.js",
    "groupTitle": "v1_livefyre"
  },
  {
    "type": "get",
    "url": "v1/livefyre/commentcounts",
    "title": "Get comment count of multiple articles",
    "version": "1.1.0",
    "group": "v1_livefyre",
    "name": "commentcounts",
    "description": "<p>See <a href=\"https://api.livefyre.com/docs/apis/by-category/integration#operation=urn:livefyre:apis:bootstrap:operations:api:v1.1:public:comments:ncomments.json:method=get\">Livefyre API documentation</a></p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "articleIds",
            "description": "<p>Required. Comma separated list of article IDs.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "success": [
          {
            "group": "success",
            "type": "Object",
            "optional": false,
            "field": "articleId:count",
            "description": "<p>Key-value pair of articleId : count</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success",
          "content": "HTTP/1.1 200 OK\n {\n     \"2e94652d-d98c-385d-8257-7e4312b91ac9\": 2,\n     \"edeb0cb5-d98c-314c-99f7-808b14a1ab4a\": 3,\n     \"be21a923-ee80-364b-a3b7-ef986ee50dd7\": 4,\n     \"fa192e30-a67f-39fd-af31-585de10a5559\": 53\n }",
          "type": "json"
        }
      ]
    },
    "filename": "app/routes/v1/livefyre.js",
    "groupTitle": "v1_livefyre"
  },
  {
    "type": "get",
    "url": "v1/livefyre/getSiteId",
    "title": "Get site ID",
    "version": "1.1.0",
    "group": "v1_livefyre",
    "name": "getSiteId",
    "description": "<p>Determines the site ID of the article</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "articleId",
            "description": "<p>ID of the article</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Full response",
          "content": "HTTP/1.1 200 OK\n {\n     \"siteId\": \"123432\"\n }",
          "type": "json"
        },
        {
          "title": "Unclassified article",
          "content": "HTTP/1.1 200 OK\n {\n     \"unclassifiedArticle\": true\n }",
          "type": "json"
        }
      ]
    },
    "error": {
      "examples": [
        {
          "title": "No article ID",
          "content": "HTTP/1.1 400 Bad request\n \"articleId\" should be provided.",
          "type": "400"
        }
      ]
    },
    "filename": "app/routes/v1/livefyre.js",
    "groupTitle": "v1_livefyre"
  },
  {
    "type": "get",
    "url": "v1/livefyre/get_lf_bootstrap",
    "title": "Get livefyre bootstrap URL",
    "version": "1.1.0",
    "group": "v1_livefyre",
    "name": "get_lf_bootstrap",
    "description": "<p>See <a href=\"http://answers.livefyre.com/developers/advanced-topics/bootstrap-html/\">Livefyre documentation</a></p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "uuid",
            "description": "<p>Required. ID of the article.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "success": [
          {
            "group": "success",
            "type": "String",
            "optional": false,
            "field": "url",
            "description": "<p>URL which points to a ready rendered version of the comments widget.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success",
          "content": "HTTP/1.1 200 OK\n {\n     \"url\": \"https://bootstrap.ft-1.fyre.co/bs3/ft-1.fyre.co/377197/ZTc4ZDA3Y2EtNjgwZi0xMWU1LWE1N2YtMjFiODhmN2Q5NzNm/bootstrap.html\"\n }",
          "type": "json"
        }
      ]
    },
    "filename": "app/routes/v1/livefyre.js",
    "groupTitle": "v1_livefyre"
  },
  {
    "type": "get",
    "url": "v1/livefyre/getcollectiondetails",
    "title": "Get collection details",
    "version": "1.1.0",
    "group": "v1_livefyre",
    "name": "getcollectiondetails",
    "description": "<p>Generates information needed by Livefyre about the article.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "articleId",
            "description": "<p>Required. ID of the article.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "url",
            "description": "<p>Required. Url of the article.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "title",
            "description": "<p>Required. Title of the article.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "stream_type",
            "description": "<p>Optional. Can be one of 'livecomments', 'liveblog', 'livechat'. Default is 'livecomments'.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "tags",
            "description": "<p>Optional. Additional tags for the collection (added to the CAPI and URL based tags). Comma separated.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "sessionId",
            "description": "<p>Session ID of the user. Optional, but if not present, FTSession cookie is used.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "success": [
          {
            "group": "success",
            "type": "Number",
            "optional": false,
            "field": "siteId",
            "description": "<p>See <a href=\"http://answers.livefyre.com/developers/app-integrations/comments/#convConfigObject\">Livefyre documentation</a></p>"
          },
          {
            "group": "success",
            "type": "String",
            "optional": false,
            "field": "articleId",
            "description": "<p>ID of the article, echo of the input parameter.</p>"
          },
          {
            "group": "success",
            "type": "String",
            "optional": false,
            "field": "collectionMeta",
            "description": "<p>See <a href=\"http://answers.livefyre.com/developers/app-integrations/comments/#convConfigObject\">Livefyre documentation</a></p>"
          },
          {
            "group": "success",
            "type": "String",
            "optional": false,
            "field": "checksum",
            "description": "<p>See <a href=\"http://answers.livefyre.com/developers/app-integrations/comments/#convConfigObject\">Livefyre documentation</a></p>"
          },
          {
            "group": "success",
            "type": "String",
            "optional": false,
            "field": "notAllowedToCreateCollection",
            "description": "<p>Present only if the user is not authenticated and the collection does not exist. In this case this user is not allowed to create the collection.</p>"
          }
        ],
        "unclassified": [
          {
            "group": "unclassified",
            "type": "Boolean",
            "optional": false,
            "field": "unclassifiedArticle",
            "description": "<p>Relates to the legacy mapping of articles to different sites based on primary section/URL. If the URL was not mapped by the legacy mapping logic, flag it.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Normal success",
          "content": "HTTP/1.1 200 OK\n {\n    \"siteId\": 375297,\n    \"articleId\": \"e78d07ca-680f-11e5-a57f-21b88f7d973f\",\n    \"collectionMeta\": \"eyJ0eXAiOiJKV16134HFOiJIUzI1NiJ9.eyJ0eXBlIjoiSHRGRGRjfg452iJLYXRoZXJpbmUgR2FycmV0dC1Db3ggc3RlcHMgYmFjayBpbiBBbGxpYW5jZSBUcnVzdCBzaGFrZS11cCIsImFydGljbGVJZCI6ImU3OGQwN2NhLTY4MGYtMTFlNS1hNTdmLTIxYjg4ZjdkOTczZiIsInVybCI6Imh0dHA6Ly93d3cuZnQuY29tL2ludGwvY21zL3MvMC9lNzhkMDdjYS02ODBmLTExZTUtYTU3Zi0yMWI4OGY3ZDk3M2YuaHRtbCIsInRhZ3MiOiJzZWN0aW9ucy5Db21wYW5pZXMsc2VjdGlvbnMuRmluYW5jaWFscyxzZWN0aW9ucy5GaW5hbmNpYWxfU2VydmljZXMsc2VjdGlvbnMuVUtfQ29tcGFuaWVzLGF1dGhvcnMuRGF2aWRfT2FrbGV5LGF1dGhvcnMuTmF0aGFsaWVfVGhvbWFzIiwiaXNzIjoidXJuOmxpdmVmeXJlOmZ0LTEuZnlyZS5jbzpzaXRlPTM3NzE5NyIsImlhdCI6MTQ0NzA3OTYwNH0.oW2sCELfPTlj_7JLVzVhhiM86mRpW56uYNDcP4D7Tj8\",\n    \"checksum\": \"974b4240f9ad8423015612809be6990f\"\n }",
          "type": "json"
        },
        {
          "title": "Not authenticated / no collection",
          "content": "HTTP/1.1 200 OK\n {\n    \"siteId\": 375297,\n    \"articleId\": \"e78d07ca-680f-11e5-a57f-21b88f7d973f\",\n    \"collectionMeta\": \"eyJ0eXAiOiJKV16134HFOiJIUzI1NiJ9.eyJ0eXBlIjoiSHRGRGRjfg452iJLYXRoZXJpbmUgR2FycmV0dC1Db3ggc3RlcHMgYmFjayBpbiBBbGxpYW5jZSBUcnVzdCBzaGFrZS11cCIsImFydGljbGVJZCI6ImU3OGQwN2NhLTY4MGYtMTFlNS1hNTdmLTIxYjg4ZjdkOTczZiIsInVybCI6Imh0dHA6Ly93d3cuZnQuY29tL2ludGwvY21zL3MvMC9lNzhkMDdjYS02ODBmLTExZTUtYTU3Zi0yMWI4OGY3ZDk3M2YuaHRtbCIsInRhZ3MiOiJzZWN0aW9ucy5Db21wYW5pZXMsc2VjdGlvbnMuRmluYW5jaWFscyxzZWN0aW9ucy5GaW5hbmNpYWxfU2VydmljZXMsc2VjdGlvbnMuVUtfQ29tcGFuaWVzLGF1dGhvcnMuRGF2aWRfT2FrbGV5LGF1dGhvcnMuTmF0aGFsaWVfVGhvbWFzIiwiaXNzIjoidXJuOmxpdmVmeXJlOmZ0LTEuZnlyZS5jbzpzaXRlPTM3NzE5NyIsImlhdCI6MTQ0NzA3OTYwNH0.oW2sCELfPTlj_7JLVzVhhiM86mRpW56uYNDcP4D7Tj8\",\n    \"checksum\": \"974b4240f9ad8423015612809be6990f\",\n    \"notAllowedToCreateCollection\": true\n }",
          "type": "json"
        },
        {
          "title": "Unclassified article",
          "content": "HTTP/1.1 200 OK\n {\n    \"unclassifiedArticle\": true\n }",
          "type": "json"
        }
      ]
    },
    "filename": "app/routes/v1/livefyre.js",
    "groupTitle": "v1_livefyre"
  },
  {
    "type": "get",
    "url": "v1/livefyre/hottest",
    "title": "Get hottest articles",
    "version": "1.1.0",
    "group": "v1_livefyre",
    "name": "hottest",
    "description": "<p>See <a href=\"http://api.livefyre.com/docs/apis/by-category/collections#operation=urn:livefyre:apis:bootstrap:operations:api:v3.0:hottest:method=get\">Livefyre API documentation</a></p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "Number",
            "optional": false,
            "field": "number",
            "defaultValue": "10",
            "description": "<p>Optional. The number of results you'd like. The default is 10 and the maximum is 100.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "tag",
            "description": "<p>Optional. Filter results to include only Collections with a certain tag. Note: Boolean operators AND, OR, and NOT rules with multiple tags are supported. Only one operator per query. Strings must be entered as params titled 'tag' in a URL-safe format. 10 tags max. For example: https://{networkName}.bootstrap.fyre.co/api/v3.0/hottest/?tag=unga&amp;tag=bunga&amp;op=and To return only Collections with both tags 'a' and 'b', use ?tag=a&amp;tag=b&amp;op=and To exclude Collections with tags 'private', use ?tag=private&amp;op=not To return only Collections with either tag 'a' or tag 'b', use ?tag=a&amp;tag=b&amp;op=or</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "success": [
          {
            "group": "success",
            "type": "Array",
            "optional": false,
            "field": "Array",
            "description": "<p>of object with the following fields: url, title, articleId, heat.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success",
          "content": "HTTP/1.1 200 OK\n [\n \t{\n \t\t\"url\": \"http://ftalphaville.ft.com/2016/10/26/2178098/bitcoin-as-a-chinese-capital-outflow-proxy/\",\n \t\t\"title\": \"Bitcoin as a Chinese capital outflow proxy | FT Alphaville\",\n \t\t\"articleId\": \"45ef577b-23f8-3912-9fae-2a157252fe70\",\n \t\t\"heat\": 4.286890264538921\n   \t},\n   \t{\n \t\t\"url\": \"http://ftalphaville.ft.com/2016/10/26/2178004/the-autoignition-temperature-of-manual-cars-is-much-higher-than-fahrenheit-451/\",\n \t\t\"title\": \"The autoignition temperature of manual cars is much higher than Fahrenheit 451 | FT Alphaville\",\n \t\t\"articleId\": \"d2b380dd-5002-39f5-a6f8-9dcbfd99d3e5\",\n \t\t\"heat\": 3.1300482263374416\n   \t}\n ]",
          "type": "json"
        }
      ]
    },
    "filename": "app/routes/v1/livefyre.js",
    "groupTitle": "v1_livefyre"
  },
  {
    "type": "get",
    "url": "v1/livefyre/init",
    "title": "Init",
    "version": "1.1.0",
    "group": "v1_livefyre",
    "name": "init",
    "description": "<p>Endpoint to init the comments application. It returns both article and user informations.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "articleId",
            "description": "<p>Required. ID of the article.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "url",
            "description": "<p>Required. Url of the article.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "title",
            "description": "<p>Required. Title of the article.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "el",
            "description": "<p>Required. ID of a DOM element in which the widget should be loaded. It is echoed in the response.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "stream_type",
            "description": "<p>Optional. Can be one of 'livecomments', 'liveblog', 'livechat'. Default is 'livecomments'.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "tags",
            "description": "<p>Optional. Additional tags for the collection (added to the default of CAPI and URL based tags). Comma separated.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "sessionId",
            "description": "<p>Session ID of the user. Optional, but if not present, FTSession cookie is used.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "success": [
          {
            "group": "success",
            "type": "Object",
            "optional": false,
            "field": "init",
            "description": "<p>Data about the article</p>"
          },
          {
            "group": "success",
            "type": "Number",
            "optional": false,
            "field": "init.siteId",
            "description": "<p>See <a href=\"http://answers.livefyre.com/developers/app-integrations/comments/#convConfigObject\">Livefyre documentation</a></p>"
          },
          {
            "group": "success",
            "type": "String",
            "optional": false,
            "field": "init.articleId",
            "description": "<p>Article ID.</p>"
          },
          {
            "group": "success",
            "type": "String",
            "optional": false,
            "field": "init.collectionMeta",
            "description": "<p>See <a href=\"http://answers.livefyre.com/developers/app-integrations/comments/#convConfigObject\">Livefyre documentation</a></p>"
          },
          {
            "group": "success",
            "type": "String",
            "optional": false,
            "field": "init.checksum",
            "description": "<p>See <a href=\"http://answers.livefyre.com/developers/app-integrations/comments/#convConfigObject\">Livefyre documentation</a></p>"
          },
          {
            "group": "success",
            "type": "String",
            "optional": false,
            "field": "init.notAllowedToCreateCollection",
            "description": "<p>Present only if the user is not authenticated and the collection does not exist. In this case this user is not allowed to create the collection.</p>"
          },
          {
            "group": "success",
            "type": "Object",
            "optional": false,
            "field": "auth",
            "description": "<p>Data about the user</p>"
          },
          {
            "group": "success",
            "type": "Boolean",
            "optional": false,
            "field": "auth.token",
            "description": "<p>Auth token of Livefyre. See <a href=\"http://answers.livefyre.com/developers/getting-started/tokens/auth/\">Livefyre documentation</a></p>"
          },
          {
            "group": "success",
            "type": "Boolean",
            "optional": false,
            "field": "auth.expires",
            "description": "<p>Timestamp of when the token expires.</p>"
          },
          {
            "group": "success",
            "type": "Boolean",
            "optional": false,
            "field": "auth.displayName",
            "description": "<p>The user's pseudonym (nickname).</p>"
          },
          {
            "group": "success",
            "type": "Boolean",
            "optional": false,
            "field": "auth.settings",
            "description": "<p>The user's email notification settings.</p>"
          }
        ],
        "unclassified": [
          {
            "group": "unclassified",
            "type": "Object",
            "optional": false,
            "field": "init",
            "description": "<p>Data about the article</p>"
          },
          {
            "group": "unclassified",
            "type": "Boolean",
            "optional": false,
            "field": "init.unclassifiedArticle",
            "description": "<p>Relates to the legacy mapping of articles to different sites based on primary section/URL. If the URL was not mapped by the legacy mapping logic, flag it.</p>"
          }
        ],
        "no pseudonym": [
          {
            "group": "no pseudonym",
            "type": "Object",
            "optional": false,
            "field": "auth",
            "description": "<p>Data about the user</p>"
          },
          {
            "group": "no pseudonym",
            "type": "Boolean",
            "optional": false,
            "field": "auth.pseudonym",
            "description": "<p>Pseudonym false is the flag that the user does not have a pseudonym yet.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Full response",
          "content": "HTTP/1.1 200 OK\n {\n     \"init\": {\n         \"siteId\": 377197,\n         \"articleId\": \"e78d07ca-680f-11e5-a57f-21b88f7d973f\",\n         \"collectionMeta\": \"eyJ0eXAiOiJKV1QiLCJhbGDHD253IUzI1NiJ9.eyJ0eXBlIjoi456GSHRFFHFdGl0bGUiOiJLYXRoZXJpg4dfGSD46b3ggc3RlcHMgYmFjayBpbiBBbGxpYW5jZSBUcnVzdCBzaGFrZS11cCIsImFydGljbGVJZCI6ImU3OGQwN2NhLTY4MGYtMTFlNS1hNTdmLTIxYjg4ZjdkOTczZiIsInVybCI6Imh0dHA6Ly93d3cuZnQuY29tL2ludGwvY21zL3MvMC9lNzhkMDdjYS02ODBmLTExZTUtYTU3Zi0yMWI4OGY3ZDk3M2YuaHRtbCIsInRhZ3MiOiJzZWN0aW9ucy5Db21wYW5pZXMsc2VjdGlvbnMuRmluYW5jaWFscyxzZWN0aW9ucy5GaW5hbmNpYWxfU2VydmljZXMsc2VjdGlvbnMuVUtfQ29tcGFuaWVzLGF1dGhvcnMuRGF2aWRfT2FrbGV5LGF1dGhvcnMuTmF0aGFsaWVfVGhvbWFzIiwiaXNzIjoidXJuOmxpdmVmeXJlOmZ0LTEuZnlyZS5jbzpzaXRlPTM3NzE5NyIsImlhdCI6MTQ0NzA3OTYwNH0.oW2sCELfPTlj_7JLVzVhhiM86mRpW56uYNDcP4D7Tj8\",\n         \"checksum\": \"974b4cc0f9gf7813015612809be6990f\",\n         \"el\": \"dom-element-id\"\n     },\n     \"auth\": {\n         \"token\": \"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJkb21haW4iOiJmdC0xHRV4567GGRVJDSoiOTAyNjUwMiIsImRpc3BsYXlfbmFtZSGS45681265dsSDGbjMiLCJleHBpcmVmdIDGKSDOaswLjQxNSwiaWF0IjoxNDQ3MDgzNTAxfQ.vDVUaBrd-qGFQFKvAEQMGSD45239SHDuCh_tXZR1WwRg\",\n         \"expires\": 1462635461193,\n         \"displayName\": \"the avenger\",\n         \"settings\": {\n             \"emailcomments\": \"hourly\",\n             \"emaillikes\": \"never\",\n             \"emailreplies\": \"immediately\",\n             \"emailautofollow\": \"off\"\n         }\n     }\n }",
          "type": "json"
        },
        {
          "title": "Unclassified article",
          "content": "HTTP/1.1 200 OK\n {\n    \"init\": {\n        \"unclassifiedArticle\": true\n    },\n    \"auth\": {\n        ....\n    }\n }",
          "type": "json"
        },
        {
          "title": "No pseudonym",
          "content": "HTTP/1.1 200 OK\n {\n    \"init\": {\n        ...\n    },\n    \"auth\": {\n        \"pseudonym\": false\n    }\n }",
          "type": "json"
        }
      ]
    },
    "filename": "app/routes/v1/livefyre.js",
    "groupTitle": "v1_livefyre"
  },
  {
    "type": "get",
    "url": "v1/livefyre/metadata",
    "title": "Metadata",
    "version": "1.1.0",
    "group": "v1_livefyre",
    "name": "metadata",
    "description": "<p>Returns the list of tags of an article based on CAPI and the URL structure.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "articleId",
            "description": "<p>Required. ID of the article.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "url",
            "description": "<p>Required. Url of the article.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "-",
            "description": "<p>List of tags based on CAPI and the URL of the article.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success",
          "content": "HTTP/1.1 200 OK\n [\n   \"sections.World\",\n   \"authors.Naomi Ronvick\",\n   \"brand.The World\",\n   \"blog\",\n   \"the-world\"\n ]",
          "type": "json"
        },
        {
          "title": "No tags found",
          "content": "HTTP/1.1 200 OK\n []",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "Array",
            "optional": false,
            "field": "-",
            "description": "<p>Empty list</p>"
          }
        ]
      }
    },
    "filename": "app/routes/v1/livefyre.js",
    "groupTitle": "v1_livefyre"
  },
  {
    "type": "get",
    "url": "v1/livefyre/profile",
    "title": "User profile for Livefyre",
    "version": "1.1.0",
    "group": "v1_livefyre",
    "name": "profile",
    "description": "<p>Used for Livefyre's ping for pull mechanism. It returns the user's profile in a format that Livefyre understands. See <a href=\"http://answers.livefyre.com/developers/identity-integration/your-identity/#BuildTheResponse\">Livefyre documentation</a></p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "id",
            "description": "<p>Required. ID of the user (either eRights ID or UUID).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "lftoken",
            "description": "<p>Required. System token of the Livefyre network. It should be valid in order the API to respond. See <a href=\"http://answers.livefyre.com/developers/libraries/methods/network/#link-buildlivefyretoken-nodejs\">Livefyre documentation</a></p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "success": [
          {
            "group": "success",
            "type": "String",
            "optional": false,
            "field": "id",
            "description": "<p>ID of the user (eRights ID if it exists, otherwise UUID)</p>"
          },
          {
            "group": "success",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>Email address of the user</p>"
          },
          {
            "group": "success",
            "type": "String",
            "optional": false,
            "field": "first_name",
            "description": "<p>First name of the user</p>"
          },
          {
            "group": "success",
            "type": "String",
            "optional": false,
            "field": "last_name",
            "description": "<p>Last name of the user</p>"
          },
          {
            "group": "success",
            "type": "String",
            "optional": false,
            "field": "display_name",
            "description": "<p>Pseudonym (nickname) of the user</p>"
          },
          {
            "group": "success",
            "type": "String",
            "optional": false,
            "field": "email_notifications",
            "description": "<p>Email notifications</p>"
          },
          {
            "group": "success",
            "type": "String",
            "optional": false,
            "field": "email_notifications.comments",
            "description": "<p>Email notifications in case someone comments in a conversation the user is following</p>"
          },
          {
            "group": "success",
            "type": "String",
            "optional": false,
            "field": "email_notifications.likes",
            "description": "<p>Email notifications in case someone likes the user's comment</p>"
          },
          {
            "group": "success",
            "type": "String",
            "optional": false,
            "field": "email_notifications.replies",
            "description": "<p>Email notifications in case someone replies to the user's comment</p>"
          },
          {
            "group": "success",
            "type": "String",
            "optional": false,
            "field": "autofollow_conversations",
            "description": "<p>Auto-follow any conversation after the user posts a comment in it</p>"
          },
          {
            "group": "success",
            "type": "String",
            "optional": false,
            "field": "settings_url",
            "description": "<p>URL to the user's profile page</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success",
          "content": "HTTP/1.1 200 OK\n {\n     \"id\": \"9036415\",\n     \"email\": \"john.rush@ft.com\",\n     \"first_name\": \"John\",\n     \"last_name\": \"Rush\",\n     \"display_name\": \"myname\",\n     \"email_notifications\": {\n         \"comments\": \"immediately\",\n         \"likes\": \"never\",\n         \"replies\": \"often\"\n     },\n     \"autofollow_conversations\": \"false\",\n     \"settings_url\": \"\"\n }",
          "type": "json"
        }
      ]
    },
    "filename": "app/routes/v1/livefyre.js",
    "groupTitle": "v1_livefyre"
  },
  {
    "type": "get / post",
    "url": "v1/user/emptyPseudonym",
    "title": "Empty pseudonym",
    "version": "1.1.0",
    "group": "v1_user",
    "name": "emptyPseudonym",
    "description": "<p>Empties the user's pseudonym.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "sessionId",
            "description": "<p>Session ID of the user. Optional, but if not present, FTSession cookie is used.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>Status of the update.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Full response",
          "content": "HTTP/1.1 200 OK\n {\n     \"status\": \"ok\"\n }",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>Status of the update.</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "error",
            "description": "<p>Error message.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Not logged in",
          "content": "HTTP/1.1 401 Unauthorized\n {\n     \"status\": \"error\",\n     \"error\": \"User session is not valid.\"\n }",
          "type": "401"
        }
      ]
    },
    "filename": "app/routes/v1/user.js",
    "groupTitle": "v1_user"
  },
  {
    "type": "get",
    "url": "v1/user/getPseudonym",
    "title": "Get pseudonym",
    "version": "1.1.0",
    "group": "v1_user",
    "name": "getPseudonym",
    "description": "<p>Reads the user's pseudonym.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "userIds",
            "description": "<p>List of user IDs for which to fetch the pseudonyms, comma separated.</p>"
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "X-Api-Key",
            "description": "<p>Access API key.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Full response",
          "content": "HTTP/1.1 200 OK\n {\n     \"3f330864-1c0f-443e-a6b3-cf8a3b536a52\": \"pseu132\"\n }",
          "type": "json"
        },
        {
          "title": "No pseudonym",
          "content": "HTTP/1.1 200 OK\n {\n     \"3f330864-1c0f-443e-a6b3-cf8a3b536a52\": false\n }",
          "type": "json"
        },
        {
          "title": "User not found",
          "content": "HTTP/1.1 200 OK\n {\n     \"3f330864-1c0f-443e-a6b3-cf8a3b536a52\": false\n }",
          "type": "json"
        }
      ]
    },
    "error": {
      "examples": [
        {
          "title": "No API key / no userId",
          "content": "HTTP/1.1 400 Bad request\n {\n     \"error\": \"API key is missing.\"\n }",
          "type": "400"
        },
        {
          "title": "API key invalid",
          "content": "HTTP/1.1 401 Unauthorized\n {\n     \"error\": \"API key is invalid.\"\n }",
          "type": "401"
        }
      ]
    },
    "filename": "app/routes/v1/user.js",
    "groupTitle": "v1_user"
  },
  {
    "type": "get",
    "url": "v1/user/getauth",
    "title": "Auth",
    "version": "1.1.0",
    "group": "v1_user",
    "name": "getauth",
    "description": "<p>Returns authentication information about the user.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "sessionId",
            "description": "<p>Session ID of the user. Optional, but if not present, FTSession cookie is used.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "success": [
          {
            "group": "success",
            "type": "Object",
            "optional": false,
            "field": "auth",
            "description": "<p>Data about the user</p>"
          },
          {
            "group": "success",
            "type": "Boolean",
            "optional": false,
            "field": "auth.token",
            "description": "<p>Auth token of Livefyre. See <a href=\"http://answers.livefyre.com/developers/getting-started/tokens/auth/\">Livefyre documentation</a></p>"
          },
          {
            "group": "success",
            "type": "Boolean",
            "optional": false,
            "field": "auth.expires",
            "description": "<p>Timestamp of when the token expires.</p>"
          },
          {
            "group": "success",
            "type": "Boolean",
            "optional": false,
            "field": "auth.displayName",
            "description": "<p>The user's pseudonym (nickname).</p>"
          },
          {
            "group": "success",
            "type": "Boolean",
            "optional": false,
            "field": "auth.settings",
            "description": "<p>The user's email notification settings.</p>"
          }
        ],
        "no pseudonym": [
          {
            "group": "no pseudonym",
            "type": "Object",
            "optional": false,
            "field": "auth",
            "description": "<p>Data about the user</p>"
          },
          {
            "group": "no pseudonym",
            "type": "Boolean",
            "optional": false,
            "field": "auth.pseudonym",
            "description": "<p>Pseudonym false is the flag that the user does not have a pseudonym yet.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Full response",
          "content": "HTTP/1.1 200 OK\n {\n     \"token\": \"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJkb21haW4iOiJmdC0xHRV4567GGRVJDSoiOTAyNjUwMiIsImRpc3BsYXlfbmFtZSGS45681265dsSDGbjMiLCJleHBpcmVmdIDGKSDOaswLjQxNSwiaWF0IjoxNDQ3MDgzNTAxfQ.vDVUaBrd-qGFQFKvAEQMGSD45239SHDuCh_tXZR1WwRg\",\n     \"expires\": 1462635461193,\n     \"displayName\": \"the avenger\",\n     \"settings\": {\n         \"emailcomments\": \"hourly\",\n         \"emaillikes\": \"never\",\n         \"emailreplies\": \"immediately\",\n         \"emailautofollow\": \"off\"\n     }\n }",
          "type": "json"
        },
        {
          "title": "No pseudonym",
          "content": "HTTP/1.1 200 OK\n {\n    \"pseudonym\": false\n }",
          "type": "json"
        }
      ]
    },
    "error": {
      "examples": [
        {
          "title": "Unauthorized",
          "content": "HTTP/1.1 401 Unauthorized\n  Unauthorized",
          "type": "401"
        }
      ]
    },
    "filename": "app/routes/v1/user.js",
    "groupTitle": "v1_user"
  },
  {
    "type": "get / post",
    "url": "v1/user/setPseudonym",
    "title": "Set pseudonym",
    "version": "1.1.0",
    "group": "v1_user",
    "name": "setPseudonym",
    "description": "<p>Updates the user's pseudonym.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "pseudonym",
            "description": "<p>Required. Pseudonym to be set.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "sessionId",
            "description": "<p>Session ID of the user. Optional, but if not present, FTSession cookie is used.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>Status of the update.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Full response",
          "content": "HTTP/1.1 200 OK\n {\n     \"status\": \"ok\"\n }",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>Status of the update.</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "error",
            "description": "<p>Error message.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Pseudonym empty",
          "content": "HTTP/1.1 400 Bad request\n {\n     \"status\": \"error\",\n     \"error\": \"Pseudonym invalid or not provided.\"\n }",
          "type": "400"
        },
        {
          "title": "Not logged in",
          "content": "HTTP/1.1 401 Unauthorized\n {\n     \"status\": \"error\",\n     \"error\": \"User session is not valid.\"\n }",
          "type": "401"
        }
      ]
    },
    "filename": "app/routes/v1/user.js",
    "groupTitle": "v1_user"
  },
  {
    "type": "get / post",
    "url": "v1/user/updateuser",
    "title": "Update user",
    "version": "1.1.0",
    "group": "v1_user",
    "name": "updateUser",
    "description": "<p>Updates the user's comments settings: pseudonym, email notification preferences.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "pseudonym",
            "description": "<p>Optional. Pseudonym to be set.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "emailcomments",
            "description": "<p>Optional. Pseudonym to be set.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "emaillikes",
            "description": "<p>Optional. Pseudonym to be set.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "emailreplies",
            "description": "<p>Optional. Pseudonym to be set.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "emailautofollow",
            "description": "<p>Optional. Pseudonym to be set.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "sessionId",
            "description": "<p>Session ID of the user. Optional, but if not present, FTSession cookie is used.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>Status of the update</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Full response",
          "content": "HTTP/1.1 200 OK\n {\n     \"status\": \"ok\"\n }",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>Status of the update.</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "error",
            "description": "<p>Error message.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Not logged in",
          "content": "HTTP/1.1 401 Unauthorized\n {\n     \"status\": \"error\",\n     \"error\": \"User session is not valid.\"\n }",
          "type": "401"
        }
      ]
    },
    "filename": "app/routes/v1/user.js",
    "groupTitle": "v1_user"
  },
  {
    "type": "post",
    "url": "v1/user/userUpdated",
    "title": "User updated",
    "version": "1.1.0",
    "group": "v1_user",
    "name": "userUpdated",
    "description": "<p>Endpoint to notify this system that basic user information has changed.</p>",
    "parameter": {
      "fields": {
        "get": [
          {
            "group": "get",
            "type": "String",
            "optional": false,
            "field": "apiKey",
            "description": "<p>Required. Only with a valid API key can this endpoint be called.</p>"
          }
        ],
        "post": [
          {
            "group": "post",
            "type": "String",
            "optional": false,
            "field": "email",
            "description": "<p>Required. Email address</p>"
          },
          {
            "group": "post",
            "type": "String",
            "optional": false,
            "field": "firstName",
            "description": "<p>Optional. First name</p>"
          },
          {
            "group": "post",
            "type": "String",
            "optional": false,
            "field": "lastName",
            "description": "<p>Optional. Last name</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>Status of the update.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Full response",
          "content": "HTTP/1.1 200 OK\n {\n     \"status\": \"ok\"\n }",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "status",
            "description": "<p>Status of the update.</p>"
          },
          {
            "group": "Error 4xx",
            "type": "String",
            "optional": false,
            "field": "error",
            "description": "<p>Error message.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Not logged in",
          "content": "HTTP/1.1 401 Unauthorized\n {\n     \"status\": \"error\",\n     \"error\": \"User session is not valid.\"\n }",
          "type": "401"
        }
      ]
    },
    "filename": "app/routes/v1/user.js",
    "groupTitle": "v1_user"
  }
] });
