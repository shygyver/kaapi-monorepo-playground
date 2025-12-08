import { app } from './app';
import oidcAuthFlows from './security/oidc-multiple-flows';

// ---------- start http app ----------

await app.listen();

// Key rotation check every hour (rotation happens according to jwksRotatorOptions.intervalMs)
setInterval(() => {
    oidcAuthFlows.checkAndRotateKeys().catch(app.log.error);
}, 3600 * 1000); // 1h

const BASE_URI = process.env.EXTERNAL_URI || app.base().info.uri;

app.log(`Server running on ${BASE_URI}\n`);
app.log(`Swagger UI on ${BASE_URI}/docs/api`);
app.log(`OpenAPI specification on ${BASE_URI}/docs/api/schema`);
app.log(`Postman collection on ${BASE_URI}/docs/api/schema?format=postman`);
