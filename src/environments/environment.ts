export const environment = {
  // Nginx in the frontend image proxies /api to the backend, so prod is same-origin (ADR-025).
  apiUrl: '/api',
};
