import express from "express";
const router = express.Router();
export default router;

import { createUser, getUserByEmailAndPassword, getUsers } from "#db/queries/users";
import requireBody from "#middleware/requireBody";
import { createToken } from "#utils/jwt";
import { getUserById } from "#db/queries/users";
import getUserFromToken from "#middleware/getUserFromToken";

router.get("/",  async (req, res) => {
  const users = await getUsers();
  users.forEach(user => delete user.password);

  let result = users;
  if (!req.user) {
    result = users.filter(user => user.role_id === 100);
  }
  
  res.send(result);
  // console.log("REQ.USER:", req.user);
});



router.post(
  "/register",
  requireBody(["email", "username", "password"]),
  async (req, res) => {
    try {
      const { email, username, password } = req.body;

      const user = await createUser(
        email.toLowerCase().trim(),
        username.toLowerCase().trim(),
        password
      );

      delete user.password;
      const token = createToken({ id: user.user_id });
      res.status(201).send({ token, user });
    } catch (err) {
      if (err.code === "23505") {
        return res.status(400).send("Email or username already exists");
      }
      res.status(500).send("Server error");
    }
  }
);

router.post(
  "/login",
  requireBody(["email", "password"]),
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await getUserByEmailAndPassword(
        email.toLowerCase().trim(),
        password
      );

      if (!user) {
        return res.status(401).send("Invalid email or password.");
      }

      const token = createToken({ id: user.user_id });

      delete user.password;

      res.status(201).send({ token, user });
    } catch (err) {
      res.status(500).send("Server error");
    }
  }
);



//Get ME - my user info
router.use(getUserFromToken);
router.use((req, res, next) => {
  if (!req.user) return res.status(401).send("Unauthorized");
  next();
});
router.get("/me", async (req, res) => {
  const user = await getUserById(req.user.id);
  res.send(req.user);
});