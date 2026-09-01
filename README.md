# Prix carburant

PWA personnelle de comparaison des prix de carburant en France et en Allemagne, réalisée avec Vue 3, TypeScript, Vite, MapLibre GL, Tailwind CSS et DaisyUI.

## Démarrage

1. Copiez `.env.example` vers `.env.local`.
2. Ajoutez votre clé personnelle `VITE_TANKERKOENIG_API_KEY`.
3. Lancez `npm install`, puis `npm run dev`.

`npm run build` crée la version de production et son service worker PWA.

Le sélecteur **FR / DE** choisit la source de données. La France est prête à tester sans clé : le flux public officiel est téléchargé puis conservé 15 minutes en mémoire. L’Allemagne utilise Tankerkönig, avec une requête au plus toutes les 65 secondes et une clé personnelle obligatoire.

Une requête retourne Diesel, E5 et E10 pour que les changements de filtre soient instantanés.

Les prix sont fournis par [Tankerkönig](https://creativecommons.tankerkoenig.de/) sous licence CC BY 4.0.
