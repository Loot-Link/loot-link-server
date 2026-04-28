DROP TABLE IF EXISTS game_platforms;
DROP TABLE IF EXISTS session_users;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS platforms;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS roles;

-- ************************ Users TABLES ************************ -- 
CREATE TABLE roles (
  role_id SERIAL PRIMARY KEY,
  role_name TEXT NOT NULL
);

CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  role_id INT REFERENCES roles(role_id),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  username TEXT UNIQUE,  
  notes TEXT,  
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  avatar_url TEXT
);

-- ************************ Sessions TABLES ************************ -- 
CREATE TABLE sessions (
  session_id SERIAL PRIMARY KEY,
  game_id INT NOT NULL,
  host_user_id INT NOT NULL REFERENCES users(user_id),

  session_title TEXT NOT NULL,
  session_description TEXT,

  session_status TEXT NOT NULL DEFAULT 'active',
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  max_users INT NOT NULL DEFAULT 4,

  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by_user_id INT NULL REFERENCES users(user_id),
  creation_source TEXT NOT NULL DEFAULT 'user'
);

CREATE TABLE session_users (
  session_user_id SERIAL PRIMARY KEY,
  session_id INT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

  membership_status TEXT NOT NULL DEFAULT 'joined',
  is_host BOOLEAN NOT NULL DEFAULT FALSE,

  invited_at TIMESTAMP,
  joined_at TIMESTAMP,
  left_at TIMESTAMP,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE (session_id, user_id)
);


-- ************************ Games TABLES ************************ -- 
CREATE TABLE games (
  game_id SERIAL PRIMARY KEY,
  game_title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,

  game_description TEXT,
  genre TEXT,
  category TEXT,
  age_rating TEXT,

  release_date DATE,
  developer TEXT,
  publisher TEXT,

  cover_image_url TEXT,
  banner_image_url TEXT,

  avg_rating NUMERIC,
  rating_count INTEGER DEFAULT 0,

  igdb_id INTEGER,
  steam_app_id INTEGER,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);


CREATE TABLE platforms (
  platform_id SERIAL PRIMARY KEY,
  platform_name TEXT NOT NULL UNIQUE, -- steam, xbox, psn

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE game_platforms (
  game_platform_id SERIAL PRIMARY KEY,
  game_id INT NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
  platform_id INT NOT NULL REFERENCES platforms(platform_id) ON DELETE CASCADE,

  external_game_id TEXT, -- id from steam/psn/xbox api if needed

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE (game_id, platform_id)
);