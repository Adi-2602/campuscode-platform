require('dotenv').config();
const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('MONGO_URI is not set. Add it to your .env file.');
    process.exit(1);
}

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('slottimetables');

        console.log('Current indexes:');
        const indexes = await collection.listIndexes().toArray();
        console.log(JSON.stringify(indexes, null, 2));

        // Drop legacy slotCode index
        const hasSlotCodeIndex = indexes.some(idx => idx.name === 'slotCode_1');
        if (hasSlotCodeIndex) {
            console.log('Dropping index slotCode_1...');
            await collection.dropIndex('slotCode_1');
            console.log('Index slotCode_1 dropped successfully');
        } else {
            console.log('Index slotCode_1 not found.');
        }

        // Drop old non-unique compound index to make room for unique one
        const hasCompoundIndex = indexes.some(idx => idx.name === 'batch_1_dayNumber_1_hourOrder_1');
        if (hasCompoundIndex) {
            const compoundIdx = indexes.find(idx => idx.name === 'batch_1_dayNumber_1_hourOrder_1');
            if (!compoundIdx.unique) {
                console.log('Dropping non-unique index batch_1_dayNumber_1_hourOrder_1...');
                await collection.dropIndex('batch_1_dayNumber_1_hourOrder_1');
                console.log('Non-unique index dropped');
            }
        }

        console.log('Ensuring new UNIQUE compound index...');
        await collection.createIndex({ batch: 1, dayNumber: 1, hourOrder: 1 }, { unique: true, name: "cell_unique_index" });
        console.log('New UNIQUE compound index created with name: cell_unique_index');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

run();
