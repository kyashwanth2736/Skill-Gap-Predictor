<?php
/**
 * Database Management Module
 * Skill-Gap Predictor
 * Project ID: P19
 *
 * Dynamic career/job system.
 *
 * IMPORTANT:
 * No predefined company or job role is created here.
 */


/* ============================================================
   DATABASE PATH
   ============================================================ */

/*
 * Render Persistent Disk:
 *
 * /var/data
 *
 * Local development:
 *
 * project directory
 *
 * Fallback:
 *
 * system temporary directory
 */

if (
    is_dir('/var/data') &&
    is_writable('/var/data')
) {

    define(
        'DB_PATH',
        '/var/data/career_navigation.db'
    );

} elseif (
    is_writable(__DIR__)
) {

    define(
        'DB_PATH',
        __DIR__ . DIRECTORY_SEPARATOR .
        'career_navigation.db'
    );

} else {

    define(
        'DB_PATH',
        sys_get_temp_dir() .
        DIRECTORY_SEPARATOR .
        'career_navigation.db'
    );
}


/* ============================================================
   PASSWORD HASH
   ============================================================ */

function hashPassword($password)
{
    /*
     * Kept compatible with the existing database
     * so previously registered accounts can still
     * authenticate.
     */
    $salt =
        "ieee_p19_gitam_2026";

    return hash(
        'sha256',
        $salt . $password
    );
}


/* ============================================================
   DATABASE CONNECTION
   ============================================================ */

function getDBConnection()
{
    try {

        $dbDirectory =
            dirname(DB_PATH);

        if (
            !is_dir($dbDirectory)
        ) {

            @mkdir(
                $dbDirectory,
                0777,
                true
            );
        }


        $pdo =
            new PDO(
                "sqlite:" . DB_PATH
            );

        $pdo->setAttribute(
            PDO::ATTR_ERRMODE,
            PDO::ERRMODE_EXCEPTION
        );

        $pdo->setAttribute(
            PDO::ATTR_DEFAULT_FETCH_MODE,
            PDO::FETCH_ASSOC
        );

        /*
         * Foreign-key support.
         */
        $pdo->exec(
            "PRAGMA foreign_keys = ON"
        );

        return $pdo;

    } catch (PDOException $e) {

        http_response_code(500);

        die(
            "Database connection error: " .
            htmlspecialchars(
                $e->getMessage()
            )
        );
    }
}


/* ============================================================
   INITIALIZE DATABASE
   ============================================================ */

function initDatabase()
{
    $pdo =
        getDBConnection();


    /* --------------------------------------------------------
       STUDENTS
       -------------------------------------------------------- */

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,

            university TEXT DEFAULT '',
            branch TEXT DEFAULT '',
            graduation_year INTEGER,

            target_role TEXT DEFAULT '',
            target_company TEXT DEFAULT '',

            linkedin TEXT DEFAULT '',
            github TEXT DEFAULT '',

            created_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP
        )"
    );


    /* --------------------------------------------------------
       MIGRATIONS
       -------------------------------------------------------- */

    $columns =
        $pdo
        ->query(
            "PRAGMA table_info(students)"
        )
        ->fetchAll(
            PDO::FETCH_COLUMN,
            1
        );


    if (
        !in_array(
            'linkedin',
            $columns,
            true
        )
    ) {

        $pdo->exec(
            "ALTER TABLE students
             ADD COLUMN linkedin TEXT DEFAULT ''"
        );
    }


    if (
        !in_array(
            'github',
            $columns,
            true
        )
    ) {

        $pdo->exec(
            "ALTER TABLE students
             ADD COLUMN github TEXT DEFAULT ''"
        );
    }


    if (
        !in_array(
            'target_role',
            $columns,
            true
        )
    ) {

        $pdo->exec(
            "ALTER TABLE students
             ADD COLUMN target_role TEXT DEFAULT ''"
        );
    }


    if (
        !in_array(
            'target_company',
            $columns,
            true
        )
    ) {

        $pdo->exec(
            "ALTER TABLE students
             ADD COLUMN target_company TEXT DEFAULT ''"
        );
    }


    /* --------------------------------------------------------
       RESUME HISTORY
       -------------------------------------------------------- */

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS resume_history (
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

            created_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY(student_id)
                REFERENCES students(id)
                ON DELETE CASCADE
        )"
    );


    /*
     * IMPORTANT:
     *
     * There is intentionally NO seed data here.
     *
     * The old code created:
     *
     * Google
     * Microsoft
     * Amazon
     *
     * and predefined roles.
     *
     * That has been completely removed.
     */
}


/* ============================================================
   REGISTER USER
   ============================================================ */

function registerUser(
    $name,
    $email,
    $password,
    $university = '',
    $branch = '',
    $graduation_year = null,
    $target_company = '',
    $target_role = '',
    $linkedin = '',
    $github = ''
) {

    $name =
        trim(
            (string)$name
        );

    $email =
        strtolower(
            trim(
                (string)$email
            )
        );

    $university =
        trim(
            (string)$university
        );

    $branch =
        trim(
            (string)$branch
        );

    $linkedin =
        trim(
            (string)$linkedin
        );

    $github =
        trim(
            (string)$github
        );


    if (
        $name === '' ||
        $email === '' ||
        $password === ''
    ) {

        return [
            "success" => false,
            "message" =>
                "Name, email, and password cannot be empty."
        ];
    }


    if (
        !filter_var(
            $email,
            FILTER_VALIDATE_EMAIL
        )
    ) {

        return [
            "success" => false,
            "message" =>
                "Please enter a valid email address."
        ];
    }


    /*
     * Signup UI requires a strong password.
     */
    if (
        !preg_match(
            '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/',
            $password
        )
    ) {

        return [
            "success" => false,
            "message" =>
                "Password must contain at least 8 characters, including uppercase, lowercase, number, and special character."
        ];
    }


    $pdo =
        getDBConnection();


    $check =
        $pdo->prepare(
            "SELECT id
             FROM students
             WHERE email = ?"
        );

    $check->execute([
        $email
    ]);


    if ($check->fetch()) {

        return [
            "success" => false,
            "message" =>
                "An account with this email already exists. Please log in."
        ];
    }


    $passwordHash =
        hashPassword(
            $password
        );


    /*
     * Company and role are deliberately
     * empty when creating an account.
     */
    $target_company =
        trim(
            (string)$target_company
        );

    $target_role =
        trim(
            (string)$target_role
        );


    $insert =
        $pdo->prepare(
            "INSERT INTO students
            (
                name,
                email,
                password_hash,
                university,
                branch,
                graduation_year,
                target_role,
                target_company,
                linkedin,
                github
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );


    try {

        $insert->execute([
            $name,
            $email,
            $passwordHash,
            $university,
            $branch,
            $graduation_year !== null
                ? (int)$graduation_year
                : null,
            $target_role,
            $target_company,
            $linkedin,
            $github
        ]);


        return [
            "success" => true,
            "message" =>
                "Account created successfully. You can now log in.",
            "user_id" =>
                $pdo->lastInsertId()
        ];

    } catch (PDOException $e) {

        return [
            "success" => false,
            "message" =>
                "Registration failed. Please try again."
        ];
    }
}


/* ============================================================
   AUTHENTICATE USER
   ============================================================ */

function authenticateUser(
    $email,
    $password
) {

    $email =
        strtolower(
            trim(
                (string)$email
            )
        );


    if (
        $email === '' ||
        $password === ''
    ) {

        return [
            "success" => false,
            "message" =>
                "Please enter both email and password."
        ];
    }


    if (
        !filter_var(
            $email,
            FILTER_VALIDATE_EMAIL
        )
    ) {

        return [
            "success" => false,
            "message" =>
                "Please enter a valid email address."
        ];
    }


    $pdo =
        getDBConnection();


    $stmt =
        $pdo->prepare(
            "SELECT *
             FROM students
             WHERE email = ?"
        );

    $stmt->execute([
        $email
    ]);


    $user =
        $stmt->fetch();


    if (!$user) {

        return [
            "success" => false,
            "message" =>
                "No account was found with this email. Please create an account first."
        ];
    }


    $passwordHash =
        hashPassword(
            $password
        );


    if (
        !hash_equals(
            (string)$user['password_hash'],
            (string)$passwordHash
        )
    ) {

        return [
            "success" => false,
            "message" =>
                "Incorrect password. Please verify your credentials."
        ];
    }


    unset(
        $user['password_hash']
    );


    return [
        "success" => true,
        "message" =>
            "Login successful.",
        "user" =>
            $user
    ];
}


/* ============================================================
   GET STUDENT
   ============================================================ */

function getStudentById($student_id)
{
    $pdo =
        getDBConnection();


    $stmt =
        $pdo->prepare(
            "SELECT *
             FROM students
             WHERE id = ?"
        );

    $stmt->execute([
        $student_id
    ]);


    $user =
        $stmt->fetch();


    if ($user) {

        unset(
            $user['password_hash']
        );

        return $user;
    }


    return null;
}


/* ============================================================
   UPDATE STUDENT PROFILE
   ============================================================ */

function updateStudentProfile(
    $student_id,
    $name,
    $university,
    $branch,
    $graduation_year,
    $target_role = '',
    $target_company = '',
    $linkedin = '',
    $github = ''
) {

    $pdo =
        getDBConnection();


    $stmt =
        $pdo->prepare(
            "UPDATE students
             SET
                name = ?,
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
            trim((string)$name),
            trim((string)$university),
            trim((string)$branch),
            (int)$graduation_year,
            trim((string)$target_role),
            trim((string)$target_company),
            trim((string)$linkedin),
            trim((string)$github),
            $student_id
        ]);

        return true;

    } catch (PDOException $e) {

        return false;
    }
}


/* ============================================================
   SAVE RESUME EVALUATION
   ============================================================ */

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

    $pdo =
        getDBConnection();


    /*
     * Prevent round(null) warnings.
     */
    $ats =
        is_numeric($ats_score)
            ? round(
                (float)$ats_score,
                1
            )
            : null;

    $readiness =
        is_numeric($readiness_score)
            ? round(
                (float)$readiness_score,
                1
            )
            : 0;

    $confidence =
        is_numeric($confidence_score)
            ? round(
                (float)$confidence_score,
                1
            )
            : 0;


    $stmt =
        $pdo->prepare(
            "INSERT INTO resume_history
            (
                student_id,
                file_name,
                domain,
                ats_score,
                readiness_score,
                confidence_score,
                matched_skills,
                missing_skills,
                recommendations
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );


    $stmt->execute([
        $student_id,
        $file_name,
        $domain,
        $ats,
        $readiness,
        $confidence,
        json_encode(
            $matched_skills,
            JSON_UNESCAPED_UNICODE
        ),
        json_encode(
            $missing_skills,
            JSON_UNESCAPED_UNICODE
        ),
        json_encode(
            $recommendations,
            JSON_UNESCAPED_UNICODE
        )
    ]);


    return $pdo->lastInsertId();
}


/* ============================================================
   GET RESUME HISTORY
   ============================================================ */

function getResumeHistoryForStudent(
    $student_id
) {

    $pdo =
        getDBConnection();


    $stmt =
        $pdo->prepare(
            "SELECT *
             FROM resume_history
             WHERE student_id = ?
             ORDER BY created_at DESC"
        );

    $stmt->execute([
        $student_id
    ]);


    $rows =
        $stmt->fetchAll();


    $history = [];


    foreach ($rows as $row) {

        $row['matched_skills'] =
            json_decode(
                $row['matched_skills'] ?? '[]',
                true
            ) ?: [];


        $row['missing_skills'] =
            json_decode(
                $row['missing_skills'] ?? '[]',
                true
            ) ?: [];


        $row['recommendations'] =
            json_decode(
                $row['recommendations'] ?? '[]',
                true
            ) ?: [];


        $history[] =
            $row;
    }


    return $history;
}


/* ============================================================
   INITIALIZE
   ============================================================ */

initDatabase();
