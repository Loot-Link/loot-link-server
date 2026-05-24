import express from "express";
const router = express.Router();
export default router;

import db from "#db/client"; 
import { createTemporaryVoiceChannel } from "#utils/discordBot";
import { 
  getSessions, 
  getSessionById, 
  getSessionUsers, 
  createSession, 
  addUserToSession, 
  getSessionsByUserId,
  deleteSession,
  removeUserFromSession, 
  updateSession
} from "#db/queries/sessions";
import requireBody from "#middleware/requireBody";
import requireUser from "#middleware/requireUser";


// 1. GET all sessions With Automated Player Count 
router.get("/", async (req, res) => {
  try {
    const sql = `
      SELECT 
        sessions.*, 
        games.game_title, 
        games.cover_image_url,
        COUNT(session_users.user_id)::INTEGER as current_user_count
      FROM sessions
      JOIN games ON sessions.game_id = games.game_id
      LEFT JOIN session_users ON sessions.session_id = session_users.session_id
      GROUP BY sessions.session_id, games.game_title, games.cover_image_url;
    `;
    const { rows: sessions } = await db.query(sql);
    res.send(sessions);
  } catch (err) {
    console.error("Catalog aggregate fetch failure:", err.message);
    res.status(500).send("Error fetching sessions catalog");
  }
});


// 2. GET My Active Sessions (REQUIRED for Profile.jsx)
router.get("/user/me", requireUser, async (req, res) => {
  try {
    const sessions = await getSessionsByUserId(req.user.user_id);
    res.send(sessions);
  } catch (err) {
    res.status(500).send("Error fetching your sessions");
  }
});

// 3. GET Session Details
router.get("/:sessionId", async (req, res) => {
  try {
    const session = await getSessionById(req.params.sessionId);
    if (!session) return res.status(404).send("Session not found");
    // We fetch players automatically to support your "waterfall" logic
    const players = await getSessionUsers(req.params.sessionId);
    res.send({ ...session, players });
  } catch (err) {
    res.status(500).send("Error fetching session details");
  }
});

// 4. GET Session Users
router.get("/:sessionId/users", async (req, res) => {
  try {
    const sessionUsers = await getSessionUsers(req.params.sessionId);
    if (sessionUsers.length === 0) return res.status(404).send("No users in this session.");
    res.send(sessionUsers);
  } catch (err) {
    res.status(500).send("Error fetching session users");
  }
});

// 5. POST Create Session
router.post("/", requireUser, requireBody(["game_id", "session_title"]), async (req, res) => {
  try {
    // 1. Trigger the Discord bot to make a voice room before saving to the DB
    const discordRoom = await createTemporaryVoiceChannel(req.body.session_title);
    // 2. Append the voice link natively to the session description
    const rawDescription = req.body.session_description || "No description provided.";
    const automatedDescription = discordRoom ? `${rawDescription}\n\n[DISCORD_LINK]:${discordRoom.voice_url}` : rawDescription;
    const session = await createSession({ ...req.body, session_description: automatedDescription, host_user_id: req.user.user_id });
    await addUserToSession(session.session_id, req.user.user_id);
    res.status(201).send(session);
  } catch (err) {
    res.status(500).send("Error creating session with Discord automation");
  }
});

// 6. POST Join Session
router.post("/:sessionId/join", requireUser, async (req, res) => {
  try {
    const sessionUser = await addUserToSession(req.params.sessionId, req.user.user_id);
    res.status(201).send(sessionUser);
  } catch (err) {
    if (err.code === "23505") return res.status(400).send("Already in session");
    res.status(500).send("Error joining session");
  }
});

// 7. DELETE Close Session (Merged Security + Safety Dependency Erasures)
router.delete("/:sessionId", requireUser, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await getSessionById(sessionId);
    if (!session) return res.status(404).send("Session not found");

    if (Number(session.host_user_id) !== Number(req.user.user_id)) {
      return res.status(403).send("Only the lobby host can close this session");
    }

    // Explicit manual safety erasures to break constraint loops forcefully
    await db.query("DELETE FROM session_messages WHERE session_id = $1;", [sessionId]);
    await db.query("DELETE FROM session_users WHERE session_id = $1;", [sessionId]);

    await deleteSession(sessionId);
    res.send({ message: "Session successfully closed" });
  } catch (err) {
    console.error("Backend Delete Crash Log Details:", err.message);
    res.status(500).send("Error deleting session");
  }
});

// 8. DELETE Leave Session
router.delete("/:sessionId/leave", requireUser, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.user_id;

    const session = await getSessionById(sessionId);
    if (!session) return res.status(404).send("Session not found");

    if (Number(session.host_user_id) === Number(userId)) {
      return res.status(400).send("Hosts cannot leave their own session. Use Close Session instead.");
    }

    const result = await removeUserFromSession(sessionId, userId);
    if (!result) return res.status(400).send("You are not a member of this session.");

    res.send({ message: "Successfully left the session" });
  } catch (err) {
    console.error("Leave Session Error:", err.message);
    res.status(500).send("Error leaving session");
  }
});

// 9. PUT Lobby settings configuration (Clean, Fixed Version)
router.put("/:sessionId/settings", requireUser, requireBody(["max_users", "session_status"]), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { max_users, session_status } = req.body;

    const session = await getSessionById(sessionId);
    if (!session) return res.status(404).send("Session not found");
    if (Number(session.host_user_id) !== Number(req.user.user_id)) {
      return res.status(403).send("Only the lobby host can modify settings");
    }
    const updated = await updateSession(sessionId, {
      session_title: session.session_title,
      session_description: session.session_description,
      max_users: Number(max_users) || 4,
      session_status: session_status
    });

    res.send(updated);
  } catch (err) {
    console.error("Lobby configuration error:", err.message);
    res.status(500).send("Error updating lobby settings");
  }
});
