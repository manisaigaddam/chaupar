/**
 * WebSocket Event Subscriptions - Pure On-Chain Chaupar
 * 
 * Listens for: RoundStarted, EntropyReady, CardRevealed, PredictionResult, RoundEnded
 * Features: Exponential backoff, roundId-based event filtering
 */

import { useEffect, useRef } from 'react';
import { createPublicClient, webSocket } from 'viem';
import {
    DEFAULT_CHAIN_ID,
    getChainById,
    getContractAddress,
    getWebSocketUrl,
    HILO_GAME_ABI,
    SupportedChainId
} from './contracts';

// Event types from contract
export interface RoundStartedEvent {
    roundId: `0x${string}`;
    player: `0x${string}`;
    betAmount: bigint;
    initialCardValue: number;
    initialCardSuit: number;
    entropySequenceNumber: bigint;
    timestamp: bigint;
}

export interface EntropyReadyEvent {
    roundId: `0x${string}`;
    entropySequenceNumber: bigint;
    timestamp: bigint;
}

export interface CardRevealedEvent {
    roundId: `0x${string}`;
    roundNumber: number;
    cardValue: number;
    cardSuit: number;
    currentMultiplierBps: bigint;
    timestamp: bigint;
}

export interface PredictionResultEvent {
    roundId: `0x${string}`;
    prediction: number;
    won: boolean;
    previousCard: number;
    newCard: number;
    multiplierApplied: bigint;
    newTotalMultiplier: bigint;
    timestamp: bigint;
}

export interface RoundEndedEvent {
    roundId: `0x${string}`;
    player: `0x${string}`;
    betAmount: bigint;
    finalRound: number;
    finalMultiplierBps: bigint;
    winAmount: bigint;
    endReason: string;
    timestamp: bigint;
}

// Create WebSocket public client
export function createWebSocketClient(chainId: SupportedChainId = DEFAULT_CHAIN_ID) {
    const chain = getChainById(chainId);
    const wsUrl = getWebSocketUrl(chainId);

    console.log(`🔌 Creating WebSocket client for ${chain.name} at ${wsUrl}`);

    return createPublicClient({
        chain,
        transport: webSocket(wsUrl, {
            retryCount: 10,
            retryDelay: 3000, // 3s between reconnection attempts
        }),
    });
}

// Hook for subscribing to contract events
// Tracks active roundId to filter CardRevealed/PredictionResult events
export function useContractEvents({
    playerAddress,
    chainId = DEFAULT_CHAIN_ID,
    enabled = true,
    onRoundStarted,
    onEntropyReady,
    onCardRevealed,
    onPredictionResult,
    onRoundEnded,
}: {
    playerAddress?: `0x${string}`;
    chainId?: SupportedChainId;
    enabled?: boolean;
    onRoundStarted?: (event: RoundStartedEvent) => void;
    onEntropyReady?: (event: EntropyReadyEvent) => void;
    onCardRevealed?: (event: CardRevealedEvent) => void;
    onPredictionResult?: (event: PredictionResultEvent) => void;
    onRoundEnded?: (event: RoundEndedEvent) => void;
}) {
    const clientRef = useRef<ReturnType<typeof createWebSocketClient> | null>(null);
    const unsubscribeRef = useRef<(() => void)[]>([]);
    // Track active round to filter CardRevealed/PredictionResult by roundId
    const activeRoundIdRef = useRef<`0x${string}` | null>(null);

    useEffect(() => {
        if (!enabled || !playerAddress) return;

        const contractAddress = getContractAddress(chainId);
        const chain = getChainById(chainId);

        console.log(`🔌 Initializing WebSocket for ${chain.name}, player:`, playerAddress);
        console.log(`📝 Contract address: ${contractAddress}`);

        const client = createWebSocketClient(chainId);
        clientRef.current = client;

        const setupSubscriptions = async () => {
            try {
                // RoundStarted (indexed by player)
                const unsubRoundStarted = client.watchContractEvent({
                    address: contractAddress,
                    abi: HILO_GAME_ABI,
                    eventName: 'RoundStarted',
                    args: { player: playerAddress },
                    onLogs: (logs) => {
                        logs.forEach((log) => {
                            try {
                                const args = log.args as {
                                    roundId?: `0x${string}`;
                                    player?: `0x${string}`;
                                    betAmount?: bigint;
                                    initialCardValue?: number;
                                    initialCardSuit?: number;
                                    entropySequenceNumber?: bigint;
                                    timestamp?: bigint;
                                };
                                if (args.roundId) {
                                    const event: RoundStartedEvent = {
                                        roundId: args.roundId,
                                        player: args.player || '0x0',
                                        betAmount: args.betAmount || BigInt(0),
                                        initialCardValue: Number(args.initialCardValue || 0),
                                        initialCardSuit: Number(args.initialCardSuit || 0),
                                        entropySequenceNumber: args.entropySequenceNumber || BigInt(0),
                                        timestamp: args.timestamp || BigInt(0),
                                    };
                                    console.log('📢 RoundStarted event:', event);
                                    activeRoundIdRef.current = event.roundId;
                                    onRoundStarted?.(event);
                                }
                            } catch (err) {
                                console.error('Failed to parse RoundStarted:', err);
                            }
                        });
                    },
                });
                unsubscribeRef.current.push(unsubRoundStarted);

                // EntropyReady
                const unsubEntropyReady = client.watchContractEvent({
                    address: contractAddress,
                    abi: HILO_GAME_ABI,
                    eventName: 'EntropyReady',
                    onLogs: (logs) => {
                        logs.forEach((log) => {
                            try {
                                const args = log.args as {
                                    roundId?: `0x${string}`;
                                    entropySequenceNumber?: bigint;
                                    timestamp?: bigint;
                                };
                                if (args.roundId) {
                                    const event: EntropyReadyEvent = {
                                        roundId: args.roundId,
                                        entropySequenceNumber: args.entropySequenceNumber || BigInt(0),
                                        timestamp: args.timestamp || BigInt(0),
                                    };
                                    console.log('🎲 EntropyReady event:', event);
                                    onEntropyReady?.(event);
                                }
                            } catch (err) {
                                console.error('Failed to parse EntropyReady:', err);
                            }
                        });
                    },
                });
                unsubscribeRef.current.push(unsubEntropyReady);

                // CardRevealed - new card after prediction
                const unsubCardRevealed = client.watchContractEvent({
                    address: contractAddress,
                    abi: HILO_GAME_ABI,
                    eventName: 'CardRevealed',
                    onLogs: (logs) => {
                        logs.forEach((log) => {
                            try {
                                const args = log.args as {
                                    roundId?: `0x${string}`;
                                    roundNumber?: number;
                                    cardValue?: number;
                                    cardSuit?: number;
                                    currentMultiplierBps?: bigint;
                                    timestamp?: bigint;
                                };
                                if (args.roundId) {
                                    // Filter: only process events for our active round
                                    if (activeRoundIdRef.current && args.roundId !== activeRoundIdRef.current) {
                                        console.log('🃏 Skipping CardRevealed for other round:', args.roundId);
                                        return;
                                    }
                                    const event: CardRevealedEvent = {
                                        roundId: args.roundId,
                                        roundNumber: Number(args.roundNumber || 0),
                                        cardValue: Number(args.cardValue || 0),
                                        cardSuit: Number(args.cardSuit || 0),
                                        currentMultiplierBps: args.currentMultiplierBps || BigInt(0),
                                        timestamp: args.timestamp || BigInt(0),
                                    };
                                    console.log('🃏 CardRevealed event:', event);
                                    onCardRevealed?.(event);
                                }
                            } catch (err) {
                                console.error('Failed to parse CardRevealed:', err);
                            }
                        });
                    },
                });
                unsubscribeRef.current.push(unsubCardRevealed);

                // PredictionResult - outcome of prediction
                const unsubPredictionResult = client.watchContractEvent({
                    address: contractAddress,
                    abi: HILO_GAME_ABI,
                    eventName: 'PredictionResult',
                    onLogs: (logs) => {
                        logs.forEach((log) => {
                            try {
                                const args = log.args as {
                                    roundId?: `0x${string}`;
                                    prediction?: number;
                                    won?: boolean;
                                    previousCard?: number;
                                    newCard?: number;
                                    multiplierApplied?: bigint;
                                    newTotalMultiplier?: bigint;
                                    timestamp?: bigint;
                                };
                                if (args.roundId) {
                                    // Filter: only process events for our active round
                                    if (activeRoundIdRef.current && args.roundId !== activeRoundIdRef.current) {
                                        console.log('🎯 Skipping PredictionResult for other round:', args.roundId);
                                        return;
                                    }
                                    const event: PredictionResultEvent = {
                                        roundId: args.roundId,
                                        prediction: Number(args.prediction || 0),
                                        won: args.won || false,
                                        previousCard: Number(args.previousCard || 0),
                                        newCard: Number(args.newCard || 0),
                                        multiplierApplied: args.multiplierApplied || BigInt(0),
                                        newTotalMultiplier: args.newTotalMultiplier || BigInt(0),
                                        timestamp: args.timestamp || BigInt(0),
                                    };
                                    console.log('🎯 PredictionResult event:', event);
                                    onPredictionResult?.(event);
                                }
                            } catch (err) {
                                console.error('Failed to parse PredictionResult:', err);
                            }
                        });
                    },
                });
                unsubscribeRef.current.push(unsubPredictionResult);

                // RoundEnded - game over
                const unsubRoundEnded = client.watchContractEvent({
                    address: contractAddress,
                    abi: HILO_GAME_ABI,
                    eventName: 'RoundEnded',
                    args: { player: playerAddress },
                    onLogs: (logs) => {
                        logs.forEach((log) => {
                            try {
                                const args = log.args as {
                                    roundId?: `0x${string}`;
                                    player?: `0x${string}`;
                                    betAmount?: bigint;
                                    finalRound?: number;
                                    finalMultiplierBps?: bigint;
                                    winAmount?: bigint;
                                    endReason?: string;
                                    timestamp?: bigint;
                                };
                                if (args.roundId) {
                                    const event: RoundEndedEvent = {
                                        roundId: args.roundId,
                                        player: args.player || '0x0',
                                        betAmount: args.betAmount || BigInt(0),
                                        finalRound: Number(args.finalRound || 0),
                                        finalMultiplierBps: args.finalMultiplierBps || BigInt(0),
                                        winAmount: args.winAmount || BigInt(0),
                                        endReason: args.endReason || '',
                                        timestamp: args.timestamp || BigInt(0),
                                    };
                                    console.log('🏁 RoundEnded event:', event);
                                    activeRoundIdRef.current = null;
                                    onRoundEnded?.(event);
                                }
                            } catch (err) {
                                console.error('Failed to parse RoundEnded:', err);
                            }
                        });
                    },
                });
                unsubscribeRef.current.push(unsubRoundEnded);

                console.log(`✅ WebSocket subscriptions established for ${chain.name}`);
            } catch (error) {
                console.error('❌ Failed to setup WebSocket subscriptions:', error);
            }
        };

        setupSubscriptions();

        return () => {
            console.log('🔌 Cleaning up WebSocket subscriptions');
            unsubscribeRef.current.forEach((unsub) => unsub());
            unsubscribeRef.current = [];
            clientRef.current = null;
        };
    }, [
        enabled,
        playerAddress,
        chainId,
        onRoundStarted,
        onEntropyReady,
        onCardRevealed,
        onPredictionResult,
        onRoundEnded,
    ]);

    return {
        isConnected: !!clientRef.current,
    };
}
