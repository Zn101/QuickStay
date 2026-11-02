# QuickStay — Sơ đồ Kiến trúc Hệ thống

> Phiên bản 1.1 · 28/10/2026 · Nhóm 05

---

## 1. Tổng quan

QuickStay là hệ thống đặt phòng khách sạn gồm:

| Tầng | Công nghệ | Mô tả |
|---|---|---|
| **Frontend** | React 18 + Vite + Tailwind | SPA chạy trên Nginx |
| **Reverse Proxy** | Nginx (Alpine) | Phục vụ static files, forward `/api` → backend |
| **Backend** | Spring Boot 3.5 (Java 17) | REST API, JWT, Spring Security |
| **Database** | MySQL 8.4 | Lưu trữ dữ liệu chính |
| **AI (tuỳ chọn)** | Anthropic Claude API | Sinh mô tả khách sạn, chatbot |
| **Container** | Docker Compose | Orchestration toàn hệ thống |

---

## 2. Sơ đồ kiến trúc tổng thể

```mermaid
flowchart TD
    subgraph CLIENT["🌐 Client"]
        B["Trình duyệt\n(Browser)"]
    end

    subgraph DOCKER["🐳 Docker Compose Network"]
        subgraph FE_LAYER["Frontend Container · Port 8081"]
            N["Nginx\n(Reverse Proxy)"]
            F["React SPA\n(Static Files)"]
        end

        subgraph BE_LAYER["Backend Container · Port 8080"]
            SC["Spring Security\n+ JWT Filter"]
            CTL["Controllers\n(REST API)"]
            SVC["Services\n(Business Logic)"]
            JPA["Spring Data JPA\n(Repositories)"]
        end

        subgraph DB_LAYER["Database Container"]
            DB[("MySQL 8.4\nPort 3306")]
            VOL[("Volume:\nmysql-data")]
        end
    end

    subgraph EXTERNAL["☁️ External Services"]
        AI["Anthropic API\n(Claude)"]
    end

    B -->|"HTTP :8081"| N
    N -->|"Static files"| F
    N -->|"Proxy /api/*"| SC
    SC --> CTL
    CTL --> SVC
    SVC --> JPA
    JPA -->|"JDBC / JPA"| DB
    DB --- VOL
    SVC -.->|"ANTHROPIC_API_KEY\n(tuỳ chọn)"| AI
```

---

## 3. Sơ đồ Frontend (React SPA)

```mermaid
flowchart TD
    subgraph ROUTER["React Router v6"]
        HOME["/ → Home\n(Tìm kiếm khách sạn)"]
        HOTEL["/hotels/:id → HotelDetail\n(Danh sách phòng)"]
        BOOK["/book → BookingPage\n(Đặt phòng)"]
        HIST["/history → History\n(Lịch sử đặt phòng)"]
        PROF["/profile → Profile\n(Thông tin cá nhân)"]
        AUTH["/login, /register → Auth pages"]
        ADMIN["/admin → Admin Dashboard\n(Quản lý toàn hệ thống)"]
    end

    subgraph STORE["Zustand State Management"]
        AS["authStore\n(user, token, login, logout)"]
    end

    subgraph API_LAYER["API Layer (lib/api.js)"]
        AX["fetch / REST calls\n(Base URL: /api)"]
    end

    HOME --> HOTEL --> BOOK
    HOME --> HIST
    HOME --> PROF
    HOME --> AUTH
    HOME --> ADMIN
    ROUTER -->|"Đọc/Ghi state"| STORE
    ROUTER -->|"Gọi REST"| API_LAYER
```

---

## 4. Sơ đồ Backend (Spring Boot)

```mermaid
flowchart TD
    subgraph SECURITY["Spring Security"]
        FILTER["JwtAuthFilter\n(Xác thực Bearer token)"]
        SEC_CFG["SecurityConfig\n(Permit public / restrict admin)"]
    end

    subgraph CONTROLLERS["Controllers (REST)"]
        AUTH_C["AuthController\n/api/auth/**"]
        USER_C["UserController\n/api/users/**"]
        HOTEL_C["HotelController\n/api/hotels/**"]
        BOOK_C["BookingController\n/api/bookings/**"]
        AI_C["AiController\n/api/ai/**"]
        ADMIN_C["AdminController\n/api/admin/**"]
    end

    subgraph SERVICES["Services (Business Logic)"]
        USER_S["UserService\n(Đăng ký, đăng nhập, JWT)"]
        HOTEL_S["HotelService\n(CRUD khách sạn & phòng,\nkiểm tra phòng trống)"]
        BOOK_S["BookingService\n(Đặt phòng, chống đặt trùng\nPESSIMISTIC_WRITE)"]
        AI_S["AiService\n(Sinh mô tả / chatbot,\nnội dung dự phòng nếu không có key)"]
    end

    subgraph REPOS["Repositories (Spring Data JPA)"]
        USER_R["UserRepository"]
        HOTEL_R["HotelRepository"]
        ROOM_R["RoomRepository"]
        BOOK_R["BookingRepository"]
    end

    FILTER --> CONTROLLERS
    SEC_CFG --> FILTER
    AUTH_C --> USER_S
    USER_C --> USER_S
    HOTEL_C --> HOTEL_S
    BOOK_C --> BOOK_S
    AI_C --> AI_S
    ADMIN_C --> HOTEL_S
    ADMIN_C --> BOOK_S
    USER_S --> USER_R
    HOTEL_S --> HOTEL_R
    HOTEL_S --> ROOM_R
    BOOK_S --> BOOK_R
    BOOK_S --> ROOM_R
```

---

## 5. Sơ đồ Database (ERD)

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : "đặt phòng"
    HOTELS ||--o{ ROOMS : "có các loại phòng"
    ROOMS ||--o{ BOOKINGS : "được đặt trong"

    USERS {
        bigint id PK
        varchar email UK "NOT NULL, lowercase"
        varchar password_hash "BCrypt"
        varchar full_name
        varchar phone
        varchar role "CUSTOMER or ADMIN"
        timestamp created_at
    }

    HOTELS {
        bigint id PK
        varchar name "NOT NULL"
        varchar city "NOT NULL"
        varchar address
        varchar description "max 4000, AI-generated"
        varchar image_url "max 1000"
        varchar amenities "max 1000, comma-separated"
    }

    ROOMS {
        bigint id PK
        bigint hotel_id FK
        varchar room_type "NOT NULL"
        decimal price_per_night "NOT NULL"
        int capacity "max guests"
        int quantity "rooms of this type"
        varchar description "max 2000"
    }

    BOOKINGS {
        bigint id PK
        bigint user_id FK
        bigint room_id FK
        date check_in
        date check_out "not counted as night"
        int guests
        varchar guest_name
        varchar guest_phone
        varchar note "max 1000"
        decimal total_price
        varchar status "PENDING|CONFIRMED|CHECKED_IN|COMPLETED|CANCELLED"
        timestamp created_at
    }
```

---

## 6. Sơ đồ Docker Compose

```mermaid
flowchart LR
    subgraph COMPOSE["docker-compose.yml"]
        subgraph SVC_MYSQL["service: mysql"]
            IMG_MY["image: mysql:8.4"]
            HC["healthcheck:\nmysqladmin ping"]
            VOL_MY[("volume: mysql-data")]
        end

        subgraph SVC_BE["service: backend"]
            IMG_BE["build: ./backend\nGradle bootJar → app.jar"]
            PORT_BE["port: 8080:8080"]
        end

        subgraph SVC_FE["service: frontend"]
            IMG_FE["build: ./frontend\nnpm build → Nginx"]
            PORT_FE["port: 8081:80"]
        end
    end

    ENV[".env\nJWT_SECRET, DB_PASSWORD\nANTHROPIC_API_KEY ..."]

    SVC_FE -->|"depends_on"| SVC_BE
    SVC_BE -->|"depends_on\nservice_healthy"| SVC_MYSQL
    SVC_MYSQL --- VOL_MY
    ENV -.->|"env vars"| SVC_MYSQL
    ENV -.->|"env vars"| SVC_BE
    ENV -.->|"env vars"| SVC_FE
```

---

## 7. Luồng xử lý request (Request Flow)

### 7.1. Luồng đăng nhập

```mermaid
sequenceDiagram
    actor User as Nguoi dung
    participant FE as React SPA
    participant Nginx as Nginx
    participant BE as Spring Boot
    participant DB as MySQL

    User->>FE: Nhap email + mat khau
    FE->>Nginx: POST /api/auth/login
    Nginx->>BE: Proxy POST /api/auth/login
    BE->>DB: SELECT users WHERE email=?
    DB-->>BE: User record
    BE->>BE: BCrypt.verify(password, hash)
    BE->>BE: Tao JWT token
    BE-->>Nginx: 200 OK token + user
    Nginx-->>FE: 200 OK token + user
    FE->>FE: authStore.login(token, user)
    FE-->>User: Chuyen trang, hien thi header
```

### 7.2. Luồng đặt phòng (chống đặt trùng)

```mermaid
sequenceDiagram
    actor User as Nguoi dung
    participant FE as React SPA
    participant BE as Spring Boot
    participant DB as MySQL

    User->>FE: Chon phong, nhap ngay, submit
    FE->>BE: POST /api/bookings Bearer JWT
    BE->>BE: JwtAuthFilter xac thuc token
    BE->>DB: BEGIN TRANSACTION
    BE->>DB: SELECT rooms WHERE id=? FOR UPDATE
    DB-->>BE: Room record locked
    BE->>DB: SELECT COUNT bookings WHERE room_id=? AND overlap AND status!=CANCELLED
    DB-->>BE: count so don chong lan
    alt con phong (count < quantity)
        BE->>DB: INSERT INTO bookings
        BE->>DB: COMMIT
        BE-->>FE: 201 Created booking
        FE-->>User: Dat phong thanh cong
    else het phong
        BE->>DB: ROLLBACK
        BE-->>FE: 409 Conflict
        FE-->>User: Phong da het trong khoang thoi gian nay
    end
```

### 7.3. Luồng AI (với fallback)

```mermaid
sequenceDiagram
    participant BE as Spring Boot
    participant AI_S as AiService
    participant AI as Anthropic API

    BE->>AI_S: generateDescription(hotel)
    AI_S->>AI_S: Kiem tra ANTHROPIC_API_KEY
    alt co API key
        AI_S->>AI: POST /v1/messages model + prompt
        AI-->>AI_S: Mo ta khach san
        AI_S-->>BE: Noi dung tu AI
    else khong co key hoac loi
        AI_S->>AI_S: Tao noi dung du phong tu DB
        AI_S-->>BE: Noi dung du phong
    end
```

---

## 8. Bảng tóm tắt công nghệ

| Thành phần | Công nghệ | Phiên bản | Vai trò |
|---|---|---|---|
| Frontend | React + Vite | 18 / 6.x | SPA đặt phòng |
| State Management | Zustand | 5.x | Global auth state |
| Styling | Tailwind CSS | 3.x | UI |
| Reverse Proxy | Nginx | Alpine | Phục vụ SPA, proxy API |
| Backend | Spring Boot | 3.5.6 | REST API |
| Ngôn ngữ | Java | 17 | Backend runtime |
| Security | Spring Security + jjwt | 0.12.6 | Xác thực, phân quyền |
| ORM | Spring Data JPA / Hibernate | 3.x | Truy cập DB |
| Database | MySQL | 8.4 | Lưu trữ chính |
| Dev DB | H2 in-memory | — | Phát triển local |
| AI | Anthropic Claude | claude-* | Sinh mô tả, chatbot |
| Test | JUnit 5 / Vitest / E2E mjs | — | 46 BE + 8 FE + E2E |
| Container | Docker + Compose | — | Triển khai |
| CI/CD | GitHub Actions | — | Build, test, push GHCR |

---

## 9. Tài liệu liên quan

- [README](../README.md)
- [ERD và từ điển dữ liệu](QuickStay-ERD.md)
- [API Reference](QuickStay-API.md)
- [Test Report](QuickStay-Test-Report.md)
- [Docker Compose](../docker-compose.yml)
