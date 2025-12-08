import { app } from './server';

// ---------- start http server ----------

await app.listen();

const BASE_URI = process.env.EXTERNAL_URI || app.base().info.uri;

app.log(`Server running on ${BASE_URI}\n`);
app.log(`Swagger UI on ${BASE_URI}/docs/api`);
app.log(`OpenAPI specification on ${BASE_URI}/docs/api/schema`);
app.log(`Postman collection on ${BASE_URI}/docs/api/schema?format=postman`);
