// TODO
import { app } from './app';
import { productRange } from './utils';
import { RequestBodyDocsModifier } from '@kaapi/kaapi';
import { ArkErrors, type } from 'arktype';

const combinationPayloadSchema = type([
    {
        n: type(['number.integer', '@', { description: 'Number of total objects', examples: [5] }]).to(
            '1 <= number.integer <= 50'
        ),
        r: type(['1 | 2 | 3', '@', { description: 'Number of objects chosen at once', examples: [3] }]).default(3),
    },
    '@',
    'combination nCr inputs',
]).pipe((payload) => {
    return type({
        n: `number >= ${payload.r}`,
        r: 'number',
    })(payload);
});

combinationPayloadSchema.meta = {};

console.log(combinationPayloadSchema.toJSON());

//console.log((combinationPayloadSchema)?.props?.find(v => v.key === 'r')?.toJSON());
console.log(type(['number.integer', '@', 'Number of total objects']).to('1 <= number.integer <= 50').default(3)[2]);

console.log(
    Array.isArray(type(['number.integer', '@', 'Number of total objects']).to('1 <= number.integer <= 50').default(3))
);

// route
app.base()
    .ark({
        payload: combinationPayloadSchema,
    })
    .route(
        {
            method: 'POST',
            path: '/arktype/combination',
            options: {
                description: 'Calculate the combination of n and r.',
                tags: ['arktype'],
                payload: {
                    allow: ['application/json', 'application/x-www-form-urlencoded'],
                },
                plugins: {
                    kaapi: {
                        docs: {
                            modifiers: () => ({
                                requestBody: new RequestBodyDocsModifier().addMediaType('application/json', {
                                    schema: {
                                        properties: {
                                            r: {
                                                type: 'integer',
                                                default: 3,
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
        ({ payload: { n, r } }) => {
            let result = 1;
            if (n != r) {
                const sample = r < n - r ? n - r : r;
                result = productRange(sample + 1, n) / productRange(1, n - sample);
            }
            return { inputs: { n, r: r }, result };
        }
    );

// Usage
const t1 = combinationPayloadSchema({ n: 49 }); // ✅ passes
const t2 = combinationPayloadSchema({ n: 1, r: 3 }); // ❌ throws error

console.log(t1 instanceof ArkErrors ? true : t1);
console.log(t2 instanceof ArkErrors ? true : t2);

/**
 * compare ensures that property A satisfies a relational constraint
 * against property B.
 *
 * @param a - name of the first property
 * @param operator - relational operator string (">=", "<=", ">", "<", "==")
 * @param b - name of the second property
 */
export function compare(a: string, operator: '>=' | '<=' | '>' | '<' | '==', b: string) {
    return (payload: Record<string, unknown>) => {
        const bv = payload[b];

        // Basic guards: ensure b exists and is numeric
        if (typeof bv !== 'number') {
            // Let ArkType produce a proper error by validating b as number
            return type({ [a]: 'number', [b]: 'number' })(payload);
        }

        // Build a dynamic schema that enforces: a [op] b
        const schema = type({
            [a]: `number ${operator} ${bv}`,
            [b]: 'number',
        });

        return schema(payload);
    };
}

const cSchema = type({
    n: type(['number.integer', '@', 'Number of total objects']).to('1 <= number.integer <= 50'),
    r: type(['1 | 2 | 3', '@', 'Number of objects chosen at once']).default(3),
}).pipe(compare('n', '>=', 'r'));

const t3 = cSchema({ n: 5, r: 3 }); // passes
const t4 = cSchema({ n: 2, r: 3 }); // fails with ArkErrors
const t5 = cSchema({ n: 5, r: 'x' }); // fails with ArkErrors (r must be number)

console.log(t3 instanceof ArkErrors ? true : t3);
console.log(t4 instanceof ArkErrors ? true : t4);
console.log(t5 instanceof ArkErrors ? true : t5);
