/**
 * Stationary P1 tetrahedral FEM for the 3D diffusion equation.
 * -div(D grad C) = 0, top Dirichlet, active bottom Robin, all others Neumann=0.
 * Units are SI: positions m, D m²/s, k m/s, C mol/m³, integrated flux mol/s.
 */
export type Geometry = "circle" | "square" | "comb" | "full";
export type Point3 = { x: number; y: number; z: number };
export type Tetra = [number,number,number,number];
export type Triangle = [number,number,number];
export type Mesh = { points: Point3[]; tetrahedra: Tetra[]; bottomFaces: Triangle[]; nx:number; ny:number; nz:number };
export type FEMParameters = { geometry:Geometry; diffusion:number; reaction:number; bulkConcentration:number; resolution:number };
export type FEMResult = {
 params:FEMParameters; mesh:Mesh; concentrations:number[]; electrodeTriangles:Triangle[];
 electrodeAreaM2:number; totalFluxMolS:number; averageElectrodeConcentration:number;
 minConcentration:number; maxConcentration:number; iterations:number; relativeResidual:number;
 converged:boolean; solveMs:number;
};
export const BOX={lx:0.01,ly:0.01,lz:0.004} as const;
export const DEFAULTS:FEMParameters={geometry:"circle",diffusion:2e-9,reaction:1e-5,bulkConcentration:1,resolution:10};
export const GEOMETRIES:{value:Exclude<Geometry,"full">;label:string}[]=[
 {value:"circle",label:"Circulaire"},{value:"square",label:"Carrée"},{value:"comb",label:"En peigne"}
];
export function nodeId(i:number,j:number,k:number,nx:number,ny:number):number {
 return (k*(ny+1)+j)*(nx+1)+i;
}
export function generateMesh(resolution:number):Mesh {
 const nx=Math.max(6,Math.min(20,Math.round(resolution))),ny=nx,nz=Math.max(4,Math.round(nx*BOX.lz/BOX.lx));
 const points:Point3[]=[],tetrahedra:Tetra[]=[],bottomFaces:Triangle[]=[];
 for(let k=0;k<=nz;k++)for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++)
  points.push({x:i*BOX.lx/nx,y:j*BOX.ly/ny,z:k*BOX.lz/nz});
 for(let k=0;k<nz;k++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
  const a=nodeId(i,j,k,nx,ny),b=nodeId(i+1,j,k,nx,ny),c=nodeId(i,j+1,k,nx,ny),
   d=nodeId(i+1,j+1,k,nx,ny),e=nodeId(i,j,k+1,nx,ny),f=nodeId(i+1,j,k+1,nx,ny),
   g=nodeId(i,j+1,k+1,nx,ny),h=nodeId(i+1,j+1,k+1,nx,ny);
  tetrahedra.push([a,b,d,h],[a,d,c,h],[a,c,g,h],[a,g,e,h],[a,e,f,h],[a,f,b,h]);
  if(k===0)bottomFaces.push([a,b,d],[a,d,c]);
 }
 return {points,tetrahedra,bottomFaces,nx,ny,nz};
}
export function electrodeContains(x:number,y:number,g:Geometry):boolean{
 const X=x*1000,Y=y*1000;
 if(g==="full")return true;
 if(g==="circle")return (X-5)**2+(Y-5)**2<=16/Math.PI;
 if(g==="square")return Math.abs(X-5)<=2&&Math.abs(Y-5)<=2;
 const spine=X>=2.3&&X<=3.2&&Y>=2.3&&Y<=7.7;
 const finger=X>=3.2&&X<=7.4&&[2.75,4.15,5.55,6.95].some(cy=>Math.abs(Y-cy)<=0.325);
 return spine||finger;
}
const sub=(a:Point3,b:Point3):Point3=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const dot=(a:Point3,b:Point3)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross=(a:Point3,b:Point3):Point3=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const scale=(a:Point3,s:number):Point3=>({x:a.x*s,y:a.y*s,z:a.z*s});
const norm=(a:Point3)=>Math.sqrt(dot(a,a));
function triangleArea(a:Point3,b:Point3,c:Point3){return norm(cross(sub(b,a),sub(c,a)))/2}
function stiffness(v:Point3[]):number[][]{
 const e1=sub(v[1],v[0]),e2=sub(v[2],v[0]),e3=sub(v[3],v[0]);
 const det=dot(e1,cross(e2,e3)),volume=Math.abs(det)/6;
 if(volume<1e-25)throw Error("Tétraèdre dégénéré.");
 const g1=scale(cross(e2,e3),1/det),g2=scale(cross(e3,e1),1/det),g3=scale(cross(e1,e2),1/det);
 const g0=scale({x:g1.x+g2.x+g3.x,y:g1.y+g2.y+g3.y,z:g1.z+g2.z+g3.z},-1);
 const grad=[g0,g1,g2,g3];
 return grad.map(a=>grad.map(b=>volume*dot(a,b)));
}
function solveSparse(rows:Map<number,number>[],fixed:Uint8Array,cTop:number){
 const index=new Int32Array(rows.length).fill(-1);let count=0;
 for(let i=0;i<index.length;i++)if(!fixed[i])index[i]=count++;
 const A:{j:number;v:number}[][]=new Array(count),diag=new Float64Array(count),b=new Float64Array(count);
 for(let i=0;i<rows.length;i++)if(!fixed[i]){
  const ii=index[i],rr:{j:number;v:number}[]=[];
  for(const [j,v] of rows[i]){
   if(fixed[j])b[ii]-=v*cTop;
   else rr.push({j:index[j],v});
   if(j===i)diag[ii]=v;
  }
  A[ii]=rr;
  if(diag[ii]<=0)throw Error("Matrice MEF non définie positive.");
 }
 const x=new Float64Array(count),r=b.slice(),z=new Float64Array(count),p=new Float64Array(count),ap=new Float64Array(count);
 let normB=0,rz=0;
 for(let i=0;i<count;i++){normB+=b[i]*b[i];z[i]=p[i]=r[i]/diag[i];rz+=r[i]*z[i]}
 normB=Math.sqrt(normB);
 let residual=normB===0?0:1,iter=0,converged=normB===0;
 for(;iter<2500&&!converged;iter++){
  let pAp=0;
  for(let i=0;i<count;i++){let v=0;for(const e of A[i])v+=e.v*p[e.j];ap[i]=v;pAp+=p[i]*v}
  if(pAp<=0||!Number.isFinite(pAp))break;
  const alpha=rz/pAp;let r2=0;
  for(let i=0;i<count;i++){x[i]+=alpha*p[i];r[i]-=alpha*ap[i];r2+=r[i]*r[i]}
  residual=Math.sqrt(r2)/normB;
  if(residual<1e-10){converged=true;iter++;break}
  let nextRz=0;
  for(let i=0;i<count;i++){z[i]=r[i]/diag[i];nextRz+=r[i]*z[i]}
  const beta=nextRz/rz;
  for(let i=0;i<count;i++)p[i]=z[i]+beta*p[i];
  rz=nextRz;
 }
 const values=new Array<number>(rows.length);
 for(let i=0;i<values.length;i++)values[i]=fixed[i]?cTop:x[index[i]];
 return {values,iterations:iter,relativeResidual:residual,converged};
}
export function solveFEM(params:FEMParameters):FEMResult{
 const begin=performance.now();
 if(!(params.diffusion>0&&params.reaction>=0&&params.bulkConcentration>0))throw Error("Paramètres physiques invalides.");
 const mesh=generateMesh(params.resolution);
 const {points,tetrahedra,bottomFaces,nx,ny,nz}=mesh;
 const fixed=new Uint8Array(points.length);
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++)fixed[nodeId(i,j,nz,nx,ny)]=1;
 const rows=Array.from({length:points.length},()=>new Map<number,number>());
 const add=(i:number,j:number,v:number)=>rows[i].set(j,(rows[i].get(j)??0)+v);
 for(const tet of tetrahedra){
  const ke=stiffness(tet.map(i=>points[i]));
  for(let a=0;a<4;a++)for(let b=0;b<4;b++)add(tet[a],tet[b],ke[a][b]);
 }
 const active:Triangle[]=[];let area=0;
 const robin=params.reaction/params.diffusion;
 for(const face of bottomFaces){
  const v=face.map(i=>points[i]),xc=(v[0].x+v[1].x+v[2].x)/3,yc=(v[0].y+v[1].y+v[2].y)/3;
  if(!electrodeContains(xc,yc,params.geometry))continue;
  active.push(face);
  const a=triangleArea(v[0],v[1],v[2]);area+=a;
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)
   add(face[i],face[j],robin*a*(i===j?2:1)/12);
 }
 if(!active.length)throw Error("Patch actif non résolu : augmente la résolution.");
 const r=solveSparse(rows,fixed,params.bulkConcentration);
 let flux=0,cWeight=0;
 for(const f of active){
  const a=triangleArea(points[f[0]],points[f[1]],points[f[2]]);
  const c=(r.values[f[0]]+r.values[f[1]]+r.values[f[2]])/3;
  flux+=params.reaction*c*a;cWeight+=c*a;
 }
 return {params:{...params},mesh,concentrations:r.values,electrodeTriangles:active,
  electrodeAreaM2:area,totalFluxMolS:flux,averageElectrodeConcentration:cWeight/area,
  minConcentration:Math.min(...r.values),maxConcentration:Math.max(...r.values),
  iterations:r.iterations,relativeResidual:r.relativeResidual,converged:r.converged,solveMs:performance.now()-begin};
}
export function exportCsv(r:FEMResult){
 return "x_m,y_m,z_m,concentration_mol_m3\n"+
 r.mesh.points.map((p,i)=>[p.x,p.y,p.z,r.concentrations[i]].join(",")).join("\n");
}
