# Supabase 数据库切换指南

## 📋 当前状态
❌ 无法连接到 Supabase: `aws-0-us-east-1.pooler.supabase.com:5432`

## 🔧 解决方案

### 1️⃣ 检查 Supabase 项目状态

访问 Supabase Dashboard: https://supabase.com/dashboard/projects
- 确保项目处于 **Active** 状态（不是 Paused）
- 如果暂停，点击 **Resume** 恢复项目

### 2️⃣ 获取正确的连接字符串

在 Supabase Dashboard 中：
1. 选择你的项目
2. 点击左侧 **Settings** → **Database**
3. 在 **Connection string** 部分：
   - **Transaction mode** (用于 DIRECT_URL): `postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres`
   - **Session mode** (用于 DATABASE_URL): `postgresql://postgres:[password]@db.xxx.supabase.co:6543/postgres?pgbouncer=true`

### 3️⃣ 更新环境变量

**apps/web/.env.local**:
```env
# 替换为你的真实连接字符串
DATABASE_URL="postgresql://postgres.[ref]:[password]@db.[region].supabase.co:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres.[ref]:[password]@db.[region].supabase.co:5432/postgres?sslmode=require"
```

**packages/db/.env**:
```env
# 使用相同的连接字符串
DATABASE_URL="postgresql://postgres.[ref]:[password]@db.[region].supabase.co:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres.[ref]:[password]@db.[region].supabase.co:5432/postgres?sslmode=require"
```

### 4️⃣ 运行数据库迁移

```powershell
# 推送数据库结构
pnpm --filter @smartseat/db exec prisma db push

# 填充示例数据
pnpm --filter @smartseat/db exec prisma db seed
```

### 5️⃣ 重启开发服务器

```powershell
# 停止当前服务器 (Ctrl+C)
# 重新启动
pnpm --filter ./apps/web dev
```

## 🔄 切换回本地数据库

如果 Supabase 仍然无法连接，可以切换回本地 Docker：

```powershell
# 启动 Docker 数据库
docker start smartseat-db

# 修改 apps/web/.env.local
DATABASE_URL="postgresql://smartseat:smartseat123@localhost:5432/smartseat"
DIRECT_URL="postgresql://smartseat:smartseat123@localhost:5432/smartseat"

# 修改 packages/db/.env
DATABASE_URL="postgresql://smartseat:smartseat123@localhost:5432/smartseat"
DIRECT_URL="postgresql://smartseat:smartseat123@localhost:5432/smartseat"

# 重启服务器
pnpm --filter ./apps/web dev
```

## ⚠️ 常见问题

### 问题 1: 连接超时
**原因**: 网络限制或 Supabase 项目暂停  
**解决**: 检查项目状态，确保处于 Active

### 问题 2: 认证失败
**原因**: 密码错误或用户名格式不对  
**解决**: 从 Supabase Dashboard 重新复制连接字符串

### 问题 3: SSL 错误
**原因**: 缺少 sslmode 参数  
**解决**: 确保连接字符串包含 `?sslmode=require`

## 📖 参考文档

- Supabase 文档: https://supabase.com/docs/guides/database/connecting-to-postgres
- Prisma 连接指南: https://www.prisma.io/docs/concepts/database-connectors/postgresql
