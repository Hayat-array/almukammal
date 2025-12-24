import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import GlobalSetting from '@/models/GlobalSetting';

export async function GET(request) {
    try {
        await dbConnect();
        // Fetch settings but maybe limit what fields we return? 
        // Actually, store status and delivery rules are public info.
        // Operating hours etc are also public.
        // So we can return the whole object or select fields.
        let settings = await GlobalSetting.findOne({});
        if (!settings) {
            settings = { // Default fallback object if DB is empty
                delivery: { type: 'flat', baseCost: 20, freeDeliveryThreshold: 5000, isActive: true },
                store: { isOpen: true, minOrderValue: 0, maxOrderLimit: 0 },
                blockedUsers: []
            };
        }

        // Sanitize slightly? Blocked users list shouldn't be public maybe? 
        // It's just IDs, but good practice to remove sensitive list if not needed.
        // The frontend only needs delivery and store. 
        // But for "Blocked Users" check, we might want to check server side at login/checkout, 
        // not send the list to client.

        const publicSettings = {
            delivery: settings.delivery,
            store: settings.store,
            // blockedUsers excluded
        };

        return NextResponse.json({ success: true, settings: publicSettings });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
