import { getResourcesRoute, postResourcesRoute } from './routes/resources';
import userInfoRoute from './routes/user-info';
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

app.openapi.setServers([]);

// Extend app with auth strategy
await app.extend(oidcAuthFlows);

// Default strategies
app.base().auth.default({ strategies: oidcAuthFlows.getStrategyName(), mode: 'try' });

// Generate keys at launch
oidcAuthFlows.checkAndRotateKeys().catch(app.log.error);

app.route(userInfoRoute).route(getResourcesRoute).route(postResourcesRoute);
