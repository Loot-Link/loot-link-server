import express from 'express';
import requireBody from '#middleware/requireBody';
import requireUser from '#middleware/requireUser';
import { createToken } from '#utils/jwt';

const sessionReviewsRouter = express.Router();
export default sessionReviewsRouter;