import { NextResponse } from "next/server";
import midtransClient from "midtrans-client";
import { createClient } from "@supabase/supabase-js";

// Admin client to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder_key"
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, total, discount, shippingFee, customerDetails } = body;

    // Check if env vars are present, if not, throw an error to be handled by frontend
    if (!process.env.MIDTRANS_SERVER_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "API Keys belum dikonfigurasi di .env.local" }, { status: 500 });
    }

    const snap = new midtransClient.Snap({
      // UBAH KE TRUE UNTUK PRODUCTION (UANG ASLI)
      isProduction: true,
      serverKey: process.env.MIDTRANS_SERVER_KEY || "",
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "",
    });

    // 1. Create Order in Supabase
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_name: customerDetails.first_name,
        customer_phone: customerDetails.phone,
        delivery_type: body.shippingFee > 0 || body.customerDetails.address.includes("Jarak") ? "delivery" : "pickup",
        address: customerDetails.address,
        subtotal_amount: total - shippingFee, // Total belanja saja
        shipping_fee: shippingFee,
        total_amount: total, // Grand total
        status: "pending",
        items_json: items,
      })
      .select()
      .single();

    if (error || !order) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: "Gagal membuat order di database" }, { status: 500 });
    }

    // 2. Prepare Item Details
    const midtransItems = items.map((item: any) => ({
      id: item.id,
      price: item.price,
      quantity: item.quantity,
      name: item.name.substring(0, 50),
    }));

    if (discount > 0) {
      midtransItems.push({
        id: 'PROMO',
        price: -discount,
        quantity: 1,
        name: 'Promo Beli 5 Gratis 1'
      });
    }

    if (shippingFee > 0) {
      midtransItems.push({
        id: 'SHIPPING',
        price: shippingFee,
        quantity: 1,
        name: 'Ongkos Kirim'
      });
    }

    // 3. Create Snap Transaction
    const parameters = {
      transaction_details: {
        order_id: order.id,
        gross_amount: total,
      },
      customer_details: customerDetails,
      item_details: midtransItems,
    };

    const transaction = await snap.createTransaction(parameters);

    // 4. Update order with Snap Token
    await supabase
      .from("orders")
      .update({ snap_token: transaction.token })
      .eq("id", order.id);

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url
    });
  } catch (error: any) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}