import express from 'express';
import { validate } from '../../middlewares/validate.middlewares';
import controller from './chat.controller';
import {
  continueChatSchema,
  createChatSchema,
  getChatSchema,
  listChatsSchema,
  tempChatSchema,
} from './chat.schema';

const router = express.Router();

// SSE streams
router.post('/temp', validate(tempChatSchema), controller.tempChat);
router.post('/new', validate(createChatSchema), controller.createChat);
router.post('/:id', validate(continueChatSchema), controller.continueChat);

// REST operations
router.get('/', validate(listChatsSchema), controller.listChats);
router.get('/:id', validate(getChatSchema), controller.getChat);
router.put('/:id', validate(getChatSchema), controller.updateChat);
router.delete('/:id', validate(getChatSchema), controller.deleteChat);

export default router;
