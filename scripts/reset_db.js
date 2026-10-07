const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://mailfortempusage_db_user:iWOS9kqpsY1H1HjR@stockportfolio.0cbqve4.mongodb.net/stocks-portfolio?retryWrites=true&w=majority';

async function resetDB() {
  try {
    console.log('Connecting to Database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const db = mongoose.connection.db;

    // Drop all collections
    const collections = await db.listCollections().toArray();
    for (const col of collections) {
      console.log(`Dropping collection: ${col.name}`);
      await db.dropCollection(col.name);
    }

    console.log('All collections dropped successfully.');

    // Define User Schema
    const UserSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      passwordHash: { type: String, required: true },
      role: { type: String, enum: ['ADMIN', 'USER'], default: 'USER' },
      currency: { type: String, enum: ['USD', 'INR', 'EUR', 'GBP'], default: 'INR' },
      createdByAdminId: { type: String },
      mustChangePassword: { type: Boolean, default: false },
      isDisabled: { type: Boolean, default: false },
    }, { timestamps: true });

    const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

    // Hash admin password
    const adminPassword = 'PasswordForAdmin@123!@#';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    // Create Master Admin User
    const adminUser = await UserModel.create({
      name: 'System Administrator',
      email: 'mailfortempusage@gmail.com',
      passwordHash: passwordHash,
      role: 'ADMIN',
      currency: 'INR',
      mustChangePassword: false,
      isDisabled: false,
    });

    console.log('Master Admin User Created Successfully:');
    console.log({
      id: adminUser._id.toString(),
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
    });

    await mongoose.disconnect();
    console.log('Disconnected. Database clean & reset complete!');
  } catch (err) {
    console.error('Reset DB Error:', err);
    process.exit(1);
  }
}

resetDB();
