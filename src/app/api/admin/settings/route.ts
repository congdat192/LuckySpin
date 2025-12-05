import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET - Get a setting by key
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');

        if (!key) {
            return NextResponse.json(
                { success: false, error: 'Key is required' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', key)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return NextResponse.json({
            success: true,
            data: data?.value || null,
        });
    } catch (error) {
        console.error('Error fetching setting:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch setting' },
            { status: 500 }
        );
    }
}

// POST - Save a setting
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { key, value } = body;

        if (!key) {
            return NextResponse.json(
                { success: false, error: 'Key is required' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        const { error } = await supabase
            .from('app_settings')
            .upsert(
                { key, value, updated_at: new Date().toISOString() },
                { onConflict: 'key' }
            );

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: 'Setting saved successfully',
        });
    } catch (error) {
        console.error('Error saving setting:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to save setting' },
            { status: 500 }
        );
    }
}
