'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameRoom, GameState, OpponentUpdate, GameFinished, SocketError } from '@/types/game';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  currentRoom: GameRoom | null;
  currentPlayer: { id: number; username: string } | null;
  opponent: OpponentUpdate | null;
  gameFinished: GameFinished | null;
  error: string | null;
  joinGame: (username?: string, roomId?: string) => void;
  updateRegex: (pattern: string, score: number, isComplete: boolean) => void;
  clearError: () => void;
  resetGame: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<{ id: number; username: string } | null>(null);
  const [opponent, setOpponent] = useState<OpponentUpdate | null>(null);
  const [gameFinished, setGameFinished] = useState<GameFinished | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socketUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3001'
      : window.location.origin;
    
    const socketInstance = io(socketUrl);
    
    socketInstance.on('connect', () => {
      console.log('✅ Connected to socket server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Disconnected from socket server');
      setIsConnected(false);
    });

    socketInstance.on('room_joined', (data: { roomId: string; username: string; room: GameRoom }) => {
      console.log('🏠 Joined room:', data.roomId);
      setCurrentRoom(data.room);
      setCurrentPlayer({ id: data.room.players[data.room.players.length - 1].id, username: data.username });
      setError(null);
    });

    socketInstance.on('player_joined', (data: { playerId: number; username: string; playerCount: number }) => {
      console.log('👋 Player joined:', data.username);
      setCurrentRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: [...prev.players, { id: data.playerId, username: data.username }]
        };
      });
    });

    socketInstance.on('player_left', (data: { playerId: number; username: string; playerCount: number }) => {
      console.log('👋 Player left:', data.username);
      setCurrentRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.filter(p => p.id !== data.playerId)
        };
      });
      // Clear opponent if they left
      setOpponent(prev => prev && prev.playerId === data.playerId ? null : prev);
    });

    socketInstance.on('game_started', (data: { roomId: string; matchId: number; challenge: any; players: any[]; startTime: number }) => {
      console.log('🎮 Game started!');
      setCurrentRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'in_progress',
          startTime: data.startTime,
          matchId: data.matchId
        };
      });
      setGameFinished(null);
    });

    socketInstance.on('opponent_update', (data: OpponentUpdate) => {
      setOpponent(data);
    });

    socketInstance.on('game_finished', (data: GameFinished) => {
      console.log('🏆 Game finished!');
      setGameFinished(data);
      setCurrentRoom(prev => {
        if (!prev) return prev;
        return { ...prev, status: 'finished' };
      });
    });

    socketInstance.on('error', (data: SocketError) => {
      console.error('Socket error:', data.message);
      setError(data.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinGame = (username?: string, roomId?: string) => {
    if (!socket) return;
    
    console.log('🎮 Joining game...', { username, roomId });
    socket.emit('join_game', { username, roomId });
  };

  const updateRegex = (pattern: string, score: number, isComplete: boolean) => {
    if (!socket) return;
    
    socket.emit('update_regex', { pattern, score, isComplete });
  };

  const clearError = () => {
    setError(null);
  };

  const resetGame = () => {
    setCurrentRoom(null);
    setCurrentPlayer(null);
    setOpponent(null);
    setGameFinished(null);
    setError(null);
  };

  const value: SocketContextType = {
    socket,
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
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};