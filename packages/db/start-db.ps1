# SmartSeat PostgreSQL Docker 启动脚本

Write-Host "启动 SmartSeat PostgreSQL 数据库..." -ForegroundColor Cyan

# 检查 Docker 是否运行
Write-Host "检查 Docker Desktop 状态..." -ForegroundColor Yellow

$dockerRunning = $false
$maxAttempts = 30
$attempt = 0

while (-not $dockerRunning -and $attempt -lt $maxAttempts) {
    try {
        docker ps *> $null
        if ($LASTEXITCODE -eq 0) {
            $dockerRunning = $true
            Write-Host "Docker Desktop 已就绪" -ForegroundColor Green
        }
    } catch {
        # Docker 未就绪
    }
    
    if (-not $dockerRunning) {
        $attempt++
        if ($attempt -eq 1) {
            Write-Host "正在等待 Docker Desktop 启动..." -ForegroundColor Yellow
        }
        Start-Sleep -Seconds 2
    }
}

if (-not $dockerRunning) {
    Write-Host "Docker Desktop 未运行。请手动启动 Docker Desktop 后重试。" -ForegroundColor Red
    exit 1
}

# 检查是否已存在同名容器
$existingContainer = docker ps -a --filter "name=smartseat-db" --format "{{.Names}}"

if ($existingContainer -eq "smartseat-db") {
    Write-Host "发现已存在的容器 smartseat-db" -ForegroundColor Yellow
    
    # 检查容器是否在运行
    $runningContainer = docker ps --filter "name=smartseat-db" --format "{{.Names}}"
    
    if ($runningContainer -eq "smartseat-db") {
        Write-Host "容器已在运行中" -ForegroundColor Green
    } else {
        Write-Host "启动现有容器..." -ForegroundColor Yellow
        docker start smartseat-db
        Write-Host "容器已启动" -ForegroundColor Green
    }
} else {
    Write-Host "创建新的 PostgreSQL 容器..." -ForegroundColor Yellow
    
    docker run --name smartseat-db -e POSTGRES_USER=smartseat -e POSTGRES_PASSWORD=smartseat123 -e POSTGRES_DB=smartseat -p 5432:5432 -d postgres:16-alpine
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "容器创建成功" -ForegroundColor Green
        Write-Host "等待数据库初始化..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    } else {
        Write-Host "容器创建失败" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "数据库信息：" -ForegroundColor Cyan
Write-Host "  主机: localhost"
Write-Host "  端口: 5432"
Write-Host "  数据库: smartseat"
Write-Host "  用户: smartseat"
Write-Host "  密码: smartseat123"
Write-Host ""
Write-Host "数据库已就绪！" -ForegroundColor Green
