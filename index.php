<?php
/**
 * Skill-Gap Predictor
 * Career Navigation AI
 * Main Application Entry Point
 */

session_start();

require_once __DIR__ . '/db.php';

/* ================================================================
   HELPERS
================================================================ */

function h($value)
{
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

function safeArray($value)
{
    return is_array($value) ? $value : [];
}

function formatSocialUrl($url)
{
    if (empty($url) || $url === 'N/A') {
        return null;
    }

    $url = trim($url);

    if ($url === '') {
        return null;
    }

    $lower = strtolower($url);

    $invalidParts = [
        'summary',
        'experience',
        'education',
        'skills',
        'projects',
        'certifications',
        'about',
        'contact',
        'home'
    ];

    foreach ($invalidParts as $part) {
        if (strpos($lower, $part) !== false) {
            return null;
        }
    }

    if (
        strpos($url, 'http://') === 0 ||
        strpos($url, 'https://') === 0
    ) {
        return $url;
    }

    return 'https://' . ltrim($url, '/');
}

/* ================================================================
   SESSION
================================================================ */

$user = $_SESSION['user'] ?? null;

$careerUrl = $_SESSION['career_url'] ?? '';

$targetCompany = $_SESSION['target_company'] ?? '';
$targetRole = $_SESSION['target_role'] ?? '';

$requiredSkills = safeArray(
    $_SESSION['required_skills'] ?? []
);

$extractedSkills = safeArray(
    $_SESSION['extracted_skills'] ?? []
);

$atsScore = $_SESSION['ats_score'] ?? 0;

$recommendedJob = $_SESSION['recommended_job'] ?? null;

$careerJobs = safeArray(
    $_SESSION['career_jobs'] ?? []
);

/* ================================================================
   PARSED RESUME
================================================================ */

$parsedResume = safeArray(
    $_SESSION['parsed_resume'] ?? []
);

$contactInfo = safeArray(
    $parsedResume['contact_info'] ?? []
);

$detectedName =
    $contactInfo['name']
    ?? ($user['name'] ?? '');

$detectedEmail =
    $contactInfo['email']
    ?? ($user['email'] ?? '');

$detectedPhone =
    $contactInfo['phone']
    ?? '';

$detectedLinkedin =
    $contactInfo['linkedin']
    ?? ($user['linkedin'] ?? '');

$detectedGithub =
    $contactInfo['github']
    ?? ($user['github'] ?? '');

$linkedinUrl = formatSocialUrl($detectedLinkedin);
$githubUrl = formatSocialUrl($detectedGithub);

/* ================================================================
   RESUME HISTORY
================================================================ */

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

/* ================================================================
   APPLICATION DATA
================================================================ */

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
        href="static/styles.css?v=<?php echo time(); ?>"
    >

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

</head>

<body>

<!-- ================================================================
     PAGE LOADER
================================================================ -->

<div
    id="page-loader"
    class="page-loader"
>

    <div class="loader-card">

        <div class="loader-ring"></div>

        <div class="loader-title">
            Skill-Gap Predictor
        </div>

        <div class="loader-text">
            Loading Career Navigation AI...
        </div>

    </div>

</div>


<?php if (!$user): ?>

<!-- ================================================================
     AUTHENTICATION SCREEN
================================================================ -->

<section
    id="auth-screen"
    class="auth-screen"
>

    <div class="auth-container">

        <!-- BRAND -->

        <div class="auth-brand">

            <div class="auth-brand-icon">
                🎓
            </div>

            <div>

                <div class="auth-brand-title">
                    Skill-Gap Predictor
                </div>

                <div class="auth-brand-subtitle">
                    Career Navigation AI
                </div>

            </div>

        </div>


        <!-- AUTH CARD -->

        <div class="auth-card">

            <div class="auth-heading">

                <span class="auth-badge">
                    Student Career Intelligence
                </span>

                <h1>
                    Build Your Career Path
                </h1>

                <p>
                    Analyze your resume, discover skill gaps,
                    and match yourself with real career opportunities.
                </p>

            </div>


            <!-- ====================================================
                 AUTH TABS
            ==================================================== -->

            <div class="auth-tabs">

                <button
                    type="button"
                    id="tab-btn-login"
                    class="auth-tab active"
                    data-auth-tab="login"
                >
                    Login
                </button>

                <button
                    type="button"
                    id="tab-btn-signup"
                    class="auth-tab"
                    data-auth-tab="signup"
                >
                    Create Account
                </button>

            </div>


            <!-- ====================================================
                 LOGIN
            ==================================================== -->

            <div
                id="form-login-box"
                class="auth-panel"
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

                    <label
                        for="login_email"
                        class="form-label"
                    >
                        Email Address
                    </label>

                    <input
                        type="email"
                        id="login_email"
                        name="login_email"
                        class="form-control"
                        placeholder="Enter your email"
                        autocomplete="email"
                    >

                </div>


                <div class="form-group">

                    <label
                        for="login_password"
                        class="form-label"
                    >
                        Password
                    </label>

                    <div class="password-field">

                        <input
                            type="password"
                            id="login_password"
                            name="login_password"
                            class="form-control"
                            placeholder="Enter your password"
                            autocomplete="current-password"
                        >

                        <button
                            type="button"
                            id="toggle-login-password"
                            class="password-toggle"
                            aria-label="Show password"
                        >
                            👁
                        </button>

                    </div>

                </div>


                <button
                    type="button"
                    id="btn-do-login"
                    class="btn btn-primary btn-block"
                >
                    Login to Dashboard
                </button>


                <div class="auth-switch">

                    Don't have an account?

                    <button
                        type="button"
                        id="create-account-link"
                        class="auth-link"
                    >
                        Create Account
                    </button>

                </div>

            </div>


            <!-- ====================================================
                 CREATE ACCOUNT
            ==================================================== -->

            <div
                id="form-signup-box"
                class="auth-panel"
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

                    <label
                        for="signup_name"
                        class="form-label"
                    >
                        Full Name *
                    </label>

                    <input
                        type="text"
                        id="signup_name"
                        name="signup_name"
                        class="form-control"
                        placeholder="Enter your full name"
                        autocomplete="name"
                    >

                </div>


                <div class="form-group">

                    <label
                        for="signup_email"
                        class="form-label"
                    >
                        Email Address *
                    </label>

                    <input
                        type="email"
                        id="signup_email"
                        name="signup_email"
                        class="form-control"
                        placeholder="Enter your email"
                        autocomplete="email"
                    >

                </div>


                <div class="form-group">

                    <label
                        for="signup_pwd"
                        class="form-label"
                    >
                        Password *
                    </label>

                    <div class="password-field">

                        <input
                            type="password"
                            id="signup_pwd"
                            name="signup_pwd"
                            class="form-control"
                            placeholder="Create a password"
                            autocomplete="new-password"
                        >

                        <button
                            type="button"
                            id="toggle-signup-password"
                            class="password-toggle"
                            aria-label="Show password"
                        >
                            👁
                        </button>

                    </div>

                    <div class="form-help">
                        Use at least 4 characters.
                    </div>

                </div>


                <div class="form-group">

                    <label
                        for="signup_uni"
                        class="form-label"
                    >
                        University / College
                    </label>

                    <input
                        type="text"
                        id="signup_uni"
                        name="signup_uni"
                        class="form-control"
                        placeholder="Enter your university"
                    >

                </div>


                <div class="form-row">

                    <div class="form-group">

                        <label
                            for="signup_branch"
                            class="form-label"
                        >
                            Branch / Degree
                        </label>

                        <input
                            type="text"
                            id="signup_branch"
                            name="signup_branch"
                            class="form-control"
                            placeholder="e.g. CSE"
                        >

                    </div>


                    <div class="form-group">

                        <label
                            for="signup_major"
                            class="form-label"
                        >
                            Specialization
                        </label>

                        <input
                            type="text"
                            id="signup_major"
                            name="signup_major"
                            class="form-control"
                            placeholder="e.g. Cyber Security"
                        >

                    </div>

                </div>


                <div class="form-group">

                    <label
                        for="signup_gradyear"
                        class="form-label"
                    >
                        Graduation Year
                    </label>

                    <select
                        id="signup_gradyear"
                        name="signup_gradyear"
                        class="form-control"
                    >

                        <option value="">
                            Select graduation year
                        </option>

                        <?php
                        $currentYear = (int)date('Y');

                        for (
                            $year = $currentYear - 2;
                            $year <= $currentYear + 7;
                            $year++
                        ):
                        ?>

                            <option value="<?php echo $year; ?>">
                                <?php echo $year; ?>
                            </option>

                        <?php endfor; ?>

                    </select>

                </div>


                <div class="form-row">

                    <div class="form-group">

                        <label
                            for="signup_linkedin"
                            class="form-label"
                        >
                            LinkedIn
                        </label>

                        <input
                            type="text"
                            id="signup_linkedin"
                            name="signup_linkedin"
                            class="form-control"
                            placeholder="LinkedIn URL"
                        >

                    </div>


                    <div class="form-group">

                        <label
                            for="signup_github"
                            class="form-label"
                        >
                            GitHub
                        </label>

                        <input
                            type="text"
                            id="signup_github"
                            name="signup_github"
                            class="form-control"
                            placeholder="GitHub URL"
                        >

                    </div>

                </div>


                <div class="terms-row">

                    <input
                        type="checkbox"
                        id="signup-terms"
                    >

                    <label for="signup-terms">

                        I confirm that the information provided
                        is accurate.

                    </label>

                </div>


                <button
                    type="button"
                    id="btn-do-signup"
                    class="btn btn-primary btn-block"
                >
                    Create My Account
                </button>


                <div class="auth-switch">

                    Already have an account?

                    <button
                        type="button"
                        id="back-to-login"
                        class="auth-link"
                    >
                        Login here
                    </button>

                </div>

            </div>

        </div>


        <div class="auth-footer">

            Your career URL and resume analysis are available
            after login.

        </div>

    </div>

</section>


<?php else: ?>

<!-- ================================================================
     APPLICATION
================================================================ -->

<div
    id="dashboard-app"
    class="app-shell"
>


    <!-- ============================================================
         MOBILE OVERLAY
    ============================================================ -->

    <div
        id="sidebar-overlay"
        class="sidebar-overlay"
    ></div>


    <!-- ============================================================
         SIDEBAR
    ============================================================ -->

    <aside
        id="app-sidebar"
        class="app-sidebar"
    >

        <!-- SIDEBAR BRAND -->

        <div class="sidebar-brand">

            <div class="sidebar-brand-icon">
                🎓
            </div>

            <div>

                <div class="sidebar-brand-title">
                    Skill-Gap
                </div>

                <div class="sidebar-brand-subtitle">
                    Career AI
                </div>

            </div>

            <button
                type="button"
                id="sidebar-close"
                class="sidebar-close"
            >
                ×
            </button>

        </div>


        <!-- USER -->

        <div class="sidebar-user">

            <div class="sidebar-avatar">
                <?php
                $userName = trim($user['name'] ?? 'Student');
                echo h(
                    strtoupper(
                        substr($userName, 0, 1)
                    )
                );
                ?>
            </div>

            <div class="sidebar-user-info">

                <strong>
                    <?php echo h($userName); ?>
                </strong>

                <span>
                    <?php echo h($user['email'] ?? ''); ?>
                </span>

            </div>

        </div>


        <!-- CAREER TARGET -->

        <div class="sidebar-target">

            <div class="sidebar-section-label">
                CAREER TARGET
            </div>

            <div
                id="sidebar-target-summary"
                class="sidebar-target-box"
            >

                <?php if ($targetCompany || $targetRole): ?>

                    <strong>
                        <?php echo h($targetCompany); ?>
                    </strong>

                    <?php if ($targetRole): ?>

                        <span>
                            <?php echo h($targetRole); ?>
                        </span>

                    <?php endif; ?>

                <?php else: ?>

                    <span class="muted">
                        No target selected
                    </span>

                <?php endif; ?>

            </div>

        </div>


        <!-- NAVIGATION -->

        <nav class="sidebar-nav">

            <button
                type="button"
                class="nav-item active"
                data-view="view-analytics"
            >
                <span class="nav-icon">📊</span>
                <span>Dashboard</span>
            </button>


            <button
                type="button"
                class="nav-item"
                data-view="view-resume"
            >
                <span class="nav-icon">📄</span>
                <span>Resume Parser & ATS</span>
            </button>


            <button
                type="button"
                class="nav-item"
                data-view="view-skillgap"
            >
                <span class="nav-icon">🎯</span>
                <span>Skill-Gap Predictor</span>
            </button>


            <button
                type="button"
                class="nav-item"
                data-view="view-jobranking"
            >
                <span class="nav-icon">💼</span>
                <span>Dynamic Job Ranking</span>
            </button>


            <button
                type="button"
                class="nav-item"
                data-view="view-roadmap"
            >
                <span class="nav-icon">🗺️</span>
                <span>Career Roadmap</span>
            </button>


            <button
                type="button"
                class="nav-item"
                data-view="view-interview"
            >
                <span class="nav-icon">🎙️</span>
                <span>Interview Prep</span>
            </button>


            <button
                type="button"
                class="nav-item"
                data-view="view-report"
            >
                <span class="nav-icon">📑</span>
                <span>Download Report</span>
            </button>


            <button
                type="button"
                class="nav-item"
                data-view="view-profile"
            >
                <span class="nav-icon">👤</span>
                <span>Profile</span>
            </button>

        </nav>


        <!-- SIDEBAR FOOTER -->

        <div class="sidebar-footer">

            <button
                type="button"
                id="theme-toggle"
                class="sidebar-action"
            >

                <span id="theme-icon">
                    🌙
                </span>

                <span id="theme-text">
                    Dark Mode
                </span>

            </button>


            <button
                type="button"
                id="logout-button"
                class="sidebar-action logout-action"
            >

                <span>
                    🚪
                </span>

                <span>
                    Logout
                </span>

            </button>

        </div>

    </aside>


    <!-- ============================================================
         MAIN AREA
    ============================================================ -->

    <main class="main-area">


        <!-- TOP BAR -->

        <header class="topbar">

            <div class="topbar-left">

                <button
                    type="button"
                    id="mobile-menu-toggle"
                    class="menu-button"
                >
                    ☰
                </button>

                <div>

                    <div class="topbar-title">
                        Career Navigation AI
                    </div>

                    <div class="topbar-subtitle">
                        Skill-Gap Predictor
                    </div>

                </div>

            </div>


            <button
                type="button"
                id="top-theme-toggle"
                class="theme-button"
            >

                <span>
                    🌙
                </span>

                <span>
                    Theme
                </span>

            </button>

        </header>


        <!-- ========================================================
             VIEW : DASHBOARD
        ======================================================== -->

        <section
            id="view-analytics"
            class="view-panel active"
        >

            <div class="page-heading">

                <div>

                    <span class="eyebrow">
                        PERSONAL CAREER DASHBOARD
                    </span>

                    <h1 id="banner-company-role">

                        <?php if ($targetCompany || $targetRole): ?>

                            <?php echo h($targetCompany); ?>

                            <?php if ($targetCompany && $targetRole): ?>
                                <span> · </span>
                            <?php endif; ?>

                            <?php echo h($targetRole); ?>

                        <?php else: ?>

                            Career Target Not Selected

                        <?php endif; ?>

                    </h1>

                    <p>
                        Analyze your resume and compare it
                        with dynamically discovered career opportunities.
                    </p>

                </div>

            </div>


            <!-- METRICS -->

            <div class="metrics-grid">

                <div class="metric-card">

                    <div class="metric-icon purple">
                        📄
                    </div>

                    <div>

                        <span class="metric-label">
                            ATS SCORE
                        </span>

                        <strong
                            id="metric-ats"
                            class="metric-value"
                        >
                            <?php echo h($atsScore); ?>/100
                        </strong>

                    </div>

                </div>


                <div class="metric-card">

                    <div class="metric-icon cyan">
                        🎯
                    </div>

                    <div>

                        <span class="metric-label">
                            JOB READINESS
                        </span>

                        <strong
                            id="metric-readiness"
                            class="metric-value"
                        >
                            0%
                        </strong>

                    </div>

                </div>


                <div class="metric-card">

                    <div class="metric-icon green">
                        💼
                    </div>

                    <div>

                        <span class="metric-label">
                            JOBS FOUND
                        </span>

                        <strong
                            id="metric-jobs"
                            class="metric-value"
                        >
                            <?php echo count($careerJobs); ?>
                        </strong>

                    </div>

                </div>


                <div class="metric-card">

                    <div class="metric-icon orange">
                        ⚡
                    </div>

                    <div>

                        <span class="metric-label">
                            MATCH
                        </span>

                        <strong
                            id="metric-match"
                            class="metric-value"
                        >
                            0%
                        </strong>

                    </div>

                </div>

            </div>


            <!-- CAREER URL -->

            <div class="content-card career-source-card">

                <div class="card-heading">

                    <div class="card-icon">
                        🌐
                    </div>

                    <div>

                        <h2>
                            Dynamic Career Source
                        </h2>

                        <p>
                            Enter a real jobs or careers URL.
                            No company or role is predefined.
                        </p>

                    </div>

                </div>


                <div class="career-url-row">

                    <input
                        type="url"
                        id="career-url"
                        class="form-control"
                        value="<?php echo h($careerUrl); ?>"
                        placeholder="https://example.com/careers/jobs"
                    >

                    <button
                        type="button"
                        id="scrape-career-url"
                        class="btn btn-primary"
                    >
                        Analyze Jobs
                    </button>

                </div>


                <div
                    id="career-url-status"
                    class="status-area"
                ></div>

            </div>


            <!-- RECOMMENDATION -->

            <div
                id="recommendation-card"
                class="content-card recommendation-card"
            >

                <div class="card-heading">

                    <div class="card-icon green-bg">
                        🎯
                    </div>

                    <div>

                        <h2>
                            Dynamic Job Recommendation
                        </h2>

                        <p>
                            Based on your resume and discovered jobs.
                        </p>

                    </div>

                </div>


                <div id="recommended-job">

                    <?php if ($recommendedJob): ?>

                        <div class="recommendation-placeholder">
                            A recommendation is available.
                        </div>

                    <?php else: ?>

                        <div class="empty-state">

                            <div class="empty-icon">
                                🔎
                            </div>

                            <h3>
                                No recommendation yet
                            </h3>

                            <p>
                                Enter a career URL and upload your
                                resume to generate a dynamic recommendation.
                            </p>

                        </div>

                    <?php endif; ?>

                </div>

            </div>


            <!-- CHARTS -->

            <div class="charts-grid">

                <div class="content-card">

                    <div class="card-heading compact">

                        <div>

                            <h2>
                                Skill Competency
                            </h2>

                            <p>
                                Resume vs required skills
                            </p>

                        </div>

                    </div>

                    <div class="chart-container">

                        <canvas id="radarChartCtx"></canvas>

                    </div>

                </div>


                <div class="content-card">

                    <div class="card-heading compact">

                        <div>

                            <h2>
                                Skill Distribution
                            </h2>

                            <p>
                                Extracted technical skills
                            </p>

                        </div>

                    </div>

                    <div class="chart-container">

                        <canvas id="pieChartCtx"></canvas>

                    </div>

                </div>

            </div>

        </section>


        <!-- ========================================================
             VIEW : RESUME
        ======================================================== -->

        <section
            id="view-resume"
            class="view-panel"
        >

            <div class="page-heading">

                <span class="eyebrow">
                    RESUME INTELLIGENCE
                </span>

                <h1>
                    Resume Parser & ATS
                </h1>

                <p>
                    Upload your resume to extract skills and
                    calculate your ATS score.
                </p>

            </div>


            <div
                id="resume-upload-status"
                class="status-area"
            ></div>


            <div class="two-column-layout">

                <!-- UPLOAD -->

                <div class="content-card">

                    <div class="card-heading">

                        <div class="card-icon">
                            📄
                        </div>

                        <div>

                            <h2>
                                Upload Resume
                            </h2>

                            <p>
                                PDF, DOCX or TXT
                            </p>

                        </div>

                    </div>


                    <form
                        id="form-resume-upload"
                        enctype="multipart/form-data"
                    >

                        <div
                            id="resume-drop-zone"
                            class="resume-drop-zone"
                        >

                            <div class="upload-icon">
                                📤
                            </div>

                            <strong>
                                Choose your resume
                            </strong>

                            <span>
                                Upload PDF, DOCX or TXT
                            </span>

                            <input
                                type="file"
                                id="resume-file"
                                name="resume"
                                accept=".pdf,.docx,.txt"
                            >

                        </div>


                        <button
                            type="submit"
                            id="evaluate-resume"
                            class="btn btn-primary btn-block"
                        >
                            Evaluate Resume
                        </button>

                    </form>

                </div>


                <!-- ATS -->

                <div class="content-card">

                    <div class="card-heading">

                        <div class="card-icon cyan-bg">
                            📊
                        </div>

                        <div>

                            <h2>
                                ATS Evaluation
                            </h2>

                            <p>
                                Resume compatibility analysis
                            </p>

                        </div>

                    </div>


                    <div class="ats-score-display">

                        <div
                            id="ats-score"
                            class="ats-score"
                        >
                            <?php echo h($atsScore); ?>
                        </div>

                        <span>
                            / 100
                        </span>

                    </div>


                    <div
                        id="ats-feedback"
                        class="ats-feedback"
                    >
                        Upload your resume to calculate
                        your ATS score.
                    </div>

                </div>

            </div>


            <!-- CONTACT -->

            <div class="content-card">

                <div class="card-heading">

                    <div class="card-icon">
                        🔍
                    </div>

                    <div>

                        <h2>
                            Extracted Resume Information
                        </h2>

                        <p>
                            Information detected from your resume
                        </p>

                    </div>

                </div>


                <div class="contact-grid">

                    <div class="info-item">

                        <span>
                            Name
                        </span>

                        <strong id="resume-name">
                            <?php echo h(
                                $detectedName ?: 'Not detected'
                            ); ?>
                        </strong>

                    </div>


                    <div class="info-item">

                        <span>
                            Email
                        </span>

                        <strong id="resume-email">
                            <?php echo h(
                                $detectedEmail ?: 'Not detected'
                            ); ?>
                        </strong>

                    </div>


                    <div class="info-item">

                        <span>
                            Phone
                        </span>

                        <strong id="resume-phone">
                            <?php echo h(
                                $detectedPhone ?: 'Not detected'
                            ); ?>
                        </strong>

                    </div>


                    <div class="info-item">

                        <span>
                            LinkedIn
                        </span>

                        <?php if ($linkedinUrl): ?>

                            <a
                                id="resume-linkedin"
                                href="<?php echo h($linkedinUrl); ?>"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View Profile
                            </a>

                        <?php else: ?>

                            <strong>
                                Not detected
                            </strong>

                        <?php endif; ?>

                    </div>


                    <div class="info-item">

                        <span>
                            GitHub
                        </span>

                        <?php if ($githubUrl): ?>

                            <a
                                id="resume-github"
                                href="<?php echo h($githubUrl); ?>"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View Profile
                            </a>

                        <?php else: ?>

                            <strong>
                                Not detected
                            </strong>

                        <?php endif; ?>

                    </div>

                </div>

            </div>


            <!-- SKILLS -->

            <div class="content-card">

                <div class="card-heading">

                    <div class="card-icon purple-bg">
                        🧠
                    </div>

                    <div>

                        <h2>
                            Extracted Skills
                        </h2>

                        <p>
                            Skills detected from your resume
                        </p>

                    </div>

                </div>


                <div
                    id="resume-skills-list"
                    class="skill-list"
                >

                    <?php if (!empty($extractedSkills)): ?>

                        <?php foreach ($extractedSkills as $skill): ?>

                            <span class="skill-tag">
                                <?php echo h($skill); ?>
                            </span>

                        <?php endforeach; ?>

                    <?php else: ?>

                        <span class="empty-inline">
                            No skills detected yet.
                        </span>

                    <?php endif; ?>

                </div>

            </div>

        </section>


        <!-- ========================================================
             VIEW : SKILL GAP
        ======================================================== -->

        <section
            id="view-skillgap"
            class="view-panel"
        >

            <div class="page-heading">

                <span class="eyebrow">
                    SKILL ANALYSIS
                </span>

                <h1>
                    Skill-Gap Predictor
                </h1>

                <p>
                    See which skills you already have and
                    which skills are required by discovered jobs.
                </p>

            </div>


            <div class="two-column-layout">

                <div class="content-card">

                    <div class="card-heading">

                        <div class="card-icon green-bg">
                            ✅
                        </div>

                        <div>

                            <h2>
                                Skills You Have
                            </h2>

                        </div>

                    </div>


                    <div
                        id="skillgap-user-skills"
                        class="skill-list"
                    >

                        <?php if (!empty($extractedSkills)): ?>

                            <?php foreach ($extractedSkills as $skill): ?>

                                <span class="skill-tag matched">
                                    <?php echo h($skill); ?>
                                </span>

                            <?php endforeach; ?>

                        <?php else: ?>

                            <span class="empty-inline">
                                Upload a resume first.
                            </span>

                        <?php endif; ?>

                    </div>

                </div>


                <div class="content-card">

                    <div class="card-heading">

                        <div class="card-icon orange-bg">
                            📌
                        </div>

                        <div>

                            <h2>
                                Required Skills
                            </h2>

                        </div>

                    </div>


                    <div
                        id="skillgap-required-skills"
                        class="skill-list"
                    >

                        <?php if (!empty($requiredSkills)): ?>

                            <?php foreach ($requiredSkills as $skill): ?>

                                <span class="skill-tag required">
                                    <?php echo h($skill); ?>
                                </span>

                            <?php endforeach; ?>

                        <?php else: ?>

                            <span class="empty-inline">
                                Analyze a career URL first.
                            </span>

                        <?php endif; ?>

                    </div>

                </div>

            </div>


            <div class="content-card">

                <div class="card-heading">

                    <div class="card-icon red-bg">
                        ⚠️
                    </div>

                    <div>

                        <h2>
                            Missing Skills
                        </h2>

                        <p>
                            Skills to focus on for your target jobs
                        </p>

                    </div>

                </div>


                <div
                    id="missing-skills-list"
                    class="skill-list"
                >

                    <span class="empty-inline">
                        Analyze your career URL to identify
                        missing skills.
                    </span>

                </div>

            </div>

        </section>


        <!-- ========================================================
             VIEW : JOB RANKING
        ======================================================== -->

        <section
            id="view-jobranking"
            class="view-panel"
        >

            <div class="page-heading">

                <span class="eyebrow">
                    OPPORTUNITY MATCHING
                </span>

                <h1>
                    Dynamic Job Ranking
                </h1>

                <p>
                    Jobs discovered from your career source
                    are ranked according to your resume.
                </p>

            </div>


            <div class="content-card">

                <div class="career-url-row">

                    <input
                        type="url"
                        id="jobs-career-url"
                        class="form-control"
                        value="<?php echo h($careerUrl); ?>"
                        placeholder="Enter career/jobs URL"
                    >

                    <button
                        type="button"
                        id="rank-career-jobs"
                        class="btn btn-primary"
                    >
                        Rank Jobs
                    </button>

                </div>

            </div>


            <div
                id="job-results"
                class="job-results"
            >

                <?php if (empty($careerJobs)): ?>

                    <div class="empty-state-card">

                        <div class="empty-icon">
                            💼
                        </div>

                        <h3>
                            No jobs analyzed yet
                        </h3>

                        <p>
                            Enter a career URL and analyze jobs
                            to see dynamic rankings.
                        </p>

                    </div>

                <?php endif; ?>

            </div>

        </section>


        <!-- ========================================================
             VIEW : ROADMAP
        ======================================================== -->

        <section
            id="view-roadmap"
            class="view-panel"
        >

            <div class="page-heading">

                <span class="eyebrow">
                    PERSONALIZED LEARNING
                </span>

                <h1>
                    Career Roadmap
                </h1>

                <p>
                    Build a learning path from your current
                    skills toward your dynamically identified target.
                </p>

            </div>


            <div
                id="container-dynamic-roadmap"
                class="roadmap-container"
            >

                <div class="empty-state-card">

                    <div class="empty-icon">
                        🗺️
                    </div>

                    <h3>
                        Roadmap not generated yet
                    </h3>

                    <p>
                        Analyze your career URL and resume
                        to generate your personalized roadmap.
                    </p>

                </div>

            </div>


            <div
                id="container-dynamic-resources"
                class="resources-container"
            ></div>

        </section>


        <!-- ========================================================
             VIEW : INTERVIEW
        ======================================================== -->

        <section
            id="view-interview"
            class="view-panel"
        >

            <div class="page-heading">

                <span class="eyebrow">
                    INTERVIEW PREPARATION
                </span>

                <h1>
                    Interview Prep
                </h1>

                <p>
                    Practice questions based on your career target
                    and skill gaps.
                </p>

            </div>


            <div class="content-card">

                <div class="interview-question-card">

                    <span class="eyebrow">
                        CURRENT QUESTION
                    </span>

                    <div id="interview-question">
                        Generate an interview question to begin.
                    </div>

                </div>


                <div class="form-group">

                    <label
                        for="interview-answer"
                        class="form-label"
                    >
                        Your Answer
                    </label>

                    <textarea
                        id="interview-answer"
                        class="form-control"
                        rows="7"
                        placeholder="Type your answer here..."
                    ></textarea>

                </div>


                <div class="button-row">

                    <button
                        type="button"
                        id="generate-interview-question"
                        class="btn btn-primary"
                    >
                        Generate Question
                    </button>


                    <button
                        type="button"
                        id="submit-interview-answer"
                        class="btn btn-secondary"
                    >
                        Evaluate Answer
                    </button>

                </div>


                <div
                    id="interview-feedback"
                    class="interview-feedback"
                    style="display:none;"
                ></div>

            </div>


            <!-- AI ASSISTANT -->

            <div class="content-card">

                <div class="card-heading">

                    <div class="card-icon purple-bg">
                        🤖
                    </div>

                    <div>

                        <h2>
                            AI Interview Assistant
                        </h2>

                        <p>
                            Ask questions about your interview preparation.
                        </p>

                    </div>

                </div>


                <div class="career-url-row">

                    <input
                        type="text"
                        id="input-ai-prompt"
                        class="form-control"
                        placeholder="Ask an interview preparation question..."
                    >

                    <button
                        type="button"
                        id="btn-submit-ai-prompt"
                        class="btn btn-primary"
                    >
                        Ask AI
                    </button>

                </div>


                <div
                    id="ai-assistant-response-card"
                    class="ai-response"
                    style="display:none;"
                >

                    <h3 id="ai-response-title"></h3>

                    <div id="ai-response-body"></div>

                </div>

            </div>

        </section>


        <!-- ========================================================
             VIEW : REPORT
        ======================================================== -->

        <section
            id="view-report"
            class="view-panel"
        >

            <div class="page-heading">

                <span class="eyebrow">
                    CAREER REPORT
                </span>

                <h1>
                    Download Report
                </h1>

                <p>
                    Generate a PDF containing your career analysis,
                    ATS score and skill-gap information.
                </p>

            </div>


            <div class="content-card report-card">

                <div class="report-icon">
                    📑
                </div>

                <h2>
                    Student Career Analysis Report
                </h2>

                <p>
                    Your report uses the career target and
                    skills currently stored in your session.
                </p>


                <form
                    action="api.php?action=download_pdf"
                    method="POST"
                    target="_blank"
                >

                    <input
                        type="hidden"
                        id="report-target-company"
                        name="target_company"
                        value="<?php echo h($targetCompany); ?>"
                    >

                    <input
                        type="hidden"
                        id="report-target-role"
                        name="target_role"
                        value="<?php echo h($targetRole); ?>"
                    >


                    <button
                        type="submit"
                        class="btn btn-primary"
                    >
                        Download PDF Report
                    </button>

                </form>

            </div>

        </section>


        <!-- ========================================================
             VIEW : PROFILE
        ======================================================== -->

        <section
            id="view-profile"
            class="view-panel"
        >

            <div class="page-heading">

                <span class="eyebrow">
                    ACCOUNT
                </span>

                <h1>
                    Profile
                </h1>

                <p>
                    Manage your student information and
                    review your resume evaluation history.
                </p>

            </div>


            <div class="two-column-layout">

                <!-- PROFILE INFO -->

                <div class="content-card">

                    <div class="card-heading">

                        <div class="card-icon">
                            👤
                        </div>

                        <div>

                            <h2>
                                Student Profile
                            </h2>

                        </div>

                    </div>


                    <div class="profile-info">

                        <div class="profile-info-item">

                            <span>
                                Full Name
                            </span>

                            <strong>
                                <?php echo h(
                                    $user['name'] ?? ''
                                ); ?>
                            </strong>

                        </div>


                        <div class="profile-info-item">

                            <span>
                                Email
                            </span>

                            <strong>
                                <?php echo h(
                                    $user['email'] ?? ''
                                ); ?>
                            </strong>

                        </div>


                        <div class="profile-info-item">

                            <span>
                                University
                            </span>

                            <strong>
                                <?php echo h(
                                    $user['university'] ?? ''
                                ); ?>
                            </strong>

                        </div>


                        <div class="profile-info-item">

                            <span>
                                Branch
                            </span>

                            <strong>
                                <?php echo h(
                                    $user['branch'] ?? ''
                                ); ?>
                            </strong>

                        </div>


                        <div class="profile-info-item">

                            <span>
                                Graduation Year
                            </span>

                            <strong>
                                <?php echo h(
                                    $user['graduation_year'] ?? ''
                                ); ?>
                            </strong>

                        </div>

                    </div>

                </div>


                <!-- UPDATE PROFILE -->

                <div class="content-card">

                    <div class="card-heading">

                        <div class="card-icon cyan-bg">
                            ✏️
                        </div>

                        <div>

                            <h2>
                                Update Profile
                            </h2>

                        </div>

                    </div>


                    <form id="profile-form">

                        <div class="form-group">

                            <label
                                for="profile_name"
                                class="form-label"
                            >
                                Full Name
                            </label>

                            <input
                                type="text"
                                id="profile_name"
                                name="name"
                                class="form-control"
                                value="<?php echo h(
                                    $user['name'] ?? ''
                                ); ?>"
                            >

                        </div>


                        <div class="form-group">

                            <label
                                for="profile_email"
                                class="form-label"
                            >
                                Email
                            </label>

                            <input
                                type="email"
                                id="profile_email"
                                name="email"
                                class="form-control"
                                value="<?php echo h(
                                    $user['email'] ?? ''
                                ); ?>"
                                readonly
                            >

                        </div>


                        <div class="form-group">

                            <label
                                for="profile_university"
                                class="form-label"
                            >
                                University
                            </label>

                            <input
                                type="text"
                                id="profile_university"
                                name="university"
                                class="form-control"
                                value="<?php echo h(
                                    $user['university'] ?? ''
                                ); ?>"
                            >

                        </div>


                        <div class="form-group">

                            <label
                                for="profile_degree"
                                class="form-label"
                            >
                                Degree / Branch
                            </label>

                            <input
                                type="text"
                                id="profile_degree"
                                name="degree"
                                class="form-control"
                                value="<?php echo h(
                                    $user['branch'] ?? ''
                                ); ?>"
                            >

                        </div>


                        <div class="form-group">

                            <label
                                for="profile_major"
                                class="form-label"
                            >
                                Specialization
                            </label>

                            <input
                                type="text"
                                id="profile_major"
                                name="major"
                                class="form-control"
                                value="<?php echo h(
                                    $user['major'] ?? ''
                                ); ?>"
                            >

                        </div>


                        <div class="form-group">

                            <label
                                for="profile_gradyear"
                                class="form-label"
                            >
                                Graduation Year
                            </label>

                            <input
                                type="number"
                                id="profile_gradyear"
                                name="graduation_year"
                                class="form-control"
                                value="<?php echo h(
                                    $user['graduation_year'] ?? ''
                                ); ?>"
                            >

                        </div>


                        <div class="form-group">

                            <label
                                for="profile_linkedin"
                                class="form-label"
                            >
                                LinkedIn
                            </label>

                            <input
                                type="text"
                                id="profile_linkedin"
                                name="linkedin"
                                class="form-control"
                                value="<?php echo h(
                                    $user['linkedin'] ?? ''
                                ); ?>"
                            >

                        </div>


                        <div class="form-group">

                            <label
                                for="profile_github"
                                class="form-label"
                            >
                                GitHub
                            </label>

                            <input
                                type="text"
                                id="profile_github"
                                name="github"
                                class="form-control"
                                value="<?php echo h(
                                    $user['github'] ?? ''
                                ); ?>"
                            >

                        </div>


                        <button
                            type="submit"
                            class="btn btn-primary btn-block"
                        >
                            Save Profile
                        </button>


                        <div
                            id="profile-message"
                            class="status-area"
                        ></div>

                    </form>

                </div>

            </div>


            <!-- HISTORY -->

            <div class="content-card">

                <div class="card-heading">

                    <div class="card-icon">
                        📜
                    </div>

                    <div>

                        <h2>
                            Resume Evaluation History
                        </h2>

                        <p>
                            Previous resume analysis results
                        </p>

                    </div>

                </div>


                <?php if (!empty($resumeHistory)): ?>

                    <div class="table-wrapper">

                        <table class="data-table">

                            <thead>

                                <tr>

                                    <th>
                                        Date
                                    </th>

                                    <th>
                                        Resume
                                    </th>

                                    <th>
                                        ATS
                                    </th>

                                    <th>
                                        Readiness
                                    </th>

                                    <th>
                                        Confidence
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                <?php foreach ($resumeHistory as $history): ?>

                                    <tr>

                                        <td>
                                            <?php echo h(
                                                $history['created_at'] ?? ''
                                            ); ?>
                                        </td>

                                        <td>
                                            <?php echo h(
                                                $history['file_name'] ?? ''
                                            ); ?>
                                        </td>

                                        <td>
                                            <?php echo h(
                                                $history['ats_score'] ?? 0
                                            ); ?>/100
                                        </td>

                                        <td>
                                            <?php echo h(
                                                $history['readiness_score'] ?? 0
                                            ); ?>%
                                        </td>

                                        <td>
                                            <?php echo h(
                                                $history['confidence_score'] ?? 0
                                            ); ?>%
                                        </td>

                                    </tr>

                                <?php endforeach; ?>

                            </tbody>

                        </table>

                    </div>

                <?php else: ?>

                    <div class="empty-state">

                        <div class="empty-icon">
                            📄
                        </div>

                        <h3>
                            No resume history
                        </h3>

                        <p>
                            Your resume evaluations will appear here.
                        </p>

                    </div>

                <?php endif; ?>

            </div>

        </section>

    </main>

</div>

<?php endif; ?>


<!-- ================================================================
     APPLICATION DATA
================================================================ -->

<script>

window.APP_DATA = <?php
echo json_encode(
    $appData,
    JSON_UNESCAPED_SLASHES |
    JSON_UNESCAPED_UNICODE
);
?>;

</script>


<!-- ================================================================
     APPLICATION JAVASCRIPT
================================================================ -->

<script
    src="static/app.js?v=<?php echo time(); ?>"
></script>


</body>
</html>
