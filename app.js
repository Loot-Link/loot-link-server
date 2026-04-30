import express from "express";
const app = express();
export default app;

import morgan from "morgan";
import getUserFromToken from "#middleware/getUserFromToken";
import cors from "cors";

import usersRouter from "#api/users";
import gamesRouter from "#api/games";
import sessionsRouter from "#api/sessions";
import steamRouter from "#api/steam";
import connectionsRouter from "./api/connections.js";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cors());
app.use(getUserFromToken); 

app.use("/api/users", usersRouter);
app.use("/api/games", gamesRouter);
app.use("/api/sessions", sessionsRouter);

app.use("/api/steam", steamRouter);
app.use("/api/connections", connectionsRouter);


app.use((err, req, res, next) => {
  // A switch statement can be used instead of if statements
  // when multiple cases are handled the same way.
  switch (err.code) {
    // Invalid type
    case "22P02":
      return res.status(400).send(err.message);
    // Unique constraint violation
    case "23505":
    // Foreign key violation
    case "23503":
      return res.status(400).send(err.detail);
    default:
      next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Sorry! Something went wrong.");
});
