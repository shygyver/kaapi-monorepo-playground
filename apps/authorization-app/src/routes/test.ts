import { cookieSessionAuth } from '../security/cookie-session';
import { KaapiServerRoute } from '@kaapi/kaapi';

export const testRoute: KaapiServerRoute<{
    AuthUser: { id: string };
}> = {
    method: 'GET',
    path: '/test/display-session',
    auth: true,
    options: {
        auth: {
            strategy: cookieSessionAuth.getStrategyName(), // Ensures only cookie-session strategy is used
        },
        tags: ['Test'],
    },
    handler: ({
        auth: {
            credentials: { user },
        },
    }) => {
        return user;
    },
};
