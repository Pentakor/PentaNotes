# PentaNotes

A modern note-taking web application built with **TypeScript**, **Node.js**, **Express**, and **PostgreSQL**, with plans for AI-powered summarization, topic categorization, and note linking. This is a **personal pet project** in active development.

---

## Features (Current & Planned)

- ✅ Create, read, update, and delete notes a (CRUD)
- ✅ Type-safe validation using **Zod**
- ✅ **Note linking** to connect related notes
- ✅ **Tag system** to tag notes
- ✅ Folders structure feature for better user expirience

- 🟡 Planned: Email verification on signup
- 🟡 Planned: Note sharing via email
- 🟡 Planned: Markdown content type (instead of plain text)
- 🟡 Planned: Folders inside folders
- 🟡 Planned: AI agent to **summarize notes**, **tag notes**, **smart search**, **categorize by topics**, **auto completion**
- 🟡 Planned: Admin dashboard
- 🟡 Planned: Locking notes by password
- 🟡 Planned: Dark Mode
- 🟡 Planned: Pinning notes
- 🟡 Planned: **Redis caching** for faster note retrieval
- 🟡 Planned: **Cloud deployment** for online access


---

## Technologies Used

- **Frontend:** React, TypeScript  
- **Backend:** Node.js, Express, TypeScript  
- **Database:** PostgreSQL  
- **ORM:** Sequelize  
- **Validation:** Zod  
- **Caching:** Redis (planned)  
- **AI:** Custom AI agent (planned)  
- **Other Tools:** ts-node-dev, bcryptjs, Postman, tailwind

---


After installation and activation:
docker start pg

cd backend
npm run dev

cd frontend/pentanotes-frontend
npm start

cd mcp
npm start


