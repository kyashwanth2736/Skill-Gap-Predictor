"""
Skill Extractor & Tech Domain Detection Module
Project ID: P19 - Skill-Gap Predictor for Students (Career Navigation AI)
GITAM University, Bengaluru Campus
Developers: Vinay Kumar S, Yashwanth K, Mahesh B K
Mentor: Dr. N. Gayathri (M29)

Handles technical skill extraction, synonym resolution, dynamic domain detection,
and semantic keyword parsing.
"""

import re
from typing import Dict, List, Set, Tuple, Any

# Canonical Skill Taxonomy grouped by Domain
SKILL_TAXONOMY: Dict[str, Dict[str, List[str]]] = {
    "Web & Full Stack": {
        "Frontend": ["HTML5", "CSS3", "JavaScript", "TypeScript", "React", "Angular", "Vue.js", "Next.js", "Tailwind CSS", "Bootstrap", "Redux", "Sass"],
        "Backend": ["Node.js", "Express.js", "Django", "Flask", "FastAPI", "Spring Boot", "ASP.NET", "Ruby on Rails", "PHP", "Laravel", "REST APIs", "GraphQL"],
        "Databases": ["MongoDB", "PostgreSQL", "MySQL", "Redis", "Firebase", "SQLite"]
    },
    "Data Science & Analytics": {
        "Core Analytics": ["SQL", "Python", "R", "Excel", "Power BI", "Tableau", "Pandas", "NumPy", "Statistics", "Data Visualization", "Data Cleaning", "Matplotlib", "Seaborn"],
        "Big Data": ["Spark", "Hadoop", "Hive", "Kafka", "Data Warehousing", "Snowflake", "BigQuery", "ETL Pipelines"]
    },
    "Artificial Intelligence & ML": {
        "Machine Learning": ["Machine Learning", "Scikit-Learn", "Regression", "Classification", "Clustering", "Supervised Learning", "Unsupervised Learning"],
        "Deep Learning & NLP": ["Deep Learning", "Neural Networks", "TensorFlow", "PyTorch", "Keras", "NLP", "Natural Language Processing", "Computer Vision", "OpenCV", "Transformers", "LLMs", "Generative AI", "LangChain"]
    },
    "Cloud & DevOps": {
        "Cloud Providers": ["AWS", "Microsoft Azure", "Google Cloud Platform (GCP)", "IBM Cloud"],
        "DevOps Tools": ["Docker", "Kubernetes", "Linux", "CI/CD", "GitHub Actions", "Jenkins", "Terraform", "Ansible", "Bash Scripting", "Prometheus", "Grafana", "Git"]
    },
    "Software Engineering": {
        "Languages": ["C++", "Java", "Python", "C#", "C", "Go", "Rust"],
        "Foundations": ["Data Structures", "Algorithms", "Object-Oriented Programming (OOP)", "System Design", "Operating Systems", "Computer Networks", "Database Management Systems (DBMS)", "Problem Solving"]
    },
    "Cybersecurity & Networking": {
        "Security": ["Cybersecurity", "Network Security", "Ethical Hacking", "Penetration Testing", "Cryptography", "Vulnerability Assessment", "Firewalls", "SIEM", "Wireshark", "Metasploit", "SOC Operations"]
    },
    "Mobile App Development": {
        "Mobile": ["Flutter", "Dart", "React Native", "Android", "Kotlin", "Swift", "iOS", "Firebase"]
    }
}

# Synonym mapping to canonical names
SYNONYM_MAP: Dict[str, str] = {
    "js": "JavaScript",
    "javascript": "JavaScript",
    "ts": "TypeScript",
    "typescript": "TypeScript",
    "py": "Python",
    "python3": "Python",
    "cpp": "C++",
    "c plus plus": "C++",
    "react.js": "React",
    "reactjs": "React",
    "nextjs": "Next.js",
    "node": "Node.js",
    "nodejs": "Node.js",
    "express": "Express.js",
    "expressjs": "Express.js",
    "k8s": "Kubernetes",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "mongo": "MongoDB",
    "ml": "Machine Learning",
    "machine learning": "Machine Learning",
    "dl": "Deep Learning",
    "deep learning": "Deep Learning",
    "ai": "Artificial Intelligence",
    "artificial intelligence": "Artificial Intelligence",
    "nlp": "Natural Language Processing",
    "gcp": "Google Cloud Platform (GCP)",
    "azure": "Microsoft Azure",
    "dsa": "Data Structures",
    "data structure": "Data Structures",
    "algorithms": "Algorithms",
    "algorithm": "Algorithms",
    "oop": "Object-Oriented Programming (OOP)",
    "oops": "Object-Oriented Programming (OOP)",
    "object oriented programming": "Object-Oriented Programming (OOP)",
    "powerbi": "Power BI",
    "ms excel": "Excel",
    "excel": "Excel",
    "tailwind": "Tailwind CSS",
    "tf": "TensorFlow",
    "tensorflow": "TensorFlow",
}


def get_all_canonical_skills() -> List[str]:
    """Retrieve flat list of all unique canonical skills from taxonomy."""
    skills_set = set()
    for domain, categories in SKILL_TAXONOMY.items():
        for cat, skills in categories.items():
            skills_set.update(skills)
    return sorted(list(skills_set))


def extract_skills_from_text(text: str) -> List[str]:
    """
    Extract skills from arbitrary text using regex boundary matching
    and case-insensitive synonym normalization.
    """
    if not text:
        return []

    lower_text = text.lower()
    matched_skills: Set[str] = set()

    # 1. Match from master taxonomy
    canonical_skills = get_all_canonical_skills()
    for skill in canonical_skills:
        # Regex word boundary check (handling special symbols like C++, C#, .NET)
        escaped_skill = re.escape(skill)
        pattern = rf"(?i)(?<![\w#+.]){escaped_skill}(?![\w#+.])"
        if re.search(pattern, text):
            matched_skills.add(skill)

    # 2. Match from synonyms
    for synonym, canonical in SYNONYM_MAP.items():
        escaped_syn = re.escape(synonym)
        pattern = rf"(?i)(?<![\w#+.]){escaped_syn}(?![\w#+.])"
        if re.search(pattern, text):
            matched_skills.add(canonical)

    return sorted(list(matched_skills))


def detect_candidate_domain(extracted_skills: List[str]) -> Tuple[str, Dict[str, float]]:
    """
    Analyze extracted skills against domain buckets and calculate domain affinity percentages.
    Returns primary detected domain and domain scores breakdown.
    """
    domain_scores: Dict[str, int] = {domain: 0 for domain in SKILL_TAXONOMY.keys()}

    for skill in extracted_skills:
        for domain, categories in SKILL_TAXONOMY.items():
            for cat, skills in categories.items():
                if skill in skills:
                    domain_scores[domain] += 1

    total_hits = sum(domain_scores.values())
    if total_hits == 0:
        return "General Engineering", {d: 0.0 for d in domain_scores}

    # Convert to percentages
    percentages: Dict[str, float] = {
        domain: round((score / total_hits) * 100, 1)
        for domain, score in domain_scores.items()
    }

    # Determine primary domain
    primary_domain = max(domain_scores, key=domain_scores.get)
    if domain_scores[primary_domain] == 0:
        primary_domain = "Software Engineering"

    return primary_domain, percentages
