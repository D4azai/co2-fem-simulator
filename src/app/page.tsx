"use client";

import { useEffect, useMemo, useState } from "react";
import { BOX, DEFAULTS, FEMParameters, FEMResult, GEOMETRIES, exportCsv, nodeId, solveFEM } from "@/lib/fem";

type CompareRow = { label:string; flux:number; area:number };
const fmt=(v:number,d=3)=>Number.isFinite(v)?v.toLocaleString("fr-FR",{maximumFractionDigits:d}):"—";
const unit=(v:number)=>fmt(v*1e12)+" pmol/s";
function color(c:number,bulk:number){const t=Math.max(0,Math.min(1,c/Math.max(bulk,1e-12)));return "hsl("+(224-171*t)+", 75%, "+(30+30*t)+"%)";}

function Volume({result,rotation}:{result:FEMResult|null;rotation:number}){
 const dots=useMemo(()=>{
  if(!result)return [];
  const points=result.mesh.points, step=Math.max(1,Math.floor(points.length/1800)),a=rotation*Math.PI/180;
  const cs=Math.cos(a),sn=Math.sin(a);
  return points.flatMap((p,i)=>{
   if(i%step!==0)return [];
   const x=p.x/BOX.lx-.5,y=p.y/BOX.ly-.5,z=p.z/BOX.lz-.5;
   const xr=x*cs-y*sn,yr=x*sn+y*cs;
   const px=310+(xr+.24*yr)*440,py=225+(-.35*yr-.8*z)*300;
   return [{id:i,x:px,y:py,d:yr,c:result.concentrations[i]}];
  }).sort((a,b)=>b.d-a.d);
 },[result,rotation]);
 return <svg viewBox="0 0 620 460" role="img" aria-label="Projection interactive du champ de concentration en trois dimensions">
   <defs><pattern id="fine" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#2e4c65" opacity=".22"/></pattern></defs>
   <rect width="620" height="460" fill="url(#fine)"/>
   {!result?<text x="310" y="220" fill="#a8bdd4" textAnchor="middle">Calcul du champ 3D…</text>:<>
     <text x="24" y="35" fill="#8ba7bf" fontSize="12">ÉCHANTILLONNAGE DES NOEUDS • COLORATION C(x,y,z)</text>
     {dots.map(p=><circle key={p.id} cx={p.x} cy={p.y} r="3.8" fill={color(p.c,result.params.bulkConcentration)} opacity=".84"/>)}
     <text x="24" y="430" fill="#79decf" fontSize="12">{fmt(result.mesh.tetrahedra.length,0)} éléments tétraédriques</text>
     <text x="598" y="430" fill="#8ba7bf" fontSize="11" textAnchor="end">Projection nodale 3D</text>
   </>}
 </svg>;
}

export default function Page(){
 const [params,setParams]=useState<FEMParameters>(DEFAULTS);
 const [result,setResult]=useState<FEMResult|null>(null);
 const [comparison,setComparison]=useState<CompareRow[]>([]);
 const [busy,setBusy]=useState(true);
 const [compareBusy,setCompareBusy]=useState(false);
 const [error,setError]=useState("");
 const [rotation,setRotation]=useState(30);
 const [section,setSection]=useState(50);
 useEffect(()=>{
  const timer=window.setTimeout(()=>{
   try{const r=solveFEM(DEFAULTS);setResult(r);if(!r.converged)setError("Le solveur initial n'a pas convergé.");}
   catch(e){setError(String(e));}finally{setBusy(false)}
  },20);
  return ()=>window.clearTimeout(timer);
 },[]);
 function run(){
  setBusy(true);setError("");setComparison([]);
  window.setTimeout(()=>{
   try{const r=solveFEM(params);if(!r.converged)throw Error("Le solveur n'a pas convergé.");setResult(r)}
   catch(e){setError(String(e))}finally{setBusy(false)}
  },25);
 }
 function compare(){
  setCompareBusy(true);setError("");
  window.setTimeout(()=>{
   try{
    const rows=GEOMETRIES.map(g=>{
     const r=solveFEM({...params,geometry:g.value});
     if(!r.converged)throw Error("Échec pour "+g.label);
     return {label:g.label,flux:r.totalFluxMolS,area:r.electrodeAreaM2};
    });
    setComparison(rows);
   }catch(e){setError(String(e))}finally{setCompareBusy(false)}
  },25);
 }
 function download(){
  if(!result)return;
  const blob=new Blob([exportCsv(result)],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="fieldlab_"+result.params.geometry+".csv";a.click();URL.revokeObjectURL(url);
 }
 const stale=result?JSON.stringify(params)!==JSON.stringify(result.params):false;
 const mesh=result?.mesh,iz=mesh?Math.round(section*mesh.nz/100):0;
 const maxFlux=Math.max(0,...comparison.map(c=>c.flux));
 return <main className="frame">
  <div className="topline"><div className="logo"><em>◈</em> CO₂ FIELDLAB</div><span className="chip">MEF 3D · RECHERCHE NUMÉRIQUE · V0.1</span></div>
  <section className="hero"><div><div className="eyebrow">PLATEFORME SCIENTIFIQUE INTERACTIVE</div>
   <h1>Simulation du transport <span>du CO₂</span></h1>
   <p>Influence de la géométrie d’une électrode sur le flux diffusif. Calcul réel par éléments finis P1 tétraédriques, directement dans le navigateur.</p>
  </div><div className="pill">● {busy?"Calcul en cours":error?"Vérifier le calcul":"Solveur prêt"}</div></section>
  <div className="layout">
   <section className="panel"><h2>01 · Paramètres physiques</h2>
    <fieldset><div className="label"><label>Géométrie de l’électrode</label></div>
     <div className="options">{GEOMETRIES.map(g=><button className={"option "+(params.geometry===g.value?"selected":"")} key={g.value} onClick={()=>setParams(p=>({...p,geometry:g.value}))}>{g.label}</button>)}</div>
    </fieldset>
    <div className="label"><label htmlFor="diffusion">Diffusivité D</label><span>m²/s</span></div>
    <select id="diffusion" value={params.diffusion} onChange={e=>setParams(p=>({...p,diffusion:Number(e.target.value)}))}>
     {[1e-9,1.5e-9,2e-9,2.5e-9,3e-9].map(n=><option key={n} value={n}>{n.toExponential(1)}</option>)}
    </select>
    <div className="label"><label htmlFor="reaction">Réactivité k</label><span>m/s</span></div>
    <select id="reaction" value={params.reaction} onChange={e=>setParams(p=>({...p,reaction:Number(e.target.value)}))}>
     {[0,1e-6,2e-6,5e-6,1e-5,2e-5,5e-5].map(n=><option key={n} value={n}>{n.toExponential(1)}</option>)}
    </select>
    <div className="label"><label htmlFor="bulk">Concentration en haut</label><span>mol/m³</span></div>
    <input id="bulk" type="number" min="0.01" step="0.1" value={params.bulkConcentration} onChange={e=>setParams(p=>({...p,bulkConcentration:Number(e.target.value)}))}/>
    <div className="label"><label htmlFor="resolution">Résolution du maillage</label><span>{params.resolution} × {params.resolution}</span></div>
    <input id="resolution" type="range" min="6" max="18" step="2" value={params.resolution} onChange={e=>setParams(p=>({...p,resolution:Number(e.target.value)}))}/>
    <button className="btn" onClick={run} disabled={busy||compareBusy}>{busy?"Calcul en cours…":"▶ Lancer la simulation"}</button>
    {stale?<p className="stale">Paramètres modifiés : relance le calcul.</p>:null}
    <p className="small">Domaine : 10 × 10 × 4 mm · conditions de Robin et Dirichlet.</p>
    <div className="formula">−∇ · (D∇C) = 0</div>
   </section>
   <section className="panel viz"><div className="vizbar"><h2 style={{margin:0}}>02 · Concentration 3D</h2><button className="rotate" onClick={()=>setRotation(a=>(a+30)%360)}>↻ Tourner</button></div>
    <Volume result={result} rotation={rotation}/>
    <div className="colorbar"/><div className="scale"><span>Faible concentration</span><span>{fmt(result?.params.bulkConcentration??1)} mol/m³</span></div>
    <p className="small">Représentation des concentrations nodales après résolution MEF. Rotation par pas de 30°.</p>
   </section>
   <section className="panel metrics"><h2>03 · Résultats numériques</h2>
    <div className="metric"><span>FLUX TOTAL DE CO₂</span><div className="value">{result?fmt(result.totalFluxMolS*1e12):"—"}<small>pmol/s</small></div></div>
    <div className="grid2">
     <div className="metric"><span>AIRE ACTIVE</span><div className="value">{result?fmt(result.electrodeAreaM2*1e6,2):"—"}<small>mm²</small></div></div>
     <div className="metric"><span>CONC. MIN</span><div className="value">{result?fmt(result.minConcentration):"—"}<small>mol/m³</small></div></div>
    </div>
    <p className="small">Coupe horizontale : z = {fmt(section*BOX.lz*1e3/100,2)} mm</p>
    <input type="range" value={section} min="0" max="100" onChange={e=>setSection(Number(e.target.value))}/>
    {mesh&&result?<div className="slice" style={{gridTemplateColumns:"repeat("+(mesh.nx+1)+",1fr)"}}>
     {Array.from({length:(mesh.nx+1)*(mesh.ny+1)},(_,id)=>{
      const j=mesh.ny-Math.floor(id/(mesh.nx+1)),i=id%(mesh.nx+1);
      const c=result.concentrations[nodeId(i,j,iz,mesh.nx,mesh.ny)];
      return <div key={id} title={fmt(c,4)+" mol/m³"} style={{background:color(c,result.params.bulkConcentration)}}/>;
     })}
    </div>:null}
    <p className="small">{result?fmt(result.mesh.tetrahedra.length,0):"—"} tétraèdres · {result?.iterations??"—"} itérations · {result?fmt(result.relativeResidual,9):"—"} résidu</p>
    <button className="btn btn-secondary" onClick={download} disabled={!result}>↓ Exporter CSV</button>
    {error?<p role="alert" className="error">{error}</p>:null}
   </section>
  </div>
  <div className="bottom">
   <section className="panel"><div className="vizbar"><h2 style={{margin:0}}>04 · Comparaison des électrodes</h2><button className="rotate" disabled={busy||compareBusy} onClick={compare}>{compareBusy?"Calcul…":"Comparer les 3 →"}</button></div>
    <p className="note">Flux total avec les mêmes conditions et surfaces nominalement comparables. L’aire maillée est explicitement affichée.</p>
    {comparison.length?<div className="bars">{comparison.map(c=><div className="bar" key={c.label}><strong>{c.label}</strong><div className="track"><div className="fill" style={{width:(maxFlux>0?100*c.flux/maxFlux:0)+"%"}}/></div><div>{unit(c.flux)}<div className="small">{fmt(c.area*1e6,2)} mm²</div></div></div>)}</div>:<p className="small">Clique sur « Comparer les 3 » pour exécuter les trois calculs MEF.</p>}
    {comparison.length?<p className="note">Le flux surfacique Q/A et la convergence du maillage doivent être étudiés pour conclure rigoureusement.</p>:null}
   </section>
   <section className="panel"><h2>05 · Méthodologie</h2>
    <p className="note">Diffusion stationnaire → formulation faible → assemblage P1 tétraédrique → conditions de Robin → gradient conjugué préconditionné → intégrale du flux à l’électrode.</p>
    <div className="formula">Q = ∫Γₑ k C dΓ</div>
    <p className="note">Modèle simplifié : patch réactif plan, sans convection, migration ionique ni cinétique électrochimique complète. Résultats exploratoires.</p>
   </section>
  </div>
  <footer className="foot"><span>CO₂ FieldLab · Projet universitaire MEF</span><span>Next.js · TypeScript · Vercel</span></footer>
 </main>;
}
