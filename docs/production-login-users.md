# Production Login Users Setup

Creates the accounts used by the login page (`frontend/src/pages/Login.jsx`).

| Login page | Value |
|---|---|
| Default email | `admin@laxmitraders.com` |
| Quick button 1 | `admin@laxmitraders.com` (Super Admin) |
| Quick button 2 | `manager@laxmitraders.com` (Branch Manager) |
| Password | `password` |

Your production DB was seeded with `DatabaseSeeder` (SVMA Agro users), so the
`@laxmitraders.com` accounts do not exist yet. Run one of the options below.

---

## Option A — SQL (phpMyAdmin)

Select the production database (`svma_agro` or whatever it is named), then run:

```sql
SET @hash  = '$2y$10$v/BTL9jM5HciibOoHdr2SelpXEOrmbl8m0t/zRtCG4EkHBLeV6GoC'; -- bcrypt('password')
SET @br    = (SELECT id FROM branches WHERE branch_code='BR-KNG' LIMIT 1);
SET @r_sup = (SELECT id FROM roles    WHERE name='super_admin' LIMIT 1);
SET @r_mgr = (SELECT id FROM roles    WHERE name='branch_manager' LIMIT 1);

-- 1. Super Admin (login page default)
INSERT INTO users (name, employee_id, email, mobile, password, status, role_id, default_branch_id, created_at, updated_at)
SELECT 'Laxmi Administrator','EMP-101','admin@laxmitraders.com','9999999999',@hash,'active',@r_sup,@br,NOW(),NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email='admin@laxmitraders.com');

-- 2. Branch Manager (quick-login button)
INSERT INTO users (name, employee_id, email, mobile, password, status, role_id, default_branch_id, created_at, updated_at)
SELECT 'Branch Manager','EMP-102','manager@laxmitraders.com','9888888888',@hash,'active',@r_mgr,@br,NOW(),NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email='manager@laxmitraders.com');

-- 3. Branch access for both users
INSERT INTO user_branches (user_id, branch_id)
SELECT u.id, b.id
FROM users u JOIN branches b
WHERE u.email IN ('admin@laxmitraders.com','manager@laxmitraders.com')
  AND b.branch_code IN ('BR-KNG','BR-ERD','BR-TNJ')
  AND NOT EXISTS (SELECT 1 FROM user_branches ub WHERE ub.user_id=u.id AND ub.branch_id=b.id);

-- 4. Verify
SELECT id, name, email, role_id, default_branch_id, status
FROM users
WHERE email LIKE '%laxmitraders%';
```

Both statements are idempotent — running them twice creates no duplicates.

---

## Option B — One command on SSH

```bash
cd /home/shrieela/api.shrieelaxmi.in

php artisan tinker --execute="\
\$h=hash('password');\
foreach([['admin@laxmitraders.com','Laxmi Administrator','EMP-101','super_admin'],['manager@laxmitraders.com','Branch Manager','EMP-102','branch_manager']] as \$u){\
\$user=\App\Models\User::updateOrCreate(['email'=>\$u[0]],['name'=>\$u[1],'employee_id'=>\$u[2],'mobile'=>'9999999999','password'=>\Illuminate\Support\Facades\Hash::make('password'),'role_id'=>\App\Models\Role::where('name',\$u[3])->value('id'),'default_branch_id'=>\App\Models\Branch::where('branch_code','BR-KNG')->value('id'),'status'=>'active']);\
\$user->branches()->sync([\App\Models\Branch::where('branch_code','BR-KNG')->value('id'),\App\Models\Branch::where('branch_code','BR-ERD')->value('id'),\App\Models\Branch::where('branch_code','BR-TNJ')->value('id')]);}"
```

---

## Production roles & branches this script relies on

| roles.name | Created by |
|---|---|
| `super_admin`, `admin`, `branch_manager`, `staff` | `DatabaseSeeder` |

| branches.branch_code | Branch |
|---|---|
| `BR-KNG` | Kangeyam Plant (Head Office) |
| `BR-ERD` | Erode Processing Unit |
| `BR-TNJ` | Thanjavur Agro Depot |

---

## Notes

- **Do not run `php artisan db:seed --class=CoreSeeder` on production.**
  `CoreSeeder` looks for roles named `SUPER ADMIN` / `BRANCH MANAGER` /
  `INVENTORY STAFF` (uppercase with spaces), which do not exist in this DB —
  it would fail with a null `role_id`.
- `employee_id` is unique. `EMP-001` … `EMP-003` are already taken by
  `DatabaseSeeder`; this script uses `EMP-101` / `EMP-102`.
- The hash above is bcrypt for the literal string `password`
  (`password_verify('password', $hash) === true`).
- **Change these passwords before going live** — they are demo credentials.

## Test after running

```bash
curl -i -X POST https://api.shrieelaxmi.in/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@laxmitraders.com","password":"password"}'
```

Expect `HTTP 200` with `"success": true` and a `token`.
