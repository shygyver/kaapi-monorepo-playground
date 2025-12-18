// === Valid clients and users ===
export const VALID_CLIENTS = [
    {
        client_id: 'service-api-client',
        client_secret: 's3cr3tK3y123!',
        allowed_scopes: ['openid', 'profile', 'email', 'offline_access', 'read', 'write'],
    },
    {
        client_id: 'internal-service',
        client_secret: 'Int3rnalK3y!',
        allowed_scopes: ['read', 'write', 'admin'],
        internal: true,
    },
];

export const REGISTERED_USERS = [{ id: 'user-1234', username: 'user', password: 'crossterm', email: 'user@email.com' }];
