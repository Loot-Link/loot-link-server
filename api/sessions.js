import express from "express";
import fetch from "node-fetch";
import { 
  getSessions, 
  getSessionById, 
  createSession, 
  addUserToSession, 
  getSessionUsers, 
} from "#db/queries/sessions";

import requireBody from "#middleware/requireBody";
import requireUser from "#middleware/requireUser";
import { createToken } from "#utils/jwt";

const router = express.Router();
export default router;

//EMJ - This feels very public so we'll leave it simple
// 1. Get a single session's details and its players
router.get("/:id", async (req, res) => {
  try {
    const session = await getSessionById(req.params.id);
    if (!session) return res.status(404).send("Session not found");
    
    // Waterfall: fetch the users currently in this session
    const players = await getSessionUsers(req.params.id);
    
    res.send({ ...session, players });
  } catch (err) {
    res.status(500).send("Error fetching session details");
  }
});

// 2. Create a new session (Requires Auth)
router.post("/", requireUser, requireBody(["game_id", "session_title"]), async (req, res) => {
  try {
    const session = await createSession({
      ...req.body,
      host_user_id: req.user.user_id
    });
    
    // Automatically add the host as the first player in session_users
    await addUserToSession(session.session_id, req.user.user_id);
    
    res.status(201).send(session);
  } catch (err) {
    res.status(500).send("Error creating session");
  }
});

// 3. Join a session (Requires Auth)
router.post("/:id/join", requireUser, async (req, res) => {
  try {
    const sessionUser = await addUserToSession(req.params.id, req.user.user_id);
    res.status(201).send(sessionUser);
  } catch (err) {
    // Check for your 23505 unique constraint error (user already in session)
    if (err.code === "23505") {
      return res.status(400).send("You are already in this session");
    }
    res.status(500).send("Error joining session");
  }
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





