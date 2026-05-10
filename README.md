# Authentication & Profile Management API

Một backend Node.js/Express hoàn chỉnh cho hệ thống xác thực người dùng và quản lý profile với kiến trúc 3 tầng, JWT authentication, và role-based authorization.

**Author**: Nhóm 13  
**Công nghệ**: Express.js, Sequelize, MySQL, JWT, bcryptjs

## 📋 Danh sách tính năng

### ✅ Hiện có
- [x] Login với JWT + Refresh Token Rotation
- [x] Refresh Token Management (revoke, rotation)
- [x] Logout
- [x] Edit Profile (User & Admin)
- [x] Role-based Authorization (user, admin)
- [x] Input Validation (express-validator)
- [x] Rate Limiting
- [x] Password Hash (bcryptjs)

### 📝 Chưa implement
- [ ] Register (OTP verification via email)
- [ ] Forgot Password (OTP reset via email)
- [ ] Change Password
- [ ] File Upload (Avatar)

---

## 🚀 Quick Start

### 1. Installation

```bash
# Clone repo
git clone <repo-url>
cd Nhom13

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env với thông tin database của bạn
```

### 2. Database Setup

```bash
# Create database
mysql -u root -p
CREATE DATABASE node_fulltask CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# Run migrations
npx sequelize-cli db:migrate
```

### 3. Start Server

```bash
npm start
# Server chạy trên http://localhost:6969
```

---

## 📚 API Endpoints

### Authentication Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/login` | No | Đăng nhập, nhận JWT tokens |
| POST | `/refresh` | No | Refresh access token |
| POST | `/logout` | Yes | Đăng xuất, revoke token |

### Profile Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/user/profile` | User/Admin | Lấy profile của user/admin |
| PATCH | `/user/profile` | User/Admin | Edit profile của user/admin |
| GET | `/admin/profile` | Admin | Xác nhận quyền admin |
| PATCH | `/admin/profile/:userId?` | Admin | Edit profile user khác (admin only) |
| GET | `/profile` | Any | Generic profile endpoint |

---

## 🔒 Security Features

### 1. **JWT Authentication**
- Access Token: 15 phút
- Refresh Token: 7 ngày
- Stored in httpOnly cookies

### 2. **Authorization**
- Role-based access control (RBAC)
- User: Edit chỉ profile của chính họ
- Admin: Edit profile user và chính admin

### 3. **Validation**
- Email format validation
- Phone number validation (VN format)
- Field length limits
- Input trimming (XSS protection)

### 4. **Rate Limiting**
- Login: 5 requests/15 minutes
- Edit Profile: 10 requests/hour

### 5. **Password Security**
- Bcrypt hashing (salt rounds: default)
- Never return password in response

---

## 📖 Chi tiết chức năng Edit Profile

Xem file [EDIT_PROFILE_API.md](EDIT_PROFILE_API.md) để có tài liệu chi tiết:
- Request/Response examples
- Validation rules
- Error handling
- Testing scenarios
- cURL examples

### Quick Example

```bash
# Login
curl -X POST http://localhost:6969/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}' \
  -c cookies.txt

# Edit profile
curl -X PATCH http://localhost:6969/user/profile \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "firstName": "John",
    "phoneNumber": "0912345678"
  }'
```

---

## 🏗️ Project Structure

```
src/
├── config/
│   ├── config.json          # Sequelize config
│   ├── configdb.js          # Database connection
│   └── viewEngine.js        # Express view setup
├── controllers/
│   └── auth.controller.js   # Business logic (login, refresh, logout, edit profile)
├── middleware/
│   └── auth.middleware.js   # JWT verify, authorize, validation
├── migrations/
│   ├── migration-create-user.js
│   └── migration-create-z-refreshtoken.js
├── models/
│   ├── index.js             # Sequelize init
│   ├── users.js             # User model
│   └── refreshTokens.js     # RefreshToken model
├── route/
│   ├── auth.routes.js       # Auth endpoints
│   └── web.js               # Route initialization
├── utils/
│   └── jwt.js               # JWT utility functions
├── validations/
│   └── auth.validation.js   # Input validation rules
└── server.js                # Express app entry
```

---

## 🧪 Testing

### Manual Testing (cURL)

```bash
# 1. Login
curl -X POST http://localhost:6969/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# 2. Update profile
curl -X PATCH http://localhost:6969/user/profile \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=<jwt_token>" \
  -d '{"firstName":"Updated Name"}'
```

### Automated Testing (Bash Script)

```bash
chmod +x test-edit-profile.sh
./test-edit-profile.sh
```

Script sẽ test:
- ✓ Login
- ✓ Get profile
- ✓ Valid update
- ✓ Email validation
- ✓ Phone validation
- ✓ Field length validation
- ✓ Auth protection

---

## 📦 Dependencies

### Main
- **express** (5.2.1) - Web framework
- **sequelize** (6.37.8) - ORM
- **mysql2** (3.22.3) - MySQL driver
- **jsonwebtoken** (9.0.3) - JWT handling
- **bcryptjs** (3.0.3) - Password hashing
- **express-validator** (7.3.2) - Input validation
- **express-rate-limit** (8.5.1) - Rate limiting
- **dotenv** (17.4.2) - Environment variables
- **ejs** (5.0.2) - View engine
- **body-parser** (2.2.2) - Request body parsing
- **cookie-parser** (1.4.7) - Cookie parsing

### Dev
- **@babel/core** (7.29.0) - ES6+ transpiler
- **@babel/node** (7.29.0) - Babel CLI
- **nodemon** (3.1.14) - Auto restart
- **sequelize-cli** (6.6.5) - Database migrations

---

## ⚙️ Environment Variables

Tạo file `.env` từ `.env.example`:

```env
PORT=6969

# JWT
ACCESS_TOKEN_SECRET=your_secret_key_min_32_chars
REFRESH_TOKEN_SECRET=your_secret_key_min_32_chars

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=node_fulltask
DB_USER=root
DB_PASSWORD=1234567@a$

NODE_ENV=development
```

---

## 🔗 Git Workflow (for team members)

```bash
# 1. Clone repo
git clone <group-repo-url>
cd Nhom13

# 2. Create feature branch
git checkout -b feature/edit-profile

# 3. Make changes
# ... edit files ...

# 4. Stage & commit
git add .
git commit -m "feat: implement edit profile for user and admin"

# 5. Push to personal repo
git push origin feature/edit-profile

# 6. Create Pull Request to group repo
# Go to GitHub, create PR from your fork to group repo

# 7. After merge
git checkout main
git pull origin main
```

---

## 🐛 Common Issues & Solutions

### Issue: `Cannot find module 'dotenv'`
```bash
npm install dotenv
```

### Issue: `Database connection refused`
- Check MySQL is running
- Verify DB credentials in `.env`
- Ensure database `node_fulltask` exists

### Issue: `Port 6969 already in use`
```bash
# Change PORT in .env or kill process
lsof -i :6969  # macOS/Linux
netstat -ano | findstr :6969  # Windows
```

### Issue: `JWT verification failed`
- Check token has not expired
- Verify `ACCESS_TOKEN_SECRET` matches
- Ensure cookie is being sent

---

## 📝 License

ISC

---

## 👥 Contributors

- Nhóm 13
- Edit Profile Feature: [Your Name]

---

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra file `EDIT_PROFILE_API.md` cho tài liệu chi tiết
2. Xem log terminal và error messages
3. Chạy script test: `./test-edit-profile.sh`
4. Ask teammates hoặc create GitHub issue