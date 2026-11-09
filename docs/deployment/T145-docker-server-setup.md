# T145 – Cài đặt Docker và Docker Compose trên máy chủ QuickStay

**Ngày:** 09/11/2026 · **Người thực hiện:** Lê Duy Minh  
**Dự án:** QuickStay · **OS đích:** Ubuntu 22.04 / 24.04 LTS

---

## 1. Mục tiêu

Cài đặt Docker Engine, Docker CLI, Docker Compose Plugin và Docker Buildx Plugin trên máy chủ Ubuntu để phục vụ triển khai QuickStay bằng `docker-compose.prod.yml`.

---

## 2. Yêu cầu hệ thống

| Thành phần | Tối thiểu | Khuyến nghị |
|-----------|---------|------------|
| OS | Ubuntu 20.04 LTS | Ubuntu 22.04 / 24.04 LTS |
| CPU | 1 core | 2 cores |
| RAM | 2 GB | 4 GB |
| Disk | 10 GB | 20 GB SSD |
| Kết nối Internet | Có | Có |
| Quyền truy cập | `sudo` | `sudo` |

**Port cần mở trên firewall:**

| Port | Dịch vụ | Ghi chú |
|------|---------|---------|
| 22 | SSH | Quản trị máy chủ |
| 8081 | Frontend (Nginx) | Truy cập ứng dụng QuickStay |

> MySQL (:3306) và Backend (:8080) **KHÔNG** cần mở ra ngoài — chúng giao tiếp nội bộ qua Docker bridge network.

---

## 3. Các bước cài đặt Docker

### Bước 1 — Kiểm tra phiên bản Ubuntu

```bash
lsb_release -a
# Expected output:
# Distributor ID: Ubuntu
# Release:        22.04
# Codename:       jammy
```

```bash
uname -m
# Expected: x86_64 (hoặc aarch64 cho ARM)
```

### Bước 2 — Cập nhật package list

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### Bước 3 — Cài các package phụ thuộc

```bash
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release
```

### Bước 4 — Thêm Docker GPG key chính thức

```bash
sudo install -m 0755 -d /etc/apt/keyrings

sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    -o /etc/apt/keyrings/docker.asc

sudo chmod a+r /etc/apt/keyrings/docker.asc
```

Kiểm tra key đã thêm thành công:
```bash
ls -la /etc/apt/keyrings/docker.asc
# Expected: -r--r--r-- 1 root root ... /etc/apt/keyrings/docker.asc
```

### Bước 5 — Thêm Docker APT repository chính thức

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Cập nhật lại package list với repo mới
sudo apt-get update
```

Kiểm tra repository:
```bash
cat /etc/apt/sources.list.d/docker.list
# Expected: deb [arch=amd64 signed-by=...] https://download.docker.com/linux/ubuntu jammy stable
```

### Bước 6 — Cài Docker Engine, CLI, containerd, Buildx và Compose

```bash
sudo apt-get install -y \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin
```

> **Lưu ý:** Lệnh trên cài đặt tất cả 5 thành phần cần thiết trong một lệnh duy nhất.

### Bước 7 — Khởi động Docker và bật tự động khi reboot

```bash
# Khởi động Docker service ngay lập tức
sudo systemctl start docker

# Bật Docker tự động khởi động cùng hệ điều hành
sudo systemctl enable docker

# Kiểm tra trạng thái
sudo systemctl status docker
# Expected: Active: active (running)
```

### Bước 8 — Cho phép user hiện tại dùng Docker không cần sudo

```bash
# Thêm user vào group docker
sudo usermod -aG docker $USER

# Áp dụng ngay (không cần logout)
newgrp docker
```

> **Quan trọng:** Nếu không chạy `newgrp docker`, bạn cần logout và login lại để thay đổi có hiệu lực. Để kiểm tra:
> ```bash
> groups $USER
> # Expected: ... docker ...
> ```

---

## 4. Kiểm tra cài đặt

### 4.1. Kiểm tra phiên bản

```bash
docker --version
# Expected: Docker version 27.x.x, build ...

docker compose version
# Expected: Docker Compose version v2.x.x

docker buildx version
# Expected: github.com/docker/buildx v0.x.x ...
```

### 4.2. Kiểm tra Docker service

```bash
sudo systemctl status docker
# Expected:
# ● docker.service - Docker Application Container Engine
#    Loaded: loaded (/lib/systemd/system/docker.service; enabled; ...)
#    Active: active (running) since ...
```

### 4.3. Kiểm tra Docker tự khởi động khi reboot

```bash
sudo systemctl is-enabled docker
# Expected: enabled
```

### 4.4. Chạy container thử nghiệm

```bash
docker run hello-world
# Expected output (rút gọn):
# Hello from Docker!
# This message shows that your installation appears to be working correctly.
```

### 4.5. Kiểm tra Docker Compose với file dự án

```bash
# Trong thư mục QuickStay
docker compose -f docker-compose.prod.yml config --quiet
# Expected: không có output lỗi, exit code 0
```

---

## 5. Kết quả kiểm thử

> **Môi trường thực hiện:** Không có quyền truy cập VPS Ubuntu thật. Tài liệu được chuẩn bị dựa trên tài liệu chính thức Docker và T134.

| # | Kiểm tra | Lệnh | Kết quả mong đợi | Trạng thái |
|---|---------|------|-----------------|-----------|
| T145-01 | Phiên bản Ubuntu | `lsb_release -a` | Ubuntu 22.04+ | ⚠️ Not Run |
| T145-02 | Docker Engine cài thành công | `docker --version` | Docker 24+ | ⚠️ Not Run |
| T145-03 | Docker Compose Plugin | `docker compose version` | v2.x.x | ⚠️ Not Run |
| T145-04 | Docker Buildx Plugin | `docker buildx version` | v0.x.x | ⚠️ Not Run |
| T145-05 | Docker service active | `systemctl status docker` | `active (running)` | ⚠️ Not Run |
| T145-06 | Docker tự khởi động | `systemctl is-enabled docker` | `enabled` | ⚠️ Not Run |
| T145-07 | Docker không cần sudo | `docker ps` (không có sudo) | Không có permission error | ⚠️ Not Run |
| T145-08 | Container thử nghiệm | `docker run hello-world` | "Hello from Docker!" | ⚠️ Not Run |
| T145-09 | Docker Compose config | `docker compose -f docker-compose.prod.yml config --quiet` | Exit code 0 | ⚠️ Not Run |
| T145-10 | Docker tự khởi động sau reboot | `sudo reboot` → `docker ps` | Service active | ⚠️ Not Run |

> **Lý do Not Run:** Chưa có quyền truy cập SSH vào máy chủ Ubuntu. Các lệnh đã được xác minh đúng cú pháp theo tài liệu chính thức Docker (https://docs.docker.com/engine/install/ubuntu/).

---

## 6. Lỗi thường gặp và cách xử lý

### Lỗi 1: `Got permission denied while trying to connect to Docker daemon`

```
Got permission denied while trying to connect to the Docker daemon socket
```

**Nguyên nhân:** User chưa được thêm vào group `docker`.

**Cách sửa:**
```bash
sudo usermod -aG docker $USER
newgrp docker
# Hoặc logout và login lại
```

---

### Lỗi 2: `Cannot connect to the Docker daemon`

```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Nguyên nhân:** Docker service chưa chạy.

**Cách sửa:**
```bash
sudo systemctl start docker
sudo systemctl status docker  # Kiểm tra log nếu vẫn lỗi
journalctl -u docker -n 50    # Xem log chi tiết
```

---

### Lỗi 3: `Package docker-ce has no installation candidate`

**Nguyên nhân:** Chưa thêm Docker APT repository hoặc repository không phù hợp với Ubuntu version.

**Cách sửa:**
```bash
# Xóa repository cũ nếu có
sudo rm /etc/apt/sources.list.d/docker.list

# Thực hiện lại Bước 4 và Bước 5 trong tài liệu này
# Đảm bảo VERSION_CODENAME đúng:
. /etc/os-release && echo $VERSION_CODENAME
# Expected: jammy (22.04) hoặc noble (24.04)
```

---

### Lỗi 4: GPG key lỗi khi apt-get update

```
W: GPG error: https://download.docker.com/linux/ubuntu ... NO_PUBKEY
```

**Cách sửa:**
```bash
# Xóa key cũ và thêm lại
sudo rm /etc/apt/keyrings/docker.asc
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo apt-get update
```

---

### Lỗi 5: Docker Compose không tìm thấy (`compose: command not found`)

**Nguyên nhân:** Đã cài `docker-compose` (standalone, v1) thay vì `docker-compose-plugin` (v2).

**Cách sửa:**
```bash
# Gỡ docker-compose standalone cũ nếu có
sudo apt-get remove docker-compose

# Cài plugin đúng
sudo apt-get install -y docker-compose-plugin

# Kiểm tra lại
docker compose version
```

---

### Lỗi 6: `port is already allocated` khi chạy docker-compose

```
Error response from daemon: driver failed programming external connectivity:
Bind for 0.0.0.0:8081 failed: port is already allocated
```

**Cách sửa:**
```bash
# Tìm process đang dùng port 8081
sudo ss -tlnp | grep 8081
# hoặc
sudo lsof -i :8081

# Dừng process đó hoặc đổi FRONTEND_PORT trong .env
FRONTEND_PORT=8082
```

---

## 7. Kiểm tra sau khi khởi động lại máy chủ

Sau khi reboot, thực hiện các lệnh sau để xác nhận Docker hoạt động đúng:

```bash
# 1. Kiểm tra Docker service tự khởi động
sudo systemctl status docker
# Expected: active (running)

# 2. Kiểm tra containers tự khởi động (nếu dùng restart: unless-stopped)
docker ps
# Expected: danh sách containers đang chạy

# 3. Kiểm tra QuickStay còn chạy
docker compose -f ~/QuickStay/docker-compose.prod.yml ps
# Expected: mysql, backend, frontend đều Up

# 4. Kiểm tra health endpoint
curl http://localhost:8080/actuator/health
# Expected: {"status":"UP"}

# 5. Kiểm tra frontend
curl -I http://localhost:8081
# Expected: HTTP/1.1 200 OK
```

> **Lưu ý:** Containers có `restart: unless-stopped` trong `docker-compose.prod.yml` sẽ tự động khởi động lại sau reboot mà không cần chạy lại lệnh `docker compose up`.

---

## 8. Gỡ cài đặt (nếu cần)

> ⚠️ **Cảnh báo:** Chỉ thực hiện khi thực sự cần thiết. Lệnh dưới đây sẽ xóa Docker và tất cả containers/images.

```bash
# Dừng tất cả containers
docker compose -f docker-compose.prod.yml down

# Gỡ Docker packages
sudo apt-get purge -y docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin

# Xóa data directory (CẢNH BÁO: mất tất cả images, volumes)
# sudo rm -rf /var/lib/docker
# sudo rm -rf /var/lib/containerd
```

---

## 9. Tài liệu tham khảo

- [Docker Engine Install on Ubuntu – Tài liệu chính thức](https://docs.docker.com/engine/install/ubuntu/)
- [Docker Compose Plugin](https://docs.docker.com/compose/install/linux/)
- [docker-compose.prod.yml](../../docker-compose.prod.yml)
- [T134 – Deployment Environment Report](../test-reports/T134-deployment-environment-report.md)
- [README – VPS Deployment Guide](../../README.md)
