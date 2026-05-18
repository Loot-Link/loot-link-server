import db from '#db/client';

/* === Game Reviews === */

export async function createGameReviews(
    reviewTitle,
    gameReview,
    gameId,
    ratingValue,
    userId
) {
    const sql = `
    INSERT INTO game_reviews (
        review_title,
        game_review,
        game_id,
        rating_value,
        user_id
        )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `;
    try {
    const { rows: [gameReviews] } = await db.query(
        sql,
        [reviewTitle,
        gameReview,
        gameId,
        ratingValue,
        userId
        ]
    );
    } catch (e) {
        console.error(e);
        throw new Error("Failed to post review.")
    }
};

export async function getGameReviews() {
    const sql = `
    SELECT *
    FROM game_reviews
    `;
    const { rows: gameReviews } = await db.query(sql);
    return gameReviews;
}

export async function getGameReviewById(gameReviewId) {
    const sql = `
    SELECT *
    FROM game_reviews
    WHERE game_review_id = $1
    `;
    const { rows: [gameReview] } = await db.query(sql, gameReviewId);
}

export async function getGameReviewByGameId(gameId) {
    const sql = `
    SELECT games.*
    FROM game_reviews
    JOIN games ON game_reviews.game_id = games.game_id
    WHERE games.game_id = $1
    `;
    const { rows: [gameReveiws] } = await db.query(sql, [gameId]);
    return gameReviews;
};

export async function getMyReview(userId) {
    const sql = `
    SELECT *
    FROM game_reviews
    WHERE user_id = $1
    `;
    const { rows: [myGameReview] } = await db.query(sql, [userId]);
    return myGameReview;
};

//recent reviews?

/* ====== Session Reviews ====== */

// export async function createSessionReview(
//     sessionReviewId,
//     sessionId,
//     userId,
//     ratingValue
// ) {
//     const sql = `
//     INSERT INTO session_reviews (
//         session_review_id,
//         session_id,
//         user_id,
//         rating_value
//     )
//     VALUES ($1, $2, $3, $4)
//     RETURNING *
//     `;
//     const { rows: [sessionReview] } = await db.query(sql, [
//         sessionReviewId,
//         sessionId,
//         userId,
//         ratingValue
//     ]);
//     return sessionReview;
// };

// export async function getSessionReviews() {
//     const sql = `
//     SELECT *
//     FROM session_reviews
//     `;
//     const { rows: sessionReviews } = await db.query(sql);
//     return sessionReviews;
// };

// export async function getSessionReviewById(sessionReviewId) {
//     const sql = `
//     SELECT *
//     FROM session_reviews
//     WHERE session_id = $1
//     `;
//     const { rows: [sessionReview] } = await db.query(sql, [sessionReviewId]);
//     return sessionReview;
// };

/* ====== My Reviews ====== */