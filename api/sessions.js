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

router.get("/:sessionId", async (req, res) => {
  const session = await getSessionById(req.params.sessionId);
  if (!session) return res.status(404).send("Session ID not found.");
  res.send(session);
});

router.get("/:sessionId/users", async (req, res) => {
  const sessionUsers = await getSessionUsers(req.params.sessionId);
  if (sessionUsers.length === 0) return res.status(404).send("Session Users not found.");
  res.send(sessionUsers);
});