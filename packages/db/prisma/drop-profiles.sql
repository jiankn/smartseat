-- 清理 Supabase 数据库中与 auth.users 相关的表
-- 在 Supabase SQL Editor 中运行此脚本

-- 删除所有引用 auth schema 的表
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.project_members CASCADE;

-- 如果有其他表也引用了 auth.users，也需要删除
-- 你可以运行以下查询查看所有相关表：
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name LIKE '%user%' OR table_name LIKE '%member%' OR table_name LIKE '%profile%';
