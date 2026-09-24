<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Settlement Bill {{ $bill->bill_number }}</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #111; margin: 0; }
        .page { padding: 18px; }
        .company-header { border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 10px; text-align: center; }
        .company-header h1 { margin: 0 0 4px 0; font-size: 18px; letter-spacing: 1px; }
        .company-header .meta { font-size: 10px; line-height: 1.5; }
        h2.doc-title { text-align: center; font-size: 13px; text-transform: uppercase; margin: 8px 0 12px; border: 1px solid #111; padding: 4px; background: #f3f3f3; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        th, td { border: 1px solid #999; padding: 4px 6px; font-size: 10px; vertical-align: top; }
        th { background: #f0f0f0; text-align: left; }
        .right { text-align: right; }
        .two-col { display: flex; gap: 10px; }
        .two-col > div { flex: 1; }
        .label { font-weight: bold; }
        .totals { width: 45%; margin-left: auto; }
        .net { font-size: 13px; font-weight: bold; background: #f7f7f7; }
        .section-title { font-weight: bold; font-size: 11px; margin: 10px 0 4px; text-transform: uppercase; }
        .sign-row { display: flex; justify-content: space-between; margin-top: 40px; }
        .sign-box { text-align: center; width: 40%; border-top: 1px solid #111; padding-top: 4px; font-size: 10px; }
        .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 9px; color: #555; border-top: 1px solid #ccc; padding: 4px; }
        .badge { display: inline-block; padding: 1px 6px; border: 1px solid #111; font-size: 9px; }
        @page { margin: 15mm 12mm 18mm; }
    </style>
</head>
<body>
<div class="page">
    <div class="company-header">
        <h1>{{ $settings['company_name'] ?? 'S.V.M.A. AGRO PRODUCTS' }}</h1>
        <div class="meta">
            @if(!empty($settings['address'])) {{ $settings['address'] }}<br>@endif
            @if(!empty($settings['gstin'])) GSTIN: {{ $settings['gstin'] }} &nbsp;&nbsp;@endif
            @if(!empty($settings['cin'])) CIN: {{ $settings['cin'] }} &nbsp;&nbsp;@endif
            @if(!empty($settings['phone'])) Ph: {{ $settings['phone'] }}@endif<br>
            @if(!empty($settings['email'])) {{ $settings['email'] }} @endif
            @if(!empty($settings['website'])) | {{ $settings['website'] }} @endif
        </div>
    </div>

    <h2 class="doc-title">Settlement Bill</h2>

    <div class="two-col">
        <div>
            <table>
                <tr><th colspan="2">Vendor Details</th></tr>
                <tr><td class="label" width="40%">Vendor Name</td><td>{{ $bill->vendor?->name }}</td></tr>
                <tr><td class="label">Address</td><td>{{ $bill->vendor?->address }} {{ $bill->vendor?->city }} {{ $bill->vendor?->state }} {{ $bill->vendor?->pincode }}</td></tr>
                <tr><td class="label">GST Number</td><td>{{ $bill->vendor?->gst_number }}</td></tr>
                <tr><td class="label">PO Number</td><td>{{ $bill->po_number ?? $bill->vendor?->po_number }}</td></tr>
            </table>
        </div>
        <div>
            <table>
                <tr><th colspan="2">Bill Details</th></tr>
                <tr><td class="label" width="45%">Bill Number</td><td>{{ $bill->bill_number }}</td></tr>
                <tr><td class="label">Bill Date</td><td>{{ $bill->bill_date?->format('d-m-Y') }}</td></tr>
                <tr><td class="label">Lot Number</td><td>{{ $bill->lot_number }}</td></tr>
                <tr><td class="label">Vehicle Number</td><td>{{ $bill->vehicle?->number }}</td></tr>
                <tr><td class="label">Branch</td><td>{{ $bill->branch?->name }}</td></tr>
                <tr><td class="label">Status</td><td><span class="badge">{{ $bill->status }}</span></td></tr>
            </table>
        </div>
    </div>

    <table>
        <tr>
            <th>Item</th>
            <th class="right">Net Weight</th>
            <th class="right">Final Weight</th>
            <th class="right">Billing Qty</th>
            <th class="right">Jute Bags</th>
            <th class="right">Container Rate</th>
            <th class="right">Final Unit Rate</th>
            <th class="right">Total Value</th>
        </tr>
        <tr>
            <td>{{ $bill->item?->name ?? '-' }}</td>
            <td class="right">{{ number_format((float)$bill->net_weight, 3) }}</td>
            <td class="right">{{ number_format((float)$bill->final_weight, 3) }}</td>
            <td class="right">{{ number_format((float)$bill->billing_quantity, 3) }}</td>
            <td class="right">{{ number_format((float)$bill->jute_bag_quantity, 3) }}</td>
            <td class="right">{{ number_format((float)$bill->container_unit_rate, 4) }}</td>
            <td class="right">{{ number_format((float)$bill->final_unit_rate, 4) }}</td>
            <td class="right">{{ number_format((float)$bill->total_value, 2) }}</td>
        </tr>
    </table>

    @if($bill->qc && $bill->qc->count())
    <div class="section-title">QC Test Particulars</div>
    <table>
        <tr>
            @foreach($bill->qc as $q)
                <th>{{ $q->name }}</th>
            @endforeach
        </tr>
        <tr>
            @foreach($bill->qc as $q)
                <td>{{ $q->value !== null ? $q->value.' '.($q->unit ?? '') : '-' }}</td>
            @endforeach
        </tr>
    </table>
    @endif

    <div class="two-col">
        <div>
            @if($bill->charges && $bill->charges->count())
            <div class="section-title">Charges</div>
            <table>
                <tr><th>Charge</th><th>Mode</th><th class="right">Amount</th></tr>
                @foreach($bill->charges as $c)
                <tr>
                    <td>{{ $c->name }}</td>
                    <td>{{ $c->mode }} ({{ $c->direction }})</td>
                    <td class="right">{{ number_format((float)$c->amount, 2) }}</td>
                </tr>
                @endforeach
            </table>
            @endif
        </div>
        <div>
            <div class="section-title">Calculation</div>
            <table class="totals">
                <tr><td class="label">Total Value</td><td class="right">{{ number_format((float)$bill->total_value, 2) }}</td></tr>
                <tr><td class="label">Additive Charges</td><td class="right">{{ number_format((float)$bill->additive_charges, 2) }}</td></tr>
                <tr><td class="label">Deductive Charges</td><td class="right">(-) {{ number_format((float)$bill->deductive_charges, 2) }}</td></tr>
                <tr><td class="label">Taxable Amount</td><td class="right">{{ number_format((float)$bill->taxable_amount, 2) }}</td></tr>
                @if($bill->gst_type === 'CGST_SGST')
                <tr><td class="label">CGST @ {{ $bill->gst_rate/2 }}%</td><td class="right">{{ number_format((float)$bill->cgst_amount, 2) }}</td></tr>
                <tr><td class="label">SGST @ {{ $bill->gst_rate/2 }}%</td><td class="right">{{ number_format((float)$bill->sgst_amount, 2) }}</td></tr>
                @elseif($bill->gst_type === 'IGST')
                <tr><td class="label">IGST @ {{ $bill->gst_rate }}%</td><td class="right">{{ number_format((float)$bill->igst_amount, 2) }}</td></tr>
                @else
                <tr><td class="label">GST</td><td class="right">NO GST</td></tr>
                @endif
                <tr class="net"><td>Net Payable</td><td class="right">₹ {{ number_format((float)$bill->net_payable, 2) }}</td></tr>
            </table>
        </div>
    </div>

    <div class="sign-row">
        <div class="sign-box">
            @if(!empty($settings['signature']))<div>{{ $settings['signature'] }}</div>@endif
            Authorised Signatory
        </div>
        <div class="sign-box">
            @if(!empty($settings['seal']))<div>{{ $settings['seal'] }}</div>@endif
            Company Seal
        </div>
    </div>
</div>

<div class="footer">
    {{ $settings['pdf_footer'] ?? 'This is a computer generated settlement bill.' }}
    &nbsp;|&nbsp; Page
</div>
</body>
</html>
