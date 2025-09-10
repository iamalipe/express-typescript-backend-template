import mongoose, { type Document, Schema, Types } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  category:
    | 'Electronics'
    | 'Clothing'
    | 'Books'
    | 'Home & Garden'
    | 'Sports'
    | 'Beauty'
    | 'Automotive'
    | 'Toys'
    | 'Food & Beverage'
    | 'Health';
  price: number;
  description: string;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [255, 'Product name cannot exceed 255 characters'],
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      enum: {
        values: [
          'Electronics',
          'Clothing',
          'Books',
          'Home & Garden',
          'Sports',
          'Beauty',
          'Automotive',
          'Toys',
          'Food & Beverage',
          'Health',
        ],
        message: 'Invalid product category',
      },
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
      validate: {
        validator: function (value: number) {
          return Number.isFinite(value) && value >= 0;
        },
        message: 'Price must be a valid positive number',
      },
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      maxlength: [1000, 'Product description cannot exceed 1000 characters'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'Product',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Index for better query performance
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ userId: 1 });

export const ProductModel = mongoose.model<IProduct>('Product', productSchema);
