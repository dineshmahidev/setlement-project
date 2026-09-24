<?php

namespace App\Services;

use App\Models\ChargeType;
use App\Models\FieldConfiguration;
use Illuminate\Support\Arr;

/**
 * Settlement Bill calculation engine.
 * Only formulas explicitly defined in the spec are implemented.
 * Unknown rules are marked TO_BE_CONFIRMED and never guessed.
 */
class SettlementCalculationService
{
    /**
     * Calculate billing quantity based on configured source.
     * Spec §11: Total Value = Billing Quantity × Final Unit Rate
     */
    public function billingQuantity(array $data): float
    {
        $source = $data['billing_quantity_source'] ?? 'FINAL_WEIGHT';

        return match ($source) {
            'NET_WEIGHT' => (float) ($data['net_weight'] ?? 0),
            'MANUAL_QUANTITY' => (float) ($data['manual_quantity'] ?? 0),
            default => (float) ($data['final_weight'] ?? 0),
        };
    }

    /**
     * Automatic rate only if an explicit rule exists (spec §10).
     * Rule format: "WEIGHT * RATE" etc. — only implemented forms below.
     * Returns [rate, basis] or null when no rule applies (TO_BE_CONFIRMED).
     */
    public function automaticRate(?string $rule, array $context): ?array
    {
        if (! $rule) {
            return null; // TO_BE_CONFIRMED: no rule configured => do not invent
        }

        $rule = strtoupper(trim($rule));
        $weight = (float) ($context['billing_quantity'] ?? 0);

        // Only explicitly supported forms:
        if (preg_match('/^WEIGHT\s*\*\s*([0-9.]+)$/', $rule, $m)) {
            $rate = round((float) $m[1], 4);
            return [$rate, "AUTOMATIC: weight × {$m[1]}"];
        }

        return null; // unknown rule => caller must keep manual value
    }

    /**
     * Automatic charge only with explicit rule (spec §12).
     * Supported: "WEIGHT * RATE" or plain number.
     */
    public function automaticCharge(?string $rule, array $context): ?array
    {
        if (! $rule) {
            return null;
        }

        $rule = strtoupper(trim($rule));

        if (is_numeric($rule)) {
            $amount = (float) $rule;
            return [$amount, "AUTOMATIC: fixed {$amount}"];
        }

        $weight = (float) ($context['billing_quantity'] ?? 0);

        if (preg_match('/^WEIGHT\s*\*\s*([0-9.]+)$/', $rule, $m)) {
            $rate = (float) $m[1];
            $amount = round($weight * $rate, 2);
            return [$amount, sprintf('AUTOMATIC: %s KG × %s', $weight, $m[1])];
        }

        if (preg_match('/^WEIGHT\s*\/\s*([0-9.]+)$/', $rule, $m)) {
            $divisor = (float) $m[1];
            if ($divisor == 0) return null;
            $amount = round($weight / $divisor, 2);
            return [$amount, sprintf('AUTOMATIC: %s / %s', $weight, $m[1])];
        }

        return null; // unknown => TO_BE_CONFIRMED
    }

    /**
     * GST — mutually exclusive modes (spec §13). Never CGST+SGST and IGST together.
     */
    public function calculateGst(string $gstType, float $taxableAmount, float $rate): array
    {
        $gstType = strtoupper($gstType);
        $result = [
            'gst_type' => $gstType,
            'gst_rate' => $rate,
            'cgst_amount' => 0.0,
            'sgst_amount' => 0.0,
            'igst_amount' => 0.0,
            'taxes' => [],
        ];

        if ($gstType === 'CGST_SGST') {
            $half = round($rate / 2, 4);
            $result['cgst_amount'] = round($taxableAmount * $half / 100, 2);
            $result['sgst_amount'] = round($taxableAmount * $half / 100, 2);
            $result['taxes'] = [
                ['type' => 'CGST', 'rate' => $half, 'amount' => $result['cgst_amount']],
                ['type' => 'SGST', 'rate' => $half, 'amount' => $result['sgst_amount']],
            ];
        } elseif ($gstType === 'IGST') {
            $result['igst_amount'] = round($taxableAmount * $rate / 100, 2);
            $result['taxes'] = [
                ['type' => 'IGST', 'rate' => $rate, 'amount' => $result['igst_amount']],
            ];
        }
        // NONE => all zero; anything else treated as NONE (no invention)

        return $result;
    }

    /**
     * Full bill calculation (spec §11-14).
     */
    public function calculate(array $data, array $qcValues = []): array
    {
        $billingQty = $this->billingQuantity($data);

        $rateMode = strtoupper($data['rate_mode'] ?? 'MANUAL');
        $manualRate = (float) ($data['final_unit_rate'] ?? 0);
        $rate = $manualRate;
        $rateBasis = 'MANUAL';
        $rateCalculated = null;

        if ($rateMode === 'AUTOMATIC') {
            $auto = $this->automaticRate($data['rate_rule'] ?? null, [
                'billing_quantity' => $billingQty,
                'net_weight' => $data['net_weight'] ?? 0,
                'final_weight' => $data['final_weight'] ?? 0,
                'qc' => $qcValues,
            ]);
            if ($auto !== null) {
                $rate = $auto[0];
                $rateBasis = $auto[1];
                $rateCalculated = $rate;
            } else {
                // No configured rule — keep manual value (do not invent).
                $rateBasis = 'TO_BE_CONFIRMED: automatic rule missing; manual rate retained';
            }
        }

        // Spec §11
        $totalValue = round($billingQty * $rate, 2);

        // Charges: only visible field-configured charges affect calculations (spec §28)
        $charges = $this->normalizeCharges($data['charges'] ?? [], $data, [
            'billing_quantity' => $billingQty,
            'total_value' => $totalValue,
            'net_weight' => $data['net_weight'] ?? 0,
            'final_weight' => $data['final_weight'] ?? 0,
            'qc' => $qcValues,
        ]);

        $additive = 0.0;
        $deductive = 0.0;
        foreach ($charges as $c) {
            if (! ($c['active'] ?? true)) continue;
            if (strtoupper($c['direction'] ?? 'ADD') === 'DEDUCT') {
                $deductive += (float) $c['amount'];
            } else {
                $additive += (float) $c['amount'];
            }
        }

        $additive = round($additive, 2);
        $deductive = round($deductive, 2);

        // Spec §14: Base Value + Applicable Tax + Additive - Deductive = Net Payable
        // Taxable amount = base + additive - deductive (standard structure; configurable via TO_BE_CONFIRMED if business differs)
        $preTax = round($totalValue + $additive - $deductive, 2);

        $gstType = strtoupper($data['gst_type'] ?? 'NONE');
        if (! in_array($gstType, ['CGST_SGST', 'IGST', 'NONE'], true)) {
            $gstType = 'NONE';
        }
        $gstRate = (float) ($data['gst_rate'] ?? 0);

        $gst = $this->calculateGst($gstType, $preTax, $gstRate);

        $taxTotal = round($gst['cgst_amount'] + $gst['sgst_amount'] + $gst['igst_amount'], 2);
        $netPayable = round($preTax + $taxTotal, 2);

        return [
            'billing_quantity' => round($billingQty, 3),
            'billing_quantity_source' => $data['billing_quantity_source'] ?? 'FINAL_WEIGHT',
            'rate_mode' => $rateMode,
            'final_unit_rate' => round($rate, 4),
            'rate_basis' => $rateBasis,
            'rate_calculated' => $rateCalculated,
            'total_value' => $totalValue,
            'charges' => $charges,
            'additive_charges' => $additive,
            'deductive_charges' => $deductive,
            'charges_total' => round($additive - $deductive, 2),
            'taxable_amount' => $preTax,
            'gst_type' => $gstType,
            'gst_rate' => $gstRate,
            'cgst_amount' => $gst['cgst_amount'],
            'sgst_amount' => $gst['sgst_amount'],
            'igst_amount' => $gst['igst_amount'],
            'taxes' => $gst['taxes'],
            'net_payable' => $netPayable,
            'breakdown' => [
                'base' => $totalValue,
                'additive' => $additive,
                'deductive' => $deductive,
                'taxable' => $preTax,
                'cgst' => $gst['cgst_amount'],
                'sgst' => $gst['sgst_amount'],
                'igst' => $gst['igst_amount'],
                'net_payable' => $netPayable,
            ],
        ];
    }

    /**
     * Filter charges by field configuration (disabled fields never affect calc).
     */
    private function normalizeCharges(array $charges, array $data, array $context): array
    {
        $visibleKeys = FieldConfiguration::where('module', 'CHARGES')
            ->where('visible', true)
            ->pluck('field_key')
            ->all();

        // Fallback: if no field config rows for charges, all provided charges are visible
        $hasChargeConfig = FieldConfiguration::where('module', 'CHARGES')->exists();

        $result = [];
        foreach ($charges as $charge) {
            $key = StrSlug($charge['code'] ?? $charge['name'] ?? '');
            if ($hasChargeConfig && $visibleKeys && ! in_array($key, $visibleKeys, true)) {
                continue; // disabled field: absent from calculation
            }

            $mode = strtoupper($charge['mode'] ?? 'MANUAL');
            $amount = (float) ($charge['amount'] ?? 0);
            $basis = 'MANUAL';

            if ($mode === 'AUTOMATIC') {
                $auto = $this->automaticCharge($charge['calculation_rule'] ?? null, $context);
                if ($auto !== null) {
                    $amount = $auto[0];
                    $basis = $auto[1];
                } else {
                    $basis = 'TO_BE_CONFIRMED: charge rule missing; manual amount retained';
                }
            }

            $result[] = [
                'code' => $charge['code'] ?? null,
                'charge_type_id' => $charge['charge_type_id'] ?? null,
                'name' => $charge['name'] ?? '',
                'mode' => $mode,
                'direction' => strtoupper($charge['direction'] ?? 'ADD'),
                'amount' => round($amount, 2),
                'calculation_rule' => $charge['calculation_rule'] ?? null,
                'basis' => $basis,
                'active' => (bool) ($charge['active'] ?? true),
                'sort_order' => (int) ($charge['sort_order'] ?? 0),
            ];
        }

        usort($result, fn ($a, $b) => $a['sort_order'] <=> $b['sort_order']);

        return $result;
    }
}

if (! function_exists('StrSlug')) {
    function StrSlug(string $value): string
    {
        $value = strtolower(trim($value));
        $value = preg_replace('/[^a-z0-9]+/', '_', $value);
        return trim((string) $value, '_');
    }
}
