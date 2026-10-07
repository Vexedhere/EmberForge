exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "GET") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  const token = process.env.TEBEX_WEBSTORE_TOKEN;
  if (!token) return { statusCode: 500, headers, body: JSON.stringify({ error: "Tebex is not configured." }) };

  const ids = ["7721409","7721410","7721411","7721418","7721419","7721423","7721425","7721426","7721427","7721428","7721430","7721431","7721434","7721436","7721437","7721438","7721441","7721442","7721459","7721460"];

  try {
    const results = await Promise.all(ids.map(async id => {
      const r = await fetch("https://headless.tebex.io/api/accounts/" + encodeURIComponent(token) + "/packages/" + id, { headers: { "Accept": "application/json" } });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return { id, error: j?.message || j?.error || "Package unavailable" };
      const p = j?.data?.[0] || j?.data || j;
      return {
        id,
        title: p?.name || "",
        description: String(p?.description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
        image: p?.image || p?.media?.[0]?.url || "",
        price: Number(p?.base_price ?? p?.total_price ?? 0),
        currency: p?.currency || "USD"
      };
    }));
    return { statusCode: 200, headers, body: JSON.stringify({ packages: results }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message || "Could not load Tebex packages." }) };
  }
};
