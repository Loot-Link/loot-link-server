import express from "express";
const router = express.Router();
export default router;

import { 
    getPendingFriendRequests, 
    getFriendList, 
    sendFriendRequest,
    acceptFriendRequest } from "#db/queries/users";

import getUserFromToken from "#middleware/getUserFromToken";

//Get list of user's friends
router.get('/', getUserFromToken, async (req, res, next)=>{
    try {
        const friends = await getFriendList(req.user.user_id);
        res.send(friends);
    }catch(err){
        next(err);
    }
});
//Get list of friend requests for the user
router.get('/requests', getUserFromToken, async (req, res, next)=>{
    try {
        const requests = await getPendingFriendRequests(req.user.user_id);
        res.send(requests);
    } catch (err) {
        next(err);
    }
});
//User send a friend request
router.post('/request/:receiverId', getUserFromToken, async (req, res, next)=>{
    try {
        const senderId = req.user.user_id;
        const receiverId  = Number(req.params.receiverId);
        const newRequest = await sendFriendRequest(senderId, receiverId);
        res.status(201).send(newRequest);
    } catch (err) {
        next(err);
    }
});
//User Accepts a friend request
router.post('/accept/:senderId', getUserFromToken, async (req, res, next)=>{
  try {
    const senderId  = Number(req.params.senderId);
    const receiverId = req.user.user_id;
    const acceptFriend = await acceptFriendRequest(senderId, receiverId);
    res.status(200).send(acceptFriend);
  }catch(err){
    next(err);
  } 
});