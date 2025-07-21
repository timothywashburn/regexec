'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Trophy, Users, Zap, Wifi, WifiOff, Play, UserPlus } from 'lucide-react';
import Confetti from 'react-confetti';
import RegexInput from '@/components/RegexInput';
import TargetTextDisplay from '@/components/TargetTextDisplay';
import { useRegexMatching } from '@/hooks/useRegexMatching';
import { useSocket } from '@/contexts/SocketContext';

export default function Home() {
  const {
    isConnected,
    currentRoom,
    currentPlayer,
    opponent,
    gameFinished,
    error,
    joinGame,
    updateRegex,
    clearError,
    resetGame
  } = useSocket();

  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [timeLeft, setTimeLeft] = useState(120);
  const [player1Regex, setPlayer1Regex] = useState('');
  const [username, setUsername] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });

  // Challenge data - will be replaced by server data
  const targetText = currentRoom?.challenge.targetText || "Welcome to our platform! Please contact us at support@regexec.com for any questions. Our team members include john.doe@company.org, jane_smith@tech.co.uk, and admin@test-site.net.\n\nInvalid emails like user@, @domain.com, and user@domain should not match.\n\nMore valid emails: test.email+tag@example.com, user123@sub.domain.edu, contact@new-site.io, and info@company.travel.";
  
  const targetEmails = currentRoom?.challenge.targetMatches || [
    'support@regexec.com',
    'john.doe@company.org', 
    'jane_smith@tech.co.uk',
    'admin@test-site.net',
    'test.email+tag@example.com',
    'user123@sub.domain.edu',
    'contact@new-site.io',
    'info@company.travel'
  ];

  // Real-time scoring
  const player1Score = useRegexMatching(targetText, targetEmails, player1Regex);
  const opponentScore = useRegexMatching(targetText, targetEmails, opponent?.pattern || '');

  // Set up window dimensions for confetti
  useEffect(() => {
    function handleResize() {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update game state based on socket events
  useEffect(() => {
    if (currentRoom?.status === 'in_progress') {
      setGameState('playing');
    } else if (currentRoom?.status === 'finished' || gameFinished) {
      setGameState('finished');
      setShowConfetti(true);
      // Stop confetti after 5 seconds
      setTimeout(() => setShowConfetti(false), 5000);
    } else {
      setGameState('waiting');
    }
  }, [currentRoom?.status, gameFinished]);

  // Send regex updates to server
  useEffect(() => {
    if (hasJoined && currentRoom?.status === 'in_progress') {
      updateRegex(player1Regex, player1Score.correctMatches, player1Score.isComplete);
      
      // Check if player completed the challenge
      if (player1Score.isComplete && gameState === 'playing') {
        console.log('🎉 Player completed the challenge!');
      }
    }
  }, [player1Regex, player1Score.correctMatches, player1Score.isComplete, hasJoined, currentRoom?.status, updateRegex, gameState]);

  // Timer countdown
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState, timeLeft]);

  // Handle joining game
  const handleJoinGame = () => {
    if (!hasJoined) {
      joinGame(username || undefined);
      setHasJoined(true);
    }
  };

  // Handle game restart
  const handleRestart = () => {
    resetGame();
    setHasJoined(false);
    setPlayer1Regex('');
    setGameState('waiting');
    setTimeLeft(120);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}
      
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Regexec
              </h1>
            </div>
            <div className="flex items-center gap-6">
              {/* Connection Status */}
              <div className="flex items-center gap-2 text-sm">
                {isConnected ? (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <Wifi className="w-4 h-4" />
                    <span>Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <WifiOff className="w-4 h-4" />
                    <span>Disconnected</span>
                  </div>
                )}
              </div>
              
              {/* Timer */}
              {gameState === 'playing' && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                </div>
              )}
              
              {/* Room Info */}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Users className="w-4 h-4" />
                <span>
                  {currentRoom ? 
                    `${currentRoom.players.length}/${currentRoom.players.length >= 2 ? 2 : 2} Players` : 
                    'Not in room'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex justify-between items-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}

        {/* Join Game Screen */}
        {!hasJoined && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Join Regexec Match
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Enter your username to join the matchmaking queue
              </p>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter username (optional)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <button
                  onClick={handleJoinGame}
                  disabled={!isConnected}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Join Match
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Game Finished Screen */}
        {gameFinished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center mb-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                🏆 Game Finished!
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                Winner: <span className="font-semibold text-blue-600 dark:text-blue-400">{gameFinished.winnerName}</span>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                Duration: {gameFinished.duration}s
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                {gameFinished.winnerId === currentPlayer?.id ? 
                  "🎉 Congratulations! You won!" : 
                  "Better luck next time!"
                }
              </p>
              
              <button
                onClick={handleRestart}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
              >
                Play Again
              </button>
            </div>
          </motion.div>
        )}

        {/* Challenge Description */}
        {hasJoined && currentRoom && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {currentRoom.challenge.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {currentRoom.challenge.description}
            </p>
            
            {/* Waiting for players */}
            {currentRoom.status === 'waiting' && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg inline-block">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <UserPlus className="w-5 h-5" />
                  <span>Waiting for opponent... ({currentRoom.players.length}/2 players)</span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Split Screen Layout */}
        {hasJoined && currentRoom && (gameState === 'playing' || gameState === 'finished') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Player 1 Area (You) */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    {currentPlayer?.username || 'You'} (You)
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Trophy className="w-4 h-4" />
                    <span>{player1Score.correctMatches} / {player1Score.totalTargets} matches</span>
                  </div>
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                {/* Regex Input Area */}
                <div className="mb-4">
                  <RegexInput
                    value={player1Regex}
                    onChange={setPlayer1Regex}
                    placeholder="Enter your regex pattern here..."
                    disabled={gameState !== 'playing'}
                  />
                </div>
                
                {/* Player 1 Target Text - Always at bottom */}
                <div className="flex-1 flex flex-col justify-end">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Target Text
                    </label>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-yellow-300 dark:bg-yellow-600 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">Target</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-400 dark:bg-green-600 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">Correct</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-400 dark:bg-red-600 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">Wrong</span>
                      </div>
                    </div>
                  </div>
                  <TargetTextDisplay
                    text={targetText}
                    targetMatches={targetEmails}
                    userRegex={player1Regex}
                    userMatchColor="red"
                    targetMatchColor="yellow"
                  />
                </div>
              </div>
            </motion.div>

            {/* Player 2 Area (Opponent) */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${opponent ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                    {opponent?.username || 'Opponent'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Trophy className="w-4 h-4" />
                    <span>{opponentScore.correctMatches} / {opponentScore.totalTargets} matches</span>
                  </div>
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                {/* Opponent's Regex (blurred during play, revealed when finished) */}
                <div className="mb-4">
                  <RegexInput
                    value={opponent?.pattern || ''}
                    onChange={() => {}} // Read-only for opponent
                    placeholder="Opponent's pattern..."
                    disabled={true}
                    blur={gameState !== 'finished'}
                  />
                  {gameState === 'finished' && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Opponent&apos;s final pattern revealed
                    </div>
                  )}
                </div>
                
                {/* Opponent Target Text - Always at bottom */}
                <div className="flex-1 flex flex-col justify-end">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Target Text
                    </label>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-yellow-300 dark:bg-yellow-600 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">Target</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-400 dark:bg-green-600 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">Correct</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-400 dark:bg-red-600 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">Wrong</span>
                      </div>
                    </div>
                  </div>
                  <TargetTextDisplay
                    text={targetText}
                    targetMatches={targetEmails}
                    userRegex={opponent?.pattern || ''}
                    userMatchColor="red"
                    targetMatchColor="yellow"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
