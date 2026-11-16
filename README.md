# Card Ledger

A static page that tracks the Platinum Visa, Gold Mastercard and BPI cards: next payment, monthly outlook through December 2028, and every instalment. No backend, no build step. Light and dark theme.

## Put it on GitHub Pages

1. On GitHub, create a new repository, for example `card-ledger`. (For a site at `https://<your-username>.github.io/` itself, name the repository `<your-username>.github.io`.)
2. Upload everything in this folder to the repository root (drag the files into the web page, or use git).
3. Open the repository's **Settings > Pages**, set **Source** to **Deploy from a branch**, pick the `main` branch and the `/ (root)` folder, then save.
4. After a minute the page is live at `https://<your-username>.github.io/card-ledger/`.

With git:

```bash
git init
git add .
git commit -m "Card Ledger"
git branch -M main
git remote add origin https://github.com/<your-username>/card-ledger.git
git push -u origin main
```

## Adding a purchase

All figures come from `data.js`. Add one entry to the `items` list, for example:

```js
{ id: "g-new", card: "gold", name: "New purchase", amount: 1500, first: "2026-12", count: 3, added: true }
```

- `card`: `platinum`, `gold` or `bpi`
- `first`: the first month it bills (`YYYY-MM`)
- `count`: number of monthly bills (1 for a one-time charge, add `once: true`)

Commit the change and GitHub Pages updates in about a minute.

Other settings in `data.js`: due days per card, credit limits, optional real balances (`actualBalance`) and payments that differ from "paid on the due date" (`paymentOverrides`).

## Privacy

GitHub Pages sites are public. Anyone with the link can read the amounts, merchants and limits shown here. The page has a `noindex` tag so search engines should skip it, but that is not protection. Card numbers are not in the page. Consider whether you want a public link, or keep the files private and open `index.html` from your computer.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure |
| `styles.css` | Light and dark themes |
| `app.js` | Calculations and page logic |
| `data.js` | Your cards, limits and purchases |
| `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-512.png`, `site.webmanifest` | Page icon and home-screen install |
