-- Create the regexec database
CREATE DATABASE IF NOT EXISTS regexec;

-- Use the database
USE regexec;

-- Create tables (these will also be created automatically by the server)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_rooms (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100),
  created_by INT,
  status ENUM('waiting', 'in_progress', 'finished') DEFAULT 'waiting',
  max_players INT DEFAULT 2,
  current_players INT DEFAULT 0,
  challenge_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS game_matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(36) NOT NULL,
  player1_id INT,
  player2_id INT,
  player1_regex VARCHAR(500),
  player2_regex VARCHAR(500),
  player1_score INT DEFAULT 0,
  player2_score INT DEFAULT 0,
  winner_id INT,
  duration INT,
  status ENUM('active', 'finished', 'abandoned') DEFAULT 'active',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP NULL,
  FOREIGN KEY (room_id) REFERENCES game_rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (player1_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (player2_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS game_states (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(36) NOT NULL,
  player_id INT NOT NULL,
  regex_pattern VARCHAR(500) DEFAULT '',
  score INT DEFAULT 0,
  is_complete BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES game_rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_player_room (room_id, player_id)
);

-- Show confirmation
SELECT 'Database setup complete!' as message;