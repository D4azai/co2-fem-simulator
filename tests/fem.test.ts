import test from "node:test";
import assert from "node:assert/strict";
import { BOX, DEFAULTS, electrodeContains, generateMesh, solveFEM } from "../src/lib/fem";

test("tetrahedral grid has consistent element counts",()=>{
 const m=generateMesh(8);
 assert.equal(m.points.length,(m.nx+1)*(m.ny+1)*(m.nz+1));
 assert.equal(m.tetrahedra.length,6*m.nx*m.ny*m.nz);
 assert.equal(m.bottomFaces.length,2*m.nx*m.ny);
});

test("electrode shape predicates",()=>{
 assert.equal(electrodeContains(.005,.005,"circle"),true);
 assert.equal(electrodeContains(.009,.009,"circle"),false);
 assert.equal(electrodeContains(.005,.005,"square"),true);
 assert.equal(electrodeContains(.0027,.00275,"comb"),true);
});

test("fully reactive bottom agrees with analytic 1D Robin solution",()=>{
 const p={...DEFAULTS,geometry:"full" as const,resolution:8};
 const r=solveFEM(p);
 const expected=BOX.lx*BOX.ly*p.diffusion*p.bulkConcentration/(BOX.lz+p.diffusion/p.reaction);
 assert.ok(r.converged);
 assert.ok(Math.abs(r.totalFluxMolS/expected-1)<.004,"numeric flux vs analytic flux");
 assert.ok(r.minConcentration>=-1e-7);
 assert.ok(r.maxConcentration<=p.bulkConcentration+1e-7);
});

test("zero reaction yields uniform concentration and zero flux",()=>{
 const p={...DEFAULTS,geometry:"square" as const,reaction:0,resolution:8};
 const r=solveFEM(p);
 assert.ok(r.converged);
 assert.equal(r.totalFluxMolS,0);
 assert.ok(Math.abs(r.minConcentration-p.bulkConcentration)<1e-6);
});

test("greater surface reaction increases integrated flux",()=>{
 const a=solveFEM({...DEFAULTS,reaction:2e-6,resolution:8});
 const b=solveFEM({...DEFAULTS,reaction:1e-5,resolution:8});
 assert.ok(a.converged&&b.converged);
 assert.ok(b.totalFluxMolS>a.totalFluxMolS);
});
