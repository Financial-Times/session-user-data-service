'use strict';

const {parse} = require('url');

const {default: logger} = require('@financial-times/n-logger');

const defaultMethods = [
    'POST',
    'PUT',
    'DELETE'
];

const defaultDomain = 'ft.com';

module.exports = ({
    methods = defaultMethods,
    domain = defaultDomain
} = {}) => (request, response, next) => {
    if (response.locals.flags.disableCsrfRejections) {
        return next();
    }

    const {
        originalUrl,
        method
    } = request;

    if (!methods.includes(method)) {
        return next();
    }

    const checkDomain = url =>
    Boolean(url && parse(url).hostname.endsWith(`.${domain}`));

    const origin = request.get('origin');
    const referer = request.get('referer');

    const originIsGood = checkDomain(origin);
    const refererIsGood = checkDomain(referer);

    if (originIsGood && refererIsGood) {
        return next();
    }

    if (!origin) {
        logger.warn('Request does not have an origin', {
            event: 'NO_REQUEST_ORIGIN',
            originalUrl,
            method,
            referer
        });

        if (refererIsGood) {
            // no origin, but valid referer is fine
            return next();
        }
    }

    if (origin && !originIsGood) {
        logger.warn(`Request origin's domain is not ${domain}`, {
            event: 'BAD_REQUEST_ORIGIN',
            origin,
            originalUrl,
            method,
            referer
        });
    }

    if (!referer) {
        logger.warn('Request does not have an referer', {
            event: 'NO_REQUEST_REFERER',
            origin,
            originalUrl,
            method
        });

        if (originIsGood) {
            // no referer, but valid origin is good
            return next();
        }
    }

    if (referer && !refererIsGood) {
        logger.warn(`Request referer's domain is not ${domain}`, {
            event: 'BAD_REQUEST_REFERER',
            origin,
            originalUrl,
            method,
            referer
        });
    }

    // we are here if there was no/bad origin && no/bad referer
    logger.error('Invalid origin and referer', {
        event: 'BAD_REQUEST_ORIGIN_AND_REFERER',
        origin,
        originalUrl,
        method,
        referer
    });
    response.sendStatus(401);
};
