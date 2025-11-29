import { app } from './app';
import { productRange } from './utils';
import Joi from 'joi';

// payload schema
const combinationPayloadSchema = Joi.object({
    n: Joi.number()
        .description('Number of total objects')
        .integer()
        .min(1)
        .max(50)
        .example(5)
        .when('r', {
            is: Joi.number(),
            then: Joi.number().min(Joi.ref('r')),
        })
        .required(),

    r: Joi.number()
        .description('Number of objects chosen at once')
        .integer()
        .valid(1, 2, 3)
        .default(3)
        .example(3)
        .optional(),
})
    .meta({
        ref: '#/components/schemas/CombinationInputsWithJoi',
    })
    .description('combination nCr inputs')
    .required();

// route
app.route<{ Payload: { n: number; r: 1 | 2 | 3 } }>(
    {
        method: 'POST',
        path: '/joi/combination',
        options: {
            description: 'Calculate the combination of n and r.',
            tags: ['joi'],
            payload: {
                allow: ['application/json', 'application/x-www-form-urlencoded'],
            },
            validate: {
                payload: combinationPayloadSchema,
            },
        },
    },
    ({ payload: { n, r } }) => {
        let result = 1;
        if (n != r) {
            const sample = r < n - r ? n - r : r;
            result = productRange(sample + 1, n) / productRange(1, n - sample);
        }
        return { inputs: { n, r: r }, result };
    }
);
