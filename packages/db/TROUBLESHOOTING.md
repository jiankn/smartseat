# 数据库诊断与修复

## 📊 当前状态

✅ Prisma Schema 已验证通过  
✅ Seed 文件存在  
❌ 数据库连接失败（未配置或服务未运行）

## 🔧 快速修复步骤

### 1️⃣ 配置数据库（三选一）

#### 推荐：使用 Neon（1分钟搞定）
```powershell
# 1. 打开浏览器访问 https://neon.tech
# 2. 注册并创建项目
# 3. 复制连接字符串
# 4. 编辑 packages/db/.env 替换为真实连接字符串
```

#### 或使用 Docker（如果已安装）
```powershell
docker run --name smartseat-db `
  -e POSTGRES_USER=smartseat `
  -e POSTGRES_PASSWORD=dev123 `
  -e POSTGRES_DB=smartseat `
  -p 5432:5432 `
  -d postgres:16-alpine

# 然后编辑 packages/db/.env：
# DATABASE_URL="postgresql://smartseat:dev123@localhost:5432/smartseat"
# DIRECT_URL="postgresql://smartseat:dev123@localhost:5432/smartseat"
```

### 2️⃣ 运行迁移（配置好数据库后）

```powershell
# 测试连接
pnpm --filter @smartseat/db exec prisma db pull

# 创建数据库表
pnpm --filter @smartseat/db exec prisma migrate dev --name init

# 填充示例数据
pnpm --filter @smartseat/db exec prisma db seed
```

### 3️⃣ 验证成功

```powershell
# 打开数据库管理界面
pnpm --filter @smartseat/db exec prisma studio
# 访问 http://localhost:5555 查看数据
```

## ⚠️ 常见错误

### 错误 1: `Can't reach database server`
**原因**: 数据库未运行或连接字符串错误  
**解决**: 检查 `.env` 文件，确保数据库服务运行中

### 错误 2: `Command "prisma" not found`
**原因**: 依赖未安装  
**解决**:
```powershell
cd packages/db
pnpm install
```

### 错误 3: `Environment variable not found: DATABASE_URL`
**原因**: `.env` 文件不存在或格式错误  
**解决**: 参考上面步骤 1 创建正确的 `.env`

## 📖 参考文档

- Neon 文档: https://neon.tech/docs/get-started-with-neon/signing-up
- Supabase 文档: https://supabase.com/docs/guides/database/connecting-to-postgres
- Prisma 文档: https://www.prisma.io/docs/getting-started
