# AI Coding

基于 **Next.js 16 + React 19 + Prisma 7 + MySQL 8.4** 构建的后台管理系统示例。当前最新版本已同步高风险修复后的实现，具备完整的认证鉴权、RBAC 权限控制、系统管理、日志审计与基础安全增强能力，可作为中后台管理平台的起点项目。

## 项目概览

当前版本已经不是简单的用户 CRUD，而是一个包含初始化、登录保护、权限路由、日志追踪和基础审计能力的管理后台骨架。

核心能力包括：

- 用户名密码登录与退出登录
- 登录页滑块验证码校验
- 基于 `admin_session` Cookie 的服务端 Session 管理
- 首次启动一键初始化默认部门、角色、菜单、权限与管理员账号
- 页面权限与按钮权限双层 RBAC 控制
- 动态侧边栏菜单与后台路由守卫
- 工作台统计面板
- 用户、角色、菜单、部门管理
- 个人资料维护与修改当前登录用户密码
- 登录日志与操作日志查询
- 日志敏感字段脱敏

## 安全增强

本版本已包含以下与高风险问题修复相关的能力：

- 登录接口强制校验滑块验证码，验证码服务端校验且一次性使用
- 密码在服务端使用 `bcryptjs` 哈希存储，不明文落库
- 修改本人密码后会主动清理该用户所有会话，并要求重新登录
- 管理员重置用户密码后会清理目标用户所有会话
- 登录成功、登录失败、退出登录都会写入日志
- 新增、修改、删除等后台操作写入操作日志
- 操作日志中的 `password`、`token`、`secret` 等敏感字段会自动脱敏
- API 权限校验统一走服务端权限断言，未登录或无权限请求会被拦截

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| [Next.js](https://nextjs.org/) | 16 | React 全栈框架，使用 App Router |
| [React](https://react.dev/) | 19 | 前端 UI 渲染 |
| [Prisma](https://www.prisma.io/) | 7 | ORM 与数据库访问 |
| [@prisma/adapter-mariadb](https://www.prisma.io/docs/orm/overview/databases/mysql) | 7 | Prisma MariaDB/MySQL 连接适配器 |
| [MySQL](https://www.mysql.com/) | 8.4 | 关系型数据库 |
| [TypeScript](https://www.typescriptlang.org/) | 5 | 类型安全 |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | 界面样式 |
| [Zod](https://zod.dev/) | 4 | 请求参数校验 |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | 3 | 密码哈希 |

## 功能模块

### 1. 认证与会话

- 根路由根据登录态自动跳转到 `/login` 或 `/admin`
- 登录使用用户名、密码与滑块验证码三项校验
- 登录成功后创建服务端 Session，并写入 `admin_session` Cookie
- Session 默认有效期为 7 天
- 退出登录时会同时清理会话并更新登录日志的登出时间

### 2. 权限与菜单

- 支持超级管理员与普通角色权限模型
- 支持目录、菜单、按钮三种资源类型
- 页面访问与接口访问都通过权限点校验
- 侧边栏菜单根据当前用户权限动态渲染

### 3. 系统管理

- 工作台：统计用户、角色、菜单、部门数量
- 用户管理：分页查询、新增、编辑、删除、重置密码、分配角色和部门
- 角色管理：维护角色基础信息与菜单权限
- 菜单管理：维护目录、菜单、按钮权限与显示状态
- 部门管理：维护树形结构部门，并处理祖级链路
- 个人中心：维护昵称、邮箱、手机号、备注与个人密码

### 4. 日志审计

- 登录日志：记录用户名、IP、UA、登录状态、登录时间、登出时间和提示信息
- 操作日志：记录模块、操作类型、请求地址、请求参数、响应数据、IP、耗时与错误信息
- 日志列表支持按用户名、状态、时间区间等条件筛选
- 操作日志支持详情展开查看脱敏后的请求与响应内容

## 初始化默认数据

当系统中不存在任何后台账号时，登录页会显示“初始化系统默认数据”按钮。首次初始化会自动创建以下内容：

- 根部门：`总部`
- 默认角色：`超级管理员`
- 默认用户：`admin`
- 默认密码：`Admin123!`
- 默认菜单：
  - 工作台
  - 系统管理
  - 用户管理
  - 角色管理
  - 菜单管理
  - 部门管理
  - 日志管理
  - 操作日志
  - 登录日志
- 默认按钮权限：
  - `system:user:create`
  - `system:user:update`
  - `system:user:delete`
  - `system:role:create`
  - `system:role:update`
  - `system:role:delete`
  - `system:menu:create`
  - `system:menu:update`
  - `system:menu:delete`
  - `system:dept:create`
  - `system:dept:update`
  - `system:dept:delete`
  - `log:oper:delete`
  - `log:oper:export`
  - `log:login:delete`
  - `log:login:export`

首次登录后建议立即在个人中心修改默认密码。

## 数据模型

Prisma Schema 当前包含以下核心实体：

- `SysUser`：系统用户
- `SysRole`：系统角色
- `SysMenu`：菜单、目录、按钮权限资源
- `SysDept`：系统部门
- `SysUserRole`：用户与角色关联表
- `SysRoleMenu`：角色与菜单关联表
- `SysUserSession`：用户会话表
- `SysOperLog`：操作日志表
- `SysLoginLog`：登录日志表

其中菜单类型支持：

- `DIRECTORY`：目录
- `MENU`：页面菜单
- `BUTTON`：按钮权限

操作日志类型支持：

- `CREATE`
- `UPDATE`
- `DELETE`
- `QUERY`
- `IMPORT`
- `EXPORT`
- `LOGIN`
- `LOGOUT`
- `OTHER`

## 页面路由

| 路径 | 说明 |
|------|------|
| `/login` | 登录页，支持系统初始化与滑块验证码 |
| `/admin` | 工作台 |
| `/admin/system/users` | 用户管理 |
| `/admin/system/roles` | 角色管理 |
| `/admin/system/menus` | 菜单管理 |
| `/admin/system/depts` | 部门管理 |
| `/admin/logs/oper` | 操作日志 |
| `/admin/logs/login` | 登录日志 |
| `/admin/profile` | 个人中心 |

## API 接口

### 认证相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/auth/captcha` | 获取滑块验证码 |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/logout` | 退出登录 |
| POST | `/api/auth/bootstrap` | 初始化系统默认数据 |
| GET | `/api/auth/me` | 获取当前登录用户信息 |
| GET | `/api/auth/profile` | 获取个人资料 |
| PUT | `/api/auth/profile` | 更新个人资料 |
| POST | `/api/auth/change-password` | 修改当前用户密码 |

### 系统管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/system/users` | 获取用户列表 |
| POST | `/api/admin/system/users` | 创建用户 |
| GET | `/api/admin/system/users/:id` | 获取用户详情 |
| PUT | `/api/admin/system/users/:id` | 更新用户 |
| DELETE | `/api/admin/system/users/:id` | 删除用户 |
| POST | `/api/admin/system/users/:id/reset-password` | 重置用户密码 |
| GET | `/api/admin/system/roles` | 获取角色列表 |
| POST | `/api/admin/system/roles` | 创建角色 |
| GET | `/api/admin/system/roles/:id` | 获取角色详情 |
| PUT | `/api/admin/system/roles/:id` | 更新角色 |
| DELETE | `/api/admin/system/roles/:id` | 删除角色 |
| GET | `/api/admin/system/menus` | 获取菜单列表 |
| POST | `/api/admin/system/menus` | 创建菜单 |
| GET | `/api/admin/system/menus/:id` | 获取菜单详情 |
| PUT | `/api/admin/system/menus/:id` | 更新菜单 |
| DELETE | `/api/admin/system/menus/:id` | 删除菜单 |
| GET | `/api/admin/system/depts` | 获取部门列表 |
| POST | `/api/admin/system/depts` | 创建部门 |
| GET | `/api/admin/system/depts/:id` | 获取部门详情 |
| PUT | `/api/admin/system/depts/:id` | 更新部门 |
| DELETE | `/api/admin/system/depts/:id` | 删除部门 |

### 日志管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/logs/oper` | 获取操作日志列表 |
| GET | `/api/admin/logs/oper/:id` | 获取操作日志详情 |
| DELETE | `/api/admin/logs/oper/:id` | 删除操作日志 |
| GET | `/api/admin/logs/login` | 获取登录日志列表 |
| DELETE | `/api/admin/logs/login/:id` | 删除登录日志 |

## 项目结构

```text
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx                 # 登录页
│   ├── (admin)/
│   │   └── admin/
│   │       ├── layout.tsx                 # 后台布局
│   │       ├── page.tsx                   # 工作台
│   │       ├── profile/page.tsx           # 个人中心
│   │       ├── logs/                      # 日志管理页面
│   │       └── system/                    # 系统管理页面
│   ├── api/
│   │   ├── auth/                          # 认证、验证码、个人中心接口
│   │   └── admin/                         # 系统管理与日志接口
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                           # 根路由，根据登录态跳转
├── components/
│   ├── admin/                             # 后台头部、侧边栏、面包屑
│   ├── auth/                              # 登录表单、滑块验证码
│   ├── logs/                              # 登录日志、操作日志组件
│   ├── profile/                           # 个人中心
│   ├── system/                            # 用户、角色、菜单、部门管理组件
│   └── ui/                                # 通用 UI 组件
├── lib/
│   ├── auth/                              # 会话、当前用户、权限校验
│   ├── system/                            # 初始化与部门树处理
│   ├── validators/                        # Zod 校验
│   ├── captcha.ts                         # 滑块验证码生成与校验
│   ├── logger.ts                          # 登录日志与操作日志
│   ├── api.ts
│   └── prisma.ts                          # Prisma Client 与连接池
├── generated/
│   └── prisma/                            # Prisma Client 输出目录
└── prisma/
    ├── schema.prisma
    └── migrations/
```

## 部署说明

本节按“单机生产部署”思路编写，适用于以下场景：

- Linux 服务器
- MySQL 8.4 独立部署或同机部署
- Next.js 以 Node.js 进程方式运行
- Nginx 负责反向代理与 HTTPS

如果你只是本地开发，可跳到“本地开发”章节。

### 推荐架构

推荐使用以下结构上线：

```text
Browser
  -> Nginx : 80/443
  -> Next.js App : 3000
  -> MySQL : 3306
```

推荐部署职责：

- `Nginx`：HTTPS、域名入口、反向代理、真实 IP 透传
- `Next.js`：应用运行与 SSR/API 服务
- `MySQL`：业务数据、会话、日志、权限数据存储
- `systemd`：托管 Node.js 进程，保证异常退出自动拉起

### 服务器要求

最低建议：

- 2 vCPU
- 4 GB 内存
- 40 GB SSD
- Ubuntu 22.04 LTS / Debian 12 / CentOS Stream 9
- Node.js 20 LTS
- MySQL 8.4
- Nginx 1.20+

中小型后台建议：

- 应用与数据库分机部署
- 数据库开启自动备份
- 生产环境使用 HTTPS
- 服务器时区统一为 `Asia/Shanghai`

### 部署目录建议

推荐目录：

```text
/opt/ai-coding/
├── current/              # 当前发布版本
├── shared/
│   ├── .env              # 生产环境变量
│   └── logs/             # 应用日志
└── releases/             # 历史发布版本
```

如果暂不做多版本发布，也可以直接使用简化目录：

```text
/opt/ai-coding/app
```

### 上线前准备

在服务器上安装运行依赖：

```bash
sudo apt update
sudo apt install -y nginx mysql-client
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

建议创建专用运行用户：

```bash
sudo useradd -r -s /usr/sbin/nologin ai-coding
sudo mkdir -p /opt/ai-coding/app
sudo chown -R $USER:$USER /opt/ai-coding
```

如果不希望创建新用户，也至少确保应用目录权限清晰，避免直接使用 `root` 跑 Node.js。

### 生产环境变量

复制 `.env.example` 为生产环境文件并修改：

```env
DATABASE_URL="mysql://root:PASSWORD@127.0.0.1:3306/ai_coding?allowPublicKeyRetrieval=true"
DATABASE_HOST="127.0.0.1"
DATABASE_PORT="3306"
DATABASE_USER="root"
DATABASE_PASSWORD="PASSWORD"
DATABASE_NAME="ai_coding"
NODE_ENV="production"
PORT="3000"
```

说明：

- `DATABASE_URL` 与拆分后的数据库配置应保持一致
- 如果数据库密码包含 `@`、`:`、`/` 等特殊字符，需要进行 URL 编码
- 当前 Prisma Client 通过 `@prisma/adapter-mariadb` 连接数据库，建议保留 `allowPublicKeyRetrieval=true`
- `PORT` 可按需调整，但需要与 Nginx 反向代理配置保持一致
- 不要把生产 `.env` 提交到仓库

### 数据库准备

#### 方式一：使用项目自带 Docker Compose 启动数据库

项目已提供 `docker-compose.yml`，适合单机快速部署数据库：

```bash
cp .env.example .env
docker compose up -d
```

#### 方式二：手动准备 MySQL 数据库

```sql
CREATE DATABASE ai_coding CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

如果使用 Docker 运行 MySQL：

```bash
docker run -d \
  --name ai-coding-mysql \
  -e MYSQL_ROOT_PASSWORD=PASSWORD \
  -p 3306:3306 \
  mysql:8.4
```

### 应用部署步骤

```bash
cd /opt/ai-coding/app
git clone <your-repository-url> .
cp .env.example .env
# 编辑 .env 为生产配置

npm install
npm run db:generate
npm run db:migrate
npm run build
sudo chown -R ai-coding:ai-coding /opt/ai-coding
```

首次手动启动验证：

```bash
NODE_ENV=production npm start
```

看到服务正常监听后，访问：

- 本机验证：`http://127.0.0.1:3000`
- 外网访问：先通过 Nginx 暴露域名或端口

### systemd 托管示例

推荐创建 `/etc/systemd/system/ai-coding.service`：

```ini
[Unit]
Description=AI Coding Admin
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/ai-coding/app
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000
User=ai-coding
Group=ai-coding

[Install]
WantedBy=multi-user.target
```

说明：

- 如果你的 `npm` 路径不是 `/usr/bin/npm`，请先执行 `which npm` 后替换
- 如果使用 `nvm` 安装 Node.js，建议改为固定 Node.js 安装路径，避免 `systemd` 环境找不到命令
- 创建服务前，请先执行 `sudo chown -R ai-coding:ai-coding /opt/ai-coding`

启用并启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable ai-coding
sudo systemctl start ai-coding
sudo systemctl status ai-coding
```

查看运行日志：

```bash
sudo journalctl -u ai-coding -f
```

### Nginx 反向代理示例

可创建 `/etc/nginx/conf.d/ai-coding.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }
}
```

检查并重载：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

如果已经配置证书，可在 Nginx 中接入 HTTPS。由于应用会读取 `x-forwarded-for` 与 `x-real-ip`，建议务必在反代层透传真实客户端 IP。

### 发布与更新流程

推荐更新流程：

```bash
cd /opt/ai-coding/app
git pull
npm install
npm run db:generate
npm run db:migrate
npm run build
sudo systemctl restart ai-coding
```

发布后检查：

- 确认 `systemctl status ai-coding` 为 `active (running)`
- 确认 Nginx 访问首页返回正常
- 确认登录、退出、验证码、用户列表接口工作正常
- 确认数据库迁移成功执行

### 回滚建议

如果更新后出现问题，建议按以下顺序处理：

1. 保留旧版本目录，不直接覆盖
2. 先回滚应用代码到上一个稳定版本
3. 如果数据库结构已经迁移，优先评估是否兼容旧代码
4. 数据库回滚前先备份

如果你准备做规范化发布，建议采用 `releases + current` 软链接模式，而不是直接在生产目录 `git pull`。

### 首次初始化

1. 打开登录页 `/login`
2. 当系统中没有任何后台账号时，页面会显示“初始化系统默认数据”按钮
3. 点击后自动创建默认部门、角色、菜单、权限和管理员账号
4. 使用以下默认账号登录

```text
用户名：admin
密码：Admin123!
```

首次登录后建议立即进入“个人中心”修改密码。

### 部署后检查清单

- 确认生产环境 `.env` 未泄漏到仓库
- 确认默认管理员密码已修改
- 确认域名已启用 HTTPS
- 确认数据库已开启定期备份
- 确认服务器防火墙仅放行业务需要的端口
- 确认日志与数据库磁盘容量有监控
- 确认 `admin_session` 在 HTTPS 场景下通过安全代理访问

## 本地开发

如果你的目标是本地联调，而不是正式上线，可使用以下流程：

```bash
git clone <your-repository-url>
cd ai-coding

cp .env.example .env
# 按实际环境修改数据库连接信息

npm install
npm run db:generate
npm run db:migrate
npm run dev
```

启动后访问 [http://localhost:3000](http://localhost:3000)。

## 可用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npm start            # 启动生产服务器
npm run lint         # 代码检查
npm run db:migrate   # 执行 Prisma 迁移
npm run db:generate  # 生成 Prisma Client
npm run db:push      # 将 Schema 推送到数据库
npm run db:studio    # 打开 Prisma Studio
```

## 运维说明

- 后端接口使用 Zod 做参数校验，非法请求会直接返回错误
- 日志状态当前复用 `Status` 枚举，`ACTIVE` 表示成功，`DISABLED` 表示失败
- 部门与菜单均为树形结构，删除或移动前需考虑父子关系约束
- 当前版本已具备日志查询与删除能力，但导出按钮权限仅完成初始化预置，尚未提供实际导出接口
- 修改本人密码或管理员重置密码后，相关用户会话会被清理，属于预期行为
- 登录日志与操作日志默认持续累积，生产环境建议定期归档或清理

## 后续可扩展方向

- 增加日志导出实现
- 增加更细粒度的数据权限范围
- 增加菜单图标规范与前端路由映射约定
- 增加批量操作、导入导出和更完整筛选能力
- 增加自动化测试、CI/CD 与部署脚本

## License

MIT
