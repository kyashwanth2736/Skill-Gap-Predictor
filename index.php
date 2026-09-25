<?php
/**
 * Main Web Application Entry Point for Skill-Gap Predictor (Career Navigation AI)
 * Student Placement & Skill Analysis Portal
 */

session_start();
require_once __DIR__ . '/db.php';

// Fetch benchmark companies and canonical skills
$jsonPath = __DIR__ . '/data/company_roles.json';
$benchmarkData = json_decode(file_get_contents($jsonPath), true)['companies'] ?? [];

$canonicalSkills = ["Python", "Java", "C++", "C#", "SQL", "JavaScript", "TypeScript", "HTML/CSS", "React", "Node.js", "Django", "Flask", "Pandas", "NumPy", "Scikit-Learn", "TensorFlow", "PyTorch", "Data Structures", "Algorithms", "System Design", "Git", "Docker", "Kubernetes", "AWS", "Google Cloud Platform (GCP)", "Azure", "Linux", "REST APIs"];

$user = $_SESSION['user'] ?? null;

function formatSocialUrl($url) {
    if (empty($url) || $url === 'N/A') return null;
    $clean = trim(strtolower($url));
    $invalid = ['summary', 'mailto', 'experience', 'education', 'skills', 'projects', 'certifications', 'about', 'contact', 'home'];
    foreach ($invalid as $bad) {
        if (strpos($clean, $bad) !== false) {
            return null;
        }
    }
    if (strpos($url, 'http://') === 0 || strpos($url, 'https://') === 0) {
        return $url;
    }
    return 'https://' . ltrim($url, '/');
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Skill-Gap Predictor | Career Navigation AI</title>
    <link rel="stylesheet" href="static/styles.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        window.BENCHMARK_DATA = <?php echo json_encode($benchmarkData); ?>;
        window.CANONICAL_SKILLS = <?php echo json_encode($canonicalSkills); ?>;
        window.EXTRACTED_SKILLS = <?php echo json_encode($_SESSION['extracted_skills'] ?? ["Python", "SQL", "Data Structures", "Algorithms", "Git", "Pandas"]); ?>;
        window.ATS_SCORE = <?php echo json_encode($_SESSION['ats_score'] ?? 72.0); ?>;
    </script>
</head>
<body>

<?php if (!$user): ?>
<!-- ============================================================= -->
<!-- AUTHENTICATION WALL: LOG IN OR SIGN UP -->
<!-- ============================================================= -->
<div class="auth-wrapper">
    <div class="auth-card">
        <div class="main-header-banner" style="text-align: center; padding: 20px;">
            <span class="student-badge">🎓 Student Career Intelligence Portal</span>
            <h2 class="header-title" style="font-size: 22px;">Skill-Gap Predictor for Students</h2>
            <p class="header-subtitle" style="font-size: 13px;">Career Navigation AI — Student Portal</p>
        </div>

        <div class="auth-tabs">
            <div class="auth-tab active" id="tab-btn-login">🔐 Student Login</div>
            <div class="auth-tab" id="tab-btn-signup">📝 Create New Account</div>
        </div>

        <!-- Login Form -->
        <div id="form-login-box">
            <div id="login-error-msg" class="alert alert-error" style="display: none;"></div>
            <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" id="login_email" class="form-control" placeholder="Enter registered email" autocomplete="username">
            </div>
            <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" id="login_password" class="form-control" placeholder="Password" autocomplete="current-password">
                <button type="button" class="password-toggle-btn" id="toggle-login-password" aria-label="Toggle Password Visibility">👁️</button>
            </div>
            <button id="btn-do-login" class="btn btn-block">Log In</button>
        </div>

        <!-- Signup Form -->
        <div id="form-signup-box" style="display: none;">
            <div id="signup-error-msg" class="alert alert-error" style="display: none;"></div>
            <div id="signup-success-msg" class="alert alert-success" style="display: none;"></div>
            <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" id="signup_name" class="form-control" placeholder="Enter your full name">
            </div>
            <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" id="signup_email" class="form-control" placeholder="Enter your email address">
            </div>
            <div class="form-group">
                <label class="form-label">Create Password</label>
                <input type="password" id="signup_pwd" class="form-control" placeholder="Min 8 chars, uppercase, lowercase, number & special character" minlength="8" required>
                <button type="button" class="password-toggle-btn" id="toggle-signup-password" aria-label="Toggle Password Visibility">👁️</button>
                <small style="color: var(--text-muted); font-size: 12px;">Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.</small>
            </div>
            <div class="form-group">
                <label class="form-label">University / College</label>
                <input type="text" id="signup_uni" class="form-control" placeholder="Enter your university or college name">
            </div>
            <div class="form-group">
                <label class="form-label">Degree</label>
                <input type="text" id="signup_branch" class="form-control" placeholder="e.g B.TECH/B.E">
            </div>
            <div class="form-group">
                <label class="form-label">Branch</label>
                <input type="text" id="signup_major" class="form-control" placeholder="e.g Computer Science, ECE, IT">
            </div>
            <div class="form-group">
                <label class="form-label">Graduation Year</label>
                <input type="number" id="signup_gradyear" class="form-control" placeholder="e.g 2025" min="2020" max="2030">
            </div>
            <div class="form-group">
                <label class="form-label">LinkedIn Profile (Optional)</label>
                <input type="text" id="signup_linkedin" class="form-control" placeholder="https://www.linkedin.com/in/yourprofile">
            </div>
            <div class="form-group">
                <label class="form-label">GitHub Profile (Optional)</label>
                <input type="text" id="signup_github" class="form-control" placeholder="https://github.com/yourprofile">
            </div>
            <div class="form-group">
                <label class="form-label">Current Skills (Comma Separated)</label>
                <input type="text" id="signup_skills" class="form-control" placeholder="e.g Python, SQL, Data Structures, Git">
            </div>
            <div class="form-group" style="margin-top: 12px;">
                <label class="form-label">By signing up, you agree to our <a href="#" target="_blank">Terms of Service</a> and <a href="#" target="_blank">Privacy Policy</a>.</label>
            <button id="btn-do-signup" class="btn btn-block" type="submit">Register Account</button>
        </div>
    </div>
</div>

<?php else: ?>
<!-- ============================================================= -->
<!-- LOGGED IN USER APPLICATION DASHBOARD -->
<!-- ============================================================= -->
<div class="app-container">

    <!-- Mobile Header -->
    <div class="mobile-topbar">
        <button id="mobile-menu-btn" class="mobile-menu-btn" aria-label="Open Menu">
            ☰
        </button>

        <div class="mobile-title">
            Skill-Gap Predictor
        </div>

        <button id="theme-toggle-mobile" class="theme-toggle" aria-label="Toggle Theme">
            🌙
        </button>
    </div>

    <!-- Sidebar Overlay -->
    <div id="sidebar-overlay" class="sidebar-overlay"></div>

    <aside class="sidebar">
        <div class="sidebar-user-card">
            <div style="font-size: 26px; margin-bottom: 4px;">👤</div>
            <div style="font-weight: 800; color: #ffffff; font-size: 16px;"><?php echo htmlspecialchars($user['name']); ?></div>
            <div style="font-size: 12px; color: var(--text-muted);"><?php echo htmlspecialchars($user['email']); ?></div>
            <div style="font-size: 11px; color: var(--cyan-light); font-weight: 600; margin-top: 4px;"><?php echo htmlspecialchars($user['branch'] ?? 'Engineering'); ?></div>
            <button id="btn-logout" class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px; margin-top: 10px; width: 100%;">🚪 Log Out</button>
        </div>

        <div style="margin-bottom: 20px;">
            <label class="form-label" style="color: var(--cyan-light);">🎯 Target Company Mode:</label>
            <div style="display: flex; gap: 12px; margin-bottom: 10px; font-size: 13px;">
                <label><input type="radio" name="company_mode" id="mode-benchmark" value="benchmark" checked> 🏢 Top Tech</label>
                <label><input type="radio" name="company_mode" id="mode-custom" value="custom"> ✏️ Custom</label>
            </div>

            <div id="box-benchmark-select">
                <label class="form-label">Select Company:</label>
                <select id="select-company" class="form-control" style="margin-bottom: 10px;">
                    <?php foreach ($benchmarkData as $compName => $compInfo): ?>
                        <option value="<?php echo htmlspecialchars($compName); ?>"><?php echo htmlspecialchars($compName); ?></option>
                    <?php endforeach; ?>
                </select>

                <label class="form-label">Select Role:</label>
                <select id="select-role" class="form-control">
                    <?php 
                    $firstComp = array_key_first($benchmarkData);
                    $firstRoles = $benchmarkData[$firstComp]['roles'] ?? [];
                    foreach ($firstRoles as $roleName => $roleInfo): 
                    ?>
                        <option value="<?php echo htmlspecialchars($roleName); ?>"><?php echo htmlspecialchars($roleName); ?></option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div id="box-custom-select" style="display: none;">
                <label class="form-label">Company Name:</label>
                <input type="text" id="input-custom-company" class="form-control" placeholder="Enter company name" style="margin-bottom: 8px;">
                <label class="form-label">Role Name:</label>
                <input type="text" id="input-custom-role" class="form-control" placeholder="Enter role name" style="margin-bottom: 8px;">
                <label class="form-label">Required Skills:</label>
                <div style="max-height: 120px; overflow-y: auto; background: rgba(15, 23, 42, 0.9); padding: 8px; border-radius: 6px; font-size: 12px;">
                    <?php foreach (array_slice($canonicalSkills, 0, 10) as $sk): ?>
                        <label style="display: block; margin-bottom: 4px;"><input type="checkbox" class="custom-skill-checkbox" value="<?php echo htmlspecialchars($sk); ?>" checked> <?php echo htmlspecialchars($sk); ?></label>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>

        <nav class="nav-menu">
            <a class="nav-item active" data-view="view-analytics">📊 My Placement Analytics</a>
            <a class="nav-item" data-view="view-resume">📄 Resume Parser & ATS</a>
            <a class="nav-item" data-view="view-skillgap">🎯 Skill-Gap Predictor</a>
            <a class="nav-item" data-view="view-jobranking">💼 Dynamic Job Ranking</a>
            <a class="nav-item" data-view="view-roadmap">🗺️ Career Roadmap</a>
            <a class="nav-item" data-view="view-interview">🎙️ AI Interview Prep</a>
            <a class="nav-item" data-view="view-report">📑 Download Report</a>
            <a class="nav-item" data-view="view-profile">👤 Profile & History</a>
        </nav>
    </aside>

    <!-- Main Workspace Area -->
    <main class="main-content">
        <!-- Top Banner -->
        <div class="main-header-banner">
            <span class="student-badge">⚡ Career Navigation AI — <?php echo htmlspecialchars($user['name']); ?></span>
            <h1 class="header-title" id="banner-company-role"><?php echo htmlspecialchars($user['company'] ?? 'Company') ?> · <?php echo htmlspecialchars($user['role'] ?? 'Role') ?></h1>
            <p class="header-subtitle">
                Evaluating student skills, ATS compatibility, and placement readiness in real time.
            </p>
        </div>

        <!-- ============================================================= -->
        <!-- VIEW 1: MY PLACEMENT ANALYTICS DASHBOARD -->
        <!-- ============================================================= -->
        <section id="view-analytics" class="view-panel">
            <div class="metrics-grid">
                <div class="metric-card-container">
                    <span class="metric-label">ATS Score</span>
                    <span class="metric-value" style="color: var(--cyan-light);" id="metric-ats"><?php echo htmlspecialchars($_SESSION['ats_score'] ?? 0); ?> / 100</span>
                    <span class="metric-subtext">Target Min: 70/100</span>
                </div>
                <div class="metric-card-container">
                    <span class="metric-label">Job Readiness</span>
                    <span class="metric-value" style="color: var(--emerald);" id="metric-readiness"><?php echo htmlspecialchars($_SESSION['readiness_score'] ?? 0); ?>%</span>
                    <span class="metric-subtext" id="metric-readiness-subtext">Based on Skill Match</span>
                    <span class="metric-subtext" id="metric-matched-count"><?php 
                        $matched = $_SESSION['matched_skills_count'] ?? [];
                        $missing = $_SESSION['missing_skills'] ?? [];
                        $totalSkills = count($matched) + count($missing);
                        echo count($matched) . " of " . $totalSkills . " Skills Matched";
                    ?></span>
                </div>
                <div class="metric-card-container">
                    <span class="metric-label">AI Confidence</span>
                    <span class="metric-value" style="color: var(--purple);" id="metric-confidence"><?php echo htmlspecialchars($_SESSION['confidence_score'] ?? 0); ?>%</span>
                    <span class="metric-subtext">Prediction Reliability</span>
                </div>
                <div class="metric-card-container">
                    <span class="metric-label">Resume Strength</span>
                    <span class="metric-value" style="color: var(--emerald);" id="metric-strength"><?php echo htmlspecialchars($_SESSION['resume_strength'] ?? 'Not Evaluated'); ?></span>
                    <span class="metric-subtext">Resume Evaluation</span>
                </div>
            </div>

            <details style="margin-bottom: 24px;">
                <summary>⚡ Interactive Skill Editor (Modify Your Active Skills Live)</summary>
                <div style="padding-top: 12px;">
                    <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">Select your current proficient skills to update readiness calculations:</p>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; max-height: 180px; overflow-y: auto; padding: 4px;">
                        <?php 
                        $userSkills = $_SESSION['extracted_skills'] ?? ["Python", "SQL", "Data Structures", "Algorithms", "Git"];
                        foreach ($canonicalSkills as $sk): 
                            $isChecked = in_array($sk, $userSkills) ? 'checked' : '';
                        ?>
                            <label style="font-size: 13px;"><input type="checkbox" class="active-profile-skill-checkbox" value="<?php echo htmlspecialchars($sk); ?>" <?php echo $isChecked; ?>> <?php echo htmlspecialchars($sk); ?></label>
                        <?php endforeach; ?>
                    </div>
                    <button id="btn-update-skills-live" class="btn" style="margin-top: 14px; font-size: 13px; padding: 8px 18px;">Update Profile Skills Live</button>
                </div>
            </details>

            <div class="charts-grid">
                <div class="chart-card">
                    <h4 style="margin-bottom: 14px; color: var(--cyan-light);">🎯 Placement Competency Radar</h4>
                    <div class="chart-container">
                        <canvas id="radarChartCtx"></canvas>
                    </div>
                </div>
                <div class="chart-card">
                    <h4 style="margin-bottom: 14px; color: var(--cyan-light);">🌐 Technical Domain Affinity Distribution</h4>
                    <div class="chart-container">
                        <canvas id="pieChartCtx"></canvas>
                    </div>
                </div>
            </div>
        </section>

        <!-- ============================================================= -->
        <!-- VIEW 2: RESUME PARSER & ATS CHECKER -->
        <!-- ============================================================= -->
        <section id="view-resume" class="view-panel" style="display: none;">
            <h3>📄 Resume Parsing & Enterprise ATS Evaluation</h3>
            <p style="color: var(--text-muted); margin-bottom: 20px;">Upload your personal resume in PDF or DOCX format.</p>

            <div id="resume-upload-status" style="display: none;"></div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                <div class="section-panel">
                    <form id="form-resume-upload" enctype="multipart/form-data">
                        <div class="form-group">
                            <label class="form-label">Upload Resume (PDF / DOCX)</label>
                            <input type="file" id="input-resume-file" accept=".pdf,.docx" class="form-control">
                        </div>
                        <button type="submit" class="btn btn-block">🚀 Evaluate Resume ATS</button>
                    </form>
                    <button id="btn-load-sample-resume" class="btn btn-secondary btn-block" style="margin-top: 12px;">🔄 Load Sample Profile for <?php echo htmlspecialchars($user['name']); ?></button>
                </div>

                <div class="section-panel">
                    <h4 style="color: var(--cyan-light); margin-bottom: 14px; font-size: 17px;">🔍 Extracted Signals</h4>
                    <?php 
                    $parsed = $_SESSION['parsed_resume'] ?? [];
                    $contact = $parsed['contact_info'] ?? [];
                    $email = $contact['email'] ?? $user['email'];
                    $phone = $contact['phone'] ?? '+91 9876543210';

                    $linkedin = (!empty($contact['linkedin']) && $contact['linkedin'] !== 'N/A') 
                        ? $contact['linkedin'] 
                        : ($user['linkedin'] ?? 'N/A');

                    $github = (!empty($contact['github']) && $contact['github'] !== 'N/A') 
                        ? $contact['github'] 
                        : ($user['github'] ?? 'N/A');

                    $linkedinUrl = formatSocialUrl($linkedin);
                    $githubUrl = formatSocialUrl($github);
                    ?>
                    <p style="margin-bottom: 10px;"><strong>Name Detected:</strong> <code><?php echo htmlspecialchars($contact['name'] ?? $user['name']); ?></code></p>
                    <p style="margin-bottom: 10px;"><strong>Email Detected:</strong> <a href="mailto:<?php echo htmlspecialchars($email); ?>" class="extracted-link"><?php echo htmlspecialchars($email); ?> ✉️</a></p>
                    <p style="margin-bottom: 10px;"><strong>Phone Detected:</strong> <a href="tel:<?php echo htmlspecialchars($phone); ?>" class="extracted-link"><?php echo htmlspecialchars($phone); ?> 📞</a></p>
                    <p style="margin-bottom: 10px;"><strong>LinkedIn Detected:</strong> 
                        <?php if ($linkedinUrl): ?>
                            <a href="<?php echo htmlspecialchars($linkedinUrl); ?>" target="_blank" class="extracted-link"><?php echo htmlspecialchars($linkedin); ?> 🔗</a>
                        <?php else: ?>
                            <span style="color: var(--text-muted); margin-left: 6px;">N/A (Add in Profile Settings below)</span>
                        <?php endif; ?>
                    </p>
                    <p style="margin-bottom: 10px;"><strong>GitHub Detected:</strong> 
                        <?php if ($githubUrl): ?>
                            <a href="<?php echo htmlspecialchars($githubUrl); ?>" target="_blank" class="extracted-link"><?php echo htmlspecialchars($github); ?> 🔗</a>
                        <?php else: ?>
                            <span style="color: var(--text-muted); margin-left: 6px;">N/A (Add in Profile Settings below)</span>
                        <?php endif; ?>
                    </p>
                    <p style="margin-bottom: 10px;"><strong>Word Count:</strong> <code><?php echo $parsed['word_count'] ?? 480; ?> words</code></p>
                </div>
            </div>
        </section>

        <!-- ============================================================= -->
        <!-- VIEW 3: SKILL-GAP PREDICTOR & MATCH -->
        <!-- ============================================================= -->
        <section id="view-skillgap" class="view-panel" style="display: none;">
            <h3>🎯 Skill Gap Predictor</h3>
            <p style="color: var(--text-muted); margin-bottom: 20px;">Comparing skills against target role expectations.</p>

            <div class="section-panel">
                <h4 style="margin-bottom: 12px; color: var(--cyan-light);">Role Readiness Match</h4>
                <div class="progress-bar-bg">
                    <div id="skillgap-progress-bar" class="progress-bar-fill" style="width: <?php echo htmlspecialchars($_SESSION['readiness_score'] ?? 0); ?>%;"></div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                    <div>
                        <h4 style="color: var(--emerald); margin-bottom: 12px;">✅ Matched Skills</h4>
                        <div id="matched-skills-tags"></div>
                    </div>
                    <div>
                        <h4 style="color: var(--rose); margin-bottom: 12px;">⚠️ Missing Skills / Skill Gaps</h4>
                        <div id="missing-skills-tags"></div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ============================================================= -->
        <!-- VIEW 4: DYNAMIC JOB RANKING -->
        <!-- ============================================================= -->
        <section id="view-jobranking" class="view-panel" style="display: none;">
            <h3>💼 Dynamic Job Ranking & Live Market Extraction</h3>
            <div style="display: flex; gap: 16px; margin-bottom: 20px;">
                <select id="select-job-domain-filter" class="form-control" style="max-width: 260px;">
                    <option value="All Domains">All Technical Domains</option>
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Web & Full Stack">Web & Full Stack</option>
                    <option value="Data Science & Analytics">Data Science & Analytics</option>
                    <option value="Artificial Intelligence & ML">AI & Machine Learning</option>
                    <option value="Cloud & DevOps">Cloud & DevOps</option>
                </select>
                <input type="text" id="input-job-search" class="form-control" placeholder="🔍 Search Company or Role...">
            </div>

            <table class="data-table">
                <thead>
                    <tr>
                        <th>Company</th>
                        <th>Role</th>
                        <th>Domain</th>
                        <th>Match Readiness</th>
                        <th>Matched Skills</th>
                        <th>Fit Level</th>
                        <th>Missing Skills</th>
                    </tr>
                </thead>
                <tbody id="tbody-job-ranking">
                    <tr>
                        <td><strong>Google</strong></td>
                        <td>Software Development Engineer (SDE)</td>
                        <td>Software Engineering</td>
                        <td><strong style="color: var(--cyan-light);"><?php echo htmlspecialchars($_SESSION['readiness_score'] ?? '0%'); ?></strong></td>
                        <td>6 / 8</td>
                        <td><span style="color: var(--emerald); font-weight:700;">High Match</span></td>
                        <td>System Design, C++</td>
                    </tr>
                </tbody>
            </table>

            <div class="section-panel" style="margin-top: 32px;">
                <h4 style="color: var(--cyan-light); margin-bottom: 12px;">🌐 Automatic Web Retrieval (AWR) — Live Job Posting URL Scraper</h4>
                <div style="display: flex; gap: 14px;">
                    <input type="text" id="input-scrape-url" class="form-control" placeholder="Enter job posting URL" style="flex: 1;">
                    <button id="btn-scrape-url" class="btn" style="white-space: nowrap;">Fetch & Analyze URL</button>
                </div>
                <div id="scrape-results-box" style="display: none; margin-top: 14px;"></div>
            </div>
        </section>

        <!-- ============================================================= -->
        <!-- VIEW 5: PERSONALIZED CAREER ROADMAP -->
        <!-- ============================================================= -->
        <section id="view-roadmap" class="view-panel" style="display: none;">
            <h3>🗺️ Custom Learning Roadmap</h3>
            <p style="color: var(--text-muted); margin-bottom: 24px;">Personalized 4-phase milestone learning pathway designed specifically to bridge your resume skill gaps.</p>

            <div id="container-dynamic-roadmap">
                <p style="color: var(--text-muted);">Loading your personalized career roadmap...</p>
            </div>

            <h4 style="color: var(--cyan-light); margin-top: 32px; margin-bottom: 16px;">📚 Recommended Skill Mastery Guides & Portfolio Projects</h4>
            <div id="container-dynamic-resources">
                <p style="color: var(--text-muted);">Loading recommended mastery resources...</p>
            </div>
        </section>

        <!-- ============================================================= -->
        <!-- VIEW 6: AI INTERVIEW PREPARATION -->
        <!-- ============================================================= -->
        <!-- ============================================================= -->
        <!-- VIEW 6: AI INTERVIEW ASSISTANT & PREPARATION -->
        <!-- ============================================================= -->
        <section id="view-interview" class="view-panel" style="display: none;">
            <h3>🎙️ AI Interview Assistant & Practice Lab</h3>
            <p style="color: var(--text-muted); margin-bottom: 20px;">Ask custom interview questions, practice mock technical/HR prompts, and get real-time AI scoring on your responses.</p>

            <div class="auth-tabs" style="max-width: 100%; margin-bottom: 24px;">
                <div class="auth-tab active" id="tab-btn-ai-assistant">🤖 AI Interview Assistant</div>
                <div class="auth-tab" id="tab-btn-ai-evaluator">✍️ AI Answer Evaluator</div>
                <div class="auth-tab" id="tab-btn-ai-questions">🎯 Question Bank & Drills</div>
            </div>

            <!-- SUB-TAB 1: AI Chat Assistant -->
            <div id="subtab-ai-assistant">
                <div class="section-panel" style="margin-bottom: 20px;">
                    <h4 style="color: var(--cyan-light); margin-bottom: 12px;">💬 Ask AI Interview Assistant</h4>
                    <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px;">Ask anything about interview preparation, company-specific questions, system design approaches, or HR strategies.</p>
                    
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px;">
                        <button class="btn btn-secondary ai-preset-btn" data-query="How to answer 'Why this company?' for my target role?" style="font-size: 12px; padding: 6px 12px;">🎯 Why Google / Company?</button>
                        <button class="btn btn-secondary ai-preset-btn" data-query="System design blueprint and key steps for SDE" style="font-size: 12px; padding: 6px 12px;">🏗️ System Design Guide</button>
                        <button class="btn btn-secondary ai-preset-btn" data-query="How to answer behavioral conflict questions using STAR" style="font-size: 12px; padding: 6px 12px;">👔 STAR Framework Tips</button>
                        <button class="btn btn-secondary ai-preset-btn" data-query="Top technical coding interview strategies and edge cases" style="font-size: 12px; padding: 6px 12px;">💻 Coding Round Masterplan</button>
                    </div>

                    <div style="display: flex; gap: 12px;">
                        <input type="text" id="input-ai-prompt" class="form-control" placeholder="Ask your interview question (e.g. 'How do I answer tell me about yourself for SDE at Google?')...">
                        <button id="btn-submit-ai-prompt" class="btn" style="white-space: nowrap; padding: 10px 22px;">🚀 Ask AI</button>
                    </div>
                </div>

                <div id="ai-assistant-response-card" class="section-panel" style="display: none;">
                    <h4 id="ai-response-title" style="color: var(--emerald); margin-bottom: 14px;"></h4>
                    <div id="ai-response-body"></div>
                </div>
            </div>

            <!-- SUB-TAB 2: AI Live Answer Evaluator -->
            <div id="subtab-ai-evaluator" style="display: none;">
                <div class="section-panel" style="margin-bottom: 20px;">
                    <h4 style="color: var(--cyan-light); margin-bottom: 12px;">✍️ Practice Answering & Get Instant AI Score</h4>
                    <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px;">Select or type an interview question, type out your response below, and receive instant feedback across 5 technical metrics.</p>

                    <div class="form-group">
                        <label class="form-label">Interview Question to Practice</label>
                        <select id="select-eval-question" class="form-control" style="margin-bottom: 10px;">
                            <option value="How would you detect a cycle in a singly linked list with O(1) extra space?">How would you detect a cycle in a singly linked list with O(1) extra space?</option>
                            <option value="Explain the internal difference between a Hash Map and a Balanced Binary Search Tree.">Explain the internal difference between a Hash Map and a Balanced BST.</option>
                            <option value="What is Python's Global Interpreter Lock (GIL) and how does it affect multi-threaded programs?">What is Python's Global Interpreter Lock (GIL) and how does it affect multithreading?</option>
                            <option value="Tell me about a time you faced a difficult technical bug in a project and how you solved it.">Tell me about a time you faced a difficult technical bug in a project and how you solved it.</option>
                            <option value="Why do you want to join our company and this specific role?">Why do you want to join our company and this specific role?</option>
                            <option value="custom">✏️ Type My Own Custom Question...</option>
                        </select>
                        <input type="text" id="input-eval-custom-q" class="form-control" placeholder="Type your custom question here..." style="display: none; margin-bottom: 10px;">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Your Answer (Typed Response)</label>
                        <textarea id="input-eval-user-answer" class="form-control" rows="5" placeholder="Type your answer here... (Tip: Include technical keywords, complexities O(N), or STAR framework steps for best evaluation)"></textarea>
                    </div>

                    <button id="btn-submit-eval-answer" class="btn" style="padding: 12px 24px;">📊 Evaluate My Answer with AI</button>
                </div>

                <div id="ai-evaluator-result-card" class="section-panel" style="display: none;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <div>
                            <span class="student-badge" id="eval-rating-badge">Strong Answer</span>
                            <h3 style="margin-top: 6px; color: var(--cyan-light);" id="eval-overall-score-display">Score: 85 / 100</h3>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px;">
                        <div class="metric-card-container" style="padding: 12px;">
                            <span class="metric-label" style="font-size: 11px;">Tech Accuracy</span>
                            <span class="metric-value" style="font-size: 18px;" id="eval-score-tech">18 / 20</span>
                        </div>
                        <div class="metric-card-container" style="padding: 12px;">
                            <span class="metric-label" style="font-size: 11px;">Keywords</span>
                            <span class="metric-value" style="font-size: 18px;" id="eval-score-kw">16 / 20</span>
                        </div>
                        <div class="metric-card-container" style="padding: 12px;">
                            <span class="metric-label" style="font-size: 11px;">Structure</span>
                            <span class="metric-value" style="font-size: 18px;" id="eval-score-struct">16 / 20</span>
                        </div>
                        <div class="metric-card-container" style="padding: 12px;">
                            <span class="metric-label" style="font-size: 11px;">Relevance</span>
                            <span class="metric-value" style="font-size: 18px;" id="eval-score-rel">16 / 20</span>
                        </div>
                        <div class="metric-card-container" style="padding: 12px;">
                            <span class="metric-label" style="font-size: 11px;">Completeness</span>
                            <span class="metric-value" style="font-size: 18px;" id="eval-score-comp">16 / 20</span>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 16px;">
                        <div>
                            <h4 style="color: var(--emerald); margin-bottom: 8px;">✅ Key Strengths</h4>
                            <ul id="eval-strengths-list" style="color: #d1d5db; padding-left: 20px; line-height: 1.6; font-size: 13px;"></ul>
                        </div>
                        <div>
                            <h4 style="color: var(--rose); margin-bottom: 8px;">💡 Areas for Improvement</h4>
                            <ul id="eval-missing-list" style="color: #d1d5db; padding-left: 20px; line-height: 1.6; font-size: 13px;"></ul>
                        </div>
                    </div>

                    <div style="background: rgba(15, 23, 42, 0.8); padding: 14px; border-radius: 8px; border-left: 4px solid var(--indigo-light);">
                        <h4 style="color: var(--cyan-light); margin-bottom: 6px; font-size: 14px;">📘 Recommended Mentor Answer Strategy</h4>
                        <p id="eval-ideal-answer" style="color: #d1d5db; line-height: 1.6; font-size: 13px; margin: 0;"></p>
                    </div>
                </div>
            </div>

            <!-- SUB-TAB 3: Question Bank & Drills -->
            <div id="subtab-ai-questions" style="display: none;">
                <div id="container-dynamic-interview">
                    <p style="color: var(--text-muted);">Loading personalized interview questions...</p>
                </div>
            </div>
        </section>

        <!-- ============================================================= -->
        <!-- VIEW 7: DOWNLOAD PROGRESS REPORT -->
        <!-- ============================================================= -->
        <section id="view-report" class="view-panel" style="display: none;">
            <h3>Student Progress Report Generator</h3>
            <p style="color: var(--text-muted); margin-bottom: 24px;">Generate and download a publication-grade PDF report containing scores, skill gap analysis, and review details.</p>

            <form action="api.php?action=download_pdf" method="POST" target="_blank">
                <input type="hidden" name="target_company" id="input-report-company" value="<?php echo htmlspecialchars($_SESSION['target_company'] ?? ''); ?>">
                <input type="hidden" name="target_role" id="report-target-role" value="<?php echo htmlspecialchars($_SESSION['target_role'] ?? ''); ?>">
                <button type="submit" class="btn" style="padding: 14px 28px; font-size: 16px;">Download Progress Report (PDF)</button>
            </form>
        </section>

        <!-- ============================================================= -->
        <!-- VIEW 8: MY PROFILE & SCAN HISTORY -->
        <!-- ============================================================= -->
        <section id="view-profile" class="view-panel" style="display: none;">
            <h3>👤 Profile & Resume History</h3>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
                <div class="section-panel">
                    <h4 style="color: var(--cyan-light); margin-bottom: 14px;">Account Credentials</h4>
                    <p style="margin-bottom: 8px;"><strong>Full Name:</strong> <code><?php echo htmlspecialchars($user['name']); ?></code></p>
                    <p style="margin-bottom: 8px;"><strong>Email Address:</strong> <code><?php echo htmlspecialchars($user['email']); ?></code></p>
                    <p style="margin-bottom: 8px;"><strong>University:</strong> <code><?php echo htmlspecialchars($user['university']); ?></code></p>
                    <p style="margin-bottom: 8px;"><strong>Branch / Degree:</strong> <code><?php echo htmlspecialchars($user['branch']); ?></code></p>
                    <p style="margin-bottom: 8px;"><strong>Graduation Year:</strong> <code><?php echo htmlspecialchars($user['graduation_year']); ?></code></p>
                    <p style="margin-bottom: 8px;"><strong>LinkedIn:</strong> <code><?php echo htmlspecialchars($user['linkedin'] ?? 'Not set'); ?></code></p>
                    <p style="margin-bottom: 8px;"><strong>GitHub:</strong> <code><?php echo htmlspecialchars($user['github'] ?? 'Not set'); ?></code></p>
                </div>

                <div class="section-panel">
                    <h4 style="color: var(--cyan-light); margin-bottom: 14px;">Update Profile Settings</h4>
                    <form id="form-update-profile">
                        <div class="form-group">
                            <label class="form-label">Full Name</label>
                            <input type="text" name="name" class="form-control" value="<?php echo htmlspecialchars($user['name']); ?>">
                        </div>
                        <div class="form-group">
                            <label class="form-label">University</label>
                            <input type="text" name="university" class="form-control" value="<?php echo htmlspecialchars($user['university']); ?>">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email Address</label>
                            <input type="email" name="email" class="form-control" value="<?php echo htmlspecialchars($user['email']); ?>">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Phone Number</label>
                            <input type="text" name="phone" class="form-control" value="<?php echo htmlspecialchars($user['phone'] ?? ''); ?>">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Degree</label>
                            <input type="text" name="degree" class="form-control" value="<?php echo htmlspecialchars($user['degree'] ?? ''); ?>">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Branch</label>
                            <input type="text" name="branch" class="form-control" value="<?php echo htmlspecialchars($user['branch']); ?>">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Graduation Year</label>
                            <input type="number" name="graduation_year" class="form-control" value="<?php echo htmlspecialchars($user['graduation_year']); ?>">
                        </div>
                        <div class="form-group">
                            <label class="form-label">LinkedIn Profile Link</label>
                            <input type="text" name="linkedin" class="form-control" placeholder="e.g. linkedin.com/in/vinaykumar" value="<?php echo htmlspecialchars($user['linkedin'] ?? ''); ?>">
                        </div>
                        <div class="form-group">
                            <label class="form-label">GitHub Profile Link</label>
                            <input type="text" name="github" class="form-control" placeholder="e.g. github.com/vinaykumar" value="<?php echo htmlspecialchars($user['github'] ?? ''); ?>">
                        </div>
                        <button type="submit" class="btn btn-block">Save Profile Changes</button>
                    </form>
                </div>
            </div>

            <h4 style="color: var(--cyan-light); margin-bottom: 14px;">Resume Version History</h4>
            <?php 
            $history = getResumeHistoryForStudent($user['id']);
            if (!empty($history)):
            ?>
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
                    <?php foreach ($history as $h): ?>
                    <tr>
                        <td><?php echo htmlspecialchars($h['created_at']); ?></td>
                        <td><?php echo htmlspecialchars($h['file_name']); ?></td>
                        <td><?php echo htmlspecialchars($h['domain']); ?></td>
                        <td><?php echo htmlspecialchars($h['ats_score']); ?>/100</td>
                        <td><?php echo htmlspecialchars($h['readiness_score']); ?>%</td>
                        <td><?php echo htmlspecialchars($h['confidence_score']); ?>%</td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <?php else: ?>
            <p style="color: var(--text-muted);">No resume evaluation history recorded yet. Upload a resume in "Resume Parser & ATS" tab.</p>
            <?php endif; ?>
        </section>
    </main>
</div>
<?php endif; ?>

<script src="static/app.js"></script>
</body>
</html>
