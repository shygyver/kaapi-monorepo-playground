import { app } from './app';
import { binomialCoefficient } from './utils';
import { RequestBodyDocsModifier } from '@kaapi/kaapi';
import { type } from 'arktype';

const combinationPayloadSchema = type([
    {
        n: type([
            'number.integer | string',
            '@',
            {
                description: 'The total number of objects in the set',
                expected: 'an integer',
                examples: [5],
                format: 'integer',
            },
        ])
            .pipe((v) => Number(v))
            .to('1 <= number.integer <= 50'),
        r: type([
            '1 | 2 | 3 | string',
            '@',
            {
                description: 'The number of objects chosen at once',
                expected: '1, 2 or 3',
                examples: [3],
                format: 'integer',
            },
        ])
            .pipe((v) => (typeof v === 'string' ? (v ? Number(v) : NaN) : v))
            .to('1 | 2 | 3')
            .default(3),
    },
    '@',
    'combination nCr inputs',
]).pipe((payload) => {
    return type({
        n: type(`number >= ${payload.r}`, '@', '≥ r'),
        r: 'number',
    })(payload);
});

// route
app.base()
    .ark({
        payload: combinationPayloadSchema,
    })
    .route(
        {
            method: 'POST',
            path: '/ark/combination',
            options: {
                description: 'Calculate the combination of n and r.',
                tags: ['ark'],
                payload: {
                    allow: ['application/json', 'application/x-www-form-urlencoded'],
                },
                plugins: {
                    kaapi: {
                        docs: {
                            modifiers: () => ({
                                requestBody: new RequestBodyDocsModifier()
                                    .addMediaType('application/json', {
                                        schema: {
                                            properties: {
                                                n: {
                                                    minimum: 1,
                                                    maximum: 50,
                                                },
                                            },
                                        },
                                    })
                                    .addMediaType('application/x-www-form-urlencoded', {
                                        schema: {
                                            properties: {
                                                n: {
                                                    minimum: 1,
                                                    maximum: 50,
                                                },
                                            },
                                        },
                                    }),
                            }),
                        },
                    },
                },
            },
        },
        ({ payload: { n, r } }) => ({ inputs: { n, r }, coefficient: binomialCoefficient(n, r) })
    );
