import { oidcAuthCodeBuilder } from './oidc-auth-code';
import { oidcClientCredentialsBuilder } from './oidc-client-credentials';
import { oidcDeviceAuthorization } from './oidc-device-auth';
import { createInMemoryKeyStore, MultipleFlowsBuilder } from '@kaapi/oauth2-auth-design';

const oidcAuthFlows = MultipleFlowsBuilder.create()
    .tokenEndpoint('/oauth2/v1.0/token')
    .jwksRoute((route) => route.setPath('/discovery/v1.0/keys')) // activates jwks uri
    .setPublicKeyExpiry(86400) // 24h
    .setJwksKeyStore(createInMemoryKeyStore()) // store for JWKS
    .setJwksRotatorOptions({
        intervalMs: 7.884e9, // 91 days
        timestampStore: createInMemoryKeyStore(),
    })
    .add(oidcAuthCodeBuilder)
    .add(oidcClientCredentialsBuilder)
    .add(oidcDeviceAuthorization)
    .additionalConfiguration({
        userinfo_endpoint: '/v1.0/userinfo',
    })
    .build();

oidcAuthFlows.setSecuritySchemeName('OpenID Connect');

export default oidcAuthFlows;
