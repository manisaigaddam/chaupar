'use client';

import { ERC20_ABI, HILO_GAME_ABI, getContractAddress, getUsdtAddress } from '@/lib/contracts';
import { useChainStore } from '@/stores/chainStore';
import { formatTokenAmount, parseTokenAmount } from '@/stores/gameStore';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { maxUint256 } from 'viem';
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

export function HousePoolTab() {
  const { address } = useAccount();
  const { activeChainId } = useChainStore();
  const contractAddress = getContractAddress(activeChainId);
  const usdtAddress = getUsdtAddress(activeChainId);

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawShares, setWithdrawShares] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  // Contract write
  const { writeContractAsync, writeContract, data: txHash, isPending, error: writeError, reset: resetWrite } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Read LP info
  const { data: lpInfoRaw, refetch: refetchLPInfo } = useReadContract({
    address: contractAddress,
    abi: HILO_GAME_ABI,
    functionName: 'getLPInfo',
    args: address ? [address] : undefined,
    chainId: activeChainId,
  });

  // Read USDT0 balance
  const { data: usdtBalanceRaw, refetch: refetchUsdtBalance } = useReadContract({
    address: usdtAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: activeChainId,
  });

  // Read allowance
  const { data: allowanceRaw, refetch: refetchAllowance } = useReadContract({
    address: usdtAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, contractAddress] : undefined,
    chainId: activeChainId,
  });

  // Parse LP info
  const lpInfo = lpInfoRaw && Array.isArray(lpInfoRaw) ? {
    shares: lpInfoRaw[0] as bigint,
    totalShares: lpInfoRaw[1] as bigint,
    valueInUSDT: lpInfoRaw[2] as bigint,
    tvl: lpInfoRaw[3] as bigint,
    availableLiquidity: lpInfoRaw[4] as bigint,
    gamesPlayed: lpInfoRaw[5] as bigint,
    wagered: lpInfoRaw[6] as bigint,
    houseEdgeCollected: lpInfoRaw[7] as bigint,
  } : null;

  const usdtBalance = usdtBalanceRaw ? formatTokenAmount(usdtBalanceRaw as bigint) : '0';
  const currentAllowance = allowanceRaw ? BigInt(allowanceRaw.toString()) : 0n;

  // Refetch on tx success
  if (isTxSuccess) {
    refetchLPInfo();
    refetchUsdtBalance();
    refetchAllowance();
  }

  // Calculate estimated withdraw amount
  const estimatedWithdraw = (() => {
    if (!withdrawShares || !lpInfo || lpInfo.totalShares === 0n) return '0';
    try {
      const shares = BigInt(withdrawShares);
      const amount = (shares * lpInfo.tvl) / lpInfo.totalShares;
      return formatTokenAmount(amount);
    } catch {
      return '0';
    }
  })();

  // Deposit USDT0
  const handleDeposit = async () => {
    if (!depositAmount || !address) return;
    resetWrite();

    try {
      const raw = parseTokenAmount(depositAmount);

      // Approve if needed
      if (currentAllowance < raw) {
        setIsApproving(true);
        await writeContractAsync({
          address: usdtAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [contractAddress, maxUint256],
        });
        await refetchAllowance();
        setIsApproving(false);
      }

      // Deposit
      writeContract({
        address: contractAddress,
        abi: HILO_GAME_ABI,
        functionName: 'depositLiquidity',
        args: [raw],
      });
    } catch (err) {
      setIsApproving(false);
      console.error('Deposit failed:', err);
    }
  };

  // Withdraw by shares
  const handleWithdraw = async () => {
    if (!withdrawShares || !address) return;
    resetWrite();

    try {
      writeContract({
        address: contractAddress,
        abi: HILO_GAME_ABI,
        functionName: 'withdrawLiquidity',
        args: [BigInt(withdrawShares)],
      });
    } catch (err) {
      console.error('Withdraw failed:', err);
    }
  };

  const poolOwnership = lpInfo && lpInfo.totalShares > 0n
    ? ((Number(lpInfo.shares) / Number(lpInfo.totalShares)) * 100).toFixed(2)
    : '0';

  // Auto-dismiss errors
  useEffect(() => {
    if (writeError) {
      const timer = setTimeout(() => {
        resetWrite();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [writeError, resetWrite]);

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto w-full">

      {/* Pool Stats */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          🏦 House Pool — कोष
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
            <div className="text-zinc-500 text-xs uppercase tracking-wider">TVL</div>
            <div className="text-white font-bold text-lg mt-1">
              {lpInfo ? formatTokenAmount(lpInfo.tvl) : '—'}
            </div>
            <div className="text-amber-400/70 text-xs">USDT0</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
            <div className="text-zinc-500 text-xs uppercase tracking-wider">Games</div>
            <div className="text-white font-bold text-lg mt-1">
              {lpInfo ? Number(lpInfo.gamesPlayed).toLocaleString() : '—'}
            </div>
            <div className="text-zinc-500 text-xs">Played</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
            <div className="text-zinc-500 text-xs uppercase tracking-wider">Volume</div>
            <div className="text-white font-bold text-lg mt-1">
              {lpInfo ? formatTokenAmount(lpInfo.wagered) : '—'}
            </div>
            <div className="text-amber-400/70 text-xs">USDT0 wagered</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
            <div className="text-zinc-500 text-xs uppercase tracking-wider">House Edge</div>
            <div className="text-green-400 font-bold text-lg mt-1">
              {lpInfo ? formatTokenAmount(lpInfo.houseEdgeCollected) : '—'}
            </div>
            <div className="text-green-400/70 text-xs">USDT0 collected</div>
          </div>
        </div>
      </div>

      {/* Your Position */}
      {lpInfo && lpInfo.shares > 0n && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="text-zinc-400 text-xs uppercase tracking-wider">Your Position</div>
          <div className="flex justify-between">
            <span className="text-zinc-500 text-sm">LP Shares</span>
            <span className="text-white font-medium">{Number(lpInfo.shares).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 text-sm">Value</span>
            <span className="text-amber-400 font-bold">{formatTokenAmount(lpInfo.valueInUSDT)} USDT0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 text-sm">Pool Ownership</span>
            <span className="text-white font-medium">{poolOwnership}%</span>
          </div>
        </div>
      )}

      {/* Deposit */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-zinc-400 text-xs uppercase tracking-wider">Deposit USDT0</span>
          <span className="text-zinc-500 text-xs">Balance: {usdtBalance}</span>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Amount"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500"
            min="1"
          />
          <button
            onClick={() => setDepositAmount(usdtBalance)}
            className="text-xs text-zinc-400 hover:text-white px-2 transition-colors"
          >
            MAX
          </button>
        </div>
        <motion.button
          className="w-full bg-white text-black font-bold py-2.5 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 text-sm"
          onClick={handleDeposit}
          disabled={isPending || isTxLoading || isApproving || !depositAmount}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {isApproving ? 'Approving...' : isPending || isTxLoading ? 'Depositing...' : 'Deposit to Pool'}
        </motion.button>
      </div>

      {/* Withdraw */}
      {lpInfo && lpInfo.shares > 0n && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 text-xs uppercase tracking-wider">Withdraw</span>
            <span className="text-zinc-500 text-xs">Shares: {Number(lpInfo.shares).toLocaleString()}</span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={withdrawShares}
              onChange={(e) => setWithdrawShares(e.target.value)}
              placeholder="Shares to burn"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500"
              min="1"
            />
            <button
              onClick={() => setWithdrawShares(lpInfo.shares.toString())}
              className="text-xs text-zinc-400 hover:text-white px-2 transition-colors"
            >
              MAX
            </button>
          </div>
          {withdrawShares && (
            <div className="text-zinc-400 text-xs">
              ≈ {estimatedWithdraw} USDT0 estimated
            </div>
          )}
          <motion.button
            className="w-full border border-zinc-600 text-zinc-300 font-bold py-2.5 rounded-lg hover:border-zinc-400 hover:text-white transition-colors disabled:opacity-50 text-sm"
            onClick={handleWithdraw}
            disabled={isPending || isTxLoading || !withdrawShares}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {isPending || isTxLoading ? 'Withdrawing...' : 'Withdraw from Pool'}
          </motion.button>
        </div>
      )}

      {/* Risk disclaimer */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-3">
        <p className="text-zinc-600 text-xs leading-relaxed">
          ⚠️ By depositing, you back the house bankroll. LP value increases when players lose (house edge ~4%) and decreases when players win big. This is not risk-free — you can lose principal if player winnings exceed the edge in a period.
        </p>
      </div>

      {/* Error Toast Notification */}
      <AnimatePresence>
        {writeError && (
          <motion.div
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] bg-zinc-950/95 backdrop-blur-md border border-red-900/50 shadow-[0_0_30px_rgba(220,38,38,0.15)] text-red-200 px-5 py-4 rounded-xl text-sm max-w-[90vw] md:max-w-md w-full flex items-start gap-3"
            initial={{ opacity: 0, y: -20, scale: 0.95, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: -20, scale: 0.95, x: '-50%' }}
          >
            <div className="text-red-500 text-lg mt-0.5">⚠️</div>
            <div className="flex-1 flex flex-col pt-0.5">
              <div className="font-bold text-red-400 tracking-wide text-xs uppercase" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                त्रुटि / Error
              </div>
              <div className="text-sm opacity-90 leading-snug mt-1">
                {writeError.message.toLowerCase().includes('user rejected') 
                  ? 'Transaction cancelled by user.' 
                  : writeError.message.toLowerCase().includes('insufficientliquidity')
                  ? 'Pool liquidity locked in active games.'
                  : writeError.message.toLowerCase().includes('insufficient funds')
                  ? 'Not enough USDT0 balance.'
                  : writeError.message.slice(0, 120)}
              </div>
            </div>
            <button 
              onClick={() => resetWrite()} 
              className="text-zinc-500 hover:text-white p-1"
            >✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
