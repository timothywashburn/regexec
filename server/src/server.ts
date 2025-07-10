import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { pool, testConnection, initializeTables } from './database';
import { 
  GameRoom, 
  PlayerInfo, 
  GameChallenge, 
  JoinGameData, 
  UpdateRegexData,
  OpponentUpdate,
  GameStartedData,
  GameFinishedData,
  SocketError
} from './types';
import { GameStateManager } from './gameState';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = parseInt(process.env.PORT || '3001');

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for active games
const activeRooms = new Map<string, GameRoom>();
const playerSockets = new Map<string, PlayerInfo>(); // socketId -> playerInfo
const gameStateManager = new GameStateManager();

// Sample challenge data
const SAMPLE_CHALLENGES: GameChallenge[] = [
  {
    id: 'email_validation',
    name: 'Email Validation Challenge',
    description: 'Write a regex pattern that matches all valid email addresses in the text below.',
    targetText: "Welcome to our platform! Please contact us at support@regexec.com for any questions. Our team members include john.doe@company.org, jane_smith@tech.co.uk, and admin@test-site.net.\\n\\nInvalid emails like user@, @domain.com, and user@domain should not match.\\n\\nMore valid emails: test.email+tag@example.com, user123@sub.domain.edu, contact@new-site.io, and info@company.travel.",
    targetMatches: [
      'support@regexec.com',
      'john.doe@company.org', 
      'jane_smith@tech.co.uk',
      'admin@test-site.net',
      'test.email+tag@example.com',
      'user123@sub.domain.edu',
      'contact@new-site.io',
      'info@company.travel'
    ],
    timeLimit: 120
  }
];

// Utility functions
function generateUsername(): string {
  const adjectives = ['Swift', 'Clever', 'Regex', 'Code', 'Logic', 'Binary', 'Cyber', 'Data'];
  const nouns = ['Master', 'Wizard', 'Ninja', 'Guru', 'Expert', 'Hacker', 'Coder', 'Pro'];
  const num = Math.floor(Math.random() * 999) + 1;
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${num}`;
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Handle player joining
  socket.on('join_game', async (data: JoinGameData) => {
    try {
      const { username, roomId } = data;
      const playerName = username || generateUsername();
      
      // Create or get user
      let userId: number;
      try {
        const [result] = await pool.execute(
          'INSERT INTO users (username) VALUES (?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',
          [playerName]
        ) as any;
        userId = result.insertId;
      } catch (error) {
        console.error('Error creating/getting user:', error);
        socket.emit('error', { message: 'Failed to create user' } as SocketError);
        return;
      }

      // Store player info
      playerSockets.set(socket.id, {
        id: userId,
        username: playerName,
        roomId: roomId || null
      });

      if (roomId) {
        // Join specific room
        await joinRoom(socket, roomId, userId, playerName);
      } else {
        // Join matchmaking queue
        await joinMatchmaking(socket, userId, playerName);
      }
    } catch (error) {
      console.error('Error handling join_game:', error);
      socket.emit('error', { message: 'Failed to join game' } as SocketError);
    }
  });

  // Handle regex pattern updates
  socket.on('update_regex', async (data: UpdateRegexData) => {
    try {
      const player = playerSockets.get(socket.id);
      if (!player || !player.roomId) return;

      const { pattern, score, isComplete } = data;
      
      // Update game state in memory
      gameStateManager.updatePlayer(player.roomId, player.id, pattern, score, isComplete);

      // Broadcast to room (excluding sender)
      socket.to(player.roomId).emit('opponent_update', {
        playerId: player.id,
        username: player.username,
        pattern,
        score,
        isComplete
      } as OpponentUpdate);

      // Check if game is complete
      if (isComplete) {
        await checkGameCompletion(player.roomId);
      }
    } catch (error) {
      console.error('Error updating regex:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
    handleDisconnect(socket);
  });
});

// Room management functions
async function joinRoom(socket: any, roomId: string, userId: number, username: string): Promise<void> {
  try {
    // Check if room exists
    const [rooms] = await pool.execute('SELECT * FROM game_rooms WHERE id = ?', [roomId]) as any;
    
    if (rooms.length === 0) {
      socket.emit('error', { message: 'Room not found' } as SocketError);
      return;
    }

    const room = rooms[0];
    
    if (room.current_players >= room.max_players) {
      socket.emit('error', { message: 'Room is full' } as SocketError);
      return;
    }

    // Join the room
    socket.join(roomId);
    
    // Update room player count
    await pool.execute(
      'UPDATE game_rooms SET current_players = current_players + 1 WHERE id = ?',
      [roomId]
    );

    // Add player to active rooms
    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, {
        id: roomId,
        players: [],
        challenge: room.challenge_data || SAMPLE_CHALLENGES[0],
        status: 'waiting',
        startTime: null
      });
      gameStateManager.createRoom(roomId);
    }

    const activeRoom = activeRooms.get(roomId)!;
    activeRoom.players.push({ id: userId, username, socketId: socket.id });
    
    // Add player to game state manager
    gameStateManager.addPlayer(roomId, userId);

    // Update player's room
    const player = playerSockets.get(socket.id);
    if (player) {
      player.roomId = roomId;
    }

    // Emit room joined event
    socket.emit('room_joined', {
      roomId,
      username,
      room: activeRoom
    });

    // Notify other players
    socket.to(roomId).emit('player_joined', {
      playerId: userId,
      username,
      playerCount: activeRoom.players.length
    });

    // Start game if room is full
    if (activeRoom.players.length >= 2 && activeRoom.status === 'waiting') {
      await startGame(roomId);
    }

  } catch (error) {
    console.error('Error joining room:', error);
    socket.emit('error', { message: 'Failed to join room' } as SocketError);
  }
}

async function joinMatchmaking(socket: any, userId: number, username: string): Promise<void> {
  try {
    // Simple matchmaking - find or create a waiting room
    const [waitingRooms] = await pool.execute(
      'SELECT * FROM game_rooms WHERE status = "waiting" AND current_players < max_players ORDER BY created_at ASC LIMIT 1'
    ) as any;

    let roomId: string;
    
    if (waitingRooms.length > 0) {
      // Join existing waiting room
      roomId = waitingRooms[0].id;
    } else {
      // Create new room
      roomId = uuidv4();
      await pool.execute(
        'INSERT INTO game_rooms (id, name, created_by, challenge_data) VALUES (?, ?, ?, ?)',
        [roomId, `Match ${roomId.substring(0, 8)}`, userId, JSON.stringify(SAMPLE_CHALLENGES[0])]
      );
    }

    await joinRoom(socket, roomId, userId, username);
  } catch (error) {
    console.error('Error in matchmaking:', error);
    socket.emit('error', { message: 'Matchmaking failed' } as SocketError);
  }
}

async function startGame(roomId: string): Promise<void> {
  try {
    const activeRoom = activeRooms.get(roomId);
    if (!activeRoom || activeRoom.status !== 'waiting') return;

    // Update room status
    await pool.execute('UPDATE game_rooms SET status = "in_progress" WHERE id = ?', [roomId]);
    
    // Create match record
    const [matchResult] = await pool.execute(
      'INSERT INTO game_matches (room_id, player1_id, player2_id) VALUES (?, ?, ?)',
      [roomId, activeRoom.players[0].id, activeRoom.players[1].id]
    ) as any;

    // Update active room
    activeRoom.status = 'in_progress';
    activeRoom.startTime = Date.now();
    activeRoom.matchId = matchResult.insertId;
    
    // Start game in state manager
    gameStateManager.startGame(roomId);

    // Notify all players in room
    io.to(roomId).emit('game_started', {
      roomId,
      matchId: matchResult.insertId,
      challenge: activeRoom.challenge,
      players: activeRoom.players.map(p => ({ id: p.id, username: p.username })),
      startTime: activeRoom.startTime
    } as GameStartedData);

    console.log(`🎮 Game started in room ${roomId}`);
  } catch (error) {
    console.error('Error starting game:', error);
  }
}

async function checkGameCompletion(roomId: string): Promise<void> {
  try {
    const winner = gameStateManager.getWinner(roomId);
    
    if (winner) {
      // Someone completed the challenge (first to complete wins)
      await endGame(roomId, winner.playerId);
    }
  } catch (error) {
    console.error('Error checking game completion:', error);
  }
}

async function endGame(roomId: string, winnerId: number): Promise<void> {
  try {
    const activeRoom = activeRooms.get(roomId);
    if (!activeRoom) return;

    // Update match record
    await pool.execute(
      'UPDATE game_matches SET winner_id = ?, status = "finished", finished_at = NOW(), duration = ? WHERE room_id = ?',
      [winnerId, Math.floor((Date.now() - activeRoom.startTime!) / 1000), roomId]
    );

    // Update room status
    await pool.execute('UPDATE game_rooms SET status = "finished" WHERE id = ?', [roomId]);
    
    // Finish game in state manager
    gameStateManager.finishGame(roomId);

    // Get winner info
    const [winners] = await pool.execute('SELECT username FROM users WHERE id = ?', [winnerId]) as any;
    const winnerName = winners[0]?.username || 'Unknown';

    // Notify all players
    io.to(roomId).emit('game_finished', {
      roomId,
      winnerId,
      winnerName,
      duration: Math.floor((Date.now() - activeRoom.startTime!) / 1000)
    } as GameFinishedData);

    console.log(`🏆 Game finished in room ${roomId}, winner: ${winnerName}`);
  } catch (error) {
    console.error('Error ending game:', error);
  }
}

function handleDisconnect(socket: any): void {
  const player = playerSockets.get(socket.id);
  if (!player) return;

  if (player.roomId) {
    const activeRoom = activeRooms.get(player.roomId);
    if (activeRoom) {
      // Remove player from active room
      activeRoom.players = activeRoom.players.filter(p => p.socketId !== socket.id);
      
      // Remove player from game state manager
      gameStateManager.removePlayer(player.roomId, player.id);
      
      // Notify other players
      socket.to(player.roomId).emit('player_left', {
        playerId: player.id,
        username: player.username,
        playerCount: activeRoom.players.length
      });

      // Clean up empty rooms
      if (activeRoom.players.length === 0) {
        activeRooms.delete(player.roomId);
        gameStateManager.removeRoom(player.roomId);
      }
    }
  }

  playerSockets.delete(socket.id);
}

// API endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/rooms', async (req, res) => {
  try {
    const [rooms] = await pool.execute('SELECT * FROM game_rooms WHERE status != "finished" ORDER BY created_at DESC') as any;
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Start server
async function startServer(): Promise<void> {
  await testConnection();
  await initializeTables();
  
  server.listen(PORT, () => {
    console.log(`🚀 Socket.io server running on port ${PORT}`);
  });
}

startServer().catch(console.error);