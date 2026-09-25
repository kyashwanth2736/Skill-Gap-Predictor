"""
ATS Scoring Engine & Career Intelligence Module
Project ID: P19 - Skill-Gap Predictor for Students (Career Navigation AI)
GITAM University, Bengaluru Campus
Developers: Vinay Kumar S, Yashwanth K, Mahesh B K
Mentor: Dr. N. Gayathri (M29)

Computes ATS compatibility score, Readiness score against job roles,
Resume Strength meter, AI Confidence meter, and generates actionable AI insights.
"""

import re
from typing import Dict, List, Any, Tuple

# Power action verbs sought by enterprise ATS screeners
ACTION_VERBS = [
    "developed", "designed", "engineered", "implemented", "built", "spearheaded",
    "optimized", "architected", "deployed", "automated", "created", "integrated",
    "analyzed", "reduced", "increased", "boosted", "managed", "delivered"
]


def calculate_ats_score(parsed_resume: Dict[str, Any], extracted_skills: List[str]) -> Tuple[float, Dict[str, Any]]:
    """
    Calculate an enterprise ATS score (0-100) based on 5 weighted pillars:
    1. Section completeness (25 pts)
    2. Contact information (15 pts)
    3. Technical skill density (25 pts)
    4. Resume length / word count health (15 pts)
    5. Action verbs and quantified metrics (20 pts)
    """
    score_breakdown = {}
    total_score = 0.0

    # 1. Section Completeness (Max 25)
    sections = parsed_resume.get("section_presence", {})
    sec_count = sum(1 for present in sections.values() if present)
    section_score = (sec_count / 5.0) * 25.0
    score_breakdown["sections"] = {
        "score": round(section_score, 1),
        "max": 25,
        "detail": f"{sec_count} of 5 essential sections identified."
    }
    total_score += section_score

    # 2. Contact Information (Max 15)
    contact = parsed_resume.get("contact_info", {})
    contact_pts = 0.0
    if contact.get("email"):
        contact_pts += 5.0
    if contact.get("phone"):
        contact_pts += 4.0
    if contact.get("linkedin"):
        contact_pts += 3.0
    if contact.get("github"):
        contact_pts += 3.0
    score_breakdown["contact"] = {
        "score": round(contact_pts, 1),
        "max": 15,
        "detail": f"Contact signals detected: {[k for k, v in contact.items() if v]}"
    }
    total_score += contact_pts

    # 3. Technical Skill Density (Max 25)
    num_skills = len(extracted_skills)
    if num_skills >= 10:
        skill_score = 25.0
    elif num_skills >= 6:
        skill_score = 18.0
    elif num_skills >= 3:
        skill_score = 12.0
    else:
        skill_score = max(5.0, num_skills * 2.0)
    score_breakdown["skills"] = {
        "score": round(skill_score, 1),
        "max": 25,
        "detail": f"{num_skills} recognized technical skills found."
    }
    total_score += skill_score

    # 4. Length & Formatting Health (Max 15)
    word_count = parsed_resume.get("word_count", 0)
    if 300 <= word_count <= 900:
        length_score = 15.0
        length_note = "Optimal resume length (1-2 pages)."
    elif 150 <= word_count < 300:
        length_score = 10.0
        length_note = "Slightly brief; consider elaborating on projects."
    elif word_count > 900:
        length_score = 8.0
        length_note = "Exceeds standard 2-page length for campus placement."
    else:
        length_score = 4.0
        length_note = "Too short to evaluate adequately."
    score_breakdown["length"] = {
        "score": round(length_score, 1),
        "max": 15,
        "detail": f"{word_count} words: {length_note}"
    }
    total_score += length_score

    # 5. Action Verbs & Quantified Metrics (Max 20)
    raw_text = parsed_resume.get("raw_text", "").lower()
    verb_hits = sum(1 for verb in ACTION_VERBS if re.search(rf"\b{verb}\b", raw_text))
    # Check for numbers/percentages indicating measurable outcomes
    metrics_hits = len(re.findall(r"\b\d+%\b|\b\d+\+\b|\b\$?\d+[kKmMbB]?\b", raw_text))

    impact_score = min(10.0, verb_hits * 1.5) + min(10.0, metrics_hits * 2.0)
    score_breakdown["impact"] = {
        "score": round(impact_score, 1),
        "max": 20,
        "detail": f"{verb_hits} action verbs and {metrics_hits} quantifiable achievements."
    }
    total_score += impact_score

    ats_score = min(100.0, max(0.0, round(total_score, 1)))
    return ats_score, score_breakdown


def calculate_readiness_score(candidate_skills: List[str], required_skills: List[str]) -> Tuple[float, List[str], List[str]]:
    """
    Calculate job readiness score:
    Readiness = (Matched Skills / Total Required Skills) * 100
    Returns: (readiness_percentage, matched_skills, missing_skills)
    """
    if not required_skills:
        return 100.0, candidate_skills, []

    cand_set = {s.strip().lower() for s in candidate_skills}
    matched = []
    missing = []

    for req in required_skills:
        req_norm = req.strip().lower()
        if req_norm in cand_set or any(req_norm in c or c in req_norm for c in cand_set):
            matched.append(req)
        else:
            missing.append(req)

    readiness = round((len(matched) / len(required_skills)) * 100, 1)
    return readiness, matched, missing


def evaluate_resume_strength(ats_score: float, readiness_score: float) -> Tuple[str, str, str]:
    """
    Determine Resume Strength rating (Strong / Moderate / Weak) and CSS badge style.
    Returns: (rating_label, badge_color, message)
    """
    composite = (ats_score * 0.4) + (readiness_score * 0.6)

    if composite >= 75:
        return "Strong", "#10B981", "Your profile meets high industry expectations and stands a strong chance for campus shortlisting."
    elif composite >= 50:
        return "Moderate", "#F59E0B", "Good foundational profile. Bridging specific skill gaps will significantly boost shortlisting odds."
    else:
        return "Weak", "#EF4444", "Needs immediate attention. Add key technical competencies, improve section layout, and highlight projects."


def calculate_ai_confidence(ats_score: float, readiness_score: float, skill_count: int) -> float:
    """
    Calculate an AI prediction confidence score indicating accuracy
    and reliability of the recommendation model based on data density.
    """
    data_richness = min(100.0, (skill_count / 12.0) * 100)
    confidence = (ats_score * 0.3) + (readiness_score * 0.4) + (data_richness * 0.3)
    return round(min(98.5, max(45.0, confidence)), 1)


def generate_ai_insights(
    ats_score: float,
    readiness_score: float,
    matched_skills: List[str],
    missing_skills: List[str],
    section_presence: Dict[str, bool],
    target_role: str,
    target_company: str,
) -> Dict[str, List[str]]:
    """Generate dynamic AI insights tailored to student resume and role gaps."""
    strengths = []
    improvements = []
    recommendations = []

    # Strengths
    if matched_skills:
        strengths.append(f"Strong foundation in core requirements: {', '.join(matched_skills[:4])}.")
    if section_presence.get("Projects", False):
        strengths.append("Dedicated Projects section detected, showcasing practical hands-on capability.")
    if section_presence.get("Experience / Internships", False):
        strengths.append("Internship or work experience section present, giving an edge over purely academic resumes.")
    if ats_score >= 70:
        strengths.append("Formatting and ATS keyword structure are well-aligned with recruiter parsing engines.")

    # Areas for Improvement
    if missing_skills:
        improvements.append(f"Missing high-priority technical skills for {target_role}: {', '.join(missing_skills[:5])}.")
    for sec_name, present in section_presence.items():
        if not present:
            improvements.append(f"Missing or indistinct standard section: '{sec_name}'. Add a clear header.")
    if ats_score < 60:
        improvements.append("Resume contains insufficient quantifiable metrics (e.g. 'improved performance by 30%').")

    # Recommendations
    if missing_skills:
        recommendations.append(f"Complete focused hands-on projects incorporating '{missing_skills[0]}' and '{missing_skills[1] if len(missing_skills)>1 else missing_skills[0]}'.")
    recommendations.append(f"Tailor your resume summary and project bullet points specifically to {target_company}'s tech stack.")
    recommendations.append("Ensure your GitHub profile link includes active repositories demonstrating clean code and documentation.")

    return {
        "strengths": strengths if strengths else ["Profile ready for initial skill baseline comparison."],
        "improvements": improvements if improvements else ["Profile is well-rounded; keep skills updated."],
        "recommendations": recommendations,
    }
