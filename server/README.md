# Regexec Socket Server

Real-time multiplayer backend for Regexec using Socket.io and MySQL.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Update database connection details in `.env`

3. **Set up MySQL database:**
   
   **Option 1: Manual setup**
   ```bash
   mysql -u root -p < setup.sql
   ```
   
   **Option 2: Using MySQL command line**
   ```sql
   mysql -u root -p
   CREATE DATABASE regexec;
   EXIT;
   ```
   
   The server will automatically create required tables on startup.

4. **Start the server:**
   ```bash
   npm run dev    # Development with auto-restart
   npm start      # Production
   ```

## Environment Variables

- `PORT`: Server port (default: 3001)
- `DB_HOST`: MySQL host (default: localhost)
- `DB_USER`: MySQL username (default: root)
- `DB_PASSWORD`: MySQL password
- `DB_NAME`: MySQL database name (default: regexec)
- `DB_PORT`: MySQL port (default: 3306)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:3000)

## API Endpoints

- `GET /health`: Health check
- `GET /rooms`: List active game rooms

## Database Schema

- `users`: User accounts
- `game_rooms`: Game room management
- `game_matches`: Match records
- `game_states`: Real-time game state tracking

## Socket Events

### Client → Server
- `join_game`: Join matchmaking or specific room
- `update_regex`: Send regex pattern and score updates

### Server → Client
- `room_joined`: Successfully joined a room
- `player_joined`: Another player joined
- `player_left`: Player disconnected
- `game_started`: Match begins
- `opponent_update`: Opponent's pattern/score update
- `game_finished`: Match completed
- `error`: Error messages