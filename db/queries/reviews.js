import db from '#db/client';

/* === Game Reviews === */

export async function createGameReviews(
    gameReviewId,
    gameReview,
    gameId,
    gameTitle,
    genre,
    category,
    platformId,
    gamePlatformId,
    gamePlatforms,
    userId,
    createdAt,
    updatedAt,
    ratingValue
) {
    const sql = `
    INSERT INTO reviews (
        game_review_id,
        game_id,
        game_title,
        genre,
        category,
        platform_id,
        game_platform_id,
        game_platforms,
        user_id,
        created_at,
        updated_at,
        rating_value)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
    `;
    const { rows: [gameReviews] } = await db.query(
        sql,
        [gameReviewId,
        gameId,
        gameTitle,
        genre,
        category,
        platformId,
        gamePlatformId,
        gamePlatforms,
        userId,
        createdAt,
        updatedAt,
        ratingValue]
    );
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