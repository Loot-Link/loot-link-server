import express from "express";
const router = express.Router();
export default router;

import fetch from "node-fetch";
import { getSessions, getSessionById, getSessionUsers } from "#db/queries/sessions";

import requireBody from "#middleware/requireBody";
import { createToken } from "#utils/jwt";


router.get("/", async (req, res) => {
  const sessions = await getSessions();
  res.send(sessions);
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