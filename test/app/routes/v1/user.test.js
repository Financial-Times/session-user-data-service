const proxyquire = require('proxyquire').noCallThru();
const supertest = require('supertest');
var express = require('express');

const okController = (req, res) => res.sendStatus(200);

const router = proxyquire('../../../../app/routes/v1/user.js', {
    '../../controllers/v1/user': {
        getAuth: okController,
        setPseudonym: okController,
        getPseudonym: okController,
        updateUser: okController,
        emptyPseudonym: okController,
        updateUserBasicInfo: okController,
        deleteUser: okController
    }
});

const app = express();

app.use('/', router);

function expectProtected(method, endpoint) {
    describe(`\`${method} ${endpoint}\``, function () {

        const makeRequest = method === 'POST' ?
            () => supertest(app).post(endpoint)
            : () => supertest(app).get(endpoint);

        it('is rejected when there is no origin and no referer', function (done) {
            makeRequest()
                .expect(401, done);
        });

        it('is rejected when there is no origin and referer is bad', function (done) {
            makeRequest()
                .set('Referer', 'https://www.notft.com')
                .expect(401, done);
        });

        it('is accepted when there is no origin and referer is good', function (done) {
            makeRequest()
                .set('Referer', 'https://www.ft.com')
                .expect(200, done);
        });

        it('is rejected when origin is bad and referer is bad', function (done) {
            makeRequest()
                .set('Origin', 'https://www.notft.com')
                .set('Referer', 'https://www.notft.com')
                .expect(401, done);
        });

        it('is rejected when origin is bad and referer is good', function (done) {
            makeRequest()
                .set('Origin', 'https://www.notft.com')
                .set('Referer', 'https://www.ft.com')
                .expect(401, done);
        });

        it('is accepted when origin is good and referer is good', function (done) {
            makeRequest()
                .set('Origin', 'https://www.ft.com')
                .set('Referer', 'https://www.ft.com')
                .expect(200, done);
        });

        it('is rejected when origin is good and referer is bad', function (done) {
            makeRequest()
                .set('Origin', 'https://www.ft.com')
                .set('Referer', 'https://www.notft.com')
                .expect(401, done);
        });

        it('is rejected when no referer and origin is bad', function (done) {
            makeRequest()
                .set('Origin', 'https://www.notft.com')
                .expect(401, done);
        });

        it('is accepted when no referer and origin is good', function (done) {
            makeRequest()
                .set('Origin', 'https://www.ft.com')
                .expect(200, done);
        });
    });
}

describe('CSRF protected endpoint', function () {
    expectProtected('GET','/getAuth');
    expectProtected('GET','/setPseudonym');
    expectProtected('GET','/getPseudonym');
    expectProtected('GET','/updateUser');
    expectProtected('GET','/emptyPseudonym');
    expectProtected('POST','/userUpdated/0');
    expectProtected('GET','/delete');
});
