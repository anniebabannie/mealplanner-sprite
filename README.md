# Meal Planner

A weekly meal planning app that uses AI to generate overhead food photos for each dish. Built with React Router v7, Tailwind CSS, SQLite, and OpenAI's image generation API. Images are stored on Tigris (S3-compatible object storage).

## Features

- Create weekly menus by typing dish names
- AI-generated overhead food photos (or side-angle for drinks) via `gpt-image-1.5`
- Approve, retry, or cancel each generated image before adding to your menu
- Save menus with a custom title (defaults to today's date)
- View, edit, and delete saved menus
- Images stored on Tigris; metadata stored in SQLite

## Local Setup

### Prerequisites

- Node.js 18+
- An [OpenAI API key](https://platform.openai.com/api-keys)
- A [Tigris](https://www.tigrisdata.com/) account with a bucket and access keys

### Installation

```bash
git clone https://github.com/anniebabannie/mealplanner-sprite.git
cd mealplanner-sprite
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```
OPENAI_API_KEY=your_openai_api_key

AWS_ACCESS_KEY_ID=your_tigris_access_key_id
AWS_SECRET_ACCESS_KEY=your_tigris_secret_access_key
AWS_ENDPOINT_URL_S3=https://t3.storage.dev
AWS_REGION=auto
TIGRIS_BUCKET=your_bucket_name
```

### Development

```bash
npm run dev
```

App runs at `http://localhost:5173`.

### Production Build

```bash
npm run build
npm start
```

App runs at `http://localhost:3000`.
