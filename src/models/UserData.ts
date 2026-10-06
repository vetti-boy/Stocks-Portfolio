import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserData extends Document {
  userId: string;
  userEmail: string;
  encryptedPayload: string; // AES-256-GCM encrypted string format "iv:authTag:cipher"
  createdAt: Date;
  updatedAt: Date;
}

const UserDataSchema: Schema = new Schema<IUserData>(
  {
    userId: { type: String, required: true, unique: true },
    userEmail: { type: String, required: true },
    encryptedPayload: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const UserDataModel: Model<IUserData> =
  mongoose.models.UserData || mongoose.model<IUserData>('UserData', UserDataSchema);
