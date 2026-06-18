import mongoose, { Schema, Document } from 'mongoose';

// Shared Location Schema
export interface IIpLocation extends Document {
  _id: number;
  country: string;
  stateprov?: string;
  city?: string;
}

const ipLocationSchema = new Schema<IIpLocation>(
  {
    _id: { type: Number, required: true },
    country: { type: String, required: true },
    stateprov: { type: String },
    city: { type: String },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

export const IpLocationAModel = mongoose.model<IIpLocation>('IpLocationA', ipLocationSchema, 'ip_locations_a');
export const IpLocationBModel = mongoose.model<IIpLocation>('IpLocationB', ipLocationSchema, 'ip_locations_b');

// Shared IP Range Schema
export interface IIpRange extends Document {
  t: 'ipv4' | 'ipv6';
  s: string; // hex start
  e: string; // hex end
  l: number; // location ID reference
}

const ipRangeSchema = new Schema<IIpRange>(
  {
    t: { type: String, required: true },
    s: { type: String, required: true },
    e: { type: String, required: true },
    l: { type: Number, required: true },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Compound index on type and end hex for fast range queries
ipRangeSchema.index({ t: 1, e: 1 });

export const IpRangeAModel = mongoose.model<IIpRange>('IpRangeA', ipRangeSchema, 'ip_ranges_a');
export const IpRangeBModel = mongoose.model<IIpRange>('IpRangeB', ipRangeSchema, 'ip_ranges_b');

// Metadata Schema
export interface IIpMetadata extends Document {
  key: string;
  updatedAt: Date;
  dbYearMonth: string;
}

const ipMetadataSchema = new Schema<IIpMetadata>(
  {
    key: { type: String, required: true, unique: true },
    updatedAt: { type: Date, required: true },
    dbYearMonth: { type: String, required: true },
  },
  {
    collection: 'ip_metadata',
    timestamps: false,
    versionKey: false,
  }
);

export const IpMetadataModel = mongoose.model<IIpMetadata>('IpMetadata', ipMetadataSchema);
