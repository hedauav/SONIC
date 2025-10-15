# SonicIPToken Deployment Guide

This guide provides instructions for deploying the SonicIPToken smart contract to various blockchain networks.

## Prerequisites

1. **Node.js and npm**: Make sure you have Node.js and npm installed.
2. **Wallet**: You need a wallet with funds on the target network.
3. **Private key**: You need your wallet's private key for signing transactions.
4. **Network access**: Ensure you have access to the target network.

## Setup

1. **Configure environment variables**:
   
   Open the `.env` file and add your private key and API keys:
   ```
   PRIVATE_KEY=your_wallet_private_key_here
   ETHERSCAN_API_KEY=your_etherscan_api_key_here (optional for verification)
   ```

   **IMPORTANT**: Never commit your `.env` file with your private key to version control!

2. **Install dependencies**:
   
   If you haven't already:
   ```bash
   npm install
   ```

## Deployment Options

### Option 1: Deploy to Filecoin Calibration Testnet (Recommended for Testing)

```bash
npx hardhat run scripts/deploy.js --network filecoinCalibration
```

### Option 2: Deploy to Filecoin Mainnet

```bash
npx hardhat run scripts/deploy.js --network filecoinMainnet
```

### Option 3: Deploy to Sepolia (Ethereum Testnet)

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## After Deployment

1. **Save the contract address**: The address will be output in the console and saved to `contract-address.json`.

2. **Update your frontend**: Copy the new contract address to your frontend configuration:
   - Update `lib/sonicIpContract.ts` with the new address

3. **Verify the contract** (if needed):
   ```bash
   npx hardhat verify --network [network-name] [contract-address]
   ```

## Security Considerations

- **Private Key Security**: Always keep your private key secure and never expose it.
- **Test on Testnet First**: Always deploy to a testnet first to ensure everything works correctly.
- **Check Gas Costs**: Be aware of deployment gas costs on the target network.

## Troubleshooting

- **Insufficient Funds**: Make sure your wallet has enough funds for deployment.
- **Network Issues**: Check if the network is congested or if there are issues with the RPC endpoint.
- **Nonce Issues**: If you encounter nonce issues, try resetting your account's transaction history in MetaMask.