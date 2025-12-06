import { app } from './app';
import { binomialCoefficient } from './utils';
import * as v from 'valibot';

// payload schema
const combinationPayloadSchema = v.pipe(
    v.object({
        n: v.pipe(
            v.union([
                v.number(),
                v.pipe(
                    v.string(),
                    v.transform((input) => Number(input))
                ),
            ]),
            v.integer(),
            v.minValue(1),
            v.maxValue(50),
            v.description('The total number of objects in the set'),
            v.metadata({
                examples: [5],
            })
        ),
        r: v.optional(
            v.pipe(
                v.union([
                    v.number(),
                    v.pipe(
                        v.string(),
                        v.transform((input) => Number(input))
                    ),
                ]),
                v.integer(),
                v.union([v.literal(1), v.literal(2), v.literal(3)]),
                v.description('The number of objects chosen at once'),
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
        ref: '#/components/schemas/CombinationInputsWithValibot',
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
        ({ payload: { n, r } }) => ({ inputs: { n, r }, coefficient: binomialCoefficient(n, r) })
    );
