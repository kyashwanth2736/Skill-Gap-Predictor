<?php
/**
 * Skill-Gap Predictor
 * Career Navigation AI
 * Main Application Entry Point
 */

session_start();

require_once __DIR__ . '/db.php';

$user = $_SESSION['user'] ?? null;

/*
|--------------------------------------------------------------------------
| Safe helpers
|--------------------------------------------------------------------------
*/

function h($value)
{
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

function formatSocialUrl($url)
{
    if (empty($url) || $url === 'N/A') {
        return null;
    }

    $url = trim($url);

    if (
        stripos($url, 'summary') !== false ||
        stripos($url, 'experience') !== false ||
        stripos($url, 'education') !== false ||
        stripos($url, 'skills') !== false ||
        stripos($url, 'projects') !== false ||
        stripos($url, 'certifications') !== false
    ) {
        return null;
    }

    if (preg_match('/^https?:\/\//i', $url)) {
        return $url;
    }

    return 'https://' . ltrim($url, '/');
}

/*
|--------------------------------------------------------------------------
| Dynamic session data
|--------------------------------------------------------------------------
*/

$careerUrl = $_SESSION['career_url'] ?? '';

$targetCompany = $_SESSION['target_company'] ?? '';
$targetRole = $_SESSION['target_role'] ?? '';

$requiredSkills = $_SESSION['required_skills'] ?? [];
$extractedSkills = $_SESSION['extracted_skills'] ?? [];

$atsScore = $_SESSION['ats_score'] ?? 0;

$recommendedJob = $_SESSION['recommended_job'] ?? null;

$careerJobs = $_SESSION['career_jobs'] ?? [];

if (!is_array($requiredSkills)) {
    $requiredSkills = [];
}

if (!is_array($extractedSkills)) {
    $extractedSkills = [];
}

if (!is_array($careerJobs)) {
    $careerJobs = [];
}

/*
|--------------------------------------------------------------------------
| Canonical skills
|
| These are only used for optional UI skill editing.
| They are NOT companies or job roles.
|--------------------------------------------------------------------------
*/

$canonicalSkills = [
    "Python",
    "Java",
    "C++",
    "C#",
    "SQL",
    "JavaScript",
    "TypeScript",
    "HTML/CSS",
    "React",
    "Node.js",
    "Django",
    "Flask",
    "Pandas",
    "NumPy",
    "Scikit-Learn",
    "TensorFlow",
    "PyTorch",
    "Data Structures",
    "Algorithms",
    "System Design",
    "Git",
    "Docker",
    "Kubernetes",
    "AWS",
    "Google Cloud Platform",
    "Azure",
    "Linux",
    "REST APIs",
    "Computer Networks",
    "Cyber Security",
    "Networking",
    "MySQL",
    "PostgreSQL",
    "MongoDB"
];

/*
|--------------------------------------------------------------------------
| Parsed resume information
|--------------------------------------------------------------------------
*/

$parsedResume = $_SESSION['parsed_resume'] ?? [];

if (!is_array($parsedResume)) {
    $parsedResume = [];
}

$contactInfo = $parsedResume['contact_info'] ?? [];

if (!is_array($contactInfo)) {
    $contactInfo = [];
}

$detectedName = $contactInfo['name'] ?? ($user['name'] ?? '');
$detectedEmail = $contactInfo['email'] ?? ($user['email'] ?? '');
$detectedPhone = $contactInfo['phone'] ?? '';

$detectedLinkedin = $contactInfo['linkedin']
    ?? ($user['linkedin'] ?? '');

$detectedGithub = $contactInfo['github']
    ?? ($user['github'] ?? '');

$linkedinUrl = formatSocialUrl($detectedLinkedin);
$githubUrl = formatSocialUrl($detectedGithub);

/*
|--------------------------------------------------------------------------
| Resume history
|--------------------------------------------------------------------------
*/

$resumeHistory = [];

if ($user && !empty($user['id'])) {
    try {
        $resumeHistory = getResumeHistoryForStudent($user['id']);

        if (!is_array($resumeHistory)) {
            $resumeHistory = [];
        }
    } catch (Throwable $e) {
        $resumeHistory = [];
    }
}

/*
|--------------------------------------------------------------------------
| JSON-safe application data
|--------------------------------------------------------------------------
*/

$appData = [
    'loggedIn' => (bool)$user,
    'user' => $user,
    'careerUrl' => $careerUrl,
    'targetCompany' => $targetCompany,
    'targetRole' => $targetRole,
    'requiredSkills' => $requiredSkills,
    'extractedSkills' => $extractedSkills,
    'atsScore' => $atsScore,
    'recommendedJob' => $recommendedJob,
    'careerJobs' => $careerJobs
];

?>
<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <meta
        name="description"
        content="Skill-Gap Predictor - Dynamic Career Navigation AI"
    >

    <title>
        Skill-Gap Predictor | Career Navigation AI
    </title>

    <link
        rel="stylesheet"
        href="static/styles.css"
    >

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <script>
        window.APP_DATA =
            <?php echo json_encode(
                $appData,
                JSON_UNESCAPED_SLASHES |
                JSON_UNESCAPED_UNICODE
            ); ?>;

        window.CANONICAL_SKILLS =
            <?php echo json_encode(
                $canonicalSkills,
                JSON_UNESCAPED_SLASHES |
                JSON_UNESCAPED_UNICODE
            ); ?>;
    </script>

</head>

<body>

<!-- ============================================================= -->
<!-- PAGE LOADER -->
<!-- ============================================================= -->

<div
    id="page-loader"
    aria-hidden="true"
>

    <div class="loader-ring"></div>

    <div class="loader-text">
        Loading Skill-Gap Predictor...
    </div>

</div>


<?php if (!$user): ?>

<!-- ============================================================= -->
<!-- AUTHENTICATION SCREEN -->
<!-- ============================================================= -->

<section
    id="auth-screen"
    class="auth-screen auth-wrapper"
>

    <div class="auth-card">

        <!-- Header -->

        <div
            class="main-header-banner"
            style="text-align:center;padding:24px;"
        >

            <span class="student-badge">
                🎓 Student Career Intelligence Portal
            </span>

            <h1
                class="header-title"
                style="font-size:24px;"
            >
                Skill-Gap Predictor
            </h1>

            <p
                class="header-subtitle"
                style="font-size:13px;"
            >
                Career Navigation AI for Students
            </p>

        </div>


        <!-- ===================================================== -->
        <!-- AUTH TABS -->
        <!-- ===================================================== -->

        <div class="auth-tabs">

            <div
                class="auth-tab active"
                id="tab-btn-login"
                data-auth-tab="login"
                role="button"
                tabindex="0"
            >
                🔐 Student Login
            </div>

            <div
                class="auth-tab"
                id="tab-btn-signup"
                data-auth-tab="signup"
                role="button"
                tabindex="0"
            >
                📝 Create Account
            </div>

        </div>


        <!-- ===================================================== -->
        <!-- LOGIN -->
        <!-- ===================================================== -->

        <div
            id="form-login-box"
            data-auth-panel="login"
        >

            <div
                id="login-error-msg"
                class="alert alert-error"
                style="display:none;"
            ></div>

            <div
                id="login-success-msg"
                class="alert alert-success"
                style="display:none;"
            ></div>


            <div class="form-group">

                <label class="form-label">
                    University / Student Email
                </label>

                <input
                    type="email"
                    id="login_email"
                    name="email"
                    class="form-control"
                    placeholder="Enter your email address"
                    autocomplete="email"
                >

            </div>


            <div class="form-group">

                <label class="form-label">
                    Password
                </label>

                <div
                    style="
                        position:relative;
                        display:flex;
                        align-items:center;
                    "
                >

                    <input
                        type="password"
                        id="login_password"
                        name="password"
                        class="form-control"
                        placeholder="Enter your password"
                        autocomplete="current-password"
                        style="padding-right:48px;"
                    >

                    <button
                        type="button"
                        id="toggle-login-password"
                        aria-label="Show password"
                        style="
                            position:absolute;
                            right:10px;
                            border:none;
                            background:none;
                            cursor:pointer;
                            font-size:18px;
                        "
                    >
                        👁️
                    </button>

                </div>

            </div>


            <button
                type="button"
                id="btn-do-login"
                class="btn btn-block"
            >
                🚀 Log In to My Dashboard
            </button>


            <p
                style="
                    font-size:12px;
                    color:var(--text-subtle);
                    margin-top:14px;
                    text-align:center;
                "
            >
                New student?
                <a
                    href="#"
                    id="create-account-link"
                    class="create-account-link"
                >
                    Create an account
                </a>
            </p>

        </div>


        <!-- ===================================================== -->
        <!-- CREATE ACCOUNT -->
        <!-- ===================================================== -->

        <div
            id="form-signup-box"
            data-auth-panel="signup"
            style="display:none;"
        >

            <div
                id="signup-error-msg"
                class="alert alert-error"
                style="display:none;"
            ></div>

            <div
                id="signup-success-msg"
                class="alert alert-success"
                style="display:none;"
            ></div>


            <div class="form-group">

                <label class="form-label">
                    Full Name *
                </label>

                <input
                    type="text"
                    id="signup_name"
                    name="name"
                    class="form-control"
                    placeholder="Enter your full name"
                    autocomplete="name"
                >

            </div>


            <div class="form-group">

                <label class="form-label">
                    Email Address *
                </label>

                <input
                    type="email"
                    id="signup_email"
                    name="email"
                    class="form-control"
                    placeholder="Enter your email address"
                    autocomplete="email"
                >

            </div>


            <div class="form-group">

                <label class="form-label">
                    Create Password *
                </label>

                <div
                    style="
                        position:relative;
                        display:flex;
                        align-items:center;
                    "
                >

                    <input
                        type="password"
                        id="signup_pwd"
                        name="password"
                        class="form-control"
                        placeholder="Create a password"
                        autocomplete="new-password"
                        style="padding-right:48px;"
                    >

                    <button
                        type="button"
                        id="toggle-signup-password"
                        aria-label="Show password"
                        style="
                            position:absolute;
                            right:10px;
                            border:none;
                            background:none;
                            cursor:pointer;
                            font-size:18px;
                        "
                    >
                        👁️
                    </button>

                </div>

                <small
                    style="
                        display:block;
                        margin-top:6px;
                        color:var(--text-muted);
                    "
                >
                    Use at least 4 characters.
                </small>

            </div>


            <div class="form-group">

                <label class="form-label">
                    University / College
                </label>

                <input
                    type="text"
                    id="signup_uni"
                    name="university"
                    class="form-control"
                    placeholder="Enter your university or college"
                >

            </div>


            <div class="form-group">

                <label class="form-label">
                    Branch / Degree
                </label>

                <input
                    type="text"
                    id="signup_branch"
                    name="branch"
                    class="form-control"
                    placeholder="e.g. Computer Science & Engineering"
                >

            </div>


            <div class="form-group">

                <label class="form-label">
                    Specialization / Major
                </label>

                <input
                    type="text"
                    id="signup_major"
                    name="major"
                    class="form-control"
                    placeholder="e.g. Cyber Security"
                >

            </div>


            <div class="form-group">

                <label class="form-label">
                    Graduation Year
                </label>

                <select
                    id="signup_gradyear"
                    name="graduation_year"
                    class="form-control"
                >

                    <option value="">
                        Select graduation year
                    </option>

                    <?php for ($year = date('Y') - 2; $year <= date('Y') + 7; $year++): ?>

                        <option value="<?php echo $year; ?>">
                            <?php echo $year; ?>
                        </option>

                    <?php endfor; ?>

                </select>

            </div>


            <div class="form-group">

                <label class="form-label">
                    LinkedIn Profile
                </label>

                <input
                    type="text"
                    id="signup_linkedin"
                    name="linkedin"
                    class="form-control"
                    placeholder="https://linkedin.com/in/your-profile"
                >

            </div>


            <div class="form-group">

                <label class="form-label">
                    GitHub Profile
                </label>

                <input
                    type="text"
                    id="signup_github"
                    name="github"
                    class="form-control"
                    placeholder="https://github.com/your-profile"
                >

            </div>


            <div
                class="form-group"
                style="margin-top:12px;"
            >

                <label
                    style="
                        display:flex;
                        gap:8px;
                        align-items:flex-start;
                        font-size:13px;
                        cursor:pointer;
                    "
                >

                    <input
                        type="checkbox"
                        id="signup-terms"
                    >

                    <span>
                        I confirm that the information provided is
                        accurate and I agree to use this portal for
                        career preparation.
                    </span>

                </label>

            </div>


            <button
                type="button"
                id="btn-do-signup"
                class="btn btn-block"
            >
                ✨ Create My Account
            </button>


            <p
                style="
                    font-size:12px;
                    color:var(--text-subtle);
                    margin-top:14px;
                    text-align:center;
                "
            >

                Already have an account?

                <a
                    href="#"
                    id="back-to-login"
                    class="back-to-login"
                >
                    Login here
                </a>

            </p>

        </div>

    </div>

</section>


<?php else: ?>

<!-- ============================================================= -->
<!-- LOGGED-IN APPLICATION -->
<!-- ============================================================= -->

<div
    id="dashboard-app"
    class="dashboard-app"
>


    <!-- ========================================================= -->
    <!-- MOBILE SIDEBAR OVERLAY -->
    <!-- ========================================================= -->

    <div
        id="sidebar-overlay"
        class="sidebar-overlay"
        style="display:none;"
    ></div>


    <!-- ========================================================= -->
    <!-- SIDEBAR -->
    <!-- ========================================================= -->

    <aside
        id="app-sidebar"
        class="sidebar"
    >

        <div
            style="
                display:flex;
                justify-content:flex-end;
                margin-bottom:10px;
            "
        >

            <button
                type="button"
                id="sidebar-close"
                class="btn btn-secondary"
                style="
                    padding:5px 10px;
                    font-size:12px;
                "
            >
                ✕
            </button>

        </div>


        <!-- USER CARD -->

        <div class="sidebar-user-card">

            <div
                style="
                    font-size:28px;
                    margin-bottom:6px;
                "
            >
                👤
            </div>

            <div
                style="
                    font-weight:800;
                    color:#ffffff;
                    font-size:16px;
                "
            >
                <?php echo h($user['name'] ?? 'Student'); ?>
            </div>

            <div
                style="
                    font-size:12px;
                    color:var(--text-muted);
                    margin-top:3px;
                "
            >
                <?php echo h($user['email'] ?? ''); ?>
            </div>

            <div
                style="
                    font-size:11px;
                    color:var(--cyan-light);
                    font-weight:600;
                    margin-top:5px;
                "
            >
                <?php echo h($user['branch'] ?? 'Student'); ?>
            </div>

        </div>


        <!-- ===================================================== -->
        <!-- CAREER TARGET -->
        <!-- ===================================================== -->

        <div
            style="
                margin-top:22px;
                margin-bottom:22px;
            "
        >

            <label
                class="form-label"
                style="color:var(--cyan-light);"
            >
                🎯 Career Target
            </label>


            <p
                style="
                    font-size:12px;
                    color:var(--text-muted);
                    line-height:1.5;
                    margin-bottom:10px;
                "
            >
                Enter a career/jobs URL after logging in.
                The application will analyze jobs from that
                source dynamically.
            </p>


            <div
                id="sidebar-target-summary"
                style="
                    padding:10px;
                    border-radius:8px;
                    background:rgba(15,23,42,.65);
                    font-size:12px;
                "
            >

                <?php if ($targetCompany || $targetRole): ?>

                    <strong>
                        <?php echo h($targetCompany); ?>
                    </strong>

                    <?php if ($targetRole): ?>

                        <br>

                        <span>
                            <?php echo h($targetRole); ?>
                        </span>

                    <?php endif; ?>

                <?php else: ?>

                    <span style="color:var(--text-muted);">
                        No career target selected yet.
                    </span>

                <?php endif; ?>

            </div>

        </div>


        <!-- ===================================================== -->
        <!-- NAVIGATION -->
        <!-- ===================================================== -->

        <nav class="nav-menu">

            <a
                href="#"
                class="nav-item active"
                data-view="view-analytics"
            >
                📊 Dashboard
            </a>

            <a
                href="#"
                class="nav-item"
                data-view="view-resume"
            >
                📄 Resume Parser & ATS
            </a>

            <a
                href="#"
                class="nav-item"
                data-view="view-skillgap"
            >
                🎯 Skill-Gap Predictor
            </a>

            <a
                href="#"
                class="nav-item"
                data-view="view-jobranking"
            >
                💼 Dynamic Job Ranking
            </a>

            <a
                href="#"
                class="nav-item"
                data-view="view-roadmap"
            >
                🗺️ Career Roadmap
            </a>

            <a
                href="#"
                class="nav-item"
                data-view="view-interview"
            >
                🎙️ Interview Prep
            </a>

            <a
                href="#"
                class="nav-item"
                data-view="view-report"
            >
                📑 Download Report
            </a>

            <a
                href="#"
                class="nav-item"
                data-view="view-profile"
            >
                👤 Profile
            </a>

        </nav>


        <!-- ===================================================== -->
        <!-- SIDEBAR ACTIONS -->
        <!-- ===================================================== -->

        <div
            style="
                margin-top:auto;
                padding-top:20px;
            "
        >

            <button
                type="button"
                id="theme-toggle"
                class="btn btn-secondary btn-block"
            >
                <span id="theme-icon">🌙</span>
                <span id="theme-text">Dark</span>
            </button>


            <button
                type="button"
                id="logout-button"
                class="btn btn-secondary btn-block"
                style="margin-top:10px;"
            >
                🚪 Log Out
            </button>

        </div>

    </aside>


    <!-- ========================================================= -->
    <!-- MAIN -->
    <!-- ========================================================= -->

    <main class="main-content">


        <!-- ===================================================== -->
        <!-- MOBILE / TOP BAR -->
        <!-- ===================================================== -->

        <div
            style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:18px;
                gap:10px;
            "
        >

            <button
                type="button"
                id="mobile-menu-toggle"
                class="btn btn-secondary"
            >
                ☰ Menu
            </button>


            <button
                type="button"
                id="top-theme-toggle"
                class="btn btn-secondary"
            >
                🌙 Theme
            </button>

        </div>


        <!-- ===================================================== -->
        <!-- HEADER -->
        <!-- ===================================================== -->

        <div class="main-header-banner">

            <span class="student-badge">
                ⚡ Career Navigation AI —
                <?php echo h($user['name'] ?? 'Student'); ?>
            </span>


            <h1
                class="header-title"
                id="banner-company-role"
            >

                <?php if ($targetCompany || $targetRole): ?>

                    <?php echo h($targetCompany); ?>

                    <?php if ($targetCompany && $targetRole): ?>
                        ·
                    <?php endif; ?>

                    <?php echo h($targetRole); ?>

                <?php else: ?>

                    Career Target Not Selected

                <?php endif; ?>

            </h1>


            <p class="header-subtitle">

                Analyze your resume, identify skill gaps,
                compare your skills with live job requirements,
                and build a personalized career roadmap.

            </p>

        </div>


        <!-- ===================================================== -->
        <!-- VIEW 1 : DASHBOARD -->
        <!-- ===================================================== -->

        <section
            id="view-analytics"
            class="view-panel"
        >

            <div class="metrics-grid">


                <div class="metric-card-container">

                    <span class="metric-label">
                        ATS Score
                    </span>

                    <span
                        class="metric-value"
                        id="metric-ats"
                    >
                        <?php echo h($atsScore); ?> / 100
                    </span>

                    <span class="metric-subtext">
                        Based on your uploaded resume
                    </span>

                </div>


                <div class="metric-card-container">

                    <span class="metric-label">
                        Job Readiness
                    </span>

                    <span
                        class="metric-value"
                        id="metric-readiness"
                    >
                        0%
                    </span>

                    <span
                        class="metric-subtext"
                        id="metric-matched-count"
                    >
                        Awaiting career target
                    </span>

                </div>


                <div class="metric-card-container">

                    <span class="metric-label">
                        AI Confidence
                    </span>

                    <span
                        class="metric-value"
                        id="metric-confidence"
                    >
                        0%
                    </span>

                    <span class="metric-subtext">
                        Dynamic analysis confidence
                    </span>

                </div>


                <div class="metric-card-container">

                    <span class="metric-label">
                        Resume Strength
                    </span>

                    <span
                        class="metric-value"
                        id="metric-strength"
                    >
                        Not Evaluated
                    </span>

                    <span class="metric-subtext">
                        Based on ATS analysis
                    </span>

                </div>

            </div>


            <!-- ================================================= -->
            <!-- CAREER URL -->
            <!-- ================================================= -->

            <div
                class="section-panel"
                style="margin-top:24px;"
            >

                <h3
                    style="
                        color:var(--cyan-light);
                        margin-bottom:8px;
                    "
                >
                    🌐 Dynamic Career / Jobs URL
                </h3>

                <p
                    style="
                        color:var(--text-muted);
                        margin-bottom:16px;
                        line-height:1.6;
                    "
                >
                    Enter a real career or jobs page URL.
                    The system will retrieve available job information
                    and identify the role that best matches your resume.
                </p>


                <div
                    style="
                        display:flex;
                        gap:12px;
                        flex-wrap:wrap;
                    "
                >

                    <input
                        type="url"
                        id="career-url"
                        class="form-control"
                        value="<?php echo h($careerUrl); ?>"
                        placeholder="https://example.com/careers/jobs"
                        style="flex:1;min-width:250px;"
                    >


                    <button
                        type="button"
                        id="scrape-career-url"
                        class="btn"
                    >
                        🔎 Fetch & Analyze Jobs
                    </button>

                </div>


                <div
                    id="career-url-status"
                    style="
                        margin-top:12px;
                        display:none;
                    "
                ></div>


                <div
                    id="scrape-results-box"
                    style="
                        margin-top:14px;
                        display:none;
                    "
                ></div>

            </div>


            <!-- ================================================= -->
            <!-- RECOMMENDATION -->
            <!-- ================================================= -->

            <div
                id="recommendation-card"
                class="section-panel"
                style="margin-top:24px;"
            >

                <h3
                    style="
                        color:var(--cyan-light);
                        margin-bottom:10px;
                    "
                >
                    🎯 Recommended Career Match
                </h3>

                <div id="recommended-job">

                    <?php if ($recommendedJob): ?>

                        <p>
                            Recommended role based on the
                            available career data.
                        </p>

                    <?php else: ?>

                        <p
                            style="
                                color:var(--text-muted);
                            "
                        >
                            Enter a career URL and upload your resume
                            to receive a dynamic job recommendation.
                        </p>

                    <?php endif; ?>

                </div>

            </div>


            <!-- ================================================= -->
            <!-- CHARTS -->
            <!-- ================================================= -->

            <div class="charts-grid">

                <div class="chart-card">

                    <h4
                        style="
                            color:var(--cyan-light);
                            margin-bottom:14px;
                        "
                    >
                        🎯 Placement Competency
                    </h4>

                    <div class="chart-container">

                        <canvas
                            id="radarChartCtx"
                        ></canvas>

                    </div>

                </div>


                <div class="chart-card">

                    <h4
                        style="
                            color:var(--cyan-light);
                            margin-bottom:14px;
                        "
                    >
                        🌐 Technical Skill Distribution
                    </h4>

                    <div class="chart-container">

                        <canvas
                            id="pieChartCtx"
                        ></canvas>

                    </div>

                </div>

            </div>

        </section>


        <!-- ===================================================== -->
        <!-- VIEW 2 : RESUME -->
        <!-- ===================================================== -->

        <section
            id="view-resume"
            class="view-panel"
            style="display:none;"
        >

            <h3>
                📄 Resume Parser & ATS Evaluation
            </h3>

            <p
                style="
                    color:var(--text-muted);
                    margin-bottom:20px;
                "
            >
                Upload your resume and extract your actual skills,
                contact information and ATS signals.
            </p>


            <div
                id="resume-upload-status"
                style="display:none;"
            ></div>


            <div
                style="
                    display:grid;
                    grid-template-columns:1fr 1fr;
                    gap:24px;
                "
            >

                <!-- Upload -->

                <div class="section-panel">

                    <form
                        id="form-resume-upload"
                        enctype="multipart/form-data"
                    >

                        <div class="form-group">

                            <label class="form-label">
                                Upload Resume
                            </label>

                            <input
                                type="file"
                                id="resume-file"
                                name="resume"
                                class="form-control"
                                accept=".pdf,.docx,.txt"
                            >

                        </div>


                        <button
                            type="submit"
                            id="evaluate-resume"
                            class="btn btn-block"
                        >
                            🚀 Evaluate Resume ATS
                        </button>

                    </form>

                </div>


                <!-- Extracted information -->

                <div class="section-panel">

                    <h4
                        style="
                            color:var(--cyan-light);
                            margin-bottom:14px;
                        "
                    >
                        🔍 Extracted Signals
                    </h4>


                    <p style="margin-bottom:10px;">

                        <strong>Name:</strong>

                        <code>
                            <?php echo h($detectedName ?: 'Not detected'); ?>
                        </code>

                    </p>


                    <p style="margin-bottom:10px;">

                        <strong>Email:</strong>

                        <?php if ($detectedEmail): ?>

                            <a
                                href="mailto:<?php echo h($detectedEmail); ?>"
                                class="extracted-link"
                            >
                                <?php echo h($detectedEmail); ?>
                            </a>

                        <?php else: ?>

                            <span style="color:var(--text-muted);">
                                Not detected
                            </span>

                        <?php endif; ?>

                    </p>


                    <p style="margin-bottom:10px;">

                        <strong>Phone:</strong>

                        <?php if ($detectedPhone): ?>

                            <a
                                href="tel:<?php echo h($detectedPhone); ?>"
                                class="extracted-link"
                            >
                                <?php echo h($detectedPhone); ?>
                            </a>

                        <?php else: ?>

                            <span style="color:var(--text-muted);">
                                Not detected
                            </span>

                        <?php endif; ?>

                    </p>


                    <p style="margin-bottom:10px;">

                        <strong>LinkedIn:</strong>

                        <?php if ($linkedinUrl): ?>

                            <a
                                href="<?php echo h($linkedinUrl); ?>"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="extracted-link"
                            >
                                <?php echo h($detectedLinkedin); ?>
                            </a>

                        <?php else: ?>

                            <span style="color:var(--text-muted);">
                                Not detected
                            </span>

                        <?php endif; ?>

                    </p>


                    <p style="margin-bottom:10px;">

                        <strong>GitHub:</strong>

                        <?php if ($githubUrl): ?>

                            <a
                                href="<?php echo h($githubUrl); ?>"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="extracted-link"
                            >
                                <?php echo h($detectedGithub); ?>
                            </a>

                        <?php else: ?>

                            <span style="color:var(--text-muted);">
                                Not detected
                            </span>

                        <?php endif; ?>

                    </p>

                </div>

            </div>


            <!-- Extracted skills -->

            <div
                class="section-panel"
                style="margin-top:24px;"
            >

                <h4
                    style="
                        color:var(--cyan-light);
                        margin-bottom:14px;
                    "
                >
                    🧠 Extracted Resume Skills
                </h4>

                <div id="resume-skills-list">

                    <?php if (!empty($extractedSkills)): ?>

                        <?php foreach ($extractedSkills as $skill): ?>

                            <span class="skill-tag">
                                <?php echo h($skill); ?>
                            </span>

                        <?php endforeach; ?>

                    <?php else: ?>

                        <span style="color:var(--text-muted);">
                            Upload a resume to extract skills.
                        </span>

                    <?php endif; ?>

                </div>

            </div>


            <!-- ATS -->

            <div
                class="section-panel"
                style="margin-top:24px;"
            >

                <h4
                    style="
                        color:var(--cyan-light);
                        margin-bottom:14px;
                    "
                >
                    📊 ATS Evaluation
                </h4>

                <div
                    id="ats-score"
                    style="
                        font-size:38px;
                        font-weight:800;
                        color:var(--cyan-light);
                    "
                >
                    <?php echo h($atsScore); ?>/100
                </div>

                <p
                    id="ats-feedback"
                    style="
                        color:var(--text-muted);
                        margin-top:8px;
                    "
                >
                    Upload a resume to calculate the ATS score.
                </p>

            </div>

        </section>


        <!-- ===================================================== -->
        <!-- VIEW 3 : SKILL GAP -->
        <!-- ===================================================== -->

        <section
            id="view-skillgap"
            class="view-panel"
            style="display:none;"
        >

            <h3>
                🎯 Skill-Gap Predictor
            </h3>

            <p
                style="
                    color:var(--text-muted);
                    margin-bottom:20px;
                "
            >
                Compare the skills extracted from your resume
                against the requirements of dynamically discovered jobs.
            </p>


            <div
                class="section-panel"
                style="margin-bottom:20px;"
            >

                <h4
                    style="
                        color:var(--cyan-light);
                        margin-bottom:12px;
                    "
                >
                    Your Resume Skills
                </h4>

                <div id="skillgap-user-skills">

                    <?php if (!empty($extractedSkills)): ?>

                        <?php foreach ($extractedSkills as $skill): ?>

                            <span class="skill-tag">
                                <?php echo h($skill); ?>
                            </span>

                        <?php endforeach; ?>

                    <?php else: ?>

                        <span style="color:var(--text-muted);">
                            No resume skills available.
                        </span>

                    <?php endif; ?>

                </div>

            </div>


            <div
                class="section-panel"
                style="margin-bottom:20px;"
            >

                <h4
                    style="
                        color:var(--cyan-light);
                        margin-bottom:12px;
                    "
                >
                    Required Skills
                </h4>

                <div id="skillgap-required-skills">

                    <?php if (!empty($requiredSkills)): ?>

                        <?php foreach ($requiredSkills as $skill): ?>

                            <span class="skill-tag">
                                <?php echo h($skill); ?>
                            </span>

                        <?php endforeach; ?>

                    <?php else: ?>

                        <span style="color:var(--text-muted);">
                            Required skills will appear after
                            analyzing a career URL.
                        </span>

                    <?php endif; ?>

                </div>

            </div>


            <div
                class="section-panel"
                id="skill-gap-results"
            >

                <h4
                    style="
                        color:var(--cyan-light);
                        margin-bottom:12px;
                    "
                >
                    Missing Skills
                </h4>

                <div id="missing-skills-list">

                    <span style="color:var(--text-muted);">
                        Analyze a career URL to identify skill gaps.
                    </span>

                </div>

            </div>

        </section>


        <!-- ===================================================== -->
        <!-- VIEW 4 : JOB RANKING -->
        <!-- ===================================================== -->

        <section
            id="view-jobranking"
            class="view-panel"
            style="display:none;"
        >

            <h3>
                💼 Dynamic Job Ranking
            </h3>

            <p
                style="
                    color:var(--text-muted);
                    margin-bottom:20px;
                "
            >
                Jobs discovered from your career URL are ranked
                according to your resume skill match.
            </p>


            <div class="section-panel">

                <div
                    style="
                        display:flex;
                        gap:12px;
                        flex-wrap:wrap;
                    "
                >

                    <input
                        type="url"
                        id="jobs-career-url"
                        class="form-control"
                        value="<?php echo h($careerUrl); ?>"
                        placeholder="Enter career/jobs URL"
                        style="flex:1;min-width:250px;"
                    >

                    <button
                        type="button"
                        id="rank-career-jobs"
                        class="btn"
                    >
                        📊 Rank Jobs
                    </button>

                </div>

            </div>


            <div
                id="job-results"
                style="margin-top:24px;"
            >

                <?php if (!empty($careerJobs)): ?>

                    <div class="section-panel">

                        <h4
                            style="
                                color:var(--cyan-light);
                                margin-bottom:14px;
                            "
                        >
                            Discovered Jobs
                        </h4>

                        <div
                            style="
                                overflow-x:auto;
                            "
                        >

                            <table class="data-table">

                                <thead>

                                    <tr>
                                        <th>Company</th>
                                        <th>Role</th>
                                        <th>Match</th>
                                        <th>Matched Skills</th>
                                        <th>Missing Skills</th>
                                    </tr>

                                </thead>

                                <tbody id="tbody-job-ranking">

                                    <!-- JavaScript dynamically populates this -->

                                </tbody>

                            </table>

                        </div>

                    </div>

                <?php else: ?>

                    <div class="section-panel">

                        <p style="color:var(--text-muted);">
                            No jobs loaded yet.
                            Enter a career URL and click
                            "Fetch & Analyze Jobs".
                        </p>

                    </div>

                <?php endif; ?>

            </div>

        </section>


        <!-- ===================================================== -->
        <!-- VIEW 5 : ROADMAP -->
        <!-- ===================================================== -->

        <section
            id="view-roadmap"
            class="view-panel"
            style="display:none;"
        >

            <h3>
                🗺️ Personalized Career Roadmap
            </h3>

            <p
                style="
                    color:var(--text-muted);
                    margin-bottom:24px;
                "
            >
                Your roadmap is generated using your resume skills,
                missing skills and dynamically identified career target.
            </p>


            <div
                id="container-dynamic-roadmap"
                class="section-panel"
            >

                <p style="color:var(--text-muted);">
                    Analyze your career URL and resume to generate
                    your personalized roadmap.
                </p>

            </div>


            <h4
                style="
                    color:var(--cyan-light);
                    margin-top:32px;
                    margin-bottom:16px;
                "
            >
                📚 Recommended Skill Mastery & Projects
            </h4>


            <div
                id="container-dynamic-resources"
                class="section-panel"
            >

                <p style="color:var(--text-muted);">
                    Recommended resources will appear here.
                </p>

            </div>

        </section>


        <!-- ===================================================== -->
        <!-- VIEW 6 : INTERVIEW -->
        <!-- ===================================================== -->

        <section
            id="view-interview"
            class="view-panel"
            style="display:none;"
        >

            <h3>
                🎙️ AI Interview Preparation
            </h3>

            <p
                style="
                    color:var(--text-muted);
                    margin-bottom:20px;
                "
            >
                Practice interview questions based on your
                dynamically identified career target and skill gaps.
            </p>


            <div class="section-panel">

                <h4
                    style="
                        color:var(--cyan-light);
                        margin-bottom:14px;
                    "
                >
                    Interview Question
                </h4>


                <div
                    id="interview-question"
                    style="
                        padding:16px;
                        border-radius:8px;
                        background:rgba(15,23,42,.7);
                        margin-bottom:18px;
                    "
                >
                    Click "Generate Question" to begin.
                </div>


                <textarea
                    id="interview-answer"
                    class="form-control"
                    rows="6"
                    placeholder="Type your answer here..."
                ></textarea>


                <div
                    style="
                        display:flex;
                        gap:10px;
                        margin-top:14px;
                        flex-wrap:wrap;
                    "
                >

                    <button
                        type="button"
                        id="generate-interview-question"
                        class="btn"
                    >
                        🎯 Generate Question
                    </button>


                    <button
                        type="button"
                        id="submit-interview-answer"
                        class="btn btn-secondary"
                    >
                        📊 Evaluate Answer
                    </button>

                </div>


                <div
                    id="interview-feedback"
                    style="
                        margin-top:18px;
                        display:none;
                    "
                ></div>

            </div>


            <!-- AI assistant -->

            <div
                class="section-panel"
                style="margin-top:24px;"
            >

                <h4
                    style="
                        color:var(--cyan-light);
                        margin-bottom:12px;
                    "
                >
                    🤖 AI Interview Assistant
                </h4>


                <div
                    style="
                        display:flex;
                        gap:10px;
                        flex-wrap:wrap;
                    "
                >

                    <input
                        type="text"
                        id="input-ai-prompt"
                        class="form-control"
                        placeholder="Ask an interview preparation question..."
                        style="flex:1;min-width:250px;"
                    >


                    <button
                        type="button"
                        id="btn-submit-ai-prompt"
                        class="btn"
                    >
                        🚀 Ask AI
                    </button>

                </div>


                <div
                    id="ai-assistant-response-card"
                    style="
                        display:none;
                        margin-top:18px;
                    "
                >

                    <h4
                        id="ai-response-title"
                        style="color:var(--emerald);"
                    ></h4>

                    <div id="ai-response-body"></div>

                </div>

            </div>

        </section>


        <!-- ===================================================== -->
        <!-- VIEW 7 : REPORT -->
        <!-- ===================================================== -->

        <section
            id="view-report"
            class="view-panel"
            style="display:none;"
        >

            <h3>
                📑 Download Progress Report
            </h3>

            <p
                style="
                    color:var(--text-muted);
                    margin-bottom:24px;
                "
            >
                Generate a report containing your resume analysis,
                ATS score, skills and career matching information.
            </p>


            <form
                action="api.php?action=download_pdf"
                method="POST"
                target="_blank"
            >

                <input
                    type="hidden"
                    name="target_company"
                    id="report-target-company"
                    value="<?php echo h($targetCompany); ?>"
                >

                <input
                    type="hidden"
                    name="target_role"
                    id="report-target-role"
                    value="<?php echo h($targetRole); ?>"
                >


                <button
                    type="submit"
                    class="btn"
                    style="
                        padding:14px 28px;
                        font-size:16px;
                    "
                >
                    📥 Download Progress Report
                </button>

            </form>

        </section>


        <!-- ===================================================== -->
        <!-- VIEW 8 : PROFILE -->
        <!-- ===================================================== -->

        <section
            id="view-profile"
            class="view-panel"
            style="display:none;"
        >

            <h3>
                👤 Profile & Resume History
            </h3>


            <div
                style="
                    display:grid;
                    grid-template-columns:1fr 1fr;
                    gap:24px;
                    margin-bottom:32px;
                "
            >

                <!-- ACCOUNT -->

                <div class="section-panel">

                    <h4
                        style="
                            color:var(--cyan-light);
                            margin-bottom:14px;
                        "
                    >
                        Account Information
                    </h4>


                    <p style="margin-bottom:8px;">

                        <strong>Full Name:</strong>

                        <code>
                            <?php echo h($user['name'] ?? ''); ?>
                        </code>

                    </p>


                    <p style="margin-bottom:8px;">

                        <strong>Email:</strong>

                        <code>
                            <?php echo h($user['email'] ?? ''); ?>
                        </code>

                    </p>


                    <p style="margin-bottom:8px;">

                        <strong>University:</strong>

                        <code>
                            <?php echo h($user['university'] ?? ''); ?>
                        </code>

                    </p>


                    <p style="margin-bottom:8px;">

                        <strong>Branch:</strong>

                        <code>
                            <?php echo h($user['branch'] ?? ''); ?>
                        </code>

                    </p>


                    <p style="margin-bottom:8px;">

                        <strong>Graduation Year:</strong>

                        <code>
                            <?php echo h($user['graduation_year'] ?? ''); ?>
                        </code>

                    </p>


                    <p style="margin-bottom:8px;">

                        <strong>LinkedIn:</strong>

                        <code>
                            <?php echo h($user['linkedin'] ?? 'Not set'); ?>
                        </code>

                    </p>


                    <p style="margin-bottom:8px;">

                        <strong>GitHub:</strong>

                        <code>
                            <?php echo h($user['github'] ?? 'Not set'); ?>
                        </code>

                    </p>

                </div>


                <!-- UPDATE PROFILE -->

                <div class="section-panel">

                    <h4
                        style="
                            color:var(--cyan-light);
                            margin-bottom:14px;
                        "
                    >
                        Update Profile
                    </h4>


                    <form id="profile-form">

                        <div class="form-group">

                            <label class="form-label">
                                Full Name
                            </label>

                            <input
                                type="text"
                                id="profile_name"
                                name="name"
                                class="form-control"
                                value="<?php echo h($user['name'] ?? ''); ?>"
                            >

                        </div>


                        <div class="form-group">

                            <label class="form-label">
                                Email
                            </label>

                            <input
                                type="email"
                                id="profile_email"
                                name="email"
                                class="form-control"
                                value="<?php echo h($user['email'] ?? ''); ?>"
                                readonly
                            >

                        </div>


                        <div class="form-group">

                            <label class="form-label">
                                University
                            </label>

                            <input
                                type="text"
                                id="profile_university"
                                name="university"
                                class="form-control"
                                value="<?php echo h($user['university'] ?? ''); ?>"
                            >

                        </div>


                        <div class="form-group">

                            <label class="form-label">
                                Degree / Branch
                            </label>

                            <input
                                type="text"
                                id="profile_degree"
                                name="degree"
                                class="form-control"
                                value="<?php echo h($user['branch'] ?? ''); ?>"
                            >

                        </div>


                        <div class="form-group">

                            <label class="form-label">
                                Major / Specialization
                            </label>

                            <input
                                type="text"
                                id="profile_major"
                                name="major"
                                class="form-control"
                                value="<?php echo h($user['major'] ?? ''); ?>"
                            >

                        </div>


                        <div class="form-group">

                            <label class="form-label">
                                Graduation Year
                            </label>

                            <input
                                type="number"
                                id="profile_gradyear"
                                name="graduation_year"
                                class="form-control"
                                value="<?php echo h($user['graduation_year'] ?? ''); ?>"
                            >

                        </div>


                        <div class="form-group">

                            <label class="form-label">
                                LinkedIn
                            </label>

                            <input
                                type="text"
                                id="profile_linkedin"
                                name="linkedin"
                                class="form-control"
                                value="<?php echo h($user['linkedin'] ?? ''); ?>"
                            >

                        </div>


                        <div class="form-group">

                            <label class="form-label">
                                GitHub
                            </label>

                            <input
                                type="text"
                                id="profile_github"
                                name="github"
                                class="form-control"
                                value="<?php echo h($user['github'] ?? ''); ?>"
                            >

                        </div>


                        <button
                            type="submit"
                            class="btn btn-block"
                        >
                            💾 Save Profile
                        </button>


                        <div
                            id="profile-message"
                            style="
                                margin-top:12px;
                                display:none;
                            "
                        ></div>

                    </form>

                </div>

            </div>


            <!-- ================================================= -->
            <!-- HISTORY -->
            <!-- ================================================= -->

            <h4
                style="
                    color:var(--cyan-light);
                    margin-bottom:14px;
                "
            >
                📜 Resume Evaluation History
            </h4>


            <?php if (!empty($resumeHistory)): ?>

                <div
                    style="
                        overflow-x:auto;
                    "
                >

                    <table class="data-table">

                        <thead>

                            <tr>

                                <th>Date</th>
                                <th>Resume File</th>
                                <th>Domain</th>
                                <th>ATS Score</th>
                                <th>Readiness</th>
                                <th>Confidence</th>

                            </tr>

                        </thead>


                        <tbody>

                            <?php foreach ($resumeHistory as $history): ?>

                                <tr>

                                    <td>
                                        <?php echo h($history['created_at'] ?? ''); ?>
                                    </td>

                                    <td>
                                        <?php echo h($history['file_name'] ?? ''); ?>
                                    </td>

                                    <td>
                                        <?php echo h($history['domain'] ?? ''); ?>
                                    </td>

                                    <td>
                                        <?php echo h($history['ats_score'] ?? '0'); ?>/100
                                    </td>

                                    <td>
                                        <?php echo h($history['readiness_score'] ?? '0'); ?>%
                                    </td>

                                    <td>
                                        <?php echo h($history['confidence_score'] ?? '0'); ?>%
                                    </td>

                                </tr>

                            <?php endforeach; ?>

                        </tbody>

                    </table>

                </div>

            <?php else: ?>

                <div class="section-panel">

                    <p style="color:var(--text-muted);">

                        No resume evaluation history available yet.

                    </p>

                </div>

            <?php endif; ?>

        </section>

    </main>

</div>

<?php endif; ?>


<!-- ============================================================= -->
<!-- APPLICATION SCRIPT -->
<!-- ============================================================= -->

<script>

window.APP_DATA =
    <?php echo json_encode(
        $appData,
        JSON_UNESCAPED_SLASHES |
        JSON_UNESCAPED_UNICODE
    ); ?>;

window.CANONICAL_SKILLS =
    <?php echo json_encode(
        $canonicalSkills,
        JSON_UNESCAPED_SLASHES |
        JSON_UNESCAPED_UNICODE
    ); ?>;

</script>


<script
    src="static/app.js?v=<?php echo time(); ?>"
></script>


</body>
</html>
