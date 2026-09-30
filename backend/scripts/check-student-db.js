const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/user.model');

async function checkStudent() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);

        console.log('Checking student RA2311003012112...');
        const student = await User.findOne({ registrationNumber: 'RA2311003012112' });

        if (!student) {
            console.error('Student not found!');
            process.exit(1);
        }

        console.log('--- Student Data ---');
        console.log('Name:', student.name);
        console.log('Mobile:', student.mobile || 'MISSING');
        console.log('Program:', student.program || 'MISSING');
        console.log('Branch:', student.branch || 'MISSING');
        console.log('Parent Name:', student.parentName || 'MISSING');
        console.log('DOB:', student.dob ? student.dob.toISOString() : 'MISSING');
        console.log('Raw Data Present:', !!student.rawData);

        if (student.rawData) {
            console.log('Raw Data sample:', JSON.stringify(student.rawData).substring(0, 100) + '...');
        }

        if (student.mobile === '9630147437' && student.program === 'B.Tech') {
            console.log('\nSUCCESS: Fields matched expected values.');
        } else {
            console.error('\nFAILED: Data mismatch.');
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

checkStudent();
