import { KaapiServerRoute } from '@kaapi/kaapi';

const greetingsRoute: KaapiServerRoute<{ AuthUser: { id: string; clientId: string } }> = {
    method: 'GET',
    path: '/greetings',
    auth: true,
    options: { auth: { access: { entity: 'user', scope: ['read'] } } },
    handler: ({
        auth: {
            credentials: { user },
        },
    }) => `Hello ${user!.id} in ${user!.clientId}`,
};

export default greetingsRoute;
