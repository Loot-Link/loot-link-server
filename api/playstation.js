import express from "express";
const router = express.Router();
export default router;

import { 
  exchangeNpssoForCode, 
  exchangeCodeForAccessToken, 
  getRecentlyPlayedGames, // FIXED NAME
  getTitleTrophies, 
  makeUniversalSearch 
} from "psn-api";

async function getAuth() {
  const accessCode = await exchangeNpssoForCode(process.env.PSN_NPSSO);
  return await exchangeCodeForAccessToken(accessCode);
}

// 1. Search for a User by Name
router.get("/search/:onlineId", async (req, res, next) => {
  try {
    const auth = await getAuth();
    const results = await makeUniversalSearch(auth, req.params.onlineId, "SocialAllAccounts");
    
    // Adjusted to return the correct nested results
    const user = results.domainResponses?.results || [];
    res.send(user);
  } catch (err) {
    next(err);
  }
});

// 2. Get the "Loot" (Recently Played Games)
router.get("/:accountId/games", async (req, res, next) => {
  try {
    const auth = await getAuth();
    
    // Corrected function call: getRecentlyPlayedGames
    const response = await getRecentlyPlayedGames(auth, req.params.accountId);
    
    res.send(response.titles || []);
  } catch (err) {
    console.error("PSN Backend Error:", err);
    next(err);
  }
});

// 3. Get Trophies for a specific game
router.get("/:accountId/trophies/:npId", async (req, res, next) => {
  try {
    const auth = await getAuth();
    const data = await getTitleTrophies(auth, req.params.accountId, req.params.npId, "all");
    res.send(data);
  } catch (err) {
    next(err);
  }
});
