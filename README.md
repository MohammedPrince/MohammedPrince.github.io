# mohammedprince.github.io

Personal site of Mohammed Ahmed. Static pages on GitHub Pages: no server, no database.

| Path | What it is |
| --- | --- |
| `content/site.json` | All text, links and image paths. This is the "database". |
| `src/render.js`, `src/style.css` | Template and design. |
| `admin/` | Site editor (a page in the browser). |
| `build.mjs` | Rebuilds the pages on your PC. |
| `index.html`, `404.html`, `blog/`, `sitemap.xml`, `robots.txt`, `site.webmanifest` | Generated. Do not edit by hand. |

## Update the site in the browser

1. Open <https://mohammedprince.github.io/admin/>.
2. Sign in with your username and password. The first time on each browser, also paste a fine-grained GitHub
   token for this repository with **Contents: Read and write** and nothing else. The token is encrypted with
   your password and kept in that browser only; the repository holds no password and no token.
3. Edit, **Preview**, **Publish**. Publishing makes one commit with the JSON, the rebuilt pages and any new images.
   The live site updates in about a minute.

Uploaded images are resized and converted to WebP for you.

Set up only browsers you own, and give the token an expiry date.

The visitor counter is explained in `visitor-counter/README.md`.

## Update the site on your PC

```
git pull
# edit content/site.json, src/style.css or src/render.js
node build.mjs
git add -A && git commit -m "Update site" && git push
```

Run `git pull` first whenever you have published from the browser.

## Licences

Font: Plus Jakarta Sans, SIL Open Font License (`assets/fonts/OFL.txt`).
