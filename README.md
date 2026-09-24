# S.V.M.A. Agro — Settlement & Inventory

Full-stack app: **Laravel 12 API + React (Vite) + MySQL**.

## Requirements

- PHP 8.2+, Composer
- Node 20+
- MySQL 8 / MariaDB (XAMPP works)

## Setup

### 1. Database

```bat
C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE IF NOT EXISTS svma_agro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 2. Backend

```bat
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve --host=127.0.0.1 --port=8000
```

Update `.env` DB settings if needed:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=svma_agro
DB_USERNAME=root
DB_PASSWORD=
```

### 3. Frontend

```bat
cd frontend
npm install
npm run dev
```

Open **http://127.0.0.1:5173**  
Vite proxies `/api` → `http://127.0.0.1:8000`.

## Login

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@svmaagro.com | password |
| Manager | manager@svmaagro.com | password |
| Inventory | inventory@svmaagro.com | password |

## Modules

- **Masters** — vendors, vehicles, items, categories, branches, units
- **Billing** — settlement bills (calc, GST modes, QC, charges), debit notes, PDF
- **Inventory** — stock in/out, transfer, adjustment, ledger, low stock
- **Vehicle movements** — auto-linked from stock & settlement posts
- **Reports** — 14 report types + CSV/Excel/PDF export
- **Admin** — staff, roles/permissions, field config, company settings, audit logs

## Spec rules (implemented)

- GST modes mutually exclusive: `CGST_SGST` | `IGST` | `NONE`
- Field modes: `MANUAL` | `AUTOMATIC`
- Inventory quantity source: `FINAL_WEIGHT` (default) | `NET_WEIGHT` | `MANUAL_QUANTITY`
- Approve settlement → single Stock In (no duplicates; unique source+type)
- Cancel approved bill → reverse linked stock-in (status CANCELLED, not hard delete)
- Negative stock blocked unless enabled in settings

## API health

- `GET /up`
- `POST /api/login`
