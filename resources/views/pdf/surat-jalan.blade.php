<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Surat Jalan - {{ $transfer->transfer_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 11px; color: #1e293b; line-height: 1.5; }
        .page { padding: 30px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 3px solid #0f172a; padding-bottom: 15px; }
        .title { font-size: 22px; font-weight: bold; color: #0f172a; letter-spacing: 1px; }
        .subtitle { font-size: 10px; color: #64748b; margin-top: 2px; }
        .doc-number { font-size: 14px; font-weight: bold; color: #0f172a; text-align: right; }
        .doc-date { font-size: 10px; color: #64748b; text-align: right; }
        .info-grid { width: 100%; margin-bottom: 20px; }
        .info-grid td { padding: 4px 0; vertical-align: top; }
        .info-label { color: #64748b; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; width: 120px; }
        .info-value { font-weight: 600; color: #1e293b; }
        .locations { width: 100%; margin-bottom: 20px; }
        .locations td { width: 50%; vertical-align: top; padding: 10px; }
        .loc-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; }
        .loc-label { font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 4px; }
        .loc-name { font-size: 14px; font-weight: bold; color: #0f172a; }
        .loc-type { font-size: 10px; color: #94a3b8; }
        .arrow { text-align: center; font-size: 20px; color: #94a3b8; vertical-align: middle; width: 40px; }
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        table.items thead th { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 8px 10px; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; text-align: left; }
        table.items tbody td { border: 1px solid #e2e8f0; padding: 7px 10px; font-size: 11px; }
        table.items tbody tr:nth-child(even) { background: #f8fafc; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .signatures { width: 100%; margin-top: 40px; }
        .signatures td { width: 33%; text-align: center; vertical-align: top; padding: 0 10px; }
        .sig-label { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .sig-line { border-bottom: 1px solid #1e293b; margin: 50px auto 5px; width: 140px; }
        .sig-name { font-size: 10px; color: #475569; }
        .notes { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; margin-bottom: 20px; background: #f8fafc; }
        .notes-label { font-size: 9px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
        .footer { text-align: center; font-size: 9px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="page">
        <table style="width:100%; margin-bottom: 20px; border-bottom: 3px solid #0f172a; padding-bottom: 15px;">
            <tr>
                <td style="vertical-align: top;">
                    <div class="title">SURAT JALAN</div>
                    <div class="subtitle">Dokumen Pengiriman Barang</div>
                </td>
                <td style="vertical-align: top; text-align: right;">
                    <div class="doc-number">{{ $transfer->transfer_number }}</div>
                    <div class="doc-date">Tanggal: {{ \Carbon\Carbon::parse($transfer->transfer_date)->format('d/m/Y') }}</div>
                    <div class="doc-date">Status: {{ ucfirst($transfer->status) }}</div>
                </td>
            </tr>
        </table>

        <table class="locations">
            <tr>
                <td>
                    <div class="loc-box">
                        <div class="loc-label">Dari (Pengirim)</div>
                        <div class="loc-name">{{ $fromName }}</div>
                        <div class="loc-type">{{ $transfer->from_location_type === 'warehouse' ? 'Gudang' : 'Toko' }}</div>
                    </div>
                </td>
                <td class="arrow" style="width: 40px;">→</td>
                <td>
                    <div class="loc-box">
                        <div class="loc-label">Ke (Penerima)</div>
                        <div class="loc-name">{{ $toName }}</div>
                        <div class="loc-type">{{ $transfer->to_location_type === 'warehouse' ? 'Gudang' : 'Toko' }}</div>
                    </div>
                </td>
            </tr>
        </table>

        <table class="items">
            <thead>
                <tr>
                    <th style="width: 30px;" class="text-center">No</th>
                    <th>Kode</th>
                    <th>Nama Barang</th>
                    <th class="text-center">Satuan</th>
                    <th class="text-right">Qty Diminta</th>
                    <th class="text-right">Qty Dikirim</th>
                    <th>Keterangan</th>
                </tr>
            </thead>
            <tbody>
                @foreach($items as $i => $item)
                <tr>
                    <td class="text-center">{{ $i + 1 }}</td>
                    <td>{{ $item['code'] }}</td>
                    <td class="font-bold">{{ $item['name'] }}</td>
                    <td class="text-center">{{ $item['unit'] }}</td>
                    <td class="text-right">{{ number_format($item['qty_requested']) }}</td>
                    <td class="text-right font-bold">{{ number_format($item['qty_sent']) }}</td>
                    <td>{{ $item['notes'] ?? '' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <table class="info-grid">
            <tr>
                <td class="info-label">Total Item</td>
                <td class="info-value">{{ count($items) }} jenis</td>
                <td class="info-label">Dibuat oleh</td>
                <td class="info-value">{{ $transfer->creator?->name ?? '-' }}</td>
            </tr>
            @if($transfer->sender)
            <tr>
                <td class="info-label">Dikirim oleh</td>
                <td class="info-value">{{ $transfer->sender->name }}</td>
                <td class="info-label">Tgl Kirim</td>
                <td class="info-value">{{ $transfer->sent_at ? \Carbon\Carbon::parse($transfer->sent_at)->format('d/m/Y H:i') : '-' }}</td>
            </tr>
            @endif
        </table>

        @if($transfer->notes)
        <div class="notes">
            <div class="notes-label">Catatan</div>
            <div>{{ $transfer->notes }}</div>
        </div>
        @endif

        <table class="signatures">
            <tr>
                <td>
                    <div class="sig-label">Pengirim</div>
                    <div class="sig-line"></div>
                    <div class="sig-name">{{ $transfer->sender?->name ?? '(__________________)' }}</div>
                </td>
                <td>
                    <div class="sig-label">Pengemudi / Kurir</div>
                    <div class="sig-line"></div>
                    <div class="sig-name">(__________________)</div>
                </td>
                <td>
                    <div class="sig-label">Penerima</div>
                    <div class="sig-line"></div>
                    <div class="sig-name">{{ $transfer->receiver?->name ?? '(__________________)' }}</div>
                </td>
            </tr>
        </table>

        <div class="footer">
            Dicetak pada {{ now()->format('d/m/Y H:i') }} WIB — Harumnya POS
        </div>
    </div>
</body>
</html>
