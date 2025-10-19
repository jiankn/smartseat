# 数据库管理命令

## 启动/停止容器
docker start smartseat-db
docker stop smartseat-db
docker restart smartseat-db

## 查看容器状态
docker ps -a --filter "name=smartseat-db"

## 查看容器日志
docker logs smartseat-db

## 进入数据库容器
docker exec -it smartseat-db psql -U smartseat -d smartseat

## 删除容器（慎用！会删除所有数据）
docker stop smartseat-db
docker rm smartseat-db

## 数据库迁移
pnpm --filter @smartseat/db exec prisma migrate dev --name 迁移名称
pnpm --filter @smartseat/db exec prisma migrate deploy

## 重置数据库（慎用！）
pnpm --filter @smartseat/db exec prisma migrate reset

## 查看数据
pnpm --filter @smartseat/db exec prisma studio

## 生成 Prisma Client
pnpm --filter @smartseat/db exec prisma generate
