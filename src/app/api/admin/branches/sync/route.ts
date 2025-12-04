import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getBranches } from '@/lib/kiotviet';

// POST - Sync branches from KiotViet to database
export async function POST() {
    try {
        // Fetch branches from KiotViet
        const kiotVietBranches = await getBranches();

        if (!kiotVietBranches || kiotVietBranches.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Không lấy được danh sách chi nhánh từ KiotViet',
            });
        }

        const supabase = createAdminClient();
        let created = 0;
        let updated = 0;

        for (const kvBranch of kiotVietBranches) {
            // Check if branch exists by kiotviet_branch_id
            const { data: existing } = await supabase
                .from('branches')
                .select('id')
                .eq('kiotviet_branch_id', kvBranch.id.toString())
                .single();

            if (existing) {
                // Update existing branch
                await supabase
                    .from('branches')
                    .update({
                        name: kvBranch.branchName,
                        code: kvBranch.branchCode || `KV${kvBranch.id}`,
                    })
                    .eq('id', existing.id);
                updated++;
            } else {
                // Create new branch
                await supabase
                    .from('branches')
                    .insert({
                        code: kvBranch.branchCode || `KV${kvBranch.id}`,
                        name: kvBranch.branchName,
                        kiotviet_branch_id: kvBranch.id.toString(),
                        is_active: true,
                    });
                created++;
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                total: kiotVietBranches.length,
                created,
                updated,
            },
        });
    } catch (error) {
        console.error('Sync branches error:', error);
        return NextResponse.json({
            success: false,
            error: 'Lỗi khi đồng bộ chi nhánh',
        });
    }
}
