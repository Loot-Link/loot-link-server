import express from "express";
const router = express.Router();
export default router;
import { updateUserSteamId } from "#db/queries/users";
import { updateUserXboxId } from "#db/queries/users";
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






//Xbox - Azure - https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize
router.get("/xbox", async (req, res) => {
  const user = jwt.verify(req.query.token, process.env.JWT_SECRET);
  const linkToken = createToken({ id: user.id });
  const returnUrl = `http://localhost:3000/api/connections/xbox/callback`;

  const xboxLoginURL =
    `https://api.xbl.io/app/auth/${process.env.OPENXBL_PUBLIC_KEY}` +
    `?state=${req.query.token}`;
    res.cookie("xbox_link_user_id", user.id, {
      httpOnly: true,
      sameSite: "lax",
    });
  res.redirect(xboxLoginURL);
});

router.get("/xbox/callback", async (req, res) => {
  console.log("OpenXBL callback query:", req.query);

  const { code } = req.query;

  // get user from cookie instead of state
  const id = req.cookies.xbox_link_user_id;

  const claimRes = await fetch("https://api.xbl.io/app/claim", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      app_key: process.env.OPENXBL_PUBLIC_KEY,
    }),
  });

  const xblData = await claimRes.json();

  await updateUserXboxId(id, xblData.xuid, xblData.gamertag);

  console.log("XBL DATA:", xblData);

  res.redirect("http://localhost:5173/profile");
});