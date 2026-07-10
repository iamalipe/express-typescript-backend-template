import mongoose, { type Document, Schema, Types } from 'mongoose';

export interface ICopyMe extends Document {
  stringRequired: string;
  stringTextarea: string;
  stringOptional?: string;
  stringTextareaOptional?: string;

  numberDecimal: number;
  numberInt: number;
  numberSlider: number;

  dateOnly: Date;
  dateTime: Date;
  dateRangeStart: Date;
  dateRangeEnd: Date;
  dateTimeRangeStart: Date;
  dateTimeRangeEnd: Date;

  booleanSwitch: boolean;
  enumString: 'Active' | 'Inactive' | 'Block' | 'Pending';
  customOptionalString: string;

  fileImage?: string;
  fileDoc?: string;

  // Structured fields
  singleArray: string[];
  arrayObject: Array<{ label: string; value: string }>;
  twoDArray: number[][];
  nestedObject: {
    title: string;
    priority: number;
  };

  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const copyMeSchema = new Schema<ICopyMe>(
  {
    stringRequired: { type: String, required: true },
    stringTextarea: { type: String, required: true },
    stringOptional: { type: String },
    stringTextareaOptional: { type: String },

    numberDecimal: { type: Number, required: true },
    numberInt: { type: Number, required: true },
    numberSlider: { type: Number, required: true },

    dateOnly: { type: Date, required: true },
    dateTime: { type: Date, required: true },
    dateRangeStart: { type: Date, required: true },
    dateRangeEnd: { type: Date, required: true },
    dateTimeRangeStart: { type: Date, required: true },
    dateTimeRangeEnd: { type: Date, required: true },

    booleanSwitch: { type: Boolean, required: true, default: false },
    enumString: {
      type: String,
      required: true,
      enum: ['Active', 'Inactive', 'Block', 'Pending'],
      default: 'Pending',
    },
    customOptionalString: { type: String, required: true },

    fileImage: { type: String },
    fileDoc: { type: String },

    singleArray: { type: [String], default: [] },
    arrayObject: [
      {
        label: { type: String, required: true },
        value: { type: String, required: true },
        _id: false,
      },
    ],
    twoDArray: { type: [[Number]], default: [] },
    nestedObject: {
      title: { type: String, required: true },
      priority: { type: Number, required: true },
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'CopyMe',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Define compound indexes for uniqueness checks and queries
copyMeSchema.index({ userId: 1, stringRequired: 1 });

// Define text search index on text fields
copyMeSchema.index({
  stringRequired: 'text',
  stringTextarea: 'text',
  stringOptional: 'text',
});

export const CopyMeModel = mongoose.model<ICopyMe>('CopyMe', copyMeSchema);
