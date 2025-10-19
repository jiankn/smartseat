# SmartSeat Deployment Guide

## Vercel 部署配置

### 1. 项目设置

在 Vercel 项目设置中：
- **Root Directory**: `apps/web`
- **Framework Preset**: Next.js
- **Build Command**: 使用 `apps/web/vercel.json` 中的自定义命令
- **Install Command**: 使用 `apps/web/vercel.json` 中的自定义命令

### 2. 环境变量配置

在 Vercel Dashboard → Settings → Environment Variables 中添加以下变量：

#### NextAuth
```bash
NEXTAUTH_URL=https://smart-seat-web.vercel.app
NEXTAUTH_SECRET=XXmcTkDhvfdAe8qFT3EHRtCCjFXhq0pUPRw6eJ9bLOA=
DEV_LOGIN_ALLOW=your-email@example.com  # 你的真实邮箱
ALLOW_DEV_LOGIN_IN_PROD=true  # 允许在生产环境使用开发登录（仅用于测试）
```

**⚠️ 安全警告**: 
- `ALLOW_DEV_LOGIN_IN_PROD=true` 仅用于测试环境
- 生产环境应该使用真实的 OAuth 提供商（Google、GitHub 等）
- 记得把 `DEV_LOGIN_ALLOW` 改成你的实际邮箱地址

#### Database (Supabase)
```bash
DATABASE_URL=你的Supabase连接字符串(pooler,端口6543)
DIRECT_URL=你的Supabase直连字符串(端口5432)
```

#### Stripe
```bash
STRIPE_SECRET_KEY=sk_test_你的密钥
STRIPE_PRICE_PRO_MONTHLY=price_你的月付价格ID
STRIPE_PRICE_PRO_YEARLY=price_你的年付价格ID
STRIPE_SUCCESS_URL=https://smart-seat-web.vercel.app/pricing?success=1
STRIPE_CANCEL_URL=https://smart-seat-web.vercel.app/pricing?canceled=1
STRIPE_WEBHOOK_SECRET=whsec_你的webhook密钥
```

### 3. Stripe Webhook 配置

在 Stripe Dashboard 中配置 webhook endpoint：
- **URL**: `https://smart-seat-web.vercel.app/api/billing/webhook`
- **Events**: 
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

### 4. 部署后验证

1. 访问 `https://smart-seat-web.vercel.app` 确认应用运行正常
2. 测试登录功能
3. 测试 Stripe 支付流程
4. 查看 Vercel Logs 确认没有错误

## 本地开发

```bash
# 安装依赖
pnpm install

# 生成 Prisma Client
pnpm -F @smartseat/db generate

# 运行数据库迁移
pnpm -F @smartseat/db migrate:dev

# 启动开发服务器
pnpm -F @smartseat/web dev
```

## 常见问题

### Stripe webhook 本地测试
```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

### 数据库迁移（生产环境）
在 Vercel 部署前确保数据库 schema 已更新：
```bash
pnpm -F @smartseat/db migrate:deploy
```
