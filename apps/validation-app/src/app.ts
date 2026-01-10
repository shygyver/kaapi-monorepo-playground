import routeArktype from './route-arktype';
import routeJoi from './route-joi';
import routeValibot from './route-valibot';
import routeZod from './route-zod';
import routeZodAlternative from './route-zod-alternative';
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
                customJsStr: `
                setTimeout(() => {
                if (document.documentElement.classList.contains("dark-mode")) { document.documentElement.classList.remove("dark-mode"); }
                }, 10);
                `,
            },
        },
    },
});

await app.extend(validatorArk);
await app.extend(validatorValibot);
await app.extend(validatorZod);

app.route(routeArktype).route(routeJoi).route(routeValibot).route(routeZod).route(routeZodAlternative);
