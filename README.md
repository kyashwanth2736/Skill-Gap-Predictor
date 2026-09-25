# Skill-Gap Predictor for Students (Career Navigation AI)
### IEEE CS Bangalore Chapter Internship and Mentorship Program – 2026

- **Project ID:** P19
- **Project Duration:** 1st April 2026 to 30th September 2026
- **Students / Developers:** 
  - Vinay Kumar S
  - Yashwanth K
  - Mahesh B K
- **Institution / University:** GITAM University, Bengaluru Campus
- **Faculty Mentor:** Dr. N. Gayathri (M29)

---

## 📌 Project Overview

**Skill-Gap Predictor for Students (Career Navigation AI)** is an enterprise placement intelligence platform built to bridge the gap between academic curricula and industry hiring standards. 

The platform evaluates student resumes, measures enterprise ATS compatibility, predicts skill gaps against top tech companies (e.g., Google, Amazon, Microsoft, Zoho), generates 4-phase personalized career roadmaps, provides an interactive **AI Interview Assistant & Live Answer Evaluator**, and exports publication-grade PDF progress reports.

---

## 🌟 Key Features & Modules

1. **🔐 Student Portal & Security**: Secure user registration, authentication (SHA-256 hashed passwords), session management, and SQLite database profile storage.
2. **📄 Resume Parsing & Enterprise ATS Checker**: Upload PDF or DOCX resumes; extracts contact details, GitHub/LinkedIn links, technical skills, section completeness, and calculates an ATS score (0–100).
3. **🎯 Skill-Gap Predictor**: Matches candidate skills against target benchmark roles or custom company requirements to compute Job Readiness % and missing skill gaps.
4. **📊 Placement Analytics Dashboard**: Real-time visual metrics featuring interactive Chart.js **Placement Competency Radar** and **Technical Domain Affinity** charts.
5. **💼 Dynamic Job Ranking & Web Scraper**: Ranks job roles by skill fit (High Match, Moderate Match, Skill Gap) and features Automatic Web Retrieval (AWR) for live job posting URLs.
6. **🗺️ Personalized 4-Phase Career Roadmap**: Milestone learning pathways tailored to missing skills, complete with official documentation links and portfolio project ideas.
7. **🎙️ AI Interview Assistant & Practice Lab**:
   - **🤖 AI Interview Assistant**: Interactive guidance for company-specific questions (e.g., *"Why Google?"*), system design blueprints, STAR behavioral frameworks, and coding strategies.
   - **✍️ AI Live Answer Evaluator**: Instant 5-criterion scoring (Technical Accuracy, Keywords, Structure, STAR Relevance, Completeness out of 100) on typed candidate answers.
   - **🎯 Question Bank**: Personalized technical and behavioral questions.
8. **📑 PDF Progress Report Generator**: Generates publication-grade IEEE progress report PDFs powered by ReportLab.

---

## 📂 Project Directory Structure

```text
skill-gap-predictor/
├── index.php                      # Main Web Dashboard UI & View Panels
├── api.php                        # REST API Controller & Python Bridge Interface
├── db.php                         # SQLite Database Manager & User Auth
├── bridge.py                      # Python Helper Bridge CLI
├── Dockerfile                     # Production Docker Container configuration
├── docker-compose.yml             # 1-Click Docker Compose orchestration
├── render.yaml                    # Render.com Cloud Deployment blueprint
├── requirements.txt               # Python package dependencies
├── career_navigation.db           # SQLite Database (Auto-created)
├── modules/                       # Core Python AI Engine Modules
│   ├── resume_parser.py           # PDF/DOCX Parsing & Signal Extraction
│   ├── skill_extractor.py         # Skill Taxonomy & Domain Classifier
│   ├── ats_engine.py              # ATS Scoring & Readiness Calculations
│   ├── job_scraper.py             # AWR Web Retrieval & Job Ranking Engine
│   ├── roadmap_generator.py       # 4-Phase Career Roadmap Recommendation
│   ├── interview_prep.py          # AI Interview Assistant & Answer Evaluator
│   └── pdf_generator.py           # Publication-Grade PDF Report Engine
├── static/                        # Frontend Stylesheets & Scripts
│   ├── styles.css                 # Dark Navy Theme & Layout Styles
│   └── app.js                     # Async JS, Navigation, Charts & API Handlers
└── data/                          # Data Specifications
    └── company_roles.json         # Benchmark Company Roles & Required Skills
```

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (Dark Space Theme), JavaScript (ES6+), Chart.js
- **Backend Web Server**: PHP 8.x (PDO SQLite / MySQL)
- **AI & NLP Engine**: Python 3.10+, PyPDF, python-docx, BeautifulSoup4, Requests
- **Analytics & PDF Generation**: Chart.js, ReportLab
- **Database**: SQLite3 (via PHP PDO)
- **Containerization**: Docker, Apache2

---

## 🚀 How to Run Locally

### Option A: Using PHP Built-in Web Server (Easiest)

1. **Clone or Download the Repository**:
   ```bash
   git clone https://github.com/<YOUR_USERNAME>/skill-gap-predictor-p19.git
   cd skill-gap-predictor-p19
   ```

2. **Install Python Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Start PHP Built-in Web Server**:
   ```bash
   php -S localhost:8000
   ```

4. **Access in Browser**:
   Open 👉 **`http://localhost:8000`**

---

### Option B: Using XAMPP (Windows / Campus Server)

1. Copy the project folder to `C:\xampp\htdocs\skill-gap-predictor\`.
2. Ensure Python is installed on your system PATH (`pip install -r requirements.txt`).
3. Open **XAMPP Control Panel** and click **Start** next to **Apache**.
4. Open your browser and navigate to:
   👉 **`http://localhost/skill-gap-predictor/`**

---

### Option C: Using Docker (1-Command Run)

If you have Docker installed:
```bash
docker-compose up --build -d
```
Access the application at 👉 **`http://localhost:8080`**

---

## 🌐 Cloud Deployment (Render.com)

1. Push your repository to **GitHub**.
2. Log in to [Render.com](https://render.com) and click **New + > Web Service**.
3. Select your repository. Render will automatically detect `render.yaml` and select **Docker**.
4. Click **Create Web Service**. Within 2-3 minutes, your live URL will be active!

---

## 👥 GitHub Collaboration Guide

### 1. Initial Push to GitHub
```bash
git init
git add .
git commit -m "feat: initial commit for IEEE P19 Skill-Gap Predictor"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/skill-gap-predictor-p19.git
git push -u origin main
```

### 2. Teammates Setup & Contribution
```bash
git clone https://github.com/<YOUR_USERNAME>/skill-gap-predictor-p19.git
cd skill-gap-predictor-p19
pip install -r requirements.txt
php -S localhost:8000
```

---

## 🏆 Project Achievements
- Fully compliant with **IEEE Internship Program 2026** deliverables for Project **P19**.
- High-accuracy ATS parsing with section & social profile signal extraction.
- Interactive AI Interview Assistant & Real-Time Answer Evaluator.
- 4-Phase dynamic career roadmaps with recommended portfolio project ideas.
- Enterprise dashboard analytics with exportable publication-grade PDF progress reports.
