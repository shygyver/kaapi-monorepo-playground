import { createLogger } from '@kaapi/kaapi';
import winston from 'winston';

export const logger = createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                ...[
                    process.env.NODE_ENV !== 'production' && winston.format.colorize(),
                    winston.format.splat(),
                    process.env.NODE_ENV === 'production' ? winston.format.json() : winston.format.simple(),
                ].filter((v) => typeof v !== 'boolean')
            ),
        }),
    ],
});
