import deviceVerificationRoute from './routes/device-verification';
import { deleteResourcesRoute, getResourcesRoute, postResourcesRoute } from './routes/resources';
import userInfoRoute from './routes/user-info';
import oidcAuthFlows from './security/oidc-multiple-flows';
import { logger } from './utils/logger';
import yar from '@hapi/yar';
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

await app.base().register({
    plugin: yar,
    options: {
        storeBlank: false,
        cookieOptions: {
            password: 'the-password-must-be-at-least-32-characters-long',
            isSecure: true,
        },
    },
});

// Extend app with auth strategy
await app.extend(oidcAuthFlows);

// Default strategies
app.base().auth.default({ strategies: oidcAuthFlows.getStrategyName(), mode: 'try' });

// Generate keys at launch
oidcAuthFlows.checkAndRotateKeys().catch(app.log.error);

app.route(userInfoRoute)
    .route(getResourcesRoute)
    .route(postResourcesRoute)
    .route(deleteResourcesRoute)
    .route(deviceVerificationRoute);
