import { Kaapi } from '@kaapi/kaapi';
import { KafkaMessaging } from '@kaapi/kafka-messaging';
import { validatorZod, withSchema } from '@kaapi/validator-zod';
import { z } from 'zod';

const messaging = new KafkaMessaging({
    clientId: 'user-api',
    brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'],
    name: 'user-api',
});

const app = new Kaapi({
    port: process.env.PORT || 3005,
    host: process.env.HOST || 'localhost',
    docs: {
        host: {
            url: process.env.EXTERNAL_URI || '',
        },
        title: 'User API',
        ui: {
            swagger: {
                customSiteTitle: 'User API Docs',
            },
        },
    },
});

const start = async () => {
    await app.extend([validatorZod]);

    app.route(
        withSchema({
            payload: z.object({
                email: z.email(),
                name: z.string().min(2),
            }),
        }).route({
            method: 'POST',
            path: '/signup',
            handler: async ({ payload }) => {
                const user = {
                    id: crypto.randomUUID(),
                    email: payload.email,
                    name: payload.name,
                    createdAt: Date.now(),
                };

                // Save to database (pretend this happened)

                // Publish the event
                await messaging.publish('user.created', user);

                return { success: true, userId: user.id };
            },
        })
    );

    await app.listen();
    const BASE_URI = process.env.EXTERNAL_URI || app.base().info.uri;
    app.log(`🚀 User API running at ${BASE_URI}`);
    app.log(`Swagger UI on ${BASE_URI}/docs/api`);
    app.log(`OpenAPI specification on ${BASE_URI}/docs/api/schema`);
    app.log(`Postman collection on ${BASE_URI}/docs/api/schema?format=postman\n`);
};

start();
