# 🚀 SmartHire - Job Portal

A modern full-stack job portal built with React, Supabase, and Clerk authentication. Connect recruiters with candidates seamlessly.

## ✨ Features

- 🔐 **Authentication** — Secure login/signup via Clerk
- 👔 **Recruiter Dashboard** — Post jobs, manage applications, toggle hiring status
- 🎯 **Job Seeker Dashboard** — Browse jobs, apply with resume, save favorites
- 🔍 **Smart Search** — Filter jobs by title, location, and company
- 📄 **Resume Upload** — PDF/DOC resume submission
- 💾 **Saved Jobs** — Bookmark jobs for later
- 📊 **Application Tracking** — Track application status in real-time

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React + Vite | Frontend framework |
| Tailwind CSS | Styling |
| Shadcn UI | UI Components |
| Supabase | Database + Storage |
| Clerk | Authentication |
| React Hook Form + Zod | Form validation |
| React Router DOM | Navigation |

## 📁 Folder Structure
```
smarthire/
├── public/                 # Static assets
│   ├── logo.png
│   └── banner.jpeg
├── src/
│   ├── api/                # Supabase API calls
│   │   ├── apiJobs.js
│   │   ├── apiCompanies.js
│   │   └── apiApplication.js
│   ├── components/         # Reusable components
│   │   ├── ui/             # Shadcn UI components
│   │   ├── header.jsx
│   │   ├── job-card.jsx
│   │   ├── apply-job.jsx
│   │   ├── add-company-drawer.jsx
│   │   ├── application-card.jsx
│   │   ├── created-jobs.jsx
│   │   ├── created-applications.jsx
│   │   └── protected-route.jsx
│   ├── data/               # Static JSON data
│   │   ├── companies.json
│   │   └── faq.json
│   ├── hooks/              # Custom hooks
│   │   └── use-fetch.js
│   ├── layouts/            # Layout components
│   │   └── app-layout.jsx
│   ├── pages/              # Page components
│   │   ├── landing.jsx
│   │   ├── job.jsx
│   │   ├── jobListing.jsx
│   │   ├── post-job.jsx
│   │   ├── my-jobs.jsx
│   │   ├── saved-jobs.jsx
│   │   └── onboarding.jsx
│   ├── utils/              # Utility functions
│   │   └── supabase.js
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── .env                    # Environment variables (never commit!)
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/developertutuorials/smarthire.git
cd smarthire
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### 4. Setup Supabase
Create the following tables in Supabase:
- `jobs` — Job listings
- `companies` — Company details
- `applications` — Job applications
- `saved_jobs` — Saved jobs by candidates

Create storage buckets:
- `company-logo` — Company logos
- `resumes` — Candidate resumes

### 5. Setup Clerk
- Create a Clerk application
- Enable Third-Party Auth with Supabase
- Add your Clerk domain to Supabase

### 6. Run the development server
```bash
npm run dev
```

## 🚀 Deployment

Deployed on **Vercel** — [Live Demo](https://smarthire-three.vercel.app/)



## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.



Built with ❤️ by [developertutuorials](https://github.com/developertutuorials)
