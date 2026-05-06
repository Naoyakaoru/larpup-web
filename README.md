# LarpUp Web

LarpUp 劇本殺揪團平台的 Web 前端。

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4
- React Router v7

## 快速開始

```bash
npm install
npm run dev
```

開發 server 跑在 `http://localhost:5173`，API 請求會 proxy 到 `http://localhost:3000`。

> 需要同時跑 [larpup-api](https://github.com/Naoyakaoru/larpup-api)。

## 功能頁面

| 路徑 | 功能 |
|------|------|
| `/` | 揪團活動列表 |
| `/events/:id` | 活動詳情、報名、成員審核 |
| `/events/new` | 建立揪團（需登入）|
| `/scripts` | 劇本列表 |
| `/me` | 個人頁面 |
| `/login` | 登入 |
| `/register` | 註冊 |

## 色系

- 主色（暖橘）：`#F59E0B`
- 次色（奶油黃）：`#FDE68A`
- 輔色（柔紫）：`#A78BFA`
- 背景（淡米橘）：`#FFF7ED`

深色模式使用方案 B 靛紫系配色。

## 部署

部署至 Vercel，連接 GitHub 倉庫自動 deploy。
