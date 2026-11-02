# Relevé d’incident : copie publiée de D&F Commandes

## Ce qui a fui

| Fuite | Fichier | Commit | Encore présent ? |
|---|---|---|---|
| clé de l’API du transporteur (dftr_live_…) | .env | 1ddf3b0 | non, lisible avec git show 1ddf3b0:.env |
| clé de l’API du transporteur, même valeur | src/config.js | 91f0955 | oui |

## À révoquer en premier

La clé de l’API du transporteur, chez le transporteur : elle reste lisible dans l’historique, même retirée du code.
