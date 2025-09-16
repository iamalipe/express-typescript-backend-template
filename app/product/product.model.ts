import mongoose, { type Document, Schema, Types } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  category: string;
  price: number;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      // index: true,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
      // index: true,
    },
    price: {
      type: Number,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'Product',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

productSchema.index({
  name: 'text',
  description: 'text',
  category: 'text',
});

// productSchema.index(
//   { name: 'text', description: 'text', category: 'text' },
//   {
//     weights: { name: 10, description: 5, category: 3 },
//     name: 'product_text_index',
//   },
// );

export const ProductModel = mongoose.model<IProduct>('Product', productSchema);
