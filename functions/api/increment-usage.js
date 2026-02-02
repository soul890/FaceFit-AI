export async function onRequestPost(context) {
  const { request, env } = context;

  const SUBSCRIPTIONS = env.SUBSCRIPTIONS;

  if (!SUBSCRIPTIONS) {
    return new Response(JSON.stringify({ error: "Not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { customerId } = await request.json();
    if (!customerId) {
      return new Response(JSON.stringify({ error: "customerId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify subscription is active
    const subData = await SUBSCRIPTIONS.get(`sub:${customerId}`);
    if (!subData || JSON.parse(subData).status !== "active") {
      return new Response(JSON.stringify({ error: "No active subscription" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const key = `usage:${customerId}:${yearMonth}`;

    const current = await SUBSCRIPTIONS.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= 50) {
      return new Response(JSON.stringify({
        error: "Monthly limit reached",
        usage: count,
        limit: 50,
      }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    const newCount = count + 1;
    await SUBSCRIPTIONS.put(key, String(newCount));

    return new Response(JSON.stringify({
      usage: newCount,
      limit: 50,
      remaining: 50 - newCount,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("increment-usage error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
