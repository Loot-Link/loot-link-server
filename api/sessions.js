import express from "express";
const router = express.Router();
export default router;

import { 
  getSessions, 
  getSessionById, 
  getSessionUsers, 
  createSession, 
  addUserToSession,
  getSessionsByUserId 
} from "#db/queries/sessions";
import requireBody from "#middleware/requireBody";
import requireUser from "#middleware/requireUser";

// 1. GET all sessions (Matches your Home/Catalog pages)
router.get("/", async (req, res) => {
  const sessions = await getSessions();
  res.send(sessions);
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

// 3. GET Session Details (Combined Logic)
// Standardized to :sessionId to match your coworker's frontend and README
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

// 4. GET Session Users (Coworker's specific endpoint)
router.get("/:sessionId/users", async (req, res) => {
  try {
    const sessionUsers = await getSessionUsers(req.params.sessionId);
    if (sessionUsers.length === 0) return res.status(404).send("No users in this session.");
    res.send(sessionUsers);
  } catch (err) {
    res.status(500).send("Error fetching session users");
  }
});

// 5. POST Create Session (Your Logic)
router.post("/", requireUser, requireBody(["game_id", "session_title"]), async (req, res) => {
  try {
    const session = await createSession({
      ...req.body,
      host_user_id: req.user.user_id
    });
    // Auto-add creator as first member
    await addUserToSession(session.session_id, req.user.user_id);
    res.status(201).send(session);
  } catch (err) {
    res.status(500).send("Error creating session");
  }
});

// 6. POST Join Session (Your Logic)
// Updated to :sessionId for consistency
router.post("/:sessionId/join", requireUser, async (req, res) => {
  try {
    const sessionUser = await addUserToSession(req.params.sessionId, req.user.user_id);
    res.status(201).send(sessionUser);
  } catch (err) {
    if (err.code === "23505") return res.status(400).send("Already in session");
    res.status(500).send("Error joining session");
  }
});
