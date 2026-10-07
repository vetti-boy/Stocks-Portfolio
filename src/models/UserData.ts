import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserData extends Document {
  userId: string;
  userEmail: string;
  payload: any;
  encryptedPayload?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserDataSchema: Schema = new Schema<IUserData>(
  {
    userId: { type: String, required: true },
    userEmail: { type: String, required: true },
    payload: { type: Schema.Types.Mixed },
    encryptedPayload: { type: String },
  },
  {
    timestamps: true,
  }
);

export const UserDataModel: Model<IUserData> =
  mongoose.models.UserData || mongoose.model<IUserData>('UserData', UserDataSchema);
