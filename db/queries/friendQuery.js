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

export async function sendFriendRequest(senderId, receiverId){
  const sql = `
    INSERT INTO friendships (sender_id, receiver_id, status)
    VALUES ($1, $2, 'pending')
    ON CONFLICT (sender_id, receiver_id) DO NOTHING
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