import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET - List all branches
export async function GET() {
    try {
        const supabase = createAdminClient();

        const { data: branches, error } = await supabase
            .from('branches')
            .select('*')
            .order('code', { ascending: true });

        if (error) {
            console.error('Branches fetch error:', error);
            return NextResponse.json(
                { success: false, error: 'Lỗi khi lấy danh sách chi nhánh' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: branches || [],
        });
    } catch (error) {
        console.error('Branches API error:', error);
        return NextResponse.json(
            { success: false, error: 'Đã xảy ra lỗi' },
            { status: 500 }
        );
    }
}

// POST - Create branch
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code, name, kiotviet_branch_id } = body;

        if (!code || !name) {
            return NextResponse.json(
                { success: false, error: 'Thiếu mã hoặc tên chi nhánh' },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        const { data: branch, error } = await supabase
            .from('branches')
            .insert({
                code,
                name,
                kiotviet_branch_id: kiotviet_branch_id || null,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Branch creation error:', error);
            return NextResponse.json(
                { success: false, error: 'Lỗi khi tạo chi nhánh' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: branch,
        });
    } catch (error) {
        console.error('Branch creation API error:', error);
        return NextResponse.json(
            { success: false, error: 'Đã xảy ra lỗi' },
            { status: 500 }
        );
    }
}
