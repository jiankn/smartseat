# 数据库设置指南

## 🚨 当前问题
- 错误：`Can't reach database server at localhost:5432`
- 原因：没有运行中的 PostgreSQL 数据库

## ✅ 推荐解决方案

### 选项 A：使用 Neon（免费，推荐）

1. 访问 https://neon.tech 并注册
2. 创建新项目，选择区域（建议选择离你最近的）
3. 获取连接字符串（Dashboard → Connection Details）
4. 更新 `packages/db/.env`：

```env
# Neon Pooled Connection (for runtime queries)
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# Neon Direct Connection (for migrations)
DIRECT_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

### 选项 B：使用 Supabase（免费）

1. 访问 https://supabase.com 并注册
2. 创建新项目
3. 在 Settings → Database 找到连接字符串
4. 更新 `packages/db/.env`：

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres"
```

### 选项 C：本地 Docker（需要 Docker Desktop）

```powershell
# 启动 PostgreSQL 容器
docker run --name smartseat-postgres `
  -e POSTGRES_USER=smartseat `
  -e POSTGRES_PASSWORD=smartseat123 `
  -e POSTGRES_DB=smartseat `
  -p 5432:5432 `
  -d postgres:16-alpine

# 更新 packages/db/.env
# DATABASE_URL="postgresql://smartseat:smartseat123@localhost:5432/smartseat"
# DIRECT_URL="postgresql://smartseat:smartseat123@localhost:5432/smartseat"
```

## 📝 配置完成后执行

```powershell
# 1. 测试连接
pnpm --filter @smartseat/db exec prisma db push

# 2. 生成迁移
pnpm --filter @smartseat/db exec prisma migrate dev --name init

# 3. 查看数据库（可选）
pnpm --filter @smartseat/db exec prisma studio
```

## 🔒 安全提示

- ⚠️ 不要将真实的 `.env` 文件提交到 Git
- ✅ 已在 `.gitignore` 中排除 `.env` 文件
- ✅ 团队成员需要各自创建 `.env` 文件
