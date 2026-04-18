/**
 * Chaupar Game Contract Configuration
 * Target: Conflux eSpace Testnet
 */

import { defineChain } from 'viem';

export type SupportedChainId = 71;

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

export const CONTRACT_ADDRESSES: Record<SupportedChainId, `0x${string}`> = {
    [confluxEspaceTestnet.id]: (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
        '0x0000000000000000000000000000000000000000') as `0x${string}`,
};

export const WS_URLS: Record<SupportedChainId, string> = {
    [confluxEspaceTestnet.id]: 'wss://evmtestnet.confluxrpc.com/ws',
};

export const HTTP_URLS: Record<SupportedChainId, string> = {
    [confluxEspaceTestnet.id]: 'https://evmtestnet.confluxrpc.com',
};

export function getChainById(chainId: SupportedChainId) {
    return confluxEspaceTestnet;
}

export function getContractAddress(chainId: SupportedChainId): `0x${string}` {
    return CONTRACT_ADDRESSES[chainId];
}

export function getWebSocketUrl(chainId: SupportedChainId): string {
    return WS_URLS[chainId];
}

export const DEFAULT_CHAIN_ID: SupportedChainId = confluxEspaceTestnet.id;

export const activeChain = confluxEspaceTestnet;
export const HILO_CONTRACT_ADDRESS = CONTRACT_ADDRESSES[confluxEspaceTestnet.id];

export const HILO_GAME_ABI = [
    // Read
    { inputs: [], name: 'MIN_BET', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'MAX_BET', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'MAX_WIN', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'TIMEOUT_DURATION', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'treasuryBalance', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'getEntropyFee', outputs: [{ type: 'uint256' }], stateMutability: 'pure', type: 'function' },
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
    // Write
    { inputs: [], name: 'startGame', outputs: [], stateMutability: 'payable', type: 'function' },
    { inputs: [{ name: 'roundId', type: 'bytes32' }], name: 'predictHigherOrSame', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'roundId', type: 'bytes32' }], name: 'predictLowerOrSame', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'roundId', type: 'bytes32' }], name: 'skipCard', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'roundId', type: 'bytes32' }], name: 'cashOut', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'roundId', type: 'bytes32' }], name: 'endTimedOutRound', outputs: [], stateMutability: 'nonpayable', type: 'function' },
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
] as const;
