import { Request, Response } from 'express';
import { generateText, streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { AiChatModel, AiChatMessageModel } from './chat.model';
import { logger } from '../../utils/logger';

/**
 * Helper to generate a short summary title for a chat thread asynchronously.
 */
const generateAndSaveTitle = async (chatId: string, firstMessage: string) => {
  try {
    const prompt = `Generate a very short 2-to-4 word title summarizing this user query. Do not use quotes, punctuation, markdown, or conversational text. Return only the title. Query: "${firstMessage}"`;
    const model = google('gemini-1.5-flash');
    const result = await generateText({
      model,
      prompt,
    });
    const title = result.text.trim().replace(/^["']|["']$/g, '');
    if (title) {
      await AiChatModel.findByIdAndUpdate(chatId, { title });
      logger.info(`Generated title for chat ${chatId}: "${title}"`);
    }
  } catch (err: any) {
    logger.error(`Failed to generate chat title in background for ${chatId}: ${err.message}`);
  }
};

// POST /chat/temp
const tempChat = async (req: Request, res: Response) => {
  const { messages, model: reqModel } = req.body;
  const modelName = reqModel || 'gemini-1.5-flash';

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  try {
    const result = streamText({
      model: google(modelName),
      messages,
    });

    for await (const chunk of result.textStream) {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }
  } catch (error: any) {
    logger.error(`Error in temp chat stream: ${error.message}`);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
  } finally {
    res.write('data: [DONE]\n\n');
    res.end();
  }
};

// POST /chat/new
const createChat = async (req: Request, res: Response) => {
  const { message, model: reqModel } = req.body;
  const modelName = reqModel || 'gemini-1.5-flash';
  const userId = req.user.id;

  const chat = await AiChatModel.create({
    userId,
    title: 'New Chat',
  });

  if (!message) {
    res.status(201).json({
      success: true,
      data: chat,
      message: 'success',
    });
    return;
  }

  // If a message is sent, stream the SSE reply and store messages.
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  try {
    // 1. Save user message
    await AiChatMessageModel.create({
      chatId: chat._id,
      role: 'user',
      content: message,
    });

    // 2. Trigger title generation in the background
    generateAndSaveTitle((chat._id as any).toString(), message);

    // 3. Write chat identification event first
    res.write(`data: ${JSON.stringify({ chatId: chat._id, title: 'New Chat' })}\n\n`);

    // 4. Stream response
    const result = streamText({
      model: google(modelName),
      messages: [{ role: 'user', content: message }],
    });

    let fullResponse = '';
    for await (const chunk of result.textStream) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    // 5. Save assistant reply in database
    await AiChatMessageModel.create({
      chatId: chat._id,
      role: 'assistant',
      content: fullResponse,
    });
  } catch (error: any) {
    logger.error(`Error in create chat stream: ${error.message}`);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
  } finally {
    res.write('data: [DONE]\n\n');
    res.end();
  }
};

// POST /chat/:id
const continueChat = async (req: Request, res: Response) => {
  const chatId = req.params.id;
  const { message, model: reqModel } = req.body;
  const modelName = reqModel || 'gemini-1.5-flash';

  const chat = await AiChatModel.findOne({ _id: chatId, userId: req.user.id });
  if (!chat) {
    throw new AppError('Chat not found', { status: 404 });
  }

  // 1. Save user message
  await AiChatMessageModel.create({
    chatId: chat._id,
    role: 'user',
    content: message,
  });

  // If chat is still using default title, regenerate title from this prompt in background
  if (chat.title === 'New Chat') {
    generateAndSaveTitle((chat._id as any).toString(), message);
  }

  // 2. Set headers for SSE stream
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  try {
    // 3. Fetch full context history
    const history = await AiChatMessageModel.find({ chatId: chat._id }).sort({ createdAt: 1 });
    const sdkMessages = history.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    // 4. Stream response
    const result = streamText({
      model: google(modelName),
      messages: sdkMessages,
    });

    let fullResponse = '';
    for await (const chunk of result.textStream) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    // 5. Save assistant reply in database
    await AiChatMessageModel.create({
      chatId: chat._id,
      role: 'assistant',
      content: fullResponse,
    });
  } catch (error: any) {
    logger.error(`Error in continue chat stream: ${error.message}`);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
  } finally {
    res.write('data: [DONE]\n\n');
    res.end();
  }
};

// GET /chat
const listChats = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const total = await AiChatModel.countDocuments({ userId: req.user.id });
  const data = await AiChatModel.find({ userId: req.user.id })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    message: 'success',
  });
};

// GET /chat/:id
const getChat = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const chat = await AiChatModel.findOne({ _id: req.params.id, userId: req.user.id });
  if (!chat) {
    throw new AppError('Chat not found', { status: 404 });
  }

  const total = await AiChatMessageModel.countDocuments({ chatId: chat._id });
  const messages = await AiChatMessageModel.find({ chatId: chat._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    data: {
      chat,
      messages: messages.reverse(), // reverse to chronologically order the slice
    },
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    message: 'success',
  });
};

// PUT /chat/:id
const updateChat = async (req: Request, res: Response) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    throw new AppError('Title is required', { status: 400 });
  }

  const chat = await AiChatModel.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { title: title.trim() },
    { new: true },
  );

  if (!chat) {
    throw new AppError('Chat not found', { status: 404 });
  }

  res.status(200).json({
    success: true,
    data: chat,
    message: 'success',
  });
};

// DELETE /chat/:id
const deleteChat = async (req: Request, res: Response) => {
  const chat = await AiChatModel.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!chat) {
    throw new AppError('Chat not found', { status: 404 });
  }

  // Cleanup related messages
  await AiChatMessageModel.deleteMany({ chatId: chat._id });

  res.status(200).json({
    success: true,
    data: null,
    message: 'success',
  });
};

export default {
  tempChat,
  createChat,
  continueChat,
  listChats,
  getChat,
  updateChat,
  deleteChat,
};
