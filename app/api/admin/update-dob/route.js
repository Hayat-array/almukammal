import { NextResponse } from 'next/server';
import updateUsersWithDefaultDOB from '@/scripts/updateUsersDOB';

// API endpoint to update users with default DOB
export async function POST(request) {
    try {
        const result = await updateUsersWithDefaultDOB();

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: `Updated ${result.updatedCount} users with default DOB (31/07/2002)`,
                updatedCount: result.updatedCount,
                users: result.users
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error
            }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
