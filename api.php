<?php
/**
 * API Handler for Skill-Gap Predictor (Career Navigation AI)
 * Project ID: P19 | IEEE CS Bangalore Chapter | GITAM University
 */

session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

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

    $process = proc_open("$pythonCmd \"$bridgePath\" $action", $descriptorspec, $pipes);
    if (!is_resource($process) && $isWin) {
        $pythonCmd = "python3";
        $process = proc_open("$pythonCmd \"$bridgePath\" $action", $descriptorspec, $pipes);
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
        return ["status" => "error", "message" => "Bridge output error: " . ($stderr ?: $output)];
    }
    return ["status" => "error", "message" => "Could not launch Python bridge process."];
}

$action = $_GET['action'] ?? ($_POST['action'] ?? '');

if (empty($action)) {
    echo json_encode(["status" => "error", "message" => "Action parameter required."]);
    exit;
}

// -------------------------------------------------------------
// AUTH ACTIONS
// -------------------------------------------------------------
if ($action === 'login') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    
    $authRes = authenticateUser($email, $password);
    if ($authRes['success']) {
        $_SESSION['user'] = $authRes['user'];
        
        // Initialize default session metrics if not set
        if (!isset($_SESSION['extracted_skills'])) {
            $_SESSION['extracted_skills'] = ["Python", "SQL", "Data Structures", "Algorithms", "Git", "Pandas"];
        }
        if (!isset($_SESSION['ats_score'])) {
            $_SESSION['ats_score'] = 72.0;
        }
        if (!isset($_SESSION['parsed_resume'])) {
            $_SESSION['parsed_resume'] = [
                "word_count" => 480,
                "contact_info" => [
                    "name" => $authRes['user']['name'],
                    "email" => $authRes['user']['email'],
                    "phone" => "+91 9876543210",
                    "linkedin" => !empty($authRes['user']['linkedin']) ? $authRes['user']['linkedin'] : "linkedin.com/in/" . strtolower(str_replace(' ', '', $authRes['user']['name'])),
                    "github" => !empty($authRes['user']['github']) ? $authRes['user']['github'] : "github.com/" . strtolower(str_replace(' ', '', $authRes['user']['name']))
                ],
                "section_presence" => [
                    "Education" => true,
                    "Technical Skills" => true,
                    "Projects" => true,
                    "Experience / Internships" => true,
                    "Certifications" => true
                ],
                "raw_text" => "Experienced in Python, SQL, Data Structures and Algorithms. Built web and data projects."
            ];
        }

        // Load latest scan history if available
        $history = getResumeHistoryForStudent($authRes['user']['id']);
        if (!empty($history)) {
            $latest = $history[0];
            $_SESSION['ats_score'] = $latest['ats_score'];
            if (!empty($latest['matched_skills'])) {
                $_SESSION['extracted_skills'] = array_values(array_unique(array_merge($latest['matched_skills'], array_slice($latest['missing_skills'], 0, 2))));
            }
        }

        echo json_encode(["status" => "success", "message" => "Login successful", "user" => $authRes['user']]);
    } else {
        echo json_encode(["status" => "error", "message" => $authRes['message']]);
    }
    exit;
}

if ($action === 'signup') {
    $name = $_POST['name'] ?? '';
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    $university = $_POST['university'] ?? 'GITAM University, Bengaluru';
    $branch = $_POST['branch'] ?? 'Computer Science & Engineering';
    $year = $_POST['graduation_year'] ?? 2026;
    $linkedin = $_POST['linkedin'] ?? '';
    $github = $_POST['github'] ?? '';

    $regRes = registerUser($name, $email, $password, $university, $branch, $year, "Google", "Software Development Engineer (SDE)", $linkedin, $github);
    if ($regRes['success']) {
        echo json_encode(["status" => "success", "message" => $regRes['message']]);
    } else {
        echo json_encode(["status" => "error", "message" => $regRes['message']]);
    }
    exit;
}

if ($action === 'logout') {
    session_destroy();
    echo json_encode(["status" => "success", "message" => "Logged out successfully"]);
    exit;
}

// Ensure logged-in user for remaining actions
if (!isset($_SESSION['user'])) {
    echo json_encode(["status" => "error", "message" => "Unauthorized access. Please log in."]);
    exit;
}

$current_user = $_SESSION['user'];

// -------------------------------------------------------------
// PROFILE & APP STATE ACTIONS
// -------------------------------------------------------------
if ($action === 'update_profile') {
    $name = $_POST['name'] ?? $current_user['name'];
    $university = $_POST['university'] ?? $current_user['university'];
    $branch = $_POST['branch'] ?? $current_user['branch'];
    $year = (int)($_POST['graduation_year'] ?? $current_user['graduation_year']);
    $company = $_POST['target_company'] ?? ($current_user['target_company'] ?? 'Google');
    $role = $_POST['target_role'] ?? ($current_user['target_role'] ?? 'Software Engineer');
    $linkedin = $_POST['linkedin'] ?? ($current_user['linkedin'] ?? '');
    $github = $_POST['github'] ?? ($current_user['github'] ?? '');

    $ok = updateStudentProfile($current_user['id'], $name, $university, $branch, $year, $role, $company, $linkedin, $github);
    if ($ok) {
        $_SESSION['user']['name'] = $name;
        $_SESSION['user']['university'] = $university;
        $_SESSION['user']['branch'] = $branch;
        $_SESSION['user']['graduation_year'] = $year;
        $_SESSION['user']['target_company'] = $company;
        $_SESSION['user']['target_role'] = $role;
        $_SESSION['user']['linkedin'] = $linkedin;
        $_SESSION['user']['github'] = $github;

        if (isset($_SESSION['parsed_resume']['contact_info'])) {
            if (!empty($linkedin)) { $_SESSION['parsed_resume']['contact_info']['linkedin'] = $linkedin; }
            if (!empty($github)) { $_SESSION['parsed_resume']['contact_info']['github'] = $github; }
        }

        echo json_encode(["status" => "success", "message" => "Profile updated successfully!"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to update profile."]);
    }
    exit;
}

if ($action === 'update_skills') {
    $skills = $_POST['skills'] ?? [];
    if (is_string($skills)) {
        $skills = json_decode($skills, true) ?: [];
    }
    $_SESSION['extracted_skills'] = array_values(array_unique($skills));
    echo json_encode(["status" => "success", "skills" => $_SESSION['extracted_skills']]);
    exit;
}

if ($action === 'upload_resume') {
    if (!isset($_FILES['resume_file']) || $_FILES['resume_file']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(["status" => "error", "message" => "Please select a valid resume file (PDF or DOCX)."]);
        exit;
    }

    $file = $_FILES['resume_file'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ['pdf', 'docx', 'txt'])) {
        echo json_encode(["status" => "error", "message" => "Unsupported file type. Please upload a PDF or DOCX file."]);
        exit;
    }

    $uploadDir = __DIR__ . '/scratch/uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    $targetPath = $uploadDir . uniqid('res_') . '_' . basename($file['name']);
    move_uploaded_file($file['tmp_name'], $targetPath);

    $parseRes = callPythonBridge("parse_resume", ["file_path" => $targetPath, "file_name" => $file['name']]);
    
    if ($parseRes['status'] === 'success') {
        $_SESSION['parsed_resume'] = $parseRes['parsed_resume'];
        $_SESSION['extracted_skills'] = $parseRes['extracted_skills'];
        $_SESSION['ats_score'] = $parseRes['ats_score'];

        $contact = $_SESSION['parsed_resume']['contact_info'] ?? [];
        $extractedLi = $contact['linkedin'] ?? '';
        $extractedGh = $contact['github'] ?? '';

        $invalidWords = ['summary', 'mailto', 'experience', 'education', 'skills', 'projects', 'certifications', 'about', 'contact', 'home'];
        
        $isLiValid = !empty($extractedLi) && $extractedLi !== 'N/A';
        if ($isLiValid) {
            foreach ($invalidWords as $bad) {
                if (strpos(strtolower($extractedLi), $bad) !== false) {
                    $isLiValid = false;
                    break;
                }
            }
        }

        $isGhValid = !empty($extractedGh) && $extractedGh !== 'N/A';
        if ($isGhValid) {
            foreach ($invalidWords as $bad) {
                if (strpos(strtolower($extractedGh), $bad) !== false) {
                    $isGhValid = false;
                    break;
                }
            }
        }

        if ($isLiValid) {
            $_SESSION['user']['linkedin'] = $extractedLi;
        } else {
            $_SESSION['parsed_resume']['contact_info']['linkedin'] = $current_user['linkedin'] ?? '';
        }

        if ($isGhValid) {
            $_SESSION['user']['github'] = $extractedGh;
        } else {
            $_SESSION['parsed_resume']['contact_info']['github'] = $current_user['github'] ?? '';
        }

        updateStudentProfile(
            $current_user['id'],
            $current_user['name'],
            $current_user['university'],
            $current_user['branch'],
            $current_user['graduation_year'],
            $current_user['target_role'] ?? 'Software Engineer',
            $current_user['target_company'] ?? 'Google',
            $_SESSION['user']['linkedin'] ?? '',
            $_SESSION['user']['github'] ?? ''
        );

        // Get readiness metrics for database record
        $reqSkills = $_POST['required_skills'] ?? ["Python", "SQL", "Data Structures", "Algorithms", "Git"];
        if (is_string($reqSkills)) { $reqSkills = json_decode($reqSkills, true) ?: []; }
        
        $metrics = callPythonBridge("calculate_metrics", [
            "extracted_skills" => $_SESSION['extracted_skills'],
            "required_skills" => $reqSkills,
            "ats_score" => $_SESSION['ats_score'],
            "target_company" => $_POST['target_company'] ?? "Google",
            "target_role" => $_POST['target_role'] ?? "Software Engineer",
            "section_presence" => $_SESSION['parsed_resume']['section_presence'] ?? []
        ]);

        saveResumeEvaluation(
            $current_user['id'],
            $file['name'],
            $parseRes['detected_domain'],
            $_SESSION['ats_score'],
            $metrics['readiness_pct'] ?? 70,
            $metrics['confidence_pct'] ?? 80,
            $metrics['matched_skills'] ?? [],
            $metrics['missing_skills'] ?? [],
            ["Enhance project bullet points with quantifiable metrics."]
        );

        @unlink($targetPath);
        echo json_encode(["status" => "success", "data" => $parseRes, "metrics" => $metrics]);
    } else {
        @unlink($targetPath);
        echo json_encode($parseRes);
    }
    exit;
}

if ($action === 'load_sample') {
    $sampleRes = callPythonBridge("parse_sample", [
        "name" => $current_user['name'],
        "email" => $current_user['email'],
        "branch" => $current_user['branch'] ?? 'Computer Science & Engineering',
        "year" => $current_user['graduation_year'] ?? 2026
    ]);

    if ($sampleRes['status'] === 'success') {
        $_SESSION['parsed_resume'] = $sampleRes['parsed_resume'];
        $_SESSION['extracted_skills'] = $sampleRes['extracted_skills'];
        $_SESSION['ats_score'] = $sampleRes['ats_score'];

        if (!empty($current_user['linkedin'])) {
            $_SESSION['parsed_resume']['contact_info']['linkedin'] = $current_user['linkedin'];
        }
        if (!empty($current_user['github'])) {
            $_SESSION['parsed_resume']['contact_info']['github'] = $current_user['github'];
        }

        echo json_encode(["status" => "success", "data" => $sampleRes]);
    } else {
        echo json_encode($sampleRes);
    }
    exit;
}

if ($action === 'get_metrics') {
    $comp = $_POST['target_company'] ?? ($_SESSION['user']['target_company'] ?? "Google");
    $role = $_POST['target_role'] ?? ($_SESSION['user']['target_role'] ?? "Software Development Engineer (SDE)");

    $reqSkills = $_POST['required_skills'] ?? [];
    if (is_string($reqSkills)) { 
        $reqSkills = json_decode($reqSkills, true) ?: []; 
    }

    if (empty($reqSkills)) {
        $jsonPath = __DIR__ . '/data/company_roles.json';
        $benchmarkData = json_decode(file_get_contents($jsonPath), true)['companies'] ?? [];
        if (isset($benchmarkData[$comp]['roles'][$role]['required_skills'])) {
            $reqSkills = $benchmarkData[$comp]['roles'][$role]['required_skills'];
        } else {
            $reqSkills = ["Python", "SQL", "Data Structures", "Algorithms", "Git"];
        }
    }

    $metrics = callPythonBridge("calculate_metrics", [
        "extracted_skills" => $_SESSION['extracted_skills'] ?? ["Python", "SQL", "Data Structures", "Algorithms", "Git"],
        "required_skills" => $reqSkills,
        "ats_score" => $_SESSION['ats_score'] ?? 72.0,
        "target_company" => $comp,
        "target_role" => $role,
        "section_presence" => $_SESSION['parsed_resume']['section_presence'] ?? []
    ]);

    if (!is_array($metrics)) {
        $metrics = [];
    }
    if (!isset($metrics['readiness_pct'])) {
        $metrics['readiness_pct'] = 65.0;
    }
    if (!isset($metrics['confidence_pct'])) {
        $metrics['confidence_pct'] = 80.0;
    }
    if (!isset($metrics['matched_skills'])) {
        $metrics['matched_skills'] = $_SESSION['extracted_skills'] ?? [];
    }
    if (!isset($metrics['missing_skills'])) {
        $metrics['missing_skills'] = [];
    }
    if (!isset($metrics['strength_label'])) {
        $metrics['strength_label'] = 'Strong';
    }
    if (!isset($metrics['strength_color'])) {
        $metrics['strength_color'] = '#34d399';
    }

    $metrics['ats_score'] = $_SESSION['ats_score'] ?? 0;

    echo json_encode($metrics);
    exit;
}

if ($action === 'rank_jobs') {
    $domain_filter = $_POST['domain_filter'] ?? 'All Domains';
    $res = callPythonBridge("rank_jobs", [
        "extracted_skills" => $_SESSION['extracted_skills'] ?? [],
        "domain_filter" => $domain_filter
    ]);
    echo json_encode($res);
    exit;
}

if ($action === 'scrape_url') {
    $url = $_POST['url'] ?? '';
    $res = callPythonBridge("scrape_url", ["url" => $url]);
    echo json_encode($res);
    exit;
}

if ($action === 'get_roadmap') {
    $missing_skills = $_POST['missing_skills'] ?? [];
    if (is_string($missing_skills)) { $missing_skills = json_decode($missing_skills, true) ?: []; }
    
    $res = callPythonBridge("generate_roadmap", [
        "missing_skills" => $missing_skills,
        "target_role" => $_POST['target_role'] ?? 'Software Engineer',
        "target_company" => $_POST['target_company'] ?? 'Google'
    ]);
    echo json_encode($res);
    exit;
}

if ($action === 'get_interview') {
    $matched = $_POST['matched_skills'] ?? [];
    $missing = $_POST['missing_skills'] ?? [];
    if (is_string($matched)) { $matched = json_decode($matched, true) ?: []; }
    if (is_string($missing)) { $missing = json_decode($missing, true) ?: []; }

    $res = callPythonBridge("generate_interview", [
        "target_role" => $_POST['target_role'] ?? 'Software Engineer',
        "matched_skills" => $matched,
        "missing_skills" => $missing
    ]);
    echo json_encode($res);
    exit;
}

if ($action === 'ask_interview_ai') {
    $prompt = $_POST['prompt'] ?? '';
    $res = callPythonBridge("ask_interview_ai", [
        "prompt" => $prompt,
        "target_role" => $_POST['target_role'] ?? ($_SESSION['user']['target_role'] ?? 'Software Engineer'),
        "target_company" => $_POST['target_company'] ?? ($_SESSION['user']['target_company'] ?? 'Google')
    ]);
    echo json_encode($res);
    exit;
}

if ($action === 'evaluate_answer') {
    $question = $_POST['question'] ?? '';
    $user_answer = $_POST['user_answer'] ?? '';
    $res = callPythonBridge("evaluate_answer", [
        "question" => $question,
        "user_answer" => $user_answer,
        "target_role" => $_POST['target_role'] ?? ($_SESSION['user']['target_role'] ?? 'Software Engineer')
    ]);
    echo json_encode($res);
    exit;
}

if ($action === 'download_pdf') {
    $targetCompany = $_POST['target_company'] ?? ($_SESSION['user']['target_company'] ?? 'Google');
    $targetRole = $_POST['target_role'] ?? ($_SESSION['user']['target_role'] ?? 'Software Engineer');

    // Get required skills for the currently selected company and role
    $reqSkills = $_POST['required_skills'] ?? [];

    if (is_string($reqSkills)) {
        $reqSkills = json_decode($reqSkills, true) ?: [];
    }

    // If required skills were not sent from the frontend,
    // load them from company_roles.json using the selected company and role.
    if (empty($reqSkills)) {
        $jsonPath = __DIR__ . '/data/company_roles.json';

        if (file_exists($jsonPath)) {
            $benchmarkData = json_decode(file_get_contents($jsonPath), true)['companies'] ?? [];

            if (isset($benchmarkData[$targetCompany]['roles'][$targetRole]['required_skills'])) {
                $reqSkills = $benchmarkData[$targetCompany]['roles'][$targetRole]['required_skills'];
            }
        }
    }

    // Final fallback
    if (empty($reqSkills)) {
        $reqSkills = [
            "Python",
            "SQL",
            "Data Structures",
            "Algorithms",
            "Git"
        ];
    }

    // Calculate the latest metrics using the student's actual resume skills
    // and the selected company/role benchmark.
    $metrics = callPythonBridge("calculate_metrics", [
        "extracted_skills" => $_SESSION['extracted_skills'] ?? [],
        "required_skills" => $reqSkills,
        "ats_score" => $_SESSION['ats_score'] ?? 72.0,
        "target_company" => $targetCompany,
        "target_role" => $targetRole,
        "section_presence" => $_SESSION['parsed_resume']['section_presence'] ?? []
    ]);

    if (!is_array($metrics)) {
        $metrics = [];
    }

    // Generate roadmap using the actual missing skills.
    $roadmapRes = callPythonBridge("generate_roadmap", [
        "missing_skills" => $metrics['missing_skills'] ?? [],
        "target_role" => $targetRole,
        "target_company" => $targetCompany
    ]);

    // Generate the final PDF report.
    $pdfRes = callPythonBridge("generate_pdf", [
        "student_name" => $current_user['name'],
        "target_role" => $targetRole,
        "target_company" => $targetCompany,
        "domain" => $metrics['detected_domain'] ?? 'Software Engineering',

        "ats_score" => $_SESSION['ats_score'] ?? 72.0,
        "readiness_score" => $metrics['readiness_pct'] ?? 70.0,
        "confidence_score" => $metrics['confidence_pct'] ?? 80.0,
        "resume_strength" => $metrics['strength_label'] ?? 'Strong',

        "matched_skills" => $metrics['matched_skills'] ?? [],
        "missing_skills" => $metrics['missing_skills'] ?? [],

        "recommendations" => [
            !empty($metrics['missing_skills'])
                ? "Prioritize mastering " . $metrics['missing_skills'][0] . " and build a portfolio project."
                : "Maintain current proficiency.",

            "Tailor resume summary to " . $targetCompany . "'s core values.",

            "Include quantifiable metrics in project bullet points."
        ],

        "roadmap_phases" => $roadmapRes['roadmap']['phases'] ?? []
    ]);

    if (!empty($pdfRes['pdf_b64'])) {
        $pdfData = base64_decode($pdfRes['pdf_b64']);

        header('Content-Type: application/pdf');
        header(
            'Content-Disposition: attachment; filename="Progress_Report_' .
            str_replace(' ', '_', $current_user['name']) .
            '.pdf"'
        );
        header('Content-Length: ' . strlen($pdfData));

        echo $pdfData;
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "PDF Generation failed."
        ]);
    }

    exit;
}

echo json_encode(["status" => "error", "message" => "Invalid API action: " . $action]);
