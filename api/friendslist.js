import express from "express";
const router = express.Router();
export default router;

import { 
    getPendingFriendRequests, 
    getFriendList, 
    sendFriendRequest,
    acceptFriendRequest, 
    denyFriendRequest,
    getBlockList,
    blockUser} from "#db/queries/friendQuery";

import getUserFromToken from "#middleware/getUserFromToken";
import { getUserByUserName } from "#db/queries/users";

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
//Get list of blocked users. 
router.get('/blocklist', getUserFromToken, async (req, res, next)=>{
    try {
        const requests = await getBlockList(req.user.user_id);
        console.log("Blocklist API call: ", requests);
        res.send(requests);
    } catch (err) {
        next(err);
    }
});
//User send a friend request
router.post('/request/:username', getUserFromToken, async (req, res, next)=>{
    try {
        const {username} = req.params
        const senderId = req.user.user_id;
        const targetUsername = await getUserByUserName(username); 
        if(!targetUsername){
            return res.status(404).send({message: "User not found. Check the spelling."})
        }
        //Gets list of user's pending requests, looks for if any of their id's matches user's
        const pendingRequests = await getPendingFriendRequests(req.user.user_id);
        const alreadyPending = pendingRequests.some(req => req.friend_id === targetUsername.user_id);
        if(alreadyPending){
            return res.status(409).send({message: "Pending request already exists"});
        }
        const newRequest = await sendFriendRequest(senderId, targetUsername.user_id);
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
    if(receiverId === senderId){
        return res.status(400).send({message: "You can't accept your own request"});
    }
    const acceptFriend = await acceptFriendRequest(senderId, receiverId);
    res.status(200).send(acceptFriend);
  }catch(err){
    next(err);
  } 
});

//User denies a friend request (Should also work for removing a friendship)
router.post('/deny/:senderId', getUserFromToken, async (req, res, next)=>{
    try {
        const senderId = Number(req.params.senderId);
        const receiverId = req.user.user_id;
        
        const denyRequest = await denyFriendRequest(senderId, receiverId);
        res.status(200).send(denyRequest);
    } catch (err) {
        next(err);        
    }
});

//User blocks another user 
router.post('/blocklist/:receiverId', getUserFromToken, async (req, res, next)=>{
    try {
        //receiver = person to be blocked
        const receiverId = Number(req.params.receiverId);
        //sender = person doing the blocking
        const senderId = req.user.user_id;

        const blockedPerson = await blockUser(senderId, receiverId);
        console.log("Block user POST API call: ", blockedPerson);
        res.status(200).send(blockedPerson);
    } catch (err) {
        next(err);
    }
});