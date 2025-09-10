import mongoose, { type Document, type Types, Schema } from 'mongoose';

export interface IChangeLog extends Document {
  module: string;
  title: string;
  newValue: any;
  oldValue: any;
  formattedNewValue: string;
  formattedOldValue: string;
  referenceId?: Types.ObjectId;
  referenceModel?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const changeLogSchema = new Schema<IChangeLog>(
  {
    module: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    newValue: {
      type: Schema.Types.Mixed,
      required: true,
    },
    oldValue: {
      type: Schema.Types.Mixed,
      required: true,
    },
    formattedNewValue: {
      type: String,
      default: 'N/A',
    },
    formattedOldValue: {
      type: String,
      default: 'N/A',
    },
    referenceId: {
      type: Schema.Types.ObjectId,
    },
    referenceModel: {
      type: String,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'ChangeLog',
  },
);

export const ChangeLogModel = mongoose.model<IChangeLog>(
  'ChangeLog',
  changeLogSchema,
);
