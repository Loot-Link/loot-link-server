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