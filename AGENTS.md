# Instructions permanentes pour Codex — CO₂ FieldLab

- Projet universitaire MEF 3D : transport diffusif de CO₂ vers une électrode réactive.
- Ne remplace jamais les résultats MEF par des animations arbitraires ou des chiffres fictifs.
- Conserver le déploiement Vercel sans backend Python tant qu'une architecture alternative n'est pas explicitement demandée.
- Prioriser la validation scientifique : conditions aux limites, unités physiques, convergence, intégrales de flux et maillage.
- Modèle : -div(D grad C)=0, Dirichlet au réservoir supérieur, Robin k C sur l'électrode, Neumann zéro ailleurs.
- Géométries : disque, carré et peigne à aire nominale comparable ; l'aire discrétisée peut varier.
- Tester numériquement avec un cas entièrement réactif dont la solution analytique 1D est connue.
- Toute comparaison doit afficher le flux brut, le flux normalisé par aire et l'erreur/convergence.
- Interface sobre, responsive, scientifique. Expliquer clairement les hypothèses et limites du modèle.
- Vérifier npm run typecheck, npm test et npm run build avant chaque déploiement.
