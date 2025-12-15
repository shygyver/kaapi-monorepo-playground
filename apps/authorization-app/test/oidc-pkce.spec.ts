import { app } from '../src/app';
import { expect } from 'chai';
import crypto from 'node:crypto';

function base64url(buffer: Buffer) {
    return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const CONFIG = {
    clientId: 'service-api-client',
    authPath: '/oauth2/v1.0/authorize',
    tokenPath: '/oauth2/v1.0/token',
    redirectPath: '/test/callback',
    scope: 'openid profile read something_invalid',
};

// --- Helper functions ---

// Build PKCE pair
function generatePkcePair() {
    const verifier = base64url(crypto.randomBytes(32));
    const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());
    return { verifier, challenge };
}

// Build authorize query string
function buildAuthorizeParams(baseUrl: string, codeChallenge: string) {
    const params = new URLSearchParams();
    params.append('client_id', CONFIG.clientId);
    params.append('redirect_uri', `${baseUrl}${CONFIG.redirectPath}`);
    params.append('response_type', 'code');
    params.append('scope', CONFIG.scope);
    params.append('state', 'xyz');
    params.append('code_challenge', codeChallenge);
    params.append('code_challenge_method', 'S256');
    return params.toString();
}

// Register test-only callback route
function registerCallbackRoute(codeVerifier: string, baseUrl: string) {
    app.route({
        method: 'GET',
        path: CONFIG.redirectPath,
        handler: async (req) => {
            const { code } = req.query;
            const res = await app.base().inject({
                method: 'POST',
                url: CONFIG.tokenPath,
                payload: {
                    grant_type: 'authorization_code',
                    code,
                    redirect_uri: `${baseUrl}${CONFIG.redirectPath}`,
                    client_id: CONFIG.clientId,
                    code_verifier: codeVerifier,
                },
            });
            return res.result;
        },
    });
}

// --- Test suite ---

describe('OIDC Auth Code Flow with PKCE', function () {
    let baseUrl = '';
    let codeVerifier = '';
    let codeChallenge = '';

    before(async () => {
        baseUrl = app.base().info.uri;

        // Generate PKCE pair
        const pkce = generatePkcePair();
        codeVerifier = pkce.verifier;
        codeChallenge = pkce.challenge;

        // Register callback route
        registerCallbackRoute(codeVerifier, baseUrl);

        // Initialize app
        await app.base().initialize();
    });

    after(async () => {
        await app.stop({ timeout: 2000 });
    });

    it('should complete the full auth code flow with PKCE', async () => {
        // Step 1: GET /authorize → login form
        const authParams = buildAuthorizeParams(baseUrl, codeChallenge);
        const authForm = await app.base().inject({
            method: 'GET',
            url: `${CONFIG.authPath}?${authParams}`,
        });
        expect(authForm.statusCode).to.equal(200);

        // Step 2: POST credentials → redirect with code
        const authRes = await app.base().inject({
            method: 'POST',
            url: `${CONFIG.authPath}?${authParams}`,
            payload: { username: 'user', password: 'password' },
        });
        expect(authRes.statusCode).to.equal(302);
        expect(authRes.headers.location).to.include('code=');

        // Step 3: Follow redirect → callback exchanges code for tokens
        const urlObj = new URL(authRes.headers.location!);
        const callbackRes = await app.base().inject({
            method: 'GET',
            url: `${urlObj.pathname}${urlObj.search}`,
        });
        expect(callbackRes.statusCode).to.equal(200);

        // Step 4: Validate token response
        const body = JSON.parse(JSON.stringify(callbackRes.result));
        expect(body).to.have.property('access_token');
        expect(body).to.have.property('id_token');
        expect(body).to.have.property('scope').that.equals('openid profile read');
    });

    it('should fail with invalid credentials', async () => {
        const authParams = buildAuthorizeParams(baseUrl, codeChallenge);

        // POST wrong username/password
        const authRes = await app.base().inject({
            method: 'POST',
            url: `${CONFIG.authPath}?${authParams}`,
            payload: { username: 'user', password: 'wrong-password' },
        });

        expect(authRes.statusCode).to.equal(400); // TODO: change it to 401
        expect(authRes.headers['content-type']).to.include('text/html');
        expect(authRes.payload).to.include('wrong credentials');
    });

    it('should fail with invalid PKCE verifier', async () => {
        const authParams = buildAuthorizeParams(baseUrl, codeChallenge);

        // Step 1: POST valid credentials
        const authRes = await app.base().inject({
            method: 'POST',
            url: `${CONFIG.authPath}?${authParams}`,
            payload: { username: 'user', password: 'password' },
        });
        expect(authRes.statusCode).to.equal(302);

        // Step 2: Follow redirect but use wrong code_verifier
        const urlObj = new URL(authRes.headers.location!);
        const badTokenRes = await app.base().inject({
            method: 'POST',
            url: CONFIG.tokenPath,
            payload: {
                grant_type: 'authorization_code',
                code: urlObj.searchParams.get('code'),
                redirect_uri: `${baseUrl}${CONFIG.redirectPath}`,
                client_id: CONFIG.clientId,
                code_verifier: 'invalid-verifier',
            },
        });

        expect(badTokenRes.statusCode).to.equal(400);
        expect(badTokenRes.result).to.have.property('error').that.equals('invalid_grant');
    });
});
