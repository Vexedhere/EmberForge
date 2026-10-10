# Mythical Studios Store — dynamic admin + Discord

The storefront is now branded **Mythical Studios**.

## What is implemented

- Main store is the shopping home page.
- Left categories: MC Ranks, Schematics, Server Development.
- Category URLs:
  - /store/categories/ranks/
  - /store/categories/schematic/
  - /store/categories/development/
- Admin panel at /admin/.
- Admin can add:
  - category
  - title
  - image
  - price
  - product/schematic/file
  - description
  - feature list
- The API writes the uploaded assets and catalogue into this GitHub repository.
- The storefront reads the live catalogue from the API, so new products can appear without editing index.html.
- Discord announcement bridge posts @everyone in 〔📢〕𝐀𝐍𝐍𝐎𝐔𝐍𝐂𝐄𝐌𝐄𝐍𝐓𝐒 when a product is published.

## Important hosting step

GitHub Pages is static hosting. The Node API therefore needs to be deployed separately (for example on your preferred Node hosting provider) and exposed as:

https://api.mythicalstudios.online

Set the admin page's API URL to that address if it differs.

## Existing bot

Your existing bot can keep all of its current automod, economy, moderation, application and ticket functions.

After the Discord Client is created, add:

require("./server/discord-store-bridge")(client);

Then keep your existing client.login(...) exactly as it is.

The bridge only adds the store announcement callback.

## Secrets

Do NOT commit the Discord bot token or GitHub token.

Use server environment variables:

ADMIN_CHETHAN_PASSWORD=<set-a-new-secret>
ADMIN_VIJAY_PASSWORD=<set-a-new-secret>
GITHUB_TOKEN=<GitHub fine-grained token with repository Contents read/write>
DISCORD_BOT_TOKEN=<your rotated Discord bot token>
DISCORD_GUILD_ID=<server ID>
STORE_URL=https://store.mythicalstudios.online/

The Discord bot needs permission to send messages and mention @everyone in the announcement channel.

## Security

The bot token pasted into chat should be rotated in the Discord Developer Portal before deploying this system. Only the rotated token should be stored as an environment secret.
