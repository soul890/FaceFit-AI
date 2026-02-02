export async function onRequestPost(context) {
  const { request, env } = context;

  const POLAR_ACCESS_TOKEN = env.POLAR_ACCESS_TOKEN;
  const SUBSCRIPTIONS = env.SUBSCRIPTIONS;

  if (!POLAR_ACCESS_TOKEN || !SUBSCRIPTIONS) {
    return new Response(JSON.stringify({ error: "Not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { checkoutId, customerId } = await request.json();
    let cid = customerId;

    // If checkoutId provided, look up the customer from Polar
    if (checkoutId && !cid) {
      const res = await fetch(`https://sandbox-api.polar.sh/v1/checkouts/${checkoutId}`, {
        headers: { Authorization: `Bearer ${POLAR_ACCESS_TOKEN}` },
      });
      if (res.ok) {
        const checkout = await res.json();
        cid = checkout.customer_id;
      }
    }

    if (!cid) {
      return new Response(JSON.stringify({ active: false, error: "No customer found" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check KV for subscription status
    const subData = await SUBSCRIPTIONS.get(`sub:${cid}`);
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const usageStr = await SUBSCRIPTIONS.get(`usage:${cid}:${yearMonth}`);
    const usage = usageStr ? parseInt(usageStr, 10) : 0;

    if (subData) {
      const sub = JSON.parse(subData);
      return new Response(JSON.stringify({
        active: sub.status === "active",
        customerId: cid,
        usage,
        limit: 50,
        remaining: Math.max(0, 50 - usage),
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fallback: check Polar API directly
    const subRes = await fetch(`https://sandbox-api.polar.sh/v1/subscriptions/?customer_id=${cid}&active=true`, {
      headers: { Authorization: `Bearer ${POLAR_ACCESS_TOKEN}` },
    });

    if (subRes.ok) {
      const subList = await subRes.json();
      const active = subList.items && subList.items.length > 0;

      if (active) {
        await SUBSCRIPTIONS.put(`sub:${cid}`, JSON.stringify({
          status: "active",
          subscriptionId: subList.items[0].id,
          updatedAt: new Date().toISOString(),
        }));
      }

      return new Response(JSON.stringify({
        active,
        customerId: cid,
        usage,
        limit: 50,
        remaining: Math.max(0, 50 - usage),
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ active: false, customerId: cid, usage: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-subscription error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
