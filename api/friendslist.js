import express from "express"; 
import { 
  getPendingFriendRequests, 
  getFriendList, 
  sendFriendRequest, 
  acceptFriendRequest, 
  denyFriendRequest, 
  getBlockList, 
  blockUser, 
  removeFromBlocklist 
} from "#db/queries/friendQuery"; 
import getUserFromToken from "#middleware/getUserFromToken"; 
import { getUserByUserName } from "#db/queries/users"; 

const router = express.Router(); 

const getOrderedIds = (id1, id2) => { 
  return id1 < id2 ? { user_id_1: id1, user_id_2: id2 } : { user_id_1: id2, user_id_2: id1 }; 
} 

// 1. Get list of user's friends - ALIGNED SECURELY TO REQ.USER.ID 
router.get('/', getUserFromToken, async (req, res, next) => { 
  try { 
    const friends = await getFriendList(req.user.id); 
    res.send(friends); 
  } catch (err) { 
    next(err); 
  } 
}); 

// 2. Get list of friend requests for the user 
router.get('/requests', getUserFromToken, async (req, res, next) => { 
  try { 
    const requests = await getPendingFriendRequests(req.user.id); 
    res.send(requests); 
  } catch (err) { 
    next(err); 
  } 
}); 

// 3. Get list of blocked users 
router.get('/blocklist', getUserFromToken, async (req, res, next) => { 
  try { 
    const requests = await getBlockList(req.user.id); 
    console.log("Blocklist API call: ", requests); 
    res.send(requests); 
  } catch (err) { 
    next(err); 
  } 
}); 

// 4. User send a friend request 
router.post('/request/:username', getUserFromToken, async (req, res, next) => { 
  try { 
    const { username } = req.params; 
    const senderId = req.user.id; 
    const targetUsername = await getUserByUserName(username); 
    
    if (!targetUsername) { 
      return res.status(404).send({ message: "User not found. Check the spelling." }); 
    } 
    
    const pendingRequests = await getPendingFriendRequests(req.user.id); 
    const alreadyPending = pendingRequests.some(req => req.friend_id === targetUsername.user_id); 
    
    if (alreadyPending) { 
      return res.status(409).send({ message: "Pending request already exists" }); 
    } 
    
    const { user_id_1, user_id_2 } = getOrderedIds(senderId, targetUsername.user_id); 
    const newRequest = await sendFriendRequest(user_id_1, user_id_2, senderId); 
    res.status(201).send(newRequest); 
  } catch (err) { 
    next(err); 
  } 
}); 

// 5. User Accepts a friend request
router.post('/accept/:senderId', getUserFromToken, async (req, res, next) => { 
  try { 
    const senderId = Number(req.params.senderId); 
    const receiverId = req.user.id; 
    if (receiverId === senderId) { 
      return res.status(400).send({ message: "You can't accept your own request" }); 
    } 
    const { user_id_1, user_id_2 } = getOrderedIds(senderId, receiverId); 
    const acceptFriend = await acceptFriendRequest(user_id_1, user_id_2, receiverId); 
    res.status(200).send(acceptFriend); 
  } catch (err) { 
    next(err); 
  } 
}); 

// 6. User Cancels a friend request
router.delete('/request/:senderId', getUserFromToken, async (req, res, next) => { 
  try { 
    const senderId = Number(req.params.senderId); 
    const receiverId = req.user.id; 
    const { user_id_1, user_id_2 } = getOrderedIds(senderId, receiverId); 
    const cancelFriend = await removeFromBlocklist(user_id_1, user_id_2, receiverId); 
    res.status(200).send(cancelFriend); 
  } catch (err) { 
    next(err); 
  } 
}); 

// 7. User denies a friend request (Should also work for removing a friendship)
router.post('/deny/:senderId', getUserFromToken, async (req, res, next) => { 
  try { 
    const senderId = Number(req.params.senderId); 
    const receiverId = req.user.id; 
    const { user_id_1, user_id_2 } = getOrderedIds(senderId, receiverId); 
    const denyRequest = await denyFriendRequest(user_id_1, user_id_2, receiverId); 
    res.status(200).send(denyRequest); 
  } catch (err) { 
    next(err); 
  } 
}); 

// 8. User blocks another user
router.post('/blocklist/:receiverId', getUserFromToken, async (req, res, next) => { 
  try { 
    const receiverId = Number(req.params.receiverId); 
    const senderId = req.user.id; 
    const { user_id_1, user_id_2 } = getOrderedIds(senderId, receiverId); 
    const blockedPerson = await blockUser(user_id_1, user_id_2, senderId); 
    console.log("Block user POST API call: ", blockedPerson); 
    res.status(200).send(blockedPerson); 
  } catch (err) { 
    next(err); 
  } 
}); 

// 9. User unblocks another user
router.delete('/blocklist/:receiverId', getUserFromToken, async (req, res, next) => { 
  try { 
    const receiverId = Number(req.params.receiverId); 
    const senderId = req.user.id; 
    const { user_id_1, user_id_2 } = getOrderedIds(senderId, receiverId); 
    const blockedPerson = await removeFromBlocklist(user_id_1, user_id_2); 
    console.log("unBlock user POST API call: ", blockedPerson); 
    res.status(200).send(blockedPerson); 
  } catch (err) { 
    next(err); 
  } 
}); 

export default router;
