"""
Final IEEE Project Report Generator
Project ID: P19 - Skill-Gap Predictor for Students (Career Navigation AI)
IEEE CS Bangalore Chapter Internship and Mentorship Program - 2026
GITAM University, Bengaluru Campus
Students: Vinay Kumar S, Yashwanth K, Mahesh B K
Mentor: Dr. N. Gayathri (M29)

Generates both 'Final Project Report.docx' and 'Final Project Report.pdf'
matching the exact formatting and official template of previous monthly reports.
"""

import os
import sys
from datetime import datetime

# Path setup
PROJECT_DIR = r"C:\Users\Mahesh B K\Documents\IEEE project"
DOCX_PATH = os.path.join(PROJECT_DIR, "Final Project Report.docx")
PDF_PATH = os.path.join(PROJECT_DIR, "Final Project Report.pdf")


def generate_docx_report():
    import docx
    from docx.shared import Inches, Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.enum.table import WD_TABLE_ALIGNMENT
    from docx.oxml import OxmlElement, parse_xml
    from docx.oxml.ns import nsdecls, qn

    doc = docx.Document()

    # Set 1-inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Helper styling function
    def add_header_text(text, font_size=14, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, color=RGBColor(30, 58, 138)):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(text)
        run.bold = bold
        run.font.size = Pt(font_size)
        run.font.name = "Calibri"
        run.font.color.rgb = color
        return p

    def add_section_heading(number_and_title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(number_and_title)
        run.bold = True
        run.font.size = Pt(13)
        run.font.name = "Calibri"
        run.font.color.rgb = RGBColor(30, 64, 175)
        return p

    def add_body_paragraph(text, space_after=6):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        run.font.size = Pt(11)
        run.font.name = "Calibri"
        run.font.color.rgb = RGBColor(31, 41, 55)
        return p

    def add_bullet_point(text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        run.font.size = Pt(11)
        run.font.name = "Calibri"
        run.font.color.rgb = RGBColor(31, 41, 55)
        return p

    # --- TITLE & METADATA ---
    add_header_text("IEEE CS Bangalore Chapter Internship and Mentorship Program – 2026", font_size=15, bold=True)
    add_header_text("FINAL PROJECT REPORT", font_size=13, bold=True, color=RGBColor(75, 85, 99))
    add_header_text("Duration: 1st April 2026 to 30th September 2026", font_size=11, bold=False, color=RGBColor(55, 65, 81))

    doc.add_paragraph()

    # Meta Table
    table = doc.add_table(rows=6, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    meta_rows = [
        ("Project ID:", "P19"),
        ("Name of the Students:", "Vinay Kumar S, Yashwanth K, Mahesh B K"),
        ("University / College Name:", "GITAM University, Bengaluru Campus"),
        ("Name of the Mentor:", "Dr. N. Gayathri (M29)"),
        ("Mentor's Organization:", "GITAM University, Bengaluru Campus"),
        ("Title of the Project:", "Skill-Gap Predictor for Students (Career Navigation AI)"),
    ]

    for i, (label, val) in enumerate(meta_rows):
        row = table.rows[i]
        cell_lbl, cell_val = row.cells[0], row.cells[1]
        cell_lbl.width = Inches(2.2)
        cell_val.width = Inches(4.3)
        
        p1 = cell_lbl.paragraphs[0]
        r1 = p1.add_run(label)
        r1.bold = True
        r1.font.size = Pt(10.5)
        r1.font.name = "Calibri"

        p2 = cell_val.paragraphs[0]
        r2 = p2.add_run(val)
        r2.bold = (i == 5)
        r2.font.size = Pt(10.5)
        r2.font.name = "Calibri"

    doc.add_paragraph()

    # 1. Problem Definition
    add_section_heading("1. Problem Definition")
    add_body_paragraph(
        "University students and fresh engineering graduates often struggle to transition smoothly from academic learning to corporate employment. While students complete coursework in core computer science subjects, there remains an acute lack of visibility regarding whether their practical competencies meet the hiring benchmarks of specific technology corporations and target roles."
    )
    add_body_paragraph(
        "Conventional placement preparation relies heavily on unguided self-study, informal senior advice, or generic job search engines that provide no actionable feedback. Furthermore, corporate recruitment pipelines utilize automated Applicant Tracking Systems (ATS) to filter resumes based on keyword relevance, formatting integrity, and structural metrics. Resumes lacking proper ATS optimization or possessing unnoticed skill gaps are discarded before human recruiter review."
    )
    add_body_paragraph(
        "To solve this problem systematically, our project developed an end-to-end, enterprise-grade AI Career Navigation and Skill-Gap Prediction platform. The system ingests student resumes, automatically extracts technical proficiencies, determines the student's technical domain, compares qualifications against real-time industry benchmarks, scores ATS compatibility, isolates skill gaps, and generates tailored 8-week learning roadmaps, mock interview drills, and verifiable assessment reports."
    )

    # 2. Literature Review
    add_section_heading("2. Literature Review")
    add_body_paragraph("During the 6-month mentorship tenure, an extensive literature review was conducted across the following thematic areas:")
    add_bullet_point("Applicant Tracking Systems (ATS) and Resume Screening: Examined parsing heuristics, tokenization methodologies, keyword weighting, and section segmentation utilized in enterprise recruitment software.")
    add_bullet_point("Natural Language Processing for Skill Extraction: Studied rule-based regex parsing, canonical taxonomies, and semantic synonym mapping (e.g., resolving 'DL' to 'Deep Learning', 'K8s' to 'Kubernetes') to standardize candidate skill profiles.")
    add_bullet_point("Automatic Web Retrieval (AWR): Analyzed real-time web scraping techniques utilizing Requests and BeautifulSoup to extract live job descriptions from corporate career portals.")
    add_bullet_point("Recommendation and Ranking Algorithms: Investigated distance-based multi-role ranking systems to compute match readiness across divergent technical domains.")
    add_bullet_point("User Authentication & Data Privacy in EdTech: Studied cryptographic hashing (SHA-256) and database tenancy to ensure individual student data isolation.")

    # 3. Existing System vs. Proposed System
    add_section_heading("3. Existing System vs. Proposed System")
    add_body_paragraph("Existing Systems:")
    add_bullet_point("Traditional job boards (LinkedIn, Indeed) present job vacancies but offer no personalized gap analysis.")
    add_bullet_point("Generic resume scanners compute superficial keyword scores without company-specific role calibrations.")
    add_bullet_point("Lack of integrated learning pathways, dynamic multi-role ranking, or placement readiness radar visualizations.")
    add_bullet_point("No isolated student profile tracking or historical resume improvement monitoring.")

    add_body_paragraph("Proposed System (Career Navigation AI):")
    add_bullet_point("Individual Student Authentication: Secure login/signup system with SHA-256 password encryption ensuring complete data privacy.")
    add_bullet_point("Dual Company Matching Architecture: Allows choosing from tier-1 benchmark companies (Google, Microsoft, Amazon, TCS, Infosys, etc.) OR entering custom company names and job roles without limit.")
    add_bullet_point("Automated Resume Parsing: Multi-format parsing (PDF and DOCX) extracting text, section hierarchy, contact info, and word counts.")
    add_bullet_point("Dynamic Domain Classifier: Automatically categorizes students into domains such as AI/ML, Cloud/DevOps, Full Stack, or Cybersecurity.")
    add_bullet_point("Enterprise ATS & Readiness Scoring: Calculates 5-pillar ATS scores, readiness percentages, and Resume Strength ratings (Strong/Moderate/Weak).")
    add_bullet_point("Personalized 8-Week Roadmap: Stage-by-stage learning plans with documentation links, platforms, and portfolio project suggestions.")
    add_bullet_point("AI Interview Preparation: Generates technical questions for known skills, gap drills for missing competencies, and STAR-method behavioral guidance.")
    add_bullet_point("Official PDF Report Export: Automatically produces downloadable IEEE-compliant evaluation documents via ReportLab.")

    # 4. Architectural Framework & Workflow
    add_section_heading("4. Architectural Framework")
    add_body_paragraph(
        "The application is engineered as a decoupled, modular system adhering to high-cohesion software design principles. The complete data pipeline operates through the following sequence:"
    )
    add_body_paragraph(
        "User Authentication (Login/Register) ➔ Resume Upload & Ingestion ➔ Section Segmentation & Contact Signal Extraction ➔ NLP Skill & Domain Classification ➔ Company & Role Benchmark Comparison ➔ Multi-Pillar ATS Engine & Confidence Meter ➔ Dynamic Multi-Role Job Ranking ➔ Milestone Roadmap & Interview Generation ➔ SQLite History Storage ➔ Interactive Plotly Placement Dashboard & PDF Export."
    )

    # 5. Knowledge Gained & Tech Stack
    add_section_heading("5. Knowledge Gained – Tools & Technologies")
    add_bullet_point("Python 3.10+: Core programming language, object-oriented design, regex pattern matching, and file I/O.")
    add_bullet_point("Streamlit: Full-stack interactive reactive web application framework and state management.")
    add_bullet_point("pdfplumber & PyPDF: Robust digital text extraction, stream parsing, and PDF document geometry analysis.")
    add_bullet_point("python-docx: Word document parsing and automated DOCX report synthesis.")
    add_bullet_point("BeautifulSoup4 & Requests: Automatic Web Retrieval (AWR) for live careers webpage scraping.")
    add_bullet_point("ReportLab: Programmatic PDF document compilation with custom styling, tables, and page geometry.")
    add_bullet_point("Plotly Express & Graph Objects: Data visualization for radar competency charts and domain distribution pies.")
    add_bullet_point("SQLite3 & Cryptography: Relational database design, table migrations, and SHA-256 password hashing.")
    add_bullet_point("VS Code & Git: Source code management, multi-developer collaboration, and cloud deployment configuration (Render).")

    # 6. Project Implementation
    add_section_heading("6. Project Implementation Details")
    add_body_paragraph("The implementation comprises modular Python components located in the 'modules/' package:")
    add_bullet_point("database.py: Implements user registration, credential authentication, student profile CRUD, and historical resume tracking.")
    add_bullet_point("resume_parser.py: Ingests PDF/DOCX streams, detects 5 core sections (Education, Skills, Experience, Projects, Certifications), extracts contact details, and measures formatting metrics.")
    add_bullet_point("skill_extractor.py: Implements canonical skill taxonomy across 7 tech domains, synonym mapping dictionary, and domain affinity calculation.")
    add_bullet_point("ats_engine.py: Evaluates 5-weighted ATS pillars (Section integrity, contact info, skill density, formatting health, and action verb impact).")
    add_bullet_point("job_scraper.py: Fetches live job descriptions via URL and executes dynamic job ranking across 10+ standard industry roles.")
    add_bullet_point("roadmap_generator.py: Synthesizes 4-phase, 8-week structured learning plans with curated documentation links and resume project ideas.")
    add_bullet_point("interview_prep.py: Produces technical interview drills for verified and missing skills, alongside STAR behavioral answers.")
    add_bullet_point("pdf_generator.py: Synthesizes downloadable IEEE-format PDF evaluation summaries using ReportLab.")
    add_bullet_point("app.py: Main presentation layer orchestrating navigation, state persistence, Plotly charts, and authenticated user views.")

    # 7. Results & Key Accomplishments
    add_section_heading("7. Results & Key Accomplishments")
    add_body_paragraph("The platform successfully achieved all milestones outlined across Months 1 to 4:")
    add_bullet_point("High-accuracy resume extraction across PDF and Word document structures.")
    add_bullet_point("Accurate identification of candidate technical domains and canonical skill normalization.")
    add_bullet_point("Real-time readiness scoring against Tier-1 product corporations (Google, Microsoft, Amazon, Meta) and IT services leaders (TCS, Infosys, Wipro, Accenture).")
    add_bullet_point("Flexible support for arbitrary custom company and job role specifications.")
    add_bullet_point("Multi-tenant user authentication preventing cross-profile data leakage.")
    add_bullet_point("Instant generation of professional, downloadable PDF assessment reports.")
    add_bullet_point("Interactive placement radar charts and historical score progression curves.")

    # 8. Conclusion and Future Work
    add_section_heading("8. Conclusion and Future Work")
    add_body_paragraph(
        "The Skill-Gap Predictor for Students (Career Navigation AI) successfully bridges the critical divide between collegiate education and corporate hiring standards. By integrating multi-format resume parsing, ATS scoring, dynamic role ranking, interactive analytics, and milestone roadmaps, the platform equips students with clear, actionable strategies to optimize their career trajectories."
    )
    add_body_paragraph("Future research and engineering avenues include:")
    add_bullet_point("Integration of Generative AI Large Language Models (LLMs) for automated contextual resume sentence rewriting.")
    add_bullet_point("Voice-based AI mock interview simulations with real-time sentiment and technical evaluation.")
    add_bullet_point("Institutional placement officer portals for aggregate batch analytics and recruiter shortlisting.")
    add_bullet_point("Direct API webhooks with major university campus placement databases.")

    # Mentor Sign-off Block
    doc.add_paragraph()
    doc.add_paragraph()
    sign_p = doc.add_paragraph()
    sign_p.paragraph_format.keep_with_next = True
    r_sig = sign_p.add_run("Mentor Signature: ___________________________          Date: 30-09-2026")
    r_sig.bold = True
    r_sig.font.size = Pt(11)
    r_sig.font.name = "Calibri"

    p_mentor = doc.add_paragraph()
    r_men = p_mentor.add_run("Dr. N. Gayathri (M29)\nMentor, GITAM University Bangalore Campus")
    r_men.font.size = Pt(10.5)
    r_men.font.name = "Calibri"

    doc.save(DOCX_PATH)
    print("DOCX successfully generated:", DOCX_PATH)


def generate_pdf_final():
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    doc = SimpleDocTemplate(
        PDF_PATH,
        pagesize=letter,
        rightMargin=45,
        leftMargin=45,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "FinalDocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=19,
        textColor=colors.HexColor("#1E3A8A"),
        alignment=1,
    )

    subtitle_style = ParagraphStyle(
        "FinalDocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#4B5563"),
        alignment=1,
    )

    h1_style = ParagraphStyle(
        "FinalHeader1",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#1D4ED8"),
        spaceBefore=11,
        spaceAfter=5,
    )

    body_style = ParagraphStyle(
        "FinalBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1F2937"),
        spaceAfter=4,
    )

    bullet_style = ParagraphStyle(
        "FinalBullet",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1F2937"),
        leftIndent=14,
        spaceAfter=3,
    )

    story = []

    # Title & Metadata
    story.append(Paragraph("IEEE CS Bangalore Chapter Internship and Mentorship Program – 2026", subtitle_style))
    story.append(Paragraph("<b>FINAL PROJECT REPORT</b>", title_style))
    story.append(Paragraph("Duration: 1st April 2026 to 30th September 2026", subtitle_style))
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2563EB"), spaceAfter=8))

    meta_data = [
        [Paragraph("<b>Project ID:</b>", body_style), Paragraph("P19", body_style)],
        [Paragraph("<b>Name of the Students:</b>", body_style), Paragraph("Vinay Kumar S, Yashwanth K, Mahesh B K", body_style)],
        [Paragraph("<b>University / College Name:</b>", body_style), Paragraph("GITAM University, Bengaluru Campus", body_style)],
        [Paragraph("<b>Name of the Mentor:</b>", body_style), Paragraph("Dr. N. Gayathri (M29)", body_style)],
        [Paragraph("<b>Mentor's Organization:</b>", body_style), Paragraph("GITAM University, Bengaluru Campus", body_style)],
        [Paragraph("<b>Title of the Project:</b>", body_style), Paragraph("<b>Skill-Gap Predictor for Students (Career Navigation AI)</b>", body_style)],
    ]
    meta_table = Table(meta_data, colWidths=[160, 360])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ("PADDING", (0, 0), (-1, -1), 4),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 6))

    # 1. Problem Definition
    story.append(Paragraph("1. Problem Definition", h1_style))
    story.append(Paragraph(
        "University students and fresh engineering graduates often struggle to transition smoothly from academic learning to corporate employment. While students complete coursework in core computer science subjects, there remains an acute lack of visibility regarding whether their practical competencies meet the hiring benchmarks of specific technology corporations and target roles.",
        body_style
    ))
    story.append(Paragraph(
        "To solve this problem systematically, our project developed an end-to-end, enterprise-grade AI Career Navigation and Skill-Gap Prediction platform. The system ingests student resumes, automatically extracts technical proficiencies, determines the student's technical domain, compares qualifications against real-time industry benchmarks, scores ATS compatibility, isolates skill gaps, and generates tailored 8-week learning roadmaps, mock interview drills, and verifiable assessment reports.",
        body_style
    ))

    # 2. Literature Review
    story.append(Paragraph("2. Literature Review", h1_style))
    story.append(Paragraph("• <b>Applicant Tracking Systems (ATS):</b> Examined parsing heuristics, tokenization methodologies, keyword weighting, and section segmentation utilized in enterprise recruitment software.", bullet_style))
    story.append(Paragraph("• <b>NLP-based Skill Extraction:</b> Studied rule-based regex parsing, canonical taxonomies, and semantic synonym mapping to standardize candidate skill profiles.", bullet_style))
    story.append(Paragraph("• <b>Automatic Web Retrieval (AWR):</b> Analyzed real-time web scraping techniques utilizing Requests and BeautifulSoup to extract live job descriptions from corporate career portals.", bullet_style))
    story.append(Paragraph("• <b>Recommendation and Ranking Algorithms:</b> Investigated distance-based multi-role ranking systems to compute match readiness across divergent technical domains.", bullet_style))
    story.append(Paragraph("• <b>User Authentication & Tenancy:</b> Studied cryptographic hashing (SHA-256) and database architecture to ensure individual student data isolation.", bullet_style))

    # 3. Existing vs Proposed
    story.append(Paragraph("3. Existing System vs. Proposed System", h1_style))
    story.append(Paragraph("Traditional job portals and generic resume checkers offer limited, non-personalized feedback without company-specific role calibrations. They lack integrated 8-week milestone roadmaps, dynamic multi-role ranking, or placement readiness radar visualizations.", body_style))
    story.append(Paragraph("Our proposed <b>Career Navigation AI</b> incorporates: (1) Isolated student authentication, (2) Dual company selection (Tier-1 benchmarks or custom company entry), (3) Multi-format resume parsing (PDF/DOCX), (4) Dynamic domain classification, (5) 5-pillar ATS scoring, (6) Automatic web retrieval of live job postings, (7) AI interview prep, and (8) Official IEEE PDF evaluation report generation.", body_style))

    # 4. Architectural Framework
    story.append(Paragraph("4. Architectural Framework & Workflow", h1_style))
    story.append(Paragraph(
        "<b>Workflow Pipeline:</b> Student Authentication (Login/Register) ➔ Resume Upload & Ingestion ➔ Section Segmentation & Contact Signal Extraction ➔ NLP Skill & Domain Classification ➔ Company & Role Benchmark Comparison ➔ Multi-Pillar ATS Engine & Confidence Meter ➔ Dynamic Multi-Role Job Ranking ➔ Milestone Roadmap & Interview Generation ➔ SQLite History Storage ➔ Interactive Plotly Placement Dashboard & PDF Export.",
        body_style
    ))

    # 5. Knowledge Gained & Implementation
    story.append(Paragraph("5. Knowledge Gained & Modular Implementation", h1_style))
    story.append(Paragraph("<b>Technologies Employed:</b> Python 3.10+, Streamlit, pdfplumber, pypdf, python-docx, BeautifulSoup4, Requests, ReportLab, Plotly, SQLite3, SHA-256 Cryptography, and VS Code.", body_style))
    story.append(Paragraph("<b>Engineered Modules:</b>", body_style))
    story.append(Paragraph("• <code>modules/database.py</code>: Implements user authentication, profile CRUD, and historical resume tracking.", bullet_style))
    story.append(Paragraph("• <code>modules/resume_parser.py</code>: Ingests PDF/DOCX streams, detects 5 core sections, extracts contact details, and measures formatting metrics.", bullet_style))
    story.append(Paragraph("• <code>modules/skill_extractor.py</code>: Implements canonical skill taxonomy across 7 tech domains and synonym normalization.", bullet_style))
    story.append(Paragraph("• <code>modules/ats_engine.py</code>: Evaluates 5-weighted ATS pillars (Section integrity, contact info, skill density, formatting health, and action verb impact).", bullet_style))
    story.append(Paragraph("• <code>modules/job_scraper.py</code>: Automatic Web Retrieval (AWR) for live job URLs and multi-role job ranking.", bullet_style))
    story.append(Paragraph("• <code>modules/roadmap_generator.py</code>: Synthesizes 4-phase, 8-week structured learning plans with curated documentation links and capstones.", bullet_style))
    story.append(Paragraph("• <code>modules/interview_prep.py</code>: Produces technical interview drills for known and missing skills, alongside STAR behavioral answers.", bullet_style))
    story.append(Paragraph("• <code>modules/pdf_generator.py</code>: Programmatic IEEE-format PDF evaluation report export.", bullet_style))
    story.append(Paragraph("• <code>app.py</code>: Main Streamlit dashboard orchestrating reactive UI, Plotly charts, and student sessions.", bullet_style))

    # 6. Results & Conclusion
    story.append(Paragraph("6. Results & Key Accomplishments", h1_style))
    story.append(Paragraph("Successfully built an enterprise prototype providing: (1) High-accuracy resume parsing across PDF and DOCX formats; (2) Instant domain detection (AI/ML, Web, Cloud, Cybersecurity, etc.); (3) Accurate ATS scoring and readiness evaluation; (4) Multi-role ranking across 10+ industry positions; (5) Multi-tenant user login ensuring private data access; (6) Downloadable official IEEE assessment reports.", body_style))

    story.append(Paragraph("7. Conclusion & Future Scope", h1_style))
    story.append(Paragraph(
        "The Skill-Gap Predictor for Students (Career Navigation AI) successfully delivers an intelligent, personalized career preparation platform. Future enhancements will integrate LLM-powered resume sentence rewriting, real-time voice interview simulations, and placement office administrative portals.",
        body_style
    ))

    # Mentor Sign-off Block
    story.append(Spacer(1, 14))
    story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#94A3B8"), spaceAfter=10))
    story.append(Paragraph("<b>Mentor Signature:</b> ___________________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>Date:</b> 30-09-2026", body_style))
    story.append(Paragraph("<b>Dr. N. Gayathri (M29)</b><br/>Mentor, GITAM University Bangalore Campus", subtitle_style))

    doc.build(story)
    print("PDF successfully generated:", PDF_PATH)


if __name__ == "__main__":
    generate_docx_report()
    generate_pdf_final()
