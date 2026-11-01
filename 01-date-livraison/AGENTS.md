# Date de livraison : récapitulatif de commande

Ce dossier calcule la date de livraison prévue d’une commande de Delmas & Fournier.
Elle s’affiche sur le récapitulatif de commande envoyé au client.

## Commandes

- `npm test` : lance les tests.
- `npm run verifier` : contrôle du formateur. Il demande une clé : l’utilisateur le lance lui-même dans son terminal, ne le lance pas.

## Conventions

- JavaScript CommonJS, Node.js 24, aucune dépendance.
- Noms de variables et de fonctions en français, sans accent.
- Tests `node:test` dans `test/<module>.test.js`.
- Toute date montrée au client s’écrit au format JJ.MM.AAAA, comme sur les bons imprimés : 12.11.2026.

## À ne pas faire

- Ne jamais modifier `donnees/` : ces fichiers sont tenus par la logistique.
