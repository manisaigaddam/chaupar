<div align="center">
  <img src="frontend/public/logo.png" alt="Chaupar Logo" width="120" />
</div>

<br/>

# Chaupar (चौपड़)

A provably fair, Ganjifa-themed prediction game on Conflux eSpace featuring a decentralized Liquidity Pool house and a strict 96% RTP mathematical core.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Conflux](https://img.shields.io/badge/built%20on-Conflux-blue)](https://confluxnetwork.org)
[![Hackathon](https://img.shields.io/badge/Global%20Hackfest%202026-green)](https://github.com/conflux-fans/global-hackfest-2026)

## Overview

Traditional Web3 casinos suffer from black-box RNG and centralized house reserves. Chaupar solves this by reinventing the mathematical core of the game around a decentralized **Liquidity Pool House** and wrapping it in the rich, ancient heritage of Indian **Ganjifa** aesthetics. Players access a blazing-fast, transparent betting experience on Conflux eSpace, while DeFi users deposit USDT0 to passively farm the house edge.

## Hackathon

Global Hackfest 2026 (2026-03-23 – 2026-04-20)

## Team

- Manisai (GitHub: [@manisaigaddam](https://github.com/manisaigaddam), Discord: manisai#5791) - Full Stack / Blockchain
- Manikanta (GitHub: [@manialex7569](https://github.com/manialex7569), Discord: manikanta#5791) - UI/UX & Architecture

## Problem Statement

Web3 gaming is saturated with generic, westernized casino templates that rely on off-chain black-box RNG and centralized, privileged house treasuries. This creates three critical friction points in the industry:
1. **The Casino Monopoly**: Liquidity and yields are concentrated at the top with the casino owners, alienating decentralized finance participants.
2. **The Gas Bottleneck**: High-frequency predictive gaming is impossible on Layer-1 Mainnets due to scaling costs and block times.
3. **The Cultural Gap**: The APAC region represents the largest gaming demographic globally, yet lacks culturally native Web3 products that resonate with local heritage.

## Solution

Chaupar operates as a decentralized dual-sided marketplace governed entirely by an immutable Solidity construct on Conflux eSpace.
- **You Are The House**: By democratizing the House Edge (4%) into an open LP pool, DeFi users earn passive yields directly from global player volume.
- **Bulletproof State Recovery**: Drop a WebSocket connection? Close your browser mid-bet? The Chaupar frontend reads `hasRound` states directly from the Conflux chain, seamlessly restoring paused P2E sessions without losing player funds.
- **Authentic Localization**: We bring the ancient Indian game of chance on-chain with authentic Hindi localization, Devanagari numerals, and classical Indian soundscapes to deeply penetrate the APAC market.

## Go-to-Market Plan

Chaupar is designed to penetrate the nascent Conflux gaming sector through a three-pronged strategy:

1. **The Liquidity Flywheel**  
   We initially market to DeFi degens seeking single-sided staking yields. Deep liquidity enables higher betting caps without risking insolvency, which attracts high-roller gamers, feeding directly back into LP yield maximization.
   
2. **Cultural Moat in APAC**
   By utilizing deep aesthetic ties to Indian board systems (चौपड़) rather than standard playing cards, we create sticky, culturally prideful viral loops that tap into the massive APAC gaming demographic—creating a localized product that generic white-label casinos cannot replicate.

3. **Infrastructural Expansion**
   - **Phase 1 (Current)**: eSpace Testnet MVP proving the mathematical edge, LP architecture, and UX.
   - **Phase 2**: Launching Mainnet + Verifiable Random Function (VRF) Oracles.
   - **Phase 3**: Integration of ERC-4337 Account Abstraction. Paymasters will leverage the House Pool yields to implicitly subsidize 100% of player gas fees, dropping onboarding friction to zero.

## Conflux Integration

Chaupar leverages the following Conflux systems to ensure blazing-fast execution:

- **Conflux eSpace**: Deployed native Solidity contracts utilizing Conflux's EVM-compatible execution layer for massive transaction throughput and sub-second confirmations.
- **Built-in Contracts**: Heavy integrations with standard Conflux-deployed USDT0 ERC20 primitives.
- **Privy Web3 Auth**: Frictionless pseudo-custodial wallet generation embedded directly into the frontend infrastructure for seamless user onboarding into the Conflux ecosystem.

## Features

- **Strict 96% RTP Mathematics** - The smart contract calculates risk probabilities dynamically on every single card drawn, computing fixed compound multipliers that yield an exact 4% house edge.
- **Decentralized Liquidity Pool** - Deposits into the House Treasury are open to everyone, creating a true DeFi implementation of casino mechanics.
- **Dynamic Exposure Limiting** - Real-time caps on maximum bets based on the total depth of the USDT0 pool to mechanically protect LP providers from insolvency.
- **Session Auto-Recovery** - The React state automatically reconstructs abandoned or disconnected game states directly from the immutable blockchain events.

## Technology Stack

- **Frontend**: Next.js App Router (React), Zustand, Tailwind CSS, Framer Motion
- **Web3 Integration**: viem / wagmi / Privy
- **Blockchain**: Conflux eSpace Testnet
- **Smart Contracts**: Solidity (Standard ERC20 & Blockhash RNG models)
- **Development Environment**: Hardhat

## Setup Instructions

### Prerequisites

- Node.js v18+
- Git
- Conflux Wallet (Fluent Wallet or MetaMask configured for Conflux eSpace Testnet)
- Testnet CFX (for gas) and USDT0 (for betting)

### Installation

1. Clone the repository
    ```bash
    git clone https://github.com/manisaigaddam/chaupar.git
    cd chaupar
    ```

2. Install frontend dependencies
    ```bash
    cd frontend
    npm install
    ```

3. Configure environment
    ```bash
    cp .env.example .env.local
    ```
    Edit `frontend/.env.local` to match your target contracts:
    ```env
    NEXT_PUBLIC_PRIVY_APP_ID="your_privy_app_id"
    NEXT_PUBLIC_CONTRACT_ADDRESS="0x2fB5C50e4B6F9F27b43200cB714b88A7F38882Ab"
    NEXT_PUBLIC_USDT_ADDRESS="0x4d1beb67e8f0102d5c983c26fdf0b7c6fff37a0c"
    ```

4. Run the frontend application
    ```bash
    npm run dev
    ```

## Usage

1. **Connect Wallet**: Click "Connect" in the application and authenticate via Privy (wallet or email).
2. **House Pool Operations (Become the House)**: Navigate to the House Pool tab, enter an amount of USDT0, and click Deposit to earn passive yield.
3. **Gameplay**: Go to the Game tab. Ensure you have Testnet CFX and USDT0. Select your starting Wager Amount, click Start Game, and predict whether the next Ganjifa card will be Higher or Lower.
4. **Cash Out**: Click Cash Out at any time to claim your USDT0 winnings directly to your Conflux address.

## Demo

- **Live Demo**: [https://chaupar.vercel.app/](https://chaupar.vercel.app/)
- **Demo Video**: [https://youtu.be/WBGArlqnRRk](https://youtu.be/WBGArlqnRRk)
- **Participant Intro Video**: [https://youtu.be/Ll2LyZ-SDQE](https://youtu.be/Ll2LyZ-SDQE)
- **Screenshots**: See `/demo/screenshots/`

## Architecture

The architecture relies on a highly scalable client-to-chain model:

1. The Next.js frontend uses `wagmi` and `viem` to craft transactions (Start, Cash Out, Bet) and sends them to the Conflux eSpace RPC. 
2. A parallel WebSocket listener observes `PredictionResult` events to drive the UI states smoothly. 
3. If WebSocket connection drops, a polling fallback explicitly queries the `hasRound` view function from the Solidity contract to seamlessly rebuild the user's interface.

## Smart Contracts

The game utilizes fully verified EVM-compatible contracts on Conflux eSpace.

- **ChauparGameUSDT**: `0x2fB5C50e4B6F9F27b43200cB714b88A7F38882Ab` (Testnet)
- **USDT0 Token**: `0x4d1beb67e8f0102d5c983c26fdf0b7c6fff37a0c` (Testnet)

## Future Improvements

- Implementation of True Verifiable Random Function (VRF) to replace current blockhash models.
- Integration of ERC-4337 Account Abstraction paymasters to fully sponsor player gas fees using LP yields.
- Expansion across mainnet multi-chain variants targeting parallel EVM networks.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Conflux Network** & Global Hackfest 2026 Organizers
- **Privy** for providing rapid embedded wallet configurations.
