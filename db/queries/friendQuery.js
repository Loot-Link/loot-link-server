import db from "#db/client";

//--------------------Friend List Section ----------//

export async function getPendingFriendRequests(userId){
    //If sender_id is user_id, then receiver_id is userId --get the id and name of other user
    //if receiver_id is user_id then sender_id is userId  --get the id and name of other user
    //WHERE: get only rows where userId is sender or receiver and the status is pending.  
    const sql = `
    SELECT 
      f.*,
      u.username AS friend_username,
      u.user_id AS friend_id
    FROM friendships f
    JOIN users u ON u.user_id = 
        (
        CASE
            WHEN f.sender_id = $1 THEN f.receiver_id
            ELSE f.sender_id
        END
        )
    WHERE (f.sender_id = $1 OR f.receiver_id = $1)
    AND f.status = 'pending'
  `;
  const { rows } = await db.query(sql, [userId]);
  return rows;
}

export async function getFriendList(userId){
  const sql = `
    SELECT u.user_id, u.username 
    FROM friendships f
    JOIN users u ON u.user_id = (
      CASE
        WHEN f.sender_id = $1 THEN f.receiver_id
        ELSE f.sender_id
      END
    )
    WHERE (f.sender_id = $1 OR f.receiver_id = $1)
    AND f.status = 'accepted';
  `;
  const { rows } = await db.query(sql, [userId]);
  return rows;
}
//This creates a new relationship if one does not exist, however, if a relationship does
//already exist, then it UPDATES that relationship, and resets sender/receiver to most recent interaction
export async function sendFriendRequest(senderId, receiverId){
  const sql = `
    INSERT INTO friendships (sender_id, receiver_id, status)
    VALUES ($1, $2, 'pending')
    ON CONFLICT (sender_id, receiver_id) 
    DO UPDATE SET
        sender_id = EXCLUDED.sender_id,
        receiver_id = EXCLUDED.receiver_id,
        status = 'pending'
    WHERE friendships.status = 'denied'
    RETURNING *;
  `;
  const { rows } = await db.query(sql, [senderId, receiverId]);
  return rows[0];
}

export async function acceptFriendRequest(senderId, receiverId){
  const sql = `
    UPDATE friendships
    SET 
      status = 'accepted',
      updated_at = NOW()
    WHERE 
      sender_id = $1 AND 
      receiver_id = $2 AND
      STATUS = 'pending'
    RETURNING *;
  `;
  const { rows } = await db.query(sql, [senderId, receiverId]);
  return rows[0];
}

export async function denyFriendRequest(senderId, receiverId){
  const sql = `
    UPDATE friendships
    SET
        status = 'denied',
        updated_at = NOW()
    WHERE 
        sender_id = $1 AND
        receiver_id = $2
    RETURNING *; 
  `;
  const { rows } = await db.query(sql, [senderId, receiverId]);
  return rows[0];
}

export async function blockUser(senderId, receiverId){
    const sql = `
    INSERT INTO friendships (sender_id, receiver_id, status)
    VALUES ($1, $2, 'blocked')
    ON CONFLICT (sender_id, receiver_id) 
    DO UPDATE SET
        status = 'blocked'
    RETURNING *;
    `;
    const { rows } = await db.query(sql, [senderId, receiverId]);
    return rows[0];
}
//Very similar to getpending and getfriends
//get the  
//This might actually need to be inverted depending on who I'm calling as "sender" and "receiver".
//I think the sender for blocklist should be the user who clicks the block button. receiver is the one "blocked"
export async function getBlockList(userId) {
      const sql = `
    SELECT u.user_id, u.username 
    FROM friendships f
    JOIN users u ON u.user_id = (
      CASE
        WHEN f.receiver_id = $1 THEN f.sender_id
        ELSE f.receiver_id
      END
    )
    WHERE (f.sender_id = $1 OR f.receiver_id = $1)
    AND f.status = 'blocked';
  `;
  const { rows } = await db.query(sql, [userId]);
  return rows;    
}