export const environment = {
  production: true,
  apiUrl: '/api',
  wsUrl: 'wss://' + window.location.host + '/ws',
  reverbAppKey: 'aura_reverb_key',
  reverbHost: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
  reverbPort: 443,
  reverbScheme: 'https',
  broadcastingAuthUrl: '/api/broadcasting/auth'
};
