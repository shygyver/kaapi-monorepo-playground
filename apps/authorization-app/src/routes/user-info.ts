import { REGISTERED_USERS } from '../db/users';
import oidcAuthFlows from '../security/oidc-multiple-flows';
import { KaapiServerRoute } from '@kaapi/kaapi';
import { OAuth2ErrorCode } from '@kaapi/oauth2-auth-design';

const userInfoRoute: KaapiServerRoute<{ AuthUser: { id: string; clientId: string } }> = {
    method: 'GET',
    path: '/v1.0/userinfo',
    auth: true,
    options: {
        auth: {
            strategies: oidcAuthFlows.getStrategyName(), // Ensures only OIDC strategies are used
            access: {
                entity: 'user', // Ensures token belongs to a user
                scope: ['openid'], // Requires 'openid' scope
            },
        },
        tags: ['Auth'],
    },
    handler: async (
        {
            auth: {
                credentials: { scope, user },
            },
        },
        h
    ) => {
        const userData = REGISTERED_USERS.find((u) => u.id === user!.id);
        if (!userData) {
            return h
                .response({
                    error: OAuth2ErrorCode.INVALID_REQUEST,
                    error_description: 'Invalid or unknown user claims.',
                })
                .code(403);
        }

        return {
            sub: user!.id,
            name: scope!.includes('profile') ? userData.username : undefined,
            email: scope!.includes('email') ? userData.email : undefined,
        };
    },
};

export default userInfoRoute;
