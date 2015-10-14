"use strict";

var express = require('express');
var router = express.Router();
var SessionDataStore = require('../../modules/SessionDataStore');
var async = require('async');
var livefyreService = require('../../services/livefyre');
var consoleLogger = require('../../helpers/consoleLogger');

router.get('/getauth', function (req, res, next) {
	var userSession;
	if (req.cookies && req.cookies['FTSession']) {
		userSession = req.cookies['FTSession'];
	}
	if (req.query.sessionId) {
		userSession = req.query.sessionId;
	}

	var sessionDataStore;
	if (userSession) {
		sessionDataStore = new SessionDataStore(userSession);

		sessionDataStore.getAuthMetadata(function (errAuth, data) {
			if (errAuth) {
				res.jsonp({
					servicesUp: false
				});
				return;
			}

			if (data) {
				var returnData = {
					token: data.token,
					expires: data.expires,
					displayName: data.pseudonym
				};

				if (data.emailPreferences && Object.keys(data.emailPreferences).length) {
					returnData.settings = {};

					if (data.emailPreferences.comments) {
						returnData.settings.emailcomments = data.emailPreferences.comments;
					}

					if (data.emailPreferences.likes) {
						returnData.settings.emaillikes = data.emailPreferences.likes;
					}

					if (data.emailPreferences.replies) {
						returnData.settings.emailreplies = data.emailPreferences.replies;
					}

					if (data.emailPreferences.hasOwnProperty('autoFollow') && typeof data.emailPreferences.autoFollow === 'boolean') {
						returnData.settings.emailautofollow = data.emailPreferences.autoFollow ? 'on' : 'off';
					}
				}

				res.jsonp(returnData);
			} else {
				if (data === false) {
					res.jsonp({
						pseudonym: false
					});
				} else {
					res.sendStatus(401);
				}
			}
		});
	} else {
		res.sendStatus(401);
	}
});



var setPseudonym = function (req, res, next) {
	if (!req.query.pseudonym) {
		res.status(400).send('"pseudonym" should be provided');
		return;
	}


	var userSession;
	if (req.cookies && req.cookies['FTSession']) {
		userSession = req.cookies['FTSession'];
	}
	if (req.query.sessionId) {
		userSession = req.query.sessionId;
	}

	var sessionDataStore;
	if (userSession) {
		sessionDataStore = new SessionDataStore(userSession);

		sessionDataStore.getUserDataStore(function (errSess, userDataStore) {
			if (errSess) {
				res.sendStatus(503);
				return;
			}

			if (userDataStore) {
				userDataStore.setPseudonym(req.query.pseudonym, function (errSetPs) {
					if (errSetPs) {
						res.sendStatus(503);
						return;
					}

					sessionDataStore.invalidate(function (errInv) {
						if (errInv) {
							res.sendStatus(503);
							return;
						}

						res.jsonp({
							status: 'ok'
						});

						userDataStore.getLivefyrePreferredUserId(function (errLfId, lfUserId) {
							if (errLfId) {
								return;
							}

							livefyreService.callPingToPull(lfUserId, function (errPing) {
								if (errPing) {
									consoleLogger.warn('pingToPull error', errPing);
								}
							});
						});
					});
				});
			} else {
				res.sendStatus(401);
			}
		});
	} else {
		res.sendStatus(401);
	}
};
router.get('/setPseudonym', setPseudonym);
router.post('/setPseudonym', setPseudonym);



var updateUser = function (req, res, next) {
	var userSession;
	if (req.cookies && req.cookies['FTSession']) {
		userSession = req.cookies['FTSession'];
	}
	if (req.query.sessionId) {
		userSession = req.query.sessionId;
	}

	var sessionDataStore;
	if (userSession) {
		sessionDataStore = new SessionDataStore(userSession);

		sessionDataStore.getUserDataStore(function (errSess, userDataStore) {
			if (errSess) {
				res.sendStatus(503);
				return;
			}

			if (userDataStore) {
				async.parallel({
					pseudonym: function (callback) {
						if (req.query.pseudonym) {
							userDataStore.setPseudonym(req.query.pseudonym, function (errSetPs) {
								if (errSetPs) {
									callback(errSetPs);
									return;
								}

								callback();
							});
						} else {
							callback();
						}
					},
					emailPreferences: function (callback) {
						if (req.query.emailcomments || req.query.emaillikes || req.query.emailreplies || req.query.emailautofollow) {
							var autoFollow = null;
							if (req.query.emailautofollow === 'on' || req.query.emailautofollow === true || req.query.emailautofollow === 'true') {
								autoFollow = true;
							} else if (req.query.emailautofollow === 'off' || req.query.emailautofollow === false || req.query.emailautofollow === 'false') {
								autoFollow = false;
							}

							var validValues = ['never', 'immediately', 'hourly'];

							if (req.query.emailcomments && validValues.indexOf(req.query.emailcomments) === -1) {
								callback({
									400: "Email preference values are not valid."
								});
								return;
							}

							if (req.query.emaillikes && validValues.indexOf(req.query.emaillikes) === -1) {
								callback({
									400: "Email preference values are not valid."
								});
								return;
							}

							if (req.query.emailreplies && validValues.indexOf(req.query.emailreplies) === -1) {
								callback({
									400: "Email preference values are not valid."
								});
								return;
							}


							userDataStore.setEmailPreferences({
								comments: req.query.emailcomments,
								likes: req.query.emaillikes,
								replies: req.query.emailreplies,
								autoFollow: autoFollow
							}, function (errSetEmail) {
								if (errSetEmail) {
									callback(errSetEmail);
									return;
								}

								callback();
							});
						} else {
							callback();
						}
					}
				}, function (err, results) {
					if (err) {
						if (err['400']) {
							res.status(400).send(err['400']);
							return;
						}

						res.sendStatus(503);
						return;
					}

					userDataStore.getLivefyrePreferredUserId(function (errLfId, lfUserId) {
						if (errLfId) {
							return;
						}

						livefyreService.callPingToPull(lfUserId, function (errPing) {
							if (errPing) {
								consoleLogger.warn('pingToPull error', errPing);
							}
						});
					});

					sessionDataStore.invalidate(function () {
						res.jsonp({
							status: 'ok'
						});
					});
				});
			} else {
				res.sendStatus(401);
			}
		});
	} else {
		res.sendStatus(401);
	}
};
router.get('/updateuser', updateUser);
router.post('/updateuser', updateUser);



router.get('/emptypseudonym', function (req, res, next) {
	var userSession;
	if (req.cookies && req.cookies['FTSession']) {
		userSession = req.cookies['FTSession'];
	}
	if (req.query.sessionId) {
		userSession = req.query.sessionId;
	}

	var sessionDataStore;
	if (userSession) {
		sessionDataStore = new SessionDataStore(userSession);

		sessionDataStore.getUserDataStore(function (errSess, userDataStore) {
			if (errSess) {
				res.sendStatus(503);
				return;
			}

			if (userDataStore) {
				userDataStore.emptyPseudonym(function (errSetPs) {
					if (errSetPs) {
						res.sendStatus(503);
						return;
					}

					sessionDataStore.invalidate(function (errInv) {
						if (errInv) {
							res.sendStatus(503);
							return;
						}

						res.jsonp({
							status: 'ok'
						});

						userDataStore.getLivefyrePreferredUserId(function (errLfId, lfUserId) {
							if (errLfId) {
								return;
							}

							livefyreService.callPingToPull(lfUserId, function (errPing) {
								if (errPing) {
									consoleLogger.warn('pingToPull error', errPing);
								}
							});
						});
					});
				});
			} else {
				res.sendStatus(401);
			}
		});
	} else {
		res.sendStatus(401);
	}
});

module.exports = router;
