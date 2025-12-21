import { REGISTERED_USERS, User } from '../db/users';
import oidcAuthFlows from '../security/oidc-multiple-flows';
import Boom from '@hapi/boom';
import { KaapiServerRoute } from '@kaapi/kaapi';
import { OAuth2ErrorCode } from '@kaapi/oauth2-auth-design';

const userInfoRoute: KaapiServerRoute<{
    AuthUser: { id: string; clientId: string };
    Pres: { user: User };
}> = {
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
        pre: [
            {
                assign: 'user',
                method: ({
                    auth: {
                        credentials: { user },
                    },
                }) => {
                    const userData = REGISTERED_USERS.find((u) => u.id === user!.id);
                    if (!userData) {
                        const error = Boom.forbidden('User not found');
                        error.output.payload.error = OAuth2ErrorCode.INVALID_REQUEST;
                        error.output.payload.error_description = 'Invalid or unknown user claims.';
                        throw error;
                    }
                    return userData;
                },
            },
        ],
    },
    handler: async ({
        auth: {
            credentials: { scope },
        },
        pre: { user },
    }) => {
        return {
            sub: user!.id,
            name: scope!.includes('profile') ? user.username : undefined,
            email: scope!.includes('email') ? user.email : undefined,
        };
    },
};

export default userInfoRoute;
