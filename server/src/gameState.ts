export interface PlayerGameState {
  playerId: number;
  pattern: string;
  score: number;
  isComplete: boolean;
  lastUpdated: number;
}

export interface RoomGameState {
  roomId: string;
  players: Map<number, PlayerGameState>;
  startTime: number | null;
  status: 'waiting' | 'in_progress' | 'finished';
}

export class GameStateManager {
  private roomStates = new Map<string, RoomGameState>();

  createRoom(roomId: string): void {
    this.roomStates.set(roomId, {
      roomId,
      players: new Map(),
      startTime: null,
      status: 'waiting'
    });
  }

  addPlayer(roomId: string, playerId: number): void {
    const room = this.roomStates.get(roomId);
    if (!room) {
      this.createRoom(roomId);
    }
    
    const roomState = this.roomStates.get(roomId)!;
    roomState.players.set(playerId, {
      playerId,
      pattern: '',
      score: 0,
      isComplete: false,
      lastUpdated: Date.now()
    });
  }

  updatePlayer(roomId: string, playerId: number, pattern: string, score: number, isComplete: boolean): void {
    const room = this.roomStates.get(roomId);
    if (!room) return;

    const playerState = room.players.get(playerId);
    if (!playerState) return;

    playerState.pattern = pattern;
    playerState.score = score;
    playerState.isComplete = isComplete;
    playerState.lastUpdated = Date.now();
  }

  getPlayerState(roomId: string, playerId: number): PlayerGameState | undefined {
    const room = this.roomStates.get(roomId);
    return room?.players.get(playerId);
  }

  getRoomState(roomId: string): RoomGameState | undefined {
    return this.roomStates.get(roomId);
  }

  getAllPlayers(roomId: string): PlayerGameState[] {
    const room = this.roomStates.get(roomId);
    if (!room) return [];
    
    return Array.from(room.players.values());
  }

  getCompletedPlayers(roomId: string): PlayerGameState[] {
    return this.getAllPlayers(roomId).filter(player => player.isComplete);
  }

  getWinner(roomId: string): PlayerGameState | null {
    const completedPlayers = this.getCompletedPlayers(roomId);
    if (completedPlayers.length === 0) return null;
    
    // Return the first player to complete (earliest lastUpdated)
    return completedPlayers.sort((a, b) => a.lastUpdated - b.lastUpdated)[0];
  }

  startGame(roomId: string): void {
    const room = this.roomStates.get(roomId);
    if (!room) return;
    
    room.startTime = Date.now();
    room.status = 'in_progress';
  }

  finishGame(roomId: string): void {
    const room = this.roomStates.get(roomId);
    if (!room) return;
    
    room.status = 'finished';
  }

  removePlayer(roomId: string, playerId: number): void {
    const room = this.roomStates.get(roomId);
    if (!room) return;
    
    room.players.delete(playerId);
    
    // Clean up empty rooms
    if (room.players.size === 0) {
      this.roomStates.delete(roomId);
    }
  }

  removeRoom(roomId: string): void {
    this.roomStates.delete(roomId);
  }

  getActiveRooms(): string[] {
    return Array.from(this.roomStates.keys());
  }
}