const mongoose = require('mongoose');
require('dotenv').config();
const Class = require('../models/class.model');
const User = require('../models/user.model');

async function checkClasses() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);

        console.log('Checking classes for "Design and Analysis of Algorithms" (21CSC204J)...');

        // Find classes for this course, sorted by group
        const classes = await Class.find({
            courseCode: '21CSC204J',
            semester: { $ne: null } // Ensure it's a valid semester class
        })
            .populate('mainFaculty', 'facultyName')
            .populate('coFaculties', 'facultyName')
            .sort({ batch: 1, section: 1, group: 1 });

        if (classes.length === 0) {
            console.error('No classes found for 21CSC204J!');
            process.exit(1);
        }

        console.log(`Found ${classes.length} classes.`);

        // We are looking for Batch 1, Section A1
        const group1 = classes.find(c => c.batch === 1 && c.section === 'A1' && c.group === 1);
        const group2 = classes.find(c => c.batch === 1 && c.section === 'A1' && c.group === 2);

        if (group1) {
            console.log('\n--- Group 1 (Slot 1) ---');
            console.log(`Class: ${group1.name}`);
            console.log(`Main Faculty: ${group1.mainFaculty?.facultyName || 'MISSING'}`);
            const coFaculties = group1.coFaculties.map(f => f.facultyName).join(', ');
            console.log(`Co-Faculties: ${coFaculties || 'NONE'}`);

            // Expected: Main=Rosaline, Co=Kavitha
            if (group1.mainFaculty?.facultyName.includes('Rosaline') && coFaculties.includes('Kavitha')) {
                console.log('✅ Group 1 matches expected logic (Faculty + Co-Faculty)');
            } else {
                console.error('❌ Group 1 MISMATCH');
            }
        } else {
            console.error('Group 1 Class not found');
        }

        if (group2) {
            console.log('\n--- Group 2 (Slot 2) ---');
            console.log(`Class: ${group2.name}`);
            console.log(`Main Faculty: ${group2.mainFaculty?.facultyName || 'MISSING'}`);
            const coFaculties = group2.coFaculties.map(f => f.facultyName).join(', ');
            console.log(`Co-Faculties: ${coFaculties || 'NONE'}`);

            // Expected: Main=Rosaline, Co=Sundari
            if (group2.mainFaculty?.facultyName.includes('Rosaline') && coFaculties.includes('Sundari')) {
                console.log('✅ Group 2 matches expected logic (Faculty + Co-Faculty_1)');
            } else {
                console.error('❌ Group 2 MISMATCH');
            }
        } else {
            console.error('Group 2 Class not found');
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

checkClasses();
