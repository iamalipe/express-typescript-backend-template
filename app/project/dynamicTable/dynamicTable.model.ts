import mongoose, { type Document, Schema, Types } from 'mongoose';

export interface IDynamicTableField {
  name: string;
  id: string;
  type: 'String' | 'Number' | 'Boolean';
  isRequired: boolean;
  description?: string;
  defaultValue?: any;
}

export interface IDynamicTable extends Document {
  name: string;
  slug: string;
  description?: string;
  isCollection: boolean;
  fields: IDynamicTableField[];
  projectId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const dynamicTableFieldSchema = new Schema<IDynamicTableField>(
  {
    name: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['String', 'Number', 'Boolean'],
      required: true,
    },
    isRequired: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
    },
    defaultValue: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: false,
    _id: false,
  },
);

const dynamicTableSchema = new Schema<IDynamicTable>(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    isCollection: {
      type: Boolean,
      default: false,
    },
    fields: {
      type: [dynamicTableFieldSchema],
      default: [],
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'DynamicTable',
  },
);

export const DynamicTableModel = mongoose.model<IDynamicTable>(
  'DynamicTable',
  dynamicTableSchema,
);
