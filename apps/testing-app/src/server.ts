import Boom from '@hapi/boom';
import { Kaapi } from '@kaapi/kaapi';
import Joi from 'joi';

export const app = new Kaapi({
    port: process.env.PORT || 3001,
    host: process.env.HOST || 'localhost',
});

app.route({}, () => Boom.notFound('Nothing here'));

app.route(
    {
        method: 'GET',
        path: '/error',
        options: {
            description: 'Error',
        },
    },
    () => {
        throw Boom.notImplemented('This is fine.');
    }
);

app.route<{ Query: { greeting: 'Hello' | 'Hi'; name: string } }>(
    {
        method: 'GET',
        path: '/greet',
        options: {
            description: 'Greet',
            validate: {
                query: Joi.object({
                    greeting: Joi.string().valid('Hello', 'Hi').default('Hello').optional(),
                    name: Joi.string()
                        .description('Your name (_"Frank"_ is not allowed)')
                        .min(2)
                        .max(18)
                        .trim()
                        .invalid('Frank')
                        .default('World')
                        .optional(),
                }),
            },
        },
    },
    ({ query: { greeting, name } }) => `${greeting} ${name}!`
);
