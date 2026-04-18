import { create } from 'zustand';

// Card types
export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
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

// Helper to convert card value (2-14) to rank
export function valueToRank(value: number): Rank {
    if (value >= 2 && value <= 10) return value.toString() as Rank;
    if (value === 11) return 'J';
    if (value === 12) return 'Q';
    if (value === 13) return 'K';
    if (value === 14) return 'A';
    return '2';
}

// Helper to convert suit index to suit name
export function indexToSuit(index: number): Suit {
    const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
    return suits[index] || 'spades';
}

// Create the store
export const useGameStore = create<GameState>((set, get) => ({
    // Initial state
    status: 'idle',
    roundId: null,
    currentCard: null,
    previousCard: null,
    betAmount: '0.01',
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
    // This is called AFTER CardRevealed adds the new card, so we update index length-2
    updateLastHistoryEntry: (result) => set((state) => {
        // Need at least 2 cards: the one we predicted FROM, and the new one
        if (state.cardHistory.length < 2) {
            // If only 1 card (first card), just update it
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
        // Update the SECOND-TO-LAST entry (the card we predicted FROM)
        const predictionCardIndex = updated.length - 2;
        updated[predictionCardIndex] = {
            ...updated[predictionCardIndex],
            prediction: state.lastPrediction || undefined,
            result,
        };
        return { cardHistory: updated, lastPrediction: null };
    }),

    // Initialize history when resuming an existing round
    // Only adds if history is empty (first load/resume)
    initializeHistoryFromContract: (card, multiplierBps) => set((state) => {
        // Only initialize if history is empty and we have a valid card
        if (state.cardHistory.length > 0 || card.value === 0) return state;
        return {
            cardHistory: [{
                card,
                accumulatedMultiplier: multiplierBps,
                // No prediction/result for the start card on resume
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
        const formatEther = (wei: bigint) => {
            return (Number(wei) / 1e18).toFixed(4);
        };

        if (!data.hasRound) {
            // No active round
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
            potentialWin: formatEther(data.currentWinAmount),
            timeRemaining: Number(data.timeRemaining),
            higherMultiplier: Number(data.higherMultiplier),
            lowerMultiplier: Number(data.lowerMultiplier),
            status: data.vrfReady ? 'ready' : 'starting',
        });
    },
}));
