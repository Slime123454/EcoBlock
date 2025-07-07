// client/src/app/abis/energy-market.abi.ts
export const ENERGY_MARKET_ABI = [
  {
    "inputs": [],
    "name": "getAllListings",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "id", "type": "uint256"},
          {"internalType": "address", "name": "seller", "type": "address"},
          {"internalType": "uint256", "name": "amount", "type": "uint256"},
          {"internalType": "uint256", "name": "pricePerUnit", "type": "uint256"},
          {"internalType": "string", "name": "energyType", "type": "string"},
          {"internalType": "string", "name": "location", "type": "string"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "internalType": "struct EnergyMarket.Listing[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "uint256", "name": "pricePerUnit", "type": "uint256"},
      {"internalType": "string", "name": "energyType", "type": "string"},
      {"internalType": "string", "name": "location", "type": "string"}
    ],
    "name": "listEnergy",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "listingId", "type": "uint256"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "buyEnergy",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];