SOP 05 — Handling Payment & Webhooks
Pembuatan Transaksi:

Route POST /api/checkout.

Validasi harga produk harus dilakukan ulang di Server (ambil data dari Supabase), jangan percaya harga dari Client.

Webhook Handler:

Route POST /api/webhooks/payment.

Wajib verifikasi Signature Key dari Payment Gateway.

Jika status settlement, update status di tabel orders menjadi 'paid'.

Feedback User: Redirect user ke /checkout/success?order_id=....
