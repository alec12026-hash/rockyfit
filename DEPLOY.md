# Deploying RockyFit

## 1. Local Setup
First, install dependencies and run the development server:

```bash
cd rockyfit
npm install
npm run dev
```

Visit `http://localhost:3000` to see the app.

## 2. Database (Vercel Postgres)
Since you want this on your phone via Vercel, the easiest database is Vercel Postgres.

1.  Go to [Vercel Dashboard](https://vercel.com).
2.  Create a new project and link it to this GitHub repository.
3.  In the Vercel Project dashboard, go to **Storage** -> **Create Database** -> **Postgres**.
4.  Click **Connect Project** and select this project.
5.  This will automatically add `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, etc., to your environment variables.

## 3. Initialize the Database
Once deployed or connected locally (using `vc env pull .env.local`), run the setup script to create the tables:

```bash
npm run db:setup
```

## 4. AI Coach (OpenAI)
To enable the AI coach features:

1.  Get an API Key from [OpenAI](https://platform.openai.com).
2.  Add it to your Vercel Project Settings -> **Environment Variables** as `OPENAI_API_KEY`.

## 5. Deploy
Simply push your changes to GitHub (main branch), and Vercel will automatically redeploy.

```bash
git add .
git commit -m "feat: initial rockyfit build"
git push origin main
```
