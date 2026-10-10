exports.handler = async (event) => {
  const headers = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
  if (event.httpMethod === "OPTIONS") return {statusCode:204,headers,body:""};
  if (event.httpMethod !== "POST") return {statusCode:405,headers,body:JSON.stringify({error:"Method not allowed"})};
  const token = process.env.TEBEX_WEBSTORE_TOKEN;
  if (!token) return {statusCode:503,headers,body:JSON.stringify({error:"Tebex checkout is not configured. Add TEBEX_WEBSTORE_TOKEN to your backend environment."})};
  try {
    const body = JSON.parse(event.body||"{}");
    const packageId = String(body.packageId||"");
    if (!/^\d+$/.test(packageId)) return {statusCode:400,headers,body:JSON.stringify({error:"A valid Tebex package ID is required."})};
    const verifyRes = await fetch("https://headless.tebex.io/api/accounts/"+encodeURIComponent(token)+"/packages/"+encodeURIComponent(packageId),{headers:{Accept:"application/json"}});
    const verify = await verifyRes.json().catch(()=>({}));
    if (!verifyRes.ok || !(verify?.data?.[0]||verify?.data||verify)?.id) return {statusCode:404,headers,body:JSON.stringify({error:"That package is not available in the connected Tebex store."})};
    const category = body.category === "bundles" ? "bundles" : "schematic";
    const base = "https://store.mythicalstudios.online/store/categories/"+category+"/";
    const basketRes = await fetch("https://headless.tebex.io/api/accounts/"+encodeURIComponent(token)+"/baskets",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({complete_url:base+"?purchase=complete",cancel_url:base+"?purchase=cancelled",complete_auto_redirect:false})});
    const basket = await basketRes.json().catch(()=>({}));
    if (!basketRes.ok) return {statusCode:502,headers,body:JSON.stringify({error:basket?.message||basket?.error||"Tebex could not create the checkout basket.",status:basketRes.status})};
    const ident = basket?.data?.ident||basket?.ident;
    if (!ident) throw new Error("Tebex created a basket but returned no basket identifier.");
    const addRes = await fetch("https://headless.tebex.io/api/baskets/"+encodeURIComponent(ident)+"/packages",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({package_id:packageId,quantity:1})});
    const added = await addRes.json().catch(()=>({}));
    if (!addRes.ok) return {statusCode:502,headers,body:JSON.stringify({error:added?.message||added?.error||"Tebex could not add this package to the basket.",status:addRes.status})};
    const checkout = added?.links?.checkout||added?.data?.links?.checkout;
    if (!checkout) throw new Error("Tebex accepted the package but did not return a checkout URL.");
    return {statusCode:200,headers,body:JSON.stringify({checkout})};
  } catch(e) { return {statusCode:500,headers,body:JSON.stringify({error:e.message||"Checkout failed."})}; }
};