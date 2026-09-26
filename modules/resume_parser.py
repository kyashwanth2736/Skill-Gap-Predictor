"""
Resume parser for Skill-Gap Predictor.

Important:
- Information comes only from the uploaded resume.
- No sample profile information is inserted.
- No account information is used as a fallback.
- Missing information is returned as an empty string.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Dict, Any

try:
    import pdfplumber
except Exception:
    pdfplumber = None

try:
    from pypdf import PdfReader
except Exception:
    PdfReader = None

try:
    from docx import Document
except Exception:
    Document = None


SECTION_WORDS = {
    "resume",
    "curriculum vitae",
    "cv",
    "summary",
    "objective",
    "profile",
    "education",
    "experience",
    "work experience",
    "skills",
    "technical skills",
    "projects",
    "project",
    "certifications",
    "certification",
    "achievements",
    "internships",
    "internship",
    "contact",
    "contact information",
    "references",
    "publications",
    "languages",
    "interests",
    "declaration",
}


TITLE_WORDS = {
    "student",
    "engineer",
    "developer",
    "intern",
    "internship",
    "software",
    "computer",
    "science",
    "technology",
    "technical",
    "professional",
    "resume",
    "curriculum",
    "vitae",
    "profile",
    "objective",
    "summary",
    "experience",
    "analyst",
    "manager",
    "consultant",
}


def clean_text(text: str) -> str:

    if not text:
        return ""

    text = text.replace("\u00a0", " ")
    text = text.replace("\r", "\n")

    text = re.sub(
        r"[ \t]+",
        " ",
        text
    )

    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text
    )

    return text.strip()


def normalize_line(line: str) -> str:

    line = re.sub(
        r"^[\s•●▪◦‣►▶*-]+",
        "",
        line
    )

    line = re.sub(
        r"^(name|full name|candidate name)\s*[:\-]\s*",
        "",
        line,
        flags=re.I
    )

    return re.sub(
        r"\s+",
        " ",
        line
    ).strip()


def extract_text_from_pdf(path: str) -> str:

    chunks = []

    if pdfplumber is not None:

        try:

            with pdfplumber.open(path) as pdf:

                for page in pdf.pages:

                    text = (
                        page.extract_text() or ""
                    )

                    if text.strip():
                        chunks.append(text)

            result = clean_text(
                "\n".join(chunks)
            )

            if result:
                return result

        except Exception:
            pass

    if PdfReader is not None:

        try:

            reader = PdfReader(path)

            chunks = []

            for page in reader.pages:

                text = (
                    page.extract_text() or ""
                )

                if text.strip():
                    chunks.append(text)

            return clean_text(
                "\n".join(chunks)
            )

        except Exception:
            pass

    return ""


def extract_text_from_docx(path: str) -> str:

    if Document is None:
        return ""

    try:

        doc = Document(path)

        chunks = []

        # Normal paragraphs
        for paragraph in doc.paragraphs:

            text = paragraph.text.strip()

            if text:
                chunks.append(text)

        # Tables
        for table in doc.tables:

            for row in table.rows:

                cells = []

                for cell in row.cells:

                    value = cell.text.strip()

                    if value:
                        cells.append(value)

                if cells:
                    chunks.append(
                        " | ".join(cells)
                    )

        # Headers / footers
        for section in doc.sections:

            for paragraph in section.header.paragraphs:

                text = paragraph.text.strip()

                if text:
                    chunks.append(text)

            for paragraph in section.footer.paragraphs:

                text = paragraph.text.strip()

                if text:
                    chunks.append(text)

        return clean_text(
            "\n".join(chunks)
        )

    except Exception:
        return ""


def extract_text(path: str) -> str:

    suffix = (
        Path(path)
        .suffix
        .lower()
    )

    if suffix == ".pdf":
        return extract_text_from_pdf(path)

    if suffix == ".docx":
        return extract_text_from_docx(path)

    if suffix in {
        ".txt",
        ".text"
    }:

        try:

            return clean_text(
                Path(path).read_text(
                    encoding="utf-8",
                    errors="ignore"
                )
            )

        except Exception:
            return ""

    return ""


def extract_email(text: str) -> str:

    pattern = (
        r"(?<![\w.+-])"
        r"[A-Za-z0-9._%+-]+"
        r"@"
        r"[A-Za-z0-9.-]+"
        r"\."
        r"[A-Za-z]{2,}"
        r"(?![\w.-])"
    )

    match = re.search(
        pattern,
        text
    )

    return (
        match.group(0).strip()
        if match
        else ""
    )


def extract_phone(text: str) -> str:

    # Indian mobile number
    indian_numbers = re.findall(
        r"(?<!\d)"
        r"(?:\+?91[\s.-]?)?"
        r"[6-9]\d{4}[\s.-]?\d{5}"
        r"(?!\d)",
        text
    )

    for value in indian_numbers:

        digits = re.sub(
            r"\D",
            "",
            value
        )

        if (
            digits.startswith("91")
            and len(digits) == 12
        ):

            return (
                "+91 "
                + digits[-10:]
            )

        if len(digits) == 10:
            return digits

    # Generic fallback
    candidates = re.findall(
        r"(?<!\d)"
        r"(?:\+\d{1,3}[\s.-]?)?"
        r"[0-9][0-9\s().-]{8,14}[0-9]"
        r"(?!\d)",
        text
    )

    for value in candidates:

        digits = re.sub(
            r"\D",
            "",
            value
        )

        if not (
            10 <= len(digits) <= 15
        ):
            continue

        if re.fullmatch(
            r"(?:19|20)\d{2}",
            digits
        ):
            continue

        # Avoid treating long year/date sequences as phones.
        if (
            len(set(digits)) <= 2
            and len(digits) <= 12
        ):
            continue

        return value.strip()

    return ""


def clean_url(raw: str) -> str:

    raw = (
        raw
        .strip()
        .strip("<>[](){}.,;")
    )

    if raw.startswith("www."):
        return "https://" + raw

    if not raw.startswith(
        ("http://", "https://")
    ):
        return "https://" + raw

    return raw


def extract_linkedin(text: str) -> str:

    pattern = (
        r"(?:https?://)?"
        r"(?:www\.)?"
        r"linkedin\.com/"
        r"(?:in|pub|profile)/"
        r"[A-Za-z0-9._%\-]+"
        r"(?:/[A-Za-z0-9._%\-]+)*"
    )

    match = re.search(
        pattern,
        text,
        flags=re.I
    )

    if not match:
        return ""

    return clean_url(
        match.group(0)
    )


def extract_github(text: str) -> str:

    pattern = (
        r"(?:https?://)?"
        r"(?:www\.)?"
        r"github\.com/"
        r"[A-Za-z0-9]"
        r"[A-Za-z0-9-]{0,38}"
        r"(?:/[A-Za-z0-9._-]+)?"
    )

    match = re.search(
        pattern,
        text,
        flags=re.I
    )

    if not match:
        return ""

    value = clean_url(
        match.group(0)
    )

    path = (
        value
        .lower()
        .split(
            "github.com/",
            1
        )[-1]
        .strip("/")
    )

    reserved = {
        "features",
        "topics",
        "collections",
        "marketplace",
        "login",
        "signup",
        "about",
        "explore",
    }

    if (
        path.split("/")[0]
        in reserved
    ):
        return ""

    return value


def looks_like_name(line: str) -> bool:

    value = normalize_line(line)

    if not value:
        return False

    if len(value) > 70:
        return False

    if "@" in value:
        return False

    if "http" in value.lower():
        return False

    if re.search(
        r"\d",
        value
    ):
        return False

    if any(
        char in value
        for char in
        "|/@#$%_=+<>[]{}"
    ):
        return False

    if (
        value.lower().rstrip(":")
        in SECTION_WORDS
    ):
        return False

    words = value.split()

    if not 2 <= len(words) <= 4:
        return False

    if any(
        word.lower().rstrip(".,:")
        in TITLE_WORDS
        for word in words
    ):
        return False

    valid_words = all(
        re.fullmatch(
            r"[A-Za-z][A-Za-z'’-]*[A-Za-z]",
            word
        )
        or re.fullmatch(
            r"[A-Za-z]",
            word
        )
        for word in words
    )

    return valid_words


def extract_name(text: str) -> str:

    lines = []

    for raw_line in text.splitlines():

        line = normalize_line(
            raw_line
        )

        if line:
            lines.append(line)

    # Resume names normally appear near the top.
    for line in lines[:15]:

        if looks_like_name(line):
            return line

    return ""


def extract_contact_info(
    text: str
) -> Dict[str, str]:

    return {

        "name":
            extract_name(text),

        "email":
            extract_email(text),

        "phone":
            extract_phone(text),

        "linkedin":
            extract_linkedin(text),

        "github":
            extract_github(text),

    }


def parse_resume(
    path: str
) -> Dict[str, Any]:

    text = extract_text(path)

    words = re.findall(
        r"\b\S+\b",
        text
    )

    return {

        "word_count":
            len(words),

        "contact_info":
            extract_contact_info(text),

        "raw_text":
            text,

    }


def validate_is_resume(
    text: str
) -> bool:

    if not text:
        return False

    if len(text.split()) < 30:
        return False

    lower = text.lower()

    indicators = [
        "education",
        "experience",
        "skills",
        "projects",
        "certification",
        "internship",
        "objective",
        "summary",
        "email",
        "github",
        "linkedin",
    ]

    count = sum(
        1
        for item in indicators
        if item in lower
    )

    return count >= 2


if __name__ == "__main__":

    import json
    import sys

    if len(sys.argv) != 2:

        print(
            json.dumps(
                {
                    "status": "error",
                    "message":
                        "Usage: python resume_parser.py <resume-file>"
                }
            )
        )

        raise SystemExit(1)

    result = parse_resume(sys.argv[1])

    result["valid_resume"] = validate_is_resume(
        result.get("raw_text", "")
    )

    print(
        json.dumps(
            result,
            ensure_ascii=False
        )
    )
