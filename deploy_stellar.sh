#!/bin/bash

# TrustLoan Lite Stellar Deployment Script

echo "🚀 Deploying TrustLoan Lite to Stellar Testnet..."

# Check if soroban-cli is installed
if ! command -v soroban &> /dev/null; then
    echo "❌ soroban-cli not found. Please install Soroban CLI first."
    echo "Visit: https://github.com/stellar/soroban-cli"
    exit 1
fi

# Check if freighter is available
if ! command -v freighter &> /dev/null; then
    echo "⚠️  Freighter CLI not found. Make sure you have Freighter wallet installed."
fi

# Set network to testnet
echo "📡 Setting network to Stellar Testnet..."
soroban config network --global testnet

# Build the contract
echo "🔨 Building contract..."
cd contracts
cargo build --target wasm32-unknown-unknown --release

if [ $? -ne 0 ]; then
    echo "❌ Contract build failed"
    exit 1
fi

echo "✅ Contract built successfully"

# Deploy the contract
echo "🌟 Deploying contract to Stellar Testnet..."
CONTRACT_WASM="target/wasm32-unknown-unknown/release/trustloan_lite_stellar.wasm"

# Get contract address
CONTRACT_ADDRESS=$(soroban contract deploy $CONTRACT_WASM --source freighter)

if [ $? -eq 0 ]; then
    echo "✅ Contract deployed successfully!"
    echo "📍 Contract Address: $CONTRACT_ADDRESS"
    
    # Save deployment info
    echo "{\"address\": \"$CONTRACT_ADDRESS\", \"network\": \"testnet\", \"deployedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > ../deployed_stellar.json
    
    echo "📄 Deployment info saved to deployed_stellar.json"
    
    # Test the contract
    echo "🧪 Testing contract deployment..."
    soroban contract invoke $CONTRACT_ADDRESS version --source freighter
    
    echo "🎉 TrustLoan Lite Stellar contract is ready!"
    echo ""
    echo "Next steps:"
    echo "1. Update frontend with contract address: $CONTRACT_ADDRESS"
    echo "2. Test with Freighter wallet"
    echo "3. Verify on Stellar Explorer"
    
else
    echo "❌ Contract deployment failed"
    exit 1
fi
