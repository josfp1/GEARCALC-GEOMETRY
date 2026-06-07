import { useState, useMemo, useCallback } from "react";

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  bg:       "#ffffff",
  bgDeep:   "#f4f4f5",
  card:     "#f9f9f9",
  cardHov:  "#f0f0f0",
  border:   "#e4e4e7",
  borderHi: "#a1a1aa",
  text:     "#18181b",
  textSec:  "#52525b",
  textMut:  "#a1a1aa",
  blue:     "#18181b",
  blueDim:  "#f4f4f5",
  green:    "#18181b",
  greenDim: "#f4f4f5",
  amber:    "#52525b",
  amberDim: "#f4f4f5",
  red:      "#71717a",
  redDim:   "#f4f4f5",
};

// ─── WHEEL / TIRE DATA ────────────────────────────────────────────────────────
const WHEEL_SIZES = [
  { label: '700c (29")', diameter: 622 },
  { label: '27.5" (650b)', diameter: 584 },
  { label: '26"', diameter: 559 },
  { label: '24"', diameter: 507 },
  { label: '20"', diameter: 406 },
];
const TIRE_WIDTHS = [23,25,28,32,34,35,38,40,45,50,2.1,2.2,2.35,2.4];

// ─── PRESSURE ─────────────────────────────────────────────────────────────────
function calcTirePressure(w, kg, tubeless) {
  if (!kg || kg < 40) return null;
  let type, kF, kR;
  if (w <= 37) {
    type = "road";
    kF = 1.663 * Math.pow(34/w, 0.90);
    kR = 1.157 * Math.pow(34/w, 0.90);
  } else if (w <= 60) {
    type = "gravel";
    kF = 1.028 * Math.pow(40/w, 0.85);
    kR = 0.715 * Math.pow(40/w, 0.85);
  } else return null;
  const fTL = Math.round(kg*0.40*kF), rTL = Math.round(kg*0.60*kR);
  const cf = type==="road"?1.18:1.14;
  const fC = Math.round(fTL*cf), rC = Math.round(rTL*cf);
  const front = tubeless?fTL:fC, rear = tubeless?rTL:rC;
  return { type,
    front:{psi:front, bar:(front*0.0689476).toFixed(1)},
    rear: {psi:rear,  bar:(rear *0.0689476).toFixed(1)},
    frontCleat:fC, rearCleat:rC, frontTubeless:fTL, rearTubeless:rTL };
}

// ─── GEAR PRESETS ─────────────────────────────────────────────────────────────
const CHAINRING_PRESETS = [
  { cat:"Road",   name:"Red AXS 2x (50-37)",        teeth:[50,37] },
  { cat:"Road",   name:"Red/Force AXS 2x (48-35)",  teeth:[48,35] },
  { cat:"Road",   name:"Force/Rival AXS 2x (46-33)",teeth:[46,33] },
  { cat:"Gravel", name:"XPLR 1x (36T)", teeth:[36] },
  { cat:"Gravel", name:"XPLR 1x (38T)", teeth:[38] },
  { cat:"Gravel", name:"XPLR 1x (40T)", teeth:[40] },
  { cat:"Gravel", name:"XPLR 1x (42T)", teeth:[42] },
  { cat:"Gravel", name:"XPLR 1x (44T)", teeth:[44] },
  { cat:"Gravel", name:"XPLR 1x (46T)", teeth:[46] },
  { cat:"Gravel", name:"XPLR 1x (48T)", teeth:[48] },
  { cat:"Gravel", name:"XPLR 1x (50T)", teeth:[50] },
  { cat:"MTB",    name:"Eagle 1x (30T)", teeth:[30] },
  { cat:"MTB",    name:"Eagle 1x (32T)", teeth:[32] },
  { cat:"MTB",    name:"Eagle 1x (34T)", teeth:[34] },
  { cat:"MTB",    name:"Eagle 1x (36T)", teeth:[36] },
  { cat:"MTB",    name:"Eagle 1x (38T)", teeth:[38] },
  { cat:"MTB",    name:"Eagle 1x (40T)", teeth:[40] },
];
const CASSETTE_PRESETS = [
  { cat:"Road",   name:"Red AXS 12v 10-28",        teeth:[10,11,12,13,14,15,17,19,21,24,26,28] },
  { cat:"Road",   name:"Red AXS 12v 10-30",        teeth:[10,11,12,13,14,15,17,19,22,25,28,30] },
  { cat:"Road",   name:"Red/Force AXS 12v 10-33",  teeth:[10,11,12,13,14,15,17,19,22,25,28,33] },
  { cat:"Road",   name:"Force/Rival AXS 12v 10-36",teeth:[10,11,12,13,15,17,19,21,24,28,32,36] },
  { cat:"Gravel", name:"XPLR 12v 10-44", teeth:[10,11,12,13,14,16,18,21,24,28,35,44] },
  { cat:"Gravel", name:"XPLR 13v 10-46", teeth:[10,11,12,13,14,15,17,19,22,25,28,35,46] },
  { cat:"MTB",    name:"Eagle 12v 10-50", teeth:[10,12,14,16,18,21,24,28,32,36,42,50] },
  { cat:"MTB",    name:"Eagle 12v 10-52", teeth:[10,12,14,16,18,21,24,28,32,36,42,52] },
];

function calcDev(cr, sp, diam, tw) {
  return (cr/sp) * Math.PI * (diam + tw*2) / 1000;
}

// ─── GEOMETRY FIELDS ──────────────────────────────────────────────────────────
const GEO_FIELDS = [
  { key:"reach",       label:"Reach",           unit:"mm" },
  { key:"stack",       label:"Stack",            unit:"mm" },
  { key:"topTube",     label:"Top Tube ef.",     unit:"mm" },
  { key:"seatTube",    label:"Seat Tube C-T",    unit:"mm" },
  { key:"headAngle",   label:"Ángulo dir.",       unit:"°"  },
  { key:"seatAngle",   label:"Ángulo sillín",    unit:"°"  },
  { key:"headTube",    label:"Head Tube",         unit:"mm" },
  { key:"chainstay",   label:"Vaina",            unit:"mm" },
  { key:"wheelbase",   label:"Batalla",          unit:"mm" },
  { key:"bbDrop",      label:"BB Drop",          unit:"mm" },
  { key:"forkRake",    label:"Avance horquilla", unit:"mm" },
  { key:"trail",       label:"Trail",            unit:"mm" },
];

const BIKE_COLORS = ["#18181b","#71717a","#a1a1aa","#d4d4d8"];

// ─── PARSE GEOMETRY from HTML ─────────────────────────────────────────────────
function parseGeometry(html) {
  // Extract table rows — geometry data is in a table
  const rows = {};
  const rowMap = {
    "Reach": "reach", "Stack": "stack",
    "Top Tube (effective)": "topTube", "Top Tube": "topTube",
    "Seat Tube C-T": "seatTube", "Seat Tube": "seatTube",
    "Head Angle": "headAngle", "Seat Angle": "seatAngle",
    "Head Tube": "headTube", "Chainstay": "chainstay",
    "Wheelbase": "wheelbase", "BB Drop": "bbDrop",
    "Fork Rake / Offset": "forkRake", "Trail": "trail",
  };

  // Extract bike name
  const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const bikeName = nameMatch ? nameMatch[1].trim() : "Unknown";

  // Extract sizes from table header
  const sizeMatches = [...html.matchAll(/>\s*(\d{2,3}(?:\s*cm)?|XS|S|M|L|XL|XXL|[0-9]+(?:\.[0-9]+)?)\s*</gi)];
  const sizes = [];

  // Parse table rows for geometry
  const trMatches = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const parsedRows = {};

  for (const tr of trMatches) {
    const cells = [...tr[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      .map(m => m[1].replace(/<[^>]+>/g,"").replace(/&[a-z]+;/g,"").trim());
    if (cells.length < 2) continue;
    const label = cells[0];
    const key = rowMap[label];
    if (key) {
      parsedRows[key] = cells.slice(1).map(v => {
        const n = parseFloat(v);
        return isNaN(n) ? null : n;
      });
      if (!sizes.length) {
        // use number of cols to infer sizes count
      }
    }
    // Extract sizes from header row
    if (cells.some(c => /^\d{2,3}(\s*cm)?$|^(XS|S|M|L|XL|XXL)$/.test(c.trim()))) {
      cells.slice(1).forEach(c => {
        const t = c.trim();
        if (/^\d{2,3}(\s*cm)?$|^(XS|S|M|L|XL|XXL)$/.test(t) && !sizes.includes(t)) sizes.push(t);
      });
    }
  }

  return { bikeName, sizes, rows: parsedRows };
}

// ─── SHARED UI COMPONENTS ─────────────────────────────────────────────────────
const Label = ({children, style={}}) => (
  <div style={{ fontSize:10, color:T.textMut, letterSpacing:2, marginBottom:8,
    textTransform:"uppercase", fontFamily:"'Space Grotesk',sans-serif",
    fontWeight:600, ...style }}>{children}</div>
);

const StatRow = ({label, value}) => (
  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
    <span style={{ fontSize:11, color:T.textSec }}>{label}</span>
    <span style={{ fontSize:11, color:T.text, fontWeight:600 }}>{value}</span>
  </div>
);

const Card = ({children, style={}}) => (
  <div style={{ background:T.card, borderRadius:10, border:`1px solid ${T.border}`,
    padding:16, ...style }}>{children}</div>
);

const CatBtn = ({active, onClick, children}) => (
  <button onClick={onClick} style={{
    flex:1, padding:"5px 0",
    border:`1px solid ${active ? "#18181b" : "#e4e4e7"}`,
    background: active ? "#18181b" : "transparent",
    color: active ? "#ffffff" : "#71717a",
    borderRadius:5, fontSize:11, cursor:"pointer", fontFamily:"inherit",
    fontWeight: active ? 600 : 400, transition:"all 0.15s",
  }}>{children}</button>
);

const ToggleBtn = ({active, onClick, children}) => (
  <button onClick={onClick} className={`toggle-btn${active?" on":""}`}>{children}</button>
);

const sel = {
  width:"100%", background:"#ffffff", border:"1px solid #e4e4e7",
  borderRadius:6, color:"#18181b", padding:"8px 10px", fontSize:12,
  fontFamily:"inherit", cursor:"pointer",
};
const inp = {
  width:"100%", background:"#ffffff", border:"1px solid #e4e4e7",
  borderRadius:6, color:"#18181b", padding:"8px 10px", fontSize:12,
  fontFamily:"inherit",
};

function GainBar({value, max}) {
  const pct = Math.min((value/max)*100, 100);
  // Grayscale: light gray (low) → dark gray/black (high)
  const lightness = Math.round(85 - (value/max)*70);
  return (
    <div style={{background:"#e4e4e7", borderRadius:3, height:5, overflow:"hidden"}}>
      <div style={{width:`${pct}%`, height:"100%",
        background:`hsl(0,0%,${lightness}%)`, borderRadius:3, transition:"width 0.3s"}}/>
    </div>
  );
}

// ─── GEOMETRY TAB ─────────────────────────────────────────────────────────────
function GeometryTab() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bikes, setBikes] = useState([]); // [{name, slug, size, data:{}}]
  const [loadingSlug, setLoadingSlug] = useState(null);
  const [sizeModal, setSizeModal] = useState(null); // {slug, name, sizes, rows}
  const [error, setError] = useState("");

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true); setError(""); setResults([]);
    try {
      const res = await fetch(`/api/geometry?action=search&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.results || []);
      if ((data.results||[]).length === 0) setError("Sin resultados. Prueba con marca + modelo.");
    } catch(e) {
      setError("Error al buscar. Comprueba que el servidor está activo.");
    }
    setLoading(false);
  }, [query]);

  const loadBike = useCallback(async (slug, name) => {
    setLoadingSlug(slug); setError("");
    try {
      const res = await fetch(`/api/geometry?action=bike&slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      // Show size picker if multiple sizes
      if (data.sizes && data.sizes.length > 1) {
        setSizeModal({ slug, name, sizes: data.sizes, rows: data.rows });
      } else {
        addBike(slug, name, data.sizes?.[0] || "", data.rows, 0);
      }
    } catch(e) {
      setError("Error al cargar la bici.");
    }
    setLoadingSlug(null);
  }, []);

  const addBike = (slug, name, size, rows, sizeIdx) => {
    if (bikes.length >= 4) return;
    // extract data for chosen size
    const data = {};
    GEO_FIELDS.forEach(f => {
      const vals = rows[f.key];
      data[f.key] = vals ? (vals[sizeIdx] ?? null) : null;
    });
    setBikes(prev => [...prev, { id: Date.now(), slug, name, size, data }]);
    setSizeModal(null);
  };

  const removeBike = (id) => setBikes(prev => prev.filter(b => b.id !== id));

  // Compute min/max per field for bar scaling
  const fieldStats = useMemo(() => {
    const stats = {};
    GEO_FIELDS.forEach(f => {
      const vals = bikes.map(b => b.data[f.key]).filter(v => v !== null && v !== undefined);
      stats[f.key] = { min: Math.min(...vals), max: Math.max(...vals) };
    });
    return stats;
  }, [bikes]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* Search */}
      <Card>
        <Label>Buscar bicicleta</Label>
        <div style={{ display:"flex", gap:8 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key==="Enter" && search()}
            placeholder="ej: Trek Emonda 2023, Specialized Tarmac..."
            style={{ ...inp, flex:1 }}
          />
          <button onClick={search} style={{
            padding:"8px 18px", background:T.blue, border:"none", borderRadius:6,
            color:"#000", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit",
          }}>
            {loading ? "···" : "Buscar"}
          </button>
        </div>
        {error && <div style={{ marginTop:8, fontSize:11, color:T.red }}>{error}</div>}

        {/* Results */}
        {results.length > 0 && (
          <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:4, maxHeight:220, overflowY:"auto" }}>
            {results.map((r,i) => (
              <div key={i} onClick={() => loadBike(r.slug, r.name)}
                style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"8px 12px", borderRadius:6, background:"#f4f4f5",
                  border:`1px solid ${T.border}`, cursor:"pointer",
                  opacity: bikes.length>=4 ? 0.5 : 1,
                  transition:"border-color 0.15s",
                }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=T.blue}
                onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}
              >
                <span style={{ fontSize:12, color:T.text }}>{r.name}</span>
                {loadingSlug===r.slug
                  ? <span style={{ fontSize:10, color:T.textMut }}>cargando…</span>
                  : <span style={{ fontSize:10, color:T.blue }}>+ añadir</span>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Size modal */}
      {sizeModal && (
        <Card style={{ border:`1px solid ${T.blue}` }}>
          <Label>Selecciona talla — {sizeModal.name}</Label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {sizeModal.sizes.map((sz,i) => (
              <button key={i} onClick={() => addBike(sizeModal.slug, sizeModal.name, sz, sizeModal.rows, i)}
                style={{ padding:"6px 14px", borderRadius:5, border:`1px solid ${T.border}`,
                  background:"#f4f4f5", color:T.text, cursor:"pointer", fontSize:12,
                  fontFamily:"inherit", transition:"all 0.15s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.blue;e.currentTarget.style.color=T.blue;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.text;}}
              >{sz}</button>
            ))}
          </div>
          <button onClick={() => setSizeModal(null)}
            style={{ marginTop:10, fontSize:11, color:T.textMut, background:"none",
              border:"none", cursor:"pointer", fontFamily:"inherit" }}>
            Cancelar
          </button>
        </Card>
      )}

      {/* Added bikes */}
      {bikes.length > 0 && (
        <>
          {/* Bike chips */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {bikes.map((b,i) => (
              <div key={b.id} style={{ display:"flex", alignItems:"center", gap:8,
                padding:"6px 12px", borderRadius:6, background:T.card,
                border:`1px solid ${BIKE_COLORS[i]}55` }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:BIKE_COLORS[i], flexShrink:0 }}/>
                <span style={{ fontSize:11, color:T.text }}>{b.name}</span>
                {b.size && <span style={{ fontSize:10, color:BIKE_COLORS[i], fontWeight:600 }}>{b.size}</span>}
                <button onClick={() => removeBike(b.id)}
                  style={{ marginLeft:4, background:"none", border:"none", color:T.textMut,
                    cursor:"pointer", fontSize:13, lineHeight:1, padding:0 }}>×</button>
              </div>
            ))}
            {bikes.length < 4 && (
              <div style={{ fontSize:11, color:T.textMut, padding:"6px 0", alignSelf:"center" }}>
                Puedes añadir hasta {4-bikes.length} bici{4-bikes.length!==1?"s":"s"} más
              </div>
            )}
          </div>

          {/* Comparison table */}
          <Card style={{ padding:0, overflow:"hidden" }}>
            {/* Header */}
            <div style={{ display:"grid",
              gridTemplateColumns:`180px repeat(${bikes.length}, 1fr)`,
              borderBottom:`1px solid ${T.border}`, background:"#f4f4f5" }}>
              <div style={{ padding:"10px 16px", fontSize:10, color:T.textMut, letterSpacing:2 }}>MEDIDA</div>
              {bikes.map((b,i) => (
                <div key={b.id} style={{ padding:"10px 12px", borderLeft:`1px solid ${T.border}` }}>
                  <div style={{ fontSize:10, color:BIKE_COLORS[i], fontWeight:700, letterSpacing:0.5 }}>
                    {b.name.length > 22 ? b.name.slice(0,22)+"…" : b.name}
                  </div>
                  {b.size && <div style={{ fontSize:9, color:T.textMut, marginTop:2 }}>{b.size}</div>}
                </div>
              ))}
            </div>

            {/* Rows */}
            {GEO_FIELDS.map((f, fi) => {
              const stats = fieldStats[f.key] || {};
              const hasData = bikes.some(b => b.data[f.key] !== null);
              if (!hasData) return null;
              return (
                <div key={f.key}
                  style={{ display:"grid",
                    gridTemplateColumns:`180px repeat(${bikes.length}, 1fr)`,
                    borderBottom:`1px solid ${T.border}22`,
                    background: fi%2===0 ? "transparent" : "#f4f4f588" }}>
                  <div style={{ padding:"10px 16px" }}>
                    <div style={{ fontSize:11, color:T.textSec }}>{f.label}</div>
                    <div style={{ fontSize:9, color:T.textMut }}>{f.unit}</div>
                  </div>
                  {bikes.map((b,i) => {
                    const val = b.data[f.key];
                    const pct = (stats.max !== stats.min && val !== null)
                      ? ((val - stats.min)/(stats.max - stats.min))*100 : 50;
                    const isMax = val === stats.max && stats.max !== stats.min;
                    const isMin = val === stats.min && stats.max !== stats.min;
                    return (
                      <div key={b.id} style={{ padding:"10px 12px",
                        borderLeft:`1px solid ${T.border}22` }}>
                        {val !== null ? (
                          <>
                            <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:4 }}>
                              <span style={{ fontSize:15, fontWeight:700,
                                color: isMax ? BIKE_COLORS[i] : isMin ? T.textSec : T.text }}>
                                {val}
                              </span>
                              <span style={{ fontSize:9, color:T.textMut }}>{f.unit}</span>
                            </div>
                            <div style={{ height:4, borderRadius:2, background:"#f4f4f5", overflow:"hidden" }}>
                              <div style={{ width:`${pct}%`, height:"100%",
                                background:BIKE_COLORS[i], borderRadius:2, transition:"width 0.4s" }}/>
                            </div>
                          </>
                        ) : (
                          <span style={{ fontSize:11, color:T.textMut }}>—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </Card>

          {/* Note */}
          <div style={{ fontSize:10, color:T.textMut, textAlign:"center" }}>
            Datos de geometrygeeks.bike · El valor más alto se muestra en el color de la bici
          </div>
        </>
      )}

      {bikes.length === 0 && results.length === 0 && (
        <div style={{ textAlign:"center", padding:"50px 20px", color:T.textMut }}>
          <div style={{ fontSize:36, marginBottom:12 }}>📐</div>
          <div style={{ fontSize:13, marginBottom:4, color:T.textSec }}>Busca y compara geometrías</div>
          <div style={{ fontSize:11 }}>Hasta 4 bicis en paralelo con datos de Geometry Geeks</div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("gears");

  // Gear state
  const [wheelIdx, setWheelIdx]     = useState(0);
  const [tireWidth, setTireWidth]   = useState(28);
  const [customTire, setCustomTire] = useState(false);
  const [tireInput, setTireInput]   = useState("28");
  const [riderWeight, setRiderWeight] = useState(70);
  const [showPressure, setShowPressure] = useState(false);
  const [tubeless, setTubeless]     = useState(true);
  const [cadence, setCadence]       = useState(90);
  const [crCat, setCrCat]           = useState("Road");
  const [crIdx, setCrIdx]           = useState(0);
  const [csCat, setCsCat]           = useState("Road");
  const [csIdx, setCsIdx]           = useState(0);
  const [customCR, setCustomCR]     = useState("");
  const [customCS, setCustomCS]     = useState("");
  const [useCustomCR, setUseCustomCR] = useState(false);
  const [useCustomCS, setUseCustomCS] = useState(false);
  const [unit, setUnit]             = useState("m");
  const [highlight, setHighlight]   = useState(null);

  const CATS = ["Road","Gravel","MTB"];
  const crOptions = CHAINRING_PRESETS.filter(p => p.cat===crCat);
  const safecrIdx = Math.min(crIdx, crOptions.length-1);
  const csOptions = CASSETTE_PRESETS.filter(p => p.cat===csCat);
  const safeCsIdx = Math.min(csIdx, csOptions.length-1);

  const wheel = WHEEL_SIZES[wheelIdx];
  const tire  = customTire ? parseFloat(tireInput)||28 : tireWidth;
  const tireWidthMM = tire > 10 ? tire : tire*25.4;
  const pressure = useMemo(() => calcTirePressure(tireWidthMM, riderWeight, tubeless), [tireWidthMM, riderWeight, tubeless]);

  const chainrings = useMemo(() => {
    if (useCustomCR) return customCR.split(",").map(s=>parseInt(s.trim())).filter(n=>n>0);
    return crOptions[safecrIdx]?.teeth || [];
  }, [useCustomCR, customCR, crOptions, safecrIdx]);

  const sprockets = useMemo(() => {
    if (useCustomCS) return customCS.split(",").map(s=>parseInt(s.trim())).filter(n=>n>0);
    return csOptions[safeCsIdx]?.teeth || [];
  }, [useCustomCS, customCS, csOptions, safeCsIdx]);

  const gears = useMemo(() => {
    const r = [];
    for (const cr of chainrings)
      for (const sp of sprockets)
        r.push({ cr, sp, dev: calcDev(cr,sp,wheel.diameter,tireWidthMM),
          speed: calcDev(cr,sp,wheel.diameter,tireWidthMM)*cadence*60/1000, ratio:cr/sp });
    return r.sort((a,b)=>a.dev-b.dev);
  }, [chainrings, sprockets, wheel, tireWidthMM, cadence]);

  const maxDev = gears.length ? Math.max(...gears.map(g=>g.dev)) : 10;
  const minDev = gears.length ? Math.min(...gears.map(g=>g.dev)) : 0;
  const range  = maxDev-minDev;
  const palette = ["#18181b","#71717a","#a1a1aa","#d4d4d8","#52525b"];
  const crList  = [...new Set(chainrings)];
  const crColors = {};
  crList.forEach((cr,i) => { crColors[cr] = palette[i%palette.length]; });

  const catBtn = (active) => ({
    flex:1, padding:"5px 0",
    border:`1px solid ${active ? T.green : T.border}`,
    background: active ? T.greenDim : "transparent",
    color: active ? T.green : T.textSec,
    borderRadius:5, fontSize:11, cursor:"pointer", fontFamily:"inherit",
    fontWeight: active ? 600 : 400, transition:"all 0.15s",
  });

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text,
      fontFamily:"'IBM Plex Mono','Courier New',monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Space+Grotesk:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-track{background:#f4f4f5;}
        ::-webkit-scrollbar-thumb{background:#d4d4d8;border-radius:3px;}
        select,input{outline:none;} select option{background:#ffffff;}
        .gear-row:hover{background:#f4f4f5 !important;}
        .gear-row.hl{background:#e4e4e7 !important;border-left:3px solid #18181b !important;}
        .toggle-btn{cursor:pointer;padding:4px 10px;border-radius:5px;font-size:11px;
          border:1px solid #e4e4e7;background:transparent;color:#71717a;
          transition:all 0.2s;font-family:inherit;}
        .toggle-btn.on{background:#18181b;border-color:#18181b;color:#ffffff;}
        input[type=range]{-webkit-appearance:none;width:100%;height:3px;border-radius:2px;background:#d4d4d8;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;
          border-radius:50%;background:#18181b;cursor:pointer;border:2px solid #fff;box-shadow:0 0 0 1px #d4d4d8;}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background:"#18181b", borderBottom:"1px solid #27272a",
        padding:"14px 20px", display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ fontSize:20 }}>🚴</div>
        <div>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700,
            fontSize:17, color:"#ffffff", letterSpacing:-0.5 }}>BIKE TOOLS</div>
          <div style={{ fontSize:9, color:"#71717a", letterSpacing:2 }}>SRAM · DESARROLLOS & GEOMETRÍA</div>
        </div>
        {/* Nav tabs */}
        <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
          {[["gears","⚙ Desarrollos"],["geo","📐 Geometría"]].map(([k,l]) => (
            <button key={k} onClick={()=>setTab(k)} style={{
              padding:"6px 13px",
              border:`1px solid ${tab===k ? "#ffffff" : "#3f3f46"}`,
              background: tab===k ? "#ffffff" : "transparent",
              color: tab===k ? "#18181b" : "#a1a1aa",
              borderRadius:5, fontSize:11, cursor:"pointer", fontFamily:"inherit",
              fontWeight: tab===k ? 700 : 400, transition:"all 0.15s",
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth:960, margin:"0 auto", padding:"20px 16px",
        display:"flex", flexDirection:"column", gap:20 }}>

        {/* ── GEOMETRY TAB ── */}
        {tab==="geo" && <GeometryTab />}

        {/* ── GEARS TAB ── */}
        {tab==="gears" && (<>

          {/* Unit toggle */}
          <div style={{ display:"flex", justifyContent:"flex-end", gap:6 }}>
            {[["m","m/vuelta"],["kmh","km/h"]].map(([k,l])=>(
              <button key={k} onClick={()=>setUnit(k)} style={{
                padding:"5px 12px",
                border:`1px solid ${unit===k ? "#18181b" : "#e4e4e7"}`,
                background: unit===k ? "#18181b" : "transparent",
                color: unit===k ? "#ffffff" : "#71717a",
                borderRadius:5, fontSize:11, cursor:"pointer", fontFamily:"inherit",
                fontWeight: unit===k ? 600 : 400, transition:"all 0.15s",
              }}>{l}</button>
            ))}
          </div>

          {/* Config grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16 }}>

            {/* LEFT */}
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* Rueda */}
              <Card>
                <Label>Tamaño de rueda</Label>
                <select value={wheelIdx} onChange={e=>setWheelIdx(+e.target.value)} style={sel}>
                  {WHEEL_SIZES.map((w,i)=><option key={i} value={i}>{w.label}</option>)}
                </select>
              </Card>

              {/* Cubierta + Presión */}
              <Card>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <Label style={{marginBottom:0}}>Ancho de cubierta</Label>
                  <ToggleBtn active={customTire} onClick={()=>setCustomTire(!customTire)}>
                    {customTire?"custom":"preset"}
                  </ToggleBtn>
                </div>
                {customTire ? (
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <input type="number" value={tireInput} onChange={e=>setTireInput(e.target.value)}
                      style={{...inp, width:90}} placeholder="mm"/>
                    <span style={{ fontSize:11, color:T.textSec }}>mm</span>
                  </div>
                ) : (
                  <select value={tireWidth} onChange={e=>setTireWidth(+e.target.value)} style={sel}>
                    {TIRE_WIDTHS.map(w=><option key={w} value={w}>
                      {w>10?`${w}mm`:`${w}" (${Math.round(w*25.4)}mm)`}
                    </option>)}
                  </select>
                )}
                <div style={{ fontSize:10, color:T.textMut, marginTop:6 }}>
                  Diámetro total: {Math.round(wheel.diameter+tireWidthMM*2)}mm
                </div>

                {/* Presión */}
                <div style={{ marginTop:14, borderTop:`1px solid ${T.border}`, paddingTop:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <Label style={{marginBottom:0}}>Presión de cubierta</Label>
                    <ToggleBtn active={showPressure} onClick={()=>setShowPressure(!showPressure)}>
                      {showPressure?"activo":"ver"}
                    </ToggleBtn>
                  </div>
                  {showPressure && (<>
                    <div style={{ display:"flex", gap:4, marginBottom:12 }}>
                      {[["tl","Tubeless",true],["cl","Con cámara",false]].map(([k,l,v])=>(
                        <button key={k} onClick={()=>setTubeless(v)} style={{
                          flex:1, padding:"6px 0",
                          border:`1px solid ${tubeless===v ? "#18181b" : "#e4e4e7"}`,
                          background: tubeless===v ? "#18181b" : "transparent",
                          color: tubeless===v ? "#ffffff" : "#71717a",
                          borderRadius:5, fontSize:11, cursor:"pointer", fontFamily:"inherit",
                          fontWeight: tubeless===v ? 600 : 400, transition:"all 0.15s",
                        }}>{l}</button>
                      ))}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                      <span style={{ fontSize:11, color:"#52525b", whiteSpace:"nowrap" }}>Peso ciclista</span>
                      <input type="range" min={45} max={120} value={riderWeight} onChange={e=>setRiderWeight(+e.target.value)}/>
                      <span style={{ fontSize:13, color:"#18181b", fontWeight:700, minWidth:50 }}>{riderWeight} kg</span>
                    </div>
                    {pressure ? (()=>{
                      return (
                        <div style={{ borderRadius:8, border:"1px solid #d4d4d8", overflow:"hidden", background:"#f9f9f9" }}>
                          <div style={{ padding:"8px 14px", borderBottom:"1px solid #e4e4e7",
                            display:"flex", justifyContent:"space-between", alignItems:"center",
                            background:"#f4f4f5" }}>
                            <span style={{ fontSize:9, color:"#18181b", letterSpacing:2,
                              fontFamily:"'Space Grotesk',sans-serif", fontWeight:700 }}>
                              {pressure.type==="road"?"CARRETERA":"GRAVEL"} — {tubeless?"TUBELESS":"CON CÁMARA"}
                            </span>
                            <span style={{ fontSize:9, color:"#a1a1aa" }}>{tireWidthMM}mm · {riderWeight}kg</span>
                          </div>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr" }}>
                            {[
                              {label:"DELANTERA",icon:"△",data:pressure.front,cleat:pressure.frontCleat,tless:pressure.frontTubeless},
                              {label:"TRASERA",  icon:"▽",data:pressure.rear, cleat:pressure.rearCleat, tless:pressure.rearTubeless},
                            ].map(({label,icon,data,cleat,tless},idx)=>(
                              <div key={idx} style={{ padding:"12px 14px",
                                borderRight:idx===0?"1px solid #e4e4e7":"none" }}>
                                <div style={{ fontSize:9, color:"#a1a1aa", letterSpacing:1, marginBottom:6 }}>{icon} {label}</div>
                                <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:4 }}>
                                  <span style={{ fontSize:28, fontWeight:700, color:"#18181b", lineHeight:1 }}>{data.psi}</span>
                                  <span style={{ fontSize:11, color:"#a1a1aa" }}>PSI</span>
                                </div>
                                <div style={{ fontSize:16, color:"#52525b", fontWeight:600, marginBottom:8 }}>
                                  {data.bar} <span style={{ fontSize:10, color:"#a1a1aa", fontWeight:400 }}>bar</span>
                                </div>
                                <div style={{ borderTop:"1px solid #e4e4e7", paddingTop:6 }}>
                                  <div style={{ fontSize:9, display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                                    <span style={{ color:"#a1a1aa" }}>tubeless</span>
                                    <span style={{ color:"#18181b", fontWeight:600 }}>{tless} PSI</span>
                                  </div>
                                  <div style={{ fontSize:9, display:"flex", justifyContent:"space-between" }}>
                                    <span style={{ color:"#a1a1aa" }}>cámara</span>
                                    <span style={{ color:"#52525b", fontWeight:600 }}>{cleat} PSI</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div style={{ padding:"6px 14px", borderTop:"1px solid #e4e4e7",
                            fontSize:9, color:"#a1a1aa" }}>
                            Delantera 40% · Trasera 60% · Orientativo, ajusta según sensaciones
                          </div>
                        </div>
                      );
                    })() : (
                      <div style={{ fontSize:11, color:"#a1a1aa", fontStyle:"italic" }}>
                        Disponible para 23–35mm (carretera) y 38–55mm (gravel)
                      </div>
                    )}
                  </>)}
                </div>
              </Card>

              {/* Cadencia */}
              <Card>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <Label style={{marginBottom:0}}>Cadencia</Label>
                  <span style={{ fontSize:14, color:T.blue, fontWeight:700 }}>{cadence} rpm</span>
                </div>
                <input type="range" min={40} max={140} value={cadence} onChange={e=>setCadence(+e.target.value)}/>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.textMut, marginTop:4 }}>
                  <span>40</span><span>90</span><span>140</span>
                </div>
              </Card>
            </div>

            {/* RIGHT */}
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* Platos */}
              <Card>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <Label style={{marginBottom:0}}>Platos · SRAM</Label>
                  <ToggleBtn active={useCustomCR} onClick={()=>setUseCustomCR(!useCustomCR)}>
                    {useCustomCR?"custom":"preset"}
                  </ToggleBtn>
                </div>
                {useCustomCR ? (
                  <input value={customCR} onChange={e=>setCustomCR(e.target.value)}
                    placeholder="ej: 50, 34" style={inp}/>
                ) : (<>
                  <div style={{ display:"flex", gap:4, marginBottom:8 }}>
                    {CATS.map(c=><button key={c} onClick={()=>{setCrCat(c);setCrIdx(0);}} style={catBtn(crCat===c)}>{c}</button>)}
                  </div>
                  <select value={safecrIdx} onChange={e=>setCrIdx(+e.target.value)} style={sel}>
                    {crOptions.map((p,i)=><option key={i} value={i}>{p.name}</option>)}
                  </select>
                </>)}
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:10 }}>
                  {chainrings.map((cr,i)=>(
                    <span key={i} style={{ background:`${crColors[cr]}18`,
                      border:`1px solid ${crColors[cr]}60`, color:crColors[cr],
                      borderRadius:4, padding:"2px 9px", fontSize:11, fontWeight:600 }}>{cr}T</span>
                  ))}
                </div>
              </Card>

              {/* Cassette */}
              <Card>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <Label style={{marginBottom:0}}>Cassette · SRAM</Label>
                  <ToggleBtn active={useCustomCS} onClick={()=>setUseCustomCS(!useCustomCS)}>
                    {useCustomCS?"custom":"preset"}
                  </ToggleBtn>
                </div>
                {useCustomCS ? (
                  <input value={customCS} onChange={e=>setCustomCS(e.target.value)}
                    placeholder="ej: 11,13,15..." style={inp}/>
                ) : (<>
                  <div style={{ display:"flex", gap:4, marginBottom:8 }}>
                    {CATS.map(c=><button key={c} onClick={()=>{setCsCat(c);setCsIdx(0);}} style={catBtn(csCat===c)}>{c}</button>)}
                  </div>
                  <select value={safeCsIdx} onChange={e=>setCsIdx(+e.target.value)} style={sel}>
                    {csOptions.map((p,i)=><option key={i} value={i}>{p.name}</option>)}
                  </select>
                </>)}
                <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop:10 }}>
                  {sprockets.map((sp,i)=>(
                    <span key={i} style={{ background:"#f4f4f5", border:"1px solid #e4e4e7",
                      borderRadius:4, padding:"2px 7px", fontSize:10, color:T.textSec }}>{sp}T</span>
                  ))}
                </div>
              </Card>

              {/* Resumen */}
              {gears.length>0 && (
                <Card style={{ background:"#f0f0f0" }}>
                  <Label>Resumen</Label>
                  <StatRow label="Platos"       value={useCustomCR?"Custom":`SRAM ${crCat}`}/>
                  <StatRow label="Cassette"     value={useCustomCS?"Custom":`SRAM ${csCat}`}/>
                  <StatRow label="Combinaciones" value={gears.length}/>
                  <StatRow label="Mín desarrollo" value={`${minDev.toFixed(2)} m`}/>
                  <StatRow label="Máx desarrollo" value={`${maxDev.toFixed(2)} m`}/>
                  <StatRow label="Rango"          value={`${((maxDev/minDev-1)*100).toFixed(0)}%`}/>
                  <StatRow label="Vel. mín"        value={`${(minDev*cadence*60/1000).toFixed(1)} km/h`}/>
                  <StatRow label="Vel. máx"        value={`${(maxDev*cadence*60/1000).toFixed(1)} km/h`}/>
                </Card>
              )}
            </div>
          </div>

          {/* Visualización */}
          {gears.length>0 && (
            <Card>
              <Label>Visualización de rango</Label>
              {crList.map(cr=>(
                <div key={cr} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:crColors[cr] }}/>
                    <span style={{ fontSize:11, color:crColors[cr], fontWeight:600 }}>{cr}T</span>
                  </div>
                  <div style={{ position:"relative", height:32, background:"#f4f4f5", borderRadius:5, border:"1px solid #e4e4e7" }}>
                    {gears.filter(g=>g.cr===cr).map((g,i)=>{
                      const left = range>0 ? ((g.dev-minDev)/range)*100 : 50;
                      const isAct = highlight && highlight.cr===g.cr && highlight.sp===g.sp;
                      return (
                        <div key={i}
                          onMouseEnter={()=>setHighlight(g)} onMouseLeave={()=>setHighlight(null)}
                          onTouchStart={()=>setHighlight(g)}
                          style={{ position:"absolute", left:`${left}%`, top:"50%",
                            transform:"translate(-50%,-50%)",
                            width:isAct?18:11, height:isAct?18:11, borderRadius:"50%",
                            background:isAct?crColors[cr]:`${crColors[cr]}77`,
                            border:isAct?`2px solid ${crColors[cr]}`:"none",
                            cursor:"pointer", transition:"all 0.15s", zIndex:isAct?10:1 }}/>
                      );
                    })}
                  </div>
                </div>
              ))}
              {highlight && (
                <div style={{ marginTop:6, background:"#f4f4f5", borderRadius:6,
                  padding:"8px 12px", border:`1px solid ${T.border}`, fontSize:12 }}>
                  <span style={{ color:crColors[highlight.cr], fontWeight:700 }}>{highlight.cr}T</span>
                  <span style={{ color:T.textMut }}> × </span>
                  <span style={{ color:T.textSec }}>{highlight.sp}T</span>
                  <span style={{ color:T.textMut }}> — </span>
                  <span style={{ color:T.text }}>{highlight.dev.toFixed(2)} m</span>
                  <span style={{ color:T.textMut }}> · </span>
                  <span style={{ color:T.blue, fontWeight:600 }}>{highlight.speed.toFixed(1)} km/h</span>
                  <span style={{ color:T.textMut }}> @ {cadence}rpm</span>
                </div>
              )}
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
                <span style={{ fontSize:10, color:T.textMut }}>{minDev.toFixed(1)} m</span>
                <span style={{ fontSize:10, color:T.textMut }}>{maxDev.toFixed(1)} m</span>
              </div>
            </Card>
          )}

          {/* Tabla */}
          {gears.length>0 && (
            <div>
              <div style={{ fontSize:10, color:T.textMut, letterSpacing:2, marginBottom:10,
                fontFamily:"'Space Grotesk',sans-serif", fontWeight:600 }}>
                TABLA DE COMBINACIONES — {gears.length} marchas
              </div>
              <div style={{ background:T.card, borderRadius:10, border:`1px solid ${T.border}`, overflow:"hidden" }}>
                <div style={{ display:"grid", gridTemplateColumns:"55px 55px 65px 1fr 90px 72px",
                  padding:"9px 16px", borderBottom:`1px solid ${T.border}`, background:"#f4f4f5" }}>
                  {["Plato","Piñón","Ratio","Desarrollo",unit==="kmh"?`km/h @${cadence}`:"m/vuelta",""].map((h,i)=>(
                    <div key={i} style={{ fontSize:9, color:T.textMut, letterSpacing:1,
                      fontFamily:"'Space Grotesk',sans-serif", fontWeight:600 }}>{h}</div>
                  ))}
                </div>
                {gears.map((g,i)=>{
                  const isHl = highlight && highlight.cr===g.cr && highlight.sp===g.sp;
                  const pct  = range>0 ? (g.dev-minDev)/range : 0.5;
                  return (
                    <div key={i} className={`gear-row${isHl?" hl":""}`}
                      onMouseEnter={()=>setHighlight(g)} onMouseLeave={()=>setHighlight(null)}
                      style={{ display:"grid", gridTemplateColumns:"55px 55px 65px 1fr 90px 72px",
                        padding:"7px 16px", borderBottom:`1px solid ${T.border}22`,
                        alignItems:"center", cursor:"default", transition:"background 0.1s",
                        borderLeft:isHl?undefined:"3px solid transparent" }}>
                      <span style={{ color:crColors[g.cr], fontWeight:700, fontSize:13 }}>{g.cr}T</span>
                      <span style={{ color:T.textSec, fontSize:13 }}>{g.sp}T</span>
                      <span style={{ color:T.textMut, fontSize:12 }}>{g.ratio.toFixed(2)}</span>
                      <div style={{ paddingRight:12 }}><GainBar value={g.dev} max={maxDev}/></div>
                      <span style={{ fontSize:13, color:T.text, fontWeight:600 }}>
                        {unit==="kmh"?`${g.speed.toFixed(1)} km/h`:`${g.dev.toFixed(2)} m`}
                      </span>
                      <span style={{ fontSize:9,
                        background:pct<0.33?T.redDim:pct>0.66?T.greenDim:T.card,
                        color:pct<0.33?T.red:pct>0.66?T.green:T.textMut,
                        border:`1px solid ${pct<0.33?T.red+"33":pct>0.66?T.green+"33":T.border}`,
                        borderRadius:3, padding:"1px 5px", letterSpacing:0.5,
                        fontFamily:"'Space Grotesk',sans-serif", fontWeight:600 }}>
                        {pct<0.25?"BAJO":pct>0.75?"ALTO":pct<0.5?"MEDIO-B":"MEDIO-A"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {gears.length===0 && (
            <div style={{ textAlign:"center", padding:"60px 20px", color:T.textMut }}>
              <div style={{ fontSize:34, marginBottom:12 }}>⚙️</div>
              <div>Configura platos y piñones para ver los desarrollos</div>
            </div>
          )}
        </>)}
      </div>
    </div>
  );
}
