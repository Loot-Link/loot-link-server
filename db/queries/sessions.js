import db from "#db/client";
import bcrypt from "bcrypt";



export async function getSessions(){
  const sql = `
  SELECT *
  FROM sessions
  `;
  const { rows: games } = await db.query(sql);
  return games;
}

