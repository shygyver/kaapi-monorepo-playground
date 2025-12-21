import { deviceCodesStore } from '../db/codes';
import { REGISTERED_USERS } from '../db/users';
import { cookieSessionAuth } from '../security/cookie-session';
import { KaapiServerRoute } from '@kaapi/kaapi';
import { OAuth2ErrorCode } from '@kaapi/oauth2-auth-design';
import Joi from 'joi';

const deviceVerificationRoute: KaapiServerRoute<{
    AuthUser: { id: string };
    Query: { user_code: string };
}> = {
    method: 'GET',
    path: '/v1.0/verify-device',
    auth: true,
    options: {
        auth: {
            strategy: cookieSessionAuth.getStrategyName(), // Ensures only cookie-session strategy is used
            scope: ['internal:session'],
        },
        validate: {
            query: Joi.object({
                user_code: Joi.string().required(),
            }),
        },
        plugins: {
            kaapi: {
                docs: false,
            },
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
                .code(400);
        }

        const userCode = request.query.user_code;
        const entry = Array.from(deviceCodesStore.values()).find((v) => v.userCode === userCode);
        if (!entry)
            return h
                .response({
                    error: OAuth2ErrorCode.INVALID_REQUEST,
                    error_description: 'Invalid or unknown user claims.',
                })
                .code(400);

        // already verified
        if (entry.verified) {
            return h
                .response({
                    error: OAuth2ErrorCode.INVALID_REQUEST,
                })
                .code(400);
        }

        entry.userId = userData.id;
        entry.verified = true;
        return h.response('ok');
    },
};

export default deviceVerificationRoute;
