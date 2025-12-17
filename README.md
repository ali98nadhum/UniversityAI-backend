# UniversityAI-backend

🚀 **UniversityAI** is an AI-powered project designed to help university students get accurate and fast answers to their academic questions through an intelligent Chatbot.

---

## 💡 Key Features

- Student login via:
  - **Google OAuth**
  - **Email & Password** (optional/future)
- **Smart Chatbot** that answers academic questions using DeepSeek API
- **Internal FAQ system**: pre-defined questions and answers stored in the database
- JWT Authentication for secure API access
- **Extensible design**: ready for PDF support and advanced analytics in the future

---

## 📦 Technologies Used

- **Node.js + Express**: server framework  
- **Prisma ORM** with PostgreSQL: database management  
- **Passport.js**: Google OAuth authentication  
- **JWT**: user authentication  
- **DeepSeek API**: intelligent answers generation  
- **string-similarity**: matching user questions with FAQ  
- **dotenv**: environment variable management  

---

## ⚙️ Environment Variables (.env)

Create a `.env` file in the project root with the following variables:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/universityai
GOOGLE_CLIENT_ID=xxxx
GOOGLE_CLIENT_SECRET=xxxx
JWT_SECRET=your_jwt_secret
OPENROUTER_API_KEY=xxxx
PORT=3000
