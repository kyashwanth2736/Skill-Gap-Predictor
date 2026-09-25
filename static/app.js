/**
 * Skill-Gap Predictor Frontend Application JS
 * IEEE CS Bangalore Chapter | Project ID: P19 | GITAM University
 */

document.addEventListener('DOMContentLoaded', () => {
    initAuthTabs();
    initNavigation();
    initCompanySelector();
    initCharts();
    initSkillEditor();
    initResumeUpload();
    initJobRanking();
    initWebScraper();
    initProfileForm();
    initAIInterviewAssistant();
    
    // Initialize company/role targets and fetch metrics
    updateSelectedCompanyRole();
});

// Auth Tabs (Login / Signup)
function initAuthTabs() {
    const tabLogin = document.getElementById('tab-btn-login');
    const tabSignup = document.getElementById('tab-btn-signup');
    const formLogin = document.getElementById('form-login-box');
    const formSignup = document.getElementById('form-signup-box');

    if (tabLogin && tabSignup) {
        tabLogin.addEventListener('click', () => {
            tabLogin.classList.add('active');
            tabSignup.classList.remove('active');
            formLogin.style.display = 'block';
            formSignup.style.display = 'none';
        });

        tabSignup.addEventListener('click', () => {
            tabSignup.classList.add('active');
            tabLogin.classList.remove('active');
            formSignup.style.display = 'block';
            formLogin.style.display = 'none';
        });
    }

    // Login submit
    const loginBtn = document.getElementById('btn-do-login');
    if (loginBtn) {
        loginBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const email = document.getElementById('login_email').value.trim();
            const password = document.getElementById('login_password').value;
            const errDiv = document.getElementById('login-error-msg');

            if (!email || !password) {
                errDiv.textContent = 'Please enter both email and password.';
                errDiv.style.display = 'block';
                return;
            }

            const formData = new FormData();
            formData.append('action', 'login');
            formData.append('email', email);
            formData.append('password', password);

            try {
                const res = await fetch('api.php', {
                    method: 'POST',
                    body: formData
                });

                const json = await res.json();

                if (json.status === 'success') {
                    window.location.reload();
                } else {
                    errDiv.textContent = json.message;
                    errDiv.style.display = 'block';
                }
            } catch (err) {
                errDiv.textContent = 'Connection error. Please try again.';
                errDiv.style.display = 'block';
            }
        });
    }

    // Signup submit
    const signupBtn = document.getElementById('btn-do-signup');
    if (signupBtn) {
        signupBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const name = document.getElementById('signup_name').value.trim();
            const email = document.getElementById('signup_email').value.trim();
            const pwd = document.getElementById('signup_pwd').value;
            const uni = document.getElementById('signup_uni').value;
            const branch = document.getElementById('signup_branch').value;
            const year = document.getElementById('signup_year').value;
            const errDiv = document.getElementById('signup-error-msg');
            const succDiv = document.getElementById('signup-success-msg');

            const formData = new FormData();
            formData.append('action', 'signup');
            formData.append('name', name);
            formData.append('email', email);
            formData.append('password', pwd);
            formData.append('university', uni);
            formData.append('branch', branch);
            formData.append('graduation_year', year);

            try {
                const res = await fetch('api.php', {
                    method: 'POST',
                    body: formData
                });

                const json = await res.json();

                if (json.status === 'success') {
                    succDiv.textContent = json.message;
                    succDiv.style.display = 'block';
                    errDiv.style.display = 'none';

                    setTimeout(() => {
                        tabLogin.click();
                    }, 1500);
                } else {
                    errDiv.textContent = json.message;
                    errDiv.style.display = 'block';
                    succDiv.style.display = 'none';
                }
            } catch (err) {
                errDiv.textContent = 'Registration error. Please try again.';
                errDiv.style.display = 'block';
            }
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('btn-logout');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch('api.php?action=logout');
            window.location.reload();
        });
    }
}

// Sidebar Navigation
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view-panel');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            const targetViewId = item.getAttribute('data-view');

            navItems.forEach(i => i.classList.remove('active'));
            views.forEach(v => v.style.display = 'none');

            item.classList.add('active');

            const targetEl = document.getElementById(targetViewId);

            if (targetEl) {
                targetEl.style.display = 'block';
            }

            if (targetViewId === 'view-roadmap') {
                loadDynamicRoadmap();
            } else if (targetViewId === 'view-interview') {
                loadDynamicInterview();
            }
        });
    });
}

// Company / Role Selection
function initCompanySelector() {
    const modeBenchmark = document.getElementById('mode-benchmark');
    const modeCustom = document.getElementById('mode-custom');
    const benchmarkBox = document.getElementById('box-benchmark-select');
    const customBox = document.getElementById('box-custom-select');

    if (modeBenchmark && modeCustom) {
        modeBenchmark.addEventListener('change', () => {
            benchmarkBox.style.display = 'block';
            customBox.style.display = 'none';
            updateSelectedCompanyRole();
        });

        modeCustom.addEventListener('change', () => {
            benchmarkBox.style.display = 'none';
            customBox.style.display = 'block';
            updateSelectedCompanyRole();
        });
    }

    const compSelect = document.getElementById('select-company');
    const roleSelect = document.getElementById('select-role');

    if (compSelect && roleSelect) {
        compSelect.addEventListener('change', () => {
            if (
                window.BENCHMARK_DATA &&
                window.BENCHMARK_DATA[compSelect.value]
            ) {
                const roles = Object.keys(
                    window.BENCHMARK_DATA[compSelect.value].roles
                );

                roleSelect.innerHTML = roles
                    .map(r => `<option value="${r}">${r}</option>`)
                    .join('');
            }

            updateSelectedCompanyRole();
        });

        roleSelect.addEventListener('change', updateSelectedCompanyRole);
    }
}

function updateSelectedCompanyRole() {
    let comp = 'Google';
    let role = 'Software Development Engineer (SDE)';
    let requiredSkills = [];

    const modeBenchmark = document.getElementById('mode-benchmark');
    const isBenchmark = modeBenchmark ? modeBenchmark.checked : true;

    if (isBenchmark) {
        const compSelect = document.getElementById('select-company');
        const roleSelect = document.getElementById('select-role');

        if (compSelect && roleSelect && window.BENCHMARK_DATA) {
            comp = compSelect.value;
            role = roleSelect.value;

            if (
                window.BENCHMARK_DATA[comp] &&
                window.BENCHMARK_DATA[comp].roles[role]
            ) {
                requiredSkills =
                    window.BENCHMARK_DATA[comp].roles[role].required_skills || [];
            }
        }
    } else {
        const customCompanyInput =
            document.getElementById('input-custom-company');

        const customRoleInput =
            document.getElementById('input-custom-role');

        comp = customCompanyInput
            ? customCompanyInput.value || 'Zoho'
            : 'Zoho';

        role = customRoleInput
            ? customRoleInput.value || 'Backend Engineer'
            : 'Backend Engineer';

        const checked =
            document.querySelectorAll('.custom-skill-checkbox:checked');

        requiredSkills = Array.from(checked).map(c => c.value);
    }

    window.TARGET_COMPANY = comp;
    window.TARGET_ROLE = role;
    window.REQUIRED_SKILLS = requiredSkills;

    const bannerCompanyRole =
        document.getElementById('banner-company-role');

    if (bannerCompanyRole) {
        bannerCompanyRole.textContent = `${comp} · ${role}`;
    }

    // Update PDF report hidden fields
    const reportCompany =
        document.getElementById('input-report-company');

    const reportRole =
        document.getElementById('report-target-role');

    if (reportCompany) {
        reportCompany.value = comp;
    }

    if (reportRole) {
        reportRole.value = role;
    }

    fetchMetrics();
}

async function fetchMetrics() {
    const formData = new FormData();

    formData.append('action', 'get_metrics');
    formData.append(
        'target_company',
        window.TARGET_COMPANY || 'Google'
    );

    formData.append(
        'target_role',
        window.TARGET_ROLE || 'Software Development Engineer (SDE)'
    );

    formData.append(
        'required_skills',
        JSON.stringify(window.REQUIRED_SKILLS || [])
    );

    try {
        const res = await fetch('api.php', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        window.LATEST_METRICS = data;

        const readinessVal =
            data &&
            data.readiness_pct !== undefined &&
            data.readiness_pct !== null
                ? data.readiness_pct
                : 65.0;

        const confidenceVal =
            data &&
            data.confidence_pct !== undefined &&
            data.confidence_pct !== null
                ? data.confidence_pct
                : 80.0;

        const matchedSkills =
            data && data.matched_skills
                ? data.matched_skills
                : [];

        const missingSkills =
            data && data.missing_skills
                ? data.missing_skills
                : [];

        const reqTotal =
            window.REQUIRED_SKILLS &&
            window.REQUIRED_SKILLS.length
                ? window.REQUIRED_SKILLS.length
                : matchedSkills.length + missingSkills.length;

        // Update DOM metrics safely
        const readinessEl =
            document.getElementById('metric-readiness');

        if (readinessEl) {
            readinessEl.textContent = `${readinessVal}%`;
        }

        const matchedCountEl =
            document.getElementById('metric-matched-count');

        if (matchedCountEl) {
            matchedCountEl.textContent =
                `${matchedSkills.length} of ${reqTotal} Skills Matched`;
        }

        const confidenceEl =
            document.getElementById('metric-confidence');

        if (confidenceEl) {
            confidenceEl.textContent = `${confidenceVal}%`;
        }

        const strengthEl =
            document.getElementById('metric-strength');

        if (strengthEl) {
            strengthEl.textContent =
                data.strength_label || 'Strong';

            strengthEl.style.color =
                data.strength_color || '#34d399';
        }

        // Update skill tags
        const matchedBox =
            document.getElementById('matched-skills-tags');

        const missingBox =
            document.getElementById('missing-skills-tags');

        if (matchedBox) {
            matchedBox.innerHTML = matchedSkills.length
                ? matchedSkills
                      .map(
                          s =>
                              `<span class="skill-tag-matched">${s}</span>`
                      )
                      .join('')
                : '<p style="color:#94a3b8;">No matching skills detected yet.</p>';
        }

        if (missingBox) {
            missingBox.innerHTML = missingSkills.length
                ? missingSkills
                      .map(
                          s =>
                              `<span class="skill-tag-missing">${s}</span>`
                      )
                      .join('')
                : '<p style="color:#10b981;">Awesome! All required skills are matched.</p>';
        }

        // Update Charts
        updateCharts(data);

        // Update dynamic roadmap and interview prep
        loadDynamicRoadmap();
        loadDynamicInterview();

    } catch (err) {
        console.error('Error fetching metrics:', err);
    }
}

// Dynamic Career Roadmap loader
async function loadDynamicRoadmap() {
    const roadmapContainer =
        document.getElementById('container-dynamic-roadmap');

    const resourcesContainer =
        document.getElementById('container-dynamic-resources');

    if (!roadmapContainer || !resourcesContainer) {
        return;
    }

    const missingSkills =
        window.LATEST_METRICS &&
        window.LATEST_METRICS.missing_skills
            ? window.LATEST_METRICS.missing_skills
            : [];

    const formData = new FormData();

    formData.append(
        'action',
        'get_roadmap'
    );

    formData.append(
        'missing_skills',
        JSON.stringify(missingSkills)
    );

    formData.append(
        'target_company',
        window.TARGET_COMPANY || 'Google'
    );

    formData.append(
        'target_role',
        window.TARGET_ROLE || 'Software Engineer'
    );

    try {
        const res = await fetch('api.php', {
            method: 'POST',
            body: formData
        });

        const json = await res.json();

        if (json.status === 'success' && json.roadmap) {
            const r = json.roadmap;

            // Render phases
            roadmapContainer.innerHTML = r.phases
                .map(
                    p => `
                <div class="roadmap-phase-card">
                    <div class="roadmap-phase-title">
                        ${p.phase} — ${p.objective}
                    </div>

                    <div class="roadmap-phase-duration">
                        ⏱️ Timeline: ${p.duration} |
                        Target Skills: ${(p.skills || []).join(', ')}
                    </div>

                    <ul style="color: #d1d5db; padding-left: 20px; line-height: 1.6;">
                        ${(p.action_items || [])
                            .map(item => `<li>${item}</li>`)
                            .join('')}
                    </ul>
                </div>
            `
                )
                .join('');

            // Render resources
            resourcesContainer.innerHTML = r.resources
                .map(
                    resItem => `
                    <details style="margin-bottom: 12px;">
                        <summary>
                            📖 ${resItem.skill} Mastery Guide & Portfolio Project
                        </summary>

                        <div style="padding-top: 12px; color: #d1d5db; line-height: 1.6;">
                            <p style="margin-bottom: 6px;">
                                <strong>Recommended Platform:</strong>
                                <code>${resItem.platform}</code>
                            </p>

                            <p style="margin-bottom: 6px;">
                                <strong>Estimated Commitment:</strong>
                                <code>${resItem.time}</code>
                            </p>

                            <p style="margin-bottom: 6px;">
                                <strong>Official Documentation:</strong>
                                <a href="${resItem.docs}"
                                   target="_blank"
                                   class="extracted-link">
                                    ${resItem.docs} 🔗
                                </a>
                            </p>

                            <p style="margin-top: 8px;">
                                <strong>Portfolio Project Idea:</strong>
                                💡 <em>${resItem.project}</em>
                            </p>
                        </div>
                    </details>
                `
                )
                .join('');
        }
    } catch (err) {
        console.error('Error loading roadmap:', err);
    }
}

// Dynamic AI Interview Prep loader
async function loadDynamicInterview() {
    const container =
        document.getElementById('container-dynamic-interview');

    if (!container) {
        return;
    }

    const matchedSkills =
        window.LATEST_METRICS &&
        window.LATEST_METRICS.matched_skills
            ? window.LATEST_METRICS.matched_skills
            : [];

    const missingSkills =
        window.LATEST_METRICS &&
        window.LATEST_METRICS.missing_skills
            ? window.LATEST_METRICS.missing_skills
            : [];

    const formData = new FormData();

    formData.append(
        'action',
        'get_interview'
    );

    formData.append(
        'target_role',
        window.TARGET_ROLE || 'Software Engineer'
    );

    formData.append(
        'matched_skills',
        JSON.stringify(matchedSkills)
    );

    formData.append(
        'missing_skills',
        JSON.stringify(missingSkills)
    );

    try {
        const res = await fetch('api.php', {
            method: 'POST',
            body: formData
        });

        const json = await res.json();

        if (json.status === 'success' && json.prep_data) {
            const prep = json.prep_data;
            let html = '';

            if (
                prep.technical_known &&
                prep.technical_known.length
            ) {
                html += `
                    <h4 style="color: var(--cyan-light); margin-bottom: 14px;">
                        🧠 Technical Questions on Skills You Have
                    </h4>
                `;

                html += prep.technical_known
                    .map(
                        (item, idx) => `
                        <details style="margin-bottom: 12px;">
                            <summary>
                                Q${idx + 1} (${item.skill}): ${item.q}
                            </summary>

                            <div style="padding-top: 12px; color: #d1d5db; line-height: 1.6;">
                                <p>
                                    <strong>Ideal Answer:</strong>
                                    ${item.a}
                                </p>

                                <p style="color: var(--cyan-light); margin-top: 6px;">
                                    💡 <strong>Mentor Tip:</strong>
                                    ${item.tip}
                                </p>
                            </div>
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
                    <h4 style="color: var(--rose); margin-top: 24px; margin-bottom: 14px;">
                        ⚠️ Skill-Gap Drill Questions (Study Before Placement)
                    </h4>
                `;

                html += prep.gap_questions
                    .map(
                        (item, idx) => `
                        <details style="margin-bottom: 12px;">
                            <summary>
                                Gap Drill ${idx + 1} (${item.skill}): ${item.q}
                            </summary>

                            <div style="padding-top: 12px; color: #d1d5db; line-height: 1.6;">
                                <p>
                                    <strong>Ideal Answer:</strong>
                                    ${item.a}
                                </p>

                                <p style="color: var(--amber); margin-top: 6px;">
                                    💡 <strong>Preparation Tip:</strong>
                                    ${item.tip}
                                </p>
                            </div>
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
                    <h4 style="color: var(--emerald); margin-top: 24px; margin-bottom: 14px;">
                        👔 HR & Behavioral Questions (STAR Framework)
                    </h4>
                `;

                html += prep.behavioral
                    .map(
                        (item, idx) => `
                        <details style="margin-bottom: 12px;">
                            <summary>
                                HR Q${idx + 1}: ${item.q}
                            </summary>

                            <div style="padding-top: 12px; color: #d1d5db; line-height: 1.6;">
                                <p>
                                    <strong>Framework:</strong>
                                    <code>${item.framework}</code>
                                </p>

                                <p style="margin-top: 6px;">
                                    <strong>Guide:</strong>
                                    ${item.guide}
                                </p>
                            </div>
                        </details>
                    `
                    )
                    .join('');
            }

            container.innerHTML = html;
        }
    } catch (err) {
        console.error('Error loading interview prep:', err);
    }
}

// Chart.js Radar & Pie initialization
let radarChart = null;
let pieChart = null;

function initCharts() {
    const radarCtx =
        document.getElementById('radarChartCtx');

    const pieCtx =
        document.getElementById('pieChartCtx');

    if (radarCtx && pieCtx) {
        radarChart = new Chart(radarCtx, {
            type: 'radar',

            data: {
                labels: [
                    "Technical Depth",
                    "ATS Compliance",
                    "Project Experience",
                    "Core CS Fundamentals",
                    "Target Role Fit"
                ],

                datasets: [{
                    label: 'Competency Score',
                    data: [70, 72, 85, 75, 65],
                    backgroundColor: 'rgba(99, 102, 241, 0.35)',
                    borderColor: '#6366f1',
                    pointBackgroundColor: '#38bdf8'
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                scales: {
                    r: {
                        angleLines: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },

                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },

                        pointLabels: {
                            color: '#f9fafb',
                            font: {
                                size: 12
                            }
                        },

                        ticks: {
                            display: false,
                            max: 100
                        }
                    }
                },

                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        pieChart = new Chart(pieCtx, {
            type: 'doughnut',

            data: {
                labels: [
                    "Software Engineering",
                    "Web & Full Stack",
                    "Data Science & Analytics"
                ],

                datasets: [{
                    data: [50, 30, 20],
                    backgroundColor: [
                        '#6366f1',
                        '#06b6d4',
                        '#10b981',
                        '#8b5cf6',
                        '#f59e0b'
                    ]
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        position: 'bottom',

                        labels: {
                            color: '#f9fafb'
                        }
                    }
                }
            }
        });
    }
}

function updateCharts(data) {
    if (radarChart && data) {
        const skillsCount =
            (window.EXTRACTED_SKILLS || []).length;

        const atsScore =
            window.ATS_SCORE || 72;

        const readiness =
            data.readiness_pct || 65;

        radarChart.data.datasets[0].data = [
            Math.min(100, skillsCount * 8.5),
            atsScore,
            85,
            skillsCount > 3 ? 75 : 45,
            readiness
        ];

        radarChart.update();
    }

    if (
        pieChart &&
        data &&
        data.domain_percentages
    ) {
        const labels = Object.keys(
            data.domain_percentages
        ).filter(
            k => data.domain_percentages[k] > 0
        );

        const values = labels.map(
            k => data.domain_percentages[k]
        );

        pieChart.data.labels =
            labels.length
                ? labels
                : ["General Engineering"];

        pieChart.data.datasets[0].data =
            values.length
                ? values
                : [100];

        pieChart.update();
    }
}

// Interactive Skill Editor
function initSkillEditor() {
    const updateBtn =
        document.getElementById('btn-update-skills-live');

    if (updateBtn) {
        updateBtn.addEventListener(
            'click',
            async () => {
                const checked =
                    document.querySelectorAll(
                        '.active-profile-skill-checkbox:checked'
                    );

                const newSkills =
                    Array.from(checked).map(
                        c => c.value
                    );

                const formData =
                    new FormData();

                formData.append(
                    'action',
                    'update_skills'
                );

                formData.append(
                    'skills',
                    JSON.stringify(newSkills)
                );

                const res = await fetch(
                    'api.php',
                    {
                        method: 'POST',
                        body: formData
                    }
                );

                const json =
                    await res.json();

                if (json.status === 'success') {
                    window.EXTRACTED_SKILLS =
                        json.skills;

                    fetchMetrics();

                    alert(
                        'Active skills updated live!'
                    );
                }
            }
        );
    }
}

// Resume Upload & Sample loader
function initResumeUpload() {
    const uploadForm =
        document.getElementById('form-resume-upload');

    const sampleBtn =
        document.getElementById('btn-load-sample-resume');

    if (uploadForm) {
        uploadForm.addEventListener(
            'submit',
            async (e) => {
                e.preventDefault();

                const fileInput =
                    document.getElementById(
                        'input-resume-file'
                    );

                if (
                    !fileInput.files ||
                    !fileInput.files[0]
                ) {
                    alert(
                        'Please select a resume PDF or DOCX file first.'
                    );
                    return;
                }

                const statusBox =
                    document.getElementById(
                        'resume-upload-status'
                    );

                statusBox.className =
                    'alert alert-info';

                statusBox.textContent =
                    'Extracting skills and evaluating ATS compatibility...';

                statusBox.style.display =
                    'block';

                const formData =
                    new FormData();

                formData.append(
                    'action',
                    'upload_resume'
                );

                formData.append(
                    'resume_file',
                    fileInput.files[0]
                );

                formData.append(
                    'target_company',
                    window.TARGET_COMPANY || 'Google'
                );

                formData.append(
                    'target_role',
                    window.TARGET_ROLE || 'Software Engineer'
                );

                formData.append(
                    'required_skills',
                    JSON.stringify(
                        window.REQUIRED_SKILLS || []
                    )
                );

                try {
                    const res =
                        await fetch(
                            'api.php',
                            {
                                method: 'POST',
                                body: formData
                            }
                        );

                    const json =
                        await res.json();

                    if (
                        json.status ===
                        'success'
                    ) {
                        statusBox.className =
                            'alert alert-success';

                        statusBox.textContent =
                            'Resume parsed and recorded successfully!';

                        window.location.reload();
                    } else {
                        statusBox.className =
                            'alert alert-error';

                        statusBox.textContent =
                            `Upload Error: ${json.message}`;
                    }

                } catch (err) {
                    statusBox.className =
                        'alert alert-error';

                    statusBox.textContent =
                        'Network error during upload.';
                }
            }
        );
    }

    if (sampleBtn) {
        sampleBtn.addEventListener(
            'click',
            async () => {
                const statusBox =
                    document.getElementById(
                        'resume-upload-status'
                    );

                statusBox.className =
                    'alert alert-info';

                statusBox.textContent =
                    'Loading sample profile...';

                statusBox.style.display =
                    'block';

                const res =
                    await fetch(
                        'api.php?action=load_sample'
                    );

                const json =
                    await res.json();

                if (
                    json.status ===
                    'success'
                ) {
                    window.location.reload();
                }
            }
        );
    }
}

// Dynamic Job Ranking Filter
function initJobRanking() {
    const domainFilter =
        document.getElementById(
            'select-job-domain-filter'
        );

    const searchInput =
        document.getElementById(
            'input-job-search'
        );

    if (
        domainFilter &&
        searchInput
    ) {
        const fetchRanked =
            async () => {
                const formData =
                    new FormData();

                formData.append(
                    'action',
                    'rank_jobs'
                );

                formData.append(
                    'domain_filter',
                    domainFilter.value
                );

                const res =
                    await fetch(
                        'api.php',
                        {
                            method: 'POST',
                            body: formData
                        }
                    );

                const json =
                    await res.json();

                if (
                    json.status ===
                    'success'
                ) {
                    renderJobTable(
                        json.jobs,
                        searchInput.value
                    );
                }
            };

        domainFilter.addEventListener(
            'change',
            fetchRanked
        );

        searchInput.addEventListener(
            'input',
            () => {
                fetchRanked();
            }
        );
    }
}

function renderJobTable(
    jobs,
    query
) {
    const tbody =
        document.getElementById(
            'tbody-job-ranking'
        );

    if (!tbody) {
        return;
    }

    query =
        (query || '').toLowerCase();

    const filtered =
        jobs.filter(
            j =>
                !query ||
                j.company
                    .toLowerCase()
                    .includes(query) ||
                j.role
                    .toLowerCase()
                    .includes(query)
        );

    tbody.innerHTML =
        filtered
            .map(
                j => `
        <tr>
            <td><strong>${j.company}</strong></td>
            <td>${j.role}</td>
            <td>${j.domain}</td>
            <td>
                <strong style="color: var(--cyan-light);">
                    ${j.match_pct}%
                </strong>
            </td>
            <td>
                ${j.matched_count} / ${j.total_count}
            </td>
            <td>
                <span style="color: ${
                    j.fit_label === 'High Match'
                        ? 'var(--emerald)'
                        : (
                            j.fit_label ===
                            'Moderate Match'
                                ? 'var(--amber)'
                                : 'var(--rose)'
                        )
                }; font-weight: 700;">
                    ${j.fit_label}
                </span>
            </td>
            <td>
                ${j.missing_skills
                    .slice(0, 3)
                    .join(', ') || 'None'}
            </td>
        </tr>
    `
            )
            .join('');
}

// Web Scraper
function initWebScraper() {
    const scrapeBtn =
        document.getElementById(
            'btn-scrape-url'
        );

    if (scrapeBtn) {
        scrapeBtn.addEventListener(
            'click',
            async () => {
                const urlInput =
                    document.getElementById(
                        'input-scrape-url'
                    ).value.trim();

                const resDiv =
                    document.getElementById(
                        'scrape-results-box'
                    );

                if (!urlInput) {
                    alert(
                        'Please enter a valid job posting URL.'
                    );
                    return;
                }

                resDiv.className =
                    'alert alert-info';

                resDiv.textContent =
                    'Scraping webpage and analyzing required competencies...';

                resDiv.style.display =
                    'block';

                const formData =
                    new FormData();

                formData.append(
                    'action',
                    'scrape_url'
                );

                formData.append(
                    'url',
                    urlInput
                );

                const res =
                    await fetch(
                        'api.php',
                        {
                            method: 'POST',
                            body: formData
                        }
                    );

                const json =
                    await res.json();

                if (
                    json.status ===
                    'success'
                ) {
                    resDiv.className =
                        'alert alert-success';

                    resDiv.innerHTML = `
                        <strong>Scraped Title:</strong>
                        ${json.title}<br/>
                        <strong>Text Excerpt:</strong>
                        ${json.text.substring(0, 200)}...
                    `;
                } else {
                    resDiv.className =
                        'alert alert-error';

                    resDiv.textContent =
                        `Scrape Error: ${
                            json.error ||
                            'Failed to fetch webpage.'
                        }`;
                }
            }
        );
    }
}

// Profile Settings Form
function initProfileForm() {
    const profileForm =
        document.getElementById(
            'form-update-profile'
        );

    if (profileForm) {
        profileForm.addEventListener(
            'submit',
            async (e) => {
                e.preventDefault();

                const formData =
                    new FormData(profileForm);

                formData.append(
                    'action',
                    'update_profile'
                );

                const res =
                    await fetch(
                        'api.php',
                        {
                            method: 'POST',
                            body: formData
                        }
                    );

                const json =
                    await res.json();

                if (
                    json.status ===
                    'success'
                ) {
                    alert(
                        'Profile updated successfully!'
                    );

                    window.location.reload();
                } else {
                    alert(
                        json.message
                    );
                }
            }
        );
    }
}

// AI Interview Assistant & Practice Lab
function initAIInterviewAssistant() {
    const tabAssistant =
        document.getElementById(
            'tab-btn-ai-assistant'
        );

    const tabEvaluator =
        document.getElementById(
            'tab-btn-ai-evaluator'
        );

    const tabQuestions =
        document.getElementById(
            'tab-btn-ai-questions'
        );

    const subAssistant =
        document.getElementById(
            'subtab-ai-assistant'
        );

    const subEvaluator =
        document.getElementById(
            'subtab-ai-evaluator'
        );

    const subQuestions =
        document.getElementById(
            'subtab-ai-questions'
        );

    if (
        tabAssistant &&
        tabEvaluator &&
        tabQuestions
    ) {
        tabAssistant.addEventListener(
            'click',
            () => {
                tabAssistant.classList.add(
                    'active'
                );

                tabEvaluator.classList.remove(
                    'active'
                );

                tabQuestions.classList.remove(
                    'active'
                );

                subAssistant.style.display =
                    'block';

                subEvaluator.style.display =
                    'none';

                subQuestions.style.display =
                    'none';
            }
        );

        tabEvaluator.addEventListener(
            'click',
            () => {
                tabEvaluator.classList.add(
                    'active'
                );

                tabAssistant.classList.remove(
                    'active'
                );

                tabQuestions.classList.remove(
                    'active'
                );

                subEvaluator.style.display =
                    'block';

                subAssistant.style.display =
                    'none';

                subQuestions.style.display =
                    'none';
            }
        );

        tabQuestions.addEventListener(
            'click',
            () => {
                tabQuestions.classList.add(
                    'active'
                );

                tabAssistant.classList.remove(
                    'active'
                );

                tabEvaluator.classList.remove(
                    'active'
                );

                subQuestions.style.display =
                    'block';

                subAssistant.style.display =
                    'none';

                subEvaluator.style.display =
                    'none';
            }
        );
    }

    // AI Assistant prompt submission
    const promptInput =
        document.getElementById(
            'input-ai-prompt'
        );

    const promptSubmit =
        document.getElementById(
            'btn-submit-ai-prompt'
        );

    const presetBtns =
        document.querySelectorAll(
            '.ai-preset-btn'
        );

    const resCard =
        document.getElementById(
            'ai-assistant-response-card'
        );

    const resTitle =
        document.getElementById(
            'ai-response-title'
        );

    const resBody =
        document.getElementById(
            'ai-response-body'
        );

    const executePrompt =
        async (queryText) => {
            if (!queryText) {
                return;
            }

            resCard.style.display =
                'block';

            resTitle.textContent =
                '⏳ Thinking... Generating tailored AI interview answer...';

            resBody.innerHTML = `
                <p style="color: var(--text-muted);">
                    Analyzing role:
                    ${window.TARGET_ROLE || 'Software Engineer'}
                    at
                    ${window.TARGET_COMPANY || 'Google'}...
                </p>
            `;

            const formData =
                new FormData();

            formData.append(
                'action',
                'ask_interview_ai'
            );

            formData.append(
                'prompt',
                queryText
            );

            formData.append(
                'target_role',
                window.TARGET_ROLE ||
                'Software Engineer'
            );

            formData.append(
                'target_company',
                window.TARGET_COMPANY ||
                'Google'
            );

            try {
                const res =
                    await fetch(
                        'api.php',
                        {
                            method: 'POST',
                            body: formData
                        }
                    );

                const json =
                    await res.json();

                if (
                    json.status ===
                    'success'
                ) {
                    resTitle.textContent =
                        json.title;

                    let html =
                        `<div style="line-height: 1.7; color: #e2e8f0; font-size: 14px;">`;

                    html += `
                        <h5 style="color: var(--cyan-light); margin-bottom: 8px;">
                            📌 Strategic Guidance & Steps:
                        </h5>
                    `;

                    html += `
                        <ul style="padding-left: 20px; margin-bottom: 16px;">
                    `;

                    (json.advice_steps || [])
                        .forEach(
                            step => {
                                html += `<li>${step}</li>`;
                            }
                        );

                    html += `</ul>`;

                    html += `
                        <div style="background: rgba(15, 23, 42, 0.8); padding: 14px; border-radius: 8px; border-left: 4px solid var(--emerald); margin-top: 12px;">
                            <p style="color: var(--emerald); font-weight: 700; margin-bottom: 4px;">
                                ❓ Practice Question:
                            </p>

                            <p style="font-weight: 600; margin-bottom: 8px;">
                                ${json.sample_question}
                            </p>

                            <p style="color: var(--cyan-light); font-weight: 700; margin-bottom: 4px;">
                                💡 Model Answer Strategy:
                            </p>

                            <p style="margin: 0;">
                                ${json.sample_answer}
                            </p>
                        </div>
                    `;

                    html += `</div>`;

                    resBody.innerHTML =
                        html;

                } else {
                    resTitle.textContent =
                        'Error';

                    resBody.innerHTML = `
                        <p style="color: var(--rose);">
                            ${
                                json.message ||
                                'Failed to generate response.'
                            }
                        </p>
                    `;
                }

            } catch (err) {
                resTitle.textContent =
                    'Connection Error';

                resBody.innerHTML = `
                    <p style="color: var(--rose);">
                        Could not connect to AI Assistant.
                    </p>
                `;
            }
        };

    if (
        promptSubmit &&
        promptInput
    ) {
        promptSubmit.addEventListener(
            'click',
            () => {
                executePrompt(
                    promptInput.value.trim()
                );
            }
        );

        promptInput.addEventListener(
            'keypress',
            (e) => {
                if (e.key === 'Enter') {
                    executePrompt(
                        promptInput.value.trim()
                    );
                }
            }
        );
    }

    presetBtns.forEach(
        btn => {
            btn.addEventListener(
                'click',
                () => {
                    const query =
                        btn.getAttribute(
                            'data-query'
                        );

                    if (promptInput) {
                        promptInput.value =
                            query;
                    }

                    executePrompt(
                        query
                    );
                }
            );
        }
    );

    // Answer Evaluator Question Select
    const selectQ =
        document.getElementById(
            'select-eval-question'
        );

    const customQInput =
        document.getElementById(
            'input-eval-custom-q'
        );

    if (
        selectQ &&
        customQInput
    ) {
        selectQ.addEventListener(
            'change',
            () => {
                if (
                    selectQ.value ===
                    'custom'
                ) {
                    customQInput.style.display =
                        'block';
                } else {
                    customQInput.style.display =
                        'none';
                }
            }
        );
    }

    // Answer Evaluator Submit
    const btnEvalSubmit =
        document.getElementById(
            'btn-submit-eval-answer'
        );

    if (btnEvalSubmit) {
        btnEvalSubmit.addEventListener(
            'click',
            async () => {
                let questionText =
                    selectQ.value;

                if (
                    questionText ===
                    'custom'
                ) {
                    questionText =
                        customQInput.value.trim() ||
                        'Custom Technical Question';
                }

                const userAnswerText =
                    document
                        .getElementById(
                            'input-eval-user-answer'
                        )
                        .value
                        .trim();

                if (!userAnswerText) {
                    alert(
                        'Please type your answer in the box before submitting for evaluation.'
                    );
                    return;
                }

                const evalCard =
                    document.getElementById(
                        'ai-evaluator-result-card'
                    );

                evalCard.style.display =
                    'block';

                document.getElementById(
                    'eval-overall-score-display'
                ).textContent =
                    'Score: Evaluating...';

                const formData =
                    new FormData();

                formData.append(
                    'action',
                    'evaluate_answer'
                );

                formData.append(
                    'question',
                    questionText
                );

                formData.append(
                    'user_answer',
                    userAnswerText
                );

                formData.append(
                    'target_role',
                    window.TARGET_ROLE ||
                    'Software Engineer'
                );

                try {
                    const res =
                        await fetch(
                            'api.php',
                            {
                                method: 'POST',
                                body: formData
                            }
                        );

                    const json =
                        await res.json();

                    if (
                        json.status ===
                        'success'
                    ) {
                        document.getElementById(
                            'eval-rating-badge'
                        ).textContent =
                            json.rating;

                        document.getElementById(
                            'eval-rating-badge'
                        ).style.background =
                            json.color;

                        document.getElementById(
                            'eval-overall-score-display'
                        ).textContent =
                            `Overall Score: ${json.total_score} / 100`;

                        const b =
                            json.breakdown || {};

                        document.getElementById(
                            'eval-score-tech'
                        ).textContent =
                            `${b.technical_accuracy || 0} / 20`;

                        document.getElementById(
                            'eval-score-kw'
                        ).textContent =
                            `${b.keywords_terminology || 0} / 20`;

                        document.getElementById(
                            'eval-score-struct'
                        ).textContent =
                            `${b.structure_clarity || 0} / 20`;

                        document.getElementById(
                            'eval-score-rel'
                        ).textContent =
                            `${b.real_world_relevance || 0} / 20`;

                        document.getElementById(
                            'eval-score-comp'
                        ).textContent =
                            `${b.completeness || 0} / 20`;

                        document.getElementById(
                            'eval-strengths-list'
                        ).innerHTML =
                            (
                                json.strengths ||
                                []
                            )
                                .map(
                                    s =>
                                        `<li>${s}</li>`
                                )
                                .join('');

                        document.getElementById(
                            'eval-missing-list'
                        ).innerHTML =
                            (
                                json.missing_points ||
                                []
                            )
                                .map(
                                    m =>
                                        `<li>${m}</li>`
                                )
                                .join('');

                        document.getElementById(
                            'eval-ideal-answer'
                        ).textContent =
                            json.ideal_answer;
                    }

                } catch (err) {
                    document.getElementById(
                        'eval-overall-score-display'
                    ).textContent =
                        'Evaluation Failed';
                }
            }
        );
    }
}
