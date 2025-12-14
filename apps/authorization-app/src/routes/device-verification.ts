import { deviceCodesStore } from '../db/codes';
import { REGISTERED_USERS } from '../db/users';
import oidcAuthFlows from '../security/oidc-multiple-flows';
import { KaapiServerRoute } from '@kaapi/kaapi';
import { OAuth2ErrorCode } from '@kaapi/oauth2-auth-design';
import Joi from 'joi';

const deviceVerificationRoute: KaapiServerRoute<{ AuthUser: { id: string; clientId: string } }> = {
    method: 'GET',
    path: '/v1.0/verify',
    auth: true,
    options: {
        auth: {
            strategies: oidcAuthFlows.getStrategyName(), // Ensures only OIDC strategies are used
            access: {
                entity: 'user', // Ensures token belongs to a user
                scope: ['openid'], // Requires 'openid' scope
            },
        },
        validate: {
            query: Joi.object({
                user_code: Joi.string(),
            }),
        },
    },
    handler: (request, h) => {
        const userData = REGISTERED_USERS.find((u) => u.id === request.auth.credentials.user?.id);
        if (!userData) {
            return h
                .response({
                    error: OAuth2ErrorCode.INVALID_REQUEST,
                    error_description: 'Invalid or unknown user claims.',
                })
                .code(403);
        }

        const userCode = request.query.user_code;
        if (!userCode) return h.response('Missing user_code').code(400);

        const entry = Array.from(deviceCodesStore.values()).find((v) => v.userCode === userCode);
        if (!entry) return h.response('Invalid user_code').code(404);

        entry.userId = userData.id;
        entry.verified = true;
        return h.response(
            `Device verified successfully for client: ${entry.clientId}, scopes: ${entry.scopes.join(' ')}`
        );
    },
};

export default deviceVerificationRoute;
