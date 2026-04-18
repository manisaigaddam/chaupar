// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ChauparGame
 * @dev On-chain HiLo card game on Conflux eSpace
 * 
 * Pure on-chain gameplay: every bet, prediction, and payout is a blockchain transaction.
 * 96% RTP with fixed compound multipliers.
 * Block-based randomness (suitable for testnet; upgrade to Witnet VRF for production).
 */
contract ChauparGame is ReentrancyGuard {
    
    uint256 public constant MIN_BET = 0.001 ether;
    uint256 public constant MAX_BET = 10 ether;
    uint256 public constant MAX_WIN = 1000 ether;
    uint256 public constant TIMEOUT_DURATION = 10 minutes;
    uint8 public constant MAX_ROUNDS = 52;
    uint8 public constant CARD_MIN = 2;
    uint8 public constant CARD_MAX = 14;
    uint256 public constant BPS = 10000;
    
    uint256[15] public higherOrSameMultipliers;
    uint256[15] public lowerOrSameMultipliers;
    
    enum Prediction { NONE, HIGHER_OR_SAME, LOWER_OR_SAME, SKIP }
    
    struct GameRound {
        address player;
        uint256 betAmount;
        uint8 currentCardValue;
        uint8 currentCardSuit;
        uint8 roundNumber;
        uint256 currentMultiplierBps;
        bytes32 seedHash;
        uint256 lastActivity;
        bool isActive;
    }
    
    mapping(bytes32 => GameRound) public rounds;
    mapping(address => bool) public hasActiveRound;
    mapping(address => bytes32) public playerActiveRound;
    
    uint256 private nonce;
    
    uint256 public treasuryBalance;
    uint256 public escrowBalance;
    uint256 public exposureLimit;
    uint256 public currentExposure;
    
    address public owner;
    bool public paused;
    
    event RoundStarted(bytes32 indexed roundId, address indexed player, uint256 betAmount, uint8 initialCardValue, uint8 initialCardSuit, uint64 entropySequenceNumber, uint256 timestamp);
    event EntropyReady(bytes32 indexed roundId, uint64 indexed entropySequenceNumber, uint256 timestamp);
    event CardRevealed(bytes32 indexed roundId, uint8 roundNumber, uint8 cardValue, uint8 cardSuit, uint256 currentMultiplierBps, uint256 timestamp);
    event PredictionResult(bytes32 indexed roundId, Prediction prediction, bool won, uint8 previousCard, uint8 newCard, uint256 multiplierApplied, uint256 newTotalMultiplier, uint256 timestamp);
    event RoundEnded(bytes32 indexed roundId, address indexed player, uint256 betAmount, uint8 finalRound, uint256 finalMultiplierBps, uint256 winAmount, string endReason, uint256 timestamp);
    event TreasuryUpdated(uint256 newBalance);
    
    error InvalidBetAmount();
    error PlayerHasActiveRound();
    error RoundNotFound();
    error NotRoundOwner();
    error RoundTimedOut();
    error InsufficientTreasury();
    error ExposureLimitExceeded();
    error NotOwner();
    error ContractPaused();
    error InvalidPrediction();
    error MaxRoundsReached();
    error NotTimedOut();
    
    constructor() {
        owner = msg.sender;
        
        higherOrSameMultipliers[2] = 9600;
        higherOrSameMultipliers[3] = 10426;
        higherOrSameMultipliers[4] = 11384;
        higherOrSameMultipliers[5] = 12554;
        higherOrSameMultipliers[6] = 14004;
        higherOrSameMultipliers[7] = 15812;
        higherOrSameMultipliers[8] = 18133;
        higherOrSameMultipliers[9] = 21287;
        higherOrSameMultipliers[10] = 25785;
        higherOrSameMultipliers[11] = 32727;
        higherOrSameMultipliers[12] = 44509;
        higherOrSameMultipliers[13] = 69942;
        higherOrSameMultipliers[14] = 0;
        
        lowerOrSameMultipliers[2] = 0;
        lowerOrSameMultipliers[3] = 69942;
        lowerOrSameMultipliers[4] = 44509;
        lowerOrSameMultipliers[5] = 32727;
        lowerOrSameMultipliers[6] = 25785;
        lowerOrSameMultipliers[7] = 21287;
        lowerOrSameMultipliers[8] = 18133;
        lowerOrSameMultipliers[9] = 15812;
        lowerOrSameMultipliers[10] = 14004;
        lowerOrSameMultipliers[11] = 12554;
        lowerOrSameMultipliers[12] = 11384;
        lowerOrSameMultipliers[13] = 10426;
        lowerOrSameMultipliers[14] = 9600;
        
        exposureLimit = 100 ether;
    }
    
    modifier onlyOwner() { if (msg.sender != owner) revert NotOwner(); _; }
    modifier whenNotPaused() { if (paused) revert ContractPaused(); _; }
    modifier onlyActiveRound(bytes32 roundId) { if (!rounds[roundId].isActive) revert RoundNotFound(); _; }
    modifier onlyRoundOwner(bytes32 roundId) { if (rounds[roundId].player != msg.sender) revert NotRoundOwner(); _; }
    modifier oneRoundOnly() { if (hasActiveRound[msg.sender]) revert PlayerHasActiveRound(); _; }
    
    function startGame() external payable nonReentrant whenNotPaused oneRoundOnly {
        if (msg.value < MIN_BET || msg.value > MAX_BET) revert InvalidBetAmount();
        
        uint256 maxWin = msg.value * 100;
        uint256 worstCaseNet = maxWin > msg.value ? maxWin - msg.value : 0;
        if (treasuryBalance < worstCaseNet) revert InsufficientTreasury();
        if (currentExposure + worstCaseNet > exposureLimit) revert ExposureLimitExceeded();
        
        bytes32 roundId = keccak256(abi.encodePacked(msg.sender, block.timestamp, block.number, msg.value, nonce++));
        
        bytes32 seedHash = keccak256(abi.encodePacked(
            blockhash(block.number - 1),
            msg.sender,
            block.timestamp,
            nonce
        ));
        
        (uint8 cardValue, uint8 cardSuit) = _generateCard(seedHash, roundId, 1);
        
        rounds[roundId] = GameRound({
            player: msg.sender,
            betAmount: msg.value,
            currentCardValue: cardValue,
            currentCardSuit: cardSuit,
            roundNumber: 1,
            currentMultiplierBps: BPS,
            seedHash: seedHash,
            lastActivity: block.timestamp,
            isActive: true
        });
        
        hasActiveRound[msg.sender] = true;
        playerActiveRound[msg.sender] = roundId;
        escrowBalance += msg.value;
        currentExposure += worstCaseNet;
        
        emit RoundStarted(roundId, msg.sender, msg.value, cardValue, cardSuit, 0, block.timestamp);
        emit EntropyReady(roundId, 0, block.timestamp);
        emit CardRevealed(roundId, 1, cardValue, cardSuit, BPS, block.timestamp);
    }
    
    function predictHigherOrSame(bytes32 roundId) external nonReentrant onlyActiveRound(roundId) onlyRoundOwner(roundId) {
        _makePrediction(roundId, Prediction.HIGHER_OR_SAME);
    }
    
    function predictLowerOrSame(bytes32 roundId) external nonReentrant onlyActiveRound(roundId) onlyRoundOwner(roundId) {
        _makePrediction(roundId, Prediction.LOWER_OR_SAME);
    }
    
    function skipCard(bytes32 roundId) external nonReentrant onlyActiveRound(roundId) onlyRoundOwner(roundId) {
        GameRound storage round = rounds[roundId];
        if (block.timestamp > round.lastActivity + TIMEOUT_DURATION) revert RoundTimedOut();
        if (round.roundNumber >= MAX_ROUNDS) revert MaxRoundsReached();
        
        round.lastActivity = block.timestamp;
        round.roundNumber++;
        
        (uint8 newCard, uint8 newSuit) = _generateCard(round.seedHash, roundId, round.roundNumber);
        uint8 prevCard = round.currentCardValue;
        round.currentCardValue = newCard;
        round.currentCardSuit = newSuit;
        
        emit PredictionResult(roundId, Prediction.SKIP, true, prevCard, newCard, BPS, round.currentMultiplierBps, block.timestamp);
        emit CardRevealed(roundId, round.roundNumber, newCard, newSuit, round.currentMultiplierBps, block.timestamp);
    }
    
    function cashOut(bytes32 roundId) external nonReentrant onlyActiveRound(roundId) onlyRoundOwner(roundId) {
        GameRound storage round = rounds[roundId];
        if (block.timestamp > round.lastActivity + TIMEOUT_DURATION) revert RoundTimedOut();
        _endRound(roundId, "cashout");
    }
    
    function endTimedOutRound(bytes32 roundId) external nonReentrant onlyActiveRound(roundId) {
        GameRound storage round = rounds[roundId];
        if (block.timestamp <= round.lastActivity + TIMEOUT_DURATION) revert NotTimedOut();
        _endRound(roundId, "timeout");
    }
    
    function _makePrediction(bytes32 roundId, Prediction prediction) internal {
        GameRound storage round = rounds[roundId];
        if (block.timestamp > round.lastActivity + TIMEOUT_DURATION) revert RoundTimedOut();
        if (round.roundNumber >= MAX_ROUNDS) revert MaxRoundsReached();
        
        uint8 currentCard = round.currentCardValue;
        uint256 multiplier;
        
        if (prediction == Prediction.HIGHER_OR_SAME) {
            if (currentCard == CARD_MAX) revert InvalidPrediction();
            multiplier = higherOrSameMultipliers[currentCard];
        } else {
            if (currentCard == CARD_MIN) revert InvalidPrediction();
            multiplier = lowerOrSameMultipliers[currentCard];
        }
        
        round.lastActivity = block.timestamp;
        round.roundNumber++;
        
        (uint8 newCard, uint8 newSuit) = _generateCard(round.seedHash, roundId, round.roundNumber);
        
        bool won = prediction == Prediction.HIGHER_OR_SAME ? (newCard >= currentCard) : (newCard <= currentCard);
        
        if (won) {
            round.currentMultiplierBps = (round.currentMultiplierBps * multiplier) / BPS;
            round.currentCardValue = newCard;
            round.currentCardSuit = newSuit;
            emit PredictionResult(roundId, prediction, true, currentCard, newCard, multiplier, round.currentMultiplierBps, block.timestamp);
            emit CardRevealed(roundId, round.roundNumber, newCard, newSuit, round.currentMultiplierBps, block.timestamp);
        } else {
            emit PredictionResult(roundId, prediction, false, currentCard, newCard, multiplier, 0, block.timestamp);
            _endRound(roundId, "wrong_prediction");
        }
    }
    
    function _endRound(bytes32 roundId, string memory endReason) internal {
        GameRound storage round = rounds[roundId];
        
        bool isWin = keccak256(bytes(endReason)) != keccak256(bytes("wrong_prediction"));
        uint256 winAmount = isWin && round.roundNumber > 0 ? (round.betAmount * round.currentMultiplierBps) / BPS : 0;
        if (winAmount > MAX_WIN) winAmount = MAX_WIN;
        
        escrowBalance -= round.betAmount;
        uint256 worstCaseNet = round.betAmount * 100;
        worstCaseNet = worstCaseNet > round.betAmount ? worstCaseNet - round.betAmount : 0;
        if (currentExposure >= worstCaseNet) currentExposure -= worstCaseNet;
        
        if (winAmount > 0) {
            if (winAmount > round.betAmount && treasuryBalance >= winAmount - round.betAmount) {
                treasuryBalance -= (winAmount - round.betAmount);
            }
            (bool success, ) = round.player.call{value: winAmount}("");
            require(success, "Transfer failed");
        } else {
            treasuryBalance += round.betAmount;
        }
        
        round.isActive = false;
        hasActiveRound[round.player] = false;
        
        emit RoundEnded(roundId, round.player, round.betAmount, round.roundNumber, round.currentMultiplierBps, winAmount, endReason, block.timestamp);
        emit TreasuryUpdated(treasuryBalance);
    }
    
    function _generateCard(bytes32 seedHash, bytes32 roundId, uint8 roundNumber) internal view returns (uint8 value, uint8 suit) {
        bytes32 cardSeed = keccak256(abi.encodePacked(
            seedHash,
            roundId,
            roundNumber,
            blockhash(block.number - 1),
            msg.sender
        ));
        value = uint8((uint256(cardSeed) % 13) + CARD_MIN);
        suit = uint8((uint256(keccak256(abi.encode(cardSeed, "suit"))) % 4));
    }
    
    function getPlayerRoundInfo(address player) external view returns (
        bytes32 roundId, bool hasRound, uint256 betAmount, uint8 currentCardValue, uint8 currentCardSuit,
        uint8 roundNumber, uint256 currentMultiplierBps, uint256 currentWinAmount, bool vrfReady,
        uint256 timeRemaining, uint256 higherMultiplier, uint256 lowerMultiplier
    ) {
        roundId = playerActiveRound[player];
        hasRound = hasActiveRound[player];
        if (hasRound) {
            GameRound storage round = rounds[roundId];
            betAmount = round.betAmount;
            currentCardValue = round.currentCardValue;
            currentCardSuit = round.currentCardSuit;
            roundNumber = round.roundNumber;
            currentMultiplierBps = round.currentMultiplierBps;
            currentWinAmount = (betAmount * currentMultiplierBps) / BPS;
            vrfReady = true;
            uint256 deadline = round.lastActivity + TIMEOUT_DURATION;
            timeRemaining = block.timestamp < deadline ? deadline - block.timestamp : 0;
            if (currentCardValue >= CARD_MIN && currentCardValue <= CARD_MAX) {
                higherMultiplier = higherOrSameMultipliers[currentCardValue];
                lowerMultiplier = lowerOrSameMultipliers[currentCardValue];
            }
        }
    }
    
    function getMultiplier(uint8 cardValue, bool isHigher) external view returns (uint256) {
        if (cardValue < CARD_MIN || cardValue > CARD_MAX) return 0;
        return isHigher ? higherOrSameMultipliers[cardValue] : lowerOrSameMultipliers[cardValue];
    }
    
    function getEntropyFee() external pure returns (uint256) {
        return 0;
    }
    
    function fundTreasury() external payable onlyOwner { treasuryBalance += msg.value; emit TreasuryUpdated(treasuryBalance); }
    function withdrawTreasury(uint256 amount) external onlyOwner { require(amount <= treasuryBalance); treasuryBalance -= amount; payable(owner).transfer(amount); }
    function setExposureLimit(uint256 limit) external onlyOwner { exposureLimit = limit; }
    function setPaused(bool _paused) external onlyOwner { paused = _paused; }
    function transferOwnership(address newOwner) external onlyOwner { owner = newOwner; }
    receive() external payable { treasuryBalance += msg.value; }
}
