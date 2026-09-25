"""
Python Helper Bridge for Skill-Gap Predictor PHP Application
Project ID: P19 - Skill-Gap Predictor for Students (Career Navigation AI)
IEEE CS Bangalore Chapter | GITAM University, Bengaluru
"""

import sys
import os
import json
import base64

# Ensure modules directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from modules.resume_parser import parse_resume, validate_is_resume
from modules.skill_extractor import (
    extract_skills_from_text,
    detect_candidate_domain,
    get_all_canonical_skills,
)
from modules.ats_engine import (
    calculate_ats_score,
    calculate_readiness_score,
    evaluate_resume_strength,
    calculate_ai_confidence,
    generate_ai_insights,
)
from modules.job_scraper import (
    fetch_job_description_from_url,
    get_all_benchmark_roles,
    rank_jobs_for_candidate,
)
from modules.roadmap_generator import generate_learning_roadmap
from modules.interview_prep import (
    generate_interview_prep,
    ask_ai_interview_assistant,
    evaluate_user_answer,
)
from modules.pdf_generator import generate_pdf_report



def handle_get_canonical_skills():
    return {"status": "success", "skills": get_all_canonical_skills()}


def handle_get_benchmark_data():
    json_path = os.path.join(os.path.dirname(__file__), "data", "company_roles.json")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {"status": "success", "companies": data.get("companies", {})}


def handle_parse_resume(payload):
    file_path = payload.get("file_path")
    file_name = payload.get("file_name", "resume.pdf")

    if not file_path or not os.path.exists(file_path):
        return {"status": "error", "message": "File does not exist on server."}

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    parsed = parse_resume(file_bytes, file_name)
    extracted_skills = extract_skills_from_text(parsed.get("raw_text", ""))
    is_valid, validation_msg = validate_is_resume(parsed, extracted_skills)

    if not is_valid:
        return {"status": "error", "message": validation_msg}

    ats_score, breakdown = calculate_ats_score(parsed, extracted_skills)
    detected_domain, domain_percentages = detect_candidate_domain(extracted_skills)

    return {
        "status": "success",
        "parsed_resume": parsed,
        "extracted_skills": extracted_skills,
        "ats_score": ats_score,
        "ats_breakdown": breakdown,
        "detected_domain": detected_domain,
        "domain_percentages": domain_percentages,
    }


def handle_parse_sample(payload):
    user_name = payload.get("name", "Student Applicant")
    email = payload.get("email", "student@gitam.in")
    branch = payload.get("branch", "Computer Science & Engineering")
    year = payload.get("year", 2026)

    sample_text = f"""
    {user_name}
    GITAM University, Bengaluru | {email} | +91 9876543210
    LinkedIn: linkedin.com/in/{user_name.lower().replace(' ', '')} | GitHub: github.com/{user_name.lower().replace(' ', '')}

    EDUCATION
    GITAM University, Bengaluru - {branch} ({year})
    CGPA: 8.8 / 10.0

    TECHNICAL SKILLS
    Programming: Python, Java, C++, SQL, JavaScript
    Core: Data Structures, Algorithms, Object-Oriented Programming (OOP), DBMS, System Design
    Libraries: Pandas, NumPy, Scikit-Learn
    Tools: Git, GitHub, Docker, VS Code, Linux

    PROJECTS
    Skill-Gap Predictor for Students (Career Navigation AI)
    - Built an AI career navigation platform using PHP, HTML/CSS/JS, Python NLP, BeautifulSoup and ReportLab.
    - Implemented automated ATS resume screening and dynamic job ranking.

    EXPERIENCE / INTERNSHIPS
    Software Engineering Intern (Summer 2025)
    - Developed backend REST APIs in Python and improved query performance by 25%.

    CERTIFICATIONS
    - AWS Certified Cloud Practitioner
    """
    file_name = f"{user_name.replace(' ', '_')}_Sample_Resume.pdf"
    parsed = parse_resume(sample_text.encode("utf-8"), file_name)
    extracted_skills = extract_skills_from_text(sample_text)
    ats_score, breakdown = calculate_ats_score(parsed, extracted_skills)
    detected_domain, domain_percentages = detect_candidate_domain(extracted_skills)

    return {
        "status": "success",
        "parsed_resume": parsed,
        "extracted_skills": extracted_skills,
        "ats_score": ats_score,
        "ats_breakdown": breakdown,
        "detected_domain": detected_domain,
        "domain_percentages": domain_percentages,
    }


def handle_calculate_metrics(payload):
    extracted_skills = payload.get("extracted_skills", [])
    required_skills = payload.get("required_skills", [])
    ats_score = float(payload.get("ats_score", 70.0))
    target_company = payload.get("target_company", "Google")
    target_role = payload.get("target_role", "Software Engineer")

    readiness_pct, matched_skills, missing_skills = calculate_readiness_score(
        extracted_skills, required_skills
    )
    detected_domain, domain_percentages = detect_candidate_domain(extracted_skills)
    strength_label, strength_color, strength_msg = evaluate_resume_strength(
        ats_score, readiness_pct
    )
    confidence_pct = calculate_ai_confidence(
        ats_score, readiness_pct, len(extracted_skills)
    )

    ai_insights = generate_ai_insights(
        ats_score=ats_score,
        readiness_pct=readiness_pct,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        sections=payload.get("section_presence", {}),
        target_role=target_role,
        target_company=target_company,
    )

    return {
        "status": "success",
        "readiness_pct": readiness_pct,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "detected_domain": detected_domain,
        "domain_percentages": domain_percentages,
        "strength_label": strength_label,
        "strength_color": strength_color,
        "strength_msg": strength_msg,
        "confidence_pct": confidence_pct,
        "ai_insights": ai_insights,
    }


def handle_rank_jobs(payload):
    extracted_skills = payload.get("extracted_skills", [])
    domain_filter = payload.get("domain_filter", "All Domains")
    ranked_jobs = rank_jobs_for_candidate(extracted_skills, domain_filter)
    return {"status": "success", "jobs": ranked_jobs}


def handle_scrape_url(payload):
    url = payload.get("url", "")
    res = fetch_job_description_from_url(url)
    return res


def handle_generate_roadmap(payload):
    missing_skills = payload.get("missing_skills", [])
    target_role = payload.get("target_role", "Software Engineer")
    target_company = payload.get("target_company", "Google")
    roadmap = generate_learning_roadmap(missing_skills, target_role, target_company)
    return {"status": "success", "roadmap": roadmap}


def handle_generate_interview(payload):
    target_role = payload.get("target_role", "Software Engineer")
    matched_skills = payload.get("matched_skills", [])
    missing_skills = payload.get("missing_skills", [])
    prep_data = generate_interview_prep(target_role, matched_skills, missing_skills)
    return {"status": "success", "prep_data": prep_data}


def handle_ask_interview_ai(payload):
    prompt = payload.get("prompt", "")
    target_role = payload.get("target_role", "Software Engineer")
    target_company = payload.get("target_company", "Google")
    res = ask_ai_interview_assistant(prompt, target_role, target_company)
    return res


def handle_evaluate_answer(payload):
    question = payload.get("question", "")
    user_answer = payload.get("user_answer", "")
    target_role = payload.get("target_role", "Software Engineer")
    res = evaluate_user_answer(question, user_answer, target_role)
    return res


def handle_generate_pdf(payload):
    student_name = payload.get("student_name", "Student Applicant")
    target_role = payload.get("target_role", "Software Engineer")
    target_company = payload.get("target_company", "Google")
    domain = payload.get("domain", "Software Engineering")
    ats_score = float(payload.get("ats_score", 70.0))
    readiness_score = float(payload.get("readiness_score", 65.0))
    confidence_score = float(payload.get("confidence_score", 80.0))
    resume_strength = payload.get("resume_strength", "Strong")
    matched_skills = payload.get("matched_skills", [])
    missing_skills = payload.get("missing_skills", [])
    recommendations = payload.get(
        "recommendations",
        ["Build a portfolio project targeting missing competencies."],
    )
    roadmap_phases = payload.get("roadmap_phases", [])

    pdf_bytes = generate_pdf_report(
        student_name=student_name,
        target_role=target_role,
        target_company=target_company,
        domain=domain,
        ats_score=ats_score,
        readiness_score=readiness_score,
        confidence_score=confidence_score,
        resume_strength=resume_strength,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        recommendations=recommendations,
        roadmap_phases=roadmap_phases,
    )

    output_path = payload.get("output_path")
    if output_path:
        with open(output_path, "wb") as f:
            f.write(pdf_bytes)
        return {"status": "success", "output_path": output_path}
    else:
        return {
            "status": "success",
            "pdf_b64": base64.b64encode(pdf_bytes).decode("utf-8"),
        }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "message": "No action specified."}))
        sys.exit(1)

    action = sys.argv[1]
    raw_input = sys.stdin.read().strip() if not sys.stdin.isatty() else "{}"
    try:
        payload = json.loads(raw_input) if raw_input else {}
    except Exception as e:
        payload = {}

    try:
        if action == "get_canonical_skills":
            res = handle_get_canonical_skills()
        elif action == "get_benchmark_data":
            res = handle_get_benchmark_data()
        elif action == "parse_resume":
            res = handle_parse_resume(payload)
        elif action == "parse_sample":
            res = handle_parse_sample(payload)
        elif action == "calculate_metrics":
            res = handle_calculate_metrics(payload)
        elif action == "rank_jobs":
            res = handle_rank_jobs(payload)
        elif action == "scrape_url":
            res = handle_scrape_url(payload)
        elif action == "generate_roadmap":
            res = handle_generate_roadmap(payload)
        elif action == "generate_interview":
            res = handle_generate_interview(payload)
        elif action == "ask_interview_ai":
            res = handle_ask_interview_ai(payload)
        elif action == "evaluate_answer":
            res = handle_evaluate_answer(payload)
        elif action == "generate_pdf":
            res = handle_generate_pdf(payload)
        else:
            res = {"status": "error", "message": f"Unknown action: {action}"}
    except Exception as e:
        res = {"status": "error", "message": str(e)}

    print(json.dumps(res))


if __name__ == "__main__":
    main()
