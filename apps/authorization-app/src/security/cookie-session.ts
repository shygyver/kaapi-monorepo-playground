import { REGISTERED_USERS } from '../db/users';
import yar, { YarOptions } from '@hapi/yar';
import { APIKeyAuthDesign, KaapiPlugin } from '@kaapi/kaapi';

const COOKIE_NAME = 'sid-auth-app';

const yarOptions: YarOptions = {
    name: COOKIE_NAME,
    maxCookieSize: 1024,
    storeBlank: false,
    cookieOptions: {
        password: 'the-password-must-be-at-least-32-characters-long',
        path: '/',
        isSameSite: 'Strict',
        isSecure: process.env.NODE_ENV === 'production',
        isHttpOnly: true,
        clearInvalid: true,
        ignoreErrors: true,
        ttl: 4.32e7, // 12 hours
    },
};

export const yarPlugin: KaapiPlugin = {
    async integrate(t) {
        t.server.register({
            plugin: yar,
            options: yarOptions,
        });
    },
};

export const cookieSessionAuth = new APIKeyAuthDesign({
    strategyName: 'cookie-session',
    key: COOKIE_NAME,
    auth: {
        /**
         *
         * @param req
         * @param _token cookie value
         * @returns
         */
        async validate(req, _token) {
            const value = req.yar.get('userId');

            const user = REGISTERED_USERS.find((u) => u.id === value);

            if (user) {
                return {
                    isValid: true,
                    credentials: {
                        user: { id: user.id },
                    },
                };
            }

            return { isValid: false };
        },
    },
})
    .setDescription(
        `Authentication is managed via a <u>secure</u>, HTTP-only session cookie.  
 The cookie is issued after login and must be included in subsequent requests.  
 It is automatically invalidated when the session expires or the user logs out.`
    )
    .inCookie();
