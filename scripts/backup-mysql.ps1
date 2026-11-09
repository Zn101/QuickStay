<#
.SYNOPSIS
    Script sao lưu cơ sở dữ liệu MySQL chạy trong Docker Volume cho dự án QuickStay.
.DESCRIPTION
    Tự động phát hiện container MySQL đang chạy, kiểm tra Docker Volume thực tế,
    sao lưu database (mặc định 'quickstay') bằng mysqldump mà không kèm lệnh CREATE DATABASE / USE,
    đặt tên file theo ngày giờ và kiểm tra tính hợp lệ của file backup.
.PARAMETER ContainerName
    Tên container MySQL (tùy chọn). Mặc định tự động tìm container hợp lệ.
.PARAMETER Database
    Tên database cần backup. Mặc định: 'quickstay'.
.PARAMETER OutputDir
    Thư mục lưu file backup. Mặc định: '<ProjectRoot>/backups'.
.PARAMETER RootPassword
    Mật khẩu root MySQL. Nếu không truyền sẽ đọc từ .env hoặc môi trường.
.PARAMETER EnvFile
    Đường dẫn tới file .env (tùy chọn).
.PARAMETER Production
    Cờ báo môi trường Production: bắt buộc phải có mật khẩu, cấm dùng dev default.
.EXAMPLE
    .\scripts\backup-mysql.ps1
    .\scripts\backup-mysql.ps1 -Database quickstay -OutputDir ./backups
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$ContainerName,

    [Parameter(Mandatory = $false)]
    [string]$Database = "quickstay",

    [Parameter(Mandatory = $false)]
    [string]$OutputDir,

    [Parameter(Mandatory = $false)]
    [string]$RootPassword,

    [Parameter(Mandatory = $false)]
    [string]$EnvFile,

    [Parameter(Mandatory = $false)]
    [switch]$Production
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Thiết lập encoding UTF-8 cho console và output
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# 1. Xác định thư mục dự án và thư mục lưu trữ
$ProjectRoot = (Resolve-Path "$PSScriptRoot\..").Path
if ([string]::IsNullOrWhiteSpace($OutputDir)) {
    $OutputDir = Join-Path $ProjectRoot "backups"
}
if (-not [System.IO.Path]::IsPathRooted($OutputDir)) {
    $OutputDir = [System.IO.Path]::GetFullPath((Join-Path $ProjectRoot $OutputDir))
}

# 2. Xử lý mật khẩu an toàn
if ([string]::IsNullOrWhiteSpace($RootPassword)) {
    # Thử đọc từ file .env nếu có
    $targetEnv = if (-not [string]::IsNullOrWhiteSpace($EnvFile)) { $EnvFile } else { Join-Path $ProjectRoot ".env" }
    if (Test-Path -Path $targetEnv) {
        Get-Content -Path $targetEnv | ForEach-Object {
            $line = $_.Trim()
            if ($line -match "^DB_ROOT_PASSWORD=(.*)$") {
                $val = $matches[1].Trim()
                if ($val -match '^["''](.*)["'']$') { $val = $matches[1] }
                $RootPassword = $val
            }
        }
    }
}

if ([string]::IsNullOrWhiteSpace($RootPassword) -and -not [string]::IsNullOrWhiteSpace($env:DB_ROOT_PASSWORD)) {
    $RootPassword = $env:DB_ROOT_PASSWORD
}

if ([string]::IsNullOrWhiteSpace($RootPassword)) {
    if ($Production) {
        throw "LOI BAO MAT: Khong tim thay DB_ROOT_PASSWORD! Tren Production bat buoc phai cung cap mat khau qua file .env, bien moi truong hoac tham so -RootPassword."
    } else {
        Write-Warning "[CANH BAO DEV] Khong tim thay DB_ROOT_PASSWORD. Tam thoi su dung mat khau dev mac dinh ('root_pw'). TUYET DOI khong dung mat khau nay tren Production!"
        $RootPassword = "root_pw"
    }
}

# 3. Tự động phát hiện container MySQL
if ([string]::IsNullOrWhiteSpace($ContainerName)) {
    $candidates = @("quickstay-mysql-1")
    $found = $null
    foreach ($cand in $candidates) {
        $candStatus = (cmd.exe /c "docker inspect --format `"{{.State.Status}}`" $cand 2>nul").Trim()
        if ($candStatus -eq "running") {
            $found = $cand
            break
        }
    }

    if (-not $found) {
        # Tìm theo compose service label
        $candByLabel = cmd.exe /c "docker ps --filter `"label=com.docker.compose.service=mysql`" --filter `"status=running`" --format `"{{.Names}}`" 2>nul"
        if ($candByLabel) {
            $found = ($candByLabel -split "`r?`n")[0].Trim()
        }
    }

    if (-not $found) {
        # Tìm theo ancestor image
        $candByImage = cmd.exe /c "docker ps --filter `"ancestor=mysql:8.4`" --filter `"status=running`" --format `"{{.Names}}`" 2>nul"
        if ($candByImage) {
            $found = ($candByImage -split "`r?`n")[0].Trim()
        }
    }

    if (-not $found) {
        throw "LOI: Khong tim thay container MySQL dang chay! Hay kiem tra bang lenh 'docker ps' hoac khoi dong bang 'docker compose up -d mysql'."
    }
    $ContainerName = $found
} else {
    $inspectStatus = (cmd.exe /c "docker inspect --format `"{{.State.Status}}`" $ContainerName 2>nul").Trim()
    if ($LASTEXITCODE -ne 0 -or $inspectStatus -ne "running") {
        throw "LOI: Container '$ContainerName' khong ton tai hoac khong o trang thai running!"
    }
}

# 4. Kiểm tra volume thực tế được mount tại /var/lib/mysql
$mountsJson = cmd.exe /c "docker inspect --format `"{{json .Mounts}}`" $ContainerName 2>nul"
$actualVolume = "N/A (khong xac dinh)"
if ($mountsJson) {
    try {
        $mounts = $mountsJson | ConvertFrom-Json
        foreach ($m in $mounts) {
            if ($m.Destination -eq "/var/lib/mysql") {
                $actualVolume = if ($m.Name) { $m.Name } else { $m.Source }
                break
            }
        }
    } catch {
        $actualVolume = "Khong the parse JSON mounts"
    }
}

# 5. Chuẩn bị file backup
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFileName = "${Database}_backup_${timestamp}.sql"
$backupFilePath = Join-Path $OutputDir $backupFileName

if (-not (Test-Path -Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

# Hiển thị thông tin trước khi chạy
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host " [QuickStay] BAT DAU BACKUP CO SO DU LIEU MYSQL DOCKER" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "Thoi gian bat dau:   $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "Container MySQL:     $ContainerName"
Write-Host "Docker Volume mount: $actualVolume"
Write-Host "Database nguon:      $Database"
Write-Host "Thu muc xuat file:   $OutputDir"
Write-Host "File backup:         $backupFileName"
Write-Host "==============================================================" -ForegroundColor Cyan

# 6. Thực thi mysqldump với biến môi trường MYSQL_PWD (tránh in cảnh báo mật khẩu ra console)
# KHÔNG dùng --databases để không sinh 'CREATE DATABASE' / 'USE', cho phép restore linh hoạt vào bất kỳ database đích nào
$cmdline = "docker exec -e MYSQL_PWD=$RootPassword $ContainerName mysqldump -u root --single-transaction --quick --routines --triggers --events --default-character-set=utf8mb4 $Database > `"$backupFilePath`""
cmd.exe /c $cmdline
$exitCode = $LASTEXITCODE

# 7. Kiểm tra tính hợp lệ của file backup
if ($exitCode -ne 0) {
    if (Test-Path -Path $backupFilePath) { Remove-Item -Path $backupFilePath -Force }
    throw "LOI BACKUP: mysqldump ket thuc voi ma loi $exitCode."
}

if (-not (Test-Path -Path $backupFilePath)) {
    throw "LOI BACKUP: Khong tim thay file backup sau khi xuat: $backupFilePath"
}

$fileItem = Get-Item -Path $backupFilePath
if ($fileItem.Length -le 0) {
    Remove-Item -Path $backupFilePath -Force
    throw "LOI BACKUP: File backup rong (0 bytes)!"
}

# Đọc kiểm tra cấu trúc SQL
$headerSnippet = Get-Content -Path $backupFilePath -TotalCount 25 | Out-String
$isMysqlDump = ($headerSnippet -match "MySQL dump") -or ($headerSnippet -match "Server version")

$tailSnippet = Get-Content -Path $backupFilePath -Tail 20 | Out-String
$isDumpCompleted = ($tailSnippet -match "Dump completed on")

if (-not $isMysqlDump) {
    Remove-Item -Path $backupFilePath -Force
    throw "LOI BACKUP: File duoc tao khong chua dinh dang header SQL hop le cua mysqldump!"
}

if (-not $isDumpCompleted) {
    Write-Warning "CANH BAO: Khong tim thay chuoi 'Dump completed on' o cuoi file. Hay kiem tra lai file backup de dam bao khong bi ngat giua chung."
}

# 8. Báo cáo kết quả thành công
$lineCount = (Get-Content -Path $backupFilePath | Measure-Object -Line).Lines
Write-Host ""
Write-Host "[THANH CONG] Sao luu co so du lieu hoan tat!" -ForegroundColor Green
Write-Host "File backup:  $backupFilePath" -ForegroundColor Green
Write-Host "Kich thuoc:   $([math]::Round($fileItem.Length / 1024, 2)) KB ($($fileItem.Length) bytes)"
Write-Host "So dong SQL:  $lineCount dong"
Write-Host "Kiem tra:     Dat chuan MySQL dump UTF-8 (Khong khoa cung database dich)" -ForegroundColor Green
Write-Host "==============================================================" -ForegroundColor Cyan

return $backupFilePath
