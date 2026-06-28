import mongoose, { type Document, Schema, Types } from 'mongoose';

export interface IAiChat extends Document {
  userId: Types.ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAiChatMessage extends Document {
  chatId: Types.ObjectId;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const aiChatSchema = new Schema<IAiChat>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Chat',
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'AiChat',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const aiChatMessageSchema = new Schema<IAiChatMessage>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: 'AiChat',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'AiChatMessage',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Optimize search by sorting messages by creation time
aiChatMessageSchema.index({ chatId: 1, createdAt: -1 });

export const AiChatModel = mongoose.model<IAiChat>('AiChat', aiChatSchema);
export const AiChatMessageModel = mongoose.model<IAiChatMessage>('AiChatMessage', aiChatMessageSchema);
