import request from 'supertest';
import bcrypt from 'bcrypt';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import app from '#app';
import db from '#db/client';
import { createToken } from '#utils/jwt';
import { createUser } from '#db/queries/users';

let authToken;
let userId;
let gameId;
let sessionId;

beforeAll(async () => {
  await db.connect();
  await db.query('BEGIN');

  const testUserEmail = `review-test-${Date.now()}@example.com`;
  const testUserName = `reviewuser${Date.now()}`;
  const user = await createUser(testUserEmail, testUserName, 'password123');
  userId = user.user_id;
  authToken = createToken({ id: userId });

  const gameInsert = await db.query(
    `INSERT INTO games (game_title, slug, game_description) VALUES ($1, $2, $3) RETURNING *`,
    ['Review Test Game', `review-test-game-${Date.now()}`, 'A game for review tests.']
  );
  gameId = gameInsert.rows[0].game_id;

  const sessionInsert = await db.query(
    `INSERT INTO sessions (game_id, host_user_id, session_title, session_description) VALUES ($1, $2, $3, $4) RETURNING *`,
    [gameId, userId, 'Review Test Session', 'A session for review tests.']
  );
  sessionId = sessionInsert.rows[0].session_id;
});

beforeEach(async () => {
  await db.query('SAVEPOINT test_savepoint');
});

afterEach(async () => {
  await db.query('ROLLBACK TO test_savepoint');
});

afterAll(async () => {
  await db.query('ROLLBACK');
  await db.end();
});

describe('Game review routes', () => {
  it('returns 401 when creating a game review without auth', async () => {
    const response = await request(app)
      .post('/api/game-reviews')
      .send({ reviewTitle: 'Bad', gameReview: 'Bad body', gameId, ratingValue: 3 });

    expect(response.status).toBe(401);
  });

  it('returns 400 when creating a game review with invalid body', async () => {
    const response = await request(app)
      .post('/api/game-reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it('creates, updates, and deletes a game review successfully', async () => {
    const createResponse = await request(app)
      .post('/api/game-reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reviewTitle: 'Test Review',
        gameReview: 'I enjoyed this test game.',
        gameId,
        ratingValue: 5,
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      review_title: 'Test Review',
      game_review: 'I enjoyed this test game.',
      game_id: gameId,
      rating_value: 5,
      user_id: userId,
    });

    const reviewId = createResponse.body.game_review_id;

    const updateResponse = await request(app)
      .patch(`/api/game-reviews/${reviewId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reviewTitle: 'Updated Review',
        gameReview: 'This review has been updated.',
        ratingValue: 4,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.updatedReview).toMatchObject({
      review_title: 'Updated Review',
      game_review: 'This review has been updated.',
      rating_value: 4,
      user_id: userId,
    });

    const deleteResponse = await request(app)
      .delete(`/api/game-reviews/${reviewId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.deletedReview).toBeDefined();
    expect(deleteResponse.body.deletedReview.game_review_id).toBe(reviewId);
  });

  it('creates a vote for a review and then deletes it', async () => {
    const createResponse = await request(app)
      .post('/api/game-reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reviewTitle: 'Vote Test',
        gameReview: 'Vote route works.',
        gameId,
        ratingValue: 4,
      });

    expect(createResponse.status).toBe(201);
    const reviewId = createResponse.body.game_review_id;

    const voteResponse = await request(app)
      .post(`/api/game-reviews/${reviewId}/vote`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ voteValue: 1 });

    expect(voteResponse.status).toBe(200);
    expect(voteResponse.body.vote).toMatchObject({
      game_review_id: reviewId,
      user_id: userId,
      vote_value: 1,
    });
    expect(voteResponse.body.totals).toMatchObject({ score: 1, upvotes: 1, downvotes: 0 });

    const deleteVoteResponse = await request(app)
      .delete(`/api/game-reviews/${reviewId}/vote`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(deleteVoteResponse.status).toBe(200);
    expect(deleteVoteResponse.body.deleted).toBeDefined();
    expect(deleteVoteResponse.body.totals).toMatchObject({ score: 0, upvotes: 0, downvotes: 0 });
  });

  it('returns vote totals without auth and userVote null', async () => {
    const createResponse = await request(app)
      .post('/api/game-reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reviewTitle: 'Vote Total Test',
        gameReview: 'Testing vote totals without auth.',
        gameId,
        ratingValue: 3,
      });

    expect(createResponse.status).toBe(201);
    const reviewId = createResponse.body.game_review_id;

    const votesResponse = await request(app)
      .get(`/api/game-reviews/${reviewId}/votes`);

    expect(votesResponse.status).toBe(200);
    expect(votesResponse.body).toMatchObject({
      score: 0,
      upvotes: 0,
      downvotes: 0,
      userVote: null,
    });
  });

  it('returns vote totals with auth and includes current user vote', async () => {
    const createResponse = await request(app)
      .post('/api/game-reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reviewTitle: 'Vote Total Auth Test',
        gameReview: 'Testing vote totals with auth.',
        gameId,
        ratingValue: 3,
      });

    expect(createResponse.status).toBe(201);
    const reviewId = createResponse.body.game_review_id;

    await request(app)
      .post(`/api/game-reviews/${reviewId}/vote`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ voteValue: 1 });

    const votesResponse = await request(app)
      .get(`/api/game-reviews/${reviewId}/votes`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(votesResponse.status).toBe(200);
    expect(votesResponse.body).toMatchObject({
      score: 1,
      upvotes: 1,
      downvotes: 0,
      userVote: 1,
    });
  });

  it('fetches the game details for a review', async () => {
    const createResponse = await request(app)
      .post('/api/game-reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reviewTitle: 'Game Link Test',
        gameReview: 'Testing game details endpoint.',
        gameId,
        ratingValue: 4,
      });

    expect(createResponse.status).toBe(201);
    const reviewId = createResponse.body.game_review_id;

    const gameResponse = await request(app)
      .get(`/api/game-reviews/${reviewId}/games`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(gameResponse.status).toBe(200);
    expect(gameResponse.body).toMatchObject({
      game_id: gameId,
      game_title: 'Review Test Game',
    });
  });
});

describe('Session review routes', () => {
  it('returns 401 when creating a session review without auth', async () => {
    const response = await request(app)
      .post('/api/session-reviews')
      .send({ session_id: sessionId, session_rating: 4, member_ratings: [] });

    expect(response.status).toBe(401);
  });

  it('returns 400 when creating a session review with invalid body', async () => {
    const response = await request(app)
      .post('/api/session-reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it('creates, fetches, updates, and lists session reviews', async () => {
    const createResponse = await request(app)
      .post('/api/session-reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        session_id: sessionId,
        session_rating: 5,
        member_ratings: [{ user_id: userId, rating: 5 }],
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      session_id: sessionId,
      user_id: userId,
      session_rating: 5,
    });

    const reviewId = createResponse.body.session_review_id;

    const getCurrentUserReview = await request(app)
      .get(`/api/session-reviews/${sessionId}/user`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getCurrentUserReview.status).toBe(200);
    expect(getCurrentUserReview.body).toMatchObject({
      session_review_id: reviewId,
      session_id: sessionId,
      user_id: userId,
      session_rating: 5,
    });

    const updateResponse = await request(app)
      .put(`/api/session-reviews/${reviewId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        session_rating: 4,
        member_ratings: [{ user_id: userId, rating: 4 }],
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toMatchObject({
      session_review_id: reviewId,
      session_id: sessionId,
      user_id: userId,
      session_rating: 4,
    });

    const listResponse = await request(app)
      .get(`/api/session-reviews/${sessionId}`);

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body)).toBe(true);
    expect(listResponse.body.some((review) => review.session_review_id === reviewId)).toBe(true);
  });

  it('returns session reviews list for session without auth', async () => {
    const response = await request(app)
      .get(`/api/session-reviews/${sessionId}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
