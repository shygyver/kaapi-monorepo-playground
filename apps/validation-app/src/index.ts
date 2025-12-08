import { server } from './server';

// ---------- start http server ----------

await server.listen();

const BASE_URI = process.env.EXTERNAL_URI || server.base().info.uri;

server.log(`Server running on ${BASE_URI}\n`);
server.log(`Swagger UI on ${BASE_URI}/docs/api`);
server.log(`OpenAPI specification on ${BASE_URI}/docs/api/schema`);
server.log(`Postman collection on ${BASE_URI}/docs/api/schema?format=postman`);
