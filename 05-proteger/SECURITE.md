# Relevé d’incident : copie publiée de D&F Commandes

## Ce qui a fui

| Fuite | Fichier | Commit | Encore présent ? |
|---|---|---|---|
| DF_TRANSPORTEUR_API_KEY | .env | 1ddf3b0 | non |
| TRANSPORTEUR_API_KEY | src/config.js | 91f0955 | oui |

## À révoquer en premier

La clé de l’API du transporteur, chez le transporteur : retirée du code, elle reste lisible dans l’historique.
