(() => {
const ASSETS = [
 {title:"Fantasy Kingdom Spawn",category:"schematic",image:"/watermarked_img_3616352537406497039.jpg",desc:"A grand fantasy kingdom hub with ornate towers and a welcoming central spawn.",match:["fantasy kingdom","kingdom spawn"],fallbackId:"7721409"},
 {title:"Medieval Town",category:"schematic",image:"/watermarked_img_12594208822220901011.jpg",desc:"A detailed medieval settlement for a server hub or roleplay world.",match:["medieval town","marketplace","merchant marketplace"],fallbackId:"7721411"},
 {title:"Sakura Islands",category:"schematic",image:"/watermarked_img_13509107889311687906.jpg",desc:"A peaceful Japanese-inspired island build surrounded by cherry blossoms.",match:["sakura islands","sakura island"],fallbackId:"7721427"},
 {title:"Void Abyss",category:"schematic",image:"/watermarked_img_7481098209889169911.jpg",desc:"A dramatic floating-island environment with a deep violet fantasy atmosphere.",match:["void abyss"],fallbackId:"7721425"},
 {title:"Dwarven Mines BedWars",category:"schematic",image:"/watermarked_img_192314454874642953.jpg",desc:"A cavernous arena environment with towering rock formations and glowing lava.",match:["dwarven mines","dwarven bedwars"],fallbackId:"7721426"},
 {title:"Desert Pharaoh",category:"schematic",image:"/watermarked_img_6901843059209736336.jpg",desc:"A sunlit Egyptian-inspired monument and desert spawn environment.",match:["desert pharaoh","pharaoh"],fallbackId:"7721428"},
 {title:"Starter Base Village",category:"schematic",image:"/watermarked_img_8621495114774870343.jpg",desc:"A ready-to-use starter settlement with paths, crops and cosy survival homes.",match:["starter base village","starter village"],fallbackId:"7721430"},
 {title:"Underground Bunker",category:"schematic",image:"/watermarked_img_16328944419284729908.jpg",desc:"A fortified underground survival sanctuary with industrial detailing.",match:["underground bunker","bunker"],fallbackId:"7721441"},
 {title:"Japanese Survival Village",category:"schematic",image:"/watermarked_img_2661084996312802032.jpg",desc:"A scenic Japanese-style village with bridges, gardens and cherry blossoms.",match:["japanese survival village","japanese village"],fallbackId:"7721438"},
 {title:"Medieval Castle Base",category:"schematic",image:"/watermarked_img_2925358816652433489.jpg",desc:"A fortified medieval castle base built for survival or roleplay worlds.",match:["medieval castle","castle base"],fallbackId:""},
 {title:"Nether Fortress Base",category:"schematic",image:"/watermarked_img_3057794419792885800.jpg",desc:"A fiery Nether-inspired fortress with a bold, imposing silhouette.",match:["nether fortress","nether base"],fallbackId:"7721460"},
 {title:"Automatic Farm District",category:"schematic",image:"/watermarked_img_5512894506101482259.jpg",desc:"A modular farming district for organised survival worlds and server economies.",match:["automatic farm","farm district"],fallbackId:"7721436"},
 {title:"Survival Trading Hall",category:"schematic",image:"/watermarked_img_6493711024684314253.jpg",desc:"A compact trading hall and market area for survival servers.",match:["survival trading","trading hall"],fallbackId:"7721434"},
 {title:"Mountain Kingdom",category:"schematic",image:"/watermarked_img_97384995695518413.jpg",desc:"A snowy mountain citadel with dramatic bridges and a fortified skyline.",match:["mountain kingdom"],fallbackId:"7721437"},
 {title:"Shadow PvP Bundle",category:"bundles",image:"/watermarked_img_11485957835403401051.jpg",desc:"A dark, shadow-themed PvP collection for a cohesive server environment.",match:["shadow pvp","shadow bundle"],fallbackId:""},
 {title:"Toxic PvP Bundle",category:"bundles",image:"/watermarked_img_1261070181889838645.jpg",desc:"A vivid green, toxic-themed PvP collection with matching map assets.",match:["toxic pvp","toxic bundle"],fallbackId:""},
 {title:"Frost PvP Bundle",category:"bundles",image:"/watermarked_img_13537126763685953181.jpg",desc:"An icy blue collection built around a frosted PvP atmosphere.",match:["frost pvp","frost bundle"],fallbackId:""},
 {title:"Sakura PvP Bundle",category:"bundles",image:"/watermarked_img_13580150828721582999.jpg",desc:"A pink sakura-inspired PvP collection with coordinated Japanese styling.",match:["sakura pvp","sakura bundle"],fallbackId:""},
 {title:"Solar PvP Bundle",category:"bundles",image:"/watermarked_img_14111434501963035019.jpg",desc:"A radiant gold-and-sun themed PvP collection for a bright, epic arena style.",match:["solar pvp","solar bundle"],fallbackId:""},
 {title:"Void PvP Bundle",category:"bundles",image:"/watermarked_img_7099745261303432764.jpg",desc:"A cosmic purple PvP collection with a void-inspired visual theme.",match:["void pvp","void bundle"],fallbackId:""},
 {title:"Ocean PvP Bundle",category:"bundles",image:"/watermarked_img_980384704362039570.jpg",desc:"A deep-sea themed PvP collection with a striking ocean-blue palette.",match:["ocean pvp","ocean bundle"],fallbackId:""}
];
const $ = id => document.getElementById(id);
const pageCategory = document.body.dataset.category === "bundles" ? "bundles" : "schematic";
const slug = s => String(s||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const isBundle = p => {const c=typeof p.category==="object"?p.category?.name:p.category;const t=slug((p.title||p.name||"")+" "+(c||""));return /bundle|pvp/.test(t)||/bundle/.test(slug(c));};
const assetFor = p => {const title=slug(p.title||p.name||"");const bundle=isBundle(p);return ASSETS.find(a=>a.category===(bundle?"bundles":"schematic")&&a.match.some(k=>title.includes(slug(k))))||null;};
const priceOf = p => {const v=Number(p.price??p.base_price??p.total_price);return Number.isFinite(v)&&v>0?v:null;};
const money = p => {const value=priceOf(p);if(value===null)return "Price loads from Tebex";const currency=String(p.currency||"USD").toUpperCase();try{return new Intl.NumberFormat("en-US",{style:"currency",currency,maximumFractionDigits:2}).format(value)}catch{return value.toFixed(2)+" "+currency}};
const clean = s => String(s||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
let products=[],live=false,selected=null;
function imageFor(p){const a=assetFor(p);return a?.image||p.image||p.image_url||"/spawn.jpg";}
function fallbackProducts(){return ASSETS.filter(a=>a.category===pageCategory).map(a=>({id:a.fallbackId||"",packageId:a.fallbackId||"",title:a.title,description:a.desc,image:a.image,category:{name:pageCategory==="bundles"?"Bundles":"Schematics"},price:null,currency:"USD",_asset:a,_fallback:true}));}
function filteredProducts(){
 const query=$("search").value.trim().toLowerCase(),chosen=$("category").value,pf=$("priceFilter").value,sort=$("sort").value;
 let rows=products.filter(p=>{
  const a=assetFor(p),bundle=isBundle(p),cat=typeof p.category==="object"?p.category?.name:p.category;
  if(pageCategory==="bundles"&&!bundle&&a?.category!=="bundles")return false;
  if(pageCategory==="schematic"&&(bundle||(a&&a.category!=="schematic")))return false;
  if(pageCategory==="schematic"&&!a&&!/schem|build/i.test(String(cat||"")))return false;
  if(query&&![p.title,p.description,p.desc,cat,a?.title].map(x=>String(x||"")).join(" ").toLowerCase().includes(query))return false;
  if(chosen!=="all"&&a?.title!==chosen&&String(cat||"")!==chosen)return false;
  const price=priceOf(p);if(pf==="under5"&&(price===null||price>=5))return false;if(pf==="5plus"&&(price===null||price<5))return false;
  return true;
 });
 if(sort==="low")rows.sort((a,b)=>(priceOf(a)??Infinity)-(priceOf(b)??Infinity));
 if(sort==="high")rows.sort((a,b)=>(priceOf(b)??-Infinity)-(priceOf(a)??-Infinity));
 if(sort==="name")rows.sort((a,b)=>(a.title||a.name||"").localeCompare(b.title||b.name||""));
 return rows;
}
function render(){
 const rows=filteredProducts();$("count").textContent=rows.length+" item"+(rows.length===1?"":"s");$("heroCount").textContent=products.length;
 const grid=$("grid");if(!rows.length){grid.innerHTML='<div class="empty"><strong>No matching products</strong>Try another search or filter, or check back when more items are published.</div>';return;}
 grid.innerHTML=rows.map((p,i)=>{
  const a=assetFor(p)||p._asset,title=p.title||p.name||a?.title||"Mythical Studios Build",desc=clean(p.description||p.desc||a?.desc||"A premium Minecraft resource from Mythical Studios."),id=String(p.packageId||p.id||""),img=imageFor(p),price=money(p),buyable=live&&!!id&&priceOf(p)!==null,label=p._fallback?"PREVIEW":(i<2?"STUDIO PICK":(pageCategory==="bundles"?"BUNDLE":"SCHEMATIC")),version=clean(p.version||p.minecraft_version||""),format=clean(p.format||p.file_format||"");
  return '<article class="card"><div class="photo"><img src="'+img+'" alt="'+title.replace(/"/g,"&quot;")+' preview" loading="lazy"><span class="num">'+String(i+1).padStart(2,"0")+'</span><span class="pill">'+label+'</span></div><div class="body"><div class="categoryTag">'+(pageCategory==="bundles"?"Bundle collection":"Minecraft schematic")+'</div><div class="title">'+title+'</div><div class="desc">'+desc+'</div><div class="metaTags"><span class="metaTag">'+(version?version.toUpperCase():"VERSION · CHECK LISTING")+'</span><span class="metaTag">'+(format?format.toUpperCase():"FORMAT · CHECK LISTING")+'</span></div><div class="bottom"><span class="price">'+price+'</span><button class="buy" data-product="'+encodeURIComponent(id)+'" '+(!buyable?"disabled":"")+'>'+(buyable?"VIEW & BUY →":(p._fallback?"TEBEX NOT LINKED":"PRICE UNAVAILABLE"))+'</button></div></div></article>';
 }).join("");
 grid.querySelectorAll("img").forEach(img=>img.addEventListener("error",()=>{img.onerror=null;img.src="/spawn.jpg";}));
 grid.querySelectorAll("button[data-product]").forEach(btn=>btn.addEventListener("click",()=>{const id=decodeURIComponent(btn.dataset.product||"");selected=rows.find(p=>String(p.packageId||p.id||"")===id);if(selected)openModal(selected);}));
}
function openModal(p){
 const a=assetFor(p)||p._asset;$("modalNum").textContent=pageCategory==="bundles"?"MYTHICAL STUDIOS · BUNDLE":"MYTHICAL STUDIOS · SCHEMATIC";$("modalTitle").textContent=p.title||p.name||a?.title||"Minecraft resource";$("modalDesc").textContent=clean(p.description||p.desc||a?.desc||"Premium Minecraft resource.");
 $("modalMeta").innerHTML='<span>'+pageCategory.toUpperCase()+'</span><span>'+clean(p.version||p.minecraft_version||"VERSION DETAILS IN LISTING")+'</span><span>'+clean(p.format||p.file_format||"FORMAT DETAILS IN LISTING")+'</span>';$("modalPrice").textContent=money(p);$("modalImg").innerHTML='<img src="'+imageFor(p)+'" alt="Preview">';
 $("checkout").disabled=!(live&&(p.packageId||p.id));$("checkout").textContent=$("checkout").disabled?"TEBEX CHECKOUT UNAVAILABLE":"CONTINUE TO TEBEX CHECKOUT";$("hint").textContent=$("checkout").disabled?"Live package details are needed before checkout can be enabled.":"Secure checkout and digital delivery handled by Tebex.";$("modal").classList.add("open");
}
async function checkout(){
 if(!selected||!live)return;const id=String(selected.packageId||selected.id||"");if(!id)return;const b=$("checkout");b.disabled=true;b.textContent="CREATING SECURE CHECKOUT…";
 const payload=JSON.stringify({packageId:id,category:pageCategory});let last="Tebex checkout is not configured yet.";
 for(const url of ["https://api.mythicalstudios.online/api/tebex/checkout","https://api.mythicalstudios.online/.netlify/functions/tebex-checkout","/.netlify/functions/tebex-checkout"]){
  try{const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:payload}),j=await r.json().catch(()=>({}));if(!r.ok){last=j.error||"Tebex checkout could not be created.";continue;}const next=j.checkout||j.url;if(next){location.assign(next);return;}}
  catch(e){last="Store checkout service is offline. Please try again later.";}
 }
 alert(last);b.disabled=false;b.textContent="CONTINUE TO TEBEX CHECKOUT";
}
async function loadPackages(){
 for(const url of ["https://api.mythicalstudios.online/api/tebex/packages","https://api.mythicalstudios.online/.netlify/functions/tebex-packages","/.netlify/functions/tebex-packages"]){
  try{const r=await fetch(url,{cache:"no-store"});if(!r.ok)continue;const j=await r.json(),rows=Array.isArray(j.packages)?j.packages:(Array.isArray(j.data)?j.data:[]);if(!rows.length)continue;
   products=rows.map(p=>({...p,id:String(p.id||p.packageId||""),packageId:String(p.packageId||p.id||""),title:p.title||p.name||"",description:clean(p.description||p.desc||""),price:p.price??p.base_price??p.total_price,category:p.category||p.category_name||"",image:p.image||p.image_url||"",currency:p.currency||"USD"}));live=true;$("status").classList.remove("show");render();return;
  }catch(e){}
 }
 products=fallbackProducts();live=false;$("status").classList.add("show");$("status").textContent="Showing your uploaded preview images. Live prices and checkout appear when the Tebex API is deployed and its webstore token is configured.";render();
}
$("search").addEventListener("input",render);$("sort").addEventListener("change",render);$("category").addEventListener("change",render);$("priceFilter").addEventListener("change",render);
$("close").addEventListener("click",()=>$("modal").classList.remove("open"));$("modal").addEventListener("click",e=>{if(e.target.id==="modal")$("modal").classList.remove("open")});document.addEventListener("keydown",e=>{if(e.key==="Escape")$("modal").classList.remove("open")});$("checkout").addEventListener("click",checkout);loadPackages();
})();