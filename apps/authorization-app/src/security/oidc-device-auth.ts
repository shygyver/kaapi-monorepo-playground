import { deviceCodesStore } from '../db/codes';
import { REGISTERED_USERS } from '../db/users';
import {
    OIDCDeviceAuthorizationBuilder,
    createInMemoryKeyStore,
    OAuth2TokenResponse,
    NoneAuthMethod,
    DeviceFlowOAuth2ErrorCode,
    BearerToken,
} from '@kaapi/oauth2-auth-design';

// Valid clients and allowed scopes
const VALID_CLIENTS = [
    {
        client_id: 'service-api-client',
        allowed_scopes: ['openid', 'profile', 'email', 'read', 'write'],
    },
];

export const oidcDeviceAuthorization = OIDCDeviceAuthorizationBuilder.create()
    // the name of the strategy
    .strategyName('oidc-device-auth')
    // access token ttl (used in generateToken controller)
    .setTokenTTL(600)
    // activate auto parsing of access token (jwtAccessTokenPayload + createJwtAccessToken)
    .useAccessTokenJwks(true)
    // Client authentication methods
    .addClientAuthenticationMethod(new NoneAuthMethod())
    .setTokenType(new BearerToken())
    // Define available scopes
    .setScopes({
        read: 'Read access',
        write: 'Write access',
    })

    // Device Authorization
    .authorizationRoute((route) =>
        route.setPath('/oauth2/v1.0/device_authorization').generateCode(async ({ clientId, scope }) => {
            // client exists?
            const client = VALID_CLIENTS.find((c) => c.client_id === clientId);
            if (!client) return null;

            const allowedScopes = client.allowed_scopes;
            if (!allowedScopes) return null;

            const requestedScopes = scope?.split(' ') ?? [];
            const grantedScopes = requestedScopes.filter((s) => allowedScopes.includes(s));
            if (grantedScopes.length === 0) return null;

            const deviceCode = `device-${Date.now()}`;
            const userCode = `user-${Math.random().toString(36).substring(2, 8)}`;

            deviceCodesStore.set(deviceCode, { clientId, scopes: grantedScopes, verified: false, userCode });

            return {
                device_code: deviceCode,
                user_code: userCode,
                verification_uri: 'http://localhost:3000/verify',
                verification_uri_complete: `http://localhost:3000/verify?user_code=${userCode}`,
                expires_in: 600,
                interval: 5,
            };
        })
    )

    // Token polling
    .tokenRoute((route) =>
        route.generateToken(async ({ deviceCode, clientId, ttl, tokenType, createJwtAccessToken, createIdToken }) => {
            const entry = deviceCodesStore.get(deviceCode);
            if (!entry || entry.clientId !== clientId) return null;

            if (!entry.verified || !entry.userId) return { error: DeviceFlowOAuth2ErrorCode.AUTHORIZATION_PENDING };

            const user = REGISTERED_USERS.find((u) => u.id === entry.userId);
            if (!user) {
                return {
                    error: DeviceFlowOAuth2ErrorCode.ACCESS_DENIED,
                    error_description: 'Invalid authorization grant.',
                };
            }

            const { token: accessToken } = await createJwtAccessToken!({
                sub: entry.userId,
                client_id: clientId,
                device: true,
                scope: entry.scopes,
            });

            deviceCodesStore.delete(deviceCode);

            // Generate a signed JWT id token
            const idToken = entry.scopes.includes('openid')
                ? (await createIdToken!({ sub: entry.userId, name: user.username, aud: clientId })).token
                : undefined;

            // Generate a signed JWT refresh token
            const refreshToken = entry.scopes.includes('offline_access')
                ? (
                      await createJwtAccessToken?.({
                          sub: entry.userId,
                          client_id: clientId,
                          device: true,
                          scope: entry.scopes,
                          exp: 86400,
                      })
                  )?.token
                : undefined;

            return new OAuth2TokenResponse({ access_token: accessToken })
                .setExpiresIn(ttl)
                .setTokenType(tokenType)
                .setScope(entry.scopes.join(' '))
                .setIdToken(idToken)
                .setRefreshToken(refreshToken);
        })
    )

    // Refresh Token (REM: it's better to use an opaque refresh token for prod but for dev, JWT also works)
    .refreshTokenRoute((route) =>
        route.generateToken(
            async ({ clientId, refreshToken, ttl, tokenType, verifyJwt, createJwtAccessToken, createIdToken }) => {
                const payload = await verifyJwt?.(refreshToken);
                if (!payload || !payload.device || !Array.isArray(payload.scope)) return null;
                const user = REGISTERED_USERS.find((u) => u.id === payload.sub);
                if (!user) {
                    return {
                        error: DeviceFlowOAuth2ErrorCode.ACCESS_DENIED,
                        error_description: 'Invalid authorization grant.',
                    };
                }

                const { token: accessToken } = await createJwtAccessToken!({
                    sub: user.id,
                    client_id: clientId,
                    device: true,
                    scope: payload.scope,
                });

                // Generate a signed JWT id token
                const idToken = payload.scope.includes('openid')
                    ? (await createIdToken!({ sub: user.id, name: user.username, aud: clientId })).token
                    : undefined;

                // Generate a signed JWT refresh token
                const newRefreshToken = (
                    await createJwtAccessToken?.({
                        sub: user.id,
                        client_id: clientId,
                        device: true,
                        scope: payload.scope,
                        exp: 86400,
                    })
                )?.token;

                return new OAuth2TokenResponse({ access_token: accessToken })
                    .setExpiresIn(ttl)
                    .setTokenType(tokenType)
                    .setScope(payload.scope.join(' '))
                    .setIdToken(idToken)
                    .setRefreshToken(newRefreshToken);
            }
        )
    )

    // Access Token Validation
    .validate(async (_req, { jwtAccessTokenPayload }) => {
        if (!jwtAccessTokenPayload?.sub || !jwtAccessTokenPayload.device) return { isValid: false };
        return {
            isValid: true,
            credentials: {
                user: {
                    id: jwtAccessTokenPayload.sub,
                    aud: jwtAccessTokenPayload.aud,
                    clientId: jwtAccessTokenPayload.client_id,
                },
                scope: Array.isArray(jwtAccessTokenPayload.scope) ? jwtAccessTokenPayload.scope : [],
            },
        };
    })

    // JWKS
    .jwksRoute((route) => route.setPath('/discovery/v1.0/keys')) // activates jwks uri
    .setPublicKeyExpiry(86400) // 24h
    .setJwksKeyStore(createInMemoryKeyStore()) // store for JWKS
    .setJwksRotatorOptions({
        intervalMs: 7.884e9, // 91 days
        timestampStore: createInMemoryKeyStore(),
    });
