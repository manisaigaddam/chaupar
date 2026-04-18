/**
 * Hybrid Hilo Game Session Management
 *
 * This module handles:
 * - Session storage for active games
 * - Deterministic card generation from VRF seed using HMAC-SHA256
 * - Multiplier calculations (96% RTP)
 * - Game state management and resumption
 */

import { createHmac } from 'crypto';
import { encodePacked, keccak256, toBytes } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// ═══════════════════════════════════════════════════════════════════════════
//                              TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Card {
    value: number; // 2-14 (2-10, J=11, Q=12, K=13, A=14)
    suit: number; // 0=Spades, 1=Hearts, 2=Diamonds, 3=Clubs
}

export interface GameMove {
    round: number;
    card: Card;
    prediction: 'higher' | 'lower' | 'skip' | null; // null for initial card
    won: boolean;
    multiplierApplied: number; // In BPS (10000 = 1x)
}

export interface GameSession {
    gameId: string;
    vrfSeed: string;
    player: string;
    betAmount: string; // In wei as string
    nonce: number;
    moves: GameMove[];
    totalMultiplierBps: number; // Current total multiplier
    lost: boolean;
    createdAt: number;
}

// ═══════════════════════════════════════════════════════════════════════════
//                        CONSTANTS (96% RTP)
// ═══════════════════════════════════════════════════════════════════════════

export const BPS = 10000; // Basis points (10000 = 1.00x)
export const RTP_BPS = 9600; // 96% RTP

/**
 * Higher or Same multipliers by card value
 * Formula: (96 * 51) / (higherCards + sameRankCards)
 * where higherCards = (14 - cardValue) * 4, sameRankCards = 3
 */
export const HIGHER_MULTIPLIERS: Record<number, number> = {
    2: 9600, // 0.96x - only same wins
    3: 10426, // 1.04x
    4: 11384, // 1.14x
    5: 12554, // 1.26x
    6: 14004, // 1.40x
    7: 15812, // 1.58x
    8: 18133, // 1.81x
    9: 21287, // 2.13x
    10: 25785, // 2.58x
    11: 32727, // 3.27x (Jack)
    12: 44509, // 4.45x (Queen)
    13: 69942, // 6.99x (King)
    14: 0, // Cannot go higher than Ace
};

/**
 * Lower or Same multipliers by card value
 * Formula: (96 * 51) / (lowerCards + sameRankCards)
 * where lowerCards = (cardValue - 2) * 4, sameRankCards = 3
 */
export const LOWER_MULTIPLIERS: Record<number, number> = {
    2: 0, // Cannot go lower than 2
    3: 69942, // 6.99x
    4: 44509, // 4.45x
    5: 32727, // 3.27x
    6: 25785, // 2.58x
    7: 21287, // 2.13x
    8: 18133, // 1.81x
    9: 15812, // 1.58x
    10: 14004, // 1.40x
    11: 12554, // 1.26x (Jack)
    12: 11384, // 1.14x (Queen)
    13: 10426, // 1.04x (King)
    14: 9600, // 0.96x - only same wins (Ace)
};

// ═══════════════════════════════════════════════════════════════════════════
//                        SESSION STORAGE
// ═══════════════════════════════════════════════════════════════════════════

// In-memory session storage (use Redis in production)
const sessions = new Map<string, GameSession>();

export function getSession(gameId: string): GameSession | undefined {
    return sessions.get(gameId);
}

export function setSession(gameId: string, session: GameSession): void {
    sessions.set(gameId, session);
}

export function deleteSession(gameId: string): void {
    sessions.delete(gameId);
}

export function hasSession(gameId: string): boolean {
    return sessions.has(gameId);
}

// ═══════════════════════════════════════════════════════════════════════════
//                        CARD GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a card deterministically from VRF seed and nonce
 * Uses HMAC-SHA256 for cryptographic security
 *
 * @param vrfSeed - The VRF seed from Pyth Entropy (hex string with 0x prefix)
 * @param nonce - The round number (0-indexed)
 * @returns Card with value (2-14) and suit (0-3)
 */
export function generateCard(vrfSeed: string, nonce: number): Card {
    // Remove 0x prefix if present
    const seedBuffer = Buffer.from(vrfSeed.replace('0x', ''), 'hex');

    // Create HMAC-SHA256 with VRF seed as key
    const hmac = createHmac('sha256', seedBuffer);
    hmac.update(`hilo:card:${nonce}`);
    const hash = hmac.digest('hex');

    // Use first 8 hex chars (32 bits) for uniform distribution
    const cardIndex = parseInt(hash.slice(0, 8), 16) % 52;

    // Map to card value and suit
    // Values: 2-14 (2,3,4,5,6,7,8,9,10,J,Q,K,A)
    // Suits: 0=Spades, 1=Hearts, 2=Diamonds, 3=Clubs
    return {
        value: (cardIndex % 13) + 2,
        suit: Math.floor(cardIndex / 13),
    };
}

/**
 * Regenerate all cards for a session (for resumption)
 */
export function regenerateCards(vrfSeed: string, count: number): Card[] {
    const cards: Card[] = [];
    for (let i = 0; i < count; i++) {
        cards.push(generateCard(vrfSeed, i));
    }
    return cards;
}

// ═══════════════════════════════════════════════════════════════════════════
//                        GAME LOGIC
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if prediction is correct
 */
export function checkPrediction(
    prevCard: Card,
    newCard: Card,
    prediction: 'higher' | 'lower'
): boolean {
    if (prediction === 'higher') {
        return newCard.value >= prevCard.value;
    } else {
        return newCard.value <= prevCard.value;
    }
}

/**
 * Get multiplier for a prediction on a given card
 */
export function getMultiplier(
    cardValue: number,
    prediction: 'higher' | 'lower'
): number {
    if (prediction === 'higher') {
        return HIGHER_MULTIPLIERS[cardValue] || 0;
    } else {
        return LOWER_MULTIPLIERS[cardValue] || 0;
    }
}

/**
 * Apply multiplier to current total
 */
export function applyMultiplier(
    currentMultiplierBps: number,
    cardMultiplierBps: number
): number {
    return Math.floor((currentMultiplierBps * cardMultiplierBps) / BPS);
}

/**
 * Calculate payout from bet and multiplier
 */
export function calculatePayout(
    betAmountWei: string,
    multiplierBps: number
): bigint {
    const bet = BigInt(betAmountWei);
    return (bet * BigInt(multiplierBps)) / BigInt(BPS);
}

// ═══════════════════════════════════════════════════════════════════════════
//                        SIGNATURE GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get admin wallet for signing
 */
function getAdminWallet() {
    const privateKey = process.env.GAME_SERVER_PRIVATE_KEY as `0x${string}`;
    if (!privateKey) {
        throw new Error('GAME_SERVER_PRIVATE_KEY not configured');
    }
    return privateKeyToAccount(privateKey);
}

/**
 * Create game state hash for contract verification
 */
export function createGameStateHash(session: GameSession): `0x${string}` {
    const cardValues = session.moves.map((m) => m.card.value);
    return keccak256(
        encodePacked(
            ['bytes32', 'uint8[]'],
            [session.vrfSeed as `0x${string}`, cardValues]
        )
    );
}

/**
 * Sign endGame parameters for contract
 */
export async function signEndGame(
    gameId: string,
    payoutAmount: bigint,
    gameStateHash: `0x${string}`,
    isWin: boolean,
    deadline: bigint
): Promise<`0x${string}`> {
    const adminWallet = getAdminWallet();

    const messageHash = keccak256(
        encodePacked(
            ['string', 'uint256', 'uint256', 'bytes32', 'bool', 'uint256'],
            [
                'HiloHybrid:endGame',
                BigInt(gameId),
                payoutAmount,
                gameStateHash,
                isWin,
                deadline,
            ]
        )
    );

    const signature = await adminWallet.signMessage({
        message: { raw: toBytes(messageHash) },
    });

    return signature;
}

/**
 * Sign updateProgress parameters for contract
 */
export async function signUpdateProgress(
    gameId: string,
    round: number,
    multiplierBps: number,
    deadline: bigint
): Promise<`0x${string}`> {
    const adminWallet = getAdminWallet();

    const messageHash = keccak256(
        encodePacked(
            ['string', 'uint256', 'uint8', 'uint256', 'uint256'],
            [
                'HiloHybrid:updateProgress',
                BigInt(gameId),
                round,
                BigInt(multiplierBps),
                deadline,
            ]
        )
    );

    const signature = await adminWallet.signMessage({
        message: { raw: toBytes(messageHash) },
    });

    return signature;
}

// ═══════════════════════════════════════════════════════════════════════════
//                        CARD DISPLAY HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export const SUIT_NAMES = ['♠', '♥', '♦', '♣'] as const;
export const VALUE_NAMES: Record<number, string> = {
    2: '2',
    3: '3',
    4: '4',
    5: '5',
    6: '6',
    7: '7',
    8: '8',
    9: '9',
    10: '10',
    11: 'J',
    12: 'Q',
    13: 'K',
    14: 'A',
};

export function cardToString(card: Card): string {
    return `${VALUE_NAMES[card.value]}${SUIT_NAMES[card.suit]}`;
}
