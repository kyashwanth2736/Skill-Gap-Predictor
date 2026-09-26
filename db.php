<?php
/**
 * Database Management Module
 * Skill-Gap Predictor
 *
 * Important:
 * - Uses /var/data on Render when available.
 * - Falls back to /tmp when persistent storage is not mounted.
 * - Does NOT seed predefined students.
 * - Does NOT create predefined companies or job roles.
 * - Keeps the existing database structure compatible.
 */

declare(strict_types=1);


/* ============================================================
   DATABASE PATH
   ============================================================ */

/*
 * Render Persistent Disk:
 *
 * If you attach a persistent disk to Render and mount it at:
 *
 *     /var/data
 *
 * the SQLite database will survive deployments/restarts.
 *
 * If /var/data is unavailable, /tmp is used.
 *
 * /tmp is NOT persistent on Render.
 */

function getDatabasePath(): string
{
    $persistentDirectory = '/var/data';
    $temporaryDirectory  = '/tmp';

    /*
     * Prefer Render persistent storage.
     */
    if (
        is_dir($persistentDirectory) &&
        is_writable($persistentDirectory)
    ) {
        return $persistentDirectory . '/career_navigation.db';
    }

    /*
     * Fallback to /tmp.
     */
    if (
        is_dir($temporaryDirectory) &&
        is_writable($temporaryDirectory)
    ) {
        return $temporaryDirectory . '/career_navigation.db';
    }

    /*
     * Last fallback to application directory.
     *
     * This normally should NOT be used on Render,
     * because the application directory can be read-only.
     */
    $applicationDirectory = __DIR__;

    if (is_writable($applicationDirectory)) {
        return $applicationDirectory . '/career_navigation.db';
    }

    throw new RuntimeException(
        'No writable directory is available for the SQLite database. ' .
        'On Render, attach a persistent disk and mount it at /var/data.'
    );
}


/*
 * Define DB_PATH only once.
 */
if (!defined('DB_PATH')) {
    define('DB_PATH', getDatabasePath());
}


/* ============================================================
   PASSWORD HASHING
   ============================================================ */

/*
 * Keep the existing hashing method so old accounts remain
 * compatible with the existing database.
 */
function hashPassword(string $password): string
{
    $salt = "ieee_p19_gitam_2026";

    return hash(
        'sha256',
        $salt . $password
    );
}


/* ============================================================
   DATABASE CONNECTION
   ============================================================ */

function getDBConnection(): PDO
{
    static $pdo = null;

    /*
     * Reuse the same PDO connection during the request.
     */
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    try {

        /*
         * Make sure the directory exists.
         */
        $directory = dirname(DB_PATH);

        if (!is_dir($directory)) {

            if (!mkdir($directory, 0777, true)) {

                throw new RuntimeException(
                    'Unable to create database directory: ' .
                    $directory
                );
            }
        }


        /*
         * Directory itself must be writable because SQLite
         * may need to create journal/WAL files.
         */
        if (!is_writable($directory)) {

            throw new RuntimeException(
                'Database directory is not writable: ' .
                $directory
            );
        }


        /*
         * If database already exists, check whether it is writable.
         */
        if (
            file_exists(DB_PATH) &&
            !is_writable(DB_PATH)
        ) {

            /*
             * If /var/data exists but an old DB file is readonly,
             * try changing its permissions.
             */
            @chmod(DB_PATH, 0666);
        }


        /*
         * Connect to SQLite.
         */
        $pdo = new PDO(
            'sqlite:' . DB_PATH,
            null,
            null,
            [
                PDO::ATTR_ERRMODE =>
                    PDO::ERRMODE_EXCEPTION,

                PDO::ATTR_DEFAULT_FETCH_MODE =>
                    PDO::FETCH_ASSOC,

                PDO::ATTR_EMULATE_PREPARES =>
                    false
            ]
        );


        /*
         * SQLite settings.
         *
         * WAL improves reliability for normal web usage.
         */
        $pdo->exec("PRAGMA foreign_keys = ON");

        /*
         * Do not force WAL if SQLite cannot enable it.
         * This avoids unnecessary deployment failures.
         */
        try {
            $pdo->exec("PRAGMA journal_mode = WAL");
        } catch (Throwable $e) {
            /*
             * Continue with SQLite's default journal mode.
             */
        }


        /*
         * Slightly safer synchronous mode.
         */
        try {
            $pdo->exec("PRAGMA synchronous = NORMAL");
        } catch (Throwable $e) {
            /*
             * Ignore unsupported configuration.
             */
        }


        return $pdo;

    } catch (Throwable $e) {

        /*
         * Return a readable application error rather than
         * exposing an uncaught PDO stack trace.
         */
        throw new RuntimeException(
            'Database connection error: ' .
            $e->getMessage()
        );
    }
}


/* ============================================================
   DATABASE INITIALIZATION
   ============================================================ */

function initDatabase(): void
{
    $pdo = getDBConnection();


    /* ========================================================
       STUDENTS TABLE
       ======================================================== */

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS students (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            email TEXT UNIQUE NOT NULL,

            password_hash TEXT NOT NULL,

            university TEXT
                DEFAULT 'GITAM University, Bengaluru',

            branch TEXT
                DEFAULT '',

            graduation_year INTEGER
                DEFAULT NULL,

            target_role TEXT
                DEFAULT '',

            target_company TEXT
                DEFAULT '',

            linkedin TEXT
                DEFAULT '',

            github TEXT
                DEFAULT '',

            created_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP
        )
    ");


    /* ========================================================
       MIGRATION
       ======================================================== */

    /*
     * Existing databases may have been created using an
     * older version of the application.
     *
     * Check for missing columns before adding them.
     */

    $columns = $pdo
        ->query("PRAGMA table_info(students)")
        ->fetchAll(PDO::FETCH_COLUMN, 1);


    if (!in_array('university', $columns, true)) {

        $pdo->exec(
            "ALTER TABLE students
             ADD COLUMN university TEXT
             DEFAULT 'GITAM University, Bengaluru'"
        );
    }


    if (!in_array('branch', $columns, true)) {

        $pdo->exec(
            "ALTER TABLE students
             ADD COLUMN branch TEXT
             DEFAULT ''"
        );
    }


    if (!in_array('graduation_year', $columns, true)) {

        $pdo->exec(
            "ALTER TABLE students
             ADD COLUMN graduation_year INTEGER
             DEFAULT NULL"
        );
    }


    if (!in_array('target_role', $columns, true)) {

        $pdo->exec(
            "ALTER TABLE students
             ADD COLUMN target_role TEXT
             DEFAULT ''"
        );
    }


    if (!in_array('target_company', $columns, true)) {

        $pdo->exec(
            "ALTER TABLE students
             ADD COLUMN target_company TEXT
             DEFAULT ''"
        );
    }


    if (!in_array('linkedin', $columns, true)) {

        $pdo->exec(
            "ALTER TABLE students
             ADD COLUMN linkedin TEXT
             DEFAULT ''"
        );
    }


    if (!in_array('github', $columns, true)) {

        $pdo->exec(
            "ALTER TABLE students
             ADD COLUMN github TEXT
             DEFAULT ''"
        );
    }


    /* ========================================================
       RESUME HISTORY TABLE
       ======================================================== */

    $pdo->exec("
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

            created_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (student_id)
                REFERENCES students(id)
                ON DELETE CASCADE
        )
    ");


    /*
     * IMPORTANT:
     *
     * There is deliberately NO seed/default user creation here.
     *
     * There is deliberately NO:
     *
     * Google
     * Microsoft
     * Amazon
     * Software Development Engineer
     * Data Scientist
     * Full Stack Developer
     *
     * inserted into the database.
     *
     * Jobs and companies must come from the career URL.
     */
}


/* ============================================================
   REGISTER USER
   ============================================================ */

function registerUser(
    string $name,
    string $email,
    string $password,
    string $university = "GITAM University, Bengaluru",
    string $branch = "Computer Science & Engineering",
    $graduation_year = null,
    string $target_company = "",
    string $target_role = "",
    string $linkedin = "",
    string $github = ""
): array
{
    $name  = trim($name);
    $email = strtolower(trim($email));


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


    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {

        return [
            "success" => false,
            "message" =>
                "Please enter a valid email address."
        ];
    }


    /*
     * Application currently requires at least 8 characters.
     */
    if (strlen($password) < 8) {

        return [
            "success" => false,
            "message" =>
                "Password must be at least 8 characters long."
        ];
    }


    /*
     * Password complexity.
     */
    if (
        !preg_match('/[a-z]/', $password) ||
        !preg_match('/[A-Z]/', $password) ||
        !preg_match('/[0-9]/', $password) ||
        !preg_match('/[^A-Za-z0-9]/', $password)
    ) {

        return [
            "success" => false,
            "message" =>
                "Password must contain uppercase, lowercase, number, and special character."
        ];
    }


    $pdo = getDBConnection();


    /*
     * Check whether email already exists.
     */
    $stmt = $pdo->prepare(
        "SELECT id
         FROM students
         WHERE email = ?
         LIMIT 1"
    );

    $stmt->execute([$email]);


    if ($stmt->fetch()) {

        return [
            "success" => false,
            "message" =>
                "An account with this email already exists. Please log in."
        ];
    }


    $pwdHash = hashPassword($password);


    /*
     * Company and role are intentionally allowed to be empty.
     *
     * They will later be populated dynamically from the
     * career URL recommendation.
     */
    $insertStmt = $pdo->prepare("
        INSERT INTO students
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
        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
        )
    ");


    try {

        $insertStmt->execute([
            $name,
            $email,
            $pwdHash,
            trim($university),
            trim($branch),
            $graduation_year !== null
                ? (int)$graduation_year
                : null,
            trim($target_role),
            trim($target_company),
            trim($linkedin),
            trim($github)
        ]);


        $userId = $pdo->lastInsertId();


        return [
            "success" => true,
            "message" =>
                "Account created successfully! You can now log in.",
            "user_id" =>
                $userId
        ];


    } catch (Throwable $e) {

        return [
            "success" => false,
            "message" =>
                "Registration error: " .
                $e->getMessage()
        ];
    }
}


/* ============================================================
   AUTHENTICATE USER
   ============================================================ */

function authenticateUser(
    string $email,
    string $password
): array
{
    $email = strtolower(trim($email));


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


    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {

        return [
            "success" => false,
            "message" =>
                "Please enter a valid email address."
        ];
    }


    $pdo = getDBConnection();


    $stmt = $pdo->prepare("
        SELECT *
        FROM students
        WHERE email = ?
        LIMIT 1
    ");


    $stmt->execute([$email]);


    $user = $stmt->fetch();


    if (!$user) {

        return [
            "success" => false,
            "message" =>
                "No student profile found with this email. Please sign up."
        ];
    }


    $pwdHash = hashPassword($password);


    if (!hash_equals(
        (string)$user['password_hash'],
        $pwdHash
    )) {

        return [
            "success" => false,
            "message" =>
                "Incorrect password. Please verify your credentials."
        ];
    }


    unset($user['password_hash']);


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
    $pdo = getDBConnection();


    $stmt = $pdo->prepare("
        SELECT *
        FROM students
        WHERE id = ?
        LIMIT 1
    ");


    $stmt->execute([
        (int)$student_id
    ]);


    $user = $stmt->fetch();


    if ($user) {

        unset($user['password_hash']);

        return $user;
    }


    return null;
}


/* ============================================================
   UPDATE PROFILE
   ============================================================ */

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
): bool
{
    $pdo = getDBConnection();


    $stmt = $pdo->prepare("
        UPDATE students
        SET
            name = ?,
            university = ?,
            branch = ?,
            graduation_year = ?,
            target_role = ?,
            target_company = ?,
            linkedin = ?,
            github = ?
        WHERE id = ?
    ");


    try {

        $stmt->execute([
            trim((string)$name),
            trim((string)$university),
            trim((string)$branch),
            $graduation_year !== null
                ? (int)$graduation_year
                : null,
            trim((string)$target_role),
            trim((string)$target_company),
            trim((string)$linkedin),
            trim((string)$github),
            (int)$student_id
        ]);


        return true;


    } catch (Throwable $e) {

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
    $pdo = getDBConnection();


    $stmt = $pdo->prepare("
        INSERT INTO resume_history
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
        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
        )
    ");


    /*
     * Avoid round(null).
     */
    $atsValue =
        is_numeric($ats_score)
            ? round((float)$ats_score, 1)
            : null;


    $readinessValue =
        is_numeric($readiness_score)
            ? round((float)$readiness_score, 1)
            : null;


    $confidenceValue =
        is_numeric($confidence_score)
            ? round((float)$confidence_score, 1)
            : null;


    $stmt->execute([
        (int)$student_id,
        trim((string)$file_name),
        trim((string)$domain),
        $atsValue,
        $readinessValue,
        $confidenceValue,
        json_encode(
            is_array($matched_skills)
                ? $matched_skills
                : [],
            JSON_UNESCAPED_UNICODE
        ),
        json_encode(
            is_array($missing_skills)
                ? $missing_skills
                : [],
            JSON_UNESCAPED_UNICODE
        ),
        json_encode(
            is_array($recommendations)
                ? $recommendations
                : [],
            JSON_UNESCAPED_UNICODE
        )
    ]);


    return $pdo->lastInsertId();
}


/* ============================================================
   GET RESUME HISTORY
   ============================================================ */

function getResumeHistoryForStudent($student_id): array
{
    $pdo = getDBConnection();


    $stmt = $pdo->prepare("
        SELECT *
        FROM resume_history
        WHERE student_id = ?
        ORDER BY created_at DESC
    ");


    $stmt->execute([
        (int)$student_id
    ]);


    $rows = $stmt->fetchAll();


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


        $history[] = $row;
    }


    return $history;
}


/* ============================================================
   DATABASE INITIALIZATION
   ============================================================ */

try {

    initDatabase();

} catch (Throwable $e) {

    /*
     * Return JSON if db.php is being called through an API
     * request. Otherwise display a clean error.
     */

    if (
        PHP_SAPI !== 'cli' &&
        isset($_SERVER['REQUEST_URI'])
    ) {

        http_response_code(500);

        header('Content-Type: text/html; charset=UTF-8');

        echo '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Database Configuration Error</title>
            <style>
                body {
                    margin: 0;
                    padding: 40px;
                    font-family: Arial, sans-serif;
                    background: #0f172a;
                    color: #e2e8f0;
                }

                .box {
                    max-width: 800px;
                    margin: 40px auto;
                    padding: 30px;
                    border-radius: 18px;
                    background: #1e293b;
                    border: 1px solid #334155;
                    box-shadow: 0 20px 50px rgba(0,0,0,.35);
                }

                h1 {
                    color: #f87171;
                }

                code {
                    display: block;
                    margin-top: 20px;
                    padding: 16px;
                    background: #020617;
                    border-radius: 10px;
                    color: #93c5fd;
                    white-space: pre-wrap;
                }
            </style>
        </head>

        <body>

            <div class="box">

                <h1>Database Configuration Error</h1>

                <p>
                    The application could not initialize its SQLite database.
                </p>

                <p>
                    On Render, attach a Persistent Disk and mount it at
                    <strong>/var/data</strong>.
                </p>

                <code>' .
                    htmlspecialchars(
                        $e->getMessage(),
                        ENT_QUOTES,
                        'UTF-8'
                    ) .
                '</code>

            </div>

        </body>
        </html>
        ';

        exit;
    }


    throw $e;
}
