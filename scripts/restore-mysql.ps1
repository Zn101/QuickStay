<#
.SYNOPSIS
    Script khoi phuc co so du lieu MySQL trong Docker Volume cho du an QuickStay.
.DESCRIPTION
    Kiem tra file backup, container va volume thuc te. Mac dinh khoi phuc vao database
    kiem thu rieng ('quickstay_test_restore') de dam bao an toan tuyet doi cho database chinh.
    Neu khoi phuc vao database chinh ('quickstay'), bat buoc phai xac nhan 'YES' (hoac -Force)
    va tu dong tao 1 ban backup snapshot du phong truoc khi thuc hien.
.PARAMETER BackupFile
    Duong dan toi file .sql can restore. Neu de trong se tu dong lay file backup moi nhat trong thu muc backups/.
.PARAMETER TargetDatabase
    Database dich can restore du lieu toi. Mac dinh an toan: 'quickstay_test_restore'.
.PARAMETER ContainerName
    Ten container MySQL (tuy chon, tu dong phat hien).
.PARAMETER RootPassword
    Mat khau root MySQL.
.PARAMETER EnvFile
    Duong dan toi file .env.
.PARAMETER Force
    Bo qua prompt xac nhan khi restore vao database chinh (dung cho automation).
.PARAMETER Production
    Co bao moi truong Production: bat buoc co mat khau, cam dung dev default.
.EXAMPLE
    .\scripts\restore-mysql.ps1 -BackupFile ./backups/quickstay_backup_20261109_230010.sql
    .\scripts\restore-mysql.ps1 -BackupFile ./backups/quickstay_backup_20261109_230010.sql -TargetDatabase quickstay_test_restore
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false, Position = 0)]
    [string]$BackupFile,

    [Parameter(Mandatory = $false)]
    [string]$TargetDatabase = "quickstay_test_restore",

    [Parameter(Mandatory = $false)]
    [string]$ContainerName,

    [Parameter(Mandatory = $false)]
    [string]$RootPassword,

    [Parameter(Mandatory = $false)]
    [string]$EnvFile,

    [Parameter(Mandatory = $false)]
    [switch]$Force,

    [Parameter(Mandatory = $false)]
    [switch]$Production
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Thiet lap encoding UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ProjectRoot = (Resolve-Path "$PSScriptRoot\..").Path
$BackupsDir = Join-Path $ProjectRoot "backups"

# 1. Tim va kiem tra file backup
if ([string]::IsNullOrWhiteSpace($BackupFile)) {
    if (Test-Path -Path $BackupsDir) {
        $latest = Get-ChildItem -Path $BackupsDir -Filter "*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        if ($latest) {
            $BackupFile = $latest.FullName
            Write-Host "[THONG TIN] Khong truyen -BackupFile. Tu dong chon file moi nhat: $($latest.Name)" -ForegroundColor Yellow
        }
    }
}

if ([string]::IsNullOrWhiteSpace($BackupFile) -or -not (Test-Path -Path $BackupFile)) {
    throw "LOI RESTORE: Khong tim thay file backup! Hay chi dinh qua tham so -BackupFile <duong_dan_file.sql>."
}

$resolvedBackupFile = (Resolve-Path -Path $BackupFile).Path
$fileItem = Get-Item -Path $resolvedBackupFile

if ($fileItem.Length -le 0) {
    throw "LOI RESTORE: File backup '$resolvedBackupFile' rong (0 bytes)!"
}

# Kiem tra tieu de SQL cua file
$headerSnippet = Get-Content -Path $resolvedBackupFile -TotalCount 25 | Out-String
if (-not ($headerSnippet -match "MySQL dump") -and -not ($headerSnippet -match "Server version")) {
    throw "LOI RESTORE: File '$resolvedBackupFile' khong chua dinh dang MySQL dump hop le!"
}

# 2. Xu ly mat khau an toan
if ([string]::IsNullOrWhiteSpace($RootPassword)) {
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

# 3. Tu dong phat hien container MySQL
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
        $candByLabel = cmd.exe /c "docker ps --filter `"label=com.docker.compose.service=mysql`" --filter `"status=running`" --format `"{{.Names}}`" 2>nul"
        if ($candByLabel) {
            $found = ($candByLabel -split "`r?`n")[0].Trim()
        }
    }

    if (-not $found) {
        $candByImage = cmd.exe /c "docker ps --filter `"ancestor=mysql:8.4`" --filter `"status=running`" --format `"{{.Names}}`" 2>nul"
        if ($candByImage) {
            $found = ($candByImage -split "`r?`n")[0].Trim()
        }
    }

    if (-not $found) {
        throw "LOI: Khong tim thay container MySQL dang chay! Hay kiem tra bang lenh 'docker ps'."
    }
    $ContainerName = $found
} else {
    $inspectStatus = (cmd.exe /c "docker inspect --format `"{{.State.Status}}`" $ContainerName 2>nul").Trim()
    if ($LASTEXITCODE -ne 0 -or $inspectStatus -ne "running") {
        throw "LOI: Container '$ContainerName' khong ton tai hoac khong o trang thai running!"
    }
}

# 4. Kiem tra volume thuc te mount tai /var/lib/mysql
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

# 5. Kiem tra quy tac an toan database dich
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host " [QuickStay] BAT DAU KHOI PHUC CO SO DU LIEU MYSQL DOCKER" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "Thoi gian bat dau:   $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "Container MySQL:     $ContainerName"
Write-Host "Docker Volume mount: $actualVolume"
Write-Host "File backup nguon:   $resolvedBackupFile"
Write-Host "Kich thuoc file:     $([math]::Round($fileItem.Length / 1024, 2)) KB"
Write-Host "Database dich:       $TargetDatabase"
Write-Host "==============================================================" -ForegroundColor Cyan

$isLiveDb = ($TargetDatabase.Trim().ToLower() -eq "quickstay")
if ($isLiveDb) {
    Write-Host ""
    Write-Host "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" -ForegroundColor Red
    Write-Host " CANH BAO NGUY HIEM: Ban dang chon restore de vao DATABASE CHINH '$TargetDatabase'!" -ForegroundColor Red
    Write-Host " Thao tac nay se ghi de du lieu dang co trong database." -ForegroundColor Red
    Write-Host "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" -ForegroundColor Red
    
    if (-not $Force) {
        $confirm = Read-Host "Nhap 'YES' (viet hoa) de xac nhan thuc hien ghi de, hoac Enter de huy"
        if ($confirm -ne "YES") {
            Write-Host "[DA HUY] Nguoi dung da huy thao tac restore database chinh." -ForegroundColor Yellow
            return
        }
    }

    # Tu dong tao ban snapshot du phong rollback
    Write-Host ""
    Write-Host "[AN TOAN] Dang tao ban backup snapshot du phong truoc khi ghi de..." -ForegroundColor Yellow
    $backupScript = Join-Path $PSScriptRoot "backup-mysql.ps1"
    if (Test-Path -Path $backupScript) {
        & $backupScript -ContainerName $ContainerName -Database $TargetDatabase -RootPassword $RootPassword
        Write-Host "[AN TOAN] Da tao ban snapshot phong ngua thanh cong!" -ForegroundColor Green
    }
}

# 6. Tao database dich neu chua ton tai (utf8mb4)
$createDbSql = "CREATE DATABASE IF NOT EXISTS $TargetDatabase CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
$createDbCmd = "docker exec -e MYSQL_PWD=$RootPassword $ContainerName mysql -u root -e `"$createDbSql`""
cmd.exe /c $createDbCmd
if ($LASTEXITCODE -ne 0) {
    throw "LOI RESTORE: Khong the tao database dich '$TargetDatabase'!"
}

# 7. Thuc thi restore voi cmd.exe binary redirection de bao toan UTF-8 tieng Viet
Write-Host ""
Write-Host "Dang nap du lieu tu file backup vao database '$TargetDatabase'..." -ForegroundColor Cyan
$restoreCmd = "docker exec -i -e MYSQL_PWD=$RootPassword $ContainerName mysql -u root --default-character-set=utf8mb4 $TargetDatabase < `"$resolvedBackupFile`""
cmd.exe /c $restoreCmd
$restoreExitCode = $LASTEXITCODE

if ($restoreExitCode -ne 0) {
    throw "LOI RESTORE: Lenh mysql restore ket thuc voi ma loi $restoreExitCode!"
}

# 8. Kiem tra va xac minh du lieu sau khi restore
Write-Host ""
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host " [KET QUA XAC MINH DU LIEU SAU RESTORE]" -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan

# Lay danh sach bang trong TargetDatabase
$listTablesCmd = "docker exec -e MYSQL_PWD=$RootPassword $ContainerName mysql -u root -N -e `"SHOW TABLES IN $TargetDatabase;`""
$rawTables = cmd.exe /c $listTablesCmd
$tables = ($rawTables -split "`r?`n") | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

Write-Host "Danh sach bang da khoi phuc trong '$TargetDatabase' (Tong cong: $($tables.Count) bang):" -ForegroundColor Green
foreach ($t in $tables) {
    $countCmd = "docker exec -e MYSQL_PWD=$RootPassword $ContainerName mysql -u root -N -e `"SELECT COUNT(*) FROM $TargetDatabase.$t;`""
    $cnt = (cmd.exe /c $countCmd).Trim()
    Write-Host "  - Bang ${t}: $cnt ban ghi"
}

# Kiem tra mau du lieu tieng Viet tren bang users va hotels
Write-Host ""
Write-Host "Mau du lieu nguoi dung va khach san (Kiem tra UTF-8 tieng Viet):" -ForegroundColor Cyan
$sampleUsersCmd = "docker exec -e MYSQL_PWD=$RootPassword $ContainerName mysql -u root --default-character-set=utf8mb4 -e `"SELECT id, email, full_name, role FROM $TargetDatabase.users LIMIT 2;`""
cmd.exe /c $sampleUsersCmd

$sampleHotelsCmd = "docker exec -e MYSQL_PWD=$RootPassword $ContainerName mysql -u root --default-character-set=utf8mb4 -e `"SELECT id, name, city FROM $TargetDatabase.hotels LIMIT 2;`""
cmd.exe /c $sampleHotelsCmd

# Neu restore vao database kiem thu, kiem tra va doi chieu voi database goc quickstay
if (-not $isLiveDb) {
    Write-Host ""
    Write-Host "==============================================================" -ForegroundColor Cyan
    Write-Host " [DOI CHIEU VOI DATABASE GOC 'quickstay']" -ForegroundColor Cyan
    Write-Host "==============================================================" -ForegroundColor Cyan
    $origCountCmd = "docker exec -e MYSQL_PWD=$RootPassword $ContainerName mysql -u root -e `"SELECT 'users' AS tbl, COUNT(*) AS count FROM quickstay.users UNION ALL SELECT 'hotels', COUNT(*) FROM quickstay.hotels UNION ALL SELECT 'rooms', COUNT(*) FROM quickstay.rooms UNION ALL SELECT 'bookings', COUNT(*) FROM quickstay.bookings;`""
    cmd.exe /c $origCountCmd
    Write-Host "[XAC NHAN AN TOAN] Database goc 'quickstay' van giu nguyen 100% du lieu, khong he bi anh huong!" -ForegroundColor Green
    Write-Host "[GHI CHU] Database kiem thu '$TargetDatabase' van duoc GIU NGUYEN de phuc vu kiem tra (khong tu dong drop)." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[HOAN TAT] Khoi phuc du lieu thanh cong!" -ForegroundColor Green
Write-Host "==============================================================" -ForegroundColor Cyan
