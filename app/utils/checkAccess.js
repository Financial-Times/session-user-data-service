'use strict';

const { parse } = require('url');

const { default: logger } = require('@financial-times/n-logger');

const defaultMethods = [
    'GET',
    'POST',
    'PUT',
    'DELETE'
];

const defaultDomain = 'ft.com';

module.exports = ({
    methods = defaultMethods,
    domain = defaultDomain
} = {}) => (request, response, next) => {

    const apiKey = request.get('X-Api-Key')
    if (apiKey === process.env.API_KEY_FOR_RESTRICTED_ENDPOINTS) {
        return next();
    }

    const checkDomain = url =>
        Boolean(url && parse(url).hostname.endsWith(`.${domain}`));

    if (response.locals && response.locals.flags && response.locals.flags.disableSudsOriginCheck) {
        return next();
    }

    const {
        originalUrl,
        method
    } = request;

    if (!methods.includes(method)) {
        return next();
    }

    const origin = request.get('origin');
    const referer = request.get('referer');

    const originIsGood = checkDomain(origin);
    const refererIsGood = checkDomain(referer);

    if (!origin) {
        logger.warn('Request does not have an origin.', {
            event: 'NO_REQUEST_ORIGIN',
            originalUrl,
            method,
            referer
        });
    } else if (!originIsGood) {
        logger.warn(`Request origin's domain is not ${domain}.`, {
            event: 'BAD_REQUEST_ORIGIN',
            origin,
            originalUrl,
            method,
            referer
        });
    }

    if (!referer) {
        logger.warn('Request does not have an referer.', {
            event: 'NO_REQUEST_REFERER',
            origin,
            originalUrl,
            method
        });
    } else if (!refererIsGood) {
        logger.warn(`Request referer's domain is not ${domain}.`, {
            event: 'BAD_REQUEST_REFERER',
            origin,
            originalUrl,
            method,
            referer
        });
    }


    if (originIsGood && refererIsGood) {
        return next();
    }

    if( !origin && refererIsGood ) {
        return next();
    }

    if( !referer && originIsGood ) {
        return next();
    }

    response.sendStatus(401);
};
