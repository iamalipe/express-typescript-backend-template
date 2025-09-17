import mongoose, { type Document, Schema } from 'mongoose';

export interface IBlog extends Document {
  topic: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>(
  {
    topic: {
      type: String,
      index: true,
    },
    content: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'Blog',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// blogSchema.index({
//   topic: 'text',
//   content: 'text',
// });

// productSchema.index(
//   { name: 'text', description: 'text', category: 'text' },
//   {
//     weights: { name: 10, description: 5, category: 3 },
//     name: 'product_text_index',
//   },
// );

export const BlogModel = mongoose.model<IBlog>('Blog', blogSchema);
