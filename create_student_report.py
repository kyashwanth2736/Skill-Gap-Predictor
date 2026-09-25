"""
Student Voice Final IEEE Project Report Builder
Project ID: P19 - Skill-Gap Predictor for Students (Career Navigation AI)
GITAM University, Bengaluru Campus
Students: Vinay Kumar S, Yashwanth K, Mahesh B K
Mentor: Dr. N. Gayathri (M29)

Creates a genuine, student-written Word Document (.docx) with pointed bullet points,
clean formatting, and an embedded workflow flowchart diagram. Deletes the PDF version.
"""

import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

PROJECT_DIR = r"C:\Users\Mahesh B K\Documents\IEEE project"
DOCX_PATH = os.path.join(PROJECT_DIR, "Final Project Report.docx")
PDF_PATH = os.path.join(PROJECT_DIR, "Final Project Report.pdf")
DIAGRAM_PATH = os.path.join(PROJECT_DIR, "workflow_diagram.png")


def remove_pdf_if_exists():
    """Delete the PDF report as requested by the student."""
    if os.path.exists(PDF_PATH):
        try:
            os.remove(PDF_PATH)
            print("Successfully deleted PDF report:", PDF_PATH)
        except Exception as e:
            print("Notice: Could not delete PDF:", e)


def generate_flowchart_diagram():
    """Create a clean, pointed workflow flowchart image to insert into the Word document."""
    fig, ax = plt.subplots(figsize=(10, 6.2), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7.5)
    ax.axis("off")

    # Flowchart boxes definition: (text, x, y, width, height, color, textcolor)
    boxes = [
        # Row 1 (Top)
        ("1. Student Auth\n(Login / Sign Up)", 0.6, 5.8, 2.2, 1.1, "#2563EB", "white"),
        ("2. Resume Upload\n(PDF / Word Ingestion)", 3.8, 5.8, 2.4, 1.1, "#1D4ED8", "white"),
        ("3. NLP Parser\n(Sections & Contact)", 7.1, 5.8, 2.3, 1.1, "#1E40AF", "white"),

        # Row 2 (Middle)
        ("6. ATS & Readiness Engine\n(Score, Strengths & Gaps)", 7.1, 3.4, 2.3, 1.1, "#0D9488", "white"),
        ("5. Target Matching\n(Top Tech / Custom Co.)", 3.8, 3.4, 2.4, 1.1, "#0F766E", "white"),
        ("4. Skill & Domain Engine\n(Taxonomy & Synonyms)", 0.6, 3.4, 2.2, 1.1, "#115E59", "white"),

        # Row 3 (Bottom)
        ("7. Dynamic Job Ranking\n(Multi-Role Market Fit)", 0.6, 1.0, 2.2, 1.1, "#4F46E5", "white"),
        ("8. 8-Week Roadmap\n(Custom Project Milestones)", 3.8, 1.0, 2.4, 1.1, "#4338CA", "white"),
        ("9. AI Interview & Report\n(STAR Drills & History Log)", 7.1, 1.0, 2.3, 1.1, "#3730A3", "white"),
    ]

    for label, x, y, w, h, bg, tc in boxes:
        rect = patches.FancyBboxPatch(
            (x, y), w, h,
            boxstyle="round,pad=0.15,rounding_size=0.12",
            facecolor=bg, edgecolor="#CBD5E1", linewidth=1.5
        )
        ax.add_patch(rect)
        ax.text(x + w / 2, y + h / 2, label, color=tc, fontsize=9.5, fontweight="bold",
                ha="center", va="center", multialignment="center")

    # Connective arrows
    arrow_props = dict(arrowstyle="->,head_width=0.4,head_length=0.4", color="#334155", lw=2)

    # Row 1 left to right
    ax.annotate("", xy=(3.8, 6.35), xytext=(2.8, 6.35), arrowprops=arrow_props)
    ax.annotate("", xy=(7.1, 6.35), xytext=(6.2, 6.35), arrowprops=arrow_props)

    # Row 1 to Row 2 (Down from box 3 to box 6)
    ax.annotate("", xy=(8.25, 4.5), xytext=(8.25, 5.8), arrowprops=arrow_props)

    # Row 2 right to left
    ax.annotate("", xy=(6.2, 3.95), xytext=(7.1, 3.95), arrowprops=arrow_props)
    ax.annotate("", xy=(2.8, 3.95), xytext=(3.8, 3.95), arrowprops=arrow_props)

    # Row 2 to Row 3 (Down from box 4 to box 7)
    ax.annotate("", xy=(1.7, 2.1), xytext=(1.7, 3.4), arrowprops=arrow_props)

    # Row 3 left to right
    ax.annotate("", xy=(3.8, 1.55), xytext=(2.8, 1.55), arrowprops=arrow_props)
    ax.annotate("", xy=(7.1, 1.55), xytext=(6.2, 1.55), arrowprops=arrow_props)

    plt.tight_layout()
    plt.savefig(DIAGRAM_PATH, bbox_inches="tight", dpi=300)
    plt.close()
    print("Flowchart diagram generated at:", DIAGRAM_PATH)


def build_word_document():
    doc = docx.Document()

    # Set standard 1-inch margins
    for sec in doc.sections:
        sec.top_margin = Inches(1.0)
        sec.bottom_margin = Inches(1.0)
        sec.left_margin = Inches(1.0)
        sec.right_margin = Inches(1.0)

    # Helpers
    def p_header(text, size=13, bold=True, color=RGBColor(30, 41, 59)):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(3)
        run = p.add_run(text)
        run.bold = bold
        run.font.name = "Arial"
        run.font.size = Pt(size)
        run.font.color.rgb = color
        return p

    def p_section(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(5)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(title)
        run.bold = True
        run.font.name = "Arial"
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor(15, 23, 42)
        return p

    def p_sub(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(title)
        run.bold = True
        run.font.name = "Arial"
        run.font.size = Pt(10.5)
        run.font.color.rgb = RGBColor(30, 58, 138)
        return p

    def p_text(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(5)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        run.font.name = "Arial"
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(30, 41, 59)
        return p

    def p_bullet(text):
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        run.font.name = "Arial"
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(30, 41, 59)
        return p

    # HEADER (Exact IEEE template format)
    p_header("IEEE CS Bangalore Chapter Internship and Mentorship Program – 2026", size=13, bold=True)
    p_header("FINAL PROJECT PROGRESS REPORT", size=12, bold=True, color=RGBColor(37, 99, 235))
    p_header("Duration: 1st April 2026 to 30th September 2026", size=10, bold=False, color=RGBColor(71, 85, 105))

    doc.add_paragraph()

    # Meta Table (Exactly matching the format in previous reports)
    table = doc.add_table(rows=6, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    meta = [
        ("Project ID:", "P19"),
        ("Name of the Students:", "Vinay Kumar S\nYashwanth K\nMahesh B K"),
        ("University/ College Name:", "GITAM University, Bengaluru Campus"),
        ("Name of the Mentor:", "Dr. N Gayathri (M29)"),
        ("Mentor's Organization:", "GITAM University, Bengaluru Campus"),
        ("Title of the Project:", "Skill-Gap Predictor for Students (Career Navigation AI)"),
    ]

    for i, (k, v) in enumerate(meta):
        row = table.rows[i]
        c1, c2 = row.cells[0], row.cells[1]
        c1.width = Inches(2.2)
        c2.width = Inches(4.3)
        
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(2)
        r1 = p1.add_run(k)
        r1.bold = True
        r1.font.name = "Arial"
        r1.font.size = Pt(10)

        p2 = c2.paragraphs[0]
        p2.paragraph_format.space_after = Pt(2)
        r2 = p2.add_run(v)
        r2.bold = (i == 5 or i == 0)
        r2.font.name = "Arial"
        r2.font.size = Pt(10)

    doc.add_paragraph()

    # 1. Problem Definition
    p_section("1. Problem Definition")
    p_text(
        "Many students learn different programming languages and subjects in college, but during placement season they often do not know whether their skills match what companies are actually expecting. For example, a student may know basic Python and SQL, but a company hiring for a Data Analyst role may also expect Power BI, advanced Excel, statistical concepts, and dashboard projects."
    )
    p_text("Main problems students face:")
    p_bullet("Students get confused about which skills are required for specific companies.")
    p_bullet("Most students follow random YouTube roadmaps or ask seniors, which does not give clear feedback on their own resumes.")
    p_bullet("Company hiring portals use Applicant Tracking Systems (ATS) that reject resumes automatically if key skills or proper formatting are missing.")
    p_bullet("Existing tools either check only keywords or charge money, without providing a personalized learning roadmap or interview preparation.")
    p_text(
        "Our project focuses on solving these exact problems by building an AI-based Career Navigation platform that analyzes a student's resume, finds missing skills, calculates an ATS readiness score, and guides the student step-by-step to get placed."
    )

    # 2. Literature Review
    p_section("2. Literature Review")
    p_text("During the project, we studied existing recruitment tools, resume screeners, and career guidance platforms. Key findings:")
    p_bullet("ATS Screening Rules: ATS software parses resumes by checking standard section headers, contact details, skill keywords, and formatting clarity.")
    p_bullet("Skill Extraction using NLP: Simple keyword searching misses abbreviations. Using synonym mappings (like JS for JavaScript or ML for Machine Learning) gives much better extraction accuracy.")
    p_bullet("Automatic Web Retrieval (AWR): Job descriptions can be read directly from live company career pages using web scraping tools like Requests and BeautifulSoup.")
    p_bullet("Student Data Privacy: When multiple students use the platform, each student needs a secure password-protected account so their scores and resumes remain private.")

    # 3. Existing System
    p_section("3. Existing System")
    p_text("At present, students rely on job search websites, general resume checkers, and placement cell notices.")
    p_text("Limitations of existing systems:")
    p_bullet("Generic suggestions: They show jobs but do not explain the exact skill gaps for a student's profile.")
    p_bullet("No custom company support: Most portals only check against fixed lists and cannot evaluate an arbitrary company or startup.")
    p_bullet("No learning roadmap: Students see missing skills but do not get a week-by-week plan to learn them.")
    p_bullet("No interview prep: Existing ATS tools do not provide interview questions based on the student's gaps.")
    p_bullet("Lack of individual tracking: Students cannot track how their resume score improves across multiple versions.")

    # 4. Proposed System
    p_section("4. Proposed System")
    p_text(
        "Our proposed system is a full web-based Career Navigation AI application developed in Python and Streamlit. It takes the student's resume as input and provides an end-to-end evaluation."
    )
    p_text("Key features of our system:")
    p_bullet("Student Login & Privacy: Secure login and sign up with password encryption (SHA-256). Each student sees only their own data and results.")
    p_bullet("Resume Upload & Parsing: Reads resumes in PDF and Word (.docx) formats, extracting text, contact details, and core sections.")
    p_bullet("Automatic Domain Detection: Detects whether the student belongs to Web Development, AI/ML, Data Science, Cloud/DevOps, or Cybersecurity.")
    p_bullet("Dual Company Selection: Students can either select from top companies (Google, Microsoft, Amazon, TCS, Infosys, etc.) OR type any custom company name and role.")
    p_bullet("ATS Score & Readiness Meter: Shows an ATS health score (out of 100), job match readiness (%), and resume strength (Strong / Moderate / Weak).")
    p_bullet("Dynamic Job Ranking: Ranks the student across multiple industry roles from highest fit to lowest fit.")
    p_bullet("8-Week Learning Roadmap: Gives a 4-phase step-by-step roadmap to cover missing skills with documentation links and project ideas.")
    p_bullet("AI Interview Preparation: Generates technical questions on known skills, drill questions on missing skills, and HR questions using the STAR framework.")
    p_bullet("Version History & PDF Export: Saves past evaluations in a local SQLite database and allows downloading an official evaluation report.")

    # 5. Knowledge Gained
    p_section("5. Knowledge Gained – Tools & Technologies")
    p_bullet("Python: Wrote all core matching, scoring, and data handling logic.")
    p_bullet("Streamlit: Built the complete web user interface with responsive tabs and sidebar.")
    p_bullet("pdfplumber & PyPDF: Used to extract text accurately from PDF resumes.")
    p_bullet("python-docx: Handled Word document reading and report generation.")
    p_bullet("BeautifulSoup & Requests: Implemented web retrieval to scrape job descriptions from career links.")
    p_bullet("ReportLab: Programmed automatic generation of clean PDF summary reports.")
    p_bullet("Plotly: Created interactive placement competency radar charts and domain pie charts.")
    p_bullet("SQLite3 & Cryptography: Built a secure database for student login credentials and resume history.")
    p_bullet("VS Code & Git: Used VS Code to develop, debug, and run the project locally, with Git for team collaboration.")

    # 6. Architectural Framework & Flowchart
    p_section("6. Architectural Framework")
    p_text(
        "The overall workflow of the Career Navigation AI platform follows 9 sequential stages as shown in Figure 1 below:"
    )

    # Insert Diagram Image
    if os.path.exists(DIAGRAM_PATH):
        doc.add_paragraph()
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(4)
        p_img.paragraph_format.space_after = Pt(4)
        run_img = p_img.add_run()
        run_img.add_picture(DIAGRAM_PATH, width=Inches(6.2))

        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(10)
        r_cap = p_cap.add_run("Figure 1: Career Navigation AI End-to-End System Workflow")
        r_cap.italic = True
        r_cap.font.name = "Arial"
        r_cap.font.size = Pt(9.5)
        r_cap.font.color.rgb = RGBColor(100, 116, 139)

    p_text("Step-by-step workflow summary:")
    p_bullet("Step 1: Student creates an account or logs in with their email and password.")
    p_bullet("Step 2: Student uploads their resume in PDF or DOCX format.")
    p_bullet("Step 3: The parser identifies standard sections (Education, Skills, Experience, Projects, Certifications) and contact signals.")
    p_bullet("Step 4: The skill extractor normalizes keywords using a taxonomy of 100+ skills and determines the primary tech domain.")
    p_bullet("Step 5: Student selects a benchmark company or enters a custom company name and role.")
    p_bullet("Step 6: The ATS engine computes the 5-pillar ATS score, match readiness percentage, and resume strength tag.")
    p_bullet("Step 7: The job ranking module compares student skills across other industry roles to suggest alternative career options.")
    p_bullet("Step 8: A customized 8-week learning plan is created with milestone project suggestions for missing skills.")
    p_bullet("Step 9: AI interview questions are generated and all evaluation records are saved to the student's personal database.")

    # 7. Project Implementation
    p_section("7. Project Implementation")
    p_text("The project was structured into modular Python files inside the 'modules/' folder:")
    p_bullet("database.py: Handles user authentication, profile storage, and resume version history in SQLite.")
    p_bullet("resume_parser.py: Extracts text from PDF and Word files and checks section completeness.")
    p_bullet("skill_extractor.py: Contains technical skill taxonomy, synonym dictionary, and domain classification logic.")
    p_bullet("ats_engine.py: Implements 5-pillar ATS scoring formula (sections, contact info, skill density, formatting, action verbs).")
    p_bullet("job_scraper.py: Fetches live job description text from URLs and ranks jobs across benchmark roles.")
    p_bullet("roadmap_generator.py: Builds 4-phase preparation timelines with learning resources and capstone ideas.")
    p_bullet("interview_prep.py: Generates role-based technical questions and STAR framework HR questions.")
    p_bullet("pdf_generator.py: Generates official IEEE assessment reports using ReportLab.")
    p_bullet("app.py: Main Streamlit dashboard connecting all modules with user login and interactive charts.")

    # 8. Results
    p_section("8. Results & System Testing")
    p_text("We tested the complete application in VS Code using various sample resumes and student profiles:")
    p_bullet("User isolation test: Verified that logging in as Kiran only shows Kiran's results, while logging in as Mahesh or Vinay keeps their data separate.")
    p_bullet("Custom company test: Entered custom companies like 'Zoho' and 'Swiggy' with custom skills, and the system correctly calculated readiness and gaps.")
    p_bullet("Live skill editor test: Modified skills directly in the dashboard and observed real-time recalculation on the radar chart.")
    p_bullet("ATS checking test: Tested resumes with missing sections; the system detected missing project and certification headers and lowered ATS score accordingly.")
    p_bullet("Roadmap & interview test: Tested role changes (e.g. SDE to Data Scientist); the system dynamically updated interview questions and learning roadmap.")

    # 9. Conclusion and Future Work
    p_section("9. Conclusion and Future Work")
    p_text(
        "Over the 6-month internship period (Month 1 to Month 4 deliverables), our team successfully designed, implemented, and tested the Skill-Gap Predictor for Students (Career Navigation AI). The application provides an easy-to-use, practical platform that helps students understand their real placement readiness and provides a clear path to get hired."
    )
    p_text("Future improvements planned:")
    p_bullet("Integrating Large Language Models (LLMs) to automatically rewrite weak resume bullet points.")
    p_bullet("Adding voice-based mock interview practice with AI audio feedback.")
    p_bullet("Adding a placement officer dashboard so college placement cells can view batch-wide skill gap analytics.")

    # 10. Research / Innovation Direction
    p_section("10. Research / Innovation Direction")
    p_bullet("Semantic Matching: Moving from keyword and synonym matching to semantic transformer embeddings (BERT/Sentence-Transformers).")
    p_bullet("Explainable AI: Providing students with clear mathematical reasoning on why a particular readiness score was awarded.")
    p_bullet("Automated Placement Readiness Index: Developing a composite metric that institutions can use to measure student placement preparedness across batches.")

    # Mentor Signature Block (Exact IEEE format)
    doc.add_paragraph()
    doc.add_paragraph()
    p_sig = doc.add_paragraph()
    p_sig.paragraph_format.keep_with_next = True
    r_sig = p_sig.add_run("Mentor Signature: ___________________________          Date: 30-09-2026")
    r_sig.bold = True
    r_sig.font.name = "Arial"
    r_sig.font.size = Pt(11)

    p_men = doc.add_paragraph()
    r_m = p_men.add_run("Dr. N Gayathri (M29)\nMentor, GITAM University Bengaluru Campus")
    r_m.font.name = "Arial"
    r_m.font.size = Pt(10)

    doc.save(DOCX_PATH)
    print("Successfully built student-voice Word report at:", DOCX_PATH)


if __name__ == "__main__":
    remove_pdf_if_exists()
    generate_flowchart_diagram()
    build_word_document()
