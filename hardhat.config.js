require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    confluxEspaceTestnet: {
      url: process.env.CONFLUX_TESTNET_RPC || "https://evmtestnet.confluxrpc.com",
      chainId: 71,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto"
    },
    confluxEspace: {
      url: process.env.CONFLUX_MAINNET_RPC || "https://evm.confluxrpc.com",
      chainId: 1030,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto"
    }
  },
  etherscan: {
    apiKey: {
      confluxEspaceTestnet: "no-api-key-needed",
      confluxEspace: "no-api-key-needed"
    },
    customChains: [
      {
        network: "confluxEspaceTestnet",
        chainId: 71,
        urls: {
          apiURL: "https://evmapi-testnet.confluxscan.io/api",
          browserURL: "https://evmtestnet.confluxscan.io"
        }
      },
      {
        network: "confluxEspace",
        chainId: 1030,
        urls: {
          apiURL: "https://evmapi.confluxscan.io/api",
          browserURL: "https://evm.confluxscan.io"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
