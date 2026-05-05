import db from "#db/client";
import bcrypt from "bcrypt";


export async function getUsers() {
  const sql = `
  SELECT *
  FROM users
  `;
  const { rows: users } = await db.query(sql);
  return users;
}



export async function createUser(email, username, password, role_id = 100) {
  username = username.toLowerCase();

  const sql = `
  INSERT INTO users
    (email, username, password, role_id)
  VALUES
    ($1, $2, $3, $4)
  RETURNING *
  `;  

  const hashedPassword = await bcrypt.hash(password, 10);
  const {
    rows: [user],
  } = await db.query(sql, [email, username, hashedPassword, role_id]);

  return user;
}



export async function getUserByEmailAndPassword(email, password) {
  const sql = `
  SELECT *
  FROM users
  WHERE email = $1
  `;
  const {
    rows: [user],
  } = await db.query(sql, [email]);
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;

  return user;
}

export async function getUserById(id) {
  const sql = `
  SELECT *
  FROM users
  WHERE user_id = $1
  `;
  const {
    rows: [user],
  } = await db.query(sql, [id]);
  return user;
}


export async function updateUserSteamId(userId, steamId) {
  const sql = `
    UPDATE users
    SET steam_id = $2
    WHERE user_id = $1
    RETURNING *;
  `;
  const { rows: [user] } = await db.query(sql, [userId, steamId]);
  return user;
}


export async function updateUserXboxId(userId, xboxXuid, xboxGamertag){
  const sql = `
    UPDATE users
    SET xbox_xuid = $2,
    xbox_gamertag = $3
    WHERE user_id = $1
    RETURNING *;
  `;
  const { rows: [user] } = await db.query(sql, [userId, xboxXuid, xboxGamertag]);
  return user;
}

export async function getPendingFriendRequests(userId){
  const sql = `
    SELECT * 
    FROM friendships
    WHERE (user_id_1 = $1 OR user_id_2 = $1)
    AND status = 'pending'
    AND request_sender_id != $1;
  `;
  const { rows } = await db.query(sql, [userId]);
  return rows;
}

export async function getFriendList(userId){
  const sql = `
    SELECT u.user_id, u.username 
    FROM friendships f
    JOIN users u ON u.user_id = (
      CASE
        WHEN f.user_id_1 = $1 THEN f.user_id_2
        ELSE f.user_id_1
      END
    )
    WHERE (f.user_id_1 = $1 OR f.user_id_2 = $1)
    AND f.status = 'accepted';
  `;
  const { rows } = await db.query(sql, [userId]);
  return rows;
}