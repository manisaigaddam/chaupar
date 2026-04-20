/**
 * Chaupar Game Contract Configuration
 * Target: Conflux eSpace Testnet — USDT0 Bets + House Pool
 */

import { defineChain } from 'viem';

export type SupportedChainId = 71;

// Token decimals for USDT0
export const TOKEN_DECIMALS = 6;
export const TOKEN_SYMBOL = 'USDT0';

export const confluxEspaceTestnet = defineChain({
    id: 71,
    name: 'Conflux eSpace Testnet',
    nativeCurrency: {
        decimals: 18,
        name: 'Conflux',
        symbol: 'CFX',
    },
    rpcUrls: {
        default: {
            http: ['https://evmtestnet.confluxrpc.com'],
            webSocket: ['wss://evmtestnet.confluxrpc.com/ws'],
        },
    },
    blockExplorers: {
        default: {
            name: 'ConfluxScan',
            url: 'https://evmtestnet.confluxscan.io',
        },
    },
    testnet: true,
});

// Faucet USDT0 on Conflux eSpace Testnet (6 decimals)
export const FAUCET_USDT_TESTNET = '0x4d1beb67e8f0102d5c983c26fdf0b7c6fff37a0c' as `0x${string}`;
// USDT0 on Conflux eSpace Mainnet
export const USDT0_MAINNET = '0xaf37E8B6C9ED7f6318979f56Fc287d76c30847ff' as `0x${string}`;

export const CONTRACT_ADDRESSES: Record<SupportedChainId, `0x${string}`> = {
    [confluxEspaceTestnet.id]: (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
        '0x0000000000000000000000000000000000000000') as `0x${string}`,
};

export const USDT_ADDRESSES: Record<SupportedChainId, `0x${string}`> = {
    [confluxEspaceTestnet.id]: (process.env.NEXT_PUBLIC_USDT_ADDRESS || FAUCET_USDT_TESTNET) as `0x${string}`,
};

export const WS_URLS: Record<SupportedChainId, string> = {
    [confluxEspaceTestnet.id]: 'wss://evmtestnet.confluxrpc.com/ws',
};

export const HTTP_URLS: Record<SupportedChainId, string> = {
    [confluxEspaceTestnet.id]: 'https://evmtestnet.confluxrpc.com',
};

export function getChainById(_chainId: SupportedChainId) {
    return confluxEspaceTestnet;
}

export function getContractAddress(chainId: SupportedChainId): `0x${string}` {
    return CONTRACT_ADDRESSES[chainId];
}

export function getUsdtAddress(chainId: SupportedChainId): `0x${string}` {
    return USDT_ADDRESSES[chainId];
}

export function getWebSocketUrl(chainId: SupportedChainId): string {
    return WS_URLS[chainId];
}

export const DEFAULT_CHAIN_ID: SupportedChainId = confluxEspaceTestnet.id;

export const activeChain = confluxEspaceTestnet;
export const HILO_CONTRACT_ADDRESS = CONTRACT_ADDRESSES[confluxEspaceTestnet.id];

// ERC20 ABI for USDT0 interactions
export const ERC20_ABI = [
    { inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], name: 'allowance', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'decimals', outputs: [{ type: 'uint8' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
] as const;

export const HILO_GAME_ABI = [
    // Read
    { inputs: [], name: 'MIN_BET', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'MAX_BET', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'MAX_WIN', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'TIMEOUT_DURATION', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'treasuryBalance', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'getEntropyFee', outputs: [{ type: 'uint256' }], stateMutability: 'pure', type: 'function' },
    { inputs: [], name: 'usdt', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'totalLpShares', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'totalGamesPlayed', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'totalWagered', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'totalHouseEdgeCollected', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    {
        inputs: [{ name: 'player', type: 'address' }],
        name: 'getPlayerRoundInfo',
        outputs: [
            { name: 'roundId', type: 'bytes32' },
            { name: 'hasRound', type: 'bool' },
            { name: 'betAmount', type: 'uint256' },
            { name: 'currentCardValue', type: 'uint8' },
            { name: 'currentCardSuit', type: 'uint8' },
            { name: 'roundNumber', type: 'uint8' },
            { name: 'currentMultiplierBps', type: 'uint256' },
            { name: 'currentWinAmount', type: 'uint256' },
            { name: 'vrfReady', type: 'bool' },
            { name: 'timeRemaining', type: 'uint256' },
            { name: 'higherMultiplier', type: 'uint256' },
            { name: 'lowerMultiplier', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'cardValue', type: 'uint8' }, { name: 'isHigher', type: 'bool' }],
        name: 'getMultiplier',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'lp', type: 'address' }],
        name: 'getLPInfo',
        outputs: [
            { name: 'shares', type: 'uint256' },
            { name: 'totalShares', type: 'uint256' },
            { name: 'valueInUSDT', type: 'uint256' },
            { name: 'tvl', type: 'uint256' },
            { name: 'availableLiquidity', type: 'uint256' },
            { name: 'gamesPlayed', type: 'uint256' },
            { name: 'wagered', type: 'uint256' },
            { name: 'houseEdgeCollected', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    // Write - Game
    { inputs: [{ name: 'amount', type: 'uint256' }], name: 'startGame', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'roundId', type: 'bytes32' }], name: 'predictHigherOrSame', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'roundId', type: 'bytes32' }], name: 'predictLowerOrSame', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'roundId', type: 'bytes32' }], name: 'skipCard', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'roundId', type: 'bytes32' }], name: 'cashOut', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'roundId', type: 'bytes32' }], name: 'endTimedOutRound', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    // Write - House Pool
    { inputs: [{ name: 'amount', type: 'uint256' }], name: 'depositLiquidity', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'shares', type: 'uint256' }], name: 'withdrawLiquidity', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    // Events
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'roundId', type: 'bytes32' },
            { indexed: true, name: 'player', type: 'address' },
            { indexed: false, name: 'betAmount', type: 'uint256' },
            { indexed: false, name: 'initialCardValue', type: 'uint8' },
            { indexed: false, name: 'initialCardSuit', type: 'uint8' },
            { indexed: false, name: 'entropySequenceNumber', type: 'uint64' },
            { indexed: false, name: 'timestamp', type: 'uint256' },
        ],
        name: 'RoundStarted',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'roundId', type: 'bytes32' },
            { indexed: true, name: 'entropySequenceNumber', type: 'uint64' },
            { indexed: false, name: 'timestamp', type: 'uint256' },
        ],
        name: 'EntropyReady',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'roundId', type: 'bytes32' },
            { indexed: false, name: 'roundNumber', type: 'uint8' },
            { indexed: false, name: 'cardValue', type: 'uint8' },
            { indexed: false, name: 'cardSuit', type: 'uint8' },
            { indexed: false, name: 'currentMultiplierBps', type: 'uint256' },
            { indexed: false, name: 'timestamp', type: 'uint256' },
        ],
        name: 'CardRevealed',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'roundId', type: 'bytes32' },
            { indexed: false, name: 'prediction', type: 'uint8' },
            { indexed: false, name: 'won', type: 'bool' },
            { indexed: false, name: 'previousCard', type: 'uint8' },
            { indexed: false, name: 'newCard', type: 'uint8' },
            { indexed: false, name: 'multiplierApplied', type: 'uint256' },
            { indexed: false, name: 'newTotalMultiplier', type: 'uint256' },
            { indexed: false, name: 'timestamp', type: 'uint256' },
        ],
        name: 'PredictionResult',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'roundId', type: 'bytes32' },
            { indexed: true, name: 'player', type: 'address' },
            { indexed: false, name: 'betAmount', type: 'uint256' },
            { indexed: false, name: 'finalRound', type: 'uint8' },
            { indexed: false, name: 'finalMultiplierBps', type: 'uint256' },
            { indexed: false, name: 'winAmount', type: 'uint256' },
            { indexed: false, name: 'endReason', type: 'string' },
            { indexed: false, name: 'timestamp', type: 'uint256' },
        ],
        name: 'RoundEnded',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'provider', type: 'address' },
            { indexed: false, name: 'amount', type: 'uint256' },
            { indexed: false, name: 'sharesIssued', type: 'uint256' },
            { indexed: false, name: 'totalShares', type: 'uint256' },
            { indexed: false, name: 'tvl', type: 'uint256' },
        ],
        name: 'LiquidityDeposited',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'provider', type: 'address' },
            { indexed: false, name: 'amount', type: 'uint256' },
            { indexed: false, name: 'sharesBurned', type: 'uint256' },
            { indexed: false, name: 'totalShares', type: 'uint256' },
            { indexed: false, name: 'tvl', type: 'uint256' },
        ],
        name: 'LiquidityWithdrawn',
        type: 'event',
    },
] as const;
