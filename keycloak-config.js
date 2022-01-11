require('dotenv').config();

const keycloakGeneralConfig = {
    // realmUrl: process.env.GENERAL_KEYCLOAK_REALMURL,
    realmUrl: `${process.env.MANAGEMENT_HOST}:${process.env.MANAGEMENT_PORT}/auth/realms/dccm`,
    clientId: 'hapi-general-server'
}

const keycloakGeneralAuthConfig = {
    strategies: ['keycloak-jwt'],
    access:{
        scope:[
            'clientscope:dccm_system',
            'clientscope:active_vendor'
        ]
    }
}

module.exports = {
    keycloakGeneralAuthConfig,
    keycloakGeneralConfig
}