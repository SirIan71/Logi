import appdynamics from 'appdynamics';

appdynamics.profile({
  controllerHostName: process.env.APPDYNAMICS_CONTROLLER_HOST_NAME || 'green202608110258116.saas.appdynamics.com',
  controllerPort: Number(process.env.APPDYNAMICS_CONTROLLER_PORT) || 443,
  controllerSslEnabled: process.env.APPDYNAMICS_CONTROLLER_SSL_ENABLED !== 'false',
  accountName: process.env.APPDYNAMICS_AGENT_ACCOUNT_NAME || 'green202608110258116',
  accountAccessKey: process.env.APPDYNAMICS_AGENT_ACCOUNT_ACCESS_KEY || 'igu4z8rq7fcr',
  applicationName: process.env.APPDYNAMICS_AGENT_APPLICATION_NAME || 'Sirian Logi',
  tierName: process.env.APPDYNAMICS_AGENT_TIER_NAME || 'Application tier',
  nodeName: process.env.APPDYNAMICS_AGENT_NODE_NAME || 'process'
});
