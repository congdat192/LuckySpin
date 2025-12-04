// Spin logic utilities

import type {
    EligibilityConditions,
    TurnFormula,
    EventRule,
    BranchPrizeInventory,
    EventPrize
} from '@/types';
import type { KiotVietInvoice } from './kiotviet';

/**
 * Evaluate eligibility conditions against invoice data
 */
export function evaluateEligibility(
    conditions: EligibilityConditions,
    invoice: KiotVietInvoice,
    branchCode: string
): { eligible: boolean; reason?: string } {
    // Check minimum invoice total
    if (conditions.min_invoice_total && invoice.total < conditions.min_invoice_total) {
        return {
            eligible: false,
            reason: `Hóa đơn chưa đạt giá trị tối thiểu ${conditions.min_invoice_total.toLocaleString('vi-VN')}đ`,
        };
    }

    // Check maximum invoice total
    if (conditions.max_invoice_total && invoice.total > conditions.max_invoice_total) {
        return {
            eligible: false,
            reason: `Hóa đơn vượt quá giá trị tối đa ${conditions.max_invoice_total.toLocaleString('vi-VN')}đ`,
        };
    }

    // Check allowed branches
    if (conditions.allowed_branches && conditions.allowed_branches.length > 0) {
        if (!conditions.allowed_branches.includes(branchCode)) {
            return {
                eligible: false,
                reason: `Chi nhánh ${branchCode} không nằm trong danh sách được tham gia`,
            };
        }
    }

    // Check excluded branches
    if (conditions.excluded_branches && conditions.excluded_branches.includes(branchCode)) {
        return {
            eligible: false,
            reason: `Chi nhánh ${branchCode} không được tham gia chương trình`,
        };
    }

    // Check required products
    if (conditions.required_products && conditions.required_products.length > 0) {
        const productCodes = invoice.invoiceDetails.map(d => d.productCode);
        const hasRequired = conditions.required_products.some(sku => productCodes.includes(sku));
        if (!hasRequired) {
            return {
                eligible: false,
                reason: 'Hóa đơn không có sản phẩm bắt buộc để tham gia',
            };
        }
    }

    // Check excluded products
    if (conditions.excluded_products && conditions.excluded_products.length > 0) {
        const productCodes = invoice.invoiceDetails.map(d => d.productCode);
        const hasExcluded = conditions.excluded_products.some(sku => productCodes.includes(sku));
        if (hasExcluded) {
            return {
                eligible: false,
                reason: 'Hóa đơn có sản phẩm không được tham gia chương trình',
            };
        }
    }

    return { eligible: true };
}

/**
 * Calculate number of turns based on formula
 */
export function calculateTurns(formula: TurnFormula, invoiceTotal: number): number {
    switch (formula.type) {
        case 'fixed':
            return formula.value;

        case 'step':
            for (const step of formula.steps) {
                if (invoiceTotal >= step.min && (step.max === null || invoiceTotal <= step.max)) {
                    return step.turns;
                }
            }
            return 0;

        case 'formula':
            // Simple formula: floor(total / per_amount)
            return Math.floor(invoiceTotal / formula.per_amount);

        default:
            return 1;
    }
}

/**
 * Process all rules for an event
 */
export function processEventRules(
    rules: EventRule[],
    invoice: KiotVietInvoice,
    branchCode: string
): { eligible: boolean; turns: number; reason?: string } {
    // Sort rules by priority
    const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

    let eligible = true;
    let turns = 1;
    let failReason: string | undefined;

    // Process eligibility rules
    const eligibilityRules = sortedRules.filter(r => r.rule_type === 'eligibility' && r.is_active);
    for (const rule of eligibilityRules) {
        if (rule.conditions) {
            const result = evaluateEligibility(rule.conditions as EligibilityConditions, invoice, branchCode);
            if (!result.eligible) {
                eligible = false;
                failReason = result.reason;
                break;
            }
        }
    }

    // Process turn calculation rules (use first active one)
    if (eligible) {
        const turnRules = sortedRules.filter(r => r.rule_type === 'turn_calculation' && r.is_active);
        if (turnRules.length > 0 && turnRules[0].formula) {
            turns = calculateTurns(turnRules[0].formula as TurnFormula, invoice.total);
        }
    }

    return { eligible, turns, reason: failReason };
}

/**
 * Select prize using weighted random
 */
export function selectPrizeWeighted(
    inventory: (BranchPrizeInventory & { prize: EventPrize })[]
): (BranchPrizeInventory & { prize: EventPrize }) | null {
    // Filter available items (has quantity)
    const available = inventory.filter(item => {
        // no_prize type has unlimited quantity
        if (item.prize.prize_type === 'no_prize') return true;
        return item.remaining_quantity > 0;
    });

    if (available.length === 0) {
        return null;
    }

    // Calculate total weight
    const totalWeight = available.reduce((sum, item) => {
        const weight = item.weight_override ?? item.prize.default_weight;
        return sum + weight;
    }, 0);

    if (totalWeight === 0) {
        return null;
    }

    // Random selection
    let random = Math.random() * totalWeight;

    for (const item of available) {
        const weight = item.weight_override ?? item.prize.default_weight;
        random -= weight;
        if (random < 0) {
            return item;
        }
    }

    // Fallback to last item
    return available[available.length - 1];
}

/**
 * Get prize index for wheel animation
 */
export function getPrizeIndex(prizeId: string, prizes: EventPrize[]): number {
    return prizes.findIndex(p => p.id === prizeId);
}
