import db from "#db/client";
import bcrypt from "bcrypt";

export async function getSessions(){
  const sql = `
  SELECT
    sessions.*,
    games.game_title,
    games.cover_image_url
  FROM sessions
  JOIN games ON sessions.game_id = games.game_id
  `;
  const { rows: games } = await db.query(sql);
  return games;
}

export async function getSessionById(session_id){
  const sql = `
  SELECT
    sessions.*,
    games.game_title,
    games.cover_image_url
  FROM sessions
  JOIN games ON sessions.game_id = games.game_id
  WHERE session_id = $1
  `;
  const { rows: [session] } = await db.query(sql, [session_id]);
  return session;
}


export async function getSessionUsers(session_id) {
  const sql = `
    SELECT
      session_users.*,
      users.*
    FROM session_users
    JOIN users ON session_users.user_id = users.user_id
    WHERE session_id = $1
  `;
  const { rows } = await db.query(sql, [session_id]);
  return rows;
}