import { app } from './app';
import { productRange } from './utils';
import { z } from 'zod';

// payload schema
const combinationPayloadSchema = z
    .object({
        n: z
            .preprocess((x) => Number(x), z.int().positive().min(1).max(50))
            .meta({
                description: 'Number of total objects',
                examples: [5],
            }),
        r: z
            .preprocess(
                (x) => Number(x),
                z.enum({
                    one: 1,
                    two: 2,
                    three: 3,
                })
            )
            .optional()
            .default(3)
            .meta({
                description: 'Number of objects chosen at once',
                examples: [3],
            }),
    })
    .refine(
        (schema) => {
            return schema.n >= schema.r;
        },
        {
            error: 'make sure that n ≥ r',
        }
    )
    .meta({
        description: 'combination nCr inputs',
        ref: '#/components/schemas/CombinationInputsWithZod',
    });

// route
app.base()
    .zod({
        payload: combinationPayloadSchema,
    })
    .route(
        {
            method: 'POST',
            path: '/zod/combination',
            options: {
                description: 'Calculate the combination of n and r.',
                tags: ['zod'],
                payload: {
                    allow: ['application/json', 'application/x-www-form-urlencoded'],
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
