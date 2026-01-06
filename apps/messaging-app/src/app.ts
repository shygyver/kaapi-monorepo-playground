import { createOrderRoute } from './routes/orders';
import { messaging } from './services/kafka';
import { logger } from './utils/logger';
import { Kaapi } from '@kaapi/kaapi';
import { validatorZod } from '@kaapi/validator-zod';

// init
export const app = new Kaapi({
    port: process.env.PORT || 3004,
    host: process.env.HOST || 'localhost',
    docs: {
        host: {
            url: process.env.EXTERNAL_URI || '',
        },
        title: 'Messaging app',
    },
    logger,
    messaging,
});

// extend
await app.extend([validatorZod]);

// register routes
app.route(createOrderRoute);
app.route(
    {
        path: '/shutdown',
        method: 'POST',
        options: {
            description: 'Shutdown server gracefully.',
            notes: ['It shuts down:', '- the web server', '- the messaging service (kafka connections)'],
            tags: ['Admin'],
        },
    },
    () => {
        setTimeout(async () => {
            try {
                await app.stop();
                app.log('Bye');
            } catch (err) {
                app.log.error(err);
            }
        }, 1000);
        return 'shutting down ...';
    }
);
