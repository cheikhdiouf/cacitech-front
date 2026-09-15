export const environment = {
  production: false,
  // Chemins relatifs (et non l'URL absolue) : passent par le proxy du dev-server
  // (proxy.conf.json), qui relaie la requête côté serveur vers test-backend.cacitech.com —
  // le navigateur ne voit qu'un appel same-origin vers localhost:4200, donc plus de blocage
  // CORS en développement. En production, le backend doit autoriser l'origine du front
  // (voir environment.prod.ts).
  // Endpoints d'authentification, sous /api/ (voir la spec OpenAPI).
  apiUrl: '/api',
  // Reste de l'API métier (organigramme, profil, parametrage, ...), à la racine du backend.
  backendUrl: ''
};
