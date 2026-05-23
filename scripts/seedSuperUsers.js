const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/userModel');

dotenv.config();

async function seedSuperUsers() {
  try {
    const ensureUser = async (userName, email, password, role) => {
      const exists = await User.findOne({ email });
      if (exists) return;
      const salt = bcryptjs.genSaltSync(10);
      const hashed = await bcryptjs.hash(password, salt);
      await User.create({
        userName,
        email,
        password: hashed,
        phone: '0900000000',
        address: [],
        answer: 'seed',
        userType: role,
        isActive: true,
      });
      console.log(`Seeded ${role} account: ${email}`);
    };

    await ensureUser('Admin', process.env.ADMIN_EMAIL || 'admin@local', process.env.ADMIN_PASSWORD || 'Admin@123', 'admin');
    await ensureUser('Pharmacist', process.env.PHARMACIST_EMAIL || 'pharmacist@local', process.env.PHARMACIST_PASSWORD || 'Pharm@123', 'pharmacist');
    console.log('Seeding completed.');
  } catch (e) {
    console.error('Seeding super users failed:', e.message);
  } finally {
    mongoose.connection.close();
  }
}

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => seedSuperUsers());
