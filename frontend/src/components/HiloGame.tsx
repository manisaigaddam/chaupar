'use client';

import { HILO_GAME_ABI, getContractAddress } from '@/lib/contracts';
import { soundManager } from '@/lib/sounds';
import { CardRevealedEvent, PredictionResultEvent, RoundEndedEvent, useContractEvents } from '@/lib/websocket';
import { useChainStore } from '@/stores/chainStore';
import { useGameStore } from '@/stores/gameStore';
import { usePrivy } from '@privy-io/react-auth';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { formatEther, parseEther } from 'viem';
import { useAccount, useBalance, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { ActiveRoundPopup, PopupType } from './ActiveRoundPopup';
import { Card } from './Card';
import { HistoryTab } from './HistoryTab';
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

export function HiloGame() {
  const { login, logout, authenticated, user, ready } = usePrivy();
  const { address, isConnected } = useAccount();
  
  // Get user's preferred chain from store
  const { activeChainId, getNativeCurrency } = useChainStore();
  const contractAddress = getContractAddress(activeChainId);
  const currencySymbol = getNativeCurrency();
  
  const { data: balance, refetch: refetchBalance } = useBalance({ 
    address, 
    chainId: activeChainId 
  });
  
  // Local state
  const [copied, setCopied] = useState(false);
  const [popupType, setPopupType] = useState<PopupType | null>(null);
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
  const { writeContract, data: txHash, isPending, error: writeError, reset: resetWrite } = useWriteContract();
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

  // Read entropy fee from contract
  const { data: entropyFee } = useReadContract({
    address: contractAddress,
    abi: HILO_GAME_ABI,
    functionName: 'getEntropyFee',
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

  // Refetch on tx success and close popups
  useEffect(() => {
    if (isTxSuccess) {
      refetchRoundInfo();
      refetchBalance();
      setLoading(false);
      // Close popups after successful exit transaction
      setShowResumePopup(false);
      setShowExitPopup(false);
      setTimedOut(false);
    }
  }, [isTxSuccess, refetchRoundInfo, refetchBalance, setLoading, setShowResumePopup, setShowExitPopup, setTimedOut]);

  // Track pending prediction result to apply after CardRevealed
  const [pendingResult, setPendingResult] = useState<'win' | 'lose' | null>(null);

  // WebSocket event handlers
  const handleCardRevealed = useCallback((event: CardRevealedEvent) => {
    console.log('🃏 WebSocket CardRevealed:', event);
    const newCard = { value: event.cardValue, suit: event.cardSuit };
    setCurrentCard(newCard);
    
    // Add new card to history
    addCardToHistory({
      card: newCard,
      accumulatedMultiplier: Number(event.currentMultiplierBps),
    });
    
    // Apply pending prediction result to PREVIOUS card (before the new one)
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
    // Store result to apply after CardRevealed adds the new card
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

  const handleRoundEnded = useCallback((event: RoundEndedEvent) => {
    console.log('🏁 WebSocket RoundEnded:', event);
    if (event.endReason === 'cashout') {
      soundManager.chips();
    } else if (event.endReason === 'wrong_prediction') {
      soundManager.lose();
    }
    // Reset game to idle state immediately
    resetGame();
    refetchBalance();
  }, [resetGame, refetchBalance]);

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

  // Quick bet amounts
  const quickBets = ['0.01', '0.05', '0.1', '0.5', '1'];

  // Calculate probabilities for current card
  const calculateProbability = (cardValue: number, isHigher: boolean): number => {
    if (!cardValue || cardValue < 2 || cardValue > 14) return 0;
    
    const higherCards = (14 - cardValue) * 4;
    const lowerCards = (cardValue - 2) * 4;
    const sameCards = 3;
    
    if (isHigher) {
      return ((higherCards + sameCards) / 51) * 100;
    }
    return ((lowerCards + sameCards) / 51) * 100;
  };

  // Parse error message for user-friendly display
  const parseContractError = (error: Error | null): string => {
    if (!error) return '';
    const msg = error.message.toLowerCase();
    if (msg.includes('insufficienttreasury')) return 'Contract treasury is empty. Game cannot start.';
    if (msg.includes('underflow') || msg.includes('overflow')) return 'Transaction failed: Check treasury funds.';
    if (msg.includes('user rejected')) return 'Transaction cancelled by user.';
    if (msg.includes('insufficient funds')) return 'Insufficient balance for bet + fees.';
    return error.message.slice(0, 100);
  };

  // Start game with auto-transaction
  const handleStartGame = async () => {
    if (!address) return;
    
    try {
      resetWrite(); // Clear any previous errors
      setLoading(true);
      setError(null);
      soundManager.click();
      
      // CHECK FOR ACTIVE ROUND FIRST (timeout logic on Start button)
      const { data: freshRoundInfo } = await refetchRoundInfo();
      
      if (freshRoundInfo && Array.isArray(freshRoundInfo)) {
        const hasRound = freshRoundInfo[1] as boolean;
        const timeRemainingValue = Number(freshRoundInfo[9]);
        
        if (hasRound) {
          setLoading(false);
          if (timeRemainingValue === 0) {
            // Round timed out - show exit popup
            setPopupType('timeout_mount');
            setShowExitPopup(true);
          } else {
            // Active round not timed out - show resume/exit choice
            setPopupType('resume_exit');
            setShowResumePopup(true);
          }
          return; // Don't start new game
        }
      }
      
      // No active round - proceed with starting new game
      const betWei = parseEther(betAmount);
      // Use actual entropy fee from contract, fallback to 0.001 MON
      const fee = entropyFee ? BigInt(entropyFee.toString()) : parseEther('0.001');
      const totalPayment = betWei + fee;
      
      console.log('Starting game:', {
        bet: formatEther(betWei),
        fee: formatEther(fee),
        total: formatEther(totalPayment),
        treasuryBalance: treasuryBalance ? formatEther(treasuryBalance as bigint) : 'unknown'
      });
      
      writeContract({
        address: contractAddress,
        abi: HILO_GAME_ABI,
        functionName: 'startGame',
        value: totalPayment,
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game');
      setLoading(false);
    }
  };

  // Make prediction (pure on-chain - direct contract call!)
  const handlePredict = async (isHigher: boolean) => {
    if (!roundId) return;
    
    try {
      setLoading(true);
      soundManager.click();
      
      // Track prediction for history
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
      
      // Track skip for history
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

  // Cash out (pure on-chain!)
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
    // Status should already be ready from updateFromContract
    if (roundInfo && Array.isArray(roundInfo)) {
      const vrfReady = roundInfo[8] as boolean;
      setStatus(vrfReady ? 'ready' : 'starting');
      
      // Initialize history with current card from contract
      // This ensures HistoryTab shows at least the current card when resuming
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

  // Handle exit/cashout from popup - keep popup open during loading
  const handleExitRound = async () => {
    if (!roundId) return;
    
    try {
      setLoading(true);
      
      // Check if this is a timeout popup (use popupType)
      const isTimeoutPopup = popupType === 'timeout_mount' || popupType === 'timeout_operation';
      
      if (isTimeoutPopup) {
        // Call endTimedOutRound for timed out rounds
        writeContract({
          address: contractAddress,
          abi: HILO_GAME_ABI,
          functionName: 'endTimedOutRound',
          args: [roundId],
        });
      } else {
        // Normal cashout
        writeContract({
          address: contractAddress,
          abi: HILO_GAME_ABI,
          functionName: 'cashOut',
          args: [roundId],
        });
      }
      // Don't close popups here - wait for tx success
      
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

  // Main game UI - Black/White Shadcn Style
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg tracking-tight">Chaupar</span>
          <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">Conflux</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Balance + Address */}
          <div className="flex items-center gap-2 bg-zinc-900/80 rounded-lg px-3 py-2 border border-zinc-800">
            <span className="text-zinc-400 text-sm">
              {balance ? parseFloat(formatEther(balance.value)).toFixed(3) : '0'} {currencySymbol}
            </span>
            <div className="w-px h-4 bg-zinc-700" />
            <button
              onClick={handleCopyAddress}
              className="flex items-center gap-1 text-sm text-zinc-500 hover:text-white transition-colors"
            >
              <span>{shortenAddress(address || '')}</span>
              <span className="text-xs">{copied ? '✓' : '📋'}</span>
            </button>
          </div>
          
          {/* X button - exit game if in game, go home if not */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const inActiveGame = ['starting', 'ready', 'predicting', 'won'].includes(status);
              if (inActiveGame && roundId) {
                // In active game - show exit popup
                setPopupType('exit_x_click');
                setShowExitPopup(true);
              } else {
                // Not in active game - go home
                router.push('/');
              }
            }}
            className="text-zinc-500 hover:text-white"
          >
            ✕
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
        
        {/* Multiplier Display */}
        {roundNumber > 0 && (
          <motion.div
            className="text-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <div className="text-zinc-500 text-xs uppercase tracking-wider">Multiplier</div>
            <div className="text-4xl font-bold text-white">
              {formatMultiplier(currentMultiplier)}x
            </div>
            <div className="text-zinc-400 text-sm mt-1">
              ≈ {potentialWin} {currencySymbol}
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
                rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              {roundNumber}
            </motion.div>
          )}
        </div>

        {/* Prediction Buttons - Simplified */}
        {status === 'ready' && currentCard && (
          <div className="flex gap-4">
            <Button
              size="lg"
              variant="outline"
              onClick={() => handlePredict(false)}
              disabled={isPending || isTxLoading || currentCard.value === 2}
              className="px-8 py-6 text-lg border-zinc-700 hover:bg-zinc-800 hover:border-zinc-500"
            >
              {isPending || isTxLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                '↓ Lower'
              )}
            </Button>
            <Button
              size="lg" 
              variant="outline"
              onClick={() => handlePredict(true)}
              disabled={isPending || isTxLoading || currentCard.value === 14}
              className="px-8 py-6 text-lg border-zinc-700 hover:bg-zinc-800 hover:border-zinc-500"
            >
              {isPending || isTxLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                '↑ Higher'
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
              Skip
            </motion.button>
            
            <motion.button
              className="px-6 py-3 rounded-lg bg-white text-black font-bold 
                hover:bg-zinc-200 transition-all text-sm"
              onClick={handleCashOut}
              disabled={isPending || isTxLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cash Out {potentialWin} {currencySymbol}
            </motion.button>
          </div>
        )}

        {/* Waiting for VRF */}
        {status === 'starting' && (
          <motion.div
            className="text-center"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <div className="text-zinc-500 text-sm">Generating card...</div>
            <div className="w-6 h-6 border-2 border-white border-t-transparent 
              rounded-full animate-spin mx-auto mt-3" />
          </motion.div>
        )}

        {/* Bet Selection */}
        {status === 'idle' && (
          <div className="w-full max-w-xs space-y-4">
            {/* Bet input */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <label className="text-zinc-500 text-xs uppercase tracking-wider mb-2 block">
                Bet Amount ({currencySymbol})
              </label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="w-full bg-transparent border-none text-2xl font-bold text-white 
                  text-center focus:outline-none"
                step="0.01"
                min="0.001"
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
              disabled={isPending || isTxLoading || !betAmount}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isPending || isTxLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent 
                    rounded-full animate-spin" />
                  Starting...
                </span>
              ) : (
                `Start • ${betAmount} ${currencySymbol}`
              )}
            </motion.button>
            
            {/* Low balance warning */}
            {balance && parseFloat(formatEther(balance.value)) < 0.01 && (
              <div className="text-center">
                <p className="text-zinc-500 text-xs">Need CFX? Copy address above ↑</p>
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

      {/* Footer - History Tab (only during active game, not idle) */}
      {cardHistory.length > 0 && status !== 'idle' && (
        <footer className="border-t border-zinc-800 p-4 z-10">
          <HistoryTab entries={cardHistory} />
        </footer>
      )}

      {/* Active Round Popup */}
      <ActiveRoundPopup
        isOpen={showResumePopup || showExitPopup}
        popupType={popupType || 'resume_exit'}
        potentialWin={potentialWin}
        roundNumber={roundNumber}
        currentMultiplier={currentMultiplier}
        onResume={handleResumeRound}
        onExit={handleExitRound}
        onCancel={() => {
          setShowExitPopup(false);
          setPopupType(null);
        }}
        isExiting={isLoading}
      />
    </div>
  );
}
