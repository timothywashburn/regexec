export interface Player {
  id: number;
  username: string;
  socketId?: string;
}

export interface GameChallenge {
  id: string;
  name: string;
  description: string;
  targetText: string;
  targetMatches: string[];
  timeLimit: number;
}

export interface GameRoom {
  id: string;
  players: Player[];
  challenge: GameChallenge;
  status: 'waiting' | 'in_progress' | 'finished';
  startTime: number | null;
  matchId?: number;
}

export interface GameState {
  playerId: number;
  roomId: string;
  regexPattern: string;
  score: number;
  isComplete: boolean;
  lastUpdated: number;
}

export interface OpponentUpdate {
  playerId: number;
  username: string;
  pattern: string;
  score: number;
  isComplete: boolean;
}

export interface GameFinished {
  roomId: string;
  winnerId: number;
  winnerName: string;
  duration: number;
}

export interface SocketError {
  message: string;
}