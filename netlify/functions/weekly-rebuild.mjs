// Netlify Scheduled Function: weekly site rebuild.
//
// The /writing page ranks posts by Cabin blog analytics at build time
// (src/utils/analytics.ts) and the writing list is pulled from the blog feed
// (src/content.config.ts). Those only refresh when the site rebuilds, so this
// runs on Netlify's cron once a week and triggers a fresh deploy by POSTing to
// this site's own build hook.
//
// One-time setup (all in Netlify, no GitHub):
//   1. Site configuration -> Build & deploy -> Build hooks -> "Add build hook"
//      (branch: main). Copy the generated URL.
//   2. Site configuration -> Environment variables -> add BUILD_HOOK_URL set to
//      that URL.
//
// Adjust the cadence via the schedule below, or trigger on demand from the
// Netlify UI (Functions -> weekly-rebuild) / `netlify functions:invoke`.

export const config = {
  schedule: '0 7 * * 1', // Mondays at 07:00 UTC (cron is always UTC)
};

export default async () => {
  const url = process.env.BUILD_HOOK_URL;
  if (!url) {
    return new Response('BUILD_HOOK_URL is not set; add it in Netlify env vars.', { status: 500 });
  }

  const res = await fetch(url, { method: 'POST', body: '{}' });
  if (!res.ok) {
    return new Response(`Build hook request failed: ${res.status} ${res.statusText}`, { status: 502 });
  }

  return new Response('Triggered Netlify build.');
};
