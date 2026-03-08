import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, event_type } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch order with items
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*, products(name, price))")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get customer email
    let email = order.guest_email;
    let name = order.guest_name || "Customer";

    if (order.customer_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, name")
        .eq("user_id", order.customer_id)
        .single();
      if (profile) {
        email = profile.email;
        name = profile.name || name;
      }
    }

    if (!email) {
      return new Response(JSON.stringify({ error: "No email found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build email content based on event type
    let subject = "";
    let body = "";
    const orderShort = order.id.slice(0, 8).toUpperCase();

    const itemsList = (order.order_items || [])
      .map(
        (item: any) =>
          `• ${item.products?.name || "Product"} x${item.quantity} — $${Number(item.total_price).toFixed(2)}`
      )
      .join("\n");

    switch (event_type) {
      case "order_confirmed":
        subject = `Order Confirmed #${orderShort}`;
        body = `Hi ${name},\n\nYour order #${orderShort} has been confirmed!\n\nItems:\n${itemsList}\n\nTotal: $${Number(order.total).toFixed(2)}\nPayment: ${order.payment_method}\n\nThank you for shopping with us!`;
        break;
      case "order_shipped":
        subject = `Order Shipped #${orderShort}`;
        body = `Hi ${name},\n\nGreat news! Your order #${orderShort} has been shipped.\n\nItems:\n${itemsList}\n\nYou will receive your package soon. Thank you for your patience!`;
        break;
      case "order_delivered":
        subject = `Order Delivered #${orderShort}`;
        body = `Hi ${name},\n\nYour order #${orderShort} has been delivered!\n\nWe hope you enjoy your purchase. Please consider leaving a review.\n\nThank you!`;
        break;
      default:
        subject = `Order Update #${orderShort}`;
        body = `Hi ${name},\n\nYour order #${orderShort} status has been updated to: ${event_type}.\n\nItems:\n${itemsList}\n\nTotal: $${Number(order.total).toFixed(2)}`;
    }

    // Log notification (since we don't have an email provider configured, 
    // we store it as a notification and return the email content)
    if (order.customer_id) {
      await supabase.from("notifications").insert({
        user_id: order.customer_id,
        title: subject,
        message: body.split("\n").slice(0, 3).join(" "),
        type: "order_update",
        link: "/my-orders",
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        to: email,
        subject,
        body,
        message: "Email notification processed and stored",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
