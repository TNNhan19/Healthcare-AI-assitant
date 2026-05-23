// Seed fake appointments into MongoDB
require('dotenv').config({ path: './.env' });
const connectionDb = require('../config/db');
const Appointment = require('../models/appointmentModel');
const User = require('../models/userModel');

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function main() {
  try {
    await connectionDb();
    const users = await User.find({}).select('_id email userName').limit(50);
    if (users.length === 0) throw new Error('No users found to attach appointments');

    const types = ['consultation','checkup','followup'];
    const depts = ['general','cardiology','dermatology','neurology','orthopedics','pediatrics'];
    const statusList = ['pending','confirmed','completed'];

    const today = new Date();
    const docs = [];
    for (let i = 0; i < 50; i++) {
      const u = rand(users);
      const date = new Date(today);
      date.setDate(today.getDate() + Math.floor(Math.random() * 14) - 7); // +/- 7 days
      const hour = 9 + Math.floor(Math.random() * 8); // 9-16h
      const minute = Math.random() > 0.5 ? '00' : '30';
      docs.push({
        user: u._id,
        patientName: u.userName || 'Khách',
        patientPhone: '090' + Math.floor(1000000 + Math.random() * 8999999),
        patientEmail: u.email,
        appointmentDate: date,
        appointmentTime: `${hour.toString().padStart(2,'0')}:${minute}`,
        appointmentType: rand(types),
        department: rand(depts),
        doctor: '',
        symptoms: '',
        notes: '',
        status: rand(statusList),
        priority: 'medium',
        cost: 0,
        paymentStatus: 'pending',
      });
    }

    await Appointment.insertMany(docs);
    console.log(`Seeded ${docs.length} appointments`);
    process.exit(0);
  } catch (e) {
    console.error('Seed appointments failed:', e.message);
    process.exit(1);
  }
}

main();
