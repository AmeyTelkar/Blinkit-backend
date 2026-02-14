const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'blinkit-attendance';

async function fixAccountStatus() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db(dbName);
        const users = db.collection('users');

        // Update admin user to have approved status
        const adminResult = await users.updateOne(
            { role: 'admin' },
            { $set: { accountStatus: 'approved' } }
        );
        console.log('Admin user fixed:', adminResult.modifiedCount, 'updated');

        // Update all users that don't have an accountStatus yet
        const usersResult = await users.updateMany(
            {
                $or: [
                    { accountStatus: { $exists: false } },
                    { accountStatus: null }
                ]
            },
            { $set: { accountStatus: 'approved' } }
        );
        console.log('Legacy users fixed:', usersResult.modifiedCount, 'updated');

        console.log('\nDone! You can now login as admin.');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

fixAccountStatus();
