<?php
/**
 * API Handler for Skill-Gap Predictor (Career Navigation AI)
 * Project ID: P19 | IEEE CS Bangalore Chapter | GITAM University
 */

session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';


/* ============================================================
   PYTHON BRIDGE
   ============================================================ */

function callPythonBridge($action, $payload = []) {

    $isWin = (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN');
    $pythonCmd = $isWin ? "python" : "python3";

    $bridgePath = __DIR__ . '/bridge.py';
    $jsonInput = json_encode($payload);

    $descriptorspec = [
        0 => ["pipe", "r"],
        1 => ["pipe", "w"],
        2 => ["pipe", "w"]
    ];

    $process = proc_open(
        "$pythonCmd \"$bridgePath\" $action",
        $descriptorspec,
        $pipes
    );

    if (!is_resource($process) && $isWin) {

        $pythonCmd = "python3";

        $process = proc_open(
            "$pythonCmd \"$bridgePath\" $action",
            $descriptorspec,
            $pipes
        );
    }

    if (is_resource($process)) {

        fwrite($pipes[0], $jsonInput);
        fclose($pipes[0]);

        $output = stream_get_contents($pipes[1]);
        fclose($pipes[1]);

        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[2]);

        proc_close($process);

        $res = json_decode($output, true);

        if ($res !== null) {
            return $res;
        }

        return [
            "status" => "error",
            "message" => "Bridge output error: " . ($stderr ?: $output)
        ];
    }

    return [
        "status" => "error",
        "message" => "Could not launch Python bridge process."
    ];
}


/* ============================================================
   HELPERS
   ============================================================ */

function normalizeSkills($skills) {

    if (is_string($skills)) {
        $decoded = json_decode($skills, true);

        if (is_array($decoded)) {
            $skills = $decoded;
        } else {
            $skills = preg_split('/[,;\n]+/', $skills);
        }
    }

    if (!is_array($skills)) {
        return [];
    }

    $result = [];

    foreach ($skills as $skill) {

        if (is_array($skill)) {
            $skill = $skill['name']
                ?? $skill['skill']
                ?? $skill['title']
                ?? '';
        }

        $skill = trim((string)$skill);

        if ($skill !== '') {
            $result[] = $skill;
        }
    }

    return array_values(array_unique($result));
}


/*
 * Normalize jobs returned by the Python scraper.
 * Different scraper implementations may use slightly different
 * property names, so this keeps the frontend independent of them.
 */
function normalizeCareerJobs($jobs) {

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
            ?? '';

        $role =
            $job['role']
            ?? $job['title']
            ?? $job['job_title']
            ?? $job['position']
            ?? '';

        $requiredSkills =
            $job['required_skills']
            ?? $job['skills']
            ?? $job['requirements']
            ?? [];

        $jobUrl =
            $job['url']
            ?? $job['link']
            ?? $job['job_url']
            ?? '';

        $description =
            $job['description']
            ?? $job['text']
            ?? '';

        $requiredSkills = normalizeSkills($requiredSkills);

        if (is_string($description)) {
            $description = trim($description);
        } else {
            $description = '';
        }

        if (is_string($role)) {
            $role = trim($role);
        } else {
            $role = '';
        }

        if (is_string($company)) {
            $company = trim($company);
        } else {
            $company = '';
        }

        if (is_string($jobUrl)) {
            $jobUrl = trim($jobUrl);
        } else {
            $jobUrl = '';
        }

        /*
         * Only keep actual job entries.
         */
        if ($role === '' && empty($requiredSkills)) {
            continue;
        }

        $normalized[] = [
            "company" => $company,
            "role" => $role,
            "required_skills" => $requiredSkills,
            "url" => $jobUrl,
            "description" => $description
        ];
    }

    return $normalized;
}


/*
 * Find jobs recursively inside a scraper response.
 *
 * This supports responses such as:
 * {
 *   "jobs": [...]
 * }
 *
 * or:
 * {
 *   "data": {
 *      "jobs": [...]
 *   }
 * }
 */
function findJobsInResponse($data) {

    if (!is_array($data)) {
        return [];
    }

    foreach (['jobs', 'roles', 'job_listings', 'jobListings', 'listings'] as $key) {

        if (isset($data[$key]) && is_array($data[$key])) {

            $jobs = normalizeCareerJobs($data[$key]);

            if (!empty($jobs)) {
                return $jobs;
            }
        }
    }

    foreach ($data as $value) {

        if (is_array($value)) {

            $jobs = findJobsInResponse($value);

            if (!empty($jobs)) {
                return $jobs;
            }
        }
    }

    return [];
}


/*
 * Store the dynamically scraped career jobs.
 */
function storeCareerJobs($jobs, $url = '') {

    $jobs = normalizeCareerJobs($jobs);

    $_SESSION['career_jobs'] = $jobs;

    if ($url !== '') {
        $_SESSION['career_url'] = $url;
    }

    return $jobs;
}


/* ============================================================
   ACTION
   ============================================================ */

$action = $_GET['action'] ?? ($_POST['action'] ?? '');

if (empty($action)) {

    echo json_encode([
        "status" => "error",
        "message" => "Action parameter required."
    ]);

    exit;
}


/* ============================================================
   AUTH
   ============================================================ */

if ($action === 'login') {

    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';

    $authRes = authenticateUser($email, $password);

    if ($authRes['success']) {

        $_SESSION['user'] = $authRes['user'];

        /*
         * Do NOT create fake resume data.
         */
        $_SESSION['extracted_skills'] =
            $_SESSION['extracted_skills'] ?? [];

        $_SESSION['ats_score'] =
            $_SESSION['ats_score'] ?? null;

        $_SESSION['parsed_resume'] =
            $_SESSION['parsed_resume'] ?? [];

        $_SESSION['career_jobs'] =
            $_SESSION['career_jobs'] ?? [];

        $_SESSION['career_url'] =
            $_SESSION['career_url'] ?? '';

        $_SESSION['target_company'] =
            $_SESSION['target_company'] ?? '';

        $_SESSION['target_role'] =
            $_SESSION['target_role'] ?? '';

        $_SESSION['required_skills'] =
            $_SESSION['required_skills'] ?? [];

        /*
         * Do not reconstruct resume skills from evaluation history.
         * History belongs to previous evaluations, not the current
         * uploaded resume.
         */
        echo json_encode([
            "status" => "success",
            "message" => "Login successful",
            "user" => $authRes['user']
        ]);

    } else {

        echo json_encode([
            "status" => "error",
            "message" => $authRes['message']
        ]);
    }

    exit;
}


/* ============================================================
   SIGNUP
   ============================================================ */

if ($action === 'signup') {

    $name = $_POST['name'] ?? '';
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';

    $university =
        $_POST['university']
        ?? 'GITAM University, Bengaluru';

    $branch =
        $_POST['branch']
        ?? 'Computer Science & Engineering';

    $year =
        $_POST['graduation_year']
        ?? 2026;

    $linkedin =
        $_POST['linkedin']
        ?? '';

    $github =
        $_POST['github']
        ?? '';

    /*
     * No predefined company or role.
     */
    $regRes = registerUser(
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

        echo json_encode([
            "status" => "success",
            "message" => $regRes['message']
        ]);

    } else {

        echo json_encode([
            "status" => "error",
            "message" => $regRes['message']
        ]);
    }

    exit;
}


/* ============================================================
   LOGOUT
   ============================================================ */

if ($action === 'logout') {

    session_destroy();

    echo json_encode([
        "status" => "success",
        "message" => "Logged out successfully"
    ]);

    exit;
}


/* ============================================================
   LOGIN REQUIRED
   ============================================================ */

if (!isset($_SESSION['user'])) {

    echo json_encode([
        "status" => "error",
        "message" => "Unauthorized access. Please log in."
    ]);

    exit;
}

$current_user = $_SESSION['user'];


/* ============================================================
   UPDATE PROFILE
   ============================================================ */

if ($action === 'update_profile') {

    $name =
        $_POST['name']
        ?? $current_user['name'];

    $university =
        $_POST['university']
        ?? $current_user['university'];

    $branch =
        $_POST['branch']
        ?? $current_user['branch'];

    $year =
        (int)(
            $_POST['graduation_year']
            ?? $current_user['graduation_year']
        );

    /*
     * No Google / Software Engineer defaults.
     */
    $company =
        $_POST['target_company']
        ?? ($current_user['target_company'] ?? '');

    $role =
        $_POST['target_role']
        ?? ($current_user['target_role'] ?? '');

    $linkedin =
        $_POST['linkedin']
        ?? ($current_user['linkedin'] ?? '');

    $github =
        $_POST['github']
        ?? ($current_user['github'] ?? '');

    $ok = updateStudentProfile(
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

        $_SESSION['user']['name'] = $name;
        $_SESSION['user']['university'] = $university;
        $_SESSION['user']['branch'] = $branch;
        $_SESSION['user']['graduation_year'] = $year;
        $_SESSION['user']['target_company'] = $company;
        $_SESSION['user']['target_role'] = $role;
        $_SESSION['user']['linkedin'] = $linkedin;
        $_SESSION['user']['github'] = $github;

        echo json_encode([
            "status" => "success",
            "message" => "Profile updated successfully!"
        ]);

    } else {

        echo json_encode([
            "status" => "error",
            "message" => "Failed to update profile."
        ]);
    }

    exit;
}


/* ============================================================
   UPDATE SKILLS
   ============================================================ */

if ($action === 'update_skills') {

    $skills = normalizeSkills(
        $_POST['skills'] ?? []
    );

    $_SESSION['extracted_skills'] = $skills;

    echo json_encode([
        "status" => "success",
        "skills" => $skills
    ]);

    exit;
}


/* ============================================================
   UPLOAD RESUME
   ============================================================ */

if ($action === 'upload_resume') {

    if (
        !isset($_FILES['resume_file']) ||
        $_FILES['resume_file']['error'] !== UPLOAD_ERR_OK
    ) {

        echo json_encode([
            "status" => "error",
            "message" => "Please select a valid resume file (PDF or DOCX)."
        ]);

        exit;
    }

    $file = $_FILES['resume_file'];

    $ext =
        strtolower(
            pathinfo($file['name'], PATHINFO_EXTENSION)
        );

    if (!in_array($ext, ['pdf', 'docx', 'txt'])) {

        echo json_encode([
            "status" => "error",
            "message" => "Unsupported file type. Please upload a PDF or DOCX file."
        ]);

        exit;
    }

    $uploadDir = __DIR__ . '/scratch/uploads/';

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $targetPath =
        $uploadDir .
        uniqid('res_') .
        '_' .
        basename($file['name']);

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {

        echo json_encode([
            "status" => "error",
            "message" => "Unable to store uploaded resume."
        ]);

        exit;
    }

    $parseRes = callPythonBridge(
        "parse_resume",
        [
            "file_path" => $targetPath,
            "file_name" => $file['name']
        ]
    );

    if ($parseRes['status'] === 'success') {

        $_SESSION['parsed_resume'] =
            $parseRes['parsed_resume'] ?? [];

        $_SESSION['extracted_skills'] =
            normalizeSkills(
                $parseRes['extracted_skills'] ?? []
            );

        $_SESSION['ats_score'] =
            $parseRes['ats_score'] ?? null;


        /* --------------------------------------------
           Resume contact information
           -------------------------------------------- */

        $contact =
            $_SESSION['parsed_resume']['contact_info']
            ?? [];

        $extractedLi =
            trim($contact['linkedin'] ?? '');

        $extractedGh =
            trim($contact['github'] ?? '');

        /*
         * Do not copy account profile information into
         * the uploaded resume.
         */
        if ($extractedLi !== '') {

            $_SESSION['user']['linkedin'] =
                $extractedLi;

        } else {

            $_SESSION['parsed_resume']['contact_info']['linkedin'] =
                '';
        }


        if ($extractedGh !== '') {

            $_SESSION['user']['github'] =
                $extractedGh;

        } else {

            $_SESSION['parsed_resume']['contact_info']['github'] =
                '';
        }


        /*
         * Only update profile links when they were actually
         * detected in the uploaded resume.
         */
        updateStudentProfile(
            $current_user['id'],
            $current_user['name'],
            $current_user['university'],
            $current_user['branch'],
            $current_user['graduation_year'],
            $_SESSION['target_role']
                ?? ($current_user['target_role'] ?? ''),
            $_SESSION['target_company']
                ?? ($current_user['target_company'] ?? ''),
            $_SESSION['user']['linkedin']
                ?? ($current_user['linkedin'] ?? ''),
            $_SESSION['user']['github']
                ?? ($current_user['github'] ?? '')
        );


        /* --------------------------------------------
           Required skills come from the selected
           dynamically scraped job.
           -------------------------------------------- */

        $reqSkills =
            $_POST['required_skills']
            ?? ($_SESSION['required_skills'] ?? []);

        $reqSkills = normalizeSkills($reqSkills);

        /*
         * Do NOT use a hardcoded skill list.
         */
        $_SESSION['required_skills'] = $reqSkills;


        $targetCompany =
            $_POST['target_company']
            ?? ($_SESSION['target_company'] ?? '');

        $targetRole =
            $_POST['target_role']
            ?? ($_SESSION['target_role'] ?? '');


        $_SESSION['target_company'] =
            trim((string)$targetCompany);

        $_SESSION['target_role'] =
            trim((string)$targetRole);


        /*
         * Calculate metrics only when actual job
         * requirements are available.
         */
        $metrics = [];

        if (!empty($reqSkills)) {

            $metrics = callPythonBridge(
                "calculate_metrics",
                [
                    "extracted_skills" =>
                        $_SESSION['extracted_skills'],

                    "required_skills" =>
                        $reqSkills,

                    "ats_score" =>
                        $_SESSION['ats_score'],

                    "target_company" =>
                        $_SESSION['target_company'],

                    "target_role" =>
                        $_SESSION['target_role'],

                    "section_presence" =>
                        $_SESSION['parsed_resume']['section_presence']
                        ?? []
                ]
            );
        }


        /*
         * Save evaluation only when a real dynamically
         * selected job exists.
         */
        if (!empty($reqSkills) && is_array($metrics)) {

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
                    "Enhance project bullet points with quantifiable metrics."
                ]
            );
        }


        @unlink($targetPath);


        echo json_encode([
            "status" => "success",
            "data" => $parseRes,
            "metrics" => $metrics
        ]);

    } else {

        @unlink($targetPath);

        echo json_encode($parseRes);
    }

    exit;
}


/* ============================================================
   SAMPLE RESUME
   ============================================================ */

if ($action === 'load_sample') {

    /*
     * This action is retained for compatibility with the
     * existing application. It does NOT create a company
     * or target role.
     */

    $sampleRes = callPythonBridge(
        "parse_sample",
        [
            "name" =>
                $current_user['name'],

            "email" =>
                $current_user['email'],

            "branch" =>
                $current_user['branch']
                ?? 'Computer Science & Engineering',

            "year" =>
                $current_user['graduation_year']
                ?? 2026
        ]
    );

    if ($sampleRes['status'] === 'success') {

        $_SESSION['parsed_resume'] =
            $sampleRes['parsed_resume'] ?? [];

        $_SESSION['extracted_skills'] =
            normalizeSkills(
                $sampleRes['extracted_skills'] ?? []
            );

        $_SESSION['ats_score'] =
            $sampleRes['ats_score'] ?? null;

        echo json_encode([
            "status" => "success",
            "data" => $sampleRes
        ]);

    } else {

        echo json_encode($sampleRes);
    }

    exit;
}


/* ============================================================
   GET METRICS
   ============================================================ */

if ($action === 'get_metrics') {

    $comp =
        trim(
            $_POST['target_company']
            ?? ($_SESSION['target_company'] ?? '')
        );

    $role =
        trim(
            $_POST['target_role']
            ?? ($_SESSION['target_role'] ?? '')
        );

    $reqSkills =
        normalizeSkills(
            $_POST['required_skills']
            ?? ($_SESSION['required_skills'] ?? [])
        );


    /*
     * Never load company_roles.json.
     *
     * Required skills must come from the dynamically
     * scraped job.
     */
    if (empty($reqSkills)) {

        echo json_encode([
            "status" => "error",
            "message" =>
                "No job requirements are available. Please enter a career URL and select a job role first."
        ]);

        exit;
    }


    $_SESSION['target_company'] = $comp;
    $_SESSION['target_role'] = $role;
    $_SESSION['required_skills'] = $reqSkills;


    $metrics = callPythonBridge(
        "calculate_metrics",
        [
            "extracted_skills" =>
                $_SESSION['extracted_skills'] ?? [],

            "required_skills" =>
                $reqSkills,

            "ats_score" =>
                $_SESSION['ats_score'] ?? null,

            "target_company" =>
                $comp,

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


    /*
     * Do not fabricate scores.
     */
    $metrics['ats_score'] =
        $_SESSION['ats_score'] ?? null;


    if (!isset($metrics['matched_skills'])) {
        $metrics['matched_skills'] = [];
    }

    if (!isset($metrics['missing_skills'])) {
        $metrics['missing_skills'] = [];
    }


    echo json_encode($metrics);

    exit;
}


/* ============================================================
   RANK JOBS
   ============================================================ */

if ($action === 'rank_jobs') {

    $domain_filter =
        $_POST['domain_filter']
        ?? 'All Domains';

    /*
     * Prefer dynamically scraped jobs.
     */
    $careerJobs =
        $_SESSION['career_jobs']
        ?? [];

    if (!empty($careerJobs)) {

        $res = callPythonBridge(
            "rank_jobs",
            [
                "extracted_skills" =>
                    $_SESSION['extracted_skills']
                    ?? [],

                "domain_filter" =>
                    $domain_filter,

                "jobs" =>
                    $careerJobs
            ]
        );

    } else {

        $res = [
            "status" => "error",
            "message" =>
                "No career jobs available. Please enter a career URL first."
        ];
    }


    echo json_encode($res);

    exit;
}


/* ============================================================
   SCRAPE CAREER URL
   ============================================================ */

if ($action === 'scrape_url') {

    $url =
        trim($_POST['url'] ?? '');

    if ($url === '') {

        echo json_encode([
            "status" => "error",
            "message" => "Please enter a career URL."
        ]);

        exit;
    }


    if (!filter_var($url, FILTER_VALIDATE_URL)) {

        echo json_encode([
            "status" => "error",
            "message" => "Please enter a valid career URL."
        ]);

        exit;
    }


    $res = callPythonBridge(
        "scrape_url",
        [
            "url" => $url
        ]
    );


    if (
        isset($res['status']) &&
        $res['status'] === 'success'
    ) {

        $jobs =
            findJobsInResponse($res);


        /*
         * Store only actual dynamically discovered jobs.
         */
        storeCareerJobs(
            $jobs,
            $url
        );


        $res['jobs'] =
            $_SESSION['career_jobs'];

        $res['job_count'] =
            count($_SESSION['career_jobs']);

        $res['career_url'] =
            $_SESSION['career_url'];
    }


    echo json_encode($res);

    exit;
}


/* ============================================================
   ROADMAP
   ============================================================ */

if ($action === 'get_roadmap') {

    $missing_skills =
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

        echo json_encode([
            "status" => "error",
            "message" =>
                "No target job role has been selected."
        ]);

        exit;
    }


    $res = callPythonBridge(
        "generate_roadmap",
        [
            "missing_skills" =>
                $missing_skills,

            "target_role" =>
                $targetRole,

            "target_company" =>
                $targetCompany
        ]
    );


    echo json_encode($res);

    exit;
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

        echo json_encode([
            "status" => "error",
            "message" =>
                "No target job role has been selected."
        ]);

        exit;
    }


    $res = callPythonBridge(
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


    echo json_encode($res);

    exit;
}


/* ============================================================
   AI INTERVIEW ASSISTANT
   ============================================================ */

if ($action === 'ask_interview_ai') {

    $prompt =
        trim($_POST['prompt'] ?? '');

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

        echo json_encode([
            "status" => "error",
            "message" =>
                "No target job role has been selected."
        ]);

        exit;
    }


    $res = callPythonBridge(
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


    echo json_encode($res);

    exit;
}


/* ============================================================
   EVALUATE INTERVIEW ANSWER
   ============================================================ */

if ($action === 'evaluate_answer') {

    $question =
        $_POST['question']
        ?? '';

    $user_answer =
        $_POST['user_answer']
        ?? '';

    $targetRole =
        trim(
            $_POST['target_role']
            ?? ($_SESSION['target_role'] ?? '')
        );


    if ($targetRole === '') {

        echo json_encode([
            "status" => "error",
            "message" =>
                "No target job role has been selected."
        ]);

        exit;
    }


    $res = callPythonBridge(
        "evaluate_answer",
        [
            "question" =>
                $question,

            "user_answer" =>
                $user_answer,

            "target_role" =>
                $targetRole
        ]
    );


    echo json_encode($res);

    exit;
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

    $reqSkills =
        normalizeSkills(
            $_POST['required_skills']
            ?? ($_SESSION['required_skills'] ?? [])
        );


    /*
     * No company_roles.json.
     *
     * No hardcoded skill fallback.
     */
    if ($targetRole === '') {

        echo json_encode([
            "status" => "error",
            "message" =>
                "No target job role is available."
        ]);

        exit;
    }


    if (empty($reqSkills)) {

        echo json_encode([
            "status" => "error",
            "message" =>
                "No job requirements are available for the report."
        ]);

        exit;
    }


    $metrics = callPythonBridge(
        "calculate_metrics",
        [
            "extracted_skills" =>
                $_SESSION['extracted_skills'] ?? [],

            "required_skills" =>
                $reqSkills,

            "ats_score" =>
                $_SESSION['ats_score'] ?? null,

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


    $roadmapRes = callPythonBridge(
        "generate_roadmap",
        [
            "missing_skills" =>
                $metrics['missing_skills'] ?? [],

            "target_role" =>
                $targetRole,

            "target_company" =>
                $targetCompany
        ]
    );


    $pdfRes = callPythonBridge(
        "generate_pdf",
        [
            "student_name" =>
                $current_user['name'],

            "target_role" =>
                $targetRole,

            "target_company" =>
                $targetCompany,

            "domain" =>
                $metrics['detected_domain']
                ?? '',

            "ats_score" =>
                $_SESSION['ats_score'] ?? null,

            "readiness_score" =>
                $metrics['readiness_pct'] ?? 0,

            "confidence_score" =>
                $metrics['confidence_pct'] ?? 0,

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
                !empty($metrics['missing_skills'])
                    ? [
                        "Prioritize mastering " .
                        $metrics['missing_skills'][0] .
                        " and build a portfolio project.",

                        "Tailor the resume to the selected job requirements.",

                        "Include quantifiable metrics in project bullet points."
                    ]
                    : [
                        "Maintain current proficiency.",

                        "Tailor the resume to the selected job requirements.",

                        "Include quantifiable metrics in project bullet points."
                    ],

            "roadmap_phases" =>
                $roadmapRes['roadmap']['phases']
                ?? []
        ]
    );


    if (!empty($pdfRes['pdf_b64'])) {

        $pdfData =
            base64_decode($pdfRes['pdf_b64']);

        header('Content-Type: application/pdf');

        header(
            'Content-Disposition: attachment; filename="Progress_Report_' .
            str_replace(
                ' ',
                '_',
                $current_user['name']
            ) .
            '.pdf"'
        );

        header(
            'Content-Length: ' .
            strlen($pdfData)
        );

        echo $pdfData;

    } else {

        echo json_encode([
            "status" => "error",
            "message" =>
                "PDF Generation failed."
        ]);
    }

    exit;
}


/* ============================================================
   INVALID ACTION
   ============================================================ */

echo json_encode([
    "status" => "error",
    "message" => "Invalid API action: " . $action
]);
