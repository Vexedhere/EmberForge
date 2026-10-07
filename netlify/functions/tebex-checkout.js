exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  try {
    const body = JSON.parse(event.body || "{}");
    const packageId = String(body.packageId || "");
    const allowed = new Set([
      "7721409","7721410","7721411","7721418","7721419",
      "7721423","7721425","7721426","7721427","7721428",
      "7721430","7721431","7721434","7721436","7721437",
      "7721438","7721441","7721442","7721459","7721460"
    ]);

    if (!allowed.has(packageId)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid Tebex package." }) };
    }

    const token = process.env.TEBEX_WEBSTORE_TOKEN;
    if (!token) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Tebex is not configured yet. Add the TEBEX_WEBSTORE_TOKEN environment variable in Netlify."
        })
      };
    }

    const origin = event.headers?.origin || event.headers?.referer || "https://store.mythicalstudios.online/";
    const siteUrl = "https://store.mythicalstudios.online";

    const basketRes = await fetch("https://headless.tebex.io/api/accounts/" + encodeURIComponent(token) + "/baskets", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        complete_url: siteUrl + "/store/categories/schematic/?purchase=complete",
        cancel_url: siteUrl + "/store/categories/schematic/?purchase=cancelled"
      })
    });

    const basket = await basketRes.json();
    if (!basketRes.ok) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: basket?.message || basket?.error || "Tebex basket creation failed." }) };
    }

    const ident = basket?.data?.ident || basket?.ident;
    if (!ident) throw new Error("Tebex did not return a basket identifier.");

    const addRes = await fetch("https://headless.tebex.io/api/baskets/" + encodeURIComponent(ident) + "/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ package_id: packageId, quantity: 1 })
    });

    const added = await addRes.json();
    if (!addRes.ok) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: added?.message || added?.error || "Tebex could not add the package to the basket." }) };
    }

    const checkout = added?.links?.checkout || added?.data?.links?.checkout;
    if (!checkout) throw new Error("Tebex did not return a checkout URL.");

    return { statusCode: 200, headers, body: JSON.stringify({ checkout }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message || "Checkout failed." }) };
  }
};