<?php
/**
 * Database Management Module
 * Skill-Gap Predictor - Career Navigation AI
 *
 * IMPORTANT:
 * - No predefined company or role
 * - No fake student profiles
 * - Render-compatible SQLite storage
 * - Uses /var/data when available
 * - Falls back to /tmp when /var/data is unavailable
 */

declare(strict_types=1);


/* ============================================================
   DATABASE PATH
   ============================================================ */

/*
 * Render Persistent Disk:
 *
 * If you attach a persistent disk to your Render service and
 * mount it at /var/data, the database will survive deployments.
 *
 * If /var/data is unavailable, /tmp is used as a temporary
 * fallback.
 */

function getDatabasePath(): string
{
    $persistentDir = '/var/data';
    $temporaryDir  = '/tmp';

    /*
     * Preferred Render persistent storage.
     */
    if (
        is_dir($persistentDir) &&
        is_writable($persistentDir)
    ) {
        return $persistentDir . '/career_navigation.db';
    }

    /*
     * Try creating /var/data if the environment permits it.
     */
    if (!is_dir($persistentDir)) {

        @mkdir($persistentDir, 0775, true);

        if (
            is_dir($persistentDir) &&
            is_writable($persistentDir)
        ) {
            return $persistentDir . '/career_navigation.db';
        }
    }

    /*
     * Temporary fallback.
     */
    if (
        is_dir($temporaryDir) &&
        is_writable($temporaryDir)
    ) {
        return $temporaryDir . '/career_navigation.db';
    }

    /*
     * Last fallback.
     *
     * This should normally not be reached on Render.
     */
    $systemTemp = sys_get_temp_dir();

    if (
        is_dir($systemTemp) &&
        is_writable($systemTemp)
    ) {
        return rtrim($systemTemp, DIRECTORY_SEPARATOR)
            . DIRECTORY_SEPARATOR
            . 'career_navigation.db';
    }

    throw new RuntimeException(
        'No writable directory is available for the SQLite database.'
    );
}


define('DB_PATH', getDatabasePath());


/* ============================================================
   PASSWORD HASHING
   ============================================================ */

function hashPassword(string $password): string
{
    /*
     * Keep this compatible with existing accounts.
     */
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

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    try {

        $databaseDirectory =
            dirname(DB_PATH);

        /*
         * Make sure the database directory exists.
         */
        if (!is_dir($databaseDirectory)) {

            if (!@mkdir(
                $databaseDirectory,
                0775,
                true
            )) {

                throw new RuntimeException(
                    'Unable to create database directory: '
                    . $databaseDirectory
                );
            }
        }


        /*
         * Verify that the directory itself is writable.
         */
        if (!is_writable($databaseDirectory)) {

            throw new RuntimeException(
                'Database directory is not writable: '
                . $databaseDirectory
            );
        }


        /*
         * If the database already exists, make sure it is
         * writable as well.
         */
        if (
            file_exists(DB_PATH) &&
            !is_writable(DB_PATH)
        ) {

            /*
             * Attempt to make the existing database writable.
             */
            @chmod(DB_PATH, 0664);
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

                PDO::ATTR_TIMEOUT =>
                    10
            ]
        );


        /*
         * SQLite configuration.
         */
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('PRAGMA busy_timeout = 5000');


        /*
         * WAL improves concurrent SQLite access.
         *
         * If the environment does not allow WAL,
         * continue without failing the application.
         */
        try {
            $pdo->exec('PRAGMA journal_mode = WAL');
        } catch (Throwable $e) {
            /*
             * Ignore WAL failure.
             */
        }


        return $pdo;

    } catch (Throwable $e) {

        http_response_code(500);

        die(
            'Database connection error: '
            . htmlspecialchars(
                $e->getMessage(),
                ENT_QUOTES,
                'UTF-8'
            )
            . '<br><br>'
            . 'Database path: '
            . htmlspecialchars(
                DB_PATH,
                ENT_QUOTES,
                'UTF-8'
            )
        );
    }
}


/* ============================================================
   DATABASE INITIALIZATION
   ============================================================ */

function initDatabase(): void
{
    $pdo = getDBConnection();

    try {

        /*
         * ------------------------------------------------------
         * STUDENTS
         * ------------------------------------------------------
         */

        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS students (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                name TEXT NOT NULL,

                email TEXT UNIQUE NOT NULL,

                password_hash TEXT NOT NULL,

                university TEXT DEFAULT '',

                branch TEXT DEFAULT '',

                graduation_year INTEGER DEFAULT NULL,

                target_role TEXT DEFAULT '',

                target_company TEXT DEFAULT '',

                linkedin TEXT DEFAULT '',

                github TEXT DEFAULT '',

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

            )"
        );


        /*
         * ------------------------------------------------------
         * MIGRATION: STUDENTS
         * ------------------------------------------------------
         */

        $studentColumns =
            $pdo
                ->query(
                    "PRAGMA table_info(students)"
                )
                ->fetchAll(PDO::FETCH_COLUMN, 1);


        if (!in_array(
            'linkedin',
            $studentColumns,
            true
        )) {

            $pdo->exec(
                "ALTER TABLE students
                 ADD COLUMN linkedin TEXT DEFAULT ''"
            );
        }


        if (!in_array(
            'github',
            $studentColumns,
            true
        )) {

            $pdo->exec(
                "ALTER TABLE students
                 ADD COLUMN github TEXT DEFAULT ''"
            );
        }


        if (!in_array(
            'target_role',
            $studentColumns,
            true
        )) {

            $pdo->exec(
                "ALTER TABLE students
                 ADD COLUMN target_role TEXT DEFAULT ''"
            );
        }


        if (!in_array(
            'target_company',
            $studentColumns,
            true
        )) {

            $pdo->exec(
                "ALTER TABLE students
                 ADD COLUMN target_company TEXT DEFAULT ''"
            );
        }


        /*
         * ------------------------------------------------------
         * RESUME HISTORY
         * ------------------------------------------------------
         */

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

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (student_id)
                REFERENCES students(id)
                ON DELETE CASCADE

            )"
        );


        /*
         * ------------------------------------------------------
         * CAREER SEARCH HISTORY
         * ------------------------------------------------------
         *
         * Stores URLs entered by students.
         *
         * This is optional but useful for the dynamic
         * career-URL workflow.
         */

        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS career_searches (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                student_id INTEGER,

                career_url TEXT NOT NULL,

                job_count INTEGER DEFAULT 0,

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (student_id)
                REFERENCES students(id)
                ON DELETE CASCADE

            )"
        );


        /*
         * ------------------------------------------------------
         * IMPORTANT
         * ------------------------------------------------------
         *
         * DO NOT INSERT predefined students here.
         *
         * DO NOT insert Google, Microsoft, Amazon,
         * SDE, Data Scientist, etc.
         *
         * Students are created only through signup.
         */


    } catch (Throwable $e) {

        http_response_code(500);

        die(
            'Database initialization error: '
            . htmlspecialchars(
                $e->getMessage(),
                ENT_QUOTES,
                'UTF-8'
            )
            . '<br><br>'
            . 'Database path: '
            . htmlspecialchars(
                DB_PATH,
                ENT_QUOTES,
                'UTF-8'
            )
        );
    }
}


/* ============================================================
   REGISTER USER
   ============================================================ */

function registerUser(
    string $name,
    string $email,
    string $password,
    string $university = '',
    string $branch = '',
    $graduation_year = null,
    string $target_company = '',
    string $target_role = '',
    string $linkedin = '',
    string $github = ''
): array {

    $name =
        trim($name);

    $email =
        strtolower(
            trim($email)
        );

    $university =
        trim($university);

    $branch =
        trim($branch);

    $target_company =
        trim($target_company);

    $target_role =
        trim($target_role);

    $linkedin =
        trim($linkedin);

    $github =
        trim($github);


    /*
     * Basic validation.
     */
    if (
        $name === '' ||
        $email === '' ||
        $password === ''
    ) {

        return [
            'success' => false,
            'message' =>
                'Name, email, and password cannot be empty.'
        ];
    }


    if (
        !filter_var(
            $email,
            FILTER_VALIDATE_EMAIL
        )
    ) {

        return [
            'success' => false,
            'message' =>
                'Please enter a valid email address.'
        ];
    }


    /*
     * The frontend requires 8 characters.
     */
    if (strlen($password) < 8) {

        return [
            'success' => false,
            'message' =>
                'Password must be at least 8 characters long.'
        ];
    }


    /*
     * Strong password validation.
     */
    if (
        !preg_match(
            '/[a-z]/',
            $password
        ) ||
        !preg_match(
            '/[A-Z]/',
            $password
        ) ||
        !preg_match(
            '/[0-9]/',
            $password
        ) ||
        !preg_match(
            '/[^A-Za-z0-9]/',
            $password
        )
    ) {

        return [
            'success' => false,
            'message' =>
                'Password must contain uppercase, lowercase, number, and special character.'
        ];
    }


    $pdo =
        getDBConnection();


    /*
     * Check duplicate email.
     */
    $stmt =
        $pdo->prepare(
            "SELECT id
             FROM students
             WHERE email = ?"
        );

    $stmt->execute([
        $email
    ]);


    if ($stmt->fetch()) {

        return [
            'success' => false,
            'message' =>
                'An account with this email already exists. Please log in.'
        ];
    }


    $passwordHash =
        hashPassword($password);


    /*
     * Graduation year.
     */
    $graduationYear = null;

    if (
        $graduation_year !== null &&
        $graduation_year !== '' &&
        is_numeric($graduation_year)
    ) {

        $graduationYear =
            (int)$graduation_year;
    }


    /*
     * Insert account.
     *
     * Company and role remain empty.
     */
    $insertStmt =
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
            )"
        );


    try {

        $insertStmt->execute([
            $name,
            $email,
            $passwordHash,
            $university,
            $branch,
            $graduationYear,
            $target_role,
            $target_company,
            $linkedin,
            $github
        ]);


        $userId =
            $pdo->lastInsertId();


        return [
            'success' => true,
            'message' =>
                'Account created successfully! You can now log in.',
            'user_id' =>
                $userId
        ];

    } catch (PDOException $e) {

        return [
            'success' => false,
            'message' =>
                'Registration error: '
                . $e->getMessage()
        ];
    }
}


/* ============================================================
   AUTHENTICATE USER
   ============================================================ */

function authenticateUser(
    string $email,
    string $password
): array {

    $email =
        strtolower(
            trim($email)
        );


    if (
        $email === '' ||
        $password === ''
    ) {

        return [
            'success' => false,
            'message' =>
                'Please enter both email and password.'
        ];
    }


    if (
        !filter_var(
            $email,
            FILTER_VALIDATE_EMAIL
        )
    ) {

        return [
            'success' => false,
            'message' =>
                'Please enter a valid email address.'
        ];
    }


    $pdo =
        getDBConnection();


    $stmt =
        $pdo->prepare(
            "SELECT *
             FROM students
             WHERE email = ?
             LIMIT 1"
        );

    $stmt->execute([
        $email
    ]);


    $user =
        $stmt->fetch();


    if (!$user) {

        return [
            'success' => false,
            'message' =>
                'No student profile found with this email. Please sign up.'
        ];
    }


    $passwordHash =
        hashPassword($password);


    if (
        !hash_equals(
            (string)$user['password_hash'],
            (string)$passwordHash
        )
    ) {

        return [
            'success' => false,
            'message' =>
                'Incorrect password. Please verify your credentials.'
        ];
    }


    unset(
        $user['password_hash']
    );


    return [
        'success' => true,
        'message' =>
            'Login successful.',
        'user' =>
            $user
    ];
}


/* ============================================================
   GET STUDENT
   ============================================================ */

function getStudentById(
    int $student_id
) {

    $pdo =
        getDBConnection();


    $stmt =
        $pdo->prepare(
            "SELECT *
             FROM students
             WHERE id = ?
             LIMIT 1"
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
    int $student_id,
    string $name,
    string $university,
    string $branch,
    $graduation_year,
    string $target_role = '',
    string $target_company = '',
    string $linkedin = '',
    string $github = ''
): bool {

    $pdo =
        getDBConnection();


    $name =
        trim($name);

    $university =
        trim($university);

    $branch =
        trim($branch);

    $target_role =
        trim($target_role);

    $target_company =
        trim($target_company);

    $linkedin =
        trim($linkedin);

    $github =
        trim($github);


    $year = null;

    if (
        $graduation_year !== null &&
        $graduation_year !== '' &&
        is_numeric($graduation_year)
    ) {

        $year =
            (int)$graduation_year;
    }


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
            $name,
            $university,
            $branch,
            $year,
            $target_role,
            $target_company,
            $linkedin,
            $github,
            $student_id
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
    int $student_id,
    string $file_name,
    string $domain,
    $ats_score,
    $readiness_score,
    $confidence_score,
    array $matched_skills,
    array $missing_skills,
    array $recommendations
) {

    $pdo =
        getDBConnection();


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
            )"
        );


    /*
     * Prevent null/invalid numeric values from causing
     * problems with round().
     */
    $ats =
        is_numeric($ats_score)
            ? round((float)$ats_score, 1)
            : null;

    $readiness =
        is_numeric($readiness_score)
            ? round((float)$readiness_score, 1)
            : 0;

    $confidence =
        is_numeric($confidence_score)
            ? round((float)$confidence_score, 1)
            : 0;


    $stmt->execute([
        $student_id,
        $file_name,
        $domain,
        $ats,
        $readiness,
        $confidence,
        json_encode(
            array_values($matched_skills),
            JSON_UNESCAPED_UNICODE
        ),
        json_encode(
            array_values($missing_skills),
            JSON_UNESCAPED_UNICODE
        ),
        json_encode(
            array_values($recommendations),
            JSON_UNESCAPED_UNICODE
        )
    ]);


    return $pdo->lastInsertId();
}


/* ============================================================
   GET RESUME HISTORY
   ============================================================ */

function getResumeHistoryForStudent(
    int $student_id
): array {

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
            );

        if (!is_array(
            $row['matched_skills']
        )) {
            $row['matched_skills'] = [];
        }


        $row['missing_skills'] =
            json_decode(
                $row['missing_skills'] ?? '[]',
                true
            );

        if (!is_array(
            $row['missing_skills']
        )) {
            $row['missing_skills'] = [];
        }


        $row['recommendations'] =
            json_decode(
                $row['recommendations'] ?? '[]',
                true
            );

        if (!is_array(
            $row['recommendations']
        )) {
            $row['recommendations'] = [];
        }


        $history[] =
            $row;
    }


    return $history;
}


/* ============================================================
   SAVE CAREER SEARCH
   ============================================================ */

function saveCareerSearch(
    int $student_id,
    string $career_url,
    int $job_count = 0
): bool {

    $career_url =
        trim($career_url);


    if ($career_url === '') {
        return false;
    }


    try {

        $pdo =
            getDBConnection();


        $stmt =
            $pdo->prepare(
                "INSERT INTO career_searches
                (
                    student_id,
                    career_url,
                    job_count
                )
                VALUES
                (
                    ?,
                    ?,
                    ?
                )"
            );


        $stmt->execute([
            $student_id,
            $career_url,
            $job_count
        ]);


        return true;

    } catch (Throwable $e) {

        return false;
    }
}


/* ============================================================
   GET CAREER SEARCH HISTORY
   ============================================================ */

function getCareerSearchHistory(
    int $student_id
): array {

    try {

        $pdo =
            getDBConnection();


        $stmt =
            $pdo->prepare(
                "SELECT *
                 FROM career_searches
                 WHERE student_id = ?
                 ORDER BY created_at DESC"
            );


        $stmt->execute([
            $student_id
        ]);


        return
            $stmt->fetchAll();

    } catch (Throwable $e) {

        return [];
    }
}


/* ============================================================
   DATABASE INITIALIZ ATION
   ============================================================ */

initDatabase();
