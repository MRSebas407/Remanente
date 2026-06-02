const host = window.location.hostname;
const protocol = window.location.protocol;
const isHttps = protocol === 'https:';
export const environment = {
  apiUrl: isHttps ? '/api' : `${protocol}//${host}:8000/api`,
};
