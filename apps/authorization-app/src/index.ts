import { app } from './app';
import oidcAuthFlows from './security/oidc-multiple-flows';

// ---------- start http app ----------

await app.listen();

app.log(`app running on ${app.base().info.uri}\n`);
app.log(`Swagger UI on ${app.base().info.uri}/docs/api`);
app.log(`OpenAPI specification on ${app.base().info.uri}/docs/api/schema`);
app.log(`Postman collection on ${app.base().info.uri}/docs/api/schema?format=postman`);

// Key rotation check every hour (rotation happens according to jwksRotatorOptions.intervalMs)
setInterval(() => {
    oidcAuthFlows.checkAndRotateKeys().catch(app.log.error);
}, 3600 * 1000); // 1h
