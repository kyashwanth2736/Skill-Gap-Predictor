<?php
/**
 * Database Management Module for Skill-Gap Predictor
 * Project ID: P19 - Skill-Gap Predictor for Students (Career Navigation AI)
 * IEEE CS Bangalore Chapter | GITAM University, Bengaluru Campus
 */

define('DB_PATH', '/tmp/career_navigation.db');

function hashPassword($password) {
    $salt = "ieee_p19_gitam_2026";
    return hash('sha256', $salt . $password);
}

function getDBConnection() {
    try {
        $pdo = new PDO("sqlite:" . DB_PATH);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $pdo;
    } catch (PDOException $e) {
        die("Database connection error: " . $e->getMessage());
    }
}

function initDatabase() {
    $pdo = getDBConnection();
    
    // Students table
    $pdo->exec("CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        university TEXT DEFAULT 'GITAM University, Bengaluru',
        branch TEXT,
        graduation_year INTEGER,
        target_role TEXT,
        target_company TEXT,
        linkedin TEXT DEFAULT '',
        github TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Migration check: add linkedin and github columns if missing in old database
    $cols = $pdo->query("PRAGMA table_info(students)")->fetchAll(PDO::FETCH_COLUMN, 1);
    if (!in_array('linkedin', $cols)) {
        $pdo->exec("ALTER TABLE students ADD COLUMN linkedin TEXT DEFAULT ''");
    }
    if (!in_array('github', $cols)) {
        $pdo->exec("ALTER TABLE students ADD COLUMN github TEXT DEFAULT ''");
    }

    // Resume history table
    $pdo->exec("CREATE TABLE IF NOT EXISTS resume_history (
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
    )");

    // Seed default team members if empty
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM students");
    $row = $stmt->fetch();

    if ($row['count'] == 0) {
        $defaultHash = hashPassword("123456");

        $seedStmt = $pdo->prepare(
            "INSERT INTO students 
            (name, email, password_hash, university, branch, graduation_year, target_role, target_company, linkedin, github) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        
        $profiles = [
            [
                "Mahesh B K",
                "mahesh.bk@gitam.in",
                $defaultHash,
                "GITAM University, Bengaluru",
                "Computer Science & Engineering",
                2026,
                "Software Development Engineer (SDE)",
                "Google",
                "linkedin.com/in/maheshbk",
                "github.com/maheshbk"
            ],
            [
                "Vinay Kumar S",
                "vinay.kumar@gitam.in",
                $defaultHash,
                "GITAM University, Bengaluru",
                "Computer Science & Engineering",
                2026,
                "Full Stack Developer",
                "Microsoft",
                "linkedin.com/in/vinaykumars",
                "github.com/vinaykumars"
            ],
            [
                "Yashwanth K",
                "yashwanth.k@gitam.in",
                $defaultHash,
                "GITAM University, Bengaluru",
                "Computer Science & Engineering",
                2026,
                "Data Scientist",
                "Amazon",
                "linkedin.com/in/yashwanthk",
                "github.com/yashwanthk"
            ],
        ];

        foreach ($profiles as $p) {
            $seedStmt->execute($p);
        }
    }
}

function registerUser(
    $name,
    $email,
    $password,
    $university = "GITAM University, Bengaluru",
    $branch = "Computer Science & Engineering",
    $graduation_year = 2026,
    $target_company = "Google",
    $target_role = "Software Development Engineer (SDE)",
    $linkedin = "",
    $github = ""
) {
    $name = trim($name);
    $email = strtolower(trim($email));

    if (empty($name) || empty($email) || empty($password)) {
        return [
            "success" => false,
            "message" => "Name, email, and password cannot be empty."
        ];
    }

    if (strlen($password) < 4) {
        return [
            "success" => false,
            "message" => "Password must be at least 4 characters long."
        ];
    }

    $pdo = getDBConnection();

    $stmt = $pdo->prepare("SELECT id FROM students WHERE email = ?");
    $stmt->execute([$email]);

    if ($stmt->fetch()) {
        return [
            "success" => false,
            "message" => "An account with this email address already exists. Please log in."
        ];
    }

    $pwdHash = hashPassword($password);

    $insertStmt = $pdo->prepare(
        "INSERT INTO students 
        (name, email, password_hash, university, branch, graduation_year, target_role, target_company, linkedin, github) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );

    try {
        $insertStmt->execute([
            $name,
            $email,
            $pwdHash,
            $university,
            $branch,
            (int)$graduation_year,
            $target_role,
            $target_company,
            $linkedin,
            $github
        ]);

        $userId = $pdo->lastInsertId();

        return [
            "success" => true,
            "message" => "Account created successfully! You can now log in.",
            "user_id" => $userId
        ];

    } catch (Exception $e) {
        return [
            "success" => false,
            "message" => "Registration error: " . $e->getMessage()
        ];
    }
}

function authenticateUser($email, $password) {
    $email = strtolower(trim($email));

    if (empty($email) || empty($password)) {
        return [
            "success" => false,
            "message" => "Please enter both email and password."
        ];
    }

    $pdo = getDBConnection();

    $stmt = $pdo->prepare("SELECT * FROM students WHERE email = ?");
    $stmt->execute([$email]);

    $user = $stmt->fetch();

    if (!$user) {
        return [
            "success" => false,
            "message" => "No student profile found with this email. Please sign up."
        ];
    }

    $pwdHash = hashPassword($password);

    if ($user['password_hash'] !== $pwdHash) {
        return [
            "success" => false,
            "message" => "Incorrect password. Please verify your credentials."
        ];
    }

    unset($user['password_hash']);

    return [
        "success" => true,
        "message" => "Login successful.",
        "user" => $user
    ];
}

function getStudentById($student_id) {
    $pdo = getDBConnection();

    $stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
    $stmt->execute([$student_id]);

    $user = $stmt->fetch();

    if ($user) {
        unset($user['password_hash']);
        return $user;
    }

    return null;
}

function updateStudentProfile(
    $student_id,
    $name,
    $university,
    $branch,
    $graduation_year,
    $target_role,
    $target_company,
    $linkedin = '',
    $github = ''
) {
    $pdo = getDBConnection();

    $stmt = $pdo->prepare(
        "UPDATE students 
        SET name = ?, 
            university = ?, 
            branch = ?, 
            graduation_year = ?, 
            target_role = ?, 
            target_company = ?, 
            linkedin = ?, 
            github = ? 
        WHERE id = ?"
    );

    try {
        $stmt->execute([
            $name,
            $university,
            $branch,
            (int)$graduation_year,
            $target_role,
            $target_company,
            $linkedin,
            $github,
            $student_id
        ]);

        return true;

    } catch (Exception $e) {
        return false;
    }
}

function saveResumeEvaluation(
    $student_id,
    $file_name,
    $domain,
    $ats_score,
    $readiness_score,
    $confidence_score,
    $matched_skills,
    $missing_skills,
    $recommendations
) {
    $pdo = getDBConnection();

    $stmt = $pdo->prepare(
        "INSERT INTO resume_history 
        (student_id, file_name, domain, ats_score, readiness_score, confidence_score, matched_skills, missing_skills, recommendations) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );

    $stmt->execute([
        $student_id,
        $file_name,
        $domain,
        round($ats_score, 1),
        round($readiness_score, 1),
        round($confidence_score, 1),
        json_encode($matched_skills),
        json_encode($missing_skills),
        json_encode($recommendations)
    ]);

    return $pdo->lastInsertId();
}

function getResumeHistoryForStudent($student_id) {
    $pdo = getDBConnection();

    $stmt = $pdo->prepare(
        "SELECT * FROM resume_history 
        WHERE student_id = ? 
        ORDER BY created_at DESC"
    );

    $stmt->execute([$student_id]);

    $rows = $stmt->fetchAll();

    $history = [];

    foreach ($rows as $row) {
        $row['matched_skills'] = json_decode(
            $row['matched_skills'],
            true
        ) ?: [];

        $row['missing_skills'] = json_decode(
            $row['missing_skills'],
            true
        ) ?: [];

        $row['recommendations'] = json_decode(
            $row['recommendations'],
            true
        ) ?: [];

        $history[] = $row;
    }

    return $history;
}

// Auto init
initDatabase();
