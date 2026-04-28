import db from "#db/client";
import bcrypt from "bcrypt";



export async function getGames(){
  const sql = `
  SELECT *
  FROM games
  `;
  const { rows: games } = await db.query(sql);
  return games;
}

export async function getGamesForImageURL(){
  const sql = `
    SELECT *
    FROM games
    WHERE cover_image_url IS NULL
  `;
  const { rows: games } = await db.query(sql);
  return games;
}



export async function updateGameImage(game_id, imageUrl) {
  const sql = `
    UPDATE games
    SET cover_image_url = $1
    WHERE game_id = $2
    RETURNING *;
  `;

  const { rows: [game] } = await db.query(sql, [imageUrl, game_id]);
  return game;
}