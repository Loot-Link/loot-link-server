import express from "express";
const router = express.Router();
export default router;

import { 
    getPendingFriendRequests, 
    getFriendList, 
    sendFriendRequest,
    acceptFriendRequest } from "#db/queries/users";

import getUserFromToken from "#middleware/getUserFromToken";

router.get('/', getUserFromToken, async (req, res, next)=>{
    try {
        const friends = await getFriendList(req.user.user_id);
        res.send(friends);
    }catch(err){
        res.status(500).send("Server error");
    }
});

router.get('/requests', getUserFromToken, async (req, res, next)=>{
    try {
        const requests = await getPendingFriendRequests(req.user.user_id);
        res.send(requests);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

router.post('/request/:receiverId', getUserFromToken, async (req, res, next)=>{
    try {
        const senderId = req.user.user_id;
        const { receiverId } = req.params;
        const newRequest = await sendFriendRequest(senderId, receiverId);
    } catch (err) {
        res.status(500).send("Server Error");
    }
})