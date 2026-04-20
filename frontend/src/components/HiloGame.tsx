'use client';

import { ERC20_ABI, HILO_GAME_ABI, getContractAddress, getUsdtAddress } from '@/lib/contracts';
import { soundManager } from '@/lib/sounds';
import { CardRevealedEvent, PredictionResultEvent, RoundEndedEvent, useContractEvents } from '@/lib/websocket';
import { useChainStore } from '@/stores/chainStore';
import { formatTokenAmount, parseTokenAmount, useGameStore } from '@/stores/gameStore';
import { usePrivy } from '@privy-io/react-auth';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { formatEther, maxUint256 } from 'viem';
import { useAccount, useBalance, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { ActiveRoundPopup, PopupType } from './ActiveRoundPopup';
import { Card } from './Card';
import { GameOverModal } from './GameOverModal';
import { HistoryTab } from './HistoryTab';
import { HousePoolTab } from './HousePoolTab';
import { Button } from './ui/button';

// Copy to clipboard helper
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

// Shorten address
const shortenAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

type ActiveTab = 'game' | 'pool';

interface GameOverData {
  endReason: 'cashout' | 'wrong_prediction' | 'timeout';
  betAmount: bigint;
  winAmount: bigint;
  multiplier: number;
  rounds: number;
}

export function HiloGame() {
  const { login, logout, authenticated, user, ready } = usePrivy();
  const { address, isConnected } = useAccount();

  // Get user's preferred chain from store
  const { activeChainId, getNativeCurrency } = useChainStore();
  const contractAddress = getContractAddress(activeChainId);
  const usdtAddress = getUsdtAddress(activeChainId);
  const currencySymbol = getNativeCurrency();

  // Native CFX balance (for gas)
  const { data: cfxBalance, refetch: refetchCfxBalance } = useBalance({
    address,
    chainId: activeChainId
  });

  // USDT0 balance
  const { data: usdtBalanceRaw, refetch: refetchUsdtBalance } = useReadContract({
    address: usdtAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: activeChainId,
  });

  // USDT0 allowance
  const { data: allowanceRaw, refetch: refetchAllowance } = useReadContract({
    address: usdtAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, contractAddress] : undefined,
    chainId: activeChainId,
  });

  const usdtBalance = usdtBalanceRaw ? formatTokenAmount(usdtBalanceRaw as bigint) : '0';
  const currentAllowance = allowanceRaw ? BigInt(allowanceRaw.toString()) : 0n;

  // Local state
  const [copied, setCopied] = useState(false);
  const [popupType, setPopupType] = useState<PopupType | null>(null);
  const [hasCheckedActiveRound, setHasCheckedActiveRound] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('game');
  const [isApproving, setIsApproving] = useState(false);
  const router = useRouter();

  // Game store
  const {
    status,
    roundId,
    currentCard,
    previousCard,
    currentMultiplier,
    potentialWin,
    roundNumber,
    timeRemaining,
    higherMultiplier,
    lowerMultiplier,
    isLoading,
    error,
    showResult,
    cardHistory,
    isTimedOut,
    showResumePopup,
    showExitPopup,
    betAmount,
    setLoading,
    setError,
    setShowResult,
    setTimedOut,
    setShowResumePopup,
    setShowExitPopup,
    setCurrentCard,
    setRoundNumber,
    setMultiplier,
    setPotentialWin,
    setStatus,
    resetGame,
    updateFromContract,
    addCardToHistory,
    clearCardHistory,
    setLastPrediction,
    updateLastHistoryEntry,
    initializeHistoryFromContract,
    setBetAmount,
  } = useGameStore();

  // Contract write hooks
  const { writeContractAsync, writeContract, data: txHash, isPending, error: writeError, reset: resetWrite } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Read player round info
  const { data: roundInfo, refetch: refetchRoundInfo } = useReadContract({
    address: contractAddress,
    abi: HILO_GAME_ABI,
    functionName: 'getPlayerRoundInfo',
    args: address ? [address] : undefined,
    chainId: activeChainId,
  });

  // Read treasury balance
  const { data: treasuryBalance } = useReadContract({
    address: contractAddress,
    abi: HILO_GAME_ABI,
    functionName: 'treasuryBalance',
    chainId: activeChainId,
  });

  // Update game state from contract
  useEffect(() => {
    if (roundInfo && Array.isArray(roundInfo)) {
      updateFromContract({
        roundId: roundInfo[0] as `0x${string}`,
        hasRound: roundInfo[1] as boolean,
        betAmount: roundInfo[2] as bigint,
        currentCardValue: roundInfo[3] as number,
        currentCardSuit: roundInfo[4] as number,
        roundNumber: roundInfo[5] as number,
        currentMultiplierBps: roundInfo[6] as bigint,
        currentWinAmount: roundInfo[7] as bigint,
        vrfReady: roundInfo[8] as boolean,
        timeRemaining: roundInfo[9] as bigint,
        higherMultiplier: roundInfo[10] as bigint,
        lowerMultiplier: roundInfo[11] as bigint,
      });
    }
  }, [roundInfo, updateFromContract]);

  // ══════════════════════════════════════════════════════════
  // FIX #1: Check for active round on MOUNT (not just on Start click)
  // ══════════════════════════════════════════════════════════
  useEffect(() => {
    if (isConnected && roundInfo && Array.isArray(roundInfo) && !hasCheckedActiveRound) {
      const hasRound = roundInfo[1] as boolean;
      const timeRemainingValue = Number(roundInfo[9]);

      // @ts-ignore - experimental lint rule
      setHasCheckedActiveRound(true);

      if (hasRound) {
        if (timeRemainingValue === 0) {
          setPopupType('timeout_mount');
          setShowExitPopup(true);
        } else {
          setPopupType('resume_exit');
          setShowResumePopup(true);
        }
      }
    }
  }, [isConnected, roundInfo, hasCheckedActiveRound, setShowExitPopup, setShowResumePopup]);

  // Refetch on tx success and close popups
  useEffect(() => {
    if (isTxSuccess) {
      refetchRoundInfo();
      refetchCfxBalance();
      refetchUsdtBalance();
      refetchAllowance();
      setLoading(false);
      // @ts-ignore - experimental lint rule
      setIsApproving(false);
      // Close popups after successful exit transaction
      setShowResumePopup(false);
      setShowExitPopup(false);
      setTimedOut(false);
    }
  }, [isTxSuccess, refetchRoundInfo, refetchCfxBalance, refetchUsdtBalance, refetchAllowance, setLoading, setShowResumePopup, setShowExitPopup, setTimedOut]);

  // Track pending prediction result to apply after CardRevealed
  const [pendingResult, setPendingResult] = useState<'win' | 'lose' | null>(null);

  // WebSocket event handlers
  const handleCardRevealed = useCallback((event: CardRevealedEvent) => {
    console.log('🃏 WebSocket CardRevealed:', event);
    const newCard = { value: event.cardValue, suit: event.cardSuit };
    setCurrentCard(newCard);

    addCardToHistory({
      card: newCard,
      accumulatedMultiplier: Number(event.currentMultiplierBps),
    });

    if (pendingResult) {
      updateLastHistoryEntry(pendingResult);
      setPendingResult(null);
    }

    setRoundNumber(event.roundNumber);
    setMultiplier(Number(event.currentMultiplierBps));
    setStatus('ready');
    soundManager.cardFlip();
    refetchRoundInfo();
  }, [setCurrentCard, addCardToHistory, pendingResult, updateLastHistoryEntry, setRoundNumber, setMultiplier, setStatus, refetchRoundInfo]);

  const handlePredictionResult = useCallback((event: PredictionResultEvent) => {
    console.log('🎯 WebSocket PredictionResult:', event);
    if (event.won) {
      setPendingResult('win');
      setShowResult('win');
      soundManager.win();
    } else {
      setPendingResult('lose');
      setShowResult('lose');
      soundManager.lose();
    }
    setTimeout(() => setShowResult(null), 1500);
  }, [setShowResult]);

  // Game over modal state
  const [gameOverData, setGameOverData] = useState<GameOverData | null>(null);

  const handleRoundEnded = useCallback((event: RoundEndedEvent) => {
    console.log('🏁 WebSocket RoundEnded:', event);
    if (event.endReason === 'cashout') {
      soundManager.cashout();
    } else if (event.endReason === 'wrong_prediction') {
      soundManager.lose();
    }

    // Show game over modal instead of instant reset
    const reason = event.endReason === 'cashout' ? 'cashout'
      : event.endReason === 'timeout' ? 'timeout'
      : 'wrong_prediction';

    setGameOverData({
      endReason: reason,
      betAmount: event.betAmount,
      winAmount: event.winAmount,
      multiplier: Number(event.finalMultiplierBps),
      rounds: event.finalRound,
    });

    refetchCfxBalance();
    refetchUsdtBalance();
  }, [refetchCfxBalance, refetchUsdtBalance]);

  const handleGameOverDismiss = useCallback(() => {
    setGameOverData(null);
    resetGame();
  }, [resetGame]);

  // Subscribe to WebSocket events
  useContractEvents({
    playerAddress: address,
    chainId: activeChainId,
    enabled: isConnected && authenticated,
    onCardRevealed: handleCardRevealed,
    onPredictionResult: handlePredictionResult,
    onRoundEnded: handleRoundEnded,
  });

  // Watch for timeout errors from contract calls
  useEffect(() => {
    if (writeError) {
      const msg = writeError.message.toLowerCase();
      if (msg.includes('timeout') || msg.includes('roundtimedout') || msg.includes('timed out')) {
        console.log('⏰ Timeout error detected:', msg);
        // @ts-ignore - experimental lint rule
        setPopupType('timeout_operation');
        setShowExitPopup(true);
        resetWrite();
      }
    }
  }, [writeError, setShowExitPopup, resetWrite]);

  // Handle copy address
  const handleCopyAddress = async () => {
    if (address) {
      const success = await copyToClipboard(address);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  // Quick bet amounts (USDT0)
  const quickBets = ['1', '2', '5', '10'];

  // Parse error message for user-friendly display
  const parseContractError = (error: Error | null): string => {
    if (!error) return '';
    const msg = error.message.toLowerCase();
    if (msg.includes('user rejected') || msg.includes('user denied')) return 'Transaction cancelled by user.';
    if (msg.includes('invalidbetamount')) return 'Bet must be between 1–10 USDT0.';
    if (msg.includes('playerhasactiveround')) return 'You already have an active game. Resume or exit first.';
    if (msg.includes('insufficienttreasury')) return 'House pool treasury is low. Try a smaller bet.';
    if (msg.includes('exposurelimitexceeded')) return 'House pool exposure limit reached. Try later.';
    if (msg.includes('roundtimedout') || msg.includes('timed out')) return 'Your round has timed out. Collect your funds.';
    if (msg.includes('invalidprediction')) return 'Can\'t predict higher on Ace or lower on 2.';
    if (msg.includes('maxroundsreached')) return 'Maximum 52 rounds reached. Cash out!';
    if (msg.includes('insufficientshares')) return 'Not enough LP shares to withdraw.';
    if (msg.includes('insufficientliquidity')) return 'Pool liquidity locked in active games.';
    if (msg.includes('insufficient funds') || msg.includes('exceeds balance')) return 'Not enough USDT0 for this bet.';
    if (msg.includes('erc20') || msg.includes('transfer')) return 'USDT0 transfer failed. Check balance & approval.';
    if (msg.includes('underflow') || msg.includes('overflow')) return 'Transaction math error. Try a different amount.';
    if (msg.includes('execution reverted')) return 'Transaction reverted. Please try again.';
    return error.message.slice(0, 120);
  };

  // ══════════════════════════════════════════════════════════
  // Start game: Approve USDT0 (if needed) → startGame(amount)
  // ══════════════════════════════════════════════════════════
  const handleStartGame = async () => {
    if (!address) return;

    try {
      resetWrite();
      setLoading(true);
      setError(null);
      soundManager.click();

      // CHECK FOR ACTIVE ROUND FIRST
      const { data: freshRoundInfo } = await refetchRoundInfo();

      if (freshRoundInfo && Array.isArray(freshRoundInfo)) {
        const hasRound = freshRoundInfo[1] as boolean;
        const timeRemainingValue = Number(freshRoundInfo[9]);

        if (hasRound) {
          setLoading(false);
          if (timeRemainingValue === 0) {
            setPopupType('timeout_mount');
            setShowExitPopup(true);
          } else {
            setPopupType('resume_exit');
            setShowResumePopup(true);
          }
          return;
        }
      }

      const betRaw = parseTokenAmount(betAmount);

      // Step 1: Check & do infinite approval if needed (Privy auto-signs)
      if (currentAllowance < betRaw) {
        setIsApproving(true);
        try {
          await writeContractAsync({
            address: usdtAddress,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [contractAddress, maxUint256],
          });
          // Wait a beat for allowance to update
          await refetchAllowance();
          setIsApproving(false);
        } catch (err) {
          setIsApproving(false);
          setError('USDT0 approval failed');
          setLoading(false);
          return;
        }
      }

      // Step 2: Start game with USDT0 bet
      console.log('Starting game:', {
        bet: betAmount + ' USDT0',
        betRaw: betRaw.toString(),
        treasury: treasuryBalance ? formatTokenAmount(treasuryBalance as bigint) : 'unknown'
      });

      writeContract({
        address: contractAddress,
        abi: HILO_GAME_ABI,
        functionName: 'startGame',
        args: [betRaw],
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
      setLoading(false);
    }
  };

  // Make prediction (pure on-chain)
  const handlePredict = async (isHigher: boolean) => {
    if (!roundId) return;

    try {
      setLoading(true);
      soundManager.click();

      setLastPrediction(isHigher ? 'higher' : 'lower');

      writeContract({
        address: contractAddress,
        abi: HILO_GAME_ABI,
        functionName: isHigher ? 'predictHigherOrSame' : 'predictLowerOrSame',
        args: [roundId],
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed');
      setLoading(false);
    }
  };

  // Skip card
  const handleSkip = async () => {
    if (!roundId) return;

    try {
      setLoading(true);
      soundManager.click();

      setLastPrediction('skip');
      updateLastHistoryEntry('skip');

      writeContract({
        address: contractAddress,
        abi: HILO_GAME_ABI,
        functionName: 'skipCard',
        args: [roundId],
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Skip failed');
      setLoading(false);
    }
  };

  // Cash out
  const handleCashOut = async () => {
    if (!roundId) return;

    try {
      setLoading(true);
      soundManager.chips();

      writeContract({
        address: contractAddress,
        abi: HILO_GAME_ABI,
        functionName: 'cashOut',
        args: [roundId],
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cashout failed');
      setLoading(false);
    }
  };

  // Handle resume active round from popup
  const handleResumeRound = () => {
    setShowResumePopup(false);
    if (roundInfo && Array.isArray(roundInfo)) {
      const vrfReady = roundInfo[8] as boolean;
      setStatus(vrfReady ? 'ready' : 'starting');

      const cardValue = roundInfo[3] as number;
      const cardSuit = roundInfo[4] as number;
      const multiplierBps = Number(roundInfo[6] as bigint);

      if (cardValue > 0) {
        initializeHistoryFromContract(
          { value: cardValue, suit: cardSuit },
          multiplierBps
        );
      }
    }
  };

  // Handle exit/cashout from popup
  const handleExitRound = async () => {
    if (!roundId) return;

    try {
      setLoading(true);

      const isTimeoutPopup = popupType === 'timeout_mount' || popupType === 'timeout_operation';

      if (isTimeoutPopup) {
        writeContract({
          address: contractAddress,
          abi: HILO_GAME_ABI,
          functionName: 'endTimedOutRound',
          args: [roundId],
        });
      } else {
        writeContract({
          address: contractAddress,
          abi: HILO_GAME_ABI,
          functionName: 'cashOut',
          args: [roundId],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Exit failed');
      setLoading(false);
    }
  };

  // Format multiplier
  const formatMultiplier = (bps: number) => (bps / 10000).toFixed(2);

  // Redirect to home if not ready or not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  // Loading state
  if (!ready || !authenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Main game UI
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border-b border-zinc-800 gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight" style={{ fontFamily: 'Cormorant Garamond, serif' }}>चौपड़</span>
            <span className="font-bold text-lg tracking-tight">Chaupar</span>
            <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">Conflux</span>
          </div>
          {/* X button visible on mobile next to brand */}
          <div className="sm:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const inActiveGame = ['starting', 'ready', 'predicting', 'won'].includes(status);
                if (inActiveGame && roundId) {
                  setPopupType('exit_x_click');
                  setShowExitPopup(true);
                } else {
                  router.push('/');
                }
              }}
              className="text-zinc-500 hover:text-white -mr-2"
            >
              ✕
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {/* Dual Balance — stacks on mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-zinc-900/80 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 border border-zinc-800 flex-shrink-0">
            <span className="text-amber-400 text-xs sm:text-sm font-medium whitespace-nowrap">
              {usdtBalance} <span className="text-[10px] text-amber-400/70">USDT0</span>
            </span>
            <div className="w-px h-3 sm:h-4 bg-zinc-700" />
            <span className="text-zinc-500 text-[10px] sm:text-xs whitespace-nowrap">
              {cfxBalance ? parseFloat(formatEther(cfxBalance.value)).toFixed(2) : '0'} CFX
            </span>
            <div className="w-px h-3 sm:h-4 bg-zinc-700" />
            <button
              onClick={handleCopyAddress}
              className="flex items-center gap-1 text-zinc-500 hover:text-white transition-colors flex-shrink-0"
            >
              <span className="text-[10px] sm:text-xs whitespace-nowrap">{shortenAddress(address || '')}</span>
              <span className="text-[10px] sm:text-xs">{copied ? '✓' : '📋'}</span>
            </button>
          </div>

          {/* X button — hidden on mobile (shown in brand row) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const inActiveGame = ['starting', 'ready', 'predicting', 'won'].includes(status);
              if (inActiveGame && roundId) {
                setPopupType('exit_x_click');
                setShowExitPopup(true);
              } else {
                router.push('/');
              }
            }}
            className="text-zinc-500 hover:text-white hidden sm:inline-flex"
          >
            ✕
          </Button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('game')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'game'
              ? 'text-white border-b-2 border-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          🎴 खेल / Game
        </button>
        <button
          onClick={() => setActiveTab('pool')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'pool'
              ? 'text-white border-b-2 border-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          🏦 House Pool
        </button>
      </div>

      {/* Pool Tab */}
      {activeTab === 'pool' && (
        <div className="flex-1 overflow-y-auto">
          <HousePoolTab />
        </div>
      )}

      {/* Game Tab */}
      {activeTab === 'game' && (
        <>
          <main className="flex-1 flex flex-col items-center justify-center p-4 gap-6">

            {/* Multiplier Display */}
            {roundNumber > 0 && (
              <motion.div
                className="text-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <div className="text-zinc-500 text-xs uppercase tracking-wider" style={{ fontFamily: 'Cormorant Garamond, serif' }}>गुणा / Multiplier</div>
                <div className="text-4xl font-bold text-white">
                  {formatMultiplier(currentMultiplier)}x
                </div>
                <div className="text-amber-400 text-sm mt-1 font-medium">
                  ≈ {potentialWin} USDT0
                </div>
              </motion.div>
            )}

            {/* Card Display */}
            <div className="relative">
              <Card
                card={currentCard}
                isNew={roundNumber > 0}
                size="lg"
              />

              {/* Round badge */}
              {roundNumber > 0 && (
                <motion.div
                  className="absolute -top-2 -right-2 bg-white text-black
                    rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  title="Haath (Hand)"
                >
                  {roundNumber}
                </motion.div>
              )}
            </div>

            {/* Win/Lose Flash */}
            <AnimatePresence>
              {showResult && (
                <motion.div
                  className={`text-2xl font-bold ${showResult === 'win' ? 'text-green-400' : 'text-red-400'}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  {showResult === 'win' ? '✨ जीत! Win!' : '💔 हार! Loss!'}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Prediction Buttons */}
            {status === 'ready' && currentCard && (
              <div className="flex gap-3 sm:gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handlePredict(false)}
                  disabled={isPending || isTxLoading || currentCard.value === 2}
                  className="px-4 sm:px-8 py-5 sm:py-6 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-500 flex flex-col items-center gap-0.5"
                >
                  {isPending || isTxLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="text-base sm:text-lg">↓ नीचा Lower</span>
                      {currentCard.value > 2 && lowerMultiplier > 0 && (
                        <span className="text-[10px] sm:text-xs text-zinc-500">{formatMultiplier(lowerMultiplier)}x</span>
                      )}
                    </>
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handlePredict(true)}
                  disabled={isPending || isTxLoading || currentCard.value === 14}
                  className="px-4 sm:px-8 py-5 sm:py-6 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-500 flex flex-col items-center gap-0.5"
                >
                  {isPending || isTxLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="text-base sm:text-lg">↑ ऊँचा Higher</span>
                      {currentCard.value < 14 && higherMultiplier > 0 && (
                        <span className="text-[10px] sm:text-xs text-zinc-500">{formatMultiplier(higherMultiplier)}x</span>
                      )}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            {status === 'ready' && (
              <div className="flex gap-3">
                <motion.button
                  className="px-6 py-3 rounded-lg border border-zinc-700 text-zinc-400
                    hover:border-zinc-500 hover:text-white transition-all text-sm"
                  onClick={handleSkip}
                  disabled={isPending || isTxLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  छोड़ो / Skip
                </motion.button>

                <motion.button
                  className="px-6 py-3 rounded-lg bg-white text-black font-bold
                    hover:bg-zinc-200 transition-all text-sm"
                  onClick={handleCashOut}
                  disabled={isPending || isTxLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  घर ले जाओ / Cash Out {potentialWin} USDT0
                </motion.button>
              </div>
            )}

            {/* Waiting for card */}
            {status === 'starting' && (
              <motion.div
                className="text-center"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <div className="text-zinc-500 text-sm">पत्ता आ रहा है / Generating card...</div>
                <div className="w-6 h-6 border-2 border-white border-t-transparent
                  rounded-full animate-spin mx-auto mt-3" />
              </motion.div>
            )}

            {/* Bet Selection */}
            {status === 'idle' && (
              <div className="w-full max-w-xs space-y-4">
                {/* Bet input */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <label className="text-zinc-500 text-xs uppercase tracking-wider mb-2 block" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    दाव रखो / Bet Amount (USDT0)
                  </label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = parseFloat(val);
                      if (val === '' || val === '0') { setBetAmount(val); return; }
                      if (isNaN(num)) return;
                      if (num > 10) { setBetAmount('10'); return; }
                      setBetAmount(val);
                    }}
                    onBlur={() => {
                      const num = parseFloat(betAmount);
                      if (isNaN(num) || num < 1) setBetAmount('1');
                      else if (num > 10) setBetAmount('10');
                    }}
                    className="w-full bg-transparent border-none text-2xl font-bold text-white
                      text-center focus:outline-none"
                    step="1"
                    min="1"
                    max="10"
                  />

                  {/* Quick bet buttons */}
                  <div className="flex gap-2 mt-4">
                    {quickBets.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setBetAmount(amount)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all
                          ${betAmount === amount
                            ? 'bg-white text-black'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                          }`}
                      >
                        {amount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start button */}
                <motion.button
                  className="w-full bg-white text-black font-bold py-4 px-8 rounded-xl
                    hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  onClick={handleStartGame}
                  disabled={isPending || isTxLoading || isApproving || !betAmount}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isApproving ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-black border-t-transparent
                        rounded-full animate-spin" />
                      Approving USDT0...
                    </span>
                  ) : isPending || isTxLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-black border-t-transparent
                        rounded-full animate-spin" />
                      शुरू हो रहा / Starting...
                    </span>
                  ) : (
                    `शुरू करो / Start • ${betAmount} USDT0`
                  )}
                </motion.button>

                {/* Balance warnings */}
                {cfxBalance && parseFloat(formatEther(cfxBalance.value)) < 0.01 && (
                  <div className="text-center">
                    <p className="text-zinc-500 text-xs">Need CFX for gas? Copy address above ↑</p>
                    <p className="text-zinc-600 text-xs">
                      <a href="https://efaucet.confluxnetwork.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-400">
                        Get from Conflux faucet
                      </a>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Error display */}
            <AnimatePresence>
              {(error || writeError) && (
                <motion.div
                  className="bg-red-500/10 border border-red-500/20 text-red-400
                    px-4 py-3 rounded-lg text-sm max-w-sm text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="font-medium mb-1">⚠️ Error</div>
                  <div className="text-xs opacity-80">
                    {error || (writeError ? parseContractError(writeError) : '')}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Footer - History Tab */}
          {cardHistory.length > 0 && status !== 'idle' && (
            <footer className="border-t border-zinc-800 p-4 z-10">
              <HistoryTab entries={cardHistory} />
            </footer>
          )}
        </>
      )}

      {/* Active Round Popup */}
      <ActiveRoundPopup
        isOpen={showResumePopup || showExitPopup}
        popupType={popupType || 'resume_exit'}
        potentialWin={potentialWin}
        roundNumber={roundNumber}
        currentMultiplier={currentMultiplier}
        currencySymbol="USDT0"
        onResume={handleResumeRound}
        onExit={handleExitRound}
        onCancel={() => {
          setShowExitPopup(false);
          setPopupType(null);
        }}
        isExiting={isLoading}
      />

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={!!gameOverData}
        endReason={gameOverData?.endReason || null}
        betAmount={gameOverData?.betAmount || BigInt(0)}
        winAmount={gameOverData?.winAmount || BigInt(0)}
        multiplier={gameOverData?.multiplier || 10000}
        rounds={gameOverData?.rounds || 0}
        onNewGame={handleGameOverDismiss}
      />
    </div>
  );
}
