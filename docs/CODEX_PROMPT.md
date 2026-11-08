# Prompt de travail Codex — CO₂ FieldLab

Tu es un ingénieur full-stack senior et spécialiste des éléments finis. Le sujet académique est :

« Modélisation et simulation par éléments finis 3D du transport diffusif du CO₂ dans une cellule électrochimique : influence de la géométrie de l'électrode sur le flux de matière. »

Examine d'abord README.md, AGENTS.md et le solveur existant. Audite la formulation faible P1, la matrice de rigidité et Robin, les normales, les unités, le maillage et le calcul Q=∫Γe kC dΓ. Le solveur doit calculer des résultats réels : aucun graphique ou nombre fictif.

Objectifs prioritaires :
1. Vérifier l'installation, npm run typecheck, npm test et npm run build ; corriger les erreurs.
2. Améliorer la visualisation de concentration (WebGL/Three.js ou Plotly, avec rotation, zoom, coupes et maillage tétraédrique).
3. Comparer cercle, carré et peigne à surfaces contrôlées et différentes résolutions ; afficher flux Q et Q/A.
4. Ajouter l'étude de convergence h, un tableau d'erreurs, un cas analytique 1D et des tests d'assemblage.
5. Fournir une section méthodologique : domaine, PDE, conditions limites, formulation faible, discrétisation, algorithme.
6. Ajouter exports CSV et figures pour la soutenance.
7. Maintenir le déploiement sur Vercel. Si le solveur devient trop lourd pour le thread UI, utiliser un Web Worker.
8. Actualiser README et écrire un changelog des corrections scientifiques.

Paramètres de démonstration : domaine 10×10×4 mm, D=2e-9 m²/s, k=1e-5 m/s, C_bulk=1 mol/m³. Insister qu'il s'agit d'une étude paramétrique simplifiée de transport diffusif, pas d'un modèle électrochimique complet. Les géométries sont des patches réactifs sur une frontière plane.

Travaille directement dans le dépôt, par étapes courtes et reproductibles. Ne pas déclarer un test réussi sans l'avoir exécuté.