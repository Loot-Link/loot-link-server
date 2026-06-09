import express from "express";
import { createUser, getUserByEmailAndPassword, getUsers, getUserById } from "#db/queries/users";
import requireBody from "#middleware/requireBody";
import { createToken } from "#utils/jwt";
import getUserFromToken from "#middleware/getUserFromToken";

const router = express.Router();

// Track token verification session metrics
router.use(getUserFromToken); 

// 1. GET All Users catalog matrix
router.get("/", async (req, res) => {
  const users = await getUsers();
  users.forEach(user => delete user.password);
  let result = users;
  
  if (!req.user) {
    result = users.filter(user => user.role_id === 100);
  }
  res.send(result);
});

// 2. GET Users Dropdown array roster
router.get("/dropdown", async (req, res) => {
  const users = await getUsers();
  users.forEach(user => delete user.password);
  let result = users;
  
  if (req.user?.role_id === 1) {
    result = users;
  } else {
    result = users.filter(user => user.user_id != req.user.user_id);
  }
  res.send(result);
});

// 3. POST Register account registration handler
router.post("/register", requireBody(["email", "username", "password"]), async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const user = await createUser(
      email.toLowerCase().trim(),
      username.toLowerCase().trim(),
      password
    );
    delete user.password;
    
    //FIXED PAYLOAD: Generates full user identity hooks directly inside the token signature
    const token = createToken({ 
      id: user.user_id,
      username: user.username,
      role_id: user.role_id
    });
    
    res.status(201).send({ token, user });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).send("Email or username already exists");
    }
    res.status(500).send("Server error");
  }
});

// 4. POST Login credential verification gateway
router.post("/login", requireBody(["email", "password"]), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getUserByEmailAndPassword(
      email.toLowerCase().trim(),
      password
    );
    if (!user) {
      return res.status(401).send("Invalid email or password.");
    }
    
    // ✅ FIXED PAYLOAD: Encodes profile details into the token so user.username populates on boot
    const token = createToken({ 
      id: user.user_id,
      username: user.username,
      role_id: user.role_id
    });
    
    delete user.password;
    res.status(201).send({ token, user });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// Enforce strict account verification boundaries for user-specific endpoints
router.use((req, res, next) => {
  if (!req.user) return res.status(401).send("Unauthorized");
  next();
});

// 5. GET Me - Dynamic profile state sync endpoint
router.get("/me", async (req, res) => {
  try {
    // Fetches your rich database row fields using your active token payload ID
    const user = await getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).send("User profile records not found.");
    }
    
    delete user.password; // Safety padding
    
    //FIXED HANDSHAKE: Returns the rich 'user' database query object instead of req.user
    res.send(user);
  } catch (err) {
    res.status(500).send("Server profile synchronization failure");
  }
});
export default router;