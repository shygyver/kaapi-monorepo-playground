import { Resource, RESOURCES } from '../db/resources';
import { KaapiServerRoute } from '@kaapi/kaapi';
import Joi from 'joi';

export const getResourcesRoute: KaapiServerRoute = {
    method: 'GET',
    path: '/api/resources',
    auth: true,
    options: { auth: { access: { entity: 'any', scope: ['read', 'admin'] } } },
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

export const deleteResourcesRoute: KaapiServerRoute<{
    AuthApp: { id: string };
    Params: { id: number };
}> = {
    method: 'DELETE',
    path: '/api/resources/{id}',
    auth: true,
    options: {
        auth: { access: { entity: 'app', scope: ['admin'] } },
        validate: {
            params: Joi.object({
                id: Joi.number().integer().required(),
            }),
        },
    },
    handler: ({
        auth: {
            credentials: { app },
        },
        params: { id },
    }) => {
        const idx = RESOURCES.findIndex((r) => r.id === id);

        if (idx > -1) RESOURCES.splice(idx, 1);

        return {
            message: `Deleted ${idx > -1 ? 1 : 0} resource(s)`,
            app: app?.id,
        };
    },
};
