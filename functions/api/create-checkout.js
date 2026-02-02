const PRODUCT_ID = "91752472-7da7-4a64-85db-09951b00923c";

export async function onRequestPost(context) {
  const { request, env } = context;

  const POLAR_ACCESS_TOKEN = env.POLAR_ACCESS_TOKEN;

  if (!POLAR_ACCESS_TOKEN) {
    return new Response(JSON.stringify({ error: "Payment not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { email } = await request.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const origin = new URL(request.url).origin;

    const res = await fetch("https://api.polar.sh/v1/checkouts/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${POLAR_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        products: [PRODUCT_ID],
        customer_email: email,
        success_url: `${origin}/?page=success&checkout_id={CHECKOUT_SESSION_ID}`,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Polar checkout error:", text);
      return new Response(JSON.stringify({ error: "Failed to create checkout" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify({ checkoutUrl: data.url }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-checkout error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
