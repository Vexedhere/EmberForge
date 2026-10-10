require("dotenv").config({path:require("path").join(__dirname,".env")});
const express=require("express");
const cors=require("cors");
const multer=require("multer");
const crypto=require("crypto");
const {createClient}=require("@supabase/supabase-js");

const app=express();
app.use(cors({origin:true,credentials:true}));
app.use(express.json({limit:"2mb"}));
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:50*1024*1024}});

const SUPABASE_URL=process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY=process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET=process.env.SUPABASE_BUCKET||"store-resources";
if(!SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY){
  console.warn("Supabase environment variables are missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
}
const supabase=createClient(SUPABASE_URL||"https://placeholder.supabase.co",SUPABASE_SERVICE_ROLE_KEY||"placeholder",{
  auth:{persistSession:false,autoRefreshToken:false}
});

const sessions=new Map();
const SESSION_TTL=8*60*60*1000;

function auth(req,res,next){
  const token=(req.headers.authorization||"").replace(/^Bearer\s+/i,"");
  const session=sessions.get(token);
  if(!session||Date.now()>session.expires){
    sessions.delete(token);
    return res.status(401).json({error:"Unauthorized"});
  }
  req.admin=session.user;
  next();
}
function validPassword(user,password){
  const expected=user==="Chethan"?process.env.ADMIN_CHETHAN_PASSWORD:user==="Vijay"?process.env.ADMIN_VIJAY_PASSWORD:null;
  if(!expected||typeof password!=="string")return false;
  const a=Buffer.from(expected),b=Buffer.from(password);
  return a.length===b.length&&crypto.timingSafeEqual(a,b);
}
function slug(s){
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60);
}
function publicProduct(row,urls={}){
  return {
    id:row.id,
    category:row.category,
    title:row.title,
    price:Number(row.price||0),
    image:urls.image||"",
    file:urls.file||"",
    description:row.description||"",
    features:Array.isArray(row.features)?row.features:[],
    createdAt:row.created_at,
    published:row.published
  };
}
async function signedPath(path){
  if(!path)return "";
  const {data,error}=await supabase.storage.from(BUCKET).createSignedUrl(path,60*60);
  if(error)throw error;
  return data?.signedUrl||"";
}
async function withUrls(row){
  return publicProduct(row,{
    image:await signedPath(row.image_path),
    file:await signedPath(row.file_path)
  });
}

app.get("/api/health",async(req,res)=>{
  try{
    const {error}=await supabase.from("products").select("id",{head:true,count:"exact"});
    if(error)throw error;
    res.json({ok:true,service:"Mythical Studios Store API",storage:"supabase",database:"supabase"});
  }catch(e){
    res.status(503).json({ok:false,service:"Mythical Studios Store API",error:e.message});
  }
});

app.post("/api/admin/login",(req,res)=>{
  const {username,password}=req.body||{};
  if(!validPassword(username,password))return res.status(401).json({error:"Invalid username or password"});
  const token=crypto.randomBytes(32).toString("hex");
  sessions.set(token,{user:username,expires:Date.now()+SESSION_TTL});
  res.json({token,user:username,expiresIn:SESSION_TTL});
});

app.post("/api/admin/logout",auth,(req,res)=>{
  const token=(req.headers.authorization||"").replace(/^Bearer\s+/i,"");
  sessions.delete(token);
  res.json({ok:true});
});

app.get("/api/products",async(req,res)=>{
  try{
    const {data,error}=await supabase.from("products").select("*").eq("published",true).neq("category","ranks").order("created_at",{ascending:false});
    if(error)throw error;
    res.set("Cache-Control","no-store");
    res.json(await Promise.all((data||[]).map(withUrls)));
  }catch(e){
    console.error(e);
    res.status(500).json({error:e.message});
  }
});

app.post("/api/admin/products",auth,upload.fields([{name:"image",maxCount:1},{name:"file",maxCount:1}]),async(req,res)=>{
  try{
    const {category,title,price,description,features}=req.body||{};
    if(!["ranks","schematic","bundles","development"].includes(category))return res.status(400).json({error:"Invalid category"});
    if(!title||!String(title).trim())return res.status(400).json({error:"Title is required"});
    const numericPrice=Number(price);
    if(!Number.isFinite(numericPrice)||numericPrice<0)return res.status(400).json({error:"Valid price is required"});

    const id=slug(title)+"-"+Date.now().toString(36);
    const image=req.files?.image?.[0];
    const file=req.files?.file?.[0];
    let imagePath="",filePath="";

    if(image){
      const ext=(image.originalname.match(/\.[a-z0-9]+$/i)||[".png"])[0].toLowerCase();
      imagePath="images/"+id+"/image"+ext;
      const {error}=await supabase.storage.from(BUCKET).upload(imagePath,image.buffer,{contentType:image.mimetype||"application/octet-stream",upsert:false});
      if(error)throw error;
    }
    if(file){
      const safe=(slug(file.originalname)||"product-file").slice(0,100);
      filePath="files/"+id+"/"+safe;
      const {error}=await supabase.storage.from(BUCKET).upload(filePath,file.buffer,{contentType:file.mimetype||"application/octet-stream",upsert:false});
      if(error)throw error;
    }

    const featureList=String(features||"").split("\n").map(x=>x.trim()).filter(Boolean);
    const {data,error}=await supabase.from("products").insert({
      id,
      title:String(title).trim(),
      description:String(description||"").trim(),
      category,
      price:numericPrice,
      image_path:imagePath||null,
      file_path:filePath||null,
      features:featureList,
      published:true
    }).select("*").single();
    if(error)throw error;

    res.json({ok:true,product:await withUrls(data),createdBy:req.admin});
  }catch(e){
    console.error(e);
    res.status(500).json({error:e.message});
  }
});

app.get("/api/admin/products",auth,async(req,res)=>{
  try{
    const {data,error}=await supabase.from("products").select("*").order("created_at",{ascending:false});
    if(error)throw error;
    res.json(await Promise.all((data||[]).map(withUrls)));
  }catch(e){
    console.error(e);
    res.status(500).json({error:e.message});
  }
});


app.get("/api/tebex/packages",async(req,res)=>{
  const token=process.env.TEBEX_WEBSTORE_TOKEN;
  if(!token)return res.status(503).json({error:"Tebex is not configured. Set TEBEX_WEBSTORE_TOKEN in the backend environment."});
  try{
    const r=await fetch("https://headless.tebex.io/api/accounts/"+encodeURIComponent(token)+"/packages",{headers:{Accept:"application/json"}});
    const j=await r.json().catch(()=>({}));
    if(!r.ok)return res.status(502).json({error:j?.message||j?.error||"Tebex catalogue request failed.",status:r.status});
    const packages=(Array.isArray(j?.data)?j.data:[]).map(p=>({id:String(p.id),title:p.name||"",description:String(p.description||"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),image:p.image||p.media?.[0]?.url||"",price:Number(p.base_price??p.total_price??0),currency:p.currency||"USD",category:p.category||"",type:p.type||""}));
    res.set("Cache-Control","no-store");res.json({packages});
  }catch(e){console.error(e);res.status(500).json({error:e.message||"Could not load Tebex packages."});}
});
app.post("/api/tebex/checkout",async(req,res)=>{
  const token=process.env.TEBEX_WEBSTORE_TOKEN;
  if(!token)return res.status(503).json({error:"Tebex checkout is not configured. Set TEBEX_WEBSTORE_TOKEN in the backend environment."});
  try{
    const packageId=String(req.body?.packageId||"");
    if(!/^\d+$/.test(packageId))return res.status(400).json({error:"A valid Tebex package ID is required."});
    const verifyRes=await fetch("https://headless.tebex.io/api/accounts/"+encodeURIComponent(token)+"/packages/"+encodeURIComponent(packageId),{headers:{Accept:"application/json"}});
    const verify=await verifyRes.json().catch(()=>({}));
    const verified=verify?.data?.[0]||verify?.data||verify;
    if(!verifyRes.ok||!verified?.id)return res.status(404).json({error:"That package is not available in the connected Tebex store."});
    const category=req.body?.category==="bundles"?"bundles":"schematic";
    const base="https://store.mythicalstudios.online/store/categories/"+category+"/";
    const basketRes=await fetch("https://headless.tebex.io/api/accounts/"+encodeURIComponent(token)+"/baskets",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({complete_url:base+"?purchase=complete",cancel_url:base+"?purchase=cancelled",complete_auto_redirect:false})});
    const basket=await basketRes.json().catch(()=>({}));
    if(!basketRes.ok)return res.status(502).json({error:basket?.message||basket?.error||"Tebex could not create the checkout basket.",status:basketRes.status});
    const ident=basket?.data?.ident||basket?.ident;if(!ident)throw new Error("Tebex created a basket but returned no basket identifier.");
    const addRes=await fetch("https://headless.tebex.io/api/baskets/"+encodeURIComponent(ident)+"/packages",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({package_id:packageId,quantity:1})});
    const added=await addRes.json().catch(()=>({}));
    if(!addRes.ok)return res.status(502).json({error:added?.message||added?.error||"Tebex could not add this package to the basket.",status:addRes.status});
    const checkout=added?.links?.checkout||added?.data?.links?.checkout;
    if(!checkout)throw new Error("Tebex accepted the package but did not return a checkout URL.");
    res.json({checkout});
  }catch(e){console.error(e);res.status(500).json({error:e.message||"Checkout failed."});}
});

function startStoreApi(){
  const port=Number(process.env.PORT||3000);
  return app.listen(port,()=>console.log("Mythical Studios Store API listening on "+port));
}
if(require.main===module)startStoreApi();
module.exports={app,startStoreApi};
