const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { orchestrateUpload } = require('../services/dataUpload.service');
const Semester = require('../models/semester.model');
const User = require('../models/user.model');
const Upload = require('../models/upload.model');

// Mock data
const mockSemesterId = new mongoose.Types.ObjectId();
const mockAdminId = new mongoose.Types.ObjectId();

async function setup() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);

    // Create a mock semester
    await Semester.deleteMany({ name: 'Test Semester 2026' });
    const sem = await Semester.create({
        _id: mockSemesterId,
        name: 'Test Semester 2026',
        academicYear: '2025-2026',
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        status: 'active',
        createdBy: mockAdminId
    });
    console.log('Created test semester:', sem._id);

    // Create a mock admin user if needed (omitted for speed as orchestrateUpload just needs ID)
}

async function runTest() {
    try {
        await setup();

        console.log('Reading test files...');

        // Use existing files but we might want to slice them if they are too big for a quick test
        // For now, let's trust the service handles huge files and just pass the paths or buffers
        const studentsBuffer = fs.readFileSync(path.join(__dirname, '../original_Data/Student.json'));
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
        const result = await orchestrateUpload(files, mockSemesterId, mockAdminId);

        console.log('Upload Result Stats:', JSON.stringify(result.stats, null, 2));

        // Validation
        if (result.stats.studentsTotal === undefined || result.stats.teachersTotal === undefined) {
            console.error('FAILED: Total counts are missing from stats!');
            process.exit(1);
        }

        console.log('SUCCESS: Stats contain total counts.');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
