import deviceVerificationRoute from './routes/device-verification';
import { deleteResourcesRoute, getResourcesRoute, postResourcesRoute } from './routes/resources';
import { testRoute } from './routes/test';
import userInfoRoute from './routes/user-info';
import { cookieSessionAuth, yarPlugin } from './security/cookie-session';
import oidcAuthFlows from './security/oidc-multiple-flows';
import { logger } from './utils/logger';
import { Kaapi } from '@kaapi/kaapi';

export const app = new Kaapi({
    port: process.env.PORT || 3003,
    host: process.env.HOST || 'localhost',
    docs: {
        host: {
            url: process.env.EXTERNAL_URI || '',
        },
        title: 'Authorization app',
        ui: {
            swagger: {
                customCss: '.swagger-ui .topbar { display: none; }',
                customSiteTitle: 'Authorization app',
            },
        },
    },
    logger,
});

// Extend app with plugins and auth strategies
await app.extend([yarPlugin, cookieSessionAuth, oidcAuthFlows]);

// Default strategies
app.base().auth.default({
    strategies: [...oidcAuthFlows.getStrategyName(), cookieSessionAuth.getStrategyName()],
    mode: 'try',
});

// Generate keys at launch
oidcAuthFlows.checkAndRotateKeys().catch(app.log.error);

app.route(userInfoRoute)
    .route(getResourcesRoute)
    .route(postResourcesRoute)
    .route(deleteResourcesRoute)
    .route(deviceVerificationRoute)
    .route(testRoute);

app.base().ext('onPostAuth', (request, h) => {
    // restrict access to api docs
    if (request.path.startsWith('/docs/')) {
        if (!(request.auth.isAuthenticated && request.auth.credentials.scope?.includes('internal:session'))) {
            return h.redirect('/login').takeover();
        }
    }

    return h.continue;
});
