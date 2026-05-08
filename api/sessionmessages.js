import express from "express";
const router = express.Router();
export default router;

import fetch from "node-fetch";
import { getSessionMessages, createSessionMessage, deleteSessionMessage } from "#db/queries/sessionmessages";

import requireBody from "#middleware/requireBody";
import { createToken } from "#utils/jwt";


router.get("/:sessionId", async (req, res) => {
  const sessionMessages = await getSessionMessages(req.params.sessionId);
  if (!sessionMessages) return res.status(404).send("Session ID not found.");
  res.send(sessionMessages);
});

router.post("/", async (req, res, next) => {
  try {
    const { session_id, message_text } = req.body;
    //console.log(req.user);
    const user_id = req.user.user_id;

    const message = await createSessionMessage(
      session_id,
      user_id,
      message_text
    );

    res.status(201).send(message);
  } catch (err) {
    next(err);
  }
});

