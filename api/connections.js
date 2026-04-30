import express from "express";
const router = express.Router();
export default router;
import { updateUserSteamId } from "#db/queries/users";
import jwt from "jsonwebtoken";
import { createToken } from "#utils/jwt";

// Start Steam connection
// http://localhost:3000/api/connections/steam
router.get("/steam", (req, res) => {
  //so steam can return u and log u back in
  //const linkToken = createToken({ id: req.user.id });
 //const linkToken = createToken({ id: 1 });
  const user = jwt.verify(req.query.token, process.env.JWT_SECRET);
  const linkToken = createToken({ id: user.id });
  const returnUrl = `http://localhost:3000/api/connections/steam/callback?linkToken=${linkToken}`;

  const steamLoginUrl =
    "https://steamcommunity.com/openid/login?" +
    "openid.ns=http://specs.openid.net/auth/2.0" +
    "&openid.mode=checkid_setup" +
    "&openid.return_to=" + encodeURIComponent(returnUrl) +
    "&openid.realm=http://localhost:3000" +
    "&openid.identity=http://specs.openid.net/auth/2.0/identifier_select" +
    "&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select";

  res.redirect(steamLoginUrl);
});


router.get("/steam/callback", async (req, res) => {

  console.log(req.query);
  const steamIdentity = req.query["openid.identity"];
  const steamId = steamIdentity.split("/").pop();

  //that stuff so steam can log u back in
  const { id } = jwt.verify(req.query.linkToken, process.env.JWT_SECRET);
  const user = await updateUserSteamId(id, steamId);

  //const user = await updateUserSteamId(req.user.id, steamId);
  //res.send(user);
  //EMJ - this redirects u to ur profile page after steam sign in button
  res.redirect("http://localhost:5173/profile");
  console.log("Steam ID:", steamId);
});