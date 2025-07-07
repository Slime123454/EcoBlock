export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY',
  contractAddresses: {
    ecoBlockToken: '0x...',
    energyMarket: '0x...',
    materialTrace: '0x...'
  },
  testMode: true // Add this line
};