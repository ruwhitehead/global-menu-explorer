import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";

function useFonts() {
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet"; l.media = "print";
    l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=DM+Sans:wght@400;500;600&display=swap";
    l.onload = () => { l.media = "all"; };
    document.head.appendChild(l);
    const s = document.createElement("style");
    s.textContent = `*{font-family:'DM Sans',sans-serif!important}.fd{font-family:'Playfair Display',serif!important}`;
    document.head.appendChild(s);
  }, []);
}

const COUNTRIES = [
  { code:"FR", name:"France",         lang:"French",         color:"#002395", accent:"#ED2939" },
  { code:"IT", name:"Italy",          lang:"Italian",        color:"#008C45", accent:"#CE2B37" },
  { code:"DE", name:"Germany",        lang:"German",         color:"#444",    accent:"#DD0000" },
  { code:"ES", name:"Spain",          lang:"Spanish",        color:"#AA151B", accent:"#F1BF00" },
  { code:"CN", name:"China",          lang:"Chinese",        color:"#DE2910", accent:"#FFDE00" },
  { code:"BR", name:"Brazil",         lang:"Portuguese",     color:"#009C3B", accent:"#FFDF00" },
  { code:"NG", name:"Nigeria",        lang:"English/Yoruba", color:"#008751", accent:"#4caf50" },
  { code:"TH", name:"Thailand",       lang:"Thai",           color:"#A51931", accent:"#2D2A4A" },
  { code:"PL", name:"Poland",         lang:"Polish",         color:"#DC143C", accent:"#8B0000" },
  { code:"VN", name:"Vietnam",        lang:"Vietnamese",     color:"#DA251D", accent:"#FFCD00" },
  { code:"GB", name:"United Kingdom", lang:"English",        color:"#012169", accent:"#C8102E" },
  { code:"IN", name:"India",          lang:"Hindi/Regional", color:"#FF9933", accent:"#138808" },
];

const WC = ["#e74c3c","#e67e22","#f1c40f","#2ecc71","#1abc9c","#3498db","#9b59b6","#e91e63","#00bcd4","#ff5722","#8bc34a","#ff9800"];

const DISH_TYPES = [
  { keys:["soup","broth","pho","ramen","tom yum","chowder","gazpacho","borscht","żurek","bouillabaisse"], bg:"#fff3e0", icon:"🍜", accent:"#e65100" },
  { keys:["pizza","flatbread","naan","pita","tarte"], bg:"#fce4ec", icon:"🍕", accent:"#c2185b" },
  { keys:["pasta","carbonara","lasagne","lasagna","gnocchi","spaghetti","penne","tagliatelle","fettuccine"], bg:"#f3e5f5", icon:"🍝", accent:"#7b1fa2" },
  { keys:["rice","biryani","risotto","paella","jollof","fried rice","chow","pilaf","arroz"], bg:"#e8f5e9", icon:"🍚", accent:"#2e7d32" },
  { keys:["curry","masala","tikka","makhani","korma","vindaloo","rendang"], bg:"#fff8e1", icon:"🍛", accent:"#f57f17" },
  { keys:["steak","beef","schnitzel","wiener","sauerbraten","churrasco","wellington"], bg:"#fbe9e7", icon:"🥩", accent:"#bf360c" },
  { keys:["chicken","pollo","poulet","murgh","coq au vin","tandoori"], bg:"#fff9c4", icon:"🍗", accent:"#f9a825" },
  { keys:["fish","chips","seafood","prawn","shrimp","crab","lobster","moqueca","ceviche"], bg:"#e3f2fd", icon:"🐟", accent:"#1565c0" },
  { keys:["dumpling","pierogi","gyoza","dim sum","wonton","ravioli"], bg:"#e8eaf6", icon:"🥟", accent:"#283593" },
  { keys:["bread","croissant","baguette","pretzel","brioche","scone","pão"], bg:"#efebe9", icon:"🥐", accent:"#4e342e" },
  { keys:["salad","slaw","som tam","papaya","tabbouleh"], bg:"#f1f8e9", icon:"🥗", accent:"#558b2f" },
  { keys:["cake","dessert","tiramisu","brulee","pudding","tart","torte","gulab","churros","crepe","crêpe","panna cotta","mango sticky","brigadeiro"], bg:"#fce4ec", icon:"🍰", accent:"#ad1457" },
  { keys:["sausage","bratwurst","kielbasa","currywurst","chorizo","wurst","bangers"], bg:"#fff3e0", icon:"🌭", accent:"#e65100" },
  { keys:["egg","omelette","tortilla","quiche","frittata"], bg:"#fffde7", icon:"🍳", accent:"#f57f17" },
  { keys:["tofu","miso","mapo","tempeh"], bg:"#e0f2f1", icon:"🫘", accent:"#00695c" },
  { keys:["wrap","taco","burrito","shawarma","kebab","banh mi","bánh mì","sandwich","falafel"], bg:"#fff8e1", icon:"🌮", accent:"#e65100" },
  { keys:["roast","sunday roast","grilled","barbecue","bbq"], bg:"#fbe9e7", icon:"🍖", accent:"#b71c1c" },
];

const imgCache = new Map();
function getDishStyle(local, english) {
  const key = `${local}|${english}`;
  if (imgCache.has(key)) return imgCache.get(key);
  const text = `${(english||"").toLowerCase()} ${(local||"").toLowerCase()}`;
  for (const t of DISH_TYPES) {
    if (t.keys.some(k => text.includes(k))) { imgCache.set(key, t); return t; }
  }
  const fallback = { bg:"#eceff1", icon:"🍽️", accent:"#546e7a" };
  imgCache.set(key, fallback);
  return fallback;
}

function SpinWheel({ items, colors, onResult, onClose, label="name" }) {
  const cvs = useRef(null);
  const ang = useRef(0), vel = useRef(0), raf = useRef(null);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const n = items.length;
  const arc = (2 * Math.PI) / n;

  const draw = useCallback((a) => {
    const c = cvs.current; if (!c) return;
    const ctx = c.getContext("2d"), cx = c.width/2, cy = c.height/2, r = cx - 6;
    ctx.clearRect(0,0,c.width,c.height);
    for (let i=0;i<n;i++) {
      const s=a+i*arc, e=s+arc;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,s,e);
      ctx.fillStyle=colors[i%colors.length]; ctx.fill();
      ctx.strokeStyle="rgba(255,255,255,0.25)"; ctx.lineWidth=1.5; ctx.stroke();
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(s+arc/2);
      ctx.textAlign="right"; ctx.fillStyle="#fff";
      ctx.font=`600 ${n>20?9:11}px 'DM Sans',sans-serif`;
      ctx.shadowColor="rgba(0,0,0,.5)"; ctx.shadowBlur=3;
      const txt=(items[i][label]||"")+""; ctx.fillText(txt.length>16?txt.slice(0,15)+"…":txt, r-8, 4);
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(cx,cy,18,0,2*Math.PI); ctx.fillStyle="#fff"; ctx.fill();
    ctx.beginPath(); ctx.moveTo(c.width,cy); ctx.lineTo(c.width-24,cy-13); ctx.lineTo(c.width-24,cy+13); ctx.closePath();
    ctx.fillStyle="#fff"; ctx.strokeStyle="rgba(0,0,0,.2)"; ctx.lineWidth=1; ctx.fill(); ctx.stroke();
  }, [items, colors, n, arc]);

  useEffect(() => { draw(ang.current); }, [draw]);

  const spin = useCallback(() => {
    if (spinning) return;
    setWinner(null); setSpinning(true);
    vel.current = 0.28 + Math.random()*0.25;
    const decel = 0.992 + Math.random()*0.004;
    function step() {
      ang.current += vel.current; vel.current *= decel; draw(ang.current);
      if (vel.current > 0.0015) { raf.current = requestAnimationFrame(step); }
      else {
        setSpinning(false);
        const norm = ((-ang.current%(2*Math.PI))+(2*Math.PI))%(2*Math.PI);
        setWinner(items[Math.floor(norm/arc)%n]);
      }
    }
    raf.current = requestAnimationFrame(step);
  }, [spinning, draw, items, arc, n]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.72)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"var(--color-background-primary)",borderRadius:24,padding:"1.5rem",maxWidth:360,width:"93%",textAlign:"center"}}>
        <h3 className="fd" style={{fontSize:22,margin:"0 0 1rem",fontWeight:600,color:"var(--color-text-primary)"}}>Spin the Wheel</h3>
        <canvas ref={cvs} width={290} height={290} style={{borderRadius:"50%",boxShadow:"0 6px 24px rgba(0,0,0,.25)"}}/>
        {winner && (
          <div style={{margin:"1rem 0 .5rem",padding:".875rem 1rem",background:"#fff",border:"1px solid rgba(0,0,0,.1)",borderRadius:14}}>
            <div style={{fontSize:11,color:"#888",marginBottom:5,textTransform:"uppercase",letterSpacing:".5px",fontWeight:600}}>You got</div>
            <div className="fd" style={{fontSize:19,fontWeight:600,color:"#111"}}>{winner[label]||""}</div>
            {winner.english && winner.english!==(winner[label]||"") && <div style={{fontSize:12,color:"#666",marginTop:3}}>{winner.english}</div>}
          </div>
        )}
        <div style={{display:"flex",gap:8,marginTop:"1rem"}}>
          <button onClick={onClose} style={{flex:1,padding:"10px",borderRadius:10,border:"0.5px solid var(--color-border-tertiary)",background:"none",cursor:"pointer",fontSize:14,color:"var(--color-text-secondary)",fontWeight:500}}>Cancel</button>
          {winner
            ? <button onClick={()=>onResult(winner)} style={{flex:2,padding:"10px",borderRadius:10,border:"none",background:"#e74c3c",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:600}}>Let's go! →</button>
            : <button onClick={spin} disabled={spinning} style={{flex:2,padding:"10px",borderRadius:10,border:"none",background:spinning?"#ccc":"#e74c3c",color:"#fff",cursor:spinning?"not-allowed":"pointer",fontSize:14,fontWeight:600}}>{spinning?"Spinning…":"Spin!"}</button>}
        </div>
        {winner && <button onClick={spin} style={{marginTop:8,width:"100%",padding:"8px",borderRadius:10,border:"0.5px solid var(--color-border-tertiary)",background:"none",cursor:"pointer",fontSize:13,color:"var(--color-text-secondary)"}}>Spin again</button>}
      </div>
    </div>
  );
}

const FlagSVG = memo(function FlagSVG({code}) {
  if (code==="FR") return <svg viewBox="0 0 3 2" style={{width:"100%",height:"100%"}}><rect width="1" height="2" fill="#002395"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ED2939"/></svg>;
  if (code==="IT") return <svg viewBox="0 0 3 2" style={{width:"100%",height:"100%"}}><rect width="1" height="2" fill="#009246"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#CE2B37"/></svg>;
  if (code==="DE") return <svg viewBox="0 0 5 3" style={{width:"100%",height:"100%"}}><rect width="5" height="1" fill="#000"/><rect y="1" width="5" height="1" fill="#D00"/><rect y="2" width="5" height="1" fill="#FFCE00"/></svg>;
  if (code==="ES") return <svg viewBox="0 0 3 2" style={{width:"100%",height:"100%"}}><rect width="3" height="2" fill="#AA151B"/><rect y="0.5" width="3" height="1" fill="#F1BF00"/></svg>;
  if (code==="CN") return <svg viewBox="0 0 30 20" style={{width:"100%",height:"100%"}}><rect width="30" height="20" fill="#DE2910"/><polygon points="5,2 6.18,5.09 9.51,5.09 6.9,7.18 7.94,10.27 5,8.35 2.06,10.27 3.1,7.18 0.49,5.09 3.82,5.09" fill="#FFDE00"/><polygon points="11,1 11.59,2.81 13.39,2.81 11.99,3.93 12.54,5.74 11,4.62 9.46,5.74 10.01,3.93 8.61,2.81 10.41,2.81" fill="#FFDE00"/><polygon points="14,3.5 14.59,5.31 16.39,5.31 14.99,6.43 15.54,8.24 14,7.12 12.46,8.24 13.01,6.43 11.61,5.31 13.41,5.31" fill="#FFDE00"/><polygon points="14,7.5 14.59,9.31 16.39,9.31 14.99,10.43 15.54,12.24 14,11.12 12.46,12.24 13.01,10.43 11.61,9.31 13.41,9.31" fill="#FFDE00"/><polygon points="11,10 11.59,11.81 13.39,11.81 11.99,12.93 12.54,14.74 11,13.62 9.46,14.74 10.01,12.93 8.61,11.81 10.41,11.81" fill="#FFDE00"/></svg>;
  if (code==="BR") return <svg viewBox="0 0 20 14" style={{width:"100%",height:"100%"}}><rect width="20" height="14" fill="#009C3B"/><polygon points="10,1.5 18.5,7 10,12.5 1.5,7" fill="#FFDF00"/><circle cx="10" cy="7" r="2.8" fill="#002776"/><path d="M7.3,6.4 Q10,5 12.7,6.4" stroke="#fff" strokeWidth="0.5" fill="none"/></svg>;
  if (code==="NG") return <svg viewBox="0 0 3 2" style={{width:"100%",height:"100%"}}><rect width="1" height="2" fill="#008751"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#008751"/></svg>;
  if (code==="TH") return <svg viewBox="0 0 6 4" style={{width:"100%",height:"100%"}}><rect width="6" height="4" fill="#A51931"/><rect y="0.667" width="6" height="2.667" fill="#fff"/><rect y="1.333" width="6" height="1.333" fill="#2D2A4A"/></svg>;
  if (code==="PL") return <svg viewBox="0 0 8 5" style={{width:"100%",height:"100%"}}><rect width="8" height="2.5" fill="#fff"/><rect y="2.5" width="8" height="2.5" fill="#DC143C"/></svg>;
  if (code==="VN") return <svg viewBox="0 0 3 2" style={{width:"100%",height:"100%"}}><rect width="3" height="2" fill="#DA251D"/><polygon points="1.5,0.35 1.676,0.89 2.244,0.89 1.784,1.22 1.96,1.76 1.5,1.43 1.04,1.76 1.216,1.22 0.756,0.89 1.324,0.89" fill="#FFCD00"/></svg>;
  if (code==="GB") return <svg viewBox="0 0 60 30" style={{width:"100%",height:"100%"}}><rect width="60" height="30" fill="#012169"/><line x1="0" y1="0" x2="60" y2="30" stroke="#fff" strokeWidth="6"/><line x1="60" y1="0" x2="0" y2="30" stroke="#fff" strokeWidth="6"/><line x1="0" y1="0" x2="60" y2="30" stroke="#C8102E" strokeWidth="2"/><line x1="60" y1="0" x2="0" y2="30" stroke="#C8102E" strokeWidth="2"/><rect x="25" y="0" width="10" height="30" fill="#fff"/><rect x="0" y="10" width="60" height="10" fill="#fff"/><rect x="27" y="0" width="6" height="30" fill="#C8102E"/><rect x="0" y="12" width="60" height="6" fill="#C8102E"/></svg>;
  if (code==="IN") {
    const sp=[];
    for(let i=0;i<24;i++){const a=(i*15)*Math.PI/180;sp.push(<line key={i} x1={4.5+0.12*Math.cos(a)} y1={3+0.12*Math.sin(a)} x2={4.5+0.72*Math.cos(a)} y2={3+0.72*Math.sin(a)} stroke="#000080" strokeWidth="0.05"/>);}
    return <svg viewBox="0 0 9 6" style={{width:"100%",height:"100%"}}><rect width="9" height="2" fill="#FF9933"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#138808"/><circle cx="4.5" cy="3" r="0.75" fill="none" stroke="#000080" strokeWidth="0.12"/><circle cx="4.5" cy="3" r="0.1" fill="#000080"/>{sp}</svg>;
  }
  return null;
});

const reqCache = new Map();
async function apiFetch(prompt, maxTok, apiKey) {
  if (reqCache.has(prompt)) return reqCache.get(prompt);
  const headers = {"Content-Type":"application/json","anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true","x-api-key":apiKey};
  const p = fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers,
    body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:maxTok,messages:[{role:"user",content:prompt}]})
  }).then(async res=>{
    reqCache.delete(prompt);
    if(!res.ok){const e=await res.json().catch(()=>{});throw new Error(e?.error?.message||"HTTP "+res.status);}
    return (await res.json()).content.map(b=>b.text||"").join("");
  }).catch(e=>{reqCache.delete(prompt);throw e;});
  reqCache.set(prompt, p);
  return p;
}

function xj(txt,type){
  if(type==="array"){const s=txt.indexOf("["),e=txt.lastIndexOf("]");if(s<0||e<0)throw new Error("No array");return JSON.parse(txt.slice(s,e+1));}
  const s=txt.indexOf("{"),e=txt.lastIndexOf("}");if(s<0||e<0)throw new Error("No object");return JSON.parse(txt.slice(s,e+1));
}
function scaleIng(ings,srv){
  return ings.map(i=>i.replace(/(\d+(?:\.\d+)?)/g,m=>{const s=parseFloat(m)*srv/4;return s%1===0?s:parseFloat(s.toFixed(1));}));
}

const MenuCard = memo(function MenuCard({ item, ac, onClick }) {
  const { bg, icon } = getDishStyle(item.local, item.english);
  return (
    <button onClick={onClick}
      style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:18,padding:0,cursor:"pointer",textAlign:"left",overflow:"hidden",display:"flex",flexDirection:"column",width:"100%",transition:"transform 0.15s,box-shadow 0.15s"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 20px ${ac}33`;}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
      <div style={{width:"100%",paddingTop:"60%",position:"relative",background:bg}}>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:48}}>{icon}</div>
        <div style={{position:"absolute",top:8,left:8,background:ac,color:"#fff",fontSize:11,fontWeight:700,borderRadius:6,padding:"2px 7px"}}>#{item.rank}</div>
        {item.prep && <div style={{position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,.45)",color:"#fff",fontSize:10,fontWeight:600,borderRadius:5,padding:"2px 7px"}}>⏱ {item.prep}</div>}
      </div>
      <div style={{padding:"10px 12px 12px",flex:1}}>
        <div style={{fontSize:14,fontWeight:600,letterSpacing:"-0.2px",overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",color:"var(--color-text-primary)"}}>{item.local}</div>
        {item.english!==item.local && <div style={{fontSize:11,color:"var(--color-text-secondary)",marginTop:3,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{item.english}</div>}
      </div>
    </button>
  );
});

export default function App() {
  useFonts();
  const [screen,setScreen]   = useState("home");
  const [country,setCountry] = useState(null);
  const [menu,setMenu]       = useState([]);
  const [menuLoading,setMenuLoading] = useState(false);
  const [menuDone,setMenuDone]       = useState(false);
  const [menuError,setMenuError]     = useState(null);
  const [dish,setDish]       = useState(null);
  const [detail,setDetail]   = useState(null);
  const [detailLoading,setDetailLoading] = useState(false);
  const [diners,setDiners]   = useState(4);
  const [showCW,setShowCW]   = useState(false);
  const [showDW,setShowDW]   = useState(false);
  const [showShare,setShowShare] = useState(false);
  const [copied,setCopied]   = useState(false);
  const [apiKey,setApiKey]   = useState(()=>localStorage.getItem("gme_api_key")||"");
  const [showKeyInput,setShowKeyInput] = useState(false);
  const saveKey = useCallback((k)=>{setApiKey(k);localStorage.setItem("gme_api_key",k);setShowKeyInput(false);},[]);

  const ac   = country?.color || "#c0392b";
  const ac2  = country ? (["#4caf50","#8B0000"].includes(country.accent) ? country.color : country.accent) : "#7b1a0e";
  const grad = useMemo(()=>`linear-gradient(135deg,${ac},${ac2})`,[ac,ac2]);
  const sc   = useMemo(()=>detail ? scaleIng(detail.ingredients,diners) : [],[detail,diners]);
  const bs   = {fontFamily:"'DM Sans',sans-serif",color:"var(--color-text-primary)",maxWidth:720,margin:"0 auto"};
  const { icon:dishIcon, bg:dishBg } = dish ? getDishStyle(dish.local,dish.english) : {icon:"🍽️",bg:"#eceff1"};

  const shareUrl  = "https://claude.ai/artifacts";
  const shareText = country
    ? `Explore authentic ${country.name} dishes on the Global Menu Explorer 🍽️`
    : "Explore authentic dishes from 12 countries on the Global Menu Explorer 🍽️";
  const encText = encodeURIComponent(shareText);
  const encUrl  = encodeURIComponent(shareUrl);
  const socials = [
    { label:"WhatsApp",  color:"#25D366", icon:"💬", href:`https://wa.me/?text=${encText}%20${encUrl}` },
    { label:"Twitter/X", color:"#000",    icon:"🐦", href:`https://twitter.com/intent/tweet?text=${encText}&url=${encUrl}` },
    { label:"Facebook",  color:"#1877F2", icon:"👤", href:`https://www.facebook.com/sharer/sharer.php?u=${encUrl}` },
    { label:"Email",     color:"#555",    icon:"✉️", href:`mailto:?subject=Global Menu Explorer&body=${encText}%20${encUrl}` },
  ];

  function handleCopy() {
    try {
      const ta = document.createElement("textarea");
      ta.value = shareUrl; ta.style.position="fixed"; ta.style.opacity="0";
      document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
      setCopied(true); setTimeout(()=>setCopied(false),2200);
    } catch {}
  }

  const openCountry = useCallback(async (c) => {
    setCountry(c); setMenu([]); setMenuError(null); setMenuLoading(true); setMenuDone(false); setScreen("menu");
    const batches = [[1,10],[11,20],[21,30],[31,40],[41,50]];
    let errs = 0;
    await Promise.all(batches.map(([s,e]) =>
      apiFetch(
        `List exactly the dishes ranked #${s} to #${e} by menu popularity in ${c.name} (rank 1 = most common). `+
        `Order strictly from rank ${s} down to ${e}. Include typical home prep time. `+
        `Return ONLY a JSON array of exactly ${e-s+1} items, no markdown: `+
        `[{"rank":${s},"local":"name in ${c.lang}","english":"English name","prep":"X mins"},...]`,
        850,
        apiKey
      ).then(raw => {
        try {
          const items = xj(raw,"array").map((it,i)=>({...it,rank:s+i}));
          setMenu(prev => {
            const map = {}; [...prev,...items].forEach(it=>{map[it.rank]=it;});
            return Object.values(map).sort((a,b)=>a.rank-b.rank);
          });
        } catch { errs++; }
      }).catch(()=>{ errs++; })
    ));
    if(errs) setMenuError(`${errs} batch(es) failed — some dishes may be missing.`);
    setMenuLoading(false); setMenuDone(true);
  }, []);

  const openDish = useCallback(async (d) => {
    setDish(d); setDetail(null); setDetailLoading(true); setScreen("dish");
    try {
      const raw = await apiFetch(
        `BBC Good Food style recipe for "${d.english}" from ${country.name}. `+
        `Return ONLY a JSON object, no markdown: {"description":"2 sentences","ingredients":["qty ingredient",...max 10],"prep_time":"X mins","cook_time":"X mins","steps":["step",...max 6]}`,
        1200,
        apiKey
      );
      setDetail(xj(raw,"object"));
    } catch { setDetail({description:"Could not load recipe.",ingredients:[],prep_time:"-",cook_time:"-",steps:[]}); }
    setDetailLoading(false);
  }, [country]);

  // ── Share Modal ──────────────────────────────────────────────────────────────
  function ShareModal() {
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000}} onClick={e=>{if(e.target===e.currentTarget)setShowShare(false);}}>
        <div style={{background:"var(--color-background-primary)",borderRadius:20,padding:"1.5rem",maxWidth:340,width:"92%"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem"}}>
            <h3 className="fd" style={{fontSize:20,margin:0,fontWeight:600,color:"var(--color-text-primary)"}}>Share this app</h3>
            <button onClick={()=>setShowShare(false)} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:"var(--color-text-secondary)",lineHeight:1,padding:4}}>×</button>
          </div>
          <p style={{fontSize:13,color:"var(--color-text-secondary)",margin:"0 0 1rem",lineHeight:1.5}}>{shareText}</p>
          <div style={{display:"flex",gap:8,marginBottom:"1rem"}}>
            <div style={{flex:1,background:"var(--color-background-secondary)",borderRadius:8,padding:"8px 12px",fontSize:12,color:"var(--color-text-secondary)",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",border:"0.5px solid var(--color-border-tertiary)"}}>{shareUrl}</div>
            <button onClick={handleCopy} style={{flexShrink:0,padding:"8px 14px",borderRadius:8,border:"none",background:copied?"#2ecc71":ac,color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer",transition:"background 0.2s",whiteSpace:"nowrap"}}>
              {copied?"✓ Copied!":"Copy"}
            </button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {socials.map(s=>(
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:10,background:s.color,color:"#fff",textDecoration:"none",fontSize:13,fontWeight:600}}>
                <span style={{fontSize:16}}>{s.icon}</span>{s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const ShareBtn = () => (
    <button onClick={()=>setShowShare(true)} style={{background:"rgba(255,255,255,.18)",border:"1px solid rgba(255,255,255,.4)",borderRadius:20,padding:"6px 14px",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
      🔗 Share
    </button>
  );

  // ── HOME ────────────────────────────────────────────────────────────────────
  if (screen==="home") return (
    <div style={bs}>
      {showShare && <ShareModal/>}
      {showCW && <SpinWheel items={COUNTRIES} colors={WC} label="name" onResult={c=>{setShowCW(false);openCountry(c);}} onClose={()=>setShowCW(false)}/>}
      <div style={{background:"linear-gradient(135deg,#c0392b,#7b1a0e)",padding:"2.5rem 1.5rem 2rem",textAlign:"center",position:"relative"}}>
        <div style={{position:"absolute",top:16,right:16,display:"flex",gap:6}}>{apiKey && <button onClick={()=>setShowKeyInput(true)} style={{background:"rgba(255,255,255,.18)",border:"1px solid rgba(255,255,255,.4)",borderRadius:20,padding:"6px 14px",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>🔑 Key</button>}<ShareBtn/></div>
        <div style={{fontSize:44,marginBottom:10}}>🍽️</div>
        <h1 className="fd" style={{fontSize:32,fontWeight:600,color:"#fff",margin:"0 0 8px",letterSpacing:"-0.5px"}}>Global Menu Explorer</h1>
        <p style={{fontSize:15,color:"rgba(255,255,255,.8)",margin:"0 0 1.5rem"}}>Discover authentic dishes from around the world</p>
        <button onClick={()=>setShowCW(true)} style={{background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.5)",borderRadius:50,padding:"10px 24px",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer"}}>🎡 Help me pick a country</button>
      </div>
      {(!apiKey || showKeyInput) && (
        <div style={{margin:"1rem 1rem 0",padding:"1.25rem",background:"var(--color-background-primary)",borderRadius:16,border:"0.5px solid var(--color-border-tertiary)"}}>
          <h3 style={{fontSize:15,fontWeight:600,margin:"0 0 6px",color:"var(--color-text-primary)"}}>{apiKey?"Update API Key":"🔑 Enter your Anthropic API Key"}</h3>
          <p style={{fontSize:13,color:"var(--color-text-secondary)",margin:"0 0 12px",lineHeight:1.5}}>Required to load menus and recipes. Your key is stored only in this browser.</p>
          <form onSubmit={e=>{e.preventDefault();const v=e.target.elements.key.value.trim();if(v)saveKey(v);}} style={{display:"flex",gap:8}}>
            <input name="key" type="password" defaultValue={apiKey} placeholder="sk-ant-api03-..." style={{flex:1,padding:"10px 14px",borderRadius:10,border:"1.5px solid var(--color-border-tertiary)",fontSize:14,background:"var(--color-background-secondary)",color:"var(--color-text-primary)",fontFamily:"monospace"}}/>
            <button type="submit" style={{padding:"10px 20px",borderRadius:10,border:"none",background:"#c0392b",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>Save</button>
            {apiKey && showKeyInput && <button type="button" onClick={()=>setShowKeyInput(false)} style={{padding:"10px 14px",borderRadius:10,border:"0.5px solid var(--color-border-tertiary)",background:"none",fontSize:14,cursor:"pointer",color:"var(--color-text-secondary)"}}>Cancel</button>}
          </form>
        </div>
      )}
      <div style={{padding:"1.5rem 1rem 2rem"}}>
        <p style={{fontSize:12,color:"var(--color-text-secondary)",textAlign:"center",margin:"0 0 1.25rem",letterSpacing:".5px",textTransform:"uppercase",fontWeight:600}}>Choose a country</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(148px,1fr))",gap:12}}>
          {COUNTRIES.map(c=>(
            <button key={c.code} onClick={()=>openCountry(c)}
              style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:16,padding:0,cursor:"pointer",overflow:"hidden",textAlign:"center",transition:"transform 0.15s,border-color 0.15s,box-shadow 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.borderColor=c.color;e.currentTarget.style.boxShadow=`0 8px 24px ${c.color}44`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.borderColor="var(--color-border-tertiary)";e.currentTarget.style.boxShadow="none";}}>
              <div style={{background:c.color,height:72,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:90,height:52,borderRadius:5,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,.35)"}}><FlagSVG code={c.code}/></div>
              </div>
              <div style={{padding:"10px 10px 12px"}}>
                <div style={{fontSize:14,fontWeight:600,letterSpacing:"-0.2px"}}>{c.name}</div>
                <div style={{fontSize:11,color:"var(--color-text-secondary)",marginTop:2}}>{c.lang}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── MENU ────────────────────────────────────────────────────────────────────
  if (screen==="menu") return (
    <div style={bs}>
      {showShare && <ShareModal/>}
      {showDW && menu.length>0 && <SpinWheel items={menu} colors={WC} label="local" onResult={d=>{setShowDW(false);openDish(d);}} onClose={()=>setShowDW(false)}/>}
      <div style={{background:grad,padding:"1.25rem 1.5rem",display:"flex",alignItems:"center",gap:10}}>
        <button onClick={()=>setScreen("home")} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13,color:"#fff",fontWeight:500}}>← Back</button>
        <div style={{width:44,height:26,borderRadius:4,overflow:"hidden",border:"1px solid rgba(255,255,255,.3)",flexShrink:0}}><FlagSVG code={country.code}/></div>
        <div style={{flex:1,minWidth:0}}>
          <h2 className="fd" style={{fontSize:20,fontWeight:600,margin:0,color:"#fff",letterSpacing:"-0.3px"}}>{country.name}</h2>
          <p style={{fontSize:12,color:"rgba(255,255,255,.75)",margin:0}}>{menuDone?`Top ${menu.length} dishes`:`Loading… ${menu.length}/50`}</p>
        </div>
        <div style={{display:"flex",gap:6,flexShrink:0}}>
          {menu.length>0 && <button onClick={()=>setShowDW(true)} style={{background:"rgba(255,255,255,.18)",border:"1px solid rgba(255,255,255,.4)",borderRadius:20,padding:"6px 12px",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>🎡 Pick</button>}
          <ShareBtn/>
        </div>
      </div>
      {menuLoading && menu.length===0 && (
        <div style={{textAlign:"center",padding:"3rem 1rem",color:"var(--color-text-secondary)"}}>
          <div style={{fontSize:40,marginBottom:12}}>🍳</div>
          <div className="fd" style={{fontSize:20,fontWeight:600,marginBottom:6}}>Loading menu…</div>
          <div style={{fontSize:13,opacity:.7}}>Fetching 5 batches in parallel</div>
        </div>
      )}
      {menuError && (
        <div style={{margin:".75rem 1rem 0",padding:".75rem 1rem",background:"var(--color-background-warning)",borderRadius:10,border:"0.5px solid var(--color-border-warning)"}}>
          <span style={{fontSize:13,color:"var(--color-text-warning)"}}>{menuError}</span>
        </div>
      )}
      {menu.length>0 && (
        <div style={{padding:"1rem"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12}}>
            {menu.map(item=><MenuCard key={item.rank} item={item} ac={ac} onClick={()=>openDish(item)}/>)}
          </div>
        </div>
      )}
    </div>
  );

  // ── DISH ────────────────────────────────────────────────────────────────────
  if (screen==="dish") return (
    <div style={bs}>
      {showShare && <ShareModal/>}
      <div style={{background:grad,padding:"1.25rem 1.5rem",display:"flex",alignItems:"center",gap:10}}>
        <button onClick={()=>setScreen("menu")} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13,color:"#fff",fontWeight:500}}>← Menu</button>
        <div style={{width:34,height:20,borderRadius:3,overflow:"hidden",border:"1px solid rgba(255,255,255,.3)",flexShrink:0}}><FlagSVG code={country.code}/></div>
        <div style={{flex:1}}><span style={{fontSize:13,color:"rgba(255,255,255,.85)",fontWeight:500}}>{country.name}</span></div>
        <ShareBtn/>
      </div>
      <div style={{height:260,background:dishBg,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
        <div style={{fontSize:110,lineHeight:1}}>{dishIcon}</div>
        <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,.5))",padding:"2rem 1.25rem 1.25rem"}}>
          <h2 className="fd" style={{fontSize:26,fontWeight:600,margin:"0 0 3px",color:"#fff",letterSpacing:"-0.5px"}}>{dish.local}</h2>
          {dish.english!==dish.local && <p style={{fontSize:14,color:"rgba(255,255,255,.8)",margin:0}}>{dish.english}</p>}
        </div>
      </div>
      {detailLoading && <div style={{textAlign:"center",padding:"2.5rem",color:"var(--color-text-secondary)"}}><div style={{fontSize:32,marginBottom:10}}>👨‍🍳</div><div className="fd" style={{fontSize:18}}>Loading recipe…</div></div>}
      {detail && (
        <div style={{padding:"1rem"}}>
          <p style={{fontSize:14,lineHeight:1.75,color:"var(--color-text-secondary)",margin:"0 0 1rem",background:"var(--color-background-secondary)",borderRadius:10,padding:".875rem 1rem",borderLeft:`3px solid ${ac}`}}>{detail.description}</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:"1rem"}}>
            {[["⏱ Prep",detail.prep_time],["🔥 Cook",detail.cook_time],["👥 Serves",`${diners} ${diners===1?"person":"people"}`]].map(([lbl,val])=>(
              <div key={lbl} style={{background:ac,borderRadius:10,padding:".7rem .5rem",textAlign:"center"}}>
                <div style={{fontSize:11,color:"rgba(255,255,255,.8)",marginBottom:3,fontWeight:500}}>{lbl}</div>
                <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:14,padding:"1rem 1.25rem",marginBottom:"1rem"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <h3 style={{fontSize:15,fontWeight:600,margin:0}}>🧂 Ingredients</h3>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <label style={{fontSize:12,color:"var(--color-text-secondary)",fontWeight:500}}>Diners:</label>
                <select value={diners} onChange={e=>setDiners(Number(e.target.value))} style={{fontSize:13,padding:"4px 8px",borderRadius:7,border:`1.5px solid ${ac}`,color:ac,fontWeight:600,background:"var(--color-background-primary)",cursor:"pointer"}}>
                  {Array.from({length:20},(_,i)=>i+1).map(n=><option key={n} value={n}>{n} {n===1?"person":"people"}</option>)}
                </select>
              </div>
            </div>
            {sc.map((ing,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"7px 0",borderBottom:i<sc.length-1?"0.5px solid var(--color-border-tertiary)":"none"}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:ac,marginTop:6,flexShrink:0}}></span>
                <span style={{fontSize:14,color:"var(--color-text-secondary)",lineHeight:1.5}}>{ing}</span>
              </div>
            ))}
          </div>
          <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:14,padding:"1rem 1.25rem"}}>
            <h3 style={{fontSize:15,fontWeight:600,margin:"0 0 14px"}}>👩‍🍳 How to make it</h3>
            {detail.steps.map((step,i)=>(
              <div key={i} style={{display:"flex",gap:12,marginBottom:14}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:ac,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0}}>{i+1}</div>
                <p style={{fontSize:14,color:"var(--color-text-secondary)",margin:0,lineHeight:1.65,paddingTop:4}}>{step.replace(/^Step \d+:\s*/i,"")}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return null;
}
