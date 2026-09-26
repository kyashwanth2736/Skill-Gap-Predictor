"""
Resume Parser Module
Project ID: P19 - Skill-Gap Predictor for Students (Career Navigation AI)
GITAM University, Bengaluru Campus
Developers: Vinay Kumar S, Yashwanth K, Mahesh B K
Mentor: Dr. N. Gayathri (M29)

Handles robust text & hyperlink extraction from PDF and DOCX files,
section segmentation, contact information extraction, structure analysis,
and resume validation.
"""

import io
import re
from typing import Dict, Any, List, Tuple


# ============================================================
# OPTIONAL IMPORTS
# ============================================================

try:
    import pdfplumber
except ImportError:
    pdfplumber = None


try:
    import pypdf
except ImportError:
    pypdf = None


try:
    import docx
except ImportError:
    docx = None


# ============================================================
# INVALID PROFILE / NAME WORDS
# ============================================================

INVALID_PROFILE_WORDS = {
    "summary",
    "objective",
    "education",
    "experience",
    "projects",
    "skills",
    "technical",
    "certifications",
    "certification",
    "contact",
    "about",
    "home",
    "profile",
    "resume",
    "curriculum",
    "vitae",
    "pdf",
    "doc",
    "docx",
    "mailto",
    "email",
    "phone",
    "mobile",
    "user",
    "username",
    "example",
    "yourname",
    "name",
    "null",
    "undefined",
    "none",
    "test",
    "view",
    "download",
    "index",
    "main",
    "master",
    "blob",
    "raw",
    "tree",
    "commit",
    "releases",
    "github",
    "linkedin",
    "http",
    "https",
    "www",
    "in",
    "pub",
}


INVALID_NAME_WORDS = {
    "resume",
    "curriculum",
    "vitae",
    "student",
    "applicant",
    "profile",
    "summary",
    "objective",
    "education",
    "experience",
    "projects",
    "skills",
    "technical",
    "certifications",
    "contact",
    "about",
    "phone",
    "email",
    "address",
    "developer",
    "engineer",
    "intern",
    "internship",
    "software",
    "computer",
    "science",
    "university",
    "college",
    "gitam",
}


# ============================================================
# PROFILE LINK VALIDATION
# ============================================================

def is_valid_profile_link(url: str, platform: str) -> bool:
    """
    Strictly validate whether an extracted URL is a genuine
    LinkedIn or GitHub profile.
    """

    if not url:
        return False

    clean = url.strip()

    clean = re.sub(
        r"^[\(\[\{<]+|[\)\]\}>.,;:]+$",
        "",
        clean
    )

    clean = clean.split("?")[0].split("#")[0].rstrip("/")

    lower = clean.lower()

    if platform == "linkedin":
        if "linkedin.com/" not in lower:
            return False

        if not re.search(
            r"linkedin\.com/(in|profile|pub)/",
            lower
        ):
            return False

    elif platform == "github":
        if "github.com/" not in lower:
            return False

    else:
        return False

    parts = [
        p.lower().strip()
        for p in clean.split("/")
        if p.strip()
    ]

    if not parts:
        return False

    handle = parts[-1]

    if handle in INVALID_PROFILE_WORDS:
        return False

    if len(handle) < 3:
        return False

    if handle.isdigit():
        return False

    if "@" in handle:
        return False

    return True


# ============================================================
# PDF TEXT EXTRACTION
# ============================================================

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract raw text and embedded hyperlink URIs from PDF bytes.
    """

    text_chunks = []
    hyperlinks = []

    # --------------------------------------------------------
    # Method 1: pdfplumber
    # --------------------------------------------------------

    if pdfplumber is not None:

        try:

            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:

                for page in pdf.pages:

                    page_text = page.extract_text()

                    if page_text:
                        text_chunks.append(page_text)

                    try:

                        page_links = page.hyperlinks

                        if page_links:

                            for link in page_links:

                                if (
                                    isinstance(link, dict)
                                    and "uri" in link
                                ):
                                    hyperlinks.append(
                                        str(link["uri"])
                                    )

                    except Exception:
                        pass

        except Exception:

            text_chunks = []


    # --------------------------------------------------------
    # Method 2: pypdf fallback
    # --------------------------------------------------------

    if pypdf is not None:

        try:

            reader = pypdf.PdfReader(
                io.BytesIO(file_bytes)
            )

            for page in reader.pages:

                if not text_chunks:

                    page_text = page.extract_text()

                    if page_text:
                        text_chunks.append(page_text)

                try:

                    if "/Annots" in page:

                        for annot in page["/Annots"]:

                            obj = annot.get_object()

                            if (
                                obj.get("/Subtype")
                                == "/Link"
                                and "/A" in obj
                            ):

                                action = obj["/A"].get_object()

                                if (
                                    action.get("/S")
                                    == "/URI"
                                    and "/URI" in action
                                ):

                                    hyperlinks.append(
                                        str(action["/URI"])
                                    )

                except Exception:
                    pass

        except Exception:
            pass


    combined_text = "\n".join(text_chunks)

    if hyperlinks:

        unique_links = list(
            dict.fromkeys(hyperlinks)
        )

        combined_text += (
            "\n" +
            "\n".join(unique_links)
        )

    return combined_text.strip()


# ============================================================
# DOCX TEXT EXTRACTION
# ============================================================

def extract_text_from_docx(file_bytes: bytes) -> str:
    """
    Extract paragraphs, tables, headers, footers and hyperlink
    URIs from Word (.docx) documents.
    """

    if docx is None:
        return ""

    try:

        document = docx.Document(
            io.BytesIO(file_bytes)
        )

        text_parts = []
        hyperlinks = []

        # ----------------------------------------------------
        # Paragraphs
        # ----------------------------------------------------

        for paragraph in document.paragraphs:

            text = paragraph.text.strip()

            if text:
                text_parts.append(text)


        # ----------------------------------------------------
        # Tables
        # ----------------------------------------------------

        for table in document.tables:

            for row in table.rows:

                cells = []

                for cell in row.cells:

                    cell_text = cell.text.strip()

                    if cell_text:
                        cells.append(cell_text)

                if cells:
                    text_parts.append(
                        " | ".join(cells)
                    )


        # ----------------------------------------------------
        # Headers and footers
        # ----------------------------------------------------

        try:

            for section in document.sections:

                for paragraph in section.header.paragraphs:

                    text = paragraph.text.strip()

                    if text:
                        text_parts.append(text)

                for paragraph in section.footer.paragraphs:

                    text = paragraph.text.strip()

                    if text:
                        text_parts.append(text)

        except Exception:
            pass


        # ----------------------------------------------------
        # Hyperlinks
        # ----------------------------------------------------

        try:

            for rel in document.part.rels.values():

                if (
                    "hyperlink" in rel.reltype
                    and hasattr(rel, "target_ref")
                ):

                    hyperlinks.append(
                        rel.target_ref
                    )

        except Exception:
            pass


        full_text = "\n".join(text_parts)

        if hyperlinks:

            full_text += (
                "\n" +
                "\n".join(
                    dict.fromkeys(hyperlinks)
                )
            )

        return full_text.strip()

    except Exception:

        return ""


# ============================================================
# EMAIL EXTRACTION
# ============================================================

def extract_email(text: str) -> str:

    match = re.search(
        r"\b[a-zA-Z0-9_.+-]+"
        r"@[a-zA-Z0-9-]+"
        r"\.[a-zA-Z0-9-.]+\b",
        text
    )

    if match:
        return match.group(0).strip()

    return ""


# ============================================================
# PHONE EXTRACTION
# ============================================================

def extract_phone(text: str) -> str:
    """
    Extract Indian mobile numbers first.

    Indian mobile numbers:
        6XXXXXXXXX
        7XXXXXXXXX
        8XXXXXXXXX
        9XXXXXXXXX

    Also accepts:
        +91 9876543210
        +91-9876543210
        98765 43210
    """

    # --------------------------------------------------------
    # Indian +91 format
    # --------------------------------------------------------

    indian_patterns = [

        r"(?<!\d)\+91[\s.-]*[6-9]\d{4}[\s.-]?\d{5}(?!\d)",

        r"(?<!\d)91[\s.-]+[6-9]\d{4}[\s.-]?\d{5}(?!\d)",

        r"(?<!\d)[6-9]\d{4}[\s.-]\d{5}(?!\d)",

        r"(?<!\d)[6-9]\d{9}(?!\d)",
    ]


    for pattern in indian_patterns:

        match = re.search(
            pattern,
            text
        )

        if match:

            value = match.group(0).strip()

            digits = re.sub(
                r"\D",
                "",
                value
            )

            if digits.startswith("91"):

                if len(digits) == 12:
                    return "+91 " + digits[2:]

            if len(digits) == 10:

                return digits


    # --------------------------------------------------------
    # Generic fallback
    # --------------------------------------------------------

    generic_matches = re.findall(
        r"(?<!\d)"
        r"(?:\+?\d[\d\s().-]{8,}\d)"
        r"(?!\d)",
        text
    )


    for candidate in generic_matches:

        digits = re.sub(
            r"\D",
            "",
            candidate
        )

        if 10 <= len(digits) <= 15:

            # Avoid common years.
            if re.fullmatch(
                r"(19|20)\d{2}",
                digits
            ):
                continue

            return candidate.strip()


    return ""


# ============================================================
# LINKEDIN EXTRACTION
# ============================================================

def extract_linkedin(text: str) -> str:

    cleaned_text = re.sub(
        r"linkedin\s*\.\s*com",
        "linkedin.com",
        text,
        flags=re.IGNORECASE
    )

    patterns = [

        r"(?:https?://)?"
        r"(?:www\.)?"
        r"linkedin\.com/"
        r"(?:in|profile|pub)/"
        r"[A-Za-z0-9%_.-]+",

    ]


    for pattern in patterns:

        for match in re.finditer(
            pattern,
            cleaned_text,
            flags=re.IGNORECASE
        ):

            candidate = (
                match.group(0)
                .strip()
                .rstrip(".,;:)]}")
            )

            if is_valid_profile_link(
                candidate,
                "linkedin"
            ):

                if not candidate.lower().startswith(
                    ("http://", "https://")
                ):
                    candidate = (
                        "https://" + candidate
                    )

                return candidate


    return ""


# ============================================================
# GITHUB EXTRACTION
# ============================================================

def extract_github(text: str) -> str:

    cleaned_text = re.sub(
        r"github\s*\.\s*com",
        "github.com",
        text,
        flags=re.IGNORECASE
    )

    pattern = (
        r"(?:https?://)?"
        r"(?:www\.)?"
        r"github\.com/"
        r"[A-Za-z0-9_.-]+"
    )


    for match in re.finditer(
        pattern,
        cleaned_text,
        flags=re.IGNORECASE
    ):

        candidate = (
            match.group(0)
            .strip()
            .rstrip(".,;:)]}")
        )

        if is_valid_profile_link(
            candidate,
            "github"
        ):

            if not candidate.lower().startswith(
                ("http://", "https://")
            ):
                candidate = (
                    "https://" + candidate
                )

            return candidate


    return ""


# ============================================================
# NAME DETECTION
# ============================================================

def clean_name_candidate(line: str) -> str:

    value = line.strip()

    value = re.sub(
        r"^[•*\-–—|:]+",
        "",
        value
    ).strip()

    value = re.sub(
        r"\s+",
        " ",
        value
    )

    return value


def is_valid_name_candidate(line: str) -> bool:

    candidate = clean_name_candidate(line)

    if not candidate:
        return False

    # --------------------------------------------------------
    # Length
    # --------------------------------------------------------

    words = candidate.split()

    if not 2 <= len(words) <= 4:
        return False

    if len(candidate) > 60:
        return False


    # --------------------------------------------------------
    # Contact / URL rejection
    # --------------------------------------------------------

    if "@" in candidate:
        return False

    if "http" in candidate.lower():
        return False

    if "www." in candidate.lower():
        return False

    if ".com" in candidate.lower():
        return False


    # --------------------------------------------------------
    # Digit rejection
    # --------------------------------------------------------

    if re.search(r"\d", candidate):
        return False


    # --------------------------------------------------------
    # Invalid symbols
    # --------------------------------------------------------

    if re.search(
        r"[<>={}[\]$%/\\|_+=*#@]",
        candidate
    ):
        return False


    # --------------------------------------------------------
    # Invalid words
    # --------------------------------------------------------

    lower_words = {
        word.lower().strip(".,:;-")
        for word in words
    }

    if lower_words.intersection(
        INVALID_NAME_WORDS
    ):
        return False


    # --------------------------------------------------------
    # Must contain alphabetic characters
    # --------------------------------------------------------

    if not re.search(
        r"[A-Za-z]",
        candidate
    ):
        return False


    # --------------------------------------------------------
    # Reject sentence-like lines
    # --------------------------------------------------------

    if candidate.endswith("."):
        return False


    # --------------------------------------------------------
    # Name-like capitalization
    # --------------------------------------------------------

    title_case_count = sum(
        1
        for word in words
        if (
            word[:1].isupper()
            and word[1:].islower()
        )
    )

    upper_case_count = sum(
        1
        for word in words
        if word.isupper()
    )


    if (
        title_case_count >= 2
        or upper_case_count >= 2
    ):
        return True


    # Accept ordinary alphabetic names with
    # reasonable word lengths.
    if all(
        1 < len(word) <= 20
        for word in words
    ):
        return True


    return False


def extract_name(text: str) -> str:

    lines = [
        clean_name_candidate(line)
        for line in text.splitlines()
        if line.strip()
    ]


    # Only inspect the upper part of the resume.
    top_lines = lines[:15]


    # --------------------------------------------------------
    # First pass: strong name candidates
    # --------------------------------------------------------

    for line in top_lines:

        if is_valid_name_candidate(line):

            return line


    # --------------------------------------------------------
    # Second pass: line after common header information
    # --------------------------------------------------------

    for index, line in enumerate(top_lines):

        lower = line.lower()

        if (
            lower in {
                "name",
                "candidate name",
                "student name"
            }
            and index + 1 < len(top_lines)
        ):

            candidate = top_lines[index + 1]

            if is_valid_name_candidate(
                candidate
            ):
                return candidate


    return ""


# ============================================================
# CONTACT INFORMATION
# ============================================================

def extract_contact_info(text: str) -> Dict[str, Any]:
    """
    Extract email, phone, LinkedIn, GitHub and name.
    No fake fallback values are returned.
    """

    email = extract_email(text)

    phone = extract_phone(text)

    linkedin = extract_linkedin(text)

    github = extract_github(text)

    name = extract_name(text)


    return {
        "name": name,
        "email": email,
        "phone": phone,
        "linkedin": linkedin,
        "github": github,
    }


# ============================================================
# RESUME SECTION SEGMENTATION
# ============================================================

def segment_resume_sections(
    text: str
) -> Dict[str, str]:
    """
    Detect and segment standard resume sections.
    """

    section_patterns = {

        "education":
            r"(education|academic background|qualifications|"
            r"academic credentials|academics)",

        "skills":
            r"(skills|technical skills|key competencies|"
            r"core competencies|technologies|proficiencies|tools)",

        "experience":
            r"(work experience|experience|internships|"
            r"employment history|work history|professional experience)",

        "projects":
            r"(projects|academic projects|key projects|"
            r"personal projects|capstone|mini projects)",

        "certifications":
            r"(certifications|certificates|licenses|"
            r"achievements|honors|awards)",
    }


    section_buffer: Dict[str, List[str]] = {
        "general": []
    }

    lines = text.split("\n")

    current_section = "general"


    for line in lines:

        cleaned_line = line.strip().lower()

        matched_section_name = None


        if len(cleaned_line) < 60:

            for sec_name, pattern in section_patterns.items():

                if re.fullmatch(
                    r"[:\s\-*#]*" +
                    pattern +
                    r"[:\s\-*#]*",
                    cleaned_line
                ):

                    matched_section_name = sec_name
                    break


        if matched_section_name:

            current_section = matched_section_name

            if current_section not in section_buffer:

                section_buffer[current_section] = []

        else:

            if current_section not in section_buffer:

                section_buffer[current_section] = []

            section_buffer[current_section].append(
                line
            )


    return {
        sec: "\n".join(lines).strip()
        for sec, lines
        in section_buffer.items()
    }


# ============================================================
# RESUME PARSER
# ============================================================

def parse_resume(
    file_bytes: bytes,
    file_name: str
) -> Dict[str, Any]:
    """
    Parse resume document bytes and return
    structured representation.
    """

    ext = (
        file_name.split(".")[-1].lower()
        if "." in file_name
        else ""
    )


    # --------------------------------------------------------
    # Extract text
    # --------------------------------------------------------

    if ext == "pdf":

        raw_text = extract_text_from_pdf(
            file_bytes
        )

    elif ext in ["docx", "doc"]:

        raw_text = extract_text_from_docx(
            file_bytes
        )

    else:

        raw_text = file_bytes.decode(
            "utf-8",
            errors="ignore"
        )


    raw_text = raw_text.strip()


    # --------------------------------------------------------
    # Contact information
    # --------------------------------------------------------

    contact_info = extract_contact_info(
        raw_text
    )


    # --------------------------------------------------------
    # Sections
    # --------------------------------------------------------

    sections = segment_resume_sections(
        raw_text
    )


    # --------------------------------------------------------
    # Word count
    # --------------------------------------------------------

    word_count = len(
        re.findall(
            r"\S+",
            raw_text
        )
    )


    # --------------------------------------------------------
    # Section presence
    # --------------------------------------------------------

    section_presence = {

        "Education":
            bool(
                sections.get(
                    "education",
                    ""
                ).strip()
            ),

        "Technical Skills":
            bool(
                sections.get(
                    "skills",
                    ""
                ).strip()
            ),

        "Projects":
            bool(
                sections.get(
                    "projects",
                    ""
                ).strip()
            ),

        "Experience / Internships":
            bool(
                sections.get(
                    "experience",
                    ""
                ).strip()
            ),

        "Certifications":
            bool(
                sections.get(
                    "certifications",
                    ""
                ).strip()
            ),
    }


    return {

        "file_name":
            file_name,

        "word_count":
            word_count,

        "raw_text":
            raw_text,

        "contact_info":
            contact_info,

        "sections":
            sections,

        "section_presence":
            section_presence,
    }


# ============================================================
# RESUME VALIDATION
# ============================================================

def validate_is_resume(
    parsed_data: Dict[str, Any],
    extracted_skills: List[str]
) -> Tuple[bool, str]:
    """
    Validate whether uploaded document resembles
    a genuine resume.
    """

    word_count = parsed_data.get(
        "word_count",
        0
    )

    section_presence = parsed_data.get(
        "section_presence",
        {}
    )


    if word_count < 80:

        return (
            False,
            "Document too short (less than 80 words). "
            "Please upload a complete resume."
        )


    critical_sections = [
        "Education",
        "Technical Skills",
        "Projects",
        "Experience / Internships"
    ]


    found_critical = sum(
        1
        for sec in critical_sections
        if section_presence.get(
            sec,
            False
        )
    )


    if (
        found_critical < 1
        and len(extracted_skills) < 2
    ):

        return (
            False,
            "Could not identify standard resume sections "
            "(Education, Technical Skills, Projects, "
            "or Work Experience)."
        )


    return (
        True,
        "Valid Resume"
    )
