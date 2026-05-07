# AI Coding

基于 **Next.js 16 + Prisma 7 + MySQL 8.4** 的全栈 Web 应用，实现用户管理 CRUD 功能。

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| [Next.js](https://nextjs.org/) | 16 | React 全栈框架（App Router） |
| [Prisma](https://www.prisma.io/) | 7 | 数据库 ORM |
| [MySQL](https://www.mysql.com/) | 8.4 | 关系型数据库 |
| [TypeScript](https://www.typescriptlang.org/) | 5 | 类型安全 |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | 原子化 CSS 框架 |

## 功能

- 用户列表展示
- 新增用户
- 编辑用户信息
- 删除用户（带确认弹窗）
- 邮箱唯一性校验

## 项目结构

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # 根布局
│   ├── page.tsx                # 首页
│   ├── globals.css             # 全局样式
│   ├── users/
│   │   ├── page.tsx            # 用户列表页
│   │   ├── new/page.tsx        # 新增用户页
│   │   └── [id]/edit/page.tsx  # 编辑用户页
│   └── api/users/
│       ├── route.ts            # GET/POST /api/users
│       └── [id]/route.ts       # GET/PUT/DELETE /api/users/:id
├── components/                 # 可复用组件
│   ├── Navbar.tsx
│   ├── UserForm.tsx
│   └── DeleteButton.tsx
└── lib/
    └── prisma.ts               # Prisma 客户端
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/users` | 获取用户列表 |
| POST | `/api/users` | 创建用户 |
| GET | `/api/users/:id` | 获取单个用户 |
| PUT | `/api/users/:id` | 更新用户 |
| DELETE | `/api/users/:id` | 删除用户 |

## 快速开始

### 前置条件

- Node.js 18+
- MySQL 8.4（可通过 Docker 部署）

```bash
docker run -d \
  --name mysql \
  -e MYSQL_ROOT_PASSWORD=your_password \
  -p 3306:3306 \
  mysql:8.4
```

### 安装运行

```bash
git clone https://github.com/你的用户名/ai-coding.git
cd ai-coding

cp .env.example .env
# 编辑 .env，填入你的数据库连接信息

npm install

npx prisma migrate dev

npm run dev
```

访问 http://localhost:3000 查看应用。

### 环境变量

复制 `.env.example` 为 `.env` 并修改：

```env
DATABASE_URL="mysql://root:PASSWORD@localhost:3306/ai_coding"
DATABASE_HOST="localhost"
DATABASE_PORT="3306"
DATABASE_USER="root"
DATABASE_PASSWORD="PASSWORD"
DATABASE_NAME="ai_coding"
```

> ⚠️ 密码中包含特殊字符（如 `@`）时，DATABASE_URL 中需使用 URL 编码（`%40`）。

## 可用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npm start            # 启动生产服务器
npm run lint         # 代码检查
npm run db:migrate   # 数据库迁移
npm run db:generate  # 生成 Prisma Client
npm run db:push      # 推送 Schema 到数据库
npm run db:studio    # 打开 Prisma Studio
```

## License

MIT
