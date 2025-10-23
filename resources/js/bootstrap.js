import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
// CSRF para requisições POST/PUT/DELETE
const token = document.querySelector('meta[name="csrf-token"]');
if (token && token.getAttribute('content')) {
  window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.getAttribute('content');
}
