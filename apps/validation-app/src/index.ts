import { server } from './server';

// ---------- start http server ----------

await server.listen();

server.log(`Server running on ${server.base().info.uri}\n`);
server.log(`Swagger UI on ${server.base().info.uri}/docs/api`);
server.log(`OpenAPI specification on ${server.base().info.uri}/docs/api/schema`);
server.log(`Postman collection on ${server.base().info.uri}/docs/api/schema?format=postman`);
