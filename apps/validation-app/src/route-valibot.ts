import { app } from './app';
import { productRange } from './utils';
import { toJsonSchema } from '@valibot/to-json-schema';
import * as v from 'valibot';

// payload schema
const combinationPayloadSchema = v.pipe(
    v.object({
        n: v.pipe(
            v.number(),
            v.integer(),
            v.minValue(1),
            v.maxValue(50),
            v.description('Number of total objects'),
            v.metadata({
                examples: [5],
            })
        ),
        r: v.optional(
            v.pipe(
                v.union([v.literal(1), v.literal(2), v.literal(3)]),
                v.description('Number of objects chosen at once'),
                v.metadata({
                    examples: [3],
                })
            ),
            3
        ),
    }),
    v.check((input) => input.n >= input.r, 'make sure that n ≥ r'),
    v.description('combination nCr inputs'),
    v.metadata({
        $id: '#/components/schemas/CombinationInputsWithValibot', // TODO
    })
);

// route
app.base()
    .valibot({
        payload: combinationPayloadSchema,
    })
    .route(
        {
            method: 'POST',
            path: '/valibot/combination',
            options: {
                description: 'Calculate the combination of n and r.',
                tags: ['valibot'],
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

console.log(
    toJsonSchema(combinationPayloadSchema, {
        errorMode: 'warn',
    })
);
