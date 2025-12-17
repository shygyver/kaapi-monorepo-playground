import { VALID_CLIENTS } from '../db/users';
import {
    OIDCClientCredentialsBuilder,
    OAuth2TokenResponse,
    OAuth2ErrorCode,
    ClientSecretBasic,
    ClientSecretPost,
    BearerToken,
} from '@kaapi/oauth2-auth-design';

// === OIDC Client Credentials Builder ===
export const oidcClientCredentialsBuilder = OIDCClientCredentialsBuilder.create()
    // the name of the strategy
    .strategyName('oidc-client-credentials')
    // access token ttl (used in generateToken controller)
    .setTokenTtl(600)
    // activate auto parsing of access token (jwtAccessTokenPayload + createJwtAccessToken)
    .useAccessTokenJwks(true)
    // Client authentication methods
    .addClientAuthenticationMethod(new ClientSecretBasic())
    .addClientAuthenticationMethod(new ClientSecretPost())
    .setTokenType(new BearerToken())
    // Define available scopes
    .setScopes({
        read: 'Grants read-only access to protected resources',
        write: 'Grants write access to protected resources',
        admin: 'Administrative access',
    })

    // Token exchange
    .tokenRoute((route) =>
        route.generateToken(async ({ clientId, clientSecret, ttl, tokenType, scope, createJwtAccessToken }) => {
            // Validate client credentials
            const client = VALID_CLIENTS.find(
                (c) => c.client_id === clientId && c.client_secret === clientSecret && c.internal
            );

            if (!client) {
                return {
                    error: OAuth2ErrorCode.INVALID_CLIENT,
                    error_description: 'Invalid client_id or client_secret',
                };
            }

            // Determine requested scopes
            const requestedScopes = (scope ?? '').split(/\s+/).filter(Boolean);

            // Compute granted scopes
            let grantedScopes = client.allowed_scopes;
            if (requestedScopes.length > 0) {
                grantedScopes = requestedScopes.filter((s) => client.allowed_scopes.includes(s));
            }

            if (grantedScopes.length === 0) {
                return {
                    error: OAuth2ErrorCode.INVALID_SCOPE,
                    error_description: 'No valid scopes granted for this client',
                };
            }

            // Generate a signed JWT access token
            const { token: accessToken } = await createJwtAccessToken!({
                sub: clientId,
                app: true,
                scope: grantedScopes,
            });

            // Return token response
            return new OAuth2TokenResponse({ access_token: accessToken })
                .setExpiresIn(ttl)
                .setTokenType(tokenType)
                .setScope(grantedScopes.join(' '));
        })
    )

    // Access Token Validation
    .validate(async (_req, { jwtAccessTokenPayload }) => {
        if (!jwtAccessTokenPayload?.sub || !jwtAccessTokenPayload.app) return { isValid: false };
        return {
            isValid: true,
            credentials: {
                app: {
                    id: jwtAccessTokenPayload.sub,
                },
                scope: Array.isArray(jwtAccessTokenPayload.scope) ? jwtAccessTokenPayload.scope : [],
            },
        };
    });
