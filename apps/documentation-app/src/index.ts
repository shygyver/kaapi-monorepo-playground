import { badRequestResponse } from './responses';
import { errorSchema } from './schemas';
import Boom from '@hapi/boom';
import { groupResponses, Kaapi, MediaTypeModifier, RequestBodyDocsModifier, ResponseDocsModifier } from '@kaapi/kaapi';
import Joi from 'joi';
import Stream, { PassThrough } from 'node:stream';

// ---------- Kaapi init ----------

const app = new Kaapi({
    // Hapi's ServerOptions
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',

    // winston's LoggerOptions
    loggerOptions: {
        // for dev, default: info
        level: 'debug',
    },

    // DocsConfig
    docs: {
        disabled: false,
        path: '/docs/api',
        title: 'Petstore',
        license: {
            name: 'MIT',
            url: 'https://raw.githubusercontent.com/shygyver/kaapi-monorepo-playground/refs/heads/main/LICENSE',
        },
        version: '1.0.12',
        ui: {
            swagger: {
                customCss: '.swagger-ui .topbar { display: none; }',
                customSiteTitle: 'Swagger UI - Petstore',
                customJsStr: `
                setTimeout(() => {
                if (document.documentElement.classList.contains("dark-mode")) { document.documentElement.classList.remove("dark-mode"); }
                }, 10);
                `,
            },
        },

        // explicitly set host external url for production
        // optional for localhost as it is already defined at Hapi's ServerOptions
        host: {
            url: '{baseUrl}',
            variables: {
                baseUrl: {
                    default: process.env.EXTERNAL_URI || 'http://localhost:3000',
                    enum: [process.env.EXTERNAL_URI || 'http://localhost:3000'],
                },
            },
        },

        // (OpenAPI: register some schemas in components section)
        schemas: [errorSchema],

        // (OpenAPI: register some responses in components section)
        responses: groupResponses(badRequestResponse),

        // more tags definition
        tags: [
            {
                name: 'pet',
                description: 'Everything about your Pets',
                externalDocs: {
                    url: 'https://swagger.io/',
                    description: 'Find out more',
                },
            },
        ],
    },

    // logger: ILogger;
    // messaging: IMessaging;
});

// info for OpenAPI specification
app.openapi
    .setDescription(
        `This is an OpenAPI 3.1.1 specification of a sample Pet Store Server build with Kaapi. You can find out more about Kaapi at [https://www.npmjs.com/package/@kaapi/kaapi](https://www.npmjs.com/package/@kaapi/kaapi).  
Some useful links:
- [The original Pet Store repository](https://github.com/swagger-api/swagger-petstore)
- [OpenAPI Specification v3.1.1](https://spec.openapis.org/oas/v3.1.1.html)
`
    )
    .setTermsOfService('https://raw.githubusercontent.com/shygyver/kaapi-monorepo-playground/refs/heads/main/LICENSE')
    .setContact({
        url: 'https://github.com/shygyver',
    })
    .setExternalDoc({
        url: 'https://github.com/demingongo/kaapi/wiki',
        description: 'Find out more about Kaapi',
    });

// info for Postman collection
app.postman
    .setDescription(`This is a Postman 2.1.0 collection format of a sample Pet Store Server build with Kaapi. You can find out more about Kaapi at [https://www.npmjs.com/package/@kaapi/kaapi](https://www.npmjs.com/package/@kaapi/kaapi).  
Some useful links:
- [The original Pet Store repository](https://github.com/swagger-api/swagger-petstore)
- [Postman Collection Format v2.1.0](https://schema.postman.com/collection/json/v2.1.0/draft-07/docs/index.html)
`);

// validator ajustments for application/x-www-form-urlencoded
const customJoi: Joi.Root = Joi.extend(
    (joi) => ({
        type: 'array',
        base: joi.array(),
        coerce: {
            from: 'string',
            method(value) {
                try {
                    if (typeof value === 'string') {
                        if (value.startsWith('[') && value.endsWith(']')) {
                            return { value: JSON.parse(value) };
                        } else {
                            return { value: value.split(',') };
                        }
                    }
                } catch (err) {
                    app.log.error(err);
                }
                return { value };
            },
        },
    }),
    (joi) => ({
        type: 'object',
        base: joi.object(),
        coerce: {
            from: 'string',
            method(value) {
                try {
                    if (typeof value === 'string' && value.startsWith('{')) {
                        return { value: JSON.parse(value) };
                    }
                } catch (err) {
                    app.log.error(err);
                }
                return { value };
            },
        },
    })
);

// ---------- handle 404 ----------

app.route({}, () => Boom.notFound());

// ---------- register routes ----------

// route with payload validation
app.route<{
    Payload: {
        id: number;
        name: string;
        category?: {
            id?: 1;
            name?: string;
        };
        photoUrls: string[];
        tags?: [
            {
                id?: 0;
                name?: 'string';
            },
        ];
        status?: 'available';
    };
}>({
    path: '/pet',
    method: 'PUT',
    options: {
        tags: ['pet'],
        description: 'Update an existing pet.',
        notes: ['Update an existing pet by Id.'],
        payload: {
            // Hapi by default only supports JSON and form-encoded payload.
            // To support application/xml, we should set "options.payload.parse=false" and remove "options.validate".
            allow: ['application/json', 'application/x-www-form-urlencoded'],
        },
        validate: {
            payload: Joi.object({
                id: Joi.number().integer().example(10).meta({ format: 'int64' }).required(),
                name: Joi.string().example('doggie').required(),
                category: customJoi
                    .object({
                        id: Joi.number().integer().example(1).meta({ format: 'int64' }),
                        name: Joi.string().example('Dogs'),
                    })
                    .meta({
                        ref: '#/components/schemas/Category',
                    }),
                photoUrls: customJoi
                    .array()
                    .items(Joi.string().meta({ xml: { name: 'photoUrl' } }))
                    .meta({ xml: { wrapped: true } })
                    .required(),
                tags: customJoi
                    .array()
                    .items(
                        Joi.object({
                            id: Joi.number().integer().meta({ format: 'int64' }),
                            name: Joi.string(),
                        }).meta({
                            xml: { name: 'tag' },
                            ref: '#/components/schemas/Tag',
                        })
                    )
                    .meta({ xml: { wrapped: true } }),
                status: Joi.string().description('pet status in the store').valid('available', 'pending', 'sold'),
            })
                .meta({
                    xml: { name: 'pet' },
                    ref: '#/components/schemas/Pet', // (OpenAPI: this will create the schema in the components section and reference it in the request)
                })
                .required(),
        },
        plugins: {
            kaapi: {
                docs: {
                    modifiers: () => ({
                        responses: groupResponses(
                            new ResponseDocsModifier()
                                .setCode(200)
                                .setDescription('Successful operation')
                                .addMediaType('application/json', {
                                    schema: { $ref: '#/components/schemas/Pet' }, // (OpenAPI: use reference here instead of writing the whole schema)
                                }),
                            badRequestResponse.withContext().setCode(400),
                            new ResponseDocsModifier().setCode(404).setDescription('Pet not found'),
                            new ResponseDocsModifier().setCode(415).setDescription('Unsupported Media Type'),
                            new ResponseDocsModifier()
                                .setDefault(true)
                                .setDescription('Unexpected error')
                                .addMediaType('application/json', new MediaTypeModifier({ schema: errorSchema }))
                        ),
                    }),
                },
            },
        },
    },
    handler: ({ payload }) => payload,
});

// route without payload validation
app.route<{ Params: { petId: number }; Payload: Stream.Readable; Query: { additionalMetadata?: string } }>({
    path: '/pet/{petId}/uploadImage',
    method: 'POST',
    options: {
        tags: ['pet'],
        description: 'Uploads an image.',
        notes: ['Upload image of the pet.'],
        payload: {
            allow: ['application/octet-stream'],
            output: 'stream',
            maxBytes: 1024 * 2000, // max 2MB
            multipart: false,
            parse: false, // disable auto parsing
        },
        validate: {
            params: Joi.object({
                petId: Joi.number().integer().description('ID of pet to update').meta({ format: 'int64' }).required(),
            }),
            query: Joi.object({
                additionalMetadata: Joi.string().description('Additional Metadata'),
            }),
        },
        plugins: {
            kaapi: {
                docs: {
                    modifiers: () => ({
                        requestBody: new RequestBodyDocsModifier().addMediaType('application/octet-stream', {
                            schema: {
                                type: 'string',
                                contentMediaType: 'application/octet-stream',
                            },
                        }),
                        responses: groupResponses(
                            new ResponseDocsModifier().setCode(200).setDescription('successful operation'),
                            badRequestResponse.withContext().setCode(400),
                            new ResponseDocsModifier().setCode(404).setDescription('Pet not found'),
                            new ResponseDocsModifier()
                                .setDefault(true)
                                .setDescription('Unexpected error')
                                .addMediaType('application/json', new MediaTypeModifier({ schema: errorSchema }))
                        ),
                    }),
                },
            },
        },
    },
    handler: async ({ params: { petId }, payload, query: { additionalMetadata } }, h) => {
        app.log.debug(`[uploadFile] petId: ${petId}`);
        app.log.debug(`[uploadFile] additionalMetadata: ${additionalMetadata}`);

        // validate file signature (PNG/JPG) and stream it back
        return new Promise((resolve, reject) => {
            // Collect first few bytes for validation
            let buffer = Buffer.alloc(0);
            let validated = false;
            const pass = new PassThrough();

            payload.on('data', (chunk) => {
                if (!validated) {
                    buffer = Buffer.concat([buffer, chunk]);

                    if (buffer.length >= 8) {
                        const header = buffer.subarray(0, 8);

                        // PNG/JPG check
                        const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
                        const jpegSig = Buffer.from([0xff, 0xd8]);

                        if (header.equals(pngSig) || header.subarray(0, 2).equals(jpegSig)) {
                            validated = true;
                            resolve(h.response(pass).type(header.equals(pngSig) ? 'image/png' : 'image/jpeg'));
                        } else {
                            payload.unpipe(pass);
                            // Drain the rest of the stream so client doesn't hang
                            payload.resume();
                            return reject(Boom.badRequest('Invalid file type'));
                        }
                    }
                }
                pass.write(chunk);
            });

            payload.on('end', () => {
                app.log.debug('[uploadFile] Done parsing payload!');
                pass.end();
                if (buffer.length < 8) {
                    return reject(Boom.badRequest('No file uploaded'));
                }
            });
        });
    },
});

// ---------- start http server ----------

await app.listen();

const BASE_URI = process.env.EXTERNAL_URI || app.base().info.uri;

app.log(`Server running on ${BASE_URI}\n`);
app.log(`Swagger UI on ${BASE_URI}/docs/api`);
app.log(`OpenAPI specification on ${BASE_URI}/docs/api/schema`);
app.log(`Postman collection on ${BASE_URI}/docs/api/schema?format=postman`);
