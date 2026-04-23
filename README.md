🚀 ⭐ SmartTrip AI Planner — README
🌍 SmartTrip AI Planner

An AI-powered travel planning system that generates personalized itineraries, budgets, routes, and travel content using LLMs and real-world data APIs.

📌 Overview

SmartTrip Planner is a full-stack intelligent travel assistant that helps users:

✈️ Plan trips between any locations
🗺️ Visualize routes on maps
📅 Generate day-wise itineraries
💰 Estimate budget breakdown
🌤️ Check weather & conditions
📝 Auto-generate travel blogs & vlogs

⚡ Designed as a multi-service AI system combining frontend UI, backend APIs, and LLM-powered intelligence.

🎯 Key Features
🧠 AI Trip Planning
Generates complete travel itinerary
Day-wise structured plans
Context-aware recommendations
🗺️ Interactive Map Routing
Displays origin → destination route
Uses real coordinates (OpenStreetMap)
💰 Smart Budget Breakdown
Transportation
Food
Accommodation
Miscellaneous
🌦️ Weather Integration
Real-time weather insights for destinations
📝 AI Blog Generator
Converts trip into cinematic travel story
🎥 AI Vlog Generator
Generates scene-wise voiceovers from images
👥 Multi-user Trip Collaboration
Add/remove members
Shared trip planning

🏗️ System Architecture
User (Frontend UI - Next.js)
        ↓
Next.js API Routes (Backend Layer)
        ↓
FastAPI Python Server (AI Engine)
        ↓
Groq LLM (LLaMA 3)
        ↓
External APIs:
  - OpenStreetMap (Geocoding)
  - Weather APIs
  - Google Search API
        ↓
PostgreSQL Database (via Prisma)
⚙️ Tech Stack
🖥️ Frontend
Next.js (React)
Tailwind CSS
Leaflet (Maps)
🔙 Backend
Next.js API Routes
Prisma ORM
🧠 AI Engine
FastAPI
LangChain
Groq (LLaMA 3 model)
🗄️ Database
PostgreSQL
🌐 External APIs
OpenStreetMap (Nominatim)
Weather API
Google Search API

📸 Screenshots

(Added screenshots inside Screenshots folder)

🔹 Trip Planning UI

🔹 Map View

🔹 Budget Breakdown

🔹 Blog Generation

🔹 Vlog Generation

🔁 Application Flow
User enters:
Origin
Destination
Days
Budget
Preferences
Frontend sends request → Backend API
Backend:
Validates input
Calls Python AI server
Python Server:
Uses LLM (Groq)
Generates structured JSON
Backend processes:
Budget normalization
Coordinates mapping
Frontend displays:
Itinerary
Map
Budget
Weather

🧠 AI Logic Highlights
Strict itinerary validation rules
No duplicate activities
Location-aware planning
Budget consistency enforcement
Fallback system in case of AI failure

❗ Deployment Status

⚠️ Note:
Due to cloud runtime constraints (timeout issues with LLM calls), the full deployment is currently unstable.

👉 However, the system is fully functional in local environment.

Screenshots folder demonstrates complete working functionality.

🛠️ Local Setup
1️⃣ Clone Repository
git clone https://github.com/your-repo-url.git
cd project-folder
2️⃣ Install Frontend
cd travel-package
npm install
npm run dev
3️⃣ Setup Python Server
cd python-server
pip install -r requirements.txt
uvicorn app:app --reload
4️⃣ Environment Variables

Create .env files:

Frontend (.env)
DATABASE_URL=
NEXTAUTH_SECRET=
PYTHON_SERVER_URL=http://localhost:8000
Python Server (.env)
GROQ_API_KEY=
GOOGLE_SEARCH_API_KEY=

⚠️ Known Issues
Deployment timeout due to heavy LLM processing
Railway free tier limitations
Cold start delays in Python server

🔮 Future Enhancements
Async queue-based AI processing
Caching generated trips
Real-time collaboration
Voice-based trip planning
Mobile optimization

👩‍💻 Contributors
Nilima Mishra
Jasaswini Mohanty
Pragyan Bharati Moharana
Reetika Mallick

📢 Final Note

This project demonstrates:

Full-stack development
AI system integration
Real-world API usage
Scalable architecture design

Even without deployment, it reflects a production-grade AI application design
