import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder_key"
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body;

    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    if (!serverKey) {
        return NextResponse.json({ error: "Midtrans Server Key not configured" }, { status: 500 });
    }

    // 1. Verify signature
    const hash = crypto
      .createHash("sha512")
      .update(order_id + status_code + gross_amount + serverKey)
      .digest("hex");

    if (hash !== signature_key) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // 2. Determine order status based on Midtrans transaction_status
    let status = "pending";
    if (transaction_status === "capture" || transaction_status === "settlement") {
      if (fraud_status === "challenge") {
        status = "challenge";
      } else {
        status = "settlement";
      }
    } else if (
      transaction_status === "cancel" ||
      transaction_status === "deny" ||
      transaction_status === "expire"
    ) {
      status = "failed";
    }

    // 3. Update Supabase
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", order_id);

    if (error) {
       console.error("Supabase Update Error:", error);
       return NextResponse.json({ error: "Failed to update database" }, { status: 500 });
    }

    return NextResponse.json({ status: "success" });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
