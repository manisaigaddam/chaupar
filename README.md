# चौपड़ (Chaupar) — On-Chain Betting 

**Chaupar** is a pure on-chain, Ganjifa-themed HiLo card prediction game built on the Conflux eSpace Testnet. The game utilizes the `USDT0` token for wagers and features a decentralized House Liquidity Pool, allowing users to earn yields by acting as the house.

This project was built for the **Conflux Global Hackfest 2026**.

## 🌟 Key Features

1. **Provably Fair On-Chain Logic**: Every bet, prediction, and cashout is a real blockchain transaction. We use block hashes and a nonce system as a pseudo-random entropy source, ensuring fairness (and providing a clear upgrade path to VRF).
2. **USDT0 Economy**: Players wager seamlessly using the Conflux testnet pegged USDT0 token, completely separated from gas fees which use testnet CFX. Max win is capped at **1000 USDT0**.
3. **Decentralized House Pool**: Instead of a central treasury, anyone can deposit USDT0 into the House Pool and earn LP shares. The pool earns the 4% house edge on all games played (96% RTP).
4. **Desi Indian Aesthetics**: Ganjifa-inspired card aesthetics, Devanagari numbering, localized Hindi microcopy, and 8 custom authentic Indian-inspired instrument sounds (tabla, sitar, tanpura, etc.) for a highly engaging user experience.
5. **Session Safety**: A robust session-reconnection system using `hasActiveRound` and local storage mapping. Players who accidentally refresh or lose connection can instantly pick up their game exactly where they left off without losing their bet.

## 🏗️ Architecture & Flow

*   **Frontend**: Next.js 14 (App Router), React, TailwindCSS, Framer Motion for the UI.
*   **Web3 Integration**: Wagmi, Viem, and Privy for smooth wallet connection, auto-approvals, and blockchain reading/writing. 
*   **Smart Contract**: `ChauparGameUSDT.sol` (written in Solidity 0.8.24) deployed on Conflux eSpace.

### The Game Loop (Logic & Math)
- The game pays out based on a strict `96% RTP` (Return to Player) model. The odds dynamically change based on the target value. 
- Example: Guessing "Higher" on a 2 throws a small 1.04x multiplier. Guessing "Lower" on a 13 gives a large 6.99x multiplier.
- Players place an initial wager in USDT0. As long as they guess correctly, their multiplier compounds. Players can cash out anytime. 

### The House Pool
- The max bet is 10 USDT0 logic strictly prevents the pool from exceeding its maximum 5000 USDT0 exposure limit.
- Liquidity Providers (LPs) bear the variance risk but capture all lost bets and edges over a large sum of rounds. LPs can deposit and withdraw at any time.

## 🔗 Deployed Contracts (Conflux eSpace Testnet)

* **ChauparGameUSDT**: `0x19ED1a04d3eA1eD7AC5FdcbeBeD20760f38Eb87D` *(Example placeholder, replace with actual output after deployment)*
* **USDT0 Token**: `0x4d1beb67e8f0102d5c983c26fdf0b7c6fff37a0c`
* **Network**: Conflux eSpace Testnet (`chainId: 71`)

## 🚀 Setup & Execution 

### Requirements
- Node.js (v18+)
- A web3 wallet (e.g., MetaMask, Rabby)
- Testnet CFX (for gas) and Testnet USDT0 (for bets) from the [Conflux Faucet](https://efaucet.confluxnetwork.org/).

### Installation
1. Clone the repository.
   ```bash
   git clone https://github.com/YOUR_GITHUB/chaupar-onchain.git
   cd chaupar-onchain
   ```
2. Install dependencies for the frontend.
   ```bash
   cd frontend
   npm install
   ```
3. Set your environment variables in `.env` based on `.env.example`.
4. Run the development server!
   ```bash
   npm run dev
   ```

## 📈 Go-to-Market Strategy

**1. Ecosystem Value Add**  
Conflux eSpace requires engaging dApps to drive transactional velocity and TVL. A robust prediction game like Chaupar acts as a black hole for liquidity, gamifying Web3 onboarding.

**2. The Liquidity Flywheel**  
Our growth relies on a dual-sided marketplace approach:
* **Bootstrapping LPs**: Actively market the house pool as a high-yield single-sided staking product for USDT0 holders. 
* **Acquiring Players**: Use the active LP depth to enable higher `MAX_WIN` and `MAX_BET` caps, attracting "whales" and streamers.

**3. Roadmap & Upgrades**  
* **Phase 1**: Mainnet deployment on Conflux Core / eSpace.
* **Phase 2**: Replacing blockhash randomness with highly secure Verifiable Random Functions (VRF) and implementing an ERC-4337 Paymaster so users play gas-free.
* **Phase 3**: Hosting bracket tournaments and leaderboard airdrops for the Conflux regional communities.

## 📄 License
This project is open-source and dual-licensed under the MIT License.
