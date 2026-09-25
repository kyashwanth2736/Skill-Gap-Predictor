"""
Database Management Module
Project ID: P19 - Skill-Gap Predictor for Students (Career Navigation AI)
GITAM University, Bengaluru Campus
Developers: Vinay Kumar S, Yashwanth K, Mahesh B K
Mentor: Dr. N. Gayathri (M29)

Handles SQLite database operations with user authentication (passwords),
isolated user profiles, resume version history, and placement analytics tracking.
"""

import sqlite3
import json
import os
import hashlib
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "career_navigation.db")


def hash_password(password: str) -> str:
    """Hash a password using SHA-256 with a project salt."""
    salt = "ieee_p19_gitam_2026"
    return hashlib.sha256(f"{salt}{password}".encode("utf-8")).hexdigest()


def get_db_connection():
    """Create and return a database connection with dictionary row access."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_database():
    """Initialize database tables for students and resume history if they do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Students profile table with password_hash for individual authentication
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            university TEXT DEFAULT 'GITAM University, Bengaluru',
            branch TEXT,
            graduation_year INTEGER,
            target_role TEXT,
            target_company TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    # Migration check: if password_hash column does not exist in old database, add it
    cursor.execute("PRAGMA table_info(students)")
    columns = [col["name"] for col in cursor.fetchall()]
    if "password_hash" not in columns:
        cursor.execute("ALTER TABLE students ADD COLUMN password_hash TEXT DEFAULT ''")

    # Resume version history table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS resume_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER,
            file_name TEXT,
            domain TEXT,
            ats_score REAL,
            readiness_score REAL,
            confidence_score REAL,
            matched_skills TEXT,
            missing_skills TEXT,
            recommendations TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id)
        )
        """
    )

    conn.commit()

    # Seed default team member profiles if empty
    cursor.execute("SELECT COUNT(*) as count FROM students")
    count = cursor.fetchone()["count"]
    if count == 0:
        default_pwd_hash = hash_password("123456")
        seed_profiles = [
            ("Mahesh B K", "mahesh.bk@gitam.in", default_pwd_hash, "GITAM University, Bengaluru", "Computer Science & Engineering", 2026, "Software Development Engineer (SDE)", "Google"),
            ("Vinay Kumar S", "vinay.kumar@gitam.in", default_pwd_hash, "GITAM University, Bengaluru", "Computer Science & Engineering", 2026, "Full Stack Developer", "Microsoft"),
            ("Yashwanth K", "yashwanth.k@gitam.in", default_pwd_hash, "GITAM University, Bengaluru", "Computer Science & Engineering", 2026, "Data Scientist", "Amazon"),
        ]
        cursor.executemany(
            """
            INSERT INTO students (name, email, password_hash, university, branch, graduation_year, target_role, target_company)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            seed_profiles,
        )
        conn.commit()
    else:
        # Ensure existing accounts have valid passwords if they were blank
        default_pwd_hash = hash_password("123456")
        cursor.execute("UPDATE students SET password_hash = ? WHERE password_hash = '' OR password_hash IS NULL", (default_pwd_hash,))
        conn.commit()

    conn.close()


def register_user(
    name: str,
    email: str,
    password: str,
    university: str = "GITAM University, Bengaluru",
    branch: str = "Computer Science & Engineering",
    graduation_year: int = 2026,
    target_company: str = "Google",
    target_role: str = "Software Development Engineer (SDE)",
) -> Tuple[bool, str, Optional[int]]:
    """Register a new student with unique email and secure password."""
    name = name.strip()
    email = email.strip().lower()
    if not name or not email or not password:
        return False, "Name, email, and password cannot be empty.", None

    if len(password) < 4:
        return False, "Password should be at least 4 characters long.", None

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM students WHERE email = ?", (email,))
        if cursor.fetchone():
            return False, "An account with this email address already exists. Please log in.", None

        pwd_hash = hash_password(password)
        cursor.execute(
            """
            INSERT INTO students (name, email, password_hash, university, branch, graduation_year, target_role, target_company)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (name, email, pwd_hash, university, branch, graduation_year, target_role, target_company),
        )
        conn.commit()
        user_id = cursor.lastrowid
        return True, "Account created successfully! You can now log in.", user_id
    except Exception as e:
        return False, f"Registration error: {str(e)}", None
    finally:
        conn.close()


def authenticate_user(email: str, password: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    """Verify student credentials and return profile if authenticated."""
    email = email.strip().lower()
    if not email or not password:
        return False, "Please enter both email and password.", None

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM students WHERE email = ?", (email,))
        user = cursor.fetchone()
        if not user:
            return False, "No student profile found with this email. Please sign up.", None

        pwd_hash = hash_password(password)
        if user["password_hash"] != pwd_hash:
            return False, "Incorrect password. Please verify your credentials.", None

        user_dict = dict(user)
        # Never expose password hash
        user_dict.pop("password_hash", None)
        return True, "Login successful.", user_dict
    finally:
        conn.close()


def get_student_by_id(student_id: int) -> Optional[Dict[str, Any]]:
    """Fetch single student profile by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students WHERE id = ?", (student_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        user_dict = dict(row)
        user_dict.pop("password_hash", None)
        return user_dict
    return None


def update_student_profile(
    student_id: int,
    name: str,
    university: str,
    branch: str,
    graduation_year: int,
    target_role: str,
    target_company: str,
) -> bool:
    """Update profile parameters for a specific student."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            UPDATE students
            SET name = ?, university = ?, branch = ?, graduation_year = ?, target_role = ?, target_company = ?
            WHERE id = ?
            """,
            (name, university, branch, graduation_year, target_role, target_company, student_id),
        )
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()


def save_resume_evaluation(
    student_id: int,
    file_name: str,
    domain: str,
    ats_score: float,
    readiness_score: float,
    confidence_score: float,
    matched_skills: List[str],
    missing_skills: List[str],
    recommendations: List[str],
) -> int:
    """Store a resume evaluation record in history strictly for that student."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO resume_history (
            student_id, file_name, domain, ats_score, readiness_score,
            confidence_score, matched_skills, missing_skills, recommendations
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            student_id,
            file_name,
            domain,
            round(ats_score, 1),
            round(readiness_score, 1),
            round(confidence_score, 1),
            json.dumps(matched_skills),
            json.dumps(missing_skills),
            json.dumps(recommendations),
        ),
    )
    conn.commit()
    history_id = cursor.lastrowid
    conn.close()
    return history_id


def get_resume_history_for_student(student_id: int) -> List[Dict[str, Any]]:
    """Retrieve historical resume evaluation records strictly for the active student."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT * FROM resume_history
        WHERE student_id = ?
        ORDER BY created_at DESC
        """,
        (student_id,),
    )
    rows = cursor.fetchall()
    conn.close()

    history = []
    for row in rows:
        item = dict(row)
        try:
            item["matched_skills"] = json.loads(item["matched_skills"])
        except Exception:
            item["matched_skills"] = []
        try:
            item["missing_skills"] = json.loads(item["missing_skills"])
        except Exception:
            item["missing_skills"] = []
        try:
            item["recommendations"] = json.loads(item["recommendations"])
        except Exception:
            item["recommendations"] = []
        history.append(item)
    return history


# Ensure table creation on import
init_database()
