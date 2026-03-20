# Naklos Deployment Guide (Free Tier)

## Architecture
- **Frontend** → Cloudflare Pages (free)
- **Backend + Keycloak** → Railway (free $5 credit/month)
- **Database** → Neon (free PostgreSQL)

---

## Step 1: Neon Database

1. Go to https://neon.tech and create a free account
2. Create a new project: `naklos`
3. Copy the connection string — looks like:
   `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/naklos?sslmode=require`
4. Note: You do NOT need to run init-db.sql manually — Flyway handles all migrations on startup

---

## Step 2: Railway — Backend

1. Go to https://railway.app and create a free account
2. New Project → Deploy from GitHub repo → select `naklos` (backend)
3. Set environment variables:
```
SPRING_PROFILES_ACTIVE=prod
DB_PASSWORD=<from neon connection string>
SPRING_DATASOURCE_URL=jdbc:postgresql://<neon-host>/naklos?sslmode=require
SPRING_DATASOURCE_USERNAME=<neon-user>
KEYCLOAK_ISSUER_URI=https://<your-keycloak-railway-url>/realms/naklos
KEYCLOAK_JWK_SET_URI=https://<your-keycloak-railway-url>/realms/naklos/protocol/openid-connect/certs
ALLOWED_ORIGINS=https://<your-cloudflare-pages-url>
```
4. Railway will use the `Dockerfile` automatically
5. Note the deployed URL: `https://naklos-backend.up.railway.app`

---

## Step 3: Railway — Keycloak

1. In the same Railway project → New Service → Docker Image
2. Image: `quay.io/keycloak/keycloak:26.0`
3. Set environment variables:
```
KC_DB=postgres
KC_DB_URL=jdbc:postgresql://<neon-host>/naklos
KC_DB_USERNAME=<neon-user>
KC_DB_PASSWORD=<neon-password>
KC_DB_SCHEMA=keycloak
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=<strong-password>
KC_HTTP_PORT=8080
KC_HOSTNAME_STRICT=false
KC_HTTP_ENABLED=true
KC_PROXY=edge
KC_HEALTH_ENABLED=true
```
4. Start command: `start --import-realm`
5. Mount realm file: Upload `docker/keycloak/realm-export.json` as a volume at `/opt/keycloak/data/import/realm-export.json`
6. Note the deployed URL: `https://naklos-keycloak.up.railway.app`

---

## Step 4: Configure Keycloak Realm

1. Open `https://naklos-keycloak.up.railway.app` → Admin Console
2. Login with admin credentials
3. The `naklos` realm should be auto-imported. If not, create it:
   - Realm Settings → name: `naklos`
   - Create client `naklos-frontend`:
     - Client type: OpenID Connect
     - Access type: Public
     - Valid redirect URIs: `https://<cloudflare-url>/*`
     - Web origins: `https://<cloudflare-url>`
   - Create roles: `FLEET_MANAGER`, `DRIVER`

4. Create pilot user accounts:
   - Users → Add user → username: `pilot_manager`
   - Credentials → Set password
   - Role Mappings → assign `FLEET_MANAGER`

   - Repeat for each driver: assign `DRIVER` role
   - For drivers, add attribute: `driver_id` = their UUID from the database

---

## Step 5: Cloudflare Pages — Frontend

1. Go to https://pages.cloudflare.com
2. Connect GitHub → select `naklos-web` repo
3. Build settings:
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
4. Environment variables:
```
VITE_API_URL=https://naklos-backend.up.railway.app/api
VITE_KEYCLOAK_URL=https://naklos-keycloak.up.railway.app
VITE_KEYCLOAK_REALM=naklos
VITE_KEYCLOAK_CLIENT_ID=naklos-frontend
```
5. Deploy! Your app will be at `https://naklos-xxx.pages.dev`

---

## Step 6: Wire Everything Together

Update backend `ALLOWED_ORIGINS` with the Cloudflare URL.
Update Keycloak client redirect URIs with the Cloudflare URL.

---

## Creating Pilot User Accounts

For each fleet owner employee:
1. Keycloak Admin → Users → Add User
2. Set username, email, first/last name
3. Credentials → Set temporary password (user changes on first login)
4. Role Mappings:
   - Fleet owner: assign `FLEET_MANAGER`
   - Drivers: assign `DRIVER`
5. For drivers: Attributes → add `driver_id` = UUID from `fleet.drivers` table

---

## Estimated Monthly Cost
- Cloudflare Pages: **$0**
- Railway (backend + keycloak): **~$0** (within $5 free credit for pilot)
- Neon DB: **$0** (free tier: 0.5GB compute, 10GB storage)
- **Total: $0/month** ✅
