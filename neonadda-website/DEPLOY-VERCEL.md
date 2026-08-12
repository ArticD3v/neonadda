# Deploy Neon Adda to Vercel

The site is a plain static site — no build step — so Vercel needs zero configuration. It just uploads the folder and serves it. This whole file is copy-pasteable into **PowerShell** (Start menu → type "PowerShell" → Enter).

---

## Step 1 — One-time setup (skip if you've done it before)

Check you have Node.js (needed to run the Vercel command):

```
node -v
```

If that says "not recognized", install the LTS version from https://nodejs.org and reopen PowerShell.

Log in to Vercel once — your browser opens, approve, done:

```
npx vercel login
```

---

## Step 2 — Deploy

```
cd "C:\Users\syedb\AppData\Local\Claude-3p\local-agent-mode-sessions\96a8076d\00000000\local_6b8b0467-b10f-43d3-8565-0caa2abc78c9\outputs\neonadda"
npx vercel --prod --yes
```

What happens on the **first** run:
1. npx asks `Ok to proceed?` — press **y** (this installs the CLI, a few seconds).
2. If it asks about project settings, choose **Other** and accept the defaults.
3. At the end it prints a URL like `https://neonadda-xxxxx.vercel.app` — **that's the live site**. Open it, then open it again on your phone.

Every run after that: just the two commands above. Each deploy overwrites the same URL, so you can send the client one link and keep updating it.

---

## Updating after you change something

Re-run Step 2. Nothing else.

## Taking it down later

`npx vercel remove neonadda` — or delete the project at vercel.com/dashboard.

---

## Notes

- The free tier is more than enough for showing the client.
- If he later wants his own domain (e.g. `www.neonadda.com`), add it under Project → Settings → Domains in the Vercel dashboard.
- If you'd rather not touch the CLI at all: app.netlify.com/drop lets you drag the `neonadda` folder in with no login and get a URL in ten seconds. Different site, same demo.
