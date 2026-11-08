# CO₂ FieldLab — Simulateur 3D par éléments finis

Application scientifique interactive de diffusion stationnaire du CO₂ vers une électrode réactive. **Next.js + React + TypeScript**, déployable sur Vercel comme site statique (aucun backend, aucune base de données).

## Démarrer

Prérequis : Node.js 22+ et npm.

    npm install
    npm run dev

Puis ouvrir http://localhost:3000.

    npm run typecheck
    npm test
    npm run build

## Fonctionnalités

- Géométries de patch réactif : disque, carré, peigne, sur la face inférieure d'un domaine 3D.
- Réglages physiques D, k, concentration du réservoir, résolution du maillage.
- Calcul **réel** d'un problème éléments finis 3D P1 tétraédriques (pas de flux simulés/fictifs).
- Condition Dirichlet sur z = Lz, condition Robin sur le patch de l'électrode, flux nul ailleurs.
- Visualisation nodale 3D et coupe de concentration, comparaison des électrodes, export CSV.
- Validation sur une solution analytique 1D et test sans réaction.
- Instructions Codex dans AGENTS.md et docs/CODEX_PROMPT.md.

## Modèle

Dans le domaine rectangulaire de taille 10 × 10 × 4 mm :

- −div(D grad C) = 0
- C(z=Lz) = C_bulk
- −D grad(C) · n = k C sur Γ_e (électrode au fond)
- −D grad(C) · n = 0 sur les autres faces

Forme faible après division par D :

    ∫Ω grad C · grad v dΩ + (k/D) ∫Γe C v dΓ = 0

Le flux sortant est Q = ∫Γe k C dΓ. On utilise des éléments finis P1 tétraédriques, une matrice creuse et la méthode du gradient conjugué avec préconditionnement diagonal.

Les valeurs D=2×10⁻⁹ m²/s, k=1×10⁻⁵ m/s et C_bulk=1 mol/m³ sont illustratives. L'électrode est une **surface réactive plane**, pas une géométrie métallique 3D volumique. Convection, électromigration et réactions chimiques détaillées ne sont pas représentées. Les surfaces effectivement maillées varient selon la forme et la résolution : il faut comparer Q/A et faire une convergence de maillage avant toute interprétation scientifique forte.

## Vercel

Sur https://vercel.com/new, importer D4azai/co2-fem-simulator. Framework Next.js, Root Directory ./, sans variables d'environnement. Le build utilise next.config.ts avec output: "export".

## Organisation

- src/lib/fem.ts — maillage, assemblage P1, Robin, solveur, flux et CSV.
- src/app/page.tsx — interface de simulation et graphiques.
- tests/fem.test.ts — tests du modèle.
- docs/CODEX_PROMPT.md — prompt pour continuer le projet dans PyCharm / Codex.

Ce projet est académique et expérimental, pas une prédiction validée d'une vraie cellule électrochimique.
