const apiTarget = process.env.API_TARGET;
if (!apiTarget) {
  throw new Error('Configure API_TARGET com a origem HTTPS da API na Vercel.');
}
const apiUrl = new URL(apiTarget);

if (apiUrl.protocol !== 'https:' || apiUrl.username || apiUrl.password ||
    apiUrl.pathname !== '/' || apiUrl.search || apiUrl.hash) {
  throw new Error('Configure API_TARGET com a origem HTTPS da API na Vercel.');
}

export const config = {
  rewrites: [
    { source: '/api/:path*', destination: `${apiUrl.origin}/api/:path*` },
  ],
};
