import express from "express";
const router = express.Router();
export default router;

import fetch from "node-fetch";
import { getSessions } from "#db/queries/sessions";

import requireBody from "#middleware/requireBody";
import { createToken } from "#utils/jwt";


//EMJ - This feels very public so we'll leave it simple
router.get("/", async (req, res) => {
  const games = await getSessions();
  res.send(games);
});


//EMJ Testing for gettin images to load 
// router.get("/", async (req, res) => {
//   const games = await getGames();

//   const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/x-www-form-urlencoded",
//     },
//     body: `client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
//   });

//   const tokenData = await tokenResponse.json();
//   const accessToken = tokenData.access_token;

//   const gamesWithImages = await Promise.all(
//     games.map(async (game) => {
//       const igdbResponse = await fetch("https://api.igdb.com/v4/games", {
//         method: "POST",
//         headers: {
//           "Client-ID": process.env.TWITCH_CLIENT_ID,
//           "Authorization": `Bearer ${accessToken}`,
//         },
//         body: `search "${game.game_title}"; fields name, cover.url; limit 3;`,
//       });

//       const igdbData = await igdbResponse.json();
//       const match = igdbData[0];

//       return {
//         ...game,
//         image: match?.cover?.url ? "https:" + match.cover.url : null,
//       };
//     })
//   );

//   res.send(gamesWithImages);
// });





