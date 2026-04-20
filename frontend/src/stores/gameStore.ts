import { TOKEN_DECIMALS } from '@/lib/contracts';
import { create } from 'zustand';

// Card types
export type Suit = 'khadga' | 'kalasha' | 'chakra' | 'padma';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
    value: number; // 2-14 (Ace high)
    suit: number;  // 0-3
}

// Enhanced card history entry for HistoryTab
export interface CardHistoryEntry {
    card: Card;
    prediction?: 'higher' | 'lower' | 'skip'; // What prediction was made AFTER this card
    result?: 'win' | 'lose' | 'skip';         // Result of that prediction
    accumulatedMultiplier: number;             // BPS at this card point (real from contract)
}

// Game state
export type GameStatus =
    | 'idle'           // No game in progress
    | 'starting'       // Waiting for VRF
    | 'ready'          // VRF ready, waiting for prediction
    | 'predicting'     // Transaction pending
    | 'won'            // Last prediction won
    | 'lost'           // Game over - wrong prediction
    | 'cashedOut';     // Game over - player cashed out

// Ganjifa suit names — mapped from contract index
export const GANJIFA_SUITS: Record<number, { name: string; hindi: string; icon: string }> = {
    0: { name: 'Khadga', hindi: 'खड्ग', icon: 'sword' },
    1: { name: 'Kalasha', hindi: 'कलश', icon: 'pot' },
    2: { name: 'Chakra', hindi: 'चक्र', icon: 'wheel' },
    3: { name: 'Padma', hindi: 'पद्म', icon: 'lotus' },
};

// Ganjifa face card names
export const GANJIFA_FACES: Record<number, { name: string; hindi: string }> = {
    11: { name: 'Sipahi', hindi: 'सिपाही' },
    12: { name: 'Rani', hindi: 'रानी' },
    13: { name: 'Raja', hindi: 'राजा' },
    14: { name: 'Devata', hindi: 'देवता' },
};

// Devanagari numerals
export const DEVANAGARI_NUMERALS: Record<number, string> = {
    2: '२', 3: '३', 4: '४', 5: '५', 6: '६', 7: '७', 8: '८', 9: '९', 10: '१०',
};

// Helper to convert card value (2-14) to rank
export function valueToRank(value: number): Rank {
    if (value >= 2 && value <= 10) return value.toString() as Rank;
    if (value === 11) return 'J';
    if (value === 12) return 'Q';
    if (value === 13) return 'K';
    if (value === 14) return 'A';
    return '2';
}

// Helper to get display name for card value (Ganjifa style)
export function valueToDisplayName(value: number): { primary: string; secondary: string } {
    if (value >= 2 && value <= 10) {
        return { primary: value.toString(), secondary: DEVANAGARI_NUMERALS[value] || '' };
    }
    const face = GANJIFA_FACES[value];
    if (face) {
        return { primary: face.name, secondary: face.hindi };
    }
    return { primary: value.toString(), secondary: '' };
}

// Helper to convert suit index to suit name
export function indexToSuit(index: number): Suit {
    const suits: Suit[] = ['khadga', 'kalasha', 'chakra', 'padma'];
    return suits[index] || 'khadga';
}

// Format USDT0 amount from raw units (6 decimals)
export function formatTokenAmount(raw: bigint | number, decimals = TOKEN_DECIMALS): string {
    const value = typeof raw === 'number' ? raw : Number(raw);
    return (value / Math.pow(10, decimals)).toFixed(decimals === 6 ? 2 : 4);
}

// Parse USDT0 amount to raw units
export function parseTokenAmount(amount: string, decimals = TOKEN_DECIMALS): bigint {
    const parsed = parseFloat(amount);
    return BigInt(Math.floor(parsed * Math.pow(10, decimals)));
}

export interface GameState {
    // Game data
    status: GameStatus;
    roundId: `0x${string}` | null;
    currentCard: Card | null;
    previousCard: Card | null;
    betAmount: string;
    currentMultiplier: number;  // In basis points (10000 = 1x)
    potentialWin: string;
    roundNumber: number;
    timeRemaining: number;

    // Available multipliers for current card
    higherMultiplier: number;
    lowerMultiplier: number;

    // UI state
    isLoading: boolean;
    error: string | null;
    showResult: 'win' | 'lose' | null;

    // History of this session (with real multipliers for HistoryTab)
    cardHistory: CardHistoryEntry[];
    lastPrediction: 'higher' | 'lower' | 'skip' | null; // Track last prediction for history

    // Actions
    setStatus: (status: GameStatus) => void;
    setRoundId: (roundId: `0x${string}` | null) => void;
    setCurrentCard: (card: Card | null) => void;
    setPreviousCard: (card: Card | null) => void;
    setBetAmount: (amount: string) => void;
    setMultiplier: (multiplier: number) => void;
    setPotentialWin: (amount: string) => void;
    setRoundNumber: (round: number) => void;
    setTimeRemaining: (time: number) => void;
    setMultipliers: (higher: number, lower: number) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setShowResult: (result: 'win' | 'lose' | null) => void;
    addCardToHistory: (entry: CardHistoryEntry) => void;
    clearCardHistory: () => void;
    setLastPrediction: (prediction: 'higher' | 'lower' | 'skip' | null) => void;
    updateLastHistoryEntry: (result: 'win' | 'lose' | 'skip') => void;
    initializeHistoryFromContract: (card: Card, multiplierBps: number) => void;
    resetGame: () => void;

    // Update from contract data
    updateFromContract: (data: {
        roundId: `0x${string}`;
        hasRound: boolean;
        betAmount: bigint;
        currentCardValue: number;
        currentCardSuit: number;
        roundNumber: number;
        currentMultiplierBps: bigint;
        currentWinAmount: bigint;
        vrfReady: boolean;
        timeRemaining: bigint;
        higherMultiplier: bigint;
        lowerMultiplier: bigint;
    }) => void;

    // Timeout-related state
    isTimedOut: boolean;
    showResumePopup: boolean;
    showExitPopup: boolean;
    setTimedOut: (timedOut: boolean) => void;
    setShowResumePopup: (show: boolean) => void;
    setShowExitPopup: (show: boolean) => void;
}

// Create the store
export const useGameStore = create<GameState>((set, _get) => ({
    // Initial state — USDT0 defaults
    status: 'idle',
    roundId: null,
    currentCard: null,
    previousCard: null,
    betAmount: '1',      // 1 USDT0 default
    currentMultiplier: 10000, // 1x
    potentialWin: '0',
    roundNumber: 0,
    timeRemaining: 0,
    higherMultiplier: 0,
    lowerMultiplier: 0,
    isLoading: false,
    error: null,
    showResult: null,
    cardHistory: [],
    lastPrediction: null,

    // Timeout state
    isTimedOut: false,
    showResumePopup: false,
    showExitPopup: false,

    // Actions
    setStatus: (status) => set({ status }),
    setRoundId: (roundId) => set({ roundId }),
    setCurrentCard: (card) => set({ currentCard: card }),
    setPreviousCard: (card) => set({ previousCard: card }),
    setBetAmount: (amount) => set({ betAmount: amount }),
    setMultiplier: (multiplier) => set({ currentMultiplier: multiplier }),
    setPotentialWin: (amount) => set({ potentialWin: amount }),
    setRoundNumber: (round) => set({ roundNumber: round }),
    setTimeRemaining: (time) => set({ timeRemaining: time }),
    setMultipliers: (higher, lower) => set({ higherMultiplier: higher, lowerMultiplier: lower }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    setShowResult: (result) => set({ showResult: result }),
    addCardToHistory: (entry) => set((state) => ({
        cardHistory: [...state.cardHistory, entry]
    })),
    clearCardHistory: () => set({ cardHistory: [], lastPrediction: null }),
    setLastPrediction: (prediction) => set({ lastPrediction: prediction }),

    // Update the PREVIOUS card's history entry with prediction and result
    updateLastHistoryEntry: (result) => set((state) => {
        if (state.cardHistory.length < 2) {
            if (state.cardHistory.length === 1) {
                const updated = [...state.cardHistory];
                updated[0] = {
                    ...updated[0],
                    prediction: state.lastPrediction || undefined,
                    result,
                };
                return { cardHistory: updated, lastPrediction: null };
            }
            return state;
        }

        const updated = [...state.cardHistory];
        const predictionCardIndex = updated.length - 2;
        updated[predictionCardIndex] = {
            ...updated[predictionCardIndex],
            prediction: state.lastPrediction || undefined,
            result,
        };
        return { cardHistory: updated, lastPrediction: null };
    }),

    // Initialize history when resuming an existing round
    initializeHistoryFromContract: (card, multiplierBps) => set((state) => {
        if (state.cardHistory.length > 0 || card.value === 0) return state;
        return {
            cardHistory: [{
                card,
                accumulatedMultiplier: multiplierBps,
            }]
        };
    }),

    // Timeout actions
    setTimedOut: (timedOut) => set({ isTimedOut: timedOut }),
    setShowResumePopup: (show) => set({ showResumePopup: show }),
    setShowExitPopup: (show) => set({ showExitPopup: show }),

    resetGame: () => set({
        status: 'idle',
        roundId: null,
        currentCard: null,
        previousCard: null,
        currentMultiplier: 10000,
        potentialWin: '0',
        roundNumber: 0,
        timeRemaining: 0,
        higherMultiplier: 0,
        lowerMultiplier: 0,
        isLoading: false,
        error: null,
        showResult: null,
        cardHistory: [],
        lastPrediction: null,
        isTimedOut: false,
        showResumePopup: false,
        showExitPopup: false,
    }),

    updateFromContract: (data) => {
        if (!data.hasRound) {
            set({
                status: 'idle',
                roundId: null,
                currentCard: null,
                roundNumber: 0,
                currentMultiplier: 10000,
            });
            return;
        }

        const currentCard: Card = {
            value: data.currentCardValue,
            suit: data.currentCardSuit,
        };

        set({
            roundId: data.roundId,
            currentCard,
            roundNumber: data.roundNumber,
            currentMultiplier: Number(data.currentMultiplierBps),
            potentialWin: formatTokenAmount(data.currentWinAmount),
            timeRemaining: Number(data.timeRemaining),
            higherMultiplier: Number(data.higherMultiplier),
            lowerMultiplier: Number(data.lowerMultiplier),
            status: data.vrfReady ? 'ready' : 'starting',
        });
    },
}));
