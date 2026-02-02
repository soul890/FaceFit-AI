export async function onRequestPost(context) {
  const { request, env } = context;

  const WEBHOOK_SECRET = env.POLAR_WEBHOOK_SECRET;
  const SUBSCRIPTIONS = env.SUBSCRIPTIONS;

  if (!WEBHOOK_SECRET || !SUBSCRIPTIONS) {
    return new Response("Not configured", { status: 500 });
  }

  try {
    const body = await request.text();
    const webhookId = request.headers.get("webhook-id");
    const timestamp = request.headers.get("webhook-timestamp");
    const sig = request.headers.get("webhook-signature");

    if (!sig || !timestamp || !webhookId) {
      return new Response("Missing signature headers", { status: 401 });
    }

    // Standard Webhooks: secret is base64-encoded before use as HMAC key
    // Polar secrets may start with "whsec_" prefix which should be stripped
    let secretBytes;
    const rawSecret = WEBHOOK_SECRET.startsWith("whsec_")
      ? WEBHOOK_SECRET.slice(6)
      : WEBHOOK_SECRET;

    // Decode base64 secret to raw bytes
    const binaryStr = atob(rawSecret);
    secretBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      secretBytes[i] = binaryStr.charCodeAt(i);
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    // Standard Webhooks signed content: "{webhook-id}.{webhook-timestamp}.{body}"
    const signedContent = `${webhookId}.${timestamp}.${body}`;
    const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(signedContent));
    const expectedSig = btoa(String.fromCharCode(...new Uint8Array(mac)));

    // Polar sends signatures as "v1,<base64>" (space-separated if multiple)
    const sigParts = sig.split(" ");
    const valid = sigParts.some((s) => {
      const val = s.startsWith("v1,") ? s.slice(3) : s;
      return val === expectedSig;
    });

    if (!valid) {
      console.error("Webhook signature mismatch");
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(body);
    const type = event.type;
    const sub = event.data;

    if (type === "subscription.active" || type === "subscription.updated") {
      const customerId = sub.customer_id;
      if (customerId) {
        await SUBSCRIPTIONS.put(`sub:${customerId}`, JSON.stringify({
          status: "active",
          subscriptionId: sub.id,
          productId: sub.product_id,
          currentPeriodEnd: sub.current_period_end,
          updatedAt: new Date().toISOString(),
        }));
      }
    } else if (
      type === "subscription.canceled" ||
      type === "subscription.revoked"
    ) {
      const customerId = sub.customer_id;
      if (customerId) {
        await SUBSCRIPTIONS.put(`sub:${customerId}`, JSON.stringify({
          status: "inactive",
          subscriptionId: sub.id,
          canceledAt: new Date().toISOString(),
        }));
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
