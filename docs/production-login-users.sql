-- Production login users (login page defaults)
-- Safe to run twice - idempotent.

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
