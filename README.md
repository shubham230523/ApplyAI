# ApplyAI 🚀

### The AI-First Job Search & Auto-Apply Platform

[**Live Demo (Web)**](https://shubham230523.github.io/ApplyAI/)

ApplyAI is a modern, cross-platform application designed to transform the job search experience from a tedious manual process into a seamless AI-driven conversation. Built with **React Native**, **Expo**, and **Fastify**, it empowers candidates to find, rank, and apply for jobs using natural language.

---

## ✨ Key AI Features

- 📄 **AI Resume Parser**: Automatically extract skills, experience, and education from PDF/Image resumes with high fidelity.
- 🎯 **AI Matching Score**: Get a strategic percentage score (0-100%) and feedback on how well your profile matches a specific job.
- 🛠️ **AI Resume Tailoring**: Optimize and rephrase your resume data to align perfectly with a job description.
- ✍️ **AI Cover Letter Generation**: Craft persuasive, job-specific cover letters that connect your unique background to role requirements.
- 🧠 **AI Recommendation Engine**: Receive proactive job suggestions based on your profile and search history before you even type a query.
- 🔍 **AI Job Search**: Search for roles across multiple sources using natural language ("Remote React roles with 20+ LPA").
- 📑 **AI JD Summary**: Instantly get 3-4 high-impact bullet points summarizing any complex job description.
- 💼 **AI Job Description Generator**: Help recruiters create professional, engaging JDs in seconds from basic role parameters.
- 📊 **AI Candidate Ranking**: Sort through applicants based on semantic match scores for easier recruiter evaluation.

---

## 🌟 Vision

**"Find me an Android developer role in Mumbai with 3+ years experience and salary above 12 LPA."**

Traditional job boards force you to fiddle with filters and scroll through endless duplicates. ApplyAI lets you speak your mind. Our AI Orchestration layer understands your requirements, searches multiple sources, ranks matches semantically against your resume, and prepares tailored applications—all within a single chat interface.

---

## 🛠️ Core Technology Stack

### **Apps**
- **Client**: Expo React Native (iOS, Android, Web)
- **Styling**: NativeWind (Tailwind CSS for Mobile & Web)
- **State Management**: Zustand & TanStack Query
- **Routing**: Expo Router (File-based)

### **Backend**
- **Server**: Fastify (Node.js + TypeScript)
- **Database**: PostgreSQL with **Drizzle ORM**
- **Auth**: Supabase Auth (JWT & Session Persistence)
- **Documentation**: OpenAPI / Swagger

### **Packages**
- **@applyai/shared-types**: Shared domain models and TypeScript interfaces.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- PostgreSQL instance
- Supabase account for Authentication

### Installation

1. **Clone and Install Dependencies**
   ```bash
   git clone https://github.com/shubham230523/ApplyAI.git
   cd ApplyAI
   npm install
   ```

2. **Environment Configuration**
   Copy `.env.example` to `.env` in `apps/backend` and `apps/client` (or use `.env.local`).

3. **Database Migrations**
   ```bash
   cd apps/backend
   npx drizzle-kit generate
   npx drizzle-kit push
   ```

4. **Launch the Platform**

   **Start Backend:**
   ```bash
   npm run dev --workspace=backend
   ```

   **Start Mobile/Web Client:**
   ```bash
   npm run web --workspace=@applyai/client
   ```

---

## 🛣️ Roadmap

- [x] **Phase 1**: Monorepo Architecture & TypeScript Setup
- [x] **Phase 2**: Cross-Platform Expo & NativeWind Integration
- [x] **Phase 3**: Supabase Auth & JWT Middleware
- [x] **Phase 4**: PostgreSQL Schema & Drizzle ORM Setup
- [x] **Phase 5**: AI Orchestrator & Job Search extraction
- [x] **Phase 6**: Resume Parsing & Semantic Matching
- [x] **Phase 7**: Auto-Apply Beta

---

## 🤝 Contributing

We are building the future of recruitment. If you're interested in AI agents, React Native, or high-performance backends, feel free to open a PR or join our community.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Built with ❤️ for the developer community.*
