#!/usr/bin/env node
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

const UserSchema = new mongoose.Schema(
  {
    UserName: { type: String, required: true, unique: true },
    Password: { type: String, required: true },
    role: { type: String, enum: ["admin", "enterer"], default: "enterer" }
  },
  { timestamps: true }
);

const User = mongoose.models.users || mongoose.model('users', UserSchema);

async function setupAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('Connected to MongoDB');

    // Step 1: Set all existing users to "enterer" role (if they don't have a role)
    const updateResult = await User.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'enterer' } }
    );
    console.log(`✓ Updated ${updateResult.modifiedCount} existing users to "enterer" role`);

    // Step 2: Check if ladka123 already exists
    const existingAdmin = await User.findOne({ UserName: 'ladka123' });
    
    if (existingAdmin) {
      console.log('✓ User "ladka123" already exists');
      // Update to admin role and reset password
      const hashedPassword = await bcrypt.hash('ladka123', 10);
      existingAdmin.Password = hashedPassword;
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('✓ Updated "ladka123" to admin role with new password');
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash('ladka123', 10);
      const newAdmin = await User.create({
        UserName: 'ladka123',
        Password: hashedPassword,
        role: 'admin'
      });
      console.log('✓ Created new admin user "ladka123"');
    }

    // Step 3: Show summary
    const adminCount = await User.countDocuments({ role: 'admin' });
    const entererCount = await User.countDocuments({ role: 'enterer' });
    
    console.log('\n=== Summary ===');
    console.log(`Total admins: ${adminCount}`);
    console.log(`Total enterers: ${entererCount}`);
    console.log('\nAdmin credentials:');
    console.log('Username: ladka123');
    console.log('Password: ladka123');
    console.log('\nSetup complete! ✓');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

setupAdmin();
