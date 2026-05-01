# Jo's Cupcakes Production Deployment

This project is a Next.js 15 app intended to run on Capek-Web behind nginx with PM2 managing the Node.js process.

## Stack Summary

- Runtime: Node.js 20
- Framework: Next.js 15 App Router
- Process manager: PM2
- Reverse proxy: nginx
- External services: Supabase, Gmail SMTP, Stripe

## 1. Pre-deploy Checklist

Before deploying, make sure the local project is clean and passes the production build.

```bash
npm install
npm run build
```

This app should already build with:

- `next@15.5.15`
- `eslint-config-next@15.5.15`
- patched `postcss` via `overrides`

## 2. Production Environment Variables

Create a real `.env` on the server. Do not copy local test values into production.

Required variables for this app:

```env
NODE_ENV=production
PORT=3020

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

JO_EMAIL=
ADMIN_EMAIL_FROM=

GMAIL_USER=
GMAIL_APP_PASSWORD=

SITE_URL=https://your-domain.com

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

Notes:

- `PORT` is the internal app port only. Good Capek-Web choices are `3020`, `3030`, `4000`, `5030`, etc.
- `SITE_URL` must be the final public HTTPS domain.
- Stripe values should be production keys when deploying live.
- `STRIPE_WEBHOOK_SECRET` must match the webhook configured for `https://your-domain.com/api/stripe/webhook`.
- `ADMIN_EMAIL_FROM` should be a valid sender for the SMTP account being used.

## 3. Copy the App to Capek-Web

SSH to the server:

```bash
ssh angel@192.168.86.15
```

Place the app in `/srv/apps/joscupcakes`.

If cloning from git:

```bash
cd /srv/apps
git clone <repo-url> joscupcakes
cd /srv/apps/joscupcakes
```

If the folder already exists and you are updating:

```bash
cd /srv/apps/joscupcakes
git pull
```

## 4. Install and Build on the Server

```bash
cd /srv/apps/joscupcakes
npm install
npm run build
```

If the project uses a committed `.env.example` later, keep the real `.env` only on the server.

## 5. Start the App with PM2

Choose an unused internal port. Example below uses `3020`.

Start it:

```bash
cd /srv/apps/joscupcakes
PORT=3020 pm2 start npm --name "joscupcakes" -- start
pm2 save
```

For later updates:

```bash
cd /srv/apps/joscupcakes
git pull
npm install
npm run build
pm2 restart joscupcakes --update-env
```

## 6. nginx Reverse Proxy

Create `/etc/nginx/sites-available/<domain>.conf`:

```nginx
server {
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3020;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/<domain>.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 7. TLS Certificate

After nginx is enabled for the domain:

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot will update the nginx config in place.

## 8. Stripe Webhook

In the Stripe dashboard, configure the production webhook endpoint as:

```text
https://your-domain.com/api/stripe/webhook
```

Listen for at least:

- `checkout.session.completed`

Then copy the generated webhook signing secret into:

```env
STRIPE_WEBHOOK_SECRET=
```

## 9. Verification Commands

After deployment, verify each layer.

```bash
pm2 ls
pm2 logs joscupcakes --lines 50
sudo nginx -t
ss -ltnp | grep 3020
curl -I http://127.0.0.1:3020
curl -I https://your-domain.com
```

Expected checks:

- PM2 process is `online`
- nginx config passes
- app is listening on the chosen localhost port
- public domain returns a valid HTTPS response

## 10. Common Capek-Web Notes

- Do not expose the app port through `ufw`; nginx should be the only public entry point.
- Do not commit `.env` with real secrets.
- Do not use `npm run dev` in production.
- Do not hardcode the production port in the codebase.
- For restarts after env changes, use `pm2 restart joscupcakes --update-env`.

## 11. Recommended First Deploy Flow

```bash
ssh angel@192.168.86.15
cd /srv/apps
git clone <repo-url> joscupcakes
cd /srv/apps/joscupcakes
npm install
npm run build
nano .env
PORT=3020 pm2 start npm --name "joscupcakes" -- start
pm2 save
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

If you want, I can also add a matching `.env.example` for this project so the handoff is cleaner.