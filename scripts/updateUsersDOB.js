import dbConnect from '@/lib/mongodb';
import UserModel from '@/models/User';

// Script to add default DOB to users who don't have one
async function updateUsersWithDefaultDOB() {
    try {
        await dbConnect();

        // Find all users without DOB
        const usersWithoutDOB = await UserModel.find({
            $or: [
                { dob: { $exists: false } },
                { dob: null }
            ]
        });

        console.log(`Found ${usersWithoutDOB.length} users without DOB`);

        // Default DOB: 31/07/2002
        const defaultDOB = new Date('2002-07-31');

        // Update each user
        const updatePromises = usersWithoutDOB.map(user => {
            user.dob = defaultDOB;
            return user.save();
        });

        await Promise.all(updatePromises);

        console.log(`✅ Successfully updated ${usersWithoutDOB.length} users with default DOB: 31/07/2002`);

        return {
            success: true,
            updatedCount: usersWithoutDOB.length,
            users: usersWithoutDOB.map(u => ({ email: u.email, name: u.name }))
        };

    } catch (error) {
        console.error('Error updating users:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

export default updateUsersWithDefaultDOB;
