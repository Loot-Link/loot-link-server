import express from 'express';
import requireBody from '#middleware/requireBody';
import requireUser from '#middleware/requireUser';
import { createToken } from '#utils/jwt';

import { 
    createGameReviews, 
    getGameReviews, 
    getGameReviewByGameId, 
    getGameReviewById, 
    getMyReview,
    incrementGameReviewViewCount,
    deleteGameReviewById
    } from '#db/queries/reviews';





const gameReviewsRouter= express.Router();
export default gameReviewsRouter;

/* ====== Game Reviews ====== */

// Register param handler FIRST
gameReviewsRouter.param('id', async (req, res, next, game_review_id) => {
    const gameReview = await getGameReviewById(game_review_id);
    if (!gameReview) {
        return res.status(404).send('Review not found');
    }

    req.gameReview= gameReview;
    next();
});

// Then specific routes that use the param
gameReviewsRouter.get('/:id/games', async (req, res) => {
    const game = await getGameReviewByGameId(req.gameReview.game_id);
    res.send(game);
});

gameReviewsRouter.get('/:id', async (req, res) => {
    const gameReview = await getGameReviewById(req.params.id);
    await incrementGameReviewViewCount(req.params.id);
    res.send(gameReview);
});

// Then the list route (least specific)
gameReviewsRouter.get('/', async (req, res) => {
    const gameReviews = await getGameReviews();
    res.send(gameReviews);
});

gameReviewsRouter.use(requireUser);

gameReviewsRouter.delete('/:id', async (req, res, next) => {
    const userId = req.user.user_id;

    if (req.gameReview.user_id !== userId) {
        return res.status(403).send('You are not authorized to delete this review.');
    }

    try {
        const deletedReview = await deleteGameReviewById(req.params.id, userId);
        if (!deletedReview) {
            return res.status(404).send('Review not found.');
        }

        res.send({ message: 'Review deleted successfully.', deletedReview });
    } catch (err) {
        next(err);
    }
});

gameReviewsRouter.post('/', requireBody([
    'reviewTitle',
    'gameReview', 
    'gameId',
    'ratingValue'
]), async (req, res, next) => {
    const user_id = req.user.user_id
    const {
        reviewTitle,
        gameReview,
        gameId,
        ratingValue
    } = req.body;

    if (!user_id) {
        return res.status(403).send('You must be signed in to write a review.');
    }

    try {
        const newGameReview = await createGameReviews(
            reviewTitle,
            gameReview,
            gameId,
            ratingValue,
            user_id
        );

        res.status(201).json(newGameReview);
    } catch (err) {
        next(err);
    }
});



// gameReviewsRouter.get('/myReviews', async (req, res) => {
//     const myReviews = await getMyReview(req.user.id);
//     res.send(myReviews);
// });