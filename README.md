# ⚙️ SCharity Backend - Node.js & Express API

<div align="center">

[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeORM](https://img.shields.io/badge/TypeORM-FE0808?style=for-the-badge&logo=typeorm&logoColor=white)](https://typeorm.io/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)

**Hệ thống API cốt lõi xử lý nghiệp vụ, quản trị dự án và giao dịch tài chính minh bạch.**

</div>

---

## 🚀 Overview

Backend của SCharity được thiết kế theo kiến trúc hướng module, đảm bảo tính mở rộng và an toàn dữ liệu. Chúng tôi sử dụng **TypeScript** để kiểm soát lỗi chặt chẽ và **PostgreSQL** làm cơ sở dữ liệu quan hệ chính để quản lý dòng tiền quyên góp.

---

## 🛠️ Tech Stack & Tools

- **Engine**: Node.js & Express.js
- **Database**: PostgreSQL with **TypeORM** (Data Mapper pattern)
- **Validation**: Class-validator & Zod
- **Async Tasks**: **BullMQ** & Redis for background job processing (Emails, Statistics)
- **Storage**: AWS S3 for campaign media and verification documents
- **Documentation**: **Swagger UI** (OpenAPI 3.0)
- **Security**: JWT-based auth, Passport.js, Helmet, Rate-limiting

---

## 📂 Architecture & Directory Structure

```text
SCharity_BE/
├── src/
│   ├── config/         # Database, Redis, S3 configurations
│   ├── controllers/    # Request handling logic
│   ├── services/       # Core business logic layer
│   ├── entities/       # TypeORM Database models
│   ├── routes/         # API Route definitions
│   ├── middlewares/    # Auth, Error handling, Validation
│   ├── migrations/     # Database version control
│   └── jobs/           # BullMQ worker handlers
```

---

## 🔌 Core Integrations

### 💳 Payment Gateway (PayOS)
Xử lý quyên góp qua cổng **PayOS**. Hệ thống sử dụng Webhooks để đồng bộ trạng thái giao dịch một cách minh bạch ngay khi nhà tài trợ hoàn tất thanh toán.

### 📧 Notification Service
Tự động gửi email xác nhận quyên góp, thông báo phê duyệt chiến dịch thông qua Redis Queue để không ảnh hưởng đến hiệu năng API chính.

### 📁 Media Management
Hỗ trợ upload ảnh/video minh chứng cho bài đăng Timeline thông qua AWS S3 với Presigned URLs để đảm bảo bảo mật.

---

## 🚀 Setup & Execution

### Environment Variables (.env)
Tham khảo `.env.example` để cấu hình các thông số:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`
- `APP_TIMEZONE`
- `REDIS_URL`
- `AWS_S3_BUCKET`, `AWS_ACCESS_KEY`
- `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`

### Commands
```bash
# Install dependencies
npm install

# Run migration
npm run migration:run

# Development mode
npm run dev

# Build for production
npm run build

# Swagger Docs
# Available at: http://localhost:5000/api-docs
```

---

<div align="center">
  <sub>SCharity Backend - The engine of transparency.</sub>
</div>
