"""
Personalized Career Learning Roadmap Generator
Project ID: P19 - Skill-Gap Predictor for Students (Career Navigation AI)
GITAM University, Bengaluru Campus
Developers: Vinay Kumar S, Yashwanth K, Mahesh B K
Mentor: Dr. N. Gayathri (M29)

Generates customized multi-stage learning roadmaps for detected missing skills,
complete with recommended resources, documentation, and resume-ready milestone projects.
"""

from typing import Dict, List, Any

# Curated resource catalog for prominent tech skills
SKILL_RESOURCES: Dict[str, Dict[str, Any]] = {
    "Data Structures": {
        "docs": "https://www.geeksforgeeks.org/data-structures/",
        "platform": "LeetCode / NeetCode 150",
        "time": "3-4 Weeks",
        "project": "Implement In-Memory Key-Value Store with LRU Cache"
    },
    "Algorithms": {
        "docs": "https://visualgo.net/en",
        "platform": "HackerRank / CodeChef",
        "time": "3 Weeks",
        "project": "Graph Route Optimizer using Dijkstra / A* Algorithm"
    },
    "Python": {
        "docs": "https://docs.python.org/3/tutorial/",
        "platform": "Real Python / Exercism",
        "time": "2 Weeks",
        "project": "Automated CLI Web Scraper & Data Pipeline"
    },
    "Java": {
        "docs": "https://dev.java/learn/",
        "platform": "Hyperskill / MOOC.fi Java",
        "time": "3 Weeks",
        "project": "RESTful Microservices with Spring Boot & Hibernate"
    },
    "React": {
        "docs": "https://react.dev/learn",
        "platform": "freeCodeCamp / Scrimba",
        "time": "2-3 Weeks",
        "project": "Real-Time Collaboration Kanban Dashboard"
    },
    "Node.js": {
        "docs": "https://nodejs.org/en/learn",
        "platform": "MDN Web Docs",
        "time": "2 Weeks",
        "project": "Scalable JWT Auth API with Rate Limiting & Swagger"
    },
    "SQL": {
        "docs": "https://mode.com/sql-tutorial/",
        "platform": "SQLZoo / LeetCode Database",
        "time": "1-2 Weeks",
        "project": "E-Commerce Transaction Analysis & Query Optimizer"
    },
    "Machine Learning": {
        "docs": "https://scikit-learn.org/stable/tutorial/index.html",
        "platform": "Kaggle Learn / Fast.ai",
        "time": "3-4 Weeks",
        "project": "End-to-End Customer Churn Predictor with Model Deployment"
    },
    "Deep Learning": {
        "docs": "https://www.deeplearning.ai/",
        "platform": "PyTorch Official Tutorials",
        "time": "4 Weeks",
        "project": "Transfer Learning Image Classifier using ResNet"
    },
    "Docker": {
        "docs": "https://docs.docker.com/get-started/",
        "platform": "Play with Docker",
        "time": "1 Week",
        "project": "Multi-Container Full Stack App with Docker Compose"
    },
    "Kubernetes": {
        "docs": "https://kubernetes.io/docs/tutorials/",
        "platform": "KillerCoda / Minikube",
        "time": "2 Weeks",
        "project": "Zero-Downtime Rolling Deployment with Ingress"
    },
    "AWS": {
        "docs": "https://aws.amazon.com/getting-started/",
        "platform": "AWS Skill Builder / Free Tier Labs",
        "time": "3 Weeks",
        "project": "Serverless API using AWS Lambda, API Gateway & DynamoDB"
    },
    "Power BI": {
        "docs": "https://learn.microsoft.com/en-us/power-bi/",
        "platform": "Microsoft Learn Guided Paths",
        "time": "1-2 Weeks",
        "project": "Executive Sales & KPI Interactive Business Dashboard"
    },
    "Cybersecurity": {
        "docs": "https://owasp.org/www-project-top-ten/",
        "platform": "TryHackMe / PortSwigger Web Security Academy",
        "time": "3 Weeks",
        "project": "Network Vulnerability Scanner & Security Audit Report"
    }
}


def generate_learning_roadmap(missing_skills: List[str], target_role: str, target_company: str) -> Dict[str, Any]:
    """
    Generate a 4-phase milestone roadmap structured to bridge missing skills
    before campus placements.
    """
    prioritized_skills = missing_skills[:6] if missing_skills else ["Advanced System Design", "Production Optimization"]

    phases = [
        {
            "phase": "Phase 1: Foundational Core",
            "duration": "Weeks 1 - 2",
            "objective": "Grasp syntax, fundamental design patterns, and environment setups.",
            "skills": prioritized_skills[:2],
            "action_items": [
                f"Set up development environment and study official documentation for {prioritized_skills[0]}.",
                "Build mini exercises and solve 15 beginner problem sets.",
                "Review core theory asked in campus screening rounds."
            ]
        },
        {
            "phase": "Phase 2: Applied Implementation",
            "duration": "Weeks 3 - 4",
            "objective": "Integrate technologies into modular functional components.",
            "skills": prioritized_skills[2:4] if len(prioritized_skills) > 2 else prioritized_skills[:1],
            "action_items": [
                "Implement intermediate features using industry best practices.",
                "Learn debugging tools, profiling, and unit testing frameworks.",
                "Connect databases and external REST APIs."
            ]
        },
        {
            "phase": "Phase 3: Capstone Milestone Project",
            "duration": "Weeks 5 - 6",
            "objective": f"Construct an end-to-end portfolio project tailored for {target_company}.",
            "skills": prioritized_skills[:3],
            "action_items": [
                f"Design a GitHub project showcasing {', '.join(prioritized_skills[:3])}.",
                "Write comprehensive README documentation with architecture diagrams and API docs.",
                "Include live deployed demo link on Streamlit / Vercel / Render."
            ]
        },
        {
            "phase": "Phase 4: Placement & Mock Interview Readiness",
            "duration": "Weeks 7 - 8",
            "objective": f"Final revision, mock technical rounds, and interview defense for {target_role}.",
            "skills": ["Mock Interviews", "System Design", "Behavioral Preparation"],
            "action_items": [
                "Conduct mock interviews answering deep technical questions on your resume projects.",
                "Practice STAR methodology for company-specific managerial/HR questions.",
                "Refine resume with newly acquired skills and quantifiable project metrics."
            ]
        }
    ]

    # Specific resources breakdown
    detailed_resources = []
    for skill in prioritized_skills:
        info = SKILL_RESOURCES.get(skill, {
            "docs": f"https://www.google.com/search?q={skill}+official+documentation",
            "platform": "Coursera / YouTube / GitHub Guides",
            "time": "2 Weeks",
            "project": f"End-to-End {skill} Production Implementation"
        })
        detailed_resources.append({
            "skill": skill,
            "docs": info["docs"],
            "platform": info["platform"],
            "time": info["time"],
            "project": info["project"]
        })

    return {
        "target_role": target_role,
        "target_company": target_company,
        "phases": phases,
        "resources": detailed_resources,
    }
