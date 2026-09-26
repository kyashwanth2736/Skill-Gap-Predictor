<?php
/**
 * Skill-Gap Predictor
 * Dynamic Career URL + Resume Based Job Matching
 */

session_start();
require_once __DIR__ . '/db.php';

$user = $_SESSION['user'] ?? null;

$parsed = $_SESSION['parsed_resume'] ?? [];
$contact = $parsed['contact_info'] ?? [];

$name = !empty($contact['name'])
    ? trim($contact['name'])
    : 'N/A';

$email = !empty($contact['email'])
    ? trim($contact['email'])
    : 'N/A';

$phone = !empty($contact['phone'])
    ? trim($contact['phone'])
    : 'N/A';

$linkedin = !empty($contact['linkedin'])
    ? trim($contact['linkedin'])
    : 'N/A';

$github = !empty($contact['github'])
    ? trim($contact['github'])
    : 'N/A';

$careerUrl = $_SESSION['career_url'] ?? '';
$careerJobs = $_SESSION['career_jobs'] ?? [];

$targetCompany = $_SESSION['target_company'] ?? '';
$targetRole = $_SESSION['target_role'] ?? '';

$requiredSkills = $_SESSION['required_skills'] ?? [];
$recommendedJob = $_SESSION['recommended_job'] ?? null;

$extractedSkills = $_SESSION['extracted_skills'] ?? [];
$atsScore = $_SESSION['ats_score'] ?? null;

function formatSocialUrl($url)
{
    if (empty($url) || $url === 'N/A') {
        return null;
    }

    $url = trim($url);

    if (
        strpos($url, 'http://') === 0 ||
        strpos($url, 'https://') === 0
    ) {
        return $url;
    }

    return 'https://' . ltrim($url, '/');
}

$linkedinUrl = formatSocialUrl($linkedin);
$githubUrl = formatSocialUrl($github);
?>
<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Skill-Gap Predictor</title>

    <link
        rel="stylesheet"
        href="static/styles.css"
    >

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <script>
        window.EXTRACTED_SKILLS =
            <?php echo json_encode($extractedSkills); ?>;

        window.ATS_SCORE =
            <?php echo json_encode($atsScore); ?>;

        window.CAREER_URL =
            <?php echo json_encode($careerUrl); ?>;

        window.CAREER_JOBS =
            <?php echo json_encode($careerJobs); ?>;

        window.TARGET_COMPANY =
            <?php echo json_encode($targetCompany); ?>;

        window.TARGET_ROLE =
            <?php echo json_encode($targetRole); ?>;

        window.REQUIRED_SKILLS =
            <?php echo json_encode($requiredSkills); ?>;

        window.RECOMMENDED_JOB =
            <?php echo json_encode($recommendedJob); ?>;
    </script>

</head>

<body>

<?php if (!$user): ?>

<!-- ========================================================= -->
<!-- LOGIN / SIGNUP -->
<!-- ========================================================= -->

<div class="auth-wrapper">

    <div class="auth-card">

        <div
            class="main-header-banner"
            style="text-align:center;padding:20px;"
        >

            <span class="student-badge">
                🎓 Student Career Intelligence Portal
            </span>

            <h2
                class="header-title"
                style="font-size:22px;"
            >
                Skill-Gap Predictor
            </h2>

            <p
                class="header-subtitle"
                style="font-size:13px;"
            >
                Dynamic Career Navigation & Skill Analysis
            </p>

        </div>

        <div class="auth-tabs">

            <div
                class="auth-tab active"
                id="tab-btn-login"
            >
                🔐 Student Login
            </div>

            <div
                class="auth-tab"
                id="tab-btn-signup"
            >
                📝 Create Account
            </div>

        </div>

        <!-- LOGIN -->

        <div id="form-login-box">

            <div
                id="login-error-msg"
                class="alert alert-error"
                style="display:none;"
            ></div>

            <div class="form-group">

                <label class="form-label">
                    University / Student Email
                </label>

                <input
                    type="email"
                    id="login_email"
                    class="form-control"
                    placeholder="Enter your email"
                    autocomplete="username"
                >

            </div>

            <div class="form-group">

                <label class="form-label">
                    Password
                </label>

                <div class="password-field">

                    <input
                        type="password"
                        id="login_password"
                        class="form-control"
                        placeholder="Enter your password"
                        autocomplete="current-password"
                    >

                    <button
                        type="button"
                        class="password-toggle-btn"
                        id="toggle-login-password"
                    >
                        👁️
                    </button>

                </div>

            </div>

            <button
                id="btn-do-login"
                class="btn btn-block"
                type="button"
            >
                🚀 Log In
            </button>

        </div>

        <!-- SIGNUP -->

        <div
            id="form-signup-box"
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
                    Full Name
                </label>

                <input
                    type="text"
                    id="signup_name"
                    class="form-control"
                    placeholder="Enter your full name"
                >

            </div>

            <div class="form-group">

                <label class="form-label">
                    Email Address
                </label>

                <input
                    type="email"
                    id="signup_email"
                    class="form-control"
                    placeholder="Enter your email"
                >

            </div>

            <div class="form-group">

                <label class="form-label">
                    Create Password
                </label>

                <div class="password-field">

                    <input
                        type="password"
                        id="signup_pwd"
                        class="form-control"
                        placeholder="Minimum 8 characters"
                        minlength="8"
                    >

                    <button
                        type="button"
                        class="password-toggle-btn"
                        id="toggle-signup-password"
                    >
                        👁️
                    </button>

                </div>

                <small class="password-help">
                    Password must contain at least 8 characters,
                    including uppercase, lowercase, number and special
                    character.
                </small>

            </div>

            <div class="form-group">

                <label class="form-label">
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

                <label class="form-label">
                    Branch / Degree
                </label>

                <input
                    type="text"
                    id="signup_branch"
                    class="form-control"
                    placeholder="e.g. Computer Science & Engineering"
                >

            </div>

            <div class="form-group">

                <label class="form-label">
                    Graduation Year
                </label>

                <select
                    id="signup_year"
                    class="form-control"
                >

                    <option value="">
                        Select year
                    </option>

                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                    <option value="2029">2029</option>
                    <option value="2030">2030</option>

                </select>

            </div>

            <div
                class="form-group"
                style="margin-top:12px;"
            >

                <label class="terms-label">

                    <input
                        type="checkbox"
                        id="signup-terms"
                    >

                    <span>
                        By signing up, you agree to our
                        <a href="#" target="_blank">
                            Terms of Service
                        </a>
                        and
                        <a href="#" target="_blank">
                            Privacy Policy
                        </a>.
                    </span>

                </label>

            </div>

            <button
                id="btn-do-signup"
                class="btn btn-block"
                type="button"
                disabled
            >
                ✨ Register Account
            </button>

        </div>

    </div>

</div>

<?php else: ?>

<!-- ========================================================= -->
<!-- MAIN APPLICATION -->
<!-- ========================================================= -->

<div class="app-container">

    <!-- SIDEBAR -->

    <aside class="sidebar">

        <div class="sidebar-user-card">

            <div class="user-icon">
                👤
            </div>

            <div
                class="sidebar-user-name"
            >
                <?php
                echo htmlspecialchars(
                    $user['name'] ?? 'Student'
                );
                ?>
            </div>

            <div
                class="sidebar-user-email"
            >
                <?php
                echo htmlspecialchars(
                    $user['email'] ?? ''
                );
                ?>
            </div>

            <div class="sidebar-user-branch">

                <?php
                echo htmlspecialchars(
                    $user['branch'] ?? ''
                );
                ?>

            </div>

            <button
                id="btn-logout"
                class="btn btn-secondary"
                type="button"
            >
                🚪 Log Out
            </button>

        </div>

        <!-- CAREER URL -->

        <div class="career-sidebar-panel">

            <h4>
                🌐 Career URL
            </h4>

            <p>
                Enter a company career page or jobs page.
                Available roles will be extracted dynamically.
            </p>

            <input
                type="url"
                id="input-career-url"
                class="form-control"
                placeholder="https://company.com/careers"
                value="<?php
                echo htmlspecialchars($careerUrl);
                ?>"
            >

            <button
                type="button"
                id="btn-analyze-career-url"
                class="btn btn-block"
            >
                🔎 Analyze Career URL
            </button>

            <div
                id="career-url-status"
                style="display:none;"
            ></div>

        </div>

        <!-- NAVIGATION -->

        <nav class="nav-menu">

            <a
                class="nav-item active"
                data-view="view-analytics"
            >
                📊 Dashboard
            </a>

            <a
                class="nav-item"
                data-view="view-resume"
            >
                📄 ATS & Resume Parser
            </a>

            <a
                class="nav-item"
                data-view="view-skillgap"
            >
                🎯 Skill-Gap Predictor
            </a>

            <a
                class="nav-item"
                data-view="view-jobranking"
            >
                💼 Job Recommendations
            </a>

            <a
                class="nav-item"
                data-view="view-roadmap"
            >
                🗺️ Career Roadmap
            </a>

            <a
                class="nav-item"
                data-view="view-interview"
            >
                🎙️ AI Interview Prep
            </a>

            <a
                class="nav-item"
                data-view="view-report"
            >
                📑 Download Report
            </a>

            <a
                class="nav-item"
                data-view="view-profile"
            >
                👤 Profile
            </a>

        </nav>

    </aside>

    <!-- MAIN -->

    <main class="main-content">

        <!-- MOBILE TOPBAR -->

        <div class="mobile-topbar">

            <button
                type="button"
                id="mobile-menu-toggle"
                class="icon-btn"
                aria-label="Open menu"
            >
                ☰
            </button>

            <div class="mobile-brand">
                Skill-Gap Predictor
            </div>

            <button
                type="button"
                id="theme-toggle"
                class="icon-btn"
                aria-label="Toggle theme"
            >
                🌙
            </button>

        </div>

        <div
            id="sidebar-overlay"
            class="sidebar-overlay"
        ></div>

        <!-- HEADER -->

        <div class="main-header-banner">

            <span class="student-badge">
                ⚡ Career Navigation AI
            </span>

            <h1
                class="header-title"
                id="banner-company-role"
            >
                Skill-Gap Predictor
            </h1>

            <p class="header-subtitle">
                Analyze your resume against real jobs
                obtained from the career URL you provide.
            </p>

        </div>

        <!-- ===================================================== -->
        <!-- DASHBOARD -->
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
                        N/A
                    </span>

                    <span class="metric-subtext">
                        Based on uploaded resume
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
                        N/A
                    </span>

                    <span
                        class="metric-subtext"
                        id="metric-matched-count"
                    >
                        Analyze a career URL
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
                        N/A
                    </span>

                    <span class="metric-subtext">
                        Based on available job data
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
                        N/A
                    </span>

                    <span class="metric-subtext">
                        Resume analysis
                    </span>

                </div>

            </div>

            <!-- RESUME SKILLS -->

            <div class="section-panel">

                <h4>
                    🧠 Extracted Resume Skills
                </h4>

                <div id="dashboard-extracted-skills">

                    <?php if (!empty($extractedSkills)): ?>

                        <?php foreach ($extractedSkills as $skill): ?>

                            <span class="skill-tag-matched">
                                <?php
                                echo htmlspecialchars($skill);
                                ?>
                            </span>

                        <?php endforeach; ?>

                    <?php else: ?>

                        <p class="muted">
                            Upload a resume to detect skills.
                        </p>

                    <?php endif; ?>

                </div>

            </div>

            <!-- RECOMMENDATION -->

            <div
                id="dashboard-recommendation"
                class="section-panel"
            >

                <?php if ($recommendedJob): ?>

                    <div id="recommended-job-content"></div>

                <?php else: ?>

                    <h3>
                        🎯 Job Recommendation
                    </h3>

                    <p class="muted">
                        Enter a career URL and upload your
                        resume to generate a dynamic recommendation.
                    </p>

                <?php endif; ?>

            </div>

            <!-- CHARTS -->

            <div class="charts-grid">

                <div class="chart-card">

                    <h4>
                        🎯 Placement Competency
                    </h4>

                    <div class="chart-container">
                        <canvas id="radarChartCtx"></canvas>
                    </div>

                </div>

                <div class="chart-card">

                    <h4>
                        🌐 Skill Distribution
                    </h4>

                    <div class="chart-container">
                        <canvas id="pieChartCtx"></canvas>
                    </div>

                </div>

            </div>

        </section>

        <!-- ===================================================== -->
        <!-- RESUME -->
        <!-- ===================================================== -->

        <section
            id="view-resume"
            class="view-panel"
            style="display:none;"
        >

            <h3>
                📄 Resume Parsing & ATS Evaluation
            </h3>

            <p class="muted">
                Upload your actual PDF or DOCX resume.
                All detected information comes from the uploaded file.
            </p>

            <div
                id="resume-upload-status"
                style="display:none;"
            ></div>

            <div class="two-column-grid">

                <div class="section-panel">

                    <form
                        id="form-resume-upload"
                        enctype="multipart/form-data"
                    >

                        <div class="form-group">

                            <label class="form-label">
                                Resume File
                            </label>

                            <input
                                type="file"
                                id="input-resume-file"
                                accept=".pdf,.docx,.txt"
                                class="form-control"
                            >

                        </div>

                        <button
                            type="submit"
                            class="btn btn-block"
                        >
                            🚀 Evaluate Resume
                        </button>

                    </form>

                </div>

                <div class="section-panel">

                    <h4>
                        🔍 Extracted Resume Information
                    </h4>

                    <p>
                        <strong>Name:</strong>
                        <code>
                            <?php echo htmlspecialchars($name); ?>
                        </code>
                    </p>

                    <p>
                        <strong>Email:</strong>
                        <code>
                            <?php echo htmlspecialchars($email); ?>
                        </code>
                    </p>

                    <p>
                        <strong>Phone:</strong>
                        <code>
                            <?php echo htmlspecialchars($phone); ?>
                        </code>
                    </p>

                    <p>
                        <strong>LinkedIn:</strong>

                        <?php if ($linkedinUrl): ?>

                            <a
                                href="<?php echo htmlspecialchars($linkedinUrl); ?>"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="extracted-link"
                            >
                                <?php
                                echo htmlspecialchars($linkedin);
                                ?>
                                🔗
                            </a>

                        <?php else: ?>

                            <span class="muted">
                                N/A
                            </span>

                        <?php endif; ?>

                    </p>

                    <p>
                        <strong>GitHub:</strong>

                        <?php if ($githubUrl): ?>

                            <a
                                href="<?php echo htmlspecialchars($githubUrl); ?>"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="extracted-link"
                            >
                                <?php
                                echo htmlspecialchars($github);
                                ?>
                                🔗
                            </a>

                        <?php else: ?>

                            <span class="muted">
                                N/A
                            </span>

                        <?php endif; ?>

                    </p>

                    <p>
                        <strong>Word Count:</strong>

                        <code>

                            <?php
                            echo isset($parsed['word_count'])
                                ? (int)$parsed['word_count'] . ' words'
                                : 'N/A';
                            ?>

                        </code>

                    </p>

                </div>

            </div>

        </section>

        <!-- ===================================================== -->
        <!-- SKILL GAP -->
        <!-- ===================================================== -->

        <section
            id="view-skillgap"
            class="view-panel"
            style="display:none;"
        >

            <h3>
                🎯 Skill-Gap Predictor
            </h3>

            <p class="muted">
                Your resume is compared with requirements
                extracted from the analyzed job listings.
            </p>

            <div class="section-panel">

                <h4>
                    Role Readiness
                </h4>

                <div class="progress-bar-bg">

                    <div
                        id="skill-gap-progress"
                        class="progress-bar-fill"
                        style="width:0%;"
                    ></div>

                </div>

                <div class="two-column-grid">

                    <div>

                        <h4 class="success-text">
                            ✓ Matching Skills
                        </h4>

                        <div id="matched-skills-tags"></div>

                    </div>

                    <div>

                        <h4 class="danger-text">
                            ⚠ Missing Skills
                        </h4>

                        <div id="missing-skills-tags"></div>

                    </div>

                </div>

            </div>

        </section>

        <!-- ===================================================== -->
        <!-- JOB RANKING -->
        <!-- ===================================================== -->

        <section
            id="view-jobranking"
            class="view-panel"
            style="display:none;"
        >

            <h3>
                💼 Job Recommendations
            </h3>

            <p class="muted">
                Jobs extracted from the career URL are ranked
                according to your resume skills.
            </p>

            <div class="job-filter-row">

                <input
                    type="text"
                    id="input-job-search"
                    class="form-control"
                    placeholder="Search company or role"
                >

            </div>

            <div class="table-wrapper">

                <table class="data-table">

                    <thead>

                        <tr>

                            <th>Company</th>
                            <th>Role</th>
                            <th>Match</th>
                            <th>Matched</th>
                            <th>Missing</th>
                            <th>Job</th>

                        </tr>

                    </thead>

                    <tbody id="tbody-job-ranking">

                        <tr>

                            <td
                                colspan="6"
                                class="table-empty"
                            >
                                Analyze a career URL first.

                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>

        </section>

        <!-- ===================================================== -->
        <!-- ROADMAP -->
        <!-- ===================================================== -->

        <section
            id="view-roadmap"
            class="view-panel"
            style="display:none;"
        >

            <h3>
                🗺️ Career Roadmap
            </h3>

            <p class="muted">
                A roadmap based on the skills missing for your
                dynamically recommended role.
            </p>

            <div id="container-dynamic-roadmap">

                <p class="muted">
                    Analyze a career URL first.
                </p>

            </div>

            <h4>
                📚 Recommended Resources
            </h4>

            <div id="container-dynamic-resources">

                <p class="muted">
                    Resources will appear after analysis.
                </p>

            </div>

        </section>

        <!-- ===================================================== -->
        <!-- INTERVIEW -->
        <!-- ===================================================== -->

        <section
            id="view-interview"
            class="view-panel"
            style="display:none;"
        >

            <h3>
                🎙️ AI Interview Preparation
            </h3>

            <p class="muted">
                Interview preparation based on the dynamically
                selected role and your skill gaps.
            </p>

            <div class="auth-tabs">

                <div
                    class="auth-tab active"
                    id="tab-btn-ai-assistant"
                >
                    🤖 AI Assistant
                </div>

                <div
                    class="auth-tab"
                    id="tab-btn-ai-evaluator"
                >
                    ✍️ Answer Evaluator
                </div>

                <div
                    class="auth-tab"
                    id="tab-btn-ai-questions"
                >
                    🎯 Question Bank
                </div>

            </div>

            <div id="subtab-ai-assistant">

                <div class="section-panel">

                    <h4>
                        💬 Ask Interview Assistant
                    </h4>

                    <textarea
                        id="input-ai-prompt"
                        class="form-control"
                        rows="4"
                        placeholder="Ask an interview preparation question..."
                    ></textarea>

                    <button
                        type="button"
                        id="btn-submit-ai-prompt"
                        class="btn"
                    >
                        Ask AI
                    </button>

                    <div
                        id="ai-assistant-response-card"
                        style="display:none;"
                    >

                        <h4 id="ai-response-title"></h4>

                        <div id="ai-response-body"></div>

                    </div>

                </div>

            </div>

            <div
                id="subtab-ai-evaluator"
                style="display:none;"
            >

                <div class="section-panel">

                    <h4>
                        ✍️ Answer Evaluator
                    </h4>

                    <select
                        id="select-eval-question"
                        class="form-control"
                    >

                        <option value="">
                            Select a question
                        </option>

                        <option value="Tell me about yourself.">
                            Tell me about yourself.
                        </option>

                        <option value="Why should we hire you?">
                            Why should we hire you?
                        </option>

                        <option value="custom">
                            Custom Question
                        </option>

                    </select>

                    <textarea
                        id="input-eval-custom-q"
                        class="form-control"
                        rows="3"
                        style="display:none;margin-top:10px;"
                        placeholder="Enter custom question"
                    ></textarea>

                    <textarea
                        id="input-eval-user-answer"
                        class="form-control"
                        rows="6"
                        style="margin-top:10px;"
                        placeholder="Write your answer..."
                    ></textarea>

                    <button
                        type="button"
                        id="btn-submit-eval-answer"
                        class="btn"
                    >
                        Evaluate Answer
                    </button>

                    <div
                        id="ai-evaluator-result-card"
                        style="display:none;"
                    >

                        <h4 id="eval-overall-score-display">
                            Evaluation
                        </h4>

                        <p id="eval-rating-badge"></p>

                        <div class="metrics-grid">

                            <div class="metric-card-container">
                                <span>Technical Accuracy</span>
                                <strong id="eval-score-tech">N/A</strong>
                            </div>

                            <div class="metric-card-container">
                                <span>Keywords</span>
                                <strong id="eval-score-kw">N/A</strong>
                            </div>

                            <div class="metric-card-container">
                                <span>Structure</span>
                                <strong id="eval-score-struct">N/A</strong>
                            </div>

                            <div class="metric-card-container">
                                <span>Relevance</span>
                                <strong id="eval-score-rel">N/A</strong>
                            </div>

                            <div class="metric-card-container">
                                <span>Completeness</span>
                                <strong id="eval-score-comp">N/A</strong>
                            </div>

                        </div>

                        <div class="two-column-grid">

                            <div>

                                <h4 class="success-text">
                                    Key Strengths
                                </h4>

                                <ul id="eval-strengths-list"></ul>

                            </div>

                            <div>

                                <h4 class="danger-text">
                                    Areas for Improvement
                                </h4>

                                <ul id="eval-missing-list"></ul>

                            </div>

                        </div>

                        <div class="section-panel">

                            <h4>
                                Recommended Answer Strategy
                            </h4>

                            <p id="eval-ideal-answer"></p>

                        </div>

                    </div>

                </div>

            </div>

            <div
                id="subtab-ai-questions"
                style="display:none;"
            >

                <div
                    id="container-dynamic-interview"
                    class="section-panel"
                >

                    <p class="muted">
                        Analyze a career URL first.
                    </p>

                </div>

            </div>

        </section>

        <!-- ===================================================== -->
        <!-- REPORT -->
        <!-- ===================================================== -->

        <section
            id="view-report"
            class="view-panel"
            style="display:none;"
        >

            <h3>
                📑 Progress Report
            </h3>

            <p class="muted">
                Generate a report from the current resume and
                dynamically selected job.
            </p>

            <form
                action="api.php?action=download_pdf"
                method="POST"
                target="_blank"
            >

                <input
                    type="hidden"
                    name="target_company"
                    id="input-report-company"
                    value="<?php
                    echo htmlspecialchars($targetCompany);
                    ?>"
                >

                <input
                    type="hidden"
                    name="target_role"
                    id="input-report-role"
                    value="<?php
                    echo htmlspecialchars($targetRole);
                    ?>"
                >

                <button
                    type="submit"
                    class="btn"
                >
                    📥 Download Progress Report
                </button>

            </form>

        </section>

        <!-- ===================================================== -->
        <!-- PROFILE -->
        <!-- ===================================================== -->

        <section
            id="view-profile"
            class="view-panel"
            style="display:none;"
        >

            <h3>
                👤 Profile
            </h3>

            <div class="two-column-grid">

                <div class="section-panel">

                    <h4>
                        Account Information
                    </h4>

                    <p>
                        <strong>Name:</strong>
                        <code>
                            <?php
                            echo htmlspecialchars(
                                $user['name'] ?? ''
                            );
                            ?>
                        </code>
                    </p>

                    <p>
                        <strong>Email:</strong>
                        <code>
                            <?php
                            echo htmlspecialchars(
                                $user['email'] ?? ''
                            );
                            ?>
                        </code>
                    </p>

                    <p>
                        <strong>University:</strong>
                        <code>
                            <?php
                            echo htmlspecialchars(
                                $user['university'] ?? ''
                            );
                            ?>
                        </code>
                    </p>

                    <p>
                        <strong>Branch:</strong>
                        <code>
                            <?php
                            echo htmlspecialchars(
                                $user['branch'] ?? ''
                            );
                            ?>
                        </code>
                    </p>

                    <p>
                        <strong>Graduation Year:</strong>
                        <code>
                            <?php
                            echo htmlspecialchars(
                                $user['graduation_year'] ?? ''
                            );
                            ?>
                        </code>
                    </p>

                </div>

                <div class="section-panel">

                    <h4>
                        Update Profile
                    </h4>

                    <form id="form-update-profile">

                        <div class="form-group">

                            <label class="form-label">
                                Full Name
                            </label>

                            <input
                                type="text"
                                name="name"
                                class="form-control"
                                value="<?php
                                echo htmlspecialchars(
                                    $user['name'] ?? ''
                                );
                                ?>"
                            >

                        </div>

                        <div class="form-group">

                            <label class="form-label">
                                University
                            </label>

                            <input
                                type="text"
                                name="university"
                                class="form-control"
                                value="<?php
                                echo htmlspecialchars(
                                    $user['university'] ?? ''
                                );
                                ?>"
                            >

                        </div>

                        <div class="form-group">

                            <label class="form-label">
                                Branch
                            </label>

                            <input
                                type="text"
                                name="branch"
                                class="form-control"
                                value="<?php
                                echo htmlspecialchars(
                                    $user['branch'] ?? ''
                                );
                                ?>"
                            >

                        </div>

                        <div class="form-group">

                            <label class="form-label">
                                Graduation Year
                            </label>

                            <input
                                type="number"
                                name="graduation_year"
                                class="form-control"
                                value="<?php
                                echo htmlspecialchars(
                                    $user['graduation_year'] ?? ''
                                );
                                ?>"
                            >

                        </div>

                        <div class="form-group">

                            <label class="form-label">
                                LinkedIn
                            </label>

                            <input
                                type="text"
                                name="linkedin"
                                class="form-control"
                                value="<?php
                                echo htmlspecialchars(
                                    $user['linkedin'] ?? ''
                                );
                                ?>"
                            >

                        </div>

                        <div class="form-group">

                            <label class="form-label">
                                GitHub
                            </label>

                            <input
                                type="text"
                                name="github"
                                class="form-control"
                                value="<?php
                                echo htmlspecialchars(
                                    $user['github'] ?? ''
                                );
                                ?>"
                            >

                        </div>

                        <button
                            type="submit"
                            class="btn btn-block"
                        >
                            Save Changes
                        </button>

                    </form>

                </div>

            </div>

        </section>

    </main>

</div>

<?php endif; ?>

<script src="static/app.js"></script>

</body>
</html>
