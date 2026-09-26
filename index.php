<?php
session_start();
require_once __DIR__ . '/db.php';

$user = $_SESSION['user'] ?? null;

$extractedSkills = $_SESSION['extracted_skills'] ?? [];
$atsScore = $_SESSION['ats_score'] ?? null;

$parsedResume = $_SESSION['parsed_resume'] ?? [];
$contact = $parsedResume['contact_info'] ?? [];

$careerUrl = $_SESSION['career_url'] ?? '';
$targetCompany = $_SESSION['target_company'] ?? '';
$targetRole = $_SESSION['target_role'] ?? '';
$requiredSkills = $_SESSION['required_skills'] ?? [];
$recommendedJob = $_SESSION['recommended_job'] ?? null;

function e($value)
{
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

$name = $contact['name'] ?? '';
$email = $contact['email'] ?? '';
$phone = $contact['phone'] ?? '';
$linkedin = $contact['linkedin'] ?? '';
$github = $contact['github'] ?? '';

if ($user && empty($name)) {
    $name = $user['name'] ?? '';
}

if ($user && empty($email)) {
    $email = $user['email'] ?? '';
}

$displayName = $name ?: ($user['name'] ?? 'Student');

$matchedSkills = [];
$missingSkills = [];

if (is_array($recommendedJob)) {
    $matchedSkills = $recommendedJob['matched_skills'] ?? [];
    $missingSkills = $recommendedJob['missing_skills'] ?? [];
}

$score = is_array($recommendedJob)
    ? ($recommendedJob['score'] ?? 0)
    : 0;
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
        content="Skill-Gap Predictor - Dynamic career navigation and skill analysis"
    >

    <title>Skill-Gap Predictor | Career Intelligence</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
        rel="stylesheet"
    >

    <link
        rel="stylesheet"
        href="static/styles.css?v=<?php echo time(); ?>"
    >
</head>

<body>

<div id="page-loader">
    <div class="loader-ring"></div>
    <div class="loader-text">Loading Skill-Gap Predictor...</div>
</div>

<div class="app-shell">

    <!-- =========================
         MOBILE OVERLAY
    ========================== -->
    <div id="sidebar-overlay" class="sidebar-overlay"></div>

    <!-- =========================
         SIDEBAR
    ========================== -->
    <aside id="sidebar" class="sidebar">

        <div class="sidebar-top">

            <div class="brand">
                <div class="brand-icon">
                    🎯
                </div>

                <div>
                    <div class="brand-title">
                        Skill-Gap
                    </div>

                    <div class="brand-subtitle">
                        Predictor
                    </div>
                </div>
            </div>

            <button
                type="button"
                id="sidebar-close"
                class="sidebar-close"
                aria-label="Close menu"
            >
                ×
            </button>

        </div>

        <?php if ($user): ?>

        <div class="profile-mini">

            <div class="profile-avatar">
                <?php echo strtoupper(substr($displayName, 0, 1)); ?>
            </div>

            <div class="profile-mini-info">

                <strong>
                    <?php echo e($displayName); ?>
                </strong>

                <span>
                    Student
                </span>

            </div>

        </div>

        <nav class="sidebar-nav">

            <div class="nav-section-title">
                MAIN
            </div>

            <button
                class="nav-item active"
                data-view="dashboard"
                type="button"
            >
                <span class="nav-icon">🏠</span>
                <span>Dashboard</span>
            </button>

            <button
                class="nav-item"
                data-view="resume"
                type="button"
            >
                <span class="nav-icon">📄</span>
                <span>ATS & Resume Parser</span>
            </button>

            <button
                class="nav-item"
                data-view="jobs"
                type="button"
            >
                <span class="nav-icon">💼</span>
                <span>Dynamic Job Ranking</span>
            </button>

            <button
                class="nav-item"
                data-view="roadmap"
                type="button"
            >
                <span class="nav-icon">🗺️</span>
                <span>Career Roadmap</span>
            </button>

            <button
                class="nav-item"
                data-view="interview"
                type="button"
            >
                <span class="nav-icon">🎙️</span>
                <span>AI Interview Prep</span>
            </button>

            <button
                class="nav-item"
                data-view="report"
                type="button"
            >
                <span class="nav-icon">📊</span>
                <span>Progress Report</span>
            </button>

            <div class="nav-section-title">
                ACCOUNT
            </div>

            <button
                class="nav-item"
                data-view="profile"
                type="button"
            >
                <span class="nav-icon">👤</span>
                <span>Profile Settings</span>
            </button>

        </nav>

        <div class="sidebar-bottom">

            <button
                type="button"
                id="theme-toggle"
                class="sidebar-action"
            >
                <span id="theme-icon">🌙</span>
                <span id="theme-text">Dark Mode</span>
            </button>

            <button
                type="button"
                id="logout-button"
                class="sidebar-action logout-action"
            >
                <span>🚪</span>
                <span>Log Out</span>
            </button>

        </div>

        <?php endif; ?>

    </aside>

    <!-- =========================
         MAIN AREA
    ========================== -->
    <main class="main-content">

        <!-- TOPBAR -->
        <header class="topbar">

            <div class="topbar-left">

                <button
                    type="button"
                    id="mobile-menu-toggle"
                    class="mobile-menu-toggle"
                    aria-label="Open menu"
                >
                    ☰
                </button>

                <div class="mobile-brand">
                    <span>🎯</span>
                    <strong>Skill-Gap Predictor</strong>
                </div>

            </div>

            <div class="topbar-right">

                <button
                    type="button"
                    id="top-theme-toggle"
                    class="icon-button"
                    title="Toggle theme"
                >
                    🌙
                </button>

            </div>

        </header>

        <!-- =========================
             AUTH SCREEN
        ========================== -->
        <section
            id="auth-screen"
            class="auth-screen"
            style="<?php echo $user ? 'display:none;' : ''; ?>"
        >

            <div class="auth-background-shape shape-one"></div>
            <div class="auth-background-shape shape-two"></div>
            <div class="auth-background-shape shape-three"></div>

            <div class="auth-container">

                <div class="auth-brand">

                    <div class="auth-logo">
                        🎯
                    </div>

                    <div class="auth-small-title">
                        Student Career Intelligence Portal
                    </div>

                    <h1>
                        Skill-Gap Predictor
                    </h1>

                    <p>
                        Dynamic Career Navigation & Skill Analysis
                    </p>

                </div>

                <div class="auth-card">

                    <div class="auth-tabs">

                        <button
                            type="button"
                            id="login-tab"
                            class="auth-tab active"
                        >
                            🔐 Student Login
                        </button>

                        <button
                            type="button"
                            id="signup-tab"
                            class="auth-tab"
                        >
                            ✨ Create Account
                        </button>

                    </div>

                    <!-- LOGIN -->

                    <div
                        id="login-panel"
                        class="auth-panel active"
                    >

                        <div class="form-heading">
                            <h2>
                                Welcome back
                            </h2>

                            <p>
                                Sign in to continue your career analysis.
                            </p>
                        </div>

                        <form id="login-form">

                            <div class="form-group">

                                <label>
                                    Email Address
                                </label>

                                <div class="input-wrapper">

                                    <span class="input-icon">
                                        ✉️
                                    </span>

                                    <input
                                        type="email"
                                        id="login_email"
                                        class="form-control"
                                        placeholder="Enter your email"
                                        autocomplete="email"
                                        required
                                    >

                                </div>

                            </div>

                            <div class="form-group">

                                <label>
                                    Password
                                </label>

                                <div class="input-wrapper">

                                    <span class="input-icon">
                                        🔒
                                    </span>

                                    <input
                                        type="password"
                                        id="login_password"
                                        class="form-control"
                                        placeholder="Enter your password"
                                        autocomplete="current-password"
                                        required
                                    >

                                    <button
                                        type="button"
                                        class="password-toggle"
                                        id="toggle-login-password"
                                    >
                                        👁️
                                    </button>

                                </div>

                            </div>

                            <button
                                type="submit"
                                id="btn-do-login"
                                class="primary-button full-width"
                            >
                                <span>Sign In</span>
                                <span>→</span>
                            </button>

                            <div
                                id="login-message"
                                class="form-message"
                            ></div>

                        </form>

                    </div>

                    <!-- SIGNUP -->

                    <div
                        id="signup-panel"
                        class="auth-panel"
                    >

                        <div class="form-heading">

                            <h2>
                                Create your account
                            </h2>

                            <p>
                                Start building your personalized career path.
                            </p>

                        </div>

                        <form id="signup-form">

                            <div class="form-row">

                                <div class="form-group">

                                    <label>
                                        Full Name
                                    </label>

                                    <input
                                        type="text"
                                        id="signup_name"
                                        class="form-control"
                                        placeholder="Enter your full name"
                                        required
                                    >

                                </div>

                                <div class="form-group">

                                    <label>
                                        Email Address
                                    </label>

                                    <input
                                        type="email"
                                        id="signup_email"
                                        class="form-control"
                                        placeholder="Enter your email"
                                        required
                                    >

                                </div>

                            </div>

                            <div class="form-group">

                                <label>
                                    Create Password
                                </label>

                                <div class="input-wrapper">

                                    <input
                                        type="password"
                                        id="signup_pwd"
                                        class="form-control"
                                        placeholder="Minimum 8 characters"
                                        minlength="8"
                                        required
                                    >

                                    <button
                                        type="button"
                                        class="password-toggle"
                                        id="toggle-signup-password"
                                    >
                                        👁️
                                    </button>

                                </div>

                                <small class="form-help">
                                    At least 8 characters with uppercase,
                                    lowercase, number and special character.
                                </small>

                            </div>

                            <div class="form-row">

                                <div class="form-group">

                                    <label>
                                        University / College
                                    </label>

                                    <input
                                        type="text"
                                        id="signup_uni"
                                        class="form-control"
                                        placeholder="Enter your university"
                                    >

                                </div>

                                <div class="form-group">

                                    <label>
                                        Degree
                                    </label>

                                    <input
                                        type="text"
                                        id="signup_branch"
                                        class="form-control"
                                        placeholder="e.g. B.Tech"
                                    >

                                </div>

                            </div>

                            <div class="form-row">

                                <div class="form-group">

                                    <label>
                                        Branch / Specialization
                                    </label>

                                    <input
                                        type="text"
                                        id="signup_major"
                                        class="form-control"
                                        placeholder="e.g. CSE"
                                    >

                                </div>

                                <div class="form-group">

                                    <label>
                                        Graduation Year
                                    </label>

                                    <select
                                        id="signup_gradyear"
                                        class="form-control"
                                    >

                                        <option value="">
                                            Select year
                                        </option>

                                        <?php
                                        for ($year = date('Y'); $year <= date('Y') + 8; $year++) {
                                            echo '<option value="' . $year . '">' . $year . '</option>';
                                        }
                                        ?>

                                    </select>

                                </div>

                            </div>

                            <div class="form-group">

                                <label>
                                    LinkedIn Profile
                                    <span class="optional">
                                        Optional
                                    </span>
                                </label>

                                <input
                                    type="url"
                                    id="signup_linkedin"
                                    class="form-control"
                                    placeholder="https://linkedin.com/in/yourname"
                                >

                            </div>

                            <div class="form-group">

                                <label>
                                    GitHub Profile
                                    <span class="optional">
                                        Optional
                                    </span>
                                </label>

                                <input
                                    type="url"
                                    id="signup_github"
                                    class="form-control"
                                    placeholder="https://github.com/yourusername"
                                >

                            </div>

                            <label class="terms-check">

                                <input
                                    type="checkbox"
                                    id="signup-terms"
                                >

                                <span>
                                    I agree to the
                                    <a href="#">
                                        Terms of Service
                                    </a>
                                    and
                                    <a href="#">
                                        Privacy Policy
                                    </a>.
                                </span>

                            </label>

                            <button
                                id="btn-do-signup"
                                class="primary-button full-width"
                                type="submit"
                                disabled
                            >
                                <span>Create Account</span>
                                <span>→</span>
                            </button>

                            <div
                                id="signup-message"
                                class="form-message"
                            ></div>

                        </form>

                    </div>

                </div>

                <div class="auth-footer">
                    © <?php echo date('Y'); ?> Skill-Gap Predictor
                </div>

            </div>

        </section>

        <?php if ($user): ?>

        <!-- =========================
             DASHBOARD APP
        ========================== -->

        <div
            id="dashboard-app"
            class="dashboard-app"
        >

            <!-- DASHBOARD -->

            <section
                id="view-dashboard"
                class="view-panel active-view"
            >

                <div class="hero-card">

                    <div class="hero-content">

                        <span class="hero-badge">
                            ✨ Career Intelligence
                        </span>

                        <h1>
                            Hello,
                            <?php echo e($displayName); ?> 👋
                        </h1>

                        <p>
                            Discover the job role that matches your skills
                            using a real career page and your actual resume.
                        </p>

                        <div class="hero-actions">

                            <button
                                type="button"
                                class="primary-button"
                                data-open-view="resume"
                            >
                                Analyze My Resume →
                            </button>

                            <button
                                type="button"
                                class="secondary-button"
                                data-open-view="jobs"
                            >
                                Explore Jobs
                            </button>

                        </div>

                    </div>

                    <div class="hero-visual">

                        <div class="floating-orb orb-one"></div>
                        <div class="floating-orb orb-two"></div>
                        <div class="floating-orb orb-three"></div>

                        <div class="career-icon">
                            🎯
                        </div>

                    </div>

                </div>

                <!-- CAREER URL -->

                <div class="section-header">

                    <div>
                        <span class="section-kicker">
                            STEP 1
                        </span>

                        <h2>
                            Add a Career / Jobs URL
                        </h2>

                        <p>
                            Paste the careers page you want the system to analyze.
                        </p>
                    </div>

                </div>

                <div class="url-card">

                    <div class="url-input-container">

                        <span class="url-icon">
                            🔗
                        </span>

                        <input
                            type="url"
                            id="career-url"
                            class="career-url-input"
                            placeholder="https://company.com/careers"
                            value="<?php echo e($careerUrl); ?>"
                        >

                        <button
                            type="button"
                            id="scrape-career-url"
                            class="primary-button"
                        >
                            Analyze Careers
                        </button>

                    </div>

                    <div
                        id="scrape-status"
                        class="status-message"
                    ></div>

                </div>

                <!-- STATS -->

                <div class="stats-grid">

                    <div class="stat-card">

                        <div class="stat-icon blue">
                            🧠
                        </div>

                        <div>
                            <span class="stat-label">
                                Resume Skills
                            </span>

                            <strong id="stat-skills">
                                <?php echo count($extractedSkills); ?>
                            </strong>
                        </div>

                    </div>

                    <div class="stat-card">

                        <div class="stat-icon purple">
                            📄
                        </div>

                        <div>
                            <span class="stat-label">
                                ATS Score
                            </span>

                            <strong id="stat-ats">
                                <?php
                                echo $atsScore !== null
                                    ? e(round((float)$atsScore)) . '%'
                                    : '—';
                                ?>
                            </strong>
                        </div>

                    </div>

                    <div class="stat-card">

                        <div class="stat-icon green">
                            💼
                        </div>

                        <div>
                            <span class="stat-label">
                                Jobs Found
                            </span>

                            <strong id="stat-jobs">
                                0
                            </strong>
                        </div>

                    </div>

                    <div class="stat-card">

                        <div class="stat-icon orange">
                            🎯
                        </div>

                        <div>
                            <span class="stat-label">
                                Match Score
                            </span>

                            <strong id="stat-match">
                                <?php
                                echo $score > 0
                                    ? e(round((float)$score)) . '%'
                                    : '—';
                                ?>
                            </strong>
                        </div>

                    </div>

                </div>

                <!-- RECOMMENDATION -->

                <div
                    id="recommendation-card"
                    class="recommendation-card <?php echo $recommendedJob ? 'has-result' : ''; ?>"
                >

                    <?php if ($recommendedJob): ?>

                        <div class="recommendation-top">

                            <span class="success-badge">
                                ✓ Recommended Match
                            </span>

                            <span class="match-score">
                                <?php echo e(round((float)$score)); ?>%
                            </span>

                        </div>

                        <h2>
                            <?php echo e($targetRole ?: 'Recommended Job Role'); ?>
                        </h2>

                        <?php if ($targetCompany): ?>

                            <p class="company-name">
                                <?php echo e($targetCompany); ?>
                            </p>

                        <?php endif; ?>

                    <?php else: ?>

                        <div class="empty-recommendation">

                            <div class="empty-icon">
                                🎯
                            </div>

                            <div>

                                <h3>
                                    Your dynamic recommendation will appear here
                                </h3>

                                <p>
                                    Add a career URL and upload your resume.
                                    The system will compare the actual jobs
                                    with your actual skills.
                                </p>

                            </div>

                        </div>

                    <?php endif; ?>

                </div>

            </section>

            <!-- RESUME -->

            <section
                id="view-resume"
                class="view-panel"
            >

                <div class="page-heading">

                    <span class="section-kicker">
                        RESUME INTELLIGENCE
                    </span>

                    <h1>
                        ATS & Resume Parser
                    </h1>

                    <p>
                        Upload your real resume to extract skills,
                        contact details and ATS signals.
                    </p>

                </div>

                <div class="resume-grid">

                    <div class="glass-card">

                        <div class="card-heading">

                            <div class="card-icon">
                                📄
                            </div>

                            <div>
                                <h3>
                                    Upload Resume
                                </h3>

                                <p>
                                    PDF or DOCX
                                </p>
                            </div>

                        </div>

                        <div
                            id="resume-drop-zone"
                            class="upload-zone"
                        >

                            <div class="upload-icon">
                                ☁️
                            </div>

                            <h3>
                                Drop your resume here
                            </h3>

                            <p>
                                or click to choose a file
                            </p>

                            <input
                                type="file"
                                id="resume-file"
                                accept=".pdf,.docx"
                            >

                        </div>

                        <button
                            type="button"
                            id="evaluate-resume"
                            class="primary-button full-width"
                        >
                            🚀 Evaluate Resume ATS
                        </button>

                        <div
                            id="resume-status"
                            class="status-message"
                        ></div>

                    </div>

                    <div class="glass-card">

                        <div class="card-heading">

                            <div class="card-icon">
                                🔎
                            </div>

                            <div>
                                <h3>
                                    Extracted Signals
                                </h3>

                                <p>
                                    Detected from your resume
                                </p>

                            </div>

                        </div>

                        <div class="signals-list">

                            <div class="signal-row">
                                <span>Name</span>
                                <strong id="resume-name">
                                    <?php echo e($name ?: 'N/A'); ?>
                                </strong>
                            </div>

                            <div class="signal-row">
                                <span>Email</span>
                                <strong id="resume-email">
                                    <?php echo e($email ?: 'N/A'); ?>
                                </strong>
                            </div>

                            <div class="signal-row">
                                <span>Phone</span>
                                <strong id="resume-phone">
                                    <?php echo e($phone ?: 'N/A'); ?>
                                </strong>
                            </div>

                            <div class="signal-row">
                                <span>LinkedIn</span>
                                <strong id="resume-linkedin">
                                    <?php echo e($linkedin ?: 'N/A'); ?>
                                </strong>
                            </div>

                            <div class="signal-row">
                                <span>GitHub</span>
                                <strong id="resume-github">
                                    <?php echo e($github ?: 'N/A'); ?>
                                </strong>
                            </div>

                            <div class="signal-row">
                                <span>Word Count</span>
                                <strong id="resume-word-count">
                                    <?php echo e($parsedResume['word_count'] ?? 0); ?>
                                </strong>
                            </div>

                        </div>

                    </div>

                </div>

                <div class="glass-card skills-card">

                    <div class="card-heading">

                        <div class="card-icon">
                            🧠
                        </div>

                        <div>
                            <h3>
                                Extracted Skills
                            </h3>

                            <p>
                                Skills detected from your actual resume
                            </p>
                        </div>

                    </div>

                    <div
                        id="extracted-skills-container"
                        class="skill-cloud"
                    >

                        <?php if ($extractedSkills): ?>

                            <?php foreach ($extractedSkills as $skill): ?>

                                <span class="skill-pill">
                                    <?php echo e($skill); ?>
                                </span>

                            <?php endforeach; ?>

                        <?php else: ?>

                            <span class="empty-text">
                                No skills extracted yet.
                            </span>

                        <?php endif; ?>

                    </div>

                </div>

            </section>

            <!-- JOBS -->

            <section
                id="view-jobs"
                class="view-panel"
            >

                <div class="page-heading">

                    <span class="section-kicker">
                        DYNAMIC JOB DISCOVERY
                    </span>

                    <h1>
                        Dynamic Job Ranking
                    </h1>

                    <p>
                        Jobs are ranked from the career URL you provide.
                        No predefined company or role is used.
                    </p>

                </div>

                <div class="glass-card">

                    <div class="card-heading">

                        <div class="card-icon">
                            💼
                        </div>

                        <div>
                            <h3>
                                Career URL
                            </h3>

                            <p>
                                Change the source whenever you want.
                            </p>

                        </div>

                    </div>

                    <div class="url-input-container">

                        <input
                            type="url"
                            id="jobs-career-url"
                            class="career-url-input"
                            placeholder="https://example.com/careers"
                            value="<?php echo e($careerUrl); ?>"
                        >

                        <button
                            type="button"
                            id="rank-career-jobs"
                            class="primary-button"
                        >
                            Find & Rank Jobs
                        </button>

                    </div>

                </div>

                <div
                    id="job-results"
                    class="job-results"
                >

                    <div class="empty-state">

                        <div class="empty-state-icon">
                            💼
                        </div>

                        <h3>
                            No career jobs loaded
                        </h3>

                        <p>
                            Enter a career URL to discover available roles.
                        </p>

                    </div>

                </div>

            </section>

            <!-- ROADMAP -->

            <section
                id="view-roadmap"
                class="view-panel"
            >

                <div class="page-heading">

                    <span class="section-kicker">
                        CAREER DEVELOPMENT
                    </span>

                    <h1>
                        Career Roadmap
                    </h1>

                    <p>
                        Build a learning path around your recommended role
                        and missing skills.
                    </p>

                </div>

                <div
                    id="roadmap-content"
                    class="roadmap-container"
                >

                    <div class="empty-state">

                        <div class="empty-state-icon">
                            🗺️
                        </div>

                        <h3>
                            Roadmap not generated yet
                        </h3>

                        <p>
                            First analyze your resume and career URL.
                        </p>

                    </div>

                </div>

            </section>

            <!-- INTERVIEW -->

            <section
                id="view-interview"
                class="view-panel"
            >

                <div class="page-heading">

                    <span class="section-kicker">
                        INTERVIEW PREPARATION
                    </span>

                    <h1>
                        AI Interview Prep
                    </h1>

                    <p>
                        Practice questions based on your dynamically
                        selected job role.
                    </p>

                </div>

                <div class="interview-grid">

                    <div class="glass-card interview-question-card">

                        <div class="question-label">
                            CURRENT QUESTION
                        </div>

                        <h2 id="interview-question">
                            Start your interview preparation
                        </h2>

                        <textarea
                            id="interview-answer"
                            class="answer-box"
                            placeholder="Type your answer here..."
                        ></textarea>

                        <button
                            type="button"
                            id="submit-interview-answer"
                            class="primary-button"
                        >
                            Submit Answer →
                        </button>

                    </div>

                    <div class="glass-card">

                        <div class="card-heading">

                            <div class="card-icon">
                                🤖
                            </div>

                            <div>
                                <h3>
                                    AI Feedback
                                </h3>

                                <p>
                                    Feedback will appear here.
                                </p>

                            </div>

                        </div>

                        <div id="interview-feedback">
                            <div class="empty-text">
                                No answer evaluated yet.
                            </div>
                        </div>

                    </div>

                </div>

            </section>

            <!-- REPORT -->

            <section
                id="view-report"
                class="view-panel"
            >

                <div class="page-heading">

                    <span class="section-kicker">
                        PERFORMANCE REPORT
                    </span>

                    <h1>
                        Progress Report
                    </h1>

                    <p>
                        Generate a report using your actual analysis results.
                    </p>

                </div>

                <div class="report-card">

                    <div class="report-icon">
                        📊
                    </div>

                    <h2>
                        Generate your career analysis report
                    </h2>

                    <p>
                        Your report can contain ATS score, extracted skills,
                        matched skills, missing skills and recommended role.
                    </p>

                    <form
                        action="api.php?action=download_pdf"
                        method="POST"
                        target="_blank"
                    >

                        <input
                            type="hidden"
                            name="target_company"
                            value="<?php echo e($targetCompany); ?>"
                        >

                        <input
                            type="hidden"
                            name="target_role"
                            value="<?php echo e($targetRole); ?>"
                        >

                        <button
                            type="submit"
                            class="primary-button"
                        >
                            📥 Download Progress Report
                        </button>

                    </form>

                </div>

            </section>

            <!-- PROFILE -->

            <section
                id="view-profile"
                class="view-panel"
            >

                <div class="page-heading">

                    <span class="section-kicker">
                        ACCOUNT
                    </span>

                    <h1>
                        Profile Settings
                    </h1>

                    <p>
                        Manage your student profile information.
                    </p>

                </div>

                <div class="glass-card profile-card">

                    <form id="profile-form">

                        <div class="form-row">

                            <div class="form-group">

                                <label>
                                    Full Name
                                </label>

                                <input
                                    type="text"
                                    id="profile_name"
                                    class="form-control"
                                    value="<?php echo e($user['name'] ?? ''); ?>"
                                >

                            </div>

                            <div class="form-group">

                                <label>
                                    Email
                                </label>

                                <input
                                    type="email"
                                    id="profile_email"
                                    class="form-control"
                                    value="<?php echo e($user['email'] ?? ''); ?>"
                                    readonly
                                >

                            </div>

                        </div>

                        <div class="form-row">

                            <div class="form-group">

                                <label>
                                    University / College
                                </label>

                                <input
                                    type="text"
                                    id="profile_university"
                                    class="form-control"
                                    value="<?php echo e($user['university'] ?? ''); ?>"
                                >

                            </div>

                            <div class="form-group">

                                <label>
                                    Degree
                                </label>

                                <input
                                    type="text"
                                    id="profile_degree"
                                    class="form-control"
                                    value="<?php echo e($user['degree'] ?? ''); ?>"
                                >

                            </div>

                        </div>

                        <div class="form-row">

                            <div class="form-group">

                                <label>
                                    Branch
                                </label>

                                <input
                                    type="text"
                                    id="profile_major"
                                    class="form-control"
                                    value="<?php echo e($user['major'] ?? ''); ?>"
                                >

                            </div>

                            <div class="form-group">

                                <label>
                                    Graduation Year
                                </label>

                                <input
                                    type="text"
                                    id="profile_gradyear"
                                    class="form-control"
                                    value="<?php echo e($user['graduation_year'] ?? ''); ?>"
                                >

                            </div>

                        </div>

                        <div class="form-row">

                            <div class="form-group">

                                <label>
                                    LinkedIn
                                </label>

                                <input
                                    type="url"
                                    id="profile_linkedin"
                                    class="form-control"
                                    value="<?php echo e($user['linkedin'] ?? ''); ?>"
                                >

                            </div>

                            <div class="form-group">

                                <label>
                                    GitHub
                                </label>

                                <input
                                    type="url"
                                    id="profile_github"
                                    class="form-control"
                                    value="<?php echo e($user['github'] ?? ''); ?>"
                                >

                            </div>

                        </div>

                        <button
                            type="submit"
                            class="primary-button"
                        >
                            Save Profile
                        </button>

                        <div
                            id="profile-message"
                            class="form-message"
                        ></div>

                    </form>

                </div>

            </section>

        </div>

        <?php endif; ?>

    </main>

</div>

<!-- GLOBAL DATA -->

<script>
window.APP_DATA = <?php echo json_encode([
    'loggedIn' => (bool)$user,
    'user' => $user,
    'careerUrl' => $careerUrl,
    'targetCompany' => $targetCompany,
    'targetRole' => $targetRole,
    'requiredSkills' => $requiredSkills,
    'extractedSkills' => $extractedSkills,
    'atsScore' => $atsScore,
    'recommendedJob' => $recommendedJob
], JSON_UNESCAPED_SLASHES); ?>;
</script>

<script src="static/app.js?v=<?php echo time(); ?>"></script>

</body>
</html>
