import { app } from '../src/app';
import { expect } from 'chai';

const CONFIG = {
    clientId: 'service-api-client',
    deviceAuthPath: '/oauth2/v1.0/device_authorization',
    tokenPath: '/oauth2/v1.0/token',
    scope: 'profile read', // no openid here, since no user identity
};

describe('OIDC Device Authorization Flow', function () {
    let deviceCode = '';
    let verificationUriComplete = '';

    before(async () => {
        await app.base().initialize();
    });

    after(async () => {
        await app.stop({ timeout: 2000 });
    });

    it('should start device authorization and return device/user codes', async () => {
        const res = await app.base().inject({
            method: 'POST',
            url: CONFIG.deviceAuthPath,
            payload: {
                client_id: CONFIG.clientId,
                scope: CONFIG.scope,
            },
        });

        expect(res.statusCode).to.equal(200);

        const body = JSON.parse(JSON.stringify(res.result));
        expect(body).to.have.property('device_code');
        expect(body).to.have.property('user_code');
        expect(body).to.have.property('verification_uri');
        expect(body).to.have.property('verification_uri_complete');
        expect(body).to.have.property('expires_in');
        expect(body).to.have.property('interval');

        deviceCode = body.device_code;
        verificationUriComplete = body.verification_uri_complete;
    });

    it('should fail to poll token endpoint before user authorizes', async () => {
        const res = await app.base().inject({
            method: 'POST',
            url: CONFIG.tokenPath,
            payload: {
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
                device_code: deviceCode,
                client_id: CONFIG.clientId,
            },
        });

        expect(res.statusCode).to.equal(400);
        expect(res.result).to.have.property('error').that.equals('authorization_pending');
    });

    it('should complete device flow after user authorizes', async function () {
        // Simulate user visiting verification_uri_complete with a valid user session.
        // In real flow, this requires a logged-in user (auth code flow).
        const urlObj = new URL(verificationUriComplete);
        const userRes = await app.base().inject({
            method: 'GET',
            url: `${urlObj.pathname}${urlObj.search}`,
            // simulate cookie/session of a logged-in user (force credentials)
            auth: {
                credentials: {
                    user: {
                        id: 'user-1234',
                    },
                    scope: ['internal:session'],
                },
                strategy: 'cookie-session',
            },
        });
        expect(userRes.statusCode).to.equal(200);

        // Now poll token endpoint again
        const tokenRes = await app.base().inject({
            method: 'POST',
            url: CONFIG.tokenPath,
            payload: {
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
                device_code: deviceCode,
                client_id: CONFIG.clientId,
            },
        });

        expect(tokenRes.statusCode).to.equal(200);
        const body = JSON.parse(JSON.stringify(tokenRes.result));
        expect(body).to.have.property('access_token');
        expect(body).to.have.property('token_type').that.equals('Bearer');
        expect(body).to.have.property('scope').that.equals('profile read');
    });

    it('should fail with invalid device code', async () => {
        const res = await app.base().inject({
            method: 'POST',
            url: CONFIG.tokenPath,
            payload: {
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
                device_code: 'invalid-device-code',
                client_id: CONFIG.clientId,
            },
        });

        expect(res.statusCode).to.equal(400);
        expect(res.result).to.have.property('error').that.equals('invalid_grant');
    });
});
