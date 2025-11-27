import { Kaapi } from '@kaapi/kaapi';

const app = new Kaapi({
    port: 3000,
    host: 'localhost',
});

await app.listen();

const server = app.base(); // Access the underlying Hapi server
console.log('Server running on %s', server.info.uri);
