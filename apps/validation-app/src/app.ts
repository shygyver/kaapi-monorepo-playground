import { Kaapi } from '@kaapi/kaapi';
import { validatorArk } from '@kaapi/validator-arktype';
import { validatorValibot } from '@kaapi/validator-valibot';
import { validatorZod } from '@kaapi/validator-zod';

export const app = new Kaapi({
    port: process.env.PORT || 3002,
    host: process.env.HOST || 'localhost',
    docs: {
        host: {
            url: process.env.EXTERNAL_URI || '',
        },
        title: 'Validation app',
        ui: {
            swagger: {
                customCss: '.swagger-ui .topbar { display: none; }',
                customSiteTitle: 'Validation app',
            },
        },
    },
});

await app.extend(validatorArk);
await app.extend(validatorValibot);
await app.extend(validatorZod);
