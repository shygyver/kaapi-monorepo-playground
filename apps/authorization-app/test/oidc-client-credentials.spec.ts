import { app } from '../src/app';
import { expect } from 'chai';

const CONFIG = {
    clientId: 'internal-service',
    clientSecret: 'Int3rnalK3y!',
    tokenPath: '/oauth2/v1.0/token',
    scope: 'openid admin something_invalid',
};

describe('OIDC Client Credentials Flow', function () {
    before(async () => {
        await app.base().initialize();
    });

    after(async () => {
        await app.stop({ timeout: 2000 });
    });

    it('should obtain an access token with valid client credentials', async () => {
        const res = await app.base().inject({
            method: 'POST',
            url: CONFIG.tokenPath,
            payload: {
                grant_type: 'client_credentials',
                client_id: CONFIG.clientId,
                client_secret: CONFIG.clientSecret,
                scope: CONFIG.scope,
            },
        });

        expect(res.statusCode).to.equal(200);

        const body = JSON.parse(JSON.stringify(res.result));
        expect(body).to.have.property('access_token');
        expect(body).to.have.property('token_type').that.equals('Bearer');
        expect(body).to.have.property('expires_in');
        // id_token is usually not returned in client_credentials
        expect(body).to.not.have.property('id_token');
        // openid scope is ignored
        expect(body).to.have.property('scope').that.equals('admin');
    });

    it('should fail with invalid client secret', async () => {
        const res = await app.base().inject({
            method: 'POST',
            url: CONFIG.tokenPath,
            payload: {
                grant_type: 'client_credentials',
                client_id: CONFIG.clientId,
                client_secret: 'wrong-secret',
                scope: CONFIG.scope,
            },
        });

        expect(res.statusCode).to.equal(400);
        expect(res.result).to.have.property('error').that.equals('invalid_client');
    });

    it('should fail with invalid scope', async () => {
        const res = await app.base().inject({
            method: 'POST',
            url: CONFIG.tokenPath,
            payload: {
                grant_type: 'client_credentials',
                client_id: CONFIG.clientId,
                client_secret: CONFIG.clientSecret,
                scope: 'unknown_scope',
            },
        });

        expect(res.statusCode).to.equal(400);
        expect(res.result).to.have.property('error').that.equals('invalid_scope');
    });
});
