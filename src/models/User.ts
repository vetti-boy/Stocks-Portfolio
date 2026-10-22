import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  avatar?: string;
  role: 'ADMIN' | 'USER';
  currency: 'USD' | 'INR' | 'EUR' | 'GBP';
  createdByAdminId?: string;
  mustChangePassword?: boolean;
  isDisabled?: boolean;
  otpCode?: string;
  otpExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: false },
    googleId: { type: String, sparse: true, index: true },
    avatar: { type: String },
    role: { type: String, enum: ['ADMIN', 'USER'], default: 'USER' },
    currency: { type: String, enum: ['USD', 'INR', 'EUR', 'GBP'], default: 'INR' },
    createdByAdminId: { type: String },
    mustChangePassword: { type: Boolean, default: false },
    isDisabled: { type: Boolean, default: false },
    otpCode: { type: String },
    otpExpiresAt: { type: Date },
  },
  {
    timestamps: true,
    bufferCommands: false,
  }
);

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

