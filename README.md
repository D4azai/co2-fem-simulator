# CO₂ FieldLab — Simulateur MEF 3D

Projet de méthode des éléments finis : diffusion stationnaire du CO₂ dans une cellule électrochimique, comparaison des géométries d'électrode.

Application Next.js/TypeScript prévue pour un déploiement statique sur Vercel. Code scientifique, interface et consignes Codex ajoutés dans ce dépôt.

## Démarrage

```bash
npm install
npm run dev
```

Ouvrir http://localhost:3000. Vérifier avec `npm test` et `npm run build` avant déploiement.

Le modèle inclut un maillage 3D tétraédrique, diffusion stationnaire et flux réactif Robin. Hypothèses : pas de convection, pas de migration ni de chimie réactionnelle détaillée ; les paramètres sont illustratifs.
