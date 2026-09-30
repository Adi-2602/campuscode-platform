const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { orchestrateUpload } = require('../services/dataUpload.service');
const Semester = require('../models/semester.model');
const User = require('../models/user.model');

// Mock data
const mockSemesterId = new mongoose.Types.ObjectId();
const mockAdminId = new mongoose.Types.ObjectId();

async function setup() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);

    // Create a mock semester
    await Semester.deleteMany({ name: 'Field Test Semester 2026' });
    const sem = await Semester.create({
        _id: mockSemesterId,
        name: 'Field Test Semester 2026',
        academicYear: '2025-2026',
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: 'active',
        createdBy: mockAdminId
    });
    console.log('Created test semester:', sem._id);
}

async function runTest() {
    try {
        await setup();

        console.log('Reading test files...');

        const studentsBuffer = fs.readFileSync(path.join(__dirname, '../original_Data/Student.json'));
        // teacher/email files needed for orchestration but we focus on students
        const teachersBuffer = fs.readFileSync(path.join(__dirname, '../original_Data/Teacher.json'));
        const emailsBuffer = fs.readFileSync(path.join(__dirname, '../original_Data/Faculty_email.json'));

        const files = {
            students: studentsBuffer,
            studentsName: 'Student.json',
            teachers: teachersBuffer,
            teachersName: 'Teacher.json',
            facultyEmails: emailsBuffer,
            facultyEmailsName: 'Faculty_email.json'
        };

        console.log('Starting upload orchestration...');
        // We only care about student processing for this test
        // orchestrateUpload runs everything, which is fine
        const result = await orchestrateUpload(files, mockSemesterId, mockAdminId);

        console.log('Upload completed. Checking database...');

        // Verify a specific student we know exists in Student.json
        // VAIBHAV VERMA - RA2311003012112
        const student = await User.findOne({ registrationNumber: 'RA2311003012112' });

        if (!student) {
            console.error('FAILED: Student RA2311003012112 not found!');
            process.exit(1);
        }

        console.log('Found Student:', student.name);

        const checks = [
            { field: 'mobile', expected: '9630147437' },
            { field: 'program', expected: 'B.Tech' },
            { field: 'branch', expected: 'Computer Science and Engineering' },
            { field: 'parentName', expected: 'MADANLAL VERMA' },
            { field: 'parentMobile', expected: '7000147437' },
            { field: 'dob', check: (val) => val instanceof Date }, // Just check it's a date
            { field: 'rawData', check: (val) => val && val['Student Name'] === 'VAIBHAV VERMA' }
        ];

        let failed = false;
        checks.forEach(check => {
            const val = student[check.field];
            if (check.expected !== undefined && val !== check.expected) {
                console.error(`FAILED: ${check.field} mismatch. Expected "${check.expected}", got "${val}"`);
                failed = true;
            } else if (check.check && !check.check(val)) {
                console.error(`FAILED: ${check.field} check failed. Value:`, val);
                failed = true;
            } else {
                console.log(`PASS: ${check.field} = ${val}`);
            }
        });

        if (failed) process.exit(1);
        console.log('SUCCESS: All fields verified!');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
