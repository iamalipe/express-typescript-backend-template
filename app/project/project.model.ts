import mongoose, { type Document, Schema, Types } from 'mongoose';

export interface IProject extends Document {
  name: string;
  slug: string;
  description?: string;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
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
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'Project',
    // toJSON: { virtuals: true },
    // toObject: { virtuals: true },
  },
);

// Virtual relationships for Genre
// genreSchema.virtual('songs', {
//   ref: 'Song',
//   localField: '_id',
//   foreignField: 'genreId',
// });

export const ProjectModel = mongoose.model<IProject>('Project', projectSchema);

// Virtual relationships for Artist
// artistSchema.virtual('albums', {
//   ref: 'Album',
//   localField: '_id',
//   foreignField: 'artistId',
// });
