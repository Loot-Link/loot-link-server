import express from "express";
const router = express.Router();
export default router;

import { 
    getPendingFriendRequests, 
    getFriendList, 
    sendFriendRequest,
    acceptFriendRequest, 
    getUserByUserName,
    denyFriendRequest} from "#db/queries/users";

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
router.post('/request/:username', getUserFromToken, async (req, res, next)=>{
    try {
        const {username} = req.params
        const senderId = req.user.user_id;
        const targetUsername = await getUserByUserName(username);
        if(!targetUsername){
            return res.status(404).send({message: "User not found. Check the spelling."})
        }

        const receiverId  = targetUsername.user_id;
        console.log(targetUsername.user_id);
        const newRequest = await sendFriendRequest(senderId, receiverId);
        if(!newRequest){
            return res.status(409).send({message: "A request is already pending"});
        }
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
router.delete('/deny/:senderId', getUserFromToken, async (req, res, next)=>{
    try {
        const senderId = Number(req.params.senderId);
        const receiverId = req.user.user_id;
        
        const denyRequest = await denyFriendRequest(senderId, receiverId);
        res.status(200).send(denyRequest);
    } catch (err) {
        next(err);        
    }
});