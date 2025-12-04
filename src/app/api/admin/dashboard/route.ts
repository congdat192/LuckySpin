import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET - Dashboard stats
export async function GET() {
    try {
        const supabase = createAdminClient();
        const today = new Date().toISOString().split('T')[0];

        // Get today's stats
        const { data: todaySpins } = await supabase
            .from('spin_logs')
            .select('id, prize:event_prizes(prize_type)')
            .gte('spun_at', `${today}T00:00:00`)
            .lte('spun_at', `${today}T23:59:59`);

        // Get active events count
        const { count: activeEvents } = await supabase
            .from('events')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'active');

        // Get low inventory alerts
        const { data: lowInventory } = await supabase
            .from('branch_prize_inventory')
            .select(`
        remaining_quantity,
        initial_quantity,
        prize:event_prizes(name, prize_type),
        branch:branches(name)
      `)
            .gt('initial_quantity', 0)
            .lt('remaining_quantity', 10)
            .limit(10);

        // Get recent activity
        const { data: recentActivity } = await supabase
            .from('spin_logs')
            .select(`
        id,
        customer_name,
        spun_at,
        prize:event_prizes(name),
        branch:branches(name)
      `)
            .order('spun_at', { ascending: false })
            .limit(10);

        const totalSpinsToday = todaySpins?.length || 0;
        const prizesGivenToday = todaySpins?.filter(
            (s) => {
                const prize = s.prize as unknown as { prize_type: string } | null;
                return prize?.prize_type !== 'no_prize';
            }
        ).length || 0;

        const lowInventoryAlerts = (lowInventory || [])
            .filter(item => {
                const prize = item.prize as unknown as { prize_type: string } | null;
                return prize?.prize_type !== 'no_prize';
            })
            .map(item => ({
                prize_name: (item.prize as unknown as { name: string } | null)?.name,
                branch_name: (item.branch as unknown as { name: string } | null)?.name,
                remaining: item.remaining_quantity,
            }));

        return NextResponse.json({
            success: true,
            data: {
                total_spins_today: totalSpinsToday,
                total_prizes_given_today: prizesGivenToday,
                active_events: activeEvents || 0,
                low_inventory_alerts: lowInventoryAlerts,
                recent_activity: (recentActivity || []).map(a => ({
                    id: a.id,
                    customer_name: a.customer_name,
                    prize_name: (a.prize as unknown as { name: string } | null)?.name,
                    branch_name: (a.branch as unknown as { name: string } | null)?.name,
                    spun_at: a.spun_at,
                })),
            },
        });
    } catch (error) {
        console.error('Dashboard API error:', error);
        return NextResponse.json(
            { success: false, error: 'Đã xảy ra lỗi' },
            { status: 500 }
        );
    }
}
