import mongoose, { type Document, Schema, Types } from 'mongoose';

export interface ICopyMe extends Document {
  name: string;
  description?: string;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const copyMeSchema = new Schema<ICopyMe>(
  {
    name: {
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
    collection: 'CopyMe',
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

export const CopyMeModel = mongoose.model<ICopyMe>('CopyMe', copyMeSchema);

// Virtual relationships for Artist
// artistSchema.virtual('albums', {
//   ref: 'Album',
//   localField: '_id',
//   foreignField: 'artistId',
// });
