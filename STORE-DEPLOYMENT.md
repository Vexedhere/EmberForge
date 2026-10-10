# Mythical Studios store deployment (Tebex)

The store's static pages can be hosted on GitHub Pages, but the Tebex package list and checkout need server-side functions. The repository includes Netlify Functions in `netlify/functions/` and a `netlify.toml` configuration.

## One-time setup

1. Create a site in Netlify and connect it to this repository, or create an empty Netlify site for deployment.
2. In the Netlify site settings, add the environment variable `TEBEX_WEBSTORE_TOKEN` using your Tebex **webstore/headless account identifier token**. Do not put the token in HTML, JavaScript, commits, or public GitHub variables.
3. In GitHub, open **Settings → Secrets and variables → Actions** and create:
   - `NETLIFY_AUTH_TOKEN`: a Netlify personal access token.
   - `NETLIFY_SITE_ID`: the Netlify site ID (Site configuration → General → Site details).
4. Run the **Deploy Mythical Studios store to Netlify** workflow from **Actions**, or push a change under `store/` or `netlify/`.
5. In Netlify, confirm the deployed functions are available at:
   - `/.netlify/functions/tebex-packages`
   - `/.netlify/functions/tebex-checkout`
6. Test the package endpoint. It should return JSON containing a `packages` array. If it returns `503`, the Tebex token is missing. If it returns `502`, check the token and the Tebex API response.
7. To use the production domain, configure the domain/DNS in Netlify. Do not change the current domain's DNS until the Netlify deployment and test checkout both work.

## Important

- Keep `TEBEX_WEBSTORE_TOKEN` in Netlify environment settings only.
- The current front-end tries `https://api.mythicalstudios.online` first, then Netlify's same-origin function path. If the store remains on GitHub Pages, the Netlify function path on that GitHub Pages origin will not work; either serve the store from Netlify with the domain configured there, or configure a separate API subdomain and update the front-end endpoints to that deployed API.
- A successful catalogue response is not proof that purchases work. Run a real test checkout in Tebex before announcing the store.
