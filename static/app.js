/**
 * Skill-Gap Predictor
 * Dynamic Career URL + Resume Matching
 */

document.addEventListener('DOMContentLoaded', () => {

    initAuthTabs();
    initPasswordToggles();
    initTermsCheckbox();
    initNavigation();

    initCareerUrlAnalyzer();

    initMobileUI();
    initThemeToggle();

    initCharts();
    initResumeUpload();
    initJobRanking();
    initProfileForm();
    initAIInterviewAssistant();

    updateBannerTarget();

    if (window.RECOMMENDED_JOB) {
        renderRecommendedJob(window.RECOMMENDED_JOB);
    }

    if (
        Array.isArray(window.CAREER_JOBS) &&
        window.CAREER_JOBS.length
    ) {
        renderJobTable(
            window.CAREER_JOBS,
            ''
        );
    }

    if (
        window.TARGET_ROLE ||
        (
            Array.isArray(window.REQUIRED_SKILLS) &&
            window.REQUIRED_SKILLS.length
        )
    ) {
        fetchMetrics();
    }

});


/* ============================================================
   AUTH
   ============================================================ */

function initAuthTabs() {

    const loginTab =
        document.getElementById('tab-btn-login');

    const signupTab =
        document.getElementById('tab-btn-signup');

    const loginBox =
        document.getElementById('form-login-box');

    const signupBox =
        document.getElementById('form-signup-box');

    if (!loginTab || !signupTab) {
        return;
    }

    loginTab.addEventListener('click', () => {

        loginTab.classList.add('active');
        signupTab.classList.remove('active');

        loginBox.style.display = 'block';
        signupBox.style.display = 'none';

    });

    signupTab.addEventListener('click', () => {

        signupTab.classList.add('active');
        loginTab.classList.remove('active');

        signupBox.style.display = 'block';
        loginBox.style.display = 'none';

    });


    const loginBtn =
        document.getElementById('btn-do-login');

    if (loginBtn) {

        loginBtn.addEventListener('click', async () => {

            const email =
                document
                    .getElementById('login_email')
                    .value
                    .trim();

            const password =
                document
                    .getElementById('login_password')
                    .value;

            const errorBox =
                document.getElementById(
                    'login-error-msg'
                );

            if (!email || !password) {

                errorBox.textContent =
                    'Please enter your email and password.';

                errorBox.style.display = 'block';

                return;
            }

            const formData =
                new FormData();

            formData.append(
                'action',
                'login'
            );

            formData.append(
                'email',
                email
            );

            formData.append(
                'password',
                password
            );

            try {

                const response =
                    await fetch(
                        'api.php',
                        {
                            method: 'POST',
                            body: formData
                        }
                    );

                const data =
                    await response.json();

                if (data.status === 'success') {

                    window.location.reload();

                } else {

                    errorBox.textContent =
                        data.message ||
                        'Login failed.';

                    errorBox.style.display =
                        'block';
                }

            } catch (error) {

                errorBox.textContent =
                    'Unable to connect to the server.';

                errorBox.style.display =
                    'block';
            }

        });

    }


    const signupBtn =
        document.getElementById('btn-do-signup');

    if (signupBtn) {

        signupBtn.addEventListener(
            'click',
            async () => {

                const name =
                    document
                        .getElementById('signup_name')
                        .value
                        .trim();

                const email =
                    document
                        .getElementById('signup_email')
                        .value
                        .trim();

                const password =
                    document
                        .getElementById('signup_pwd')
                        .value;

                const university =
                    document
                        .getElementById('signup_uni')
                        .value
                        .trim();

                const branch =
                    document
                        .getElementById('signup_branch')
                        .value
                        .trim();

                const year =
                    document
                        .getElementById('signup_year')
                        .value;

                const errorBox =
                    document.getElementById(
                        'signup-error-msg'
                    );

                const successBox =
                    document.getElementById(
                        'signup-success-msg'
                    );

                const passwordValid =
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
                        .test(password);

                if (!name ||
                    !email ||
                    !password ||
                    !university ||
                    !branch ||
                    !year
                ) {

                    errorBox.textContent =
                        'Please complete all required fields.';

                    errorBox.style.display =
                        'block';

                    return;
                }

                if (!passwordValid) {

                    errorBox.textContent =
                        'Password must contain at least 8 characters, including uppercase, lowercase, number and special character.';

                    errorBox.style.display =
                        'block';

                    return;
                }

                const formData =
                    new FormData();

                formData.append(
                    'action',
                    'signup'
                );

                formData.append(
                    'name',
                    name
                );

                formData.append(
                    'email',
                    email
                );

                formData.append(
                    'password',
                    password
                );

                formData.append(
                    'university',
                    university
                );

                formData.append(
                    'branch',
                    branch
                );

                formData.append(
                    'graduation_year',
                    year
                );

                try {

                    const response =
                        await fetch(
                            'api.php',
                            {
                                method: 'POST',
                                body: formData
                            }
                        );

                    const data =
                        await response.json();

                    if (data.status === 'success') {

                        errorBox.style.display =
                            'none';

                        successBox.textContent =
                            data.message ||
                            'Account created successfully.';

                        successBox.style.display =
                            'block';

                        setTimeout(() => {
                            loginTab.click();
                        }, 1200);

                    } else {

                        errorBox.textContent =
                            data.message ||
                            'Registration failed.';

                        errorBox.style.display =
                            'block';
                    }

                } catch (error) {

                    errorBox.textContent =
                        'Unable to connect to the server.';

                    errorBox.style.display =
                        'block';
                }

            }
        );

    }


    const logoutBtn =
        document.getElementById('btn-logout');

    if (logoutBtn) {

        logoutBtn.addEventListener(
            'click',
            async () => {

                try {
                    await fetch(
                        'api.php?action=logout'
                    );
                } finally {
                    window.location.reload();
                }

            }
        );

    }

}


/* ============================================================
   PASSWORD TOGGLES
   ============================================================ */

function initPasswordToggles() {

    const pairs = [
        [
            'toggle-login-password',
            'login_password'
        ],
        [
            'toggle-signup-password',
            'signup_pwd'
        ]
    ];

    pairs.forEach(pair => {

        const button =
            document.getElementById(pair[0]);

        const input =
            document.getElementById(pair[1]);

        if (!button || !input) {
            return;
        }

        button.addEventListener(
            'click',
            () => {

                if (input.type === 'password') {

                    input.type = 'text';
                    button.textContent = '🙈';

                } else {

                    input.type = 'password';
                    button.textContent = '👁️';
                }

            }
        );

    });

}


/* ============================================================
   TERMS
   ============================================================ */

function initTermsCheckbox() {

    const checkbox =
        document.getElementById(
            'signup-terms'
        );

    const button =
        document.getElementById(
            'btn-do-signup'
        );

    if (!checkbox || !button) {
        return;
    }

    checkbox.addEventListener(
        'change',
        () => {

            button.disabled =
                !checkbox.checked;

            button.style.opacity =
                checkbox.checked
                    ? '1'
                    : '0.6';

            button.style.cursor =
                checkbox.checked
                    ? 'pointer'
                    : 'not-allowed';

        }
    );

}


/* ============================================================
   NAVIGATION
   ============================================================ */

function initNavigation() {

    const navItems =
        document.querySelectorAll(
            '.nav-item'
        );

    const views =
        document.querySelectorAll(
            '.view-panel'
        );

    navItems.forEach(item => {

        item.addEventListener(
            'click',
            event => {

                event.preventDefault();

                const target =
                    item.getAttribute(
                        'data-view'
                    );

                navItems.forEach(
                    nav =>
                        nav.classList.remove(
                            'active'
                        )
                );

                views.forEach(
                    view =>
                        view.style.display =
                            'none'
                );

                item.classList.add(
                    'active'
                );

                const targetView =
                    document.getElementById(
                        target
                    );

                if (targetView) {
                    targetView.style.display =
                        'block';
                }

                if (
                    target ===
                    'view-roadmap'
                ) {
                    loadDynamicRoadmap();
                }

                if (
                    target ===
                    'view-interview'
                ) {
                    loadDynamicInterview();
                }

            }
        );

    });

}


/* ============================================================
   CAREER URL
   ============================================================ */

function initCareerUrlAnalyzer() {

    const input =
        document.getElementById(
            'input-career-url'
        );

    const button =
        document.getElementById(
            'btn-analyze-career-url'
        );

    if (!input || !button) {
        return;
    }

    button.addEventListener(
        'click',
        async () => {

            const url =
                input.value.trim();

            if (!url) {

                showCareerStatus(
                    'Please enter a career or jobs URL.',
                    'error'
                );

                return;
            }

            try {

                new URL(url);

            } catch (error) {

                showCareerStatus(
                    'Please enter a valid URL.',
                    'error'
                );

                return;
            }

            button.disabled = true;

            button.textContent =
                '⏳ Analyzing...';

            showCareerStatus(
                'Reading the career page and extracting jobs...',
                'info'
            );

            const formData =
                new FormData();

            formData.append(
                'action',
                'scrape_url'
            );

            formData.append(
                'url',
                url
            );

            try {

                const response =
                    await fetch(
                        'api.php',
                        {
                            method: 'POST',
                            body: formData
                        }
                    );

                const data =
                    await response.json();

                if (data.status !== 'success') {

                    showCareerStatus(
                        data.message ||
                        data.error ||
                        'No jobs could be extracted.',
                        'error'
                    );

                    return;
                }

                window.CAREER_URL =
                    url;

                window.CAREER_JOBS =
                    Array.isArray(data.jobs)
                        ? data.jobs
                        : [];

                if (data.recommendation) {

                    window.RECOMMENDED_JOB =
                        data.recommendation;

                    window.TARGET_COMPANY =
                        data.recommendation.company ||
                        '';

                    window.TARGET_ROLE =
                        data.recommendation.role ||
                        data.recommendation.title ||
                        '';

                    window.REQUIRED_SKILLS =
                        data.recommendation.required_skills ||
                        [];

                    renderRecommendedJob(
                        data.recommendation
                    );

                    updateBannerTarget();
                }

                renderJobTable(
                    window.CAREER_JOBS,
                    ''
                );

                showCareerStatus(
                    `Successfully extracted ${window.CAREER_JOBS.length} job(s).`,
                    'success'
                );

                await fetchMetrics();

            } catch (error) {

                console.error(error);

                showCareerStatus(
                    'Unable to connect to the career analyzer.',
                    'error'
                );

            } finally {

                button.disabled = false;

                button.textContent =
                    '🔎 Analyze Career URL';

            }

        }
    );

}


/* ============================================================
   STATUS
   ============================================================ */

function showCareerStatus(
    message,
    type = 'info'
) {

    const box =
        document.getElementById(
            'career-url-status'
        );

    if (!box) {
        return;
    }

    box.style.display =
        'block';

    box.className =
        `alert alert-${type}`;

    box.textContent =
        message;

}


/* ============================================================
   RECOMMENDED JOB
   ============================================================ */

function updateBannerTarget() {

    const banner =
        document.getElementById(
            'banner-company-role'
        );

    if (!banner) {
        return;
    }

    const company =
        window.TARGET_COMPANY || '';

    const role =
        window.TARGET_ROLE || '';

    if (company && role) {

        banner.textContent =
            `${company} · ${role}`;

    } else if (role) {

        banner.textContent =
            role;

    } else if (company) {

        banner.textContent =
            company;

    } else {

        banner.textContent =
            'Skill-Gap Predictor';

    }

}


function renderRecommendedJob(job) {

    const card =
        document.getElementById(
            'dashboard-recommendation'
        );

    if (!card || !job) {
        return;
    }

    const role =
        job.role ||
        job.title ||
        'Job Role';

    const company =
        job.company ||
        '';

    const score =
        Number(
            job.score ||
            job.match_pct ||
            0
        );

    const matched =
        Array.isArray(job.matched_skills)
            ? job.matched_skills
            : [];

    const missing =
        Array.isArray(job.missing_skills)
            ? job.missing_skills
            : [];

    const required =
        Array.isArray(job.required_skills)
            ? job.required_skills
            : [];

    card.innerHTML = `

        <h3>
            🎯 Recommended Job Role
        </h3>

        <h4 class="recommendation-role">
            ${escapeHtml(role)}
        </h4>

        ${
            company
                ? `
                    <p>
                        <strong>Company:</strong>
                        ${escapeHtml(company)}
                    </p>
                `
                : ''
        }

        <p>
            <strong>Match Score:</strong>
            <span class="score-highlight">
                ${score}%
            </span>
        </p>

        <div class="recommendation-section">

            <h4 class="success-text">
                ✓ Matching Skills
            </h4>

            <div>

                ${
                    matched.length
                        ? matched
                            .map(
                                skill =>
                                    `<span class="skill-tag-matched">
                                        ${escapeHtml(skill)}
                                    </span>`
                            )
                            .join('')
                        : `
                            <span class="muted">
                                No matching skills detected.
                            </span>
                        `
                }

            </div>

        </div>

        <div class="recommendation-section">

            <h4 class="danger-text">
                ⚠ Missing Skills
            </h4>

            <div>

                ${
                    missing.length
                        ? missing
                            .map(
                                skill =>
                                    `<span class="skill-tag-missing">
                                        ${escapeHtml(skill)}
                                    </span>`
                            )
                            .join('')
                        : `
                            <span class="success-text">
                                No missing skills detected.
                            </span>
                        `
                }

            </div>

        </div>

        ${
            required.length
                ? `
                    <div class="recommendation-section">

                        <h4>
                            Job Requirements
                        </h4>

                        <p class="muted">
                            ${
                                required
                                    .map(escapeHtml)
                                    .join(' • ')
                            }
                        </p>

                    </div>
                `
                : ''
        }

        ${
            job.url
                ? `
                    <a
                        href="${escapeHtml(job.url)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn"
                    >
                        View Original Job 🔗
                    </a>
                `
                : ''
        }

    `;

}


/* ============================================================
   METRICS
   ============================================================ */

async function fetchMetrics() {

    const hasRole =
        Boolean(
            window.TARGET_ROLE
        );

    const hasRequirements =
        Array.isArray(
            window.REQUIRED_SKILLS
        ) &&
        window.REQUIRED_SKILLS.length > 0;

    if (!hasRole && !hasRequirements) {
        return;
    }

    const formData =
        new FormData();

    formData.append(
        'action',
        'get_metrics'
    );

    formData.append(
        'target_company',
        window.TARGET_COMPANY || ''
    );

    formData.append(
        'target_role',
        window.TARGET_ROLE || ''
    );

    formData.append(
        'required_skills',
        JSON.stringify(
            window.REQUIRED_SKILLS || []
        )
    );

    try {

        const response =
            await fetch(
                'api.php',
                {
                    method: 'POST',
                    body: formData
                }
            );

        const data =
            await response.json();

        if (data.status === 'error') {
            return;
        }

        window.LATEST_METRICS =
            data;

        updateMetric(
            'metric-readiness',
            data.readiness_pct,
            '%'
        );

        const matched =
            Array.isArray(data.matched_skills)
                ? data.matched_skills
                : [];

        const missing =
            Array.isArray(data.missing_skills)
                ? data.missing_skills
                : [];

        const matchedCount =
            document.getElementById(
                'metric-matched-count'
            );

        if (matchedCount) {

            matchedCount.textContent =
                `${matched.length} of ${
                    matched.length +
                    missing.length
                } skills matched`;

        }

        updateMetric(
            'metric-confidence',
            data.confidence_pct,
            '%'
        );

        const strength =
            document.getElementById(
                'metric-strength'
            );

        if (strength) {

            strength.textContent =
                data.strength_label ||
                'N/A';

        }

        const ats =
            document.getElementById(
                'metric-ats'
            );

        if (
            ats &&
            data.ats_score !== null &&
            data.ats_score !== undefined
        ) {

            ats.textContent =
                `${data.ats_score} / 100`;

        }

        const matchedBox =
            document.getElementById(
                'matched-skills-tags'
            );

        if (matchedBox) {

            matchedBox.innerHTML =
                matched.length
                    ? matched
                        .map(
                            skill =>
                                `<span class="skill-tag-matched">
                                    ${escapeHtml(skill)}
                                </span>`
                        )
                        .join('')
                    : `
                        <p class="muted">
                            No matching skills detected.
                        </p>
                    `;
        }

        const missingBox =
            document.getElementById(
                'missing-skills-tags'
            );

        if (missingBox) {

            missingBox.innerHTML =
                missing.length
                    ? missing
                        .map(
                            skill =>
                                `<span class="skill-tag-missing">
                                    ${escapeHtml(skill)}
                                </span>`
                        )
                        .join('')
                    : `
                        <p class="success-text">
                            No missing skills detected.
                        </p>
                    `;
        }

        const progress =
            document.getElementById(
                'skill-gap-progress'
            );

        if (progress) {

            progress.style.width =
                `${Number(
                    data.readiness_pct || 0
                )}%`;

        }

        updateCharts(data);

    } catch (error) {

        console.error(
            'Metrics error:',
            error
        );

    }

}


function updateMetric(
    id,
    value,
    suffix = ''
) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    if (
        value === null ||
        value === undefined
    ) {

        element.textContent =
            'N/A';

        return;
    }

    element.textContent =
        `${value}${suffix}`;

}


/* ============================================================
   RESUME UPLOAD
   ============================================================ */

function initResumeUpload() {

    const form =
        document.getElementById(
            'form-resume-upload'
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        'submit',
        async event => {

            event.preventDefault();

            const input =
                document.getElementById(
                    'input-resume-file'
                );

            const status =
                document.getElementById(
                    'resume-upload-status'
                );

            if (
                !input ||
                !input.files ||
                !input.files[0]
            ) {

                status.className =
                    'alert alert-error';

                status.textContent =
                    'Please select a resume file.';

                status.style.display =
                    'block';

                return;
            }

            status.className =
                'alert alert-info';

            status.textContent =
                'Parsing your resume and evaluating ATS compatibility...';

            status.style.display =
                'block';

            const formData =
                new FormData();

            formData.append(
                'action',
                'upload_resume'
            );

            formData.append(
                'resume_file',
                input.files[0]
            );

            formData.append(
                'target_company',
                window.TARGET_COMPANY || ''
            );

            formData.append(
                'target_role',
                window.TARGET_ROLE || ''
            );

            formData.append(
                'required_skills',
                JSON.stringify(
                    window.REQUIRED_SKILLS || []
                )
            );

            try {

                const response =
                    await fetch(
                        'api.php',
                        {
                            method: 'POST',
                            body: formData
                        }
                    );

                const data =
                    await response.json();

                if (data.status === 'success') {

                    status.className =
                        'alert alert-success';

                    status.textContent =
                        'Resume parsed successfully.';

                    if (
                        Array.isArray(
                            data.extracted_skills
                        )
                    ) {

                        window.EXTRACTED_SKILLS =
                            data.extracted_skills;

                    }

                    if (
                        data.ats_score !==
                        undefined
                    ) {

                        window.ATS_SCORE =
                            data.ats_score;

                    }

                    if (
                        data.recommendation
                    ) {

                        window.RECOMMENDED_JOB =
                            data.recommendation;

                        window.TARGET_COMPANY =
                            data.recommendation.company ||
                            '';

                        window.TARGET_ROLE =
                            data.recommendation.role ||
                            '';

                        window.REQUIRED_SKILLS =
                            data.recommendation.required_skills ||
                            [];

                    }

                    setTimeout(
                        () => {
                            window.location.reload();
                        },
                        700
                    );

                } else {

                    status.className =
                        'alert alert-error';

                    status.textContent =
                        data.message ||
                        'Resume processing failed.';

                }

            } catch (error) {

                console.error(error);

                status.className =
                    'alert alert-error';

                status.textContent =
                    'Network error while uploading resume.';

            }

        }
    );

}


/* ============================================================
   JOB TABLE
   ============================================================ */

function initJobRanking() {

    const search =
        document.getElementById(
            'input-job-search'
        );

    if (!search) {
        return;
    }

    search.addEventListener(
        'input',
        () => {

            renderJobTable(
                window.CAREER_JOBS || [],
                search.value
            );

        }
    );

}


function renderJobTable(
    jobs,
    query = ''
) {

    const tbody =
        document.getElementById(
            'tbody-job-ranking'
        );

    if (!tbody) {
        return;
    }

    const search =
        query
            .toLowerCase()
            .trim();

    const filtered =
        (Array.isArray(jobs)
            ? jobs
            : []
        ).filter(job => {

            const company =
                String(
                    job.company || ''
                ).toLowerCase();

            const role =
                String(
                    job.role ||
                    job.title ||
                    ''
                ).toLowerCase();

            return (
                !search ||
                company.includes(search) ||
                role.includes(search)
            );

        });

    if (!filtered.length) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="table-empty"
                >
                    No jobs found.
                </td>
            </tr>
        `;

        return;
    }

    tbody.innerHTML =
        filtered.map(job => {

            const company =
                job.company || 'N/A';

            const role =
                job.role ||
                job.title ||
                'N/A';

            const score =
                Number(
                    job.match_pct ||
                    job.score ||
                    0
                );

            const matched =
                Array.isArray(
                    job.matched_skills
                )
                    ? job.matched_skills
                    : [];

            const missing =
                Array.isArray(
                    job.missing_skills
                )
                    ? job.missing_skills
                    : [];

            return `
                <tr>

                    <td>
                        ${escapeHtml(company)}
                    </td>

                    <td>
                        ${escapeHtml(role)}
                    </td>

                    <td>
                        <strong>
                            ${score}%
                        </strong>
                    </td>

                    <td>
                        ${matched.length}
                    </td>

                    <td>
                        ${
                            missing
                                .slice(0, 3)
                                .map(escapeHtml)
                                .join(', ') ||
                            'None'
                        }
                    </td>

                    <td>

                        ${
                            job.url
                                ? `
                                    <a
                                        href="${escapeHtml(job.url)}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Open 🔗
                                    </a>
                                `
                                : 'N/A'
                        }

                    </td>

                </tr>
            `;

        }).join('');

}


/* ============================================================
   ROADMAP
   ============================================================ */

async function loadDynamicRoadmap() {

    const roadmap =
        document.getElementById(
            'container-dynamic-roadmap'
        );

    const resources =
        document.getElementById(
            'container-dynamic-resources'
        );

    if (!roadmap || !resources) {
        return;
    }

    if (!window.TARGET_ROLE) {

        roadmap.innerHTML = `
            <p class="muted">
                Analyze a career URL first.
            </p>
        `;

        return;
    }

    const missing =
        window.LATEST_METRICS
            ?.missing_skills || [];

    const formData =
        new FormData();

    formData.append(
        'action',
        'get_roadmap'
    );

    formData.append(
        'missing_skills',
        JSON.stringify(missing)
    );

    formData.append(
        'target_company',
        window.TARGET_COMPANY || ''
    );

    formData.append(
        'target_role',
        window.TARGET_ROLE || ''
    );

    try {

        const response =
            await fetch(
                'api.php',
                {
                    method: 'POST',
                    body: formData
                }
            );

        const data =
            await response.json();

        if (
            data.status !== 'success' ||
            !data.roadmap
        ) {

            roadmap.innerHTML = `
                <p class="muted">
                    ${escapeHtml(
                        data.message ||
                        'Roadmap is not available yet.'
                    )}
                </p>
            `;

            return;
        }

        const result =
            data.roadmap;

        roadmap.innerHTML =
            (result.phases || [])
                .map(
                    phase => `
                        <div class="roadmap-phase-card">

                            <h4>
                                ${escapeHtml(
                                    phase.phase || ''
                                )}
                            </h4>

                            <p>
                                ${escapeHtml(
                                    phase.objective || ''
                                )}
                            </p>

                            <p class="muted">
                                ⏱️
                                ${escapeHtml(
                                    phase.duration || ''
                                )}
                            </p>

                            <ul>

                                ${
                                    (phase.action_items || [])
                                        .map(
                                            item =>
                                                `<li>
                                                    ${escapeHtml(item)}
                                                </li>`
                                        )
                                        .join('')
                                }

                            </ul>

                        </div>
                    `
                )
                .join('');

        resources.innerHTML =
            (result.resources || [])
                .map(
                    resource => `
                        <details>

                            <summary>
                                📖
                                ${escapeHtml(
                                    resource.skill || ''
                                )}
                            </summary>

                            <p>
                                <strong>
                                    Platform:
                                </strong>
                                ${escapeHtml(
                                    resource.platform || ''
                                )}
                            </p>

                            <p>
                                <strong>
                                    Time:
                                </strong>
                                ${escapeHtml(
                                    resource.time || ''
                                )}
                            </p>

                            ${
                                resource.docs
                                    ? `
                                        <a
                                            href="${escapeHtml(resource.docs)}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Official Documentation 🔗
                                        </a>
                                    `
                                    : ''
                            }

                            <p>
                                <strong>
                                    Project:
                                </strong>
                                ${escapeHtml(
                                    resource.project || ''
                                )}
                            </p>

                        </details>
                    `
                )
                .join('');

    } catch (error) {

        console.error(error);

        roadmap.innerHTML = `
            <p class="danger-text">
                Unable to load roadmap.
            </p>
        `;

    }

}


/* ============================================================
   INTERVIEW
   ============================================================ */

async function loadDynamicInterview() {

    const container =
        document.getElementById(
            'container-dynamic-interview'
        );

    if (!container) {
        return;
    }

    if (!window.TARGET_ROLE) {

        container.innerHTML = `
            <p class="muted">
                Analyze a career URL first.
            </p>
        `;

        return;
    }

    const matched =
        window.LATEST_METRICS
            ?.matched_skills || [];

    const missing =
        window.LATEST_METRICS
            ?.missing_skills || [];

    const formData =
        new FormData();

    formData.append(
        'action',
        'get_interview'
    );

    formData.append(
        'target_role',
        window.TARGET_ROLE || ''
    );

    formData.append(
        'matched_skills',
        JSON.stringify(matched)
    );

    formData.append(
        'missing_skills',
        JSON.stringify(missing)
    );

    try {

        const response =
            await fetch(
                'api.php',
                {
                    method: 'POST',
                    body: formData
                }
            );

        const data =
            await response.json();

        if (
            data.status !== 'success' ||
            !data.prep_data
        ) {

            container.innerHTML = `
                <p class="muted">
                    ${escapeHtml(
                        data.message ||
                        'Interview preparation is unavailable.'
                    )}
                </p>
            `;

            return;
        }

        const prep =
            data.prep_data;

        let html = '';

        if (
            prep.technical_known &&
            prep.technical_known.length
        ) {

            html += `
                <h4>
                    🧠 Technical Questions
                </h4>
            `;

            html +=
                prep.technical_known
                    .map(
                        item => `
                            <details>

                                <summary>
                                    ${escapeHtml(
                                        item.q || ''
                                    )}
                                </summary>

                                <p>
                                    <strong>
                                        Ideal Answer:
                                    </strong>
                                    ${escapeHtml(
                                        item.a || ''
                                    )}
                                </p>

                                <p>
                                    💡
                                    ${escapeHtml(
                                        item.tip || ''
                                    )}
                                </p>

                            </details>
                        `
                    )
                    .join('');
        }

        if (
            prep.gap_questions &&
            prep.gap_questions.length
        ) {

            html += `
                <h4 class="danger-text">
                    ⚠ Skill Gap Questions
                </h4>
            `;

            html +=
                prep.gap_questions
                    .map(
                        item => `
                            <details>

                                <summary>
                                    ${escapeHtml(
                                        item.q || ''
                                    )}
                                </summary>

                                <p>
                                    <strong>
                                        Ideal Answer:
                                    </strong>
                                    ${escapeHtml(
                                        item.a || ''
                                    )}
                                </p>

                                <p>
                                    💡
                                    ${escapeHtml(
                                        item.tip || ''
                                    )}
                                </p>

                            </details>
                        `
                    )
                    .join('');
        }

        if (
            prep.behavioral &&
            prep.behavioral.length
        ) {

            html += `
                <h4 class="success-text">
                    👔 HR & Behavioral Questions
                </h4>
            `;

            html +=
                prep.behavioral
                    .map(
                        item => `
                            <details>

                                <summary>
                                    ${escapeHtml(
                                        item.q || ''
                                    )}
                                </summary>

                                <p>
                                    <strong>
                                        Framework:
                                    </strong>
                                    ${escapeHtml(
                                        item.framework || ''
                                    )}
                                </p>

                                <p>
                                    ${escapeHtml(
                                        item.guide || ''
                                    )}
                                </p>

                            </details>
                        `
                    )
                    .join('');
        }

        container.innerHTML =
            html ||
            '<p class="muted">No questions available.</p>';

    } catch (error) {

        console.error(error);

        container.innerHTML = `
            <p class="danger-text">
                Unable to load interview preparation.
            </p>
        `;

    }

}


/* ============================================================
   CHARTS
   ============================================================ */

let radarChart = null;
let pieChart = null;

function initCharts() {

    if (
        typeof Chart === 'undefined'
    ) {
        return;
    }

    const radar =
        document.getElementById(
            'radarChartCtx'
        );

    const pie =
        document.getElementById(
            'pieChartCtx'
        );

    if (radar) {

        radarChart =
            new Chart(
                radar,
                {
                    type: 'radar',

                    data: {
                        labels: [
                            'Technical Skills',
                            'ATS',
                            'Projects',
                            'CS Fundamentals',
                            'Job Fit'
                        ],

                        datasets: [
                            {
                                label:
                                    'Current Score',

                                data: [
                                    0,
                                    0,
                                    0,
                                    0,
                                    0
                                ],

                                backgroundColor:
                                    'rgba(99,102,241,0.25)',

                                borderColor:
                                    '#6366f1'
                            }
                        ]
                    },

                    options: {
                        responsive: true,
                        maintainAspectRatio: false,

                        scales: {
                            r: {
                                min: 0,
                                max: 100
                            }
                        }
                    }
                }
            );

    }

    if (pie) {

        pieChart =
            new Chart(
                pie,
                {
                    type: 'doughnut',

                    data: {
                        labels: [
                            'Detected Skills'
                        ],

                        datasets: [
                            {
                                data: [1]
                            }
                        ]
                    },

                    options: {
                        responsive: true,
                        maintainAspectRatio: false
                    }
                }
            );

    }

}


function updateCharts(data) {

    if (radarChart) {

        const skillCount =
            Array.isArray(
                window.EXTRACTED_SKILLS
            )
                ? window.EXTRACTED_SKILLS.length
                : 0;

        radarChart
            .data
            .datasets[0]
            .data = [
                Math.min(
                    100,
                    skillCount * 8
                ),

                Number(
                    data.ats_score || 0
                ),

                Number(
                    data.project_score || 0
                ),

                Number(
                    data.cs_score || 0
                ),

                Number(
                    data.readiness_pct || 0
                )
            ];

        radarChart.update();

    }

    if (
        pieChart &&
        data.domain_percentages
    ) {

        const labels =
            Object.keys(
                data.domain_percentages
            );

        const values =
            labels.map(
                label =>
                    data.domain_percentages[label]
            );

        if (labels.length) {

            pieChart.data.labels =
                labels;

            pieChart.data.datasets[0].data =
                values;

            pieChart.update();

        }

    }

}


/* ============================================================
   PROFILE
   ============================================================ */

function initProfileForm() {

    const form =
        document.getElementById(
            'form-update-profile'
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        'submit',
        async event => {

            event.preventDefault();

            const formData =
                new FormData(form);

            formData.append(
                'action',
                'update_profile'
            );

            try {

                const response =
                    await fetch(
                        'api.php',
                        {
                            method: 'POST',
                            body: formData
                        }
                    );

                const data =
                    await response.json();

                if (
                    data.status ===
                    'success'
                ) {

                    alert(
                        'Profile updated successfully.'
                    );

                    window.location.reload();

                } else {

                    alert(
                        data.message ||
                        'Profile update failed.'
                    );

                }

            } catch (error) {

                alert(
                    'Unable to update profile.'
                );

            }

        }
    );

}


/* ============================================================
   AI INTERVIEW
   ============================================================ */

function initAIInterviewAssistant() {

    const assistantTab =
        document.getElementById(
            'tab-btn-ai-assistant'
        );

    const evaluatorTab =
        document.getElementById(
            'tab-btn-ai-evaluator'
        );

    const questionsTab =
        document.getElementById(
            'tab-btn-ai-questions'
        );

    const assistant =
        document.getElementById(
            'subtab-ai-assistant'
        );

    const evaluator =
        document.getElementById(
            'subtab-ai-evaluator'
        );

    const questions =
        document.getElementById(
            'subtab-ai-questions'
        );

    if (
        assistantTab &&
        evaluatorTab &&
        questionsTab
    ) {

        assistantTab.addEventListener(
            'click',
            () => {

                assistantTab.classList.add(
                    'active'
                );

                evaluatorTab.classList.remove(
                    'active'
                );

                questionsTab.classList.remove(
                    'active'
                );

                assistant.style.display =
                    'block';

                evaluator.style.display =
                    'none';

                questions.style.display =
                    'none';

            }
        );

        evaluatorTab.addEventListener(
            'click',
            () => {

                evaluatorTab.classList.add(
                    'active'
                );

                assistantTab.classList.remove(
                    'active'
                );

                questionsTab.classList.remove(
                    'active'
                );

                assistant.style.display =
                    'none';

                evaluator.style.display =
                    'block';

                questions.style.display =
                    'none';

            }
        );

        questionsTab.addEventListener(
            'click',
            () => {

                questionsTab.classList.add(
                    'active'
                );

                assistantTab.classList.remove(
                    'active'
                );

                evaluatorTab.classList.remove(
                    'active'
                );

                assistant.style.display =
                    'none';

                evaluator.style.display =
                    'none';

                questions.style.display =
                    'block';

            }
        );

    }


    const prompt =
        document.getElementById(
            'input-ai-prompt'
        );

    const submit =
        document.getElementById(
            'btn-submit-ai-prompt'
        );

    const responseCard =
        document.getElementById(
            'ai-assistant-response-card'
        );

    const responseTitle =
        document.getElementById(
            'ai-response-title'
        );

    const responseBody =
        document.getElementById(
            'ai-response-body'
        );

    if (submit && prompt) {

        submit.addEventListener(
            'click',
            async () => {

                const question =
                    prompt.value.trim();

                if (!question) {
                    return;
                }

                responseCard.style.display =
                    'block';

                responseTitle.textContent =
                    '⏳ Generating response...';

                responseBody.textContent =
                    'Please wait...';

                const formData =
                    new FormData();

                formData.append(
                    'action',
                    'ask_interview_ai'
                );

                formData.append(
                    'prompt',
                    question
                );

                formData.append(
                    'target_role',
                    window.TARGET_ROLE || ''
                );

                formData.append(
                    'target_company',
                    window.TARGET_COMPANY || ''
                );

                try {

                    const response =
                        await fetch(
                            'api.php',
                            {
                                method: 'POST',
                                body: formData
                            }
                        );

                    const data =
                        await response.json();

                    if (
                        data.status !==
                        'success'
                    ) {

                        responseTitle.textContent =
                            'Error';

                        responseBody.textContent =
                            data.message ||
                            'Unable to generate response.';

                        return;
                    }

                    responseTitle.textContent =
                        data.title ||
                        'Interview Guidance';

                    let html = '';

                    if (
                        Array.isArray(
                            data.advice_steps
                        )
                    ) {

                        html += '<ul>';

                        data.advice_steps.forEach(
                            step => {

                                html +=
                                    `<li>${escapeHtml(step)}</li>`;

                            }
                        );

                        html += '</ul>';
                    }

                    if (data.sample_question) {

                        html += `
                            <h4>
                                Practice Question
                            </h4>

                            <p>
                                ${escapeHtml(
                                    data.sample_question
                                )}
                            </p>
                        `;

                    }

                    if (data.sample_answer) {

                        html += `
                            <h4>
                                Answer Strategy
                            </h4>

                            <p>
                                ${escapeHtml(
                                    data.sample_answer
                                )}
                            </p>
                        `;

                    }

                    responseBody.innerHTML =
                        html;

                } catch (error) {

                    responseTitle.textContent =
                        'Connection Error';

                    responseBody.textContent =
                        'Unable to connect to the interview assistant.';

                }

            }
        );

    }


    const questionSelect =
        document.getElementById(
            'select-eval-question'
        );

    const customQuestion =
        document.getElementById(
            'input-eval-custom-q'
        );

    if (
        questionSelect &&
        customQuestion
    ) {

        questionSelect.addEventListener(
            'change',
            () => {

                customQuestion.style.display =
                    questionSelect.value === 'custom'
                        ? 'block'
                        : 'none';

            }
        );

    }


    const evaluate =
        document.getElementById(
            'btn-submit-eval-answer'
        );

    if (evaluate) {

        evaluate.addEventListener(
            'click',
            async () => {

                let question =
                    questionSelect
                        ? questionSelect.value
                        : '';

                if (question === 'custom') {

                    question =
                        customQuestion.value.trim();

                }

                const answer =
                    document
                        .getElementById(
                            'input-eval-user-answer'
                        )
                        .value
                        .trim();

                if (!question || !answer) {

                    alert(
                        'Please provide both question and answer.'
                    );

                    return;
                }

                const formData =
                    new FormData();

                formData.append(
                    'action',
                    'evaluate_answer'
                );

                formData.append(
                    'question',
                    question
                );

                formData.append(
                    'user_answer',
                    answer
                );

                formData.append(
                    'target_role',
                    window.TARGET_ROLE || ''
                );

                try {

                    const response =
                        await fetch(
                            'api.php',
                            {
                                method: 'POST',
                                body: formData
                            }
                        );

                    const data =
                        await response.json();

                    if (
                        data.status !==
                        'success'
                    ) {

                        alert(
                            data.message ||
                            'Evaluation failed.'
                        );

                        return;
                    }

                    const card =
                        document.getElementById(
                            'ai-evaluator-result-card'
                        );

                    card.style.display =
                        'block';

                    document
                        .getElementById(
                            'eval-overall-score-display'
                        )
                        .textContent =
                        `Overall Score: ${
                            data.total_score || 0
                        } / 100`;

                    document
                        .getElementById(
                            'eval-rating-badge'
                        )
                        .textContent =
                        data.rating || '';

                    const breakdown =
                        data.breakdown || {};

                    document
                        .getElementById(
                            'eval-score-tech'
                        )
                        .textContent =
                        `${breakdown.technical_accuracy || 0} / 20`;

                    document
                        .getElementById(
                            'eval-score-kw'
                        )
                        .textContent =
                        `${breakdown.keywords_terminology || 0} / 20`;

                    document
                        .getElementById(
                            'eval-score-struct'
                        )
                        .textContent =
                        `${breakdown.structure_clarity || 0} / 20`;

                    document
                        .getElementById(
                            'eval-score-rel'
                        )
                        .textContent =
                        `${breakdown.real_world_relevance || 0} / 20`;

                    document
                        .getElementById(
                            'eval-score-comp'
                        )
                        .textContent =
                        `${breakdown.completeness || 0} / 20`;

                    document
                        .getElementById(
                            'eval-strengths-list'
                        )
                        .innerHTML =
                        (data.strengths || [])
                            .map(
                                item =>
                                    `<li>${escapeHtml(item)}</li>`
                            )
                            .join('');

                    document
                        .getElementById(
                            'eval-missing-list'
                        )
                        .innerHTML =
                        (data.missing_points || [])
                            .map(
                                item =>
                                    `<li>${escapeHtml(item)}</li>`
                            )
                            .join('');

                    document
                        .getElementById(
                            'eval-ideal-answer'
                        )
                        .textContent =
                        data.ideal_answer || '';

                } catch (error) {

                    alert(
                        'Unable to evaluate answer.'
                    );

                }

            }
        );

    }

}


/* ============================================================
   MOBILE SIDEBAR
   ============================================================ */

function initMobileUI() {

    const button =
        document.getElementById(
            'mobile-menu-toggle'
        );

    const sidebar =
        document.querySelector(
            '.sidebar'
        );

    const overlay =
        document.getElementById(
            'sidebar-overlay'
        );

    if (!button || !sidebar) {
        return;
    }

    const close =
        () => {

            sidebar.classList.remove(
                'mobile-open'
            );

            if (overlay) {

                overlay.classList.remove(
                    'active'
                );

            }

        };

    button.addEventListener(
        'click',
        () => {

            sidebar.classList.toggle(
                'mobile-open'
            );

            if (overlay) {

                overlay.classList.toggle(
                    'active'
                );

            }

        }
    );

    if (overlay) {

        overlay.addEventListener(
            'click',
            close
        );

    }

    document
        .querySelectorAll('.nav-item')
        .forEach(
            item =>
                item.addEventListener(
                    'click',
                    close
                )
        );

}


/* ============================================================
   DARK / LIGHT MODE
   ============================================================ */

function initThemeToggle() {

    const button =
        document.getElementById(
            'theme-toggle'
        );

    if (!button) {
        return;
    }

    const saved =
        localStorage.getItem(
            'sgp-theme'
        );

    if (saved === 'light') {

        document.body.classList.add(
            'light-theme'
        );

        button.textContent =
            '☀️';

    }

    button.addEventListener(
        'click',
        () => {

            const light =
                document.body.classList.toggle(
                    'light-theme'
                );

            localStorage.setItem(
                'sgp-theme',
                light
                    ? 'light'
                    : 'dark'
            );

            button.textContent =
                light
                    ? '☀️'
                    : '🌙';

        }
    );

}


/* ============================================================
   HELPERS
   ============================================================ */

function escapeHtml(value) {

    const div =
        document.createElement(
            'div'
        );

    div.textContent =
        value === null ||
        value === undefined
            ? ''
            : String(value);

    return div.innerHTML;
}
