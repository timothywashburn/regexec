export interface Player {
  id: number;
  username: string;
  socketId: string;
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

export interface PlayerInfo {
  id: number;
  username: string;
  roomId: string | null;
}

export interface JoinGameData {
  username?: string;
  roomId?: string;
}

export interface UpdateRegexData {
  pattern: string;
  score: number;
  isComplete: boolean;
}

export interface OpponentUpdate {
  playerId: number;
  username: string;
  pattern: string;
  score: number;
  isComplete: boolean;
}

export interface GameStartedData {
  roomId: string;
  matchId: number;
  challenge: GameChallenge;
  players: { id: number; username: string }[];
  startTime: number;
}

export interface GameFinishedData {
  roomId: string;
  winnerId: number;
  winnerName: string;
  duration: number;
}

export interface SocketError {
  message: string;
}