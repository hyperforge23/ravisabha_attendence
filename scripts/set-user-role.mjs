#!/usr/bin/env node
import mongoose from 'mongoose';
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

async function setUserRole() {
  const args = process.argv.slice(2);
  const usernameIndex = args.indexOf('--username');
  const roleIndex = args.indexOf('--role');

  if (usernameIndex === -1 || roleIndex === -1) {
    console.error('Usage: node set-user-role.mjs --username <username> --role <admin|enterer>');
    process.exit(1);
  }

  const username = args[usernameIndex + 1];
  const role = args[roleIndex + 1];

  if (!username || !role) {
    console.error('Both --username and --role are required');
    process.exit(1);
  }

  if (role !== 'admin' && role !== 'enterer') {
    console.error('Role must be either "admin" or "enterer"');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('Connected to MongoDB');

    const user = await User.findOne({ UserName: username });
    if (!user) {
      console.error(`User "${username}" not found`);
      process.exit(1);
    }

    user.role = role;
    await user.save();

    console.log(`✓ User "${username}" role updated to "${role}"`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

setUserRole();
