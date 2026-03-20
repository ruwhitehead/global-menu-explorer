import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";

function useFonts() {
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet"; l.media = "print";
    l.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;1,600&display=swap";
    l.onload = () => { l.media = "all"; };
    document.head.appendChild(l);
    const s = document.createElement("style");
    s.textContent = `*{font-family:'Outfit',system-ui,sans-serif!important}.fd{font-family:'Playfair Display',serif!important}`;
    document.head.appendChild(s);
  }, []);
}

const COUNTRIES = [
  { code:"FR", flag:"fr", name:"France",         lang:"French",         color:"#002395", accent:"#ED2939" },
  { code:"IT", flag:"it", name:"Italy",          lang:"Italian",        color:"#008C45", accent:"#CE2B37" },
  { code:"DE", flag:"de", name:"Germany",        lang:"German",         color:"#444",    accent:"#DD0000" },
  { code:"ES", flag:"es", name:"Spain",          lang:"Spanish",        color:"#AA151B", accent:"#F1BF00" },
  { code:"CN", flag:"cn", name:"China",          lang:"Chinese",        color:"#DE2910", accent:"#FFDE00" },
  { code:"BR", flag:"br", name:"Brazil",         lang:"Portuguese",     color:"#009C3B", accent:"#FFDF00" },
  { code:"NG", flag:"ng", name:"Nigeria",        lang:"English/Yoruba", color:"#008751", accent:"#4caf50" },
  { code:"TH", flag:"th", name:"Thailand",       lang:"Thai",           color:"#A51931", accent:"#2D2A4A" },
  { code:"PL", flag:"pl", name:"Poland",         lang:"Polish",         color:"#DC143C", accent:"#8B0000" },
  { code:"VN", flag:"vn", name:"Vietnam",        lang:"Vietnamese",     color:"#DA251D", accent:"#FFCD00" },
  { code:"GB", flag:"gb", name:"United Kingdom", lang:"English",        color:"#012169", accent:"#C8102E" },
  { code:"IN", flag:"in", name:"India",          lang:"Hindi/Regional", color:"#FF9933", accent:"#138808" },
];

const WC = ["#e74c3c","#e67e22","#f1c40f","#2ecc71","#1abc9c","#3498db","#9b59b6","#e91e63","#00bcd4","#ff5722","#8bc34a","#ff9800"];

const DISH_TYPES = [
  { keys:["soup","broth","pho","ramen","tom yum","chowder","gazpacho","borscht","\u017curek","bouillabaisse"], bg:"#fff3e0", icon:"\ud83c\udf5c", accent:"#e65100" },
  { keys:["pizza","flatbread","naan","pita","tarte"], bg:"#fce4ec", icon:"\ud83c\udf55", accent:"#c2185b" },
  { keys:["pasta","carbonara","lasagne","lasagna","gnocchi","spaghetti","penne","tagliatelle","fettuccine"], bg:"#f3e5f5", icon:"\ud83c\udf5d", accent:"#7b1fa2" },
  { keys:["rice","biryani","risotto","paella","jollof","fried rice","chow","pilaf","arroz"], bg:"#e8f5e9", icon:"\ud83c\udf5a", accent:"#2e7d32" },
  { keys:["curry","masala","tikka","makhani","korma","vindaloo","rendang"], bg:"#fff8e1", icon:"\ud83c\udf5b", accent:"#f57f17" },
  { keys:["steak","beef","schnitzel","wiener","sauerbraten","churrasco","wellington"], bg:"#fbe9e7", icon:"\ud83e\udd69", accent:"#bf360c" },
  { keys:["chicken","pollo","poulet","murgh","coq au vin","tandoori"], bg:"#fff9c4", icon:"\ud83c\udf57", accent:"#f9a825" },
  { keys:["fish","chips","seafood","prawn","shrimp","crab","lobster","moqueca","ceviche"], bg:"#e3f2fd", icon:"\ud83d\udc1f", accent:"#1565c0" },
  { keys:["dumpling","pierogi","gyoza","dim sum","wonton","ravioli"], bg:"#e8eaf6", icon:"\ud83e\udd5f", accent:"#283593" },
  { keys:["bread","croissant","baguette","pretzel","brioche","scone","p\u00e3o"], bg:"#efebe9", icon:"\ud83e\udd50", accent:"#4e342e" },
  { keys:["salad","slaw","som tam","papaya","tabbouleh"], bg:"#f1f8e9", icon:"\ud83e\udd57", accent:"#558b2f" },
  { keys:["cake","dessert","tiramisu","brulee","pudding","tart","torte","gulab","churros","crepe","cr\u00eape","panna cotta","mango sticky","brigadeiro"], bg:"#fce4ec", icon:"\ud83c\udf70", accent:"#ad1457" },
  { keys:["sausage","bratwurst","kielbasa","currywurst","chorizo","wurst","bangers"], bg:"#fff3e0", icon:"\ud83c\udf2d", accent:"#e65100" },
  { keys:["egg","omelette","tortilla","quiche","frittata"], bg:"#fffde7", icon:"\ud83c\udf73", accent:"#f57f17" },
  { keys:["tofu","miso","mapo","tempeh"], bg:"#e0f2f1", icon:"\ud83e\udeb6", accent:"#00695c" },
  { keys:["wrap","taco","burrito","shawarma","kebab","banh mi","b\u00e1nh m\u00ec","sandwich","falafel"], bg:"#fff8e1", icon:"\ud83c\udf2e", accent:"#e65100" },
  { keys:["roast","sunday roast","grilled","barbecue","bbq"], bg:"#fbe9e7", icon:"\ud83c\udf56", accent:"#b71c1c" },
];

const imgCache = new Map();
function getDishStyle(local, english) {
  const key = `${local}|${english}`;
  if (imgCache.has(key)) return imgCache.get(key);
  const text = `${(english||"").toLowerCase()} ${(local||"").toLowerCase()}`;
  for (const t of DISH_TYPES) {
    if (t.keys.some(k => text.includes(k))) { imgCache.set(key, t); return t; }
  }
  const fallback = { bg:"#eceff1", icon:"\ud83c\udf7d\ufe0f", accent:"#546e7a" };
  imgCache.set(key, fallback);
  return fallback;
}

/* Wikipedia image fetcher */
const wikiImgCache = new Map();
async function fetchWikiImage(dishName) {
  if (wikiImgCache.has(dishName)) return wikiImgCache.get(dishName);
  const p = (async () => {
    try {
      const q = encodeURIComponent(dishName.replace(/\s+/g, "_"));
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${q}`);
      if (!res.ok) return null;
      const data = await res.json();
      const thumb = data.thumbnail?.source || null;
      const full = data.originalimage?.source || null;
      return thumb ? { thumb, full: full || thumb } : null;
    } catch { return null; }
  })();
  wikiImgCache.set(dishName, p);
  return p;
}

/* Flag component using flagcdn.com */
function CountryFlag({ code, size=64, style:sx={} }) {
  const lc = code.toLowerCase();
  return (
    <div style={{width:size*1.5,height:size,borderRadius:8,overflow:"hidden",background:"#1e293b",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(0,0,0,.25)",border:"2px solid rgba(255,255,255,.15)",...sx}}>
      <img src={`https://flagcdn.com/w320/${lc}.png`} alt={code} style={{width:"100%",height:"100%",objectFit:"cover"}} />
    </div>
  );
}

/* Smaller flag for headers */
function FlagSmall({ code, w=44 }) {
  const lc = code.toLowerCase();
  return (
    <div style={{width:w,height:w*0.667,borderRadius:4,overflow:"hidden",border:"1px solid rgba(255,255,255,.2)",flexShrink:0}}>
      <img src={`https://flagcdn.com/w160/${lc}.png`} alt={code} style={{width:"100%",height:"100%",objectFit:"cover"}} />
    </div>
  );
}

/* Hero SVG — compass rose */
function HeroIcon() {
  return (
    <svg viewBox="0 0 100 100" width="80" height="80" style={{filter:"drop-shadow(0 4px 20px rgba(255,200,150,.3))"}}>
      <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="0.5"/>
      {/* compass points */}
      <polygon points="50,8 54,44 50,40 46,44" fill="rgba(255,200,150,.9)"/>
      <polygon points="50,92 54,56 50,60 46,56" fill="rgba(255,255,255,.4)"/>
      <polygon points="8,50 44,46 40,50 44,54" fill="rgba(255,255,255,.4)"/>
      <polygon points="92,50 56,46 60,50 56,54" fill="rgba(255,255,255,.4)"/>
      {/* diagonal points */}
      <polygon points="21,21 43,45 40,43 42,40" fill="rgba(255,255,255,.2)"/>
      <polygon points="79,21 57,45 60,43 58,40" fill="rgba(255,255,255,.2)"/>
      <polygon points="21,79 43,55 40,57 42,60" fill="rgba(255,255,255,.2)"/>
      <polygon points="79,79 57,55 60,57 58,60" fill="rgba(255,255,255,.2)"/>
      <circle cx="50" cy="50" r="4" fill="rgba(255,200,150,.8)"/>
      <circle cx="50" cy="50" r="2" fill="#fff"/>
      {/* N E S W labels */}
      <text x="50" y="6" textAnchor="middle" fill="rgba(255,200,150,.9)" fontSize="7" fontWeight="700" fontFamily="'Playfair Display',serif">N</text>
      <text x="50" y="99" textAnchor="middle" fill="rgba(255,255,255,.35)" fontSize="7" fontWeight="700" fontFamily="'Playfair Display',serif">S</text>
      <text x="4" y="52.5" textAnchor="middle" fill="rgba(255,255,255,.35)" fontSize="7" fontWeight="700" fontFamily="'Playfair Display',serif">W</text>
      <text x="96" y="52.5" textAnchor="middle" fill="rgba(255,255,255,.35)" fontSize="7" fontWeight="700" fontFamily="'Playfair Display',serif">E</text>
    </svg>
  );
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
      ctx.font=`600 ${n>20?9:11}px 'Outfit',sans-serif`;
      ctx.shadowColor="rgba(0,0,0,.5)"; ctx.shadowBlur=3;
      const txt=(items[i][label]||"")+""; ctx.fillText(txt.length>16?txt.slice(0,15)+"\u2026":txt, r-8, 4);
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(cx,cy,18,0,2*Math.PI); ctx.fillStyle="#fff"; ctx.fill();
    ctx.beginPath(); ctx.moveTo(c.width,cy); ctx.lineTo(c.width-24,cy-13); ctx.lineTo(c.width-24,cy+13); ctx.closePath();
    ctx.fillStyle="#fff"; ctx.strokeStyle="rgba(0,0,0,.2)"; ctx.lineWidth=1; ctx.fill(); ctx.stroke();
  }, [items, colors, n, arc, label]);
  useEffect(() => { draw(ang.current); }, [draw]);
  const spin = useCallback(() => {
    if (spinning) return;
    setWinner(null); setSpinning(true);
    vel.current = 0.28 + Math.random()*0.25;
    const decel = 0.992 + Math.random()*0.004;
    function step() {
      ang.current += vel.current; vel.current *= decel; draw(ang.current);
      if (vel.current > 0.0015) { raf.current = requestAnimationFrame(step); }
      else { setSpinning(false); const norm = ((-ang.current%(2*Math.PI))+(2*Math.PI))%(2*Math.PI); setWinner(items[Math.floor(norm/arc)%n]); }
    }
    raf.current = requestAnimationFrame(step);
  }, [spinning, draw, items, arc, n]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="fade-up" style={{background:"var(--bg-card)",borderRadius:28,padding:"2rem",maxWidth:380,width:"100%",textAlign:"center",boxShadow:"var(--shadow-lg)"}}>
        <h3 className="fd" style={{fontSize:26,margin:"0 0 1.25rem",fontWeight:600,color:"var(--text)"}}>Spin the Wheel</h3>
        <canvas ref={cvs} width={290} height={290} style={{borderRadius:"50%",boxShadow:"0 8px 32px rgba(0,0,0,.2)",maxWidth:"100%",height:"auto"}}/>
        {winner && (<div className="fade-up" style={{margin:"1.25rem 0 .5rem",padding:"1rem 1.25rem",background:"var(--bg-secondary)",border:"1px solid var(--border)",borderRadius:16}}>
          <div style={{fontSize:11,color:"var(--text-muted)",marginBottom:6,textTransform:"uppercase",letterSpacing:"1.5px",fontWeight:600}}>You got</div>
          <div className="fd" style={{fontSize:22,fontWeight:600,color:"var(--text)"}}>{winner[label]||""}</div>
          {winner.english && winner.english!==(winner[label]||"") && <div style={{fontSize:13,color:"var(--text-secondary)",marginTop:4}}>{winner.english}</div>}
        </div>)}
        <div style={{display:"flex",gap:10,marginTop:"1.25rem"}}>
          <button onClick={onClose} style={{flex:1,padding:"12px",borderRadius:14,border:"1px solid var(--border)",background:"transparent",cursor:"pointer",fontSize:14,color:"var(--text-secondary)",fontWeight:500}}>Cancel</button>
          {winner
            ? <button onClick={()=>onResult(winner)} style={{flex:2,padding:"12px",borderRadius:14,border:"none",background:"var(--accent)",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:600}}>{"Let\u2019s go!"}</button>
            : <button onClick={spin} disabled={spinning} style={{flex:2,padding:"12px",borderRadius:14,border:"none",background:spinning?"var(--border)":"var(--accent)",color:spinning?"var(--text-muted)":"#fff",cursor:spinning?"not-allowed":"pointer",fontSize:14,fontWeight:600}}>{spinning?"Spinning\u2026":"Spin!"}</button>}
        </div>
        {winner && <button onClick={spin} style={{marginTop:10,width:"100%",padding:"10px",borderRadius:14,border:"1px solid var(--border)",background:"transparent",cursor:"pointer",fontSize:13,color:"var(--text-secondary)",fontWeight:500}}>Spin again</button>}
      </div>
    </div>
  );
}

const reqCache = new Map();
async function apiFetch(prompt, maxTok, apiKey) {
  if (reqCache.has(prompt)) return reqCache.get(prompt);
  const headers = {"Content-Type":"application/json","anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true","x-api-key":apiKey};
  const p = fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers,
    body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:maxTok,messages:[{role:"user",content:prompt}]})
  }).then(async res=>{
    reqCache.delete(prompt);
    if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e?.error?.message||"HTTP "+res.status);}
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

function PillBtn({ children, onClick, style:sx={} }) {
  return (<button onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 18px",borderRadius:50,fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.2s",whiteSpace:"nowrap",background:"rgba(255,255,255,.12)",color:"#fff",border:"1px solid rgba(255,255,255,.2)",backdropFilter:"blur(4px)",...sx}}>{children}</button>);
}

function DishImage({ english, icon, bg }) {
  const [src, setSrc] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetchWikiImage(english).then(r => { if (!cancelled && r) setSrc(r.thumb); });
    return () => { cancelled = true; };
  }, [english]);
  if (src && !err) {
    return <img src={src} alt={english} onError={() => setErr(true)} style={{width:"100%",height:"100%",objectFit:"cover"}} />;
  }
  return <div style={{width:"100%",height:"100%",background:bg,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:44}}>{icon}</span></div>;
}

function DishImageFull({ english, icon, bg }) {
  const [src, setSrc] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetchWikiImage(english).then(r => { if (!cancelled && r) setSrc(r.full || r.thumb); });
    return () => { cancelled = true; };
  }, [english]);
  if (src && !err) {
    return <img src={src} alt={english} onError={() => setErr(true)} style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0}} />;
  }
  return <div style={{fontSize:"clamp(72px, 15vw, 110px)",lineHeight:1,filter:"drop-shadow(0 4px 16px rgba(0,0,0,.15))"}}>{icon}</div>;
}

const MenuCard = memo(function MenuCard({ item, ac, onClick }) {
  const { bg, icon } = getDishStyle(item.local, item.english);
  return (
    <button onClick={onClick}
      style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:20,padding:0,cursor:"pointer",textAlign:"left",overflow:"hidden",display:"flex",flexDirection:"column",width:"100%",transition:"all 0.25s cubic-bezier(.4,0,.2,1)"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="var(--shadow-lg)";e.currentTarget.style.borderColor=ac;}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";e.currentTarget.style.borderColor="var(--border)";}}>
      <div style={{width:"100%",paddingTop:"56%",position:"relative",background:bg,overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0}}>
          <DishImage english={item.english} icon={icon} bg={bg} />
        </div>
        <div style={{position:"absolute",top:10,left:10,background:ac,color:"#fff",fontSize:11,fontWeight:700,borderRadius:10,padding:"3px 10px",zIndex:1}}>#{item.rank}</div>
        {item.prep && <div style={{position:"absolute",bottom:10,right:10,background:"rgba(0,0,0,.6)",backdropFilter:"blur(4px)",color:"#fff",fontSize:10,fontWeight:600,borderRadius:10,padding:"3px 10px",zIndex:1}}>{"\u23f1"} {item.prep}</div>}
      </div>
      <div style={{padding:"12px 14px 14px",flex:1}}>
        <div style={{fontSize:14,fontWeight:600,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",color:"var(--text)",lineHeight:1.4}}>{item.local}</div>
        {item.english!==item.local && <div style={{fontSize:12,color:"var(--text-muted)",marginTop:4,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{item.english}</div>}
      </div>
    </button>
  );
});

function HeaderBar({ grad, onBack, backLabel, left, right }) {
  return (
    <div style={{background:grad,padding:"14px 16px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:100}}>
      <button onClick={onBack} style={{background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.15)",borderRadius:12,padding:"7px 14px",cursor:"pointer",fontSize:13,color:"#fff",fontWeight:500,flexShrink:0}}>{"\u2190"} {backLabel}</button>
      {left}
      {right && <div style={{display:"flex",gap:8,flexShrink:0,marginLeft:"auto"}}>{right}</div>}
    </div>
  );
}

/* ─── Quiz component ─── */
function MenuQuiz({ apiKey, onClose }) {
  const [phase, setPhase] = useState("pick"); // pick | loading | play | result
  const [qCountry, setQCountry] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState([]); // {local,english,answer,correct}
  const [loadErr, setLoadErr] = useState(null);
  const inputRef = useRef(null);

  const startQuiz = useCallback(async (c) => {
    setQCountry(c); setPhase("loading"); setLoadErr(null);
    try {
      const raw = await apiFetch(
        `List 15 popular dishes from ${c.name}. Each must have a distinct local-language name (in ${c.lang}) that differs from the English name. Return ONLY a JSON array, no markdown: [{"local":"name in ${c.lang}","english":"English name"},...]`,
        600, apiKey
      );
      const all = xj(raw, "array").filter(d => d.local && d.english && d.local.toLowerCase() !== d.english.toLowerCase());
      if (all.length < 10) throw new Error("Not enough dishes returned");
      // shuffle and take 10
      for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
      setDishes(all.slice(0, 10));
      setIdx(0); setAnswer(""); setRevealed(false); setResults([]);
      setPhase("play");
    } catch (e) {
      setLoadErr(e.message || "Failed to load quiz dishes");
      setPhase("pick");
    }
  }, [apiKey]);

  useEffect(() => {
    if (phase === "play" && !revealed && inputRef.current) inputRef.current.focus();
  }, [phase, idx, revealed]);

  function checkAnswer() {
    if (revealed) return;
    const eng = dishes[idx].english.toLowerCase().trim();
    const ans = answer.toLowerCase().trim();
    const correct = ans === eng || eng.includes(ans) && ans.length > 2;
    setResults(prev => [...prev, { local: dishes[idx].local, english: dishes[idx].english, answer, correct }]);
    setRevealed(true);
  }

  function next() {
    if (idx + 1 >= 10) { setPhase("result"); return; }
    setIdx(i => i + 1); setAnswer(""); setRevealed(false);
  }

  const score = results.filter(r => r.correct).length;

  if (phase === "pick") return (
    <div className="app-container">
      <div style={{background:"linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)",padding:"2rem 1.5rem",textAlign:"center"}}>
        <button onClick={onClose} style={{position:"absolute",top:16,left:16,background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.15)",borderRadius:12,padding:"7px 14px",cursor:"pointer",fontSize:13,color:"#fff",fontWeight:500}}>{"\u2190"} Home</button>
        <div style={{fontSize:40,marginBottom:12}}>{"?"}</div>
        <h2 className="fd" style={{fontSize:"clamp(24px,5vw,34px)",color:"#fff",margin:"0 0 8px",fontStyle:"italic"}}>Can You Navigate a Menu?</h2>
        <p style={{fontSize:14,color:"rgba(255,255,255,.55)",margin:0}}>Pick a country to test your knowledge</p>
      </div>
      {loadErr && <div className="fade-up" style={{margin:"12px 16px",padding:"12px 16px",background:"var(--warning-bg)",borderRadius:14,border:"1px solid var(--warning-border)",fontSize:13,color:"var(--warning-text)"}}>{loadErr}</div>}
      <div style={{padding:"24px 16px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(155px,calc(50% - 8px)),1fr))",gap:12}}>
          {COUNTRIES.filter(c => c.lang !== "English" && c.lang !== "English/Yoruba").map(c => (
            <button key={c.code} onClick={() => startQuiz(c)} style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:16,padding:"16px 12px",cursor:"pointer",textAlign:"center",transition:"all 0.2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=c.color;e.currentTarget.style.transform="translateY(-2px)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.transform="translateY(0)";}}>
              <CountryFlag code={c.code} size={36} style={{margin:"0 auto 10px",boxShadow:"0 2px 8px rgba(0,0,0,.15)",border:"1px solid rgba(0,0,0,.1)"}} />
              <div style={{fontSize:14,fontWeight:600,color:"var(--text)"}}>{c.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (phase === "loading") return (
    <div className="app-container">
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",flexDirection:"column",gap:16}}>
        <div className="loading-pulse" style={{fontSize:48}}>{"?"}</div>
        <div className="fd" style={{fontSize:22,color:"var(--text)"}}>Preparing your quiz...</div>
        <p style={{fontSize:14,color:"var(--text-muted)"}}>{qCountry?.name} menu challenge</p>
      </div>
    </div>
  );

  if (phase === "play") {
    const d = dishes[idx];
    return (
      <div className="app-container">
        <div style={{background:`linear-gradient(135deg,${qCountry.color},${qCountry.accent||qCountry.color}cc)`,padding:"1.25rem 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <FlagSmall code={qCountry.code} w={36} />
            <span style={{color:"#fff",fontSize:14,fontWeight:600}}>{qCountry.name} Quiz</span>
          </div>
          <div style={{background:"rgba(255,255,255,.15)",borderRadius:20,padding:"4px 14px",fontSize:13,color:"#fff",fontWeight:600}}>{idx + 1} / 10</div>
        </div>
        <div style={{padding:"2rem 1.5rem",textAlign:"center"}}>
          {/* Progress bar */}
          <div style={{width:"100%",height:4,background:"var(--border)",borderRadius:2,marginBottom:"2rem",overflow:"hidden"}}>
            <div style={{width:`${(idx/10)*100}%`,height:"100%",background:qCountry.color,borderRadius:2,transition:"width 0.3s"}}/>
          </div>
          <p style={{fontSize:12,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"2px",fontWeight:600,marginBottom:8}}>What is this dish in English?</p>
          <div className="fd fade-up" key={idx} style={{fontSize:"clamp(32px,7vw,48px)",fontWeight:600,color:"var(--text)",margin:"0 0 2rem",fontStyle:"italic",lineHeight:1.3}}>{d.local}</div>

          {!revealed ? (
            <form onSubmit={e => { e.preventDefault(); checkAnswer(); }} style={{maxWidth:360,margin:"0 auto"}}>
              <input ref={inputRef} value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Type the English name..." autoComplete="off"
                style={{width:"100%",padding:"14px 18px",borderRadius:16,border:"2px solid var(--border)",fontSize:16,background:"var(--bg-secondary)",color:"var(--text)",textAlign:"center",marginBottom:12}} />
              <button type="submit" disabled={!answer.trim()} style={{width:"100%",padding:"14px",borderRadius:16,border:"none",background:answer.trim()?qCountry.color:"var(--border)",color:answer.trim()?"#fff":"var(--text-muted)",fontSize:15,fontWeight:600,cursor:answer.trim()?"pointer":"not-allowed",transition:"all 0.2s"}}>Check Answer</button>
              <button type="button" onClick={() => { setAnswer(""); checkAnswer(); }} style={{marginTop:8,width:"100%",padding:"10px",borderRadius:12,border:"1px solid var(--border)",background:"transparent",cursor:"pointer",fontSize:13,color:"var(--text-muted)"}}>Skip</button>
            </form>
          ) : (
            <div className="fade-up" style={{maxWidth:360,margin:"0 auto"}}>
              {results[results.length - 1]?.correct ? (
                <div style={{background:"#dcfce7",border:"2px solid #86efac",borderRadius:20,padding:"1.5rem",marginBottom:16}}>
                  <div style={{fontSize:36,marginBottom:8}}>{"Correct!"}</div>
                  <div style={{fontSize:18,fontWeight:600,color:"#166534"}}>{d.english}</div>
                </div>
              ) : (
                <div style={{background:"#fef2f2",border:"2px solid #fca5a5",borderRadius:20,padding:"1.5rem",marginBottom:16}}>
                  <div style={{fontSize:20,fontWeight:600,color:"#991b1b",marginBottom:8}}>Not quite</div>
                  {answer.trim() && <div style={{fontSize:14,color:"#b91c1c",marginBottom:8}}>You said: <strong>{answer}</strong></div>}
                  <div style={{fontSize:18,fontWeight:700,color:"#166534"}}>Answer: {d.english}</div>
                </div>
              )}
              <button onClick={next} style={{width:"100%",padding:"14px",borderRadius:16,border:"none",background:qCountry.color,color:"#fff",fontSize:15,fontWeight:600,cursor:"pointer"}}>
                {idx + 1 >= 10 ? "See Results" : "Next Question \u2192"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === "result") {
    const pct = Math.round((score / 10) * 100);
    const grade = pct >= 80 ? "Menu Master!" : pct >= 50 ? "Getting There!" : "Keep Exploring!";
    const gradeColor = pct >= 80 ? "#16a34a" : pct >= 50 ? "#ea580c" : "#dc2626";
    return (
      <div className="app-container">
        <div style={{background:`linear-gradient(135deg,${qCountry.color},${qCountry.accent||qCountry.color}cc)`,padding:"2.5rem 1.5rem",textAlign:"center"}}>
          <CountryFlag code={qCountry.code} size={40} style={{margin:"0 auto 16px"}} />
          <h2 className="fd" style={{fontSize:28,color:"#fff",margin:"0 0 4px",fontStyle:"italic"}}>{qCountry.name} Quiz</h2>
          <p style={{fontSize:14,color:"rgba(255,255,255,.6)",margin:0}}>Results</p>
        </div>
        <div className="fade-up" style={{padding:"24px 16px"}}>
          {/* Score circle */}
          <div style={{textAlign:"center",marginBottom:24}}>
            <div style={{width:120,height:120,borderRadius:"50%",border:`6px solid ${gradeColor}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
              <div style={{fontSize:36,fontWeight:700,color:gradeColor}}>{score}</div>
              <div style={{fontSize:12,color:"var(--text-muted)"}}>out of 10</div>
            </div>
            <div className="fd" style={{fontSize:22,fontWeight:600,color:gradeColor,fontStyle:"italic"}}>{grade}</div>
          </div>
          {/* Results breakdown */}
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:20,padding:"4px 0",marginBottom:20}}>
            {results.map((r, i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",borderBottom:i<9?"1px solid var(--border-light)":"none"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:r.correct?"#dcfce7":"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{r.correct ? "\u2713" : "\u2717"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,color:"var(--text)"}}>{r.local}</div>
                  <div style={{fontSize:12,color:"var(--text-muted)"}}>{r.english}{r.answer && !r.correct ? ` (you: ${r.answer})` : ""}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={() => { setPhase("pick"); setResults([]); setIdx(0); }} style={{flex:1,padding:"14px",borderRadius:16,border:"1px solid var(--border)",background:"transparent",cursor:"pointer",fontSize:14,fontWeight:600,color:"var(--text-secondary)"}}>Try Another</button>
            <button onClick={onClose} style={{flex:1,padding:"14px",borderRadius:16,border:"none",background:"var(--accent)",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:600}}>Home</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function App() {
  useFonts();
  const [screen,setScreen] = useState("home");
  const [country,setCountry] = useState(null);
  const [menu,setMenu] = useState([]);
  const [menuLoading,setMenuLoading] = useState(false);
  const [menuDone,setMenuDone] = useState(false);
  const [menuError,setMenuError] = useState(null);
  const [dish,setDish] = useState(null);
  const [detail,setDetail] = useState(null);
  const [detailLoading,setDetailLoading] = useState(false);
  const [diners,setDiners] = useState(4);
  const [showCW,setShowCW] = useState(false);
  const [showDW,setShowDW] = useState(false);
  const [showShare,setShowShare] = useState(false);
  const [copied,setCopied] = useState(false);
  const [apiKey,setApiKey] = useState(()=>localStorage.getItem("gme_api_key")||"");
  const [showKeyInput,setShowKeyInput] = useState(false);
  const saveKey = useCallback((k)=>{setApiKey(k);localStorage.setItem("gme_api_key",k);setShowKeyInput(false);},[]);

  const ac = country?.color || "#dc2626";
  const ac2 = country ? (["#4caf50","#8B0000"].includes(country.accent) ? country.color : country.accent) : "#991b1b";
  const grad = useMemo(()=>`linear-gradient(135deg,${ac},${ac2})`,[ac,ac2]);
  const sc = useMemo(()=>detail ? scaleIng(detail.ingredients,diners) : [],[detail,diners]);
  const { icon:dishIcon, bg:dishBg } = dish ? getDishStyle(dish.local,dish.english) : {icon:"\ud83c\udf7d\ufe0f",bg:"#eceff1"};

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = country ? `Explore authentic ${country.name} dishes on the Global Menu Explorer` : "Explore authentic dishes from 12 countries on the Global Menu Explorer";
  const encText = encodeURIComponent(shareText);
  const encUrl = encodeURIComponent(shareUrl);
  const socials = [
    { label:"WhatsApp", color:"#25D366", icon:"\ud83d\udcac", href:`https://wa.me/?text=${encText}%20${encUrl}` },
    { label:"Twitter/X", color:"#0f1419", icon:"\ud835\udd4f", href:`https://twitter.com/intent/tweet?text=${encText}&url=${encUrl}` },
    { label:"Facebook", color:"#1877F2", icon:"f", href:`https://www.facebook.com/sharer/sharer.php?u=${encUrl}` },
    { label:"Email", color:"#64748b", icon:"@", href:`mailto:?subject=Global Menu Explorer&body=${encText}%20${encUrl}` },
  ];

  function handleCopy() { navigator.clipboard?.writeText(shareUrl).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2200);}).catch(()=>{}); }

  const openCountry = useCallback(async (c) => {
    if (!apiKey) { setShowKeyInput(true); return; }
    setCountry(c); setMenu([]); setMenuError(null); setMenuLoading(true); setMenuDone(false); setScreen("menu");
    const batches = [[1,10],[11,20],[21,30],[31,40],[41,50],[51,60],[61,70]];
    let errs = 0;
    let firstErr = "";
    // Stagger requests 250ms apart to avoid rate limits
    await Promise.all(batches.map(([s,e], batchIdx) =>
      new Promise(resolve => setTimeout(resolve, batchIdx * 250))
      .then(() => apiFetch(`List exactly the dishes ranked #${s} to #${e} by menu popularity in ${c.name} (rank 1 = most common). Order strictly from rank ${s} down to ${e}. Include typical home prep time. Return ONLY a JSON array of exactly ${e-s+1} items, no markdown: [{"rank":${s},"local":"name in ${c.lang}","english":"English name","prep":"X mins"},...]`, 850, apiKey))
      .then(raw => { try { const items = xj(raw,"array").map((it,i)=>({...it,rank:s+i})); setMenu(prev => { const map = {}; [...prev,...items].forEach(it=>{map[it.rank]=it;}); return Object.values(map).sort((a,b)=>a.rank-b.rank); }); } catch(e2) { errs++; if(!firstErr) firstErr=e2.message; } })
      .catch((e2)=>{ errs++; if(!firstErr) firstErr=e2.message||"Unknown error"; })
    ));
    if(errs) setMenuError(`${errs} batch(es) failed: ${firstErr}`);
    setMenuLoading(false); setMenuDone(true);
  }, [apiKey]);

  const openDish = useCallback(async (d) => {
    setDish(d); setDetail(null); setDetailLoading(true); setScreen("dish");
    try {
      const raw = await apiFetch(`BBC Good Food style recipe for "${d.english}" from ${country.name}. Return ONLY a JSON object, no markdown: {"description":"2 sentences","ingredients":["qty ingredient",...max 10],"prep_time":"X mins","cook_time":"X mins","steps":["step",...max 6]}`, 1200, apiKey);
      setDetail(xj(raw,"object"));
    } catch { setDetail({description:"Could not load recipe.",ingredients:[],prep_time:"-",cook_time:"-",steps:[]}); }
    setDetailLoading(false);
  }, [country, apiKey]);

  function ShareModal() {
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:16}} onClick={e=>{if(e.target===e.currentTarget)setShowShare(false);}}>
        <div className="fade-up" style={{background:"var(--bg-card)",borderRadius:24,padding:"1.75rem",maxWidth:380,width:"100%",boxShadow:"var(--shadow-lg)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.25rem"}}>
            <h3 className="fd" style={{fontSize:22,margin:0,fontWeight:600,color:"var(--text)"}}>Share</h3>
            <button onClick={()=>setShowShare(false)} style={{background:"var(--bg-secondary)",border:"none",cursor:"pointer",fontSize:18,color:"var(--text-secondary)",width:34,height:34,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>{"\u00d7"}</button>
          </div>
          <p style={{fontSize:14,color:"var(--text-secondary)",margin:"0 0 1.25rem",lineHeight:1.6}}>{shareText}</p>
          <div style={{display:"flex",gap:8,marginBottom:"1.25rem"}}>
            <div style={{flex:1,background:"var(--bg-secondary)",borderRadius:12,padding:"10px 14px",fontSize:13,color:"var(--text-muted)",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",border:"1px solid var(--border)",fontFamily:"monospace"}}>{shareUrl}</div>
            <button onClick={handleCopy} style={{flexShrink:0,padding:"10px 18px",borderRadius:12,border:"none",background:copied?"#16a34a":"var(--accent)",color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>{copied?"Copied!":"Copy"}</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {socials.map(s=>(<a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px",borderRadius:14,background:s.color,color:"#fff",textDecoration:"none",fontSize:13,fontWeight:600}}><span style={{fontSize:14,fontWeight:700}}>{s.icon}</span>{s.label}</a>))}
          </div>
        </div>
      </div>
    );
  }

  if (screen === "quiz") return <MenuQuiz apiKey={apiKey} onClose={() => setScreen("home")} />;

  if (screen==="home") return (
    <div className="app-container">
      {showShare && <ShareModal/>}
      {showCW && <SpinWheel items={COUNTRIES} colors={WC} label="name" onResult={c=>{setShowCW(false);openCountry(c);}} onClose={()=>setShowCW(false)}/>}
      {/* Hero */}
      <div style={{background:"linear-gradient(160deg,#0f0a1e 0%,#1a0a2e 30%,#2d1810 60%,#4a1c0a 100%)",padding:"3.5rem 1.5rem 3rem",textAlign:"center",position:"relative",overflow:"hidden"}}>
        {/* Decorative dots — world map hint */}
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.06}} viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
          {/* Europe cluster */}
          <circle cx="200" cy="60" r="2"/><circle cx="210" cy="55" r="1.5"/><circle cx="195" cy="65" r="1.5"/><circle cx="205" cy="70" r="1"/><circle cx="215" cy="62" r="1.2"/>
          {/* Asia cluster */}
          <circle cx="280" cy="70" r="2.5"/><circle cx="290" cy="80" r="2"/><circle cx="300" cy="75" r="1.5"/><circle cx="270" cy="85" r="1.8"/><circle cx="310" cy="90" r="1.2"/>
          {/* Americas */}
          <circle cx="100" cy="60" r="2"/><circle cx="90" cy="80" r="1.5"/><circle cx="110" cy="100" r="2"/><circle cx="105" cy="120" r="1.8"/><circle cx="115" cy="140" r="1.5"/>
          {/* Africa */}
          <circle cx="210" cy="110" r="2.5"/><circle cx="200" cy="120" r="1.5"/><circle cx="220" cy="130" r="2"/><circle cx="215" cy="145" r="1.2"/>
          {[...Array(30)].map((_,i) => <circle key={i} cx={50+Math.random()*300} cy={30+Math.random()*140} r={0.5+Math.random()*1.5} fill="white"/>)}
        </svg>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 30%, rgba(180,100,50,.15) 0%, transparent 70%)"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{position:"absolute",top:-8,right:0,display:"flex",gap:8}}>
            {apiKey && <PillBtn onClick={()=>setShowKeyInput(true)}>{"\ud83d\udd11"} Key</PillBtn>}
            <PillBtn onClick={()=>setShowShare(true)}>{"\ud83d\udd17"} Share</PillBtn>
          </div>
          <div style={{marginBottom:20}}>
            <HeroIcon />
          </div>
          <h1 className="fd" style={{fontSize:"clamp(32px, 7vw, 48px)",fontWeight:600,color:"#fff",margin:"0 0 12px",letterSpacing:"-1px",lineHeight:1.1,fontStyle:"italic"}}>
            <span style={{color:"rgba(255,200,150,.9)"}}>Global</span>{" "}Menu Explorer
          </h1>
          <p style={{fontSize:"clamp(14px, 2.5vw, 16px)",color:"rgba(255,255,255,.5)",margin:"0 auto 2rem",maxWidth:380,lineHeight:1.6}}>Discover the top 70 dishes from 12 countries, powered by AI</p>
          <PillBtn onClick={()=>setShowCW(true)} style={{padding:"12px 28px",fontSize:14,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)"}}>{"\ud83c\udfa1"} Help me pick a country</PillBtn>
        </div>
      </div>
      {/* API key input */}
      {(!apiKey || showKeyInput) && (
        <div className="fade-up" style={{margin:"20px 16px 0",padding:"1.5rem",background:"var(--bg-card)",borderRadius:20,border:"1px solid var(--border)",boxShadow:"var(--shadow-sm)"}}>
          <h3 style={{fontSize:16,fontWeight:700,margin:"0 0 6px",color:"var(--text)"}}>{apiKey?"Update API Key":"\ud83d\udd11 Enter your Anthropic API Key"}</h3>
          <p style={{fontSize:13,color:"var(--text-secondary)",margin:"0 0 14px",lineHeight:1.6}}>Required to load menus and recipes. Stored only in this browser.</p>
          <form onSubmit={e=>{e.preventDefault();const v=e.target.elements.key.value.trim();if(v)saveKey(v);}} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <input name="key" type="password" defaultValue={apiKey} placeholder="sk-ant-api03-..." style={{flex:"1 1 200px",padding:"12px 16px",borderRadius:14,border:"1.5px solid var(--border)",fontSize:14,background:"var(--bg-secondary)",color:"var(--text)",fontFamily:"monospace"}}/>
            <button type="submit" style={{padding:"12px 24px",borderRadius:14,border:"none",background:"var(--accent)",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>Save</button>
            {apiKey && showKeyInput && <button type="button" onClick={()=>setShowKeyInput(false)} style={{padding:"12px 18px",borderRadius:14,border:"1px solid var(--border)",background:"transparent",fontSize:14,cursor:"pointer",color:"var(--text-secondary)"}}>Cancel</button>}
          </form>
        </div>
      )}
      {/* Country grid */}
      <div style={{padding:"28px 16px 20px"}}>
        <p style={{fontSize:11,color:"var(--text-muted)",textAlign:"center",margin:"0 0 20px",letterSpacing:"2px",textTransform:"uppercase",fontWeight:600}}>Choose a country</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(155px,calc(50% - 8px)),1fr))",gap:14}}>
          {COUNTRIES.map(c=>(
            <button key={c.code} onClick={()=>openCountry(c)} style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:20,padding:0,cursor:"pointer",overflow:"hidden",textAlign:"center",transition:"all 0.25s cubic-bezier(.4,0,.2,1)"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px) scale(1.02)";e.currentTarget.style.borderColor=c.color;e.currentTarget.style.boxShadow="var(--shadow-lg)";}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0) scale(1)";e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.boxShadow="none";}}>
              <div style={{background:"#1e293b",height:80,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <CountryFlag code={c.code} size={40} style={{boxShadow:"0 3px 12px rgba(0,0,0,.3)"}} />
              </div>
              <div style={{padding:"12px 12px 14px"}}>
                <div style={{fontSize:15,fontWeight:600,letterSpacing:"-0.3px",color:"var(--text)"}}>{c.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      {/* Quiz CTA */}
      <div style={{padding:"0 16px 36px"}}>
        <button onClick={() => { if (!apiKey) { setShowKeyInput(true); return; } setScreen("quiz"); }}
          style={{width:"100%",padding:"18px 24px",borderRadius:20,border:"2px solid var(--border)",background:"var(--bg-card)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:12,transition:"all 0.25s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="#dc2626";e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="var(--shadow-md)";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
          <span style={{fontSize:24}}>{"?"}</span>
          <div style={{textAlign:"left"}}>
            <div style={{fontSize:16,fontWeight:700,color:"var(--text)"}}>Can you navigate a menu?</div>
            <div style={{fontSize:13,color:"var(--text-muted)"}}>Test your knowledge of dishes from around the world</div>
          </div>
          <span style={{fontSize:18,color:"var(--text-muted)",marginLeft:"auto"}}>{"\u2192"}</span>
        </button>
      </div>
    </div>
  );

  if (screen==="menu") return (
    <div className="app-container">
      {showShare && <ShareModal/>}
      {showDW && menu.length>0 && <SpinWheel items={menu} colors={WC} label="local" onResult={d=>{setShowDW(false);openDish(d);}} onClose={()=>setShowDW(false)}/>}
      <HeaderBar grad={grad} onBack={()=>setScreen("home")} backLabel="Home" left={<div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}><FlagSmall code={country.code} /><div style={{minWidth:0}}><h2 className="fd" style={{fontSize:"clamp(17px, 3vw, 22px)",fontWeight:600,margin:0,color:"#fff",letterSpacing:"-0.3px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{country.name}</h2><p style={{fontSize:12,color:"rgba(255,255,255,.6)",margin:0}}>{menuDone?`Top ${menu.length} dishes`:`Loading\u2026 ${menu.length}/70`}</p></div></div>} right={<>{menu.length>0 && <PillBtn onClick={()=>setShowDW(true)}>{"\ud83c\udfa1"} Pick</PillBtn>}<PillBtn onClick={()=>setShowShare(true)}>{"\ud83d\udd17"} Share</PillBtn></>}/>
      {menuLoading && menu.length===0 && (<div className="loading-pulse" style={{textAlign:"center",padding:"4rem 1.5rem"}}><div style={{fontSize:48,marginBottom:16}}>{"\ud83c\udf73"}</div><div className="fd" style={{fontSize:22,fontWeight:600,marginBottom:8,color:"var(--text)"}}>{"Loading menu\u2026"}</div><div style={{fontSize:14,color:"var(--text-muted)"}}>Fetching 7 batches in parallel</div></div>)}
      {menuError && (<div className="fade-up" style={{margin:"12px 16px 0",padding:"12px 16px",background:"var(--warning-bg)",borderRadius:14,border:"1px solid var(--warning-border)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><span style={{fontSize:18}}>{"\u26a0\ufe0f"}</span><span style={{fontSize:13,color:"var(--warning-text)",fontWeight:500}}>{menuError}</span></div>
        <button onClick={()=>openCountry(country)} style={{fontSize:13,padding:"8px 18px",borderRadius:10,border:"1px solid var(--warning-border)",background:"transparent",cursor:"pointer",color:"var(--warning-text)",fontWeight:600}}>Retry</button>
      </div>)}
      {menu.length>0 && (<div style={{padding:16}}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(min(180px,calc(50% - 8px)),1fr))",gap:14}}>{menu.map((item,i)=>(<div key={item.rank} className="fade-up" style={{animationDelay:`${Math.min(i*30,300)}ms`}}><MenuCard item={item} ac={ac} onClick={()=>openDish(item)}/></div>))}</div></div>)}
    </div>
  );

  if (screen==="dish") return (
    <div className="app-container">
      {showShare && <ShareModal/>}
      <HeaderBar grad={grad} onBack={()=>setScreen("menu")} backLabel="Menu" left={<div style={{display:"flex",alignItems:"center",gap:8,flex:1}}><FlagSmall code={country.code} w={36} /><span style={{fontSize:14,color:"rgba(255,255,255,.8)",fontWeight:500}}>{country.name}</span></div>} right={<PillBtn onClick={()=>setShowShare(true)}>{"\ud83d\udd17"} Share</PillBtn>}/>
      <div style={{height:"clamp(200px, 35vw, 280px)",background:dishBg,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
        <DishImageFull english={dish.english} icon={dishIcon} bg={dishBg} />
        <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,.7))",padding:"2.5rem 1.25rem 1.25rem",zIndex:1}}>
          <h2 className="fd" style={{fontSize:"clamp(22px, 4vw, 30px)",fontWeight:600,margin:"0 0 4px",color:"#fff",letterSpacing:"-0.5px"}}>{dish.local}</h2>
          {dish.english!==dish.local && <p style={{fontSize:14,color:"rgba(255,255,255,.75)",margin:0}}>{dish.english}</p>}
        </div>
      </div>
      {detailLoading && (<div className="loading-pulse" style={{textAlign:"center",padding:"3rem"}}><div style={{fontSize:40,marginBottom:12}}>{"\ud83d\udc68\u200d\ud83c\udf73"}</div><div className="fd" style={{fontSize:20,color:"var(--text)"}}>{"Loading recipe\u2026"}</div></div>)}
      {detail && (
        <div className="fade-up" style={{padding:16}}>
          <p style={{fontSize:15,lineHeight:1.75,color:"var(--text-secondary)",margin:"0 0 16px",background:"var(--bg-secondary)",borderRadius:16,padding:"16px 18px",borderLeft:`4px solid ${ac}`}}>{detail.description}</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
            {[["\u23f1 Prep",detail.prep_time],["\ud83d\udd25 Cook",detail.cook_time],["\ud83d\udc65 Serves",`${diners}`]].map(([lbl,val])=>(<div key={lbl} style={{background:ac,borderRadius:16,padding:"14px 8px",textAlign:"center"}}><div style={{fontSize:11,color:"rgba(255,255,255,.7)",marginBottom:4,fontWeight:500,letterSpacing:"0.5px"}}>{lbl}</div><div style={{fontSize:16,fontWeight:700,color:"#fff"}}>{val}</div></div>))}
          </div>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:20,padding:"18px 20px",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
              <h3 style={{fontSize:16,fontWeight:700,margin:0,color:"var(--text)"}}>{"\ud83e\uddc2"} Ingredients</h3>
              <div style={{display:"flex",alignItems:"center",gap:8}}><label style={{fontSize:13,color:"var(--text-muted)",fontWeight:500}}>Serves</label><select value={diners} onChange={e=>setDiners(Number(e.target.value))} style={{fontSize:14,padding:"6px 12px",borderRadius:12,border:`2px solid ${ac}`,color:ac,fontWeight:700,background:"var(--bg-card)",cursor:"pointer"}}>{Array.from({length:20},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}</option>)}</select></div>
            </div>
            {sc.map((ing,i)=>(<div key={i} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"9px 0",borderBottom:i<sc.length-1?"1px solid var(--border-light)":"none"}}><span style={{width:8,height:8,borderRadius:"50%",background:ac,marginTop:7,flexShrink:0}}></span><span style={{fontSize:14,color:"var(--text-secondary)",lineHeight:1.6}}>{ing}</span></div>))}
          </div>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:20,padding:"18px 20px",marginBottom:24}}>
            <h3 style={{fontSize:16,fontWeight:700,margin:"0 0 16px",color:"var(--text)"}}>{"\ud83d\udc69\u200d\ud83c\udf73"} How to make it</h3>
            {detail.steps.map((step,i)=>(<div key={i} style={{display:"flex",gap:14,marginBottom:i<detail.steps.length-1?18:0}}><div style={{width:30,height:30,borderRadius:"50%",background:ac,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0}}>{i+1}</div><p style={{fontSize:14,color:"var(--text-secondary)",margin:0,lineHeight:1.7,paddingTop:5}}>{step.replace(/^Step \d+:\s*/i,"")}</p></div>))}
          </div>
        </div>
      )}
    </div>
  );

  return null;
}
