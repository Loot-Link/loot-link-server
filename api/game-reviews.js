import express from 'express';
import requireBody from '#middleware/requireBody';
import requireUser from '#middleware/requireUser';
import { createToken } from '#utils/jwt';

import { 
    createGameReviews, 
    getGameReviews, 
    getGameReviewByGameId, 
    getGameReviewById 
    } from '#db/queries/reviews';

const gameReviewsRouter= express.Router();
export default gameReviewsRouter;

/* ====== Game Reviews ====== */
gameReviewsRouter.get('/', async (req, res) => {
    const gameReviews = await getGameReviews();
    res.send(gameReviews);
});

gameReviewsRouter.param('id', async (req, res, next, id) => {
    const gameReview = await getGameReviewById(id);
    if (!gameReview) {
        return res.status(404).send('Review not found');
    }

    req.gameReview= gameReview;
    next();
});

gameReviewsRouter.get('/:id', (req, res) => {
    res.send(gameReview);
});

gameReviewsRouter.get('/:id/games', async (req, res) => {
    const gameReview = await getGameReviewByGameId(req.games.id);
    res.send(gameReview);
});

gameReviewsRouter.use(requireUser);

gameReviewsRouter.post('/', requireBody([
    'reviewTitle',
    'gameReview', 
    'gameTitle', 
    'genre', 
    'category', 
    // 'gamePlatforms', 
    'ratingValue'
]), async (req, res) => {
    const {
        reviewTitle,
        gameReview,
        gameTitle,
        genre,
        category,
        // gamePlatforms,
        ratingValue
    } = req.body;

    const gameReviews = await createGameReviews(
        reviewTitle,
        gameReview,
        gameTitle,
        genre,
        category,
        // gamePlatforms,
        ratingValue,
        req.user.id);

    if (!req.user.id) {
        return res.status(403).send('You must be signed in to write a review.');
    }

    res.status(201).send(gameReview);
});