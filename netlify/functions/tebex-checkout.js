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
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid or unpublished Tebex package." }) };
    }

    const token = process.env.TEBEX_WEBSTORE_TOKEN;
    if (!token) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Tebex checkout is not configured on the store. Add TEBEX_WEBSTORE_TOKEN in Netlify → Site configuration → Environment variables." }) };
    }

    const siteUrl = "https://store.mythicalstudios.online";
    const basketRes = await fetch("https://headless.tebex.io/api/accounts/" + encodeURIComponent(token) + "/baskets", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        complete_url: siteUrl + "/store/categories/schematic/?purchase=complete",
        cancel_url: siteUrl + "/store/categories/schematic/?purchase=cancelled",
        complete_auto_redirect: false
      })
    });

    const basket = await basketRes.json().catch(() => ({}));
    if (!basketRes.ok) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: basket?.message || basket?.error || "Tebex could not create the checkout basket.", status: basketRes.status }) };
    }

    const ident = basket?.data?.ident || basket?.ident;
    if (!ident) throw new Error("Tebex created a basket but returned no basket identifier.");

    const addRes = await fetch("https://headless.tebex.io/api/baskets/" + encodeURIComponent(ident) + "/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ package_id: packageId, quantity: 1 })
    });

    const added = await addRes.json().catch(() => ({}));
    if (!addRes.ok) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: added?.message || added?.error || "Tebex could not add this schematic to the basket.", status: addRes.status, packageId }) };
    }

    const checkoutUrl = added?.links?.checkout || added?.data?.links?.checkout;
    if (!checkoutUrl) throw new Error("Tebex accepted the package but did not return a checkout URL.");

    return { statusCode: 200, headers, body: JSON.stringify({ checkout: checkoutUrl }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message || "Checkout failed." }) };
  }
};
