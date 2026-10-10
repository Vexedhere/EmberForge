exports.handler = async (event) => {
  const headers = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"GET, OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
  if (event.httpMethod === "OPTIONS") return {statusCode:204,headers,body:""};
  if (event.httpMethod !== "GET") return {statusCode:405,headers,body:JSON.stringify({error:"Method not allowed"})};
  const token = process.env.TEBEX_WEBSTORE_TOKEN;
  if (!token) return {statusCode:503,headers,body:JSON.stringify({error:"Tebex is not configured. Set TEBEX_WEBSTORE_TOKEN in the backend environment."})};
  try {
    const r = await fetch("https://headless.tebex.io/api/accounts/"+encodeURIComponent(token)+"/packages",{headers:{Accept:"application/json"}});
    const j = await r.json().catch(()=>({}));
    if (!r.ok) return {statusCode:502,headers,body:JSON.stringify({error:j?.message||j?.error||"Tebex catalogue request failed.",status:r.status})};
    const rows = Array.isArray(j?.data) ? j.data : [];
    const packages = rows.map(p => ({id:String(p.id),title:p.name||"",description:String(p.description||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),image:p.image||p.media?.[0]?.url||"",price:Number(p.base_price??p.total_price??0),currency:p.currency||"USD",category:p.category||"",type:p.type||""}));
    return {statusCode:200,headers,body:JSON.stringify({packages})};
  } catch(e) { return {statusCode:500,headers,body:JSON.stringify({error:e.message||"Could not load Tebex packages."})}; }
};