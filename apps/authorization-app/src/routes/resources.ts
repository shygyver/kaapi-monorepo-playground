import { Resource, RESOURCES } from '../db/resources';
import { KaapiServerRoute } from '@kaapi/kaapi';
import Joi from 'joi';

export const getResourcesRoute: KaapiServerRoute<{
    AuthUser: { id: string; clientId: string };
}> = {
    method: 'GET',
    path: '/api/resources',
    auth: true,
    options: { auth: { access: { entity: 'user', scope: ['read'] } } },
    handler: () => [...RESOURCES],
};

export const postResourcesRoute: KaapiServerRoute<{
    AuthUser: { id: string; clientId: string };
    Payload: { title: string; content?: string };
}> = {
    method: 'POST',
    path: '/api/resources',
    auth: true,
    options: {
        auth: { access: { entity: 'user', scope: ['write'] } },
        validate: {
            payload: Joi.object({
                title: Joi.string().trim().required(),
                content: Joi.string().trim().allow(''),
            }),
        },
    },
    handler: ({
        auth: {
            credentials: { user },
        },
        payload: { title, content },
    }) => {
        const newResource: Resource = {
            id: Date.now(),
            title,
            content,
            createdBy: user!.id,
        };
        RESOURCES.push(newResource);

        return newResource;
    },
};
