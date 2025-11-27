import { app } from './server';

// ---------- start http server ----------

await app.listen();

app.log(`Server running on ${app.base().info.uri}\n`);
app.log(`Swagger UI on ${app.base().info.uri}/docs/api`);
app.log(`OpenAPI specification on ${app.base().info.uri}/docs/api/schema`);
app.log(`Postman collection on ${app.base().info.uri}/docs/api/schema?format=postman`);
