import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET single branch
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createAdminClient();

        const { data: branch, error } = await supabase
            .from('branches')
            .select('*')
            .eq('id', params.id)
            .single();

        if (error) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy chi nhánh' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: branch });
    } catch (error) {
        console.error('Branch GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Đã xảy ra lỗi' },
            { status: 500 }
        );
    }
}

// PUT - Update branch
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { code, name, kiotviet_branch_id, is_active } = body;

        const supabase = createAdminClient();

        const updateData: Record<string, unknown> = {};
        if (code !== undefined) updateData.code = code;
        if (name !== undefined) updateData.name = name;
        if (kiotviet_branch_id !== undefined) updateData.kiotviet_branch_id = kiotviet_branch_id || null;
        if (is_active !== undefined) updateData.is_active = is_active;

        const { data: branch, error } = await supabase
            .from('branches')
            .update(updateData)
            .eq('id', params.id)
            .select()
            .single();

        if (error) {
            console.error('Branch update error:', error);
            return NextResponse.json(
                { success: false, error: 'Lỗi khi cập nhật chi nhánh' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data: branch });
    } catch (error) {
        console.error('Branch PUT error:', error);
        return NextResponse.json(
            { success: false, error: 'Đã xảy ra lỗi' },
            { status: 500 }
        );
    }
}

// DELETE - Remove branch
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createAdminClient();

        // Delete related data first
        await supabase.from('branch_prize_inventory').delete().eq('branch_id', params.id);
        await supabase.from('invoice_sessions').delete().eq('branch_id', params.id);
        await supabase.from('spin_logs').delete().eq('branch_id', params.id);

        // Delete the branch
        const { error } = await supabase
            .from('branches')
            .delete()
            .eq('id', params.id);

        if (error) {
            console.error('Branch delete error:', error);
            return NextResponse.json(
                { success: false, error: 'Lỗi khi xóa chi nhánh: ' + error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Branch DELETE error:', error);
        return NextResponse.json(
            { success: false, error: 'Đã xảy ra lỗi' },
            { status: 500 }
        );
    }
}
