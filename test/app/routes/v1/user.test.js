const proxyquire = require('proxyquire');

const router = proxyquire('../../../../app/routes/v1/user.js', {});

describe('CSRF protection', function() {
    request(router)
        .get('/v1/user/setPseudonym')
        .expect(401, "ok")
        .end(function(err, res){
            if (err) throw err;
        });
});
