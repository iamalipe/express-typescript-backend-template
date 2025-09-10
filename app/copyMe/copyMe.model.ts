import mongoose, { type Document, Schema, Types } from 'mongoose';

export interface ICopyMe extends Document {
  stringField: string;
  numberField: number;
  floatField: number;
  enumField: 'A' | 'B' | 'C';
  bigStringField: string;
  arrayField: string[];
  dateField: Date;
  datetimeField: Date;
  objectField: {
    key1: string;
    key2: number;
  };
  arrayOfObjectsField: Array<{
    name: string;
    value: number;
  }>;
  mixedField: any;
  booleanField: boolean;
  bufferField: Buffer;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const copyMeSchema = new Schema<ICopyMe>(
  {
    stringField: {
      type: String,
    },
    numberField: {
      type: Number,
    },
    floatField: {
      type: Number,
    },
    enumField: {
      type: String,
      enum: ['A', 'B', 'C'],
    },
    bigStringField: {
      type: String,
    },
    arrayField: {
      type: [String],
    },
    dateField: {
      type: Date,
    },
    datetimeField: {
      type: Date,
    },
    objectField: {
      type: {
        key1: String,
        key2: Number,
      },
    },
    arrayOfObjectsField: [
      {
        name: String,
        value: Number,
      },
    ],
    mixedField: {
      type: Schema.Types.Mixed,
    },
    booleanField: {
      type: Boolean,
    },
    bufferField: {
      type: Buffer,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    collection: 'CopyMe',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

export const CopyMeModel = mongoose.model<ICopyMe>('CopyMe', copyMeSchema);
