require("dotenv").config({path:require("path").join(__dirname,".env")});
const express=require("express");
const cors=require("cors");
const multer=require("multer");
const crypto=require("crypto");

const app=express();
app.use(cors({origin:true,credentials:true}));
app.use(express.json({limit:"2mb"}));
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:50*1024*1024}});

const OWNER=process.env.GITHUB_OWNER||"Vexedhere";
const REPO=process.env.GITHUB_REPO||"EmberForge";
const BRANCH=process.env.GITHUB_BRANCH||"Master";
const TOKEN=process.env.GITHUB_TOKEN;
const GH="https://api.github.com";
const PRODUCT_PATH="store-data/products.json";
const sessions=new Map();
const SESSION_TTL=8*60*60*1000;

function headers(){return {Authorization:"Bearer "+TOKEN,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2026-03-10","User-Agent":"Mythical-Studios-Store"}}
async function ghGet(path){const r=await fetch(GH+path,{headers:headers()});if(!r.ok)throw new Error("GitHub GET "+r.status);return r.json()}
async function ghPut(path,body){const r=await fetch(GH+path,{method:"PUT",headers:{...headers(),"Content-Type":"application/json"},body:JSON.stringify(body)});if(!r.ok)throw new Error("GitHub PUT "+r.status+" "+await r.text());return r.json()}

async function readProducts(){
  const f=await ghGet("/repos/"+OWNER+"/"+REPO+"/contents/"+PRODUCT_PATH+"?ref="+encodeURIComponent(BRANCH));
  return {items:JSON.parse(Buffer.from(f.content,"base64").toString("utf8")),sha:f.sha};
}
async function writeRepoFile(path,buffer,message){
  let sha=null;
  try{sha=(await ghGet("/repos/"+OWNER+"/"+REPO+"/contents/"+path+"?ref="+encodeURIComponent(BRANCH))).sha}catch{}
  const body={message,content:buffer.toString("base64"),branch:BRANCH};
  if(sha)body.sha=sha;
  return ghPut("/repos/"+OWNER+"/"+REPO+"/contents/"+path,body);
}
async function saveProducts(items,sha,message){
  const body={message,content:Buffer.from(JSON.stringify(items,null,2)+"\n").toString("base64"),branch:BRANCH};
  if(sha)body.sha=sha;
  return ghPut("/repos/"+OWNER+"/"+REPO+"/contents/"+PRODUCT_PATH,body);
}
function auth(req,res,next){
  const token=(req.headers.authorization||"").replace(/^Bearer\s+/i,"");
  const session=sessions.get(token);
  if(!session||Date.now()>session.expires){sessions.delete(token);return res.status(401).json({error:"Unauthorized"})}
  req.admin=session.user;next();
}
function validPassword(user,password){
  const expected=user==="Chethan"?process.env.ADMIN_CHETHAN_PASSWORD:user==="Vijay"?process.env.ADMIN_VIJAY_PASSWORD:null;
  if(!expected||typeof password!=="string")return false;
  const a=Buffer.from(expected),b=Buffer.from(password);
  return a.length===b.length&&crypto.timingSafeEqual(a,b);
}
function slug(s){return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60)}

app.get("/api/health",(req,res)=>res.json({ok:true,service:"Mythical Studios Store API"}));

app.post("/api/admin/login",(req,res)=>{
  const {username,password}=req.body||{};
  if(!validPassword(username,password))return res.status(401).json({error:"Invalid username or password"});
  const token=crypto.randomBytes(32).toString("hex");
  sessions.set(token,{user:username,expires:Date.now()+SESSION_TTL});
  res.json({token,user:username,expiresIn:SESSION_TTL});
});

app.post("/api/admin/logout",auth,(req,res)=>{
  const token=(req.headers.authorization||"").replace(/^Bearer\s+/i,"");
  sessions.delete(token);res.json({ok:true});
});

app.get("/api/products",async(req,res)=>{
  try{const {items}=await readProducts();res.set("Cache-Control","no-store");res.json(items.filter(item=>item.category!=="ranks"))}
  catch(e){console.error(e);res.status(500).json({error:e.message})}
});

app.post("/api/admin/products",auth,upload.fields([{name:"image",maxCount:1},{name:"file",maxCount:1}]),async(req,res)=>{
  try{
    const {category,title,price,description,features}=req.body||{};
    if(!["ranks","schematic","development"].includes(category))return res.status(400).json({error:"Invalid category"});
    if(!title||!String(title).trim())return res.status(400).json({error:"Title is required"});
    const numericPrice=Number(price);
    if(!Number.isFinite(numericPrice)||numericPrice<0)return res.status(400).json({error:"Valid price is required"});

    const id=slug(title)+"-"+Date.now().toString(36);
    const image=req.files?.image?.[0];
    const file=req.files?.file?.[0];
    let imageUrl="",fileUrl="";

    if(image){
      const ext=(image.originalname.match(/\.[a-z0-9]+$/i)||[".png"])[0].toLowerCase();
      const p="store-data/uploads/"+id+"/image"+ext;
      const out=await writeRepoFile(p,image.buffer,"Add product image: "+title);
      imageUrl=out.content?.download_url||"https://raw.githubusercontent.com/"+OWNER+"/"+REPO+"/"+BRANCH+"/"+p;
    }
    if(file){
      const safe=slug(file.originalname)||"product-file";
      const p="store-data/uploads/"+id+"/"+safe;
      const out=await writeRepoFile(p,file.buffer,"Add product file: "+title);
      fileUrl=out.content?.download_url||"https://raw.githubusercontent.com/"+OWNER+"/"+REPO+"/"+BRANCH+"/"+p;
    }

    const product={
      id,category,title:String(title).trim(),price:numericPrice,image:imageUrl,file:fileUrl,
      description:String(description||"").trim(),
      features:String(features||"").split("\n").map(x=>x.trim()).filter(Boolean),
      createdAt:new Date().toISOString(),createdBy:req.admin
    };

    const current=await readProducts();
    current.items.push(product);
    await saveProducts(current.items,current.sha,"Add store product: "+title);

    let discordNotified=false;
    if(typeof global.discordAnnounce==="function")discordNotified=await global.discordAnnounce(product);
    res.json({ok:true,product,discordNotified});
  }catch(e){console.error(e);res.status(500).json({error:e.message})}
});

app.get("/api/admin/products",auth,async(req,res)=>{
  try{res.json((await readProducts()).items)}catch(e){res.status(500).json({error:e.message})}
});

function startStoreApi(){
  const port=Number(process.env.PORT||3000);
  return app.listen(port,()=>console.log("Mythical Studios Store API listening on "+port));
}
if(require.main===module)startStoreApi();
module.exports={app,startStoreApi};
