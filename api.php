<?php
/**
 * API Handler for Skill-Gap Predictor
 * Project ID: P19 | IEEE CS Bangalore Chapter | GITAM University
 *
 * Dynamic architecture:
 *
 * Career URL
 *      ↓
 * Python scraper
 *      ↓
 * Actual jobs / roles / requirements
 *      ↓
 * Resume upload
 *      ↓
 * Resume skills
 *      ↓
 * Skill matching
 *      ↓
 * Recommended job role
 *
 * No predefined company or job role is used here.
 */

session_start();

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/db.php';


/* ============================================================
   COMMON JSON RESPONSE
   ============================================================ */

function jsonResponse($data, $httpCode = 200)
{
    http_response_code($httpCode);

    echo json_encode(
        $data,
        JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
    );

    exit;
}


/* ============================================================
   PYTHON BRIDGE
   ============================================================ */

function callPythonBridge($action, $payload = [])
{
    $isWindows =
        strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';

    $pythonCommands = $isWindows
        ? ['python', 'python3']
        : ['python3', 'python'];

    $bridgePath =
        __DIR__ . DIRECTORY_SEPARATOR . 'bridge.py';

    if (!file_exists($bridgePath)) {

        return [
            "status" => "error",
            "message" => "Python bridge file was not found."
        ];
    }

    $jsonInput =
        json_encode(
            $payload,
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
        );

    if ($jsonInput === false) {

        return [
            "status" => "error",
            "message" => "Unable to encode Python bridge input."
        ];
    }

    $descriptorspec = [
        0 => ["pipe", "r"],
        1 => ["pipe", "w"],
        2 => ["pipe", "w"]
    ];

    foreach ($pythonCommands as $pythonCmd) {

        $command =
            escapeshellcmd($pythonCmd) .
            ' ' .
            escapeshellarg($bridgePath) .
            ' ' .
            escapeshellarg($action);

        $process = @proc_open(
            $command,
            $descriptorspec,
            $pipes,
            __DIR__
        );

        if (!is_resource($process)) {
            continue;
        }

        fwrite($pipes[0], $jsonInput);
        fclose($pipes[0]);

        $output =
            stream_get_contents($pipes[1]);

        fclose($pipes[1]);

        $stderr =
            stream_get_contents($pipes[2]);

        fclose($pipes[2]);

        $exitCode =
            proc_close($process);

        $decoded =
            json_decode($output, true);

        if (is_array($decoded)) {

            return $decoded;
        }

        if (!empty($stderr)) {

            return [
                "status" => "error",
                "message" =>
                    "Python bridge error: " .
                    trim($stderr)
            ];
        }
    }

    return [
        "status" => "error",
        "message" =>
            "Could not start the Python bridge process."
    ];
}


/* ============================================================
   SKILL NORMALIZATION
   ============================================================ */

function normalizeSkills($skills)
{
    if ($skills === null) {
        return [];
    }

    if (is_string($skills)) {

        $decoded =
            json_decode($skills, true);

        if (is_array($decoded)) {

            $skills = $decoded;

        } else {

            $skills =
                preg_split(
                    '/[,;\n|]+/',
                    $skills
                );
        }
    }

    if (!is_array($skills)) {
        return [];
    }

    $result = [];
    $seen = [];

    foreach ($skills as $skill) {

        if (is_array($skill)) {

            $skill =
                $skill['name']
                ?? $skill['skill']
                ?? $skill['title']
                ?? $skill['value']
                ?? '';
        }

        if (!is_scalar($skill)) {
            continue;
        }

        $skill =
            trim(
                strip_tags((string)$skill)
            );

        $skill =
            preg_replace(
                '/\s+/',
                ' ',
                $skill
            );

        if ($skill === '') {
            continue;
        }

        $key =
            strtolower($skill);

        if (!isset($seen[$key])) {

            $seen[$key] = true;
            $result[] = $skill;
        }
    }

    return array_values($result);
}


/* ============================================================
   JOB NORMALIZATION
   ============================================================ */

function normalizeCareerJobs($jobs)
{
    if (!is_array($jobs)) {
        return [];
    }

    $normalized = [];

    foreach ($jobs as $job) {

        if (!is_array($job)) {
            continue;
        }

        $company =
            $job['company']
            ?? $job['employer']
            ?? $job['company_name']
            ?? $job['organization']
            ?? '';

        $role =
            $job['role']
            ?? $job['title']
            ?? $job['job_title']
            ?? $job['position']
            ?? $job['name']
            ?? '';

        $requiredSkills =
            $job['required_skills']
            ?? $job['skills']
            ?? $job['requirements']
            ?? $job['technical_skills']
            ?? [];

        $jobUrl =
            $job['url']
            ?? $job['link']
            ?? $job['job_url']
            ?? $job['apply_url']
            ?? '';

        $description =
            $job['description']
            ?? $job['text']
            ?? $job['summary']
            ?? '';

        if (is_array($company)) {
            $company = '';
        }

        if (is_array($role)) {
            $role = '';
        }

        if (is_array($jobUrl)) {
            $jobUrl = '';
        }

        if (!is_string($description)) {
            $description = '';
        }

        $company =
            trim(
                strip_tags((string)$company)
            );

        $role =
            trim(
                strip_tags((string)$role)
            );

        $jobUrl =
            trim(
                (string)$jobUrl
            );

        $description =
            trim(
                preg_replace(
                    '/\s+/',
                    ' ',
                    strip_tags($description)
                )
            );

        $requiredSkills =
            normalizeSkills(
                $requiredSkills
            );

        /*
         * Do not add an artificial role.
         *
         * A scraper result must contain an actual
         * role/title or actual requirements.
         */
        if (
            $role === '' &&
            empty($requiredSkills)
        ) {
            continue;
        }

        $normalized[] = [
            "company" =>
                $company,

            "role" =>
                $role,

            "required_skills" =>
                $requiredSkills,

            "url" =>
                $jobUrl,

            "description" =>
                $description
        ];
    }

    return $normalized;
}


/* ============================================================
   FIND JOBS RECURSIVELY
   ============================================================ */

function findJobsInResponse($data)
{
    if (!is_array($data)) {
        return [];
    }

    $possibleKeys = [
        'jobs',
        'roles',
        'job_listings',
        'jobListings',
        'listings',
        'results',
        'positions'
    ];

    foreach ($possibleKeys as $key) {

        if (
            isset($data[$key]) &&
            is_array($data[$key])
        ) {

            $jobs =
                normalizeCareerJobs(
                    $data[$key]
                );

            if (!empty($jobs)) {
                return $jobs;
            }
        }
    }

    foreach ($data as $value) {

        if (!is_array($value)) {
            continue;
        }

        $jobs =
            findJobsInResponse($value);

        if (!empty($jobs)) {
            return $jobs;
        }
    }

    return [];
}


/* ============================================================
   STORE CAREER JOBS
   ============================================================ */

function storeCareerJobs($jobs, $url = '')
{
    $jobs =
        normalizeCareerJobs($jobs);

    $_SESSION['career_jobs'] =
        $jobs;

    if ($url !== '') {

        $_SESSION['career_url'] =
            trim($url);
    }

    return $jobs;
}


/* ============================================================
   DYNAMIC JOB RECOMMENDATION
   ============================================================ */

function normalizeComparisonText($value)
{
    $value =
        strtolower(
            trim(
                strip_tags((string)$value)
            )
        );

    $value =
        preg_replace(
            '/[^a-z0-9+#.\- ]+/i',
            ' ',
            $value
        );

    $value =
        preg_replace(
            '/\s+/',
            ' ',
            $value
        );

    return trim($value);
}


function skillMatches($resumeSkill, $requiredSkill)
{
    $a =
        normalizeComparisonText(
            $resumeSkill
        );

    $b =
        normalizeComparisonText(
            $requiredSkill
        );

    if ($a === '' || $b === '') {
        return false;
    }

    if ($a === $b) {
        return true;
    }

    /*
     * Allow cases such as:
     *
     * JavaScript ↔ javascript
     * Node.js ↔ node
     * React.js ↔ react
     */
    if (
        strpos($a, $b) !== false ||
        strpos($b, $a) !== false
    ) {
        return true;
    }

    return false;
}


function calculateLocalJobRecommendation(
    $jobs,
    $resumeSkills
) {
    $resumeSkills =
        normalizeSkills($resumeSkills);

    if (
        empty($jobs) ||
        empty($resumeSkills)
    ) {
        return null;
    }

    $best = null;

    foreach ($jobs as $job) {

        $required =
            normalizeSkills(
                $job['required_skills']
                ?? []
            );

        if (empty($required)) {
            continue;
        }

        $matched = [];
        $missing = [];

        foreach ($required as $requiredSkill) {

            $found = false;

            foreach ($resumeSkills as $resumeSkill) {

                if (
                    skillMatches(
                        $resumeSkill,
                        $requiredSkill
                    )
                ) {

                    $found = true;

                    $matched[] =
                        $requiredSkill;

                    break;
                }
            }

            if (!$found) {

                $missing[] =
                    $requiredSkill;
            }
        }

        $matched =
            array_values(
                array_unique($matched)
            );

        $missing =
            array_values(
                array_unique($missing)
            );

        $score =
            count($required) > 0
                ? round(
                    (
                        count($matched) /
                        count($required)
                    ) * 100,
                    1
                )
                : 0;

        $candidate = [
            "company" =>
                $job['company'] ?? '',

            "role" =>
                $job['role'] ?? '',

            "url" =>
                $job['url'] ?? '',

            "description" =>
                $job['description'] ?? '',

            "required_skills" =>
                $required,

            "matched_skills" =>
                $matched,

            "missing_skills" =>
                $missing,

            "score" =>
                $score
        ];

        if ($best === null) {

            $best = $candidate;

            continue;
        }

        /*
         * Compare dynamically:
         *
         * 1. Higher skill match percentage
         * 2. More matched skills
         */
        if (
            $candidate['score'] >
            $best['score']
        ) {

            $best = $candidate;

        } elseif (
            $candidate['score'] ===
            $best['score'] &&
            count($candidate['matched_skills']) >
            count($best['matched_skills'])
        ) {

            $best = $candidate;
        }
    }

    return $best;
}


/* ============================================================
   ACTION
   ============================================================ */

$action =
    $_GET['action']
    ?? ($_POST['action'] ?? '');

if ($action === '') {

    jsonResponse([
        "status" => "error",
        "message" =>
            "Action parameter required."
    ], 400);
}


/* ============================================================
   LOGIN
   ============================================================ */

if ($action === 'login') {

    $email =
        trim($_POST['email'] ?? '');

    $password =
        $_POST['password'] ?? '';

    $authRes =
        authenticateUser(
            $email,
            $password
        );

    if (
        isset($authRes['success']) &&
        $authRes['success']
    ) {

        /*
         * Regenerate the session ID after
         * successful authentication.
         */
        session_regenerate_id(true);

        $_SESSION['user'] =
            $authRes['user'];

        /*
         * Current resume state starts empty.
         * No fake skills.
         * No fake ATS score.
         */
        $_SESSION['extracted_skills'] = [];

        $_SESSION['ats_score'] = null;

        $_SESSION['parsed_resume'] = [];

        $_SESSION['career_jobs'] = [];

        $_SESSION['career_url'] = '';

        $_SESSION['target_company'] = '';

        $_SESSION['target_role'] = '';

        $_SESSION['required_skills'] = [];

        $_SESSION['recommended_job'] = null;

        jsonResponse([
            "status" => "success",
            "message" =>
                "Login successful.",
            "user" =>
                $authRes['user'],
            "loggedIn" =>
                true
        ]);
    }

    jsonResponse([
        "status" => "error",
        "message" =>
            $authRes['message']
    ], 401);
}


/* ============================================================
   SIGNUP
   ============================================================ */

if ($action === 'signup') {

    $name =
        trim($_POST['name'] ?? '');

    $email =
        trim($_POST['email'] ?? '');

    $password =
        $_POST['password'] ?? '';

    $university =
        trim(
            $_POST['university']
            ?? 'GITAM University, Bengaluru'
        );

    $branch =
        trim(
            $_POST['branch']
            ?? 'Computer Science & Engineering'
        );

    $year =
        (int)(
            $_POST['graduation_year']
            ?? date('Y')
        );

    $linkedin =
        trim(
            $_POST['linkedin'] ?? ''
        );

    $github =
        trim(
            $_POST['github'] ?? ''
        );


    /*
     * Company and role are intentionally empty.
     */
    $regRes =
        registerUser(
            $name,
            $email,
            $password,
            $university,
            $branch,
            $year,
            '',
            '',
            $linkedin,
            $github
        );

    if ($regRes['success']) {

        jsonResponse([
            "status" => "success",
            "message" =>
                $regRes['message']
        ]);
    }

    jsonResponse([
        "status" => "error",
        "message" =>
            $regRes['message']
    ], 400);
}


/* ============================================================
   LOGOUT
   ============================================================ */

if ($action === 'logout') {

    $_SESSION = [];

    if (
        ini_get("session.use_cookies")
    ) {

        $params =
            session_get_cookie_params();

        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params["path"],
            $params["domain"],
            $params["secure"],
            $params["httponly"]
        );
    }

    session_destroy();

    jsonResponse([
        "status" => "success",
        "message" =>
            "Logged out successfully.",
        "loggedIn" =>
            false
    ]);
}


/* ============================================================
   AUTHENTICATION REQUIRED
   ============================================================ */

if (!isset($_SESSION['user'])) {

    jsonResponse([
        "status" => "error",
        "message" =>
            "Unauthorized access. Please log in.",
        "loggedIn" =>
            false
    ], 401);
}


$current_user =
    $_SESSION['user'];


/* ============================================================
   UPDATE PROFILE
   ============================================================ */

if ($action === 'update_profile') {

    $name =
        trim(
            $_POST['name']
            ?? ($current_user['name'] ?? '')
        );

    $university =
        trim(
            $_POST['university']
            ?? ($current_user['university'] ?? '')
        );

    $branch =
        trim(
            $_POST['branch']
            ?? ($current_user['branch'] ?? '')
        );

    $year =
        (int)(
            $_POST['graduation_year']
            ?? ($current_user['graduation_year'] ?? date('Y'))
        );

    /*
     * Target company/role are not profile defaults.
     *
     * They are dynamically selected from the career URL.
     */
    $company =
        array_key_exists(
            'target_company',
            $_POST
        )
            ? trim($_POST['target_company'])
            : '';

    $role =
        array_key_exists(
            'target_role',
            $_POST
        )
            ? trim($_POST['target_role'])
            : '';

    $linkedin =
        trim(
            $_POST['linkedin']
            ?? ($current_user['linkedin'] ?? '')
        );

    $github =
        trim(
            $_POST['github']
            ?? ($current_user['github'] ?? '')
        );


    /*
     * Do not overwrite dynamic target information
     * when the profile form does not contain target fields.
     */
    if (!array_key_exists('target_company', $_POST)) {
        $company =
            $current_user['target_company'] ?? '';
    }

    if (!array_key_exists('target_role', $_POST)) {
        $role =
            $current_user['target_role'] ?? '';
    }


    $ok =
        updateStudentProfile(
            $current_user['id'],
            $name,
            $university,
            $branch,
            $year,
            $role,
            $company,
            $linkedin,
            $github
        );


    if ($ok) {

        $_SESSION['user'] =
            getStudentById(
                $current_user['id']
            );

        jsonResponse([
            "status" => "success",
            "message" =>
                "Profile updated successfully.",
            "user" =>
                $_SESSION['user']
        ]);
    }

    jsonResponse([
        "status" => "error",
        "message" =>
            "Failed to update profile."
    ], 500);
}


/* ============================================================
   UPDATE SKILLS
   ============================================================ */

if ($action === 'update_skills') {

    $skills =
        normalizeSkills(
            $_POST['skills'] ?? []
        );

    $_SESSION['extracted_skills'] =
        $skills;

    jsonResponse([
        "status" => "success",
        "skills" =>
            $skills
    ]);
}


/* ============================================================
   UPLOAD RESUME
   ============================================================ */

if ($action === 'upload_resume') {

    if (
        !isset($_FILES['resume_file']) ||
        $_FILES['resume_file']['error'] !==
        UPLOAD_ERR_OK
    ) {

        jsonResponse([
            "status" => "error",
            "message" =>
                "Please select a valid resume file."
        ], 400);
    }

    $file =
        $_FILES['resume_file'];

    $extension =
        strtolower(
            pathinfo(
                $file['name'],
                PATHINFO_EXTENSION
            )
        );

    if (
        !in_array(
            $extension,
            ['pdf', 'docx', 'txt'],
            true
        )
    ) {

        jsonResponse([
            "status" => "error",
            "message" =>
                "Unsupported file type. Please upload PDF, DOCX or TXT."
        ], 400);
    }


    /*
     * Use temporary storage.
     */
    $uploadDir =
        sys_get_temp_dir() .
        DIRECTORY_SEPARATOR .
        'skill_gap_predictor_uploads' .
        DIRECTORY_SEPARATOR;

    if (!is_dir($uploadDir)) {

        @mkdir(
            $uploadDir,
            0777,
            true
        );
    }


    $safeName =
        preg_replace(
            '/[^A-Za-z0-9._-]/',
            '_',
            basename($file['name'])
        );

    $targetPath =
        $uploadDir .
        uniqid(
            'resume_',
            true
        ) .
        '_' .
        $safeName;


    if (
        !move_uploaded_file(
            $file['tmp_name'],
            $targetPath
        )
    ) {

        jsonResponse([
            "status" => "error",
            "message" =>
                "Unable to store the uploaded resume."
        ], 500);
    }


    $parseRes =
        callPythonBridge(
            "parse_resume",
            [
                "file_path" =>
                    $targetPath,

                "file_name" =>
                    $file['name']
            ]
        );


    if (
        !isset($parseRes['status']) ||
        $parseRes['status'] !== 'success'
    ) {

        @unlink($targetPath);

        jsonResponse(
            is_array($parseRes)
                ? $parseRes
                : [
                    "status" => "error",
                    "message" =>
                        "Resume parsing failed."
                ],
            400
        );
    }


    $_SESSION['parsed_resume'] =
        $parseRes['parsed_resume']
        ?? [];

    $_SESSION['extracted_skills'] =
        normalizeSkills(
            $parseRes['extracted_skills']
            ?? []
        );

    $_SESSION['ats_score'] =
        isset($parseRes['ats_score']) &&
        is_numeric($parseRes['ats_score'])
            ? (float)$parseRes['ats_score']
            : null;


    /*
     * Resume contact information must come from
     * the uploaded resume.
     *
     * Never create fake phone numbers,
     * LinkedIn URLs or GitHub URLs.
     */
    $contact =
        $_SESSION['parsed_resume']['contact_info']
        ?? [];

    $linkedin =
        trim(
            $contact['linkedin']
            ?? ''
        );

    $github =
        trim(
            $contact['github']
            ?? ''
        );


    /*
     * Only update profile social links if the
     * uploaded resume actually contains them.
     */
    if ($linkedin !== '') {

        $_SESSION['user']['linkedin'] =
            $linkedin;
    }

    if ($github !== '') {

        $_SESSION['user']['github'] =
            $github;
    }


    /*
     * Dynamic job requirements.
     */
    $requiredSkills =
        normalizeSkills(
            $_POST['required_skills']
            ?? ($_SESSION['required_skills'] ?? [])
        );

    $_SESSION['required_skills'] =
        $requiredSkills;


    /*
     * Dynamic target only.
     */
    $targetCompany =
        trim(
            $_POST['target_company']
            ?? ($_SESSION['target_company'] ?? '')
        );

    $targetRole =
        trim(
            $_POST['target_role']
            ?? ($_SESSION['target_role'] ?? '')
        );


    $_SESSION['target_company'] =
        $targetCompany;

    $_SESSION['target_role'] =
        $targetRole;


    /*
     * Calculate metrics only when actual
     * job requirements exist.
     */
    $metrics = [];

    if (!empty($requiredSkills)) {

        $metrics =
            callPythonBridge(
                "calculate_metrics",
                [
                    "extracted_skills" =>
                        $_SESSION['extracted_skills'],

                    "required_skills" =>
                        $requiredSkills,

                    "ats_score" =>
                        $_SESSION['ats_score'],

                    "target_company" =>
                        $targetCompany,

                    "target_role" =>
                        $targetRole,

                    "section_presence" =>
                        $_SESSION['parsed_resume']['section_presence']
                        ?? []
                ]
            );

        if (!is_array($metrics)) {
            $metrics = [];
        }
    }


    /*
     * Save evaluation only if a dynamic job
     * actually supplied requirements.
     */
    if (!empty($requiredSkills)) {

        saveResumeEvaluation(
            $current_user['id'],
            $file['name'],
            $parseRes['detected_domain'] ?? '',
            $_SESSION['ats_score'],
            $metrics['readiness_pct'] ?? 0,
            $metrics['confidence_pct'] ?? 0,
            $metrics['matched_skills'] ?? [],
            $metrics['missing_skills'] ?? [],
            [
                "Tailor resume content to the selected job.",
                "Add measurable results to project descriptions.",
                "Develop the missing technical skills."
            ]
        );
    }


    @unlink($targetPath);


    jsonResponse([
        "status" => "success",
        "message" =>
            "Resume parsed successfully.",
        "data" =>
            $parseRes,
        "metrics" =>
            $metrics,
        "extracted_skills" =>
            $_SESSION['extracted_skills'],
        "ats_score" =>
            $_SESSION['ats_score'],
        "recommended_job" =>
            $_SESSION['recommended_job'] ?? null
    ]);
}


/* ============================================================
   SAMPLE RESUME
   ============================================================ */

if ($action === 'load_sample') {

    /*
     * Kept only for compatibility.
     *
     * This does not create a company or role.
     */
    $sampleRes =
        callPythonBridge(
            "parse_sample",
            [
                "name" =>
                    $current_user['name'] ?? '',

                "email" =>
                    $current_user['email'] ?? '',

                "branch" =>
                    $current_user['branch']
                    ?? '',

                "year" =>
                    $current_user['graduation_year']
                    ?? date('Y')
            ]
        );


    if (
        isset($sampleRes['status']) &&
        $sampleRes['status'] === 'success'
    ) {

        $_SESSION['parsed_resume'] =
            $sampleRes['parsed_resume']
            ?? [];

        $_SESSION['extracted_skills'] =
            normalizeSkills(
                $sampleRes['extracted_skills']
                ?? []
            );

        $_SESSION['ats_score'] =
            $sampleRes['ats_score']
            ?? null;

        jsonResponse([
            "status" => "success",
            "data" =>
                $sampleRes
        ]);
    }


    jsonResponse(
        $sampleRes
    );
}


/* ============================================================
   SCRAPE CAREER URL
   ============================================================ */

if ($action === 'scrape_url') {

    $url =
        trim(
            $_POST['url'] ?? ''
        );


    if ($url === '') {

        jsonResponse([
            "status" => "error",
            "message" =>
                "Please enter a career URL."
        ], 400);
    }


    if (
        !filter_var(
            $url,
            FILTER_VALIDATE_URL
        )
    ) {

        jsonResponse([
            "status" => "error",
            "message" =>
                "Please enter a valid career URL."
        ], 400);
    }


    $res =
        callPythonBridge(
            "scrape_url",
            [
                "url" =>
                    $url
            ]
        );


    if (
        !isset($res['status']) ||
        $res['status'] !== 'success'
    ) {

        jsonResponse(
            is_array($res)
                ? $res
                : [
                    "status" => "error",
                    "message" =>
                        "Career page scraping failed."
                ],
            400
        );
    }


    $jobs =
        findJobsInResponse(
            $res
        );


    storeCareerJobs(
        $jobs,
        $url
    );


    /*
     * Immediately recommend a role if the user
     * has already uploaded a resume.
     */
    $recommendation = null;

    if (
        !empty($_SESSION['extracted_skills']) &&
        !empty($_SESSION['career_jobs'])
    ) {

        $recommendation =
            calculateLocalJobRecommendation(
                $_SESSION['career_jobs'],
                $_SESSION['extracted_skills']
            );

        if ($recommendation !== null) {

            $_SESSION['recommended_job'] =
                $recommendation;

            $_SESSION['target_company'] =
                $recommendation['company'];

            $_SESSION['target_role'] =
                $recommendation['role'];

            $_SESSION['required_skills'] =
                $recommendation['required_skills'];
        }
    }


    jsonResponse([
        "status" => "success",
        "message" =>
            count($_SESSION['career_jobs']) .
            " job(s) found.",
        "career_url" =>
            $_SESSION['career_url'],
        "jobs" =>
            $_SESSION['career_jobs'],
        "job_count" =>
            count($_SESSION['career_jobs']),
        "recommendation" =>
            $recommendation
    ]);
}


/* ============================================================
   RECOMMEND JOB
   ============================================================ */

if ($action === 'recommend_job') {

    $jobs =
        $_SESSION['career_jobs']
        ?? [];

    $resumeSkills =
        $_SESSION['extracted_skills']
        ?? [];


    if (empty($jobs)) {

        jsonResponse([
            "status" => "error",
            "message" =>
                "No jobs have been loaded. Enter a career URL first."
        ], 400);
    }


    if (empty($resumeSkills)) {

        jsonResponse([
            "status" => "error",
            "message" =>
                "Please upload your resume before calculating the best matching role."
        ], 400);
    }


    $recommendation =
        calculateLocalJobRecommendation(
            $jobs,
            $resumeSkills
        );


    if ($recommendation === null) {

        jsonResponse([
            "status" => "error",
            "message" =>
                "The available jobs do not contain enough skill information for matching."
        ], 400);
    }


    $_SESSION['recommended_job'] =
        $recommendation;

    $_SESSION['target_company'] =
        $recommendation['company'];

    $_SESSION['target_role'] =
        $recommendation['role'];

    $_SESSION['required_skills'] =
        $recommendation['required_skills'];


    jsonResponse([
        "status" => "success",
        "recommendation" =>
            $recommendation
    ]);
}


/* ============================================================
   GET METRICS
   ============================================================ */

if ($action === 'get_metrics') {

    $company =
        trim(
            $_POST['target_company']
            ?? ($_SESSION['target_company'] ?? '')
        );

    $role =
        trim(
            $_POST['target_role']
            ?? ($_SESSION['target_role'] ?? '')
        );

    $requiredSkills =
        normalizeSkills(
            $_POST['required_skills']
            ?? ($_SESSION['required_skills'] ?? [])
        );


    if (empty($role)) {

        jsonResponse([
            "status" => "error",
            "message" =>
                "No job role has been selected."
        ], 400);
    }


    if (empty($requiredSkills)) {

        jsonResponse([
            "status" => "error",
            "message" =>
                "No job requirements are available. Please enter a career URL and select a job."
        ], 400);
    }


    $_SESSION['target_company'] =
        $company;

    $_SESSION['target_role'] =
        $role;

    $_SESSION['required_skills'] =
        $requiredSkills;


    $metrics =
        callPythonBridge(
            "calculate_metrics",
            [
                "extracted_skills" =>
                    $_SESSION['extracted_skills']
                    ?? [],

                "required_skills" =>
                    $requiredSkills,

                "ats_score" =>
                    $_SESSION['ats_score']
                    ?? null,

                "target_company" =>
                    $company,

                "target_role" =>
                    $role,

                "section_presence" =>
                    $_SESSION['parsed_resume']['section_presence']
                    ?? []
            ]
        );


    if (!is_array($metrics)) {
        $metrics = [];
    }


    $metrics['ats_score'] =
        $_SESSION['ats_score']
        ?? null;


    $metrics['matched_skills'] =
        normalizeSkills(
            $metrics['matched_skills']
            ?? []
        );

    $metrics['missing_skills'] =
        normalizeSkills(
            $metrics['missing_skills']
            ?? []
        );


    jsonResponse(
        $metrics
    );
}


/* ============================================================
   RANK JOBS
   ============================================================ */

if ($action === 'rank_jobs') {

    $domainFilter =
        $_POST['domain_filter']
        ?? 'All Domains';

    $careerJobs =
        $_SESSION['career_jobs']
        ?? [];


    if (empty($careerJobs)) {

        jsonResponse([
            "status" => "error",
            "message" =>
                "No career jobs available. Please enter a career URL first."
        ], 400);
    }


    /*
     * First attempt: use Python ranking if the bridge
     * supports it.
     */
    $res =
        callPythonBridge(
            "rank_jobs",
            [
                "extracted_skills" =>
                    $_SESSION['extracted_skills']
                    ?? [],

                "domain_filter" =>
                    $domainFilter,

                "jobs" =>
                    $careerJobs
            ]
        );


    /*
     * If Python ranking fails, return the dynamic
     * jobs instead of falling back to predefined data.
     */
    if (
        !is_array($res) ||
        !isset($res['status']) ||
        $res['status'] !== 'success'
    ) {

        $ranked = [];

        foreach ($careerJobs as $job) {

            $recommendation =
                calculateLocalJobRecommendation(
                    [$job],
                    $_SESSION['extracted_skills']
                    ?? []
                );

            if ($recommendation !== null) {

                $ranked[] =
                    $recommendation;
            }
        }

        usort(
            $ranked,
            function ($a, $b) {

                return
                    ($b['score'] ?? 0) <=>
                    ($a['score'] ?? 0);
            }
        );


        jsonResponse([
            "status" => "success",
            "jobs" =>
                $ranked
        ]);
    }


    jsonResponse(
        $res
    );
}


/* ============================================================
   ROADMAP
   ============================================================ */

if ($action === 'get_roadmap') {

    $missingSkills =
        normalizeSkills(
            $_POST['missing_skills']
            ?? []
        );

    $targetRole =
        trim(
            $_POST['target_role']
            ?? ($_SESSION['target_role'] ?? '')
        );

    $targetCompany =
        trim(
            $_POST['target_company']
            ?? ($_SESSION['target_company'] ?? '')
        );


    if ($targetRole === '') {

        jsonResponse([
            "status" => "error",
            "message" =>
                "No target job role has been selected."
        ], 400);
    }


    $res =
        callPythonBridge(
            "generate_roadmap",
            [
                "missing_skills" =>
                    $missingSkills,

                "target_role" =>
                    $targetRole,

                "target_company" =>
                    $targetCompany
            ]
        );


    jsonResponse(
        $res
    );
}


/* ============================================================
   INTERVIEW
   ============================================================ */

if ($action === 'get_interview') {

    $matched =
        normalizeSkills(
            $_POST['matched_skills']
            ?? []
        );

    $missing =
        normalizeSkills(
            $_POST['missing_skills']
            ?? []
        );

    $targetRole =
        trim(
            $_POST['target_role']
            ?? ($_SESSION['target_role'] ?? '')
        );


    if ($targetRole === '') {

        jsonResponse([
            "status" => "error",
            "message" =>
                "No target job role has been selected."
        ], 400);
    }


    $res =
        callPythonBridge(
            "generate_interview",
            [
                "target_role" =>
                    $targetRole,

                "matched_skills" =>
                    $matched,

                "missing_skills" =>
                    $missing
            ]
        );


    jsonResponse(
        $res
    );
}


/* ============================================================
   AI INTERVIEW ASSISTANT
   ============================================================ */

if ($action === 'ask_interview_ai') {

    $prompt =
        trim(
            $_POST['prompt'] ?? ''
        );

    $targetRole =
        trim(
            $_POST['target_role']
            ?? ($_SESSION['target_role'] ?? '')
        );

    $targetCompany =
        trim(
            $_POST['target_company']
            ?? ($_SESSION['target_company'] ?? '')
        );


    if ($targetRole === '') {

        jsonResponse([
            "status" => "error",
            "message" =>
                "No target job role has been selected."
        ], 400);
    }


    $res =
        callPythonBridge(
            "ask_interview_ai",
            [
                "prompt" =>
                    $prompt,

                "target_role" =>
                    $targetRole,

                "target_company" =>
                    $targetCompany
            ]
        );


    jsonResponse(
        $res
    );
}


/* ============================================================
   EVALUATE INTERVIEW ANSWER
   ============================================================ */

if ($action === 'evaluate_answer') {

    $question =
        trim(
            $_POST['question'] ?? ''
        );

    $userAnswer =
        trim(
            $_POST['user_answer'] ?? ''
        );

    $targetRole =
        trim(
            $_POST['target_role']
            ?? ($_SESSION['target_role'] ?? '')
        );


    if ($targetRole === '') {

        jsonResponse([
            "status" => "error",
            "message" =>
                "No target job role has been selected."
        ], 400);
    }


    $res =
        callPythonBridge(
            "evaluate_answer",
            [
                "question" =>
                    $question,

                "user_answer" =>
                    $userAnswer,

                "target_role" =>
                    $targetRole
            ]
        );


    jsonResponse(
        $res
    );
}


/* ============================================================
   DOWNLOAD PDF
   ============================================================ */

if ($action === 'download_pdf') {

    $targetCompany =
        trim(
            $_POST['target_company']
            ?? ($_SESSION['target_company'] ?? '')
        );

    $targetRole =
        trim(
            $_POST['target_role']
            ?? ($_SESSION['target_role'] ?? '')
        );

    $requiredSkills =
        normalizeSkills(
            $_POST['required_skills']
            ?? ($_SESSION['required_skills'] ?? [])
        );


    if ($targetRole === '') {

        jsonResponse([
            "status" => "error",
            "message" =>
                "No target job role is available."
        ], 400);
    }


    if (empty($requiredSkills)) {

        jsonResponse([
            "status" => "error",
            "message" =>
                "No job requirements are available for the report."
        ], 400);
    }


    $metrics =
        callPythonBridge(
            "calculate_metrics",
            [
                "extracted_skills" =>
                    $_SESSION['extracted_skills']
                    ?? [],

                "required_skills" =>
                    $requiredSkills,

                "ats_score" =>
                    $_SESSION['ats_score']
                    ?? null,

                "target_company" =>
                    $targetCompany,

                "target_role" =>
                    $targetRole,

                "section_presence" =>
                    $_SESSION['parsed_resume']['section_presence']
                    ?? []
            ]
        );


    if (!is_array($metrics)) {
        $metrics = [];
    }


    $roadmapRes =
        callPythonBridge(
            "generate_roadmap",
            [
                "missing_skills" =>
                    $metrics['missing_skills']
                    ?? [],

                "target_role" =>
                    $targetRole,

                "target_company" =>
                    $targetCompany
            ]
        );


    $recommendations = [];

    if (
        !empty(
            $metrics['missing_skills']
        )
    ) {

        $firstMissing =
            $metrics['missing_skills'][0]
            ?? '';

        if ($firstMissing !== '') {

            $recommendations[] =
                "Prioritize learning " .
                $firstMissing .
                " and build a practical project using it.";
        }
    }

    $recommendations[] =
        "Tailor the resume to the selected job requirements.";

    $recommendations[] =
        "Use measurable results in project descriptions.";


    $pdfRes =
        callPythonBridge(
            "generate_pdf",
            [
                "student_name" =>
                    $current_user['name'] ?? 'Student',

                "target_role" =>
                    $targetRole,

                "target_company" =>
                    $targetCompany,

                "domain" =>
                    $metrics['detected_domain']
                    ?? '',

                "ats_score" =>
                    $_SESSION['ats_score']
                    ?? null,

                "readiness_score" =>
                    $metrics['readiness_pct']
                    ?? 0,

                "confidence_score" =>
                    $metrics['confidence_pct']
                    ?? 0,

                "resume_strength" =>
                    $metrics['strength_label']
                    ?? '',

                "matched_skills" =>
                    $metrics['matched_skills']
                    ?? [],

                "missing_skills" =>
                    $metrics['missing_skills']
                    ?? [],

                "recommendations" =>
                    $recommendations,

                "roadmap_phases" =>
                    $roadmapRes['roadmap']['phases']
                    ?? []
            ]
        );


    if (
        !empty($pdfRes['pdf_b64'])
    ) {

        $pdfData =
            base64_decode(
                $pdfRes['pdf_b64'],
                true
            );

        if ($pdfData === false) {

            jsonResponse([
                "status" => "error",
                "message" =>
                    "Generated PDF data is invalid."
            ], 500);
        }


        header_remove('Content-Type');

        header(
            'Content-Type: application/pdf'
        );

        $safeName =
            preg_replace(
                '/[^A-Za-z0-9_-]/',
                '_',
                $current_user['name']
                ?? 'Student'
            );

        header(
            'Content-Disposition: attachment; filename="Progress_Report_' .
            $safeName .
            '.pdf"'
        );

        header(
            'Content-Length: ' .
            strlen($pdfData)
        );

        echo $pdfData;

        exit;
    }


    jsonResponse([
        "status" => "error",
        "message" =>
            "PDF generation failed."
    ], 500);
}


/* ============================================================
   INVALID ACTION
   ============================================================ */

jsonResponse([
    "status" => "error",
    "message" =>
        "Invalid API action: " . $action
], 400);
