import express from 'express';
import { handleAgentQuery } from './ai.controller';

const router = express.Router();

router.post('/agent', handleAgentQuery);

export default router;
