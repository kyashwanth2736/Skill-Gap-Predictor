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

    // Initialize company/role targets only when dashboard elements exist
    updateSelectedCompanyRole();
});


// =============================================================
// AUTH TABS - LOGIN / SIGNUP
// =============================================================

function initAuthTabs() {
    const tabLogin = document.getElementById('tab-btn-login');
    const tabSignup = document.getElementById('tab-btn-signup');

    const formLogin = document.getElementById('form-login-box');
    const formSignup = document.getElementById('form-signup-box');

    // ---------------------------------------------------------
    // Login / Signup Tabs
    // ---------------------------------------------------------

    if (
        tabLogin &&
        tabSignup &&
        formLogin &&
        formSignup
    ) {
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


    // ---------------------------------------------------------
    // Password Visibility - Login
    // ---------------------------------------------------------

    const loginPassword =
        document.getElementById('login_password');

    const loginPasswordToggle =
        document.getElementById('toggle-login-password');

    if (
        loginPassword &&
        loginPasswordToggle
    ) {
        loginPasswordToggle.addEventListener('click', () => {
            if (loginPassword.type === 'password') {
                loginPassword.type = 'text';
                loginPasswordToggle.textContent = '🙈';
                loginPasswordToggle.setAttribute(
                    'aria-label',
                    'Hide Password'
                );
            } else {
                loginPassword.type = 'password';
                loginPasswordToggle.textContent = '👁️';
                loginPasswordToggle.setAttribute(
                    'aria-label',
                    'Show Password'
                );
            }
        });
    }


    // ---------------------------------------------------------
    // Password Visibility - Signup
    // ---------------------------------------------------------

    const signupPassword =
        document.getElementById('signup_pwd');

    const signupPasswordToggle =
        document.getElementById('toggle-signup-password');

    if (
        signupPassword &&
        signupPasswordToggle
    ) {
        signupPasswordToggle.addEventListener('click', () => {
            if (signupPassword.type === 'password') {
                signupPassword.type = 'text';
                signupPasswordToggle.textContent = '🙈';
                signupPasswordToggle.setAttribute(
                    'aria-label',
                    'Hide Password'
                );
            } else {
                signupPassword.type = 'password';
                signupPasswordToggle.textContent = '👁️';
                signupPasswordToggle.setAttribute(
                    'aria-label',
                    'Show Password'
                );
            }
        });
    }


    // ---------------------------------------------------------
    // Login Submit
    // ---------------------------------------------------------

    const loginBtn =
        document.getElementById('btn-do-login');

    if (loginBtn) {
        loginBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const emailInput =
                document.getElementById('login_email');

            const passwordInput =
                document.getElementById('login_password');

            const errDiv =
                document.getElementById('login-error-msg');

            if (!emailInput || !passwordInput) {
                return;
            }

            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value;

            if (errDiv) {
                errDiv.style.display = 'none';
            }

            if (!email || !password) {
                if (errDiv) {
                    errDiv.textContent =
                        'Please enter both email and password.';

                    errDiv.style.display = 'block';
                }

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

            loginBtn.disabled = true;
            loginBtn.style.opacity = '0.7';

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

                if (json.status === 'success') {
                    window.location.reload();
                } else {
                    if (errDiv) {
                        errDiv.textContent =
                            json.message ||
                            'Invalid email or password.';

                        errDiv.style.display =
                            'block';
                    }

                    loginBtn.disabled = false;
                    loginBtn.style.opacity = '1';
                }

            } catch (err) {
                console.error(
                    'Login error:',
                    err
                );

                if (errDiv) {
                    errDiv.textContent =
                        'Connection error. Please try again.';

                    errDiv.style.display =
                        'block';
                }

                loginBtn.disabled = false;
                loginBtn.style.opacity = '1';
            }
        });
    }


    // ---------------------------------------------------------
    // Signup - Terms Checkbox
    // ---------------------------------------------------------

    const termsCheckbox =
        document.getElementById('signup-terms');

    const signupBtn =
        document.getElementById('btn-do-signup');

    if (
        termsCheckbox &&
        signupBtn
    ) {
        // Initial state
        signupBtn.disabled =
            !termsCheckbox.checked;

        signupBtn.style.opacity =
            termsCheckbox.checked
                ? '1'
                : '0.6';

        signupBtn.style.cursor =
            termsCheckbox.checked
                ? 'pointer'
                : 'not-allowed';

        termsCheckbox.addEventListener(
            'change',
            () => {
                signupBtn.disabled =
                    !termsCheckbox.checked;

                signupBtn.style.opacity =
                    termsCheckbox.checked
                        ? '1'
                        : '0.6';

                signupBtn.style.cursor =
                    termsCheckbox.checked
                        ? 'pointer'
                        : 'not-allowed';
            }
        );
    }


    // ---------------------------------------------------------
    // Signup Submit
    // ---------------------------------------------------------

    if (signupBtn) {
        signupBtn.addEventListener(
            'click',
            async (e) => {
                e.preventDefault();

                const nameInput =
                    document.getElementById(
                        'signup_name'
                    );

                const emailInput =
                    document.getElementById(
                        'signup_email'
                    );

                const passwordInput =
                    document.getElementById(
                        'signup_pwd'
                    );

                const universityInput =
                    document.getElementById(
                        'signup_uni'
                    );

                const degreeInput =
                    document.getElementById(
                        'signup_branch'
                    );

                const majorInput =
                    document.getElementById(
                        'signup_major'
                    );

                const graduationYearInput =
                    document.getElementById(
                        'signup_gradyear'
                    );

                const linkedinInput =
                    document.getElementById(
                        'signup_linkedin'
                    );

                const githubInput =
                    document.getElementById(
                        'signup_github'
                    );

                const skillsInput =
                    document.getElementById(
                        'signup_skills'
                    );

                const errDiv =
                    document.getElementById(
                        'signup-error-msg'
                    );

                const succDiv =
                    document.getElementById(
                        'signup-success-msg'
                    );

                if (
                    !nameInput ||
                    !emailInput ||
                    !passwordInput ||
                    !universityInput ||
                    !degreeInput ||
                    !graduationYearInput
                ) {
                    console.error(
                        'Signup form fields are missing.'
                    );

                    if (errDiv) {
                        errDiv.textContent =
                            'Signup form is incomplete. Please refresh the page and try again.';

                        errDiv.style.display =
                            'block';
                    }

                    return;
                }


                // -------------------------------------------------
                // Terms Validation
                // -------------------------------------------------

                if (
                    termsCheckbox &&
                    !termsCheckbox.checked
                ) {
                    if (errDiv) {
                        errDiv.textContent =
                            'Please accept the Terms of Service and Privacy Policy before registering.';

                        errDiv.style.display =
                            'block';
                    }

                    return;
                }


                // -------------------------------------------------
                // Collect Signup Values
                // -------------------------------------------------

                const name =
                    nameInput.value.trim();

                const email =
                    emailInput.value.trim();

                const pwd =
                    passwordInput.value;

                const university =
                    universityInput.value.trim();

                const degree =
                    degreeInput.value.trim();

                const major =
                    majorInput
                        ? majorInput.value.trim()
                        : '';

                const graduationYear =
                    graduationYearInput.value.trim();

                const linkedin =
                    linkedinInput
                        ? linkedinInput.value.trim()
                        : '';

                const github =
                    githubInput
                        ? githubInput.value.trim()
                        : '';

                const skills =
                    skillsInput
                        ? skillsInput.value.trim()
                        : '';


                // -------------------------------------------------
                // Basic Validation
                // -------------------------------------------------

                if (
                    !name ||
                    !email ||
                    !pwd ||
                    !university ||
                    !degree ||
                    !graduationYear
                ) {
                    if (errDiv) {
                        errDiv.textContent =
                            'Please fill in all required fields.';

                        errDiv.style.display =
                            'block';
                    }

                    return;
                }


                // -------------------------------------------------
                // Email Validation
                // -------------------------------------------------

                const emailRegex =
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (
                    !emailRegex.test(email)
                ) {
                    if (errDiv) {
                        errDiv.textContent =
                            'Please enter a valid email address.';

                        errDiv.style.display =
                            'block';
                    }

                    return;
                }


                // -------------------------------------------------
                // Strong Password Validation
                //
                // Minimum 8 characters
                // At least one uppercase
                // At least one lowercase
                // At least one number
                // At least one special character
                // -------------------------------------------------

                const strongPasswordRegex =
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

                if (
                    !strongPasswordRegex.test(pwd)
                ) {
                    if (errDiv) {
                        errDiv.textContent =
                            'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.';

                        errDiv.style.display =
                            'block';
                    }

                    return;
                }


                // -------------------------------------------------
                // Clear Previous Messages
                // -------------------------------------------------

                if (errDiv) {
                    errDiv.style.display =
                        'none';
                }

                if (succDiv) {
                    succDiv.style.display =
                        'none';
                }


                // -------------------------------------------------
                // Prepare Signup Request
                // -------------------------------------------------

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
                    pwd
                );

                formData.append(
                    'university',
                    university
                );

                /*
                 * Existing backend expects "branch".
                 * Degree is sent here to preserve compatibility.
                 */
                formData.append(
                    'branch',
                    degree
                );

                formData.append(
                    'graduation_year',
                    graduationYear
                );

                // Additional profile fields
                formData.append(
                    'major',
                    major
                );

                formData.append(
                    'linkedin',
                    linkedin
                );

                formData.append(
                    'github',
                    github
                );

                formData.append(
                    'skills',
                    skills
                );


                // -------------------------------------------------
                // Disable Button During Request
                // -------------------------------------------------

                signupBtn.disabled =
                    true;

                signupBtn.style.opacity =
                    '0.7';

                signupBtn.style.cursor =
                    'wait';


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
                        if (succDiv) {
                            succDiv.textContent =
                                json.message ||
                                'Account created successfully!';

                            succDiv.style.display =
                                'block';
                        }

                        if (errDiv) {
                            errDiv.style.display =
                                'none';
                        }

                        /*
                         * Reset password visibility
                         */
                        if (passwordInput) {
                            passwordInput.type =
                                'password';
                        }

                        if (
                            signupPasswordToggle
                        ) {
                            signupPasswordToggle.textContent =
                                '👁️';
                        }

                        /*
                         * Switch to Login after registration
                         */
                        setTimeout(
                            () => {
                                if (
                                    tabLogin
                                ) {
                                    tabLogin.click();
                                }

                                if (
                                    succDiv
                                ) {
                                    succDiv.style.display =
                                        'none';
                                }

                                signupBtn.disabled =
                                    !(
                                        termsCheckbox &&
                                        termsCheckbox.checked
                                    );

                                signupBtn.style.opacity =
                                    termsCheckbox &&
                                    termsCheckbox.checked
                                        ? '1'
                                        : '0.6';

                                signupBtn.style.cursor =
                                    termsCheckbox &&
                                    termsCheckbox.checked
                                        ? 'pointer'
                                        : 'not-allowed';
                            },
                            1500
                        );

                    } else {
                        if (errDiv) {
                            errDiv.textContent =
                                json.message ||
                                'Registration failed. Please try again.';

                            errDiv.style.display =
                                'block';
                        }

                        if (succDiv) {
                            succDiv.style.display =
                                'none';
                        }

                        signupBtn.disabled =
                            !(
                                termsCheckbox &&
                                termsCheckbox.checked
                            );

                        signupBtn.style.opacity =
                            termsCheckbox &&
                            termsCheckbox.checked
                                ? '1'
                                : '0.6';

                        signupBtn.style.cursor =
                            termsCheckbox &&
                            termsCheckbox.checked
                                ? 'pointer'
                                : 'not-allowed';
                    }

                } catch (err) {
                    console.error(
                        'Registration error:',
                        err
                    );

                    if (errDiv) {
                        errDiv.textContent =
                            'Registration error. Please check your connection and try again.';

                        errDiv.style.display =
                            'block';
                    }

                    if (succDiv) {
                        succDiv.style.display =
                            'none';
                    }

                    signupBtn.disabled =
                        !(
                            termsCheckbox &&
                            termsCheckbox.checked
                        );

                    signupBtn.style.opacity =
                        termsCheckbox &&
                        termsCheckbox.checked
                            ? '1'
                            : '0.6';

                    signupBtn.style.cursor =
                        termsCheckbox &&
                        termsCheckbox.checked
                            ? 'pointer'
                            : 'not-allowed';
                }
            }
        );
    }


    // ---------------------------------------------------------
    // Logout
    // ---------------------------------------------------------

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
                } catch (err) {
                    console.error(
                        'Logout error:',
                        err
                    );
                }

                window.location.reload();
            }
        );
    }
}


// =============================================================
// SIDEBAR NAVIGATION
// =============================================================

function initNavigation() {
    const navItems =
        document.querySelectorAll(
            '.nav-item'
        );

    const views =
        document.querySelectorAll(
            '.view-panel'
        );

    navItems.forEach(
        item => {
            item.addEventListener(
                'click',
                (e) => {
                    e.preventDefault();

                    const targetViewId =
                        item.getAttribute(
                            'data-view'
                        );

                    navItems.forEach(
                        i =>
                            i.classList.remove(
                                'active'
                            )
                    );

                    views.forEach(
                        v =>
                            v.style.display =
                                'none'
                    );

                    item.classList.add(
                        'active'
                    );

                    const targetEl =
                        document.getElementById(
                            targetViewId
                        );

                    if (targetEl) {
                        targetEl.style.display =
                            'block';
                    }

                    if (
                        targetViewId ===
                        'view-roadmap'
                    ) {
                        loadDynamicRoadmap();

                    } else if (
                        targetViewId ===
                        'view-interview'
                    ) {
                        loadDynamicInterview();
                    }
                }
            );
        }
    );
}


// =============================================================
// COMPANY / ROLE SELECTION
// =============================================================

function initCompanySelector() {
    const modeBenchmark =
        document.getElementById(
            'mode-benchmark'
        );

    const modeCustom =
        document.getElementById(
            'mode-custom'
        );

    const benchmarkBox =
        document.getElementById(
            'box-benchmark-select'
        );

    const customBox =
        document.getElementById(
            'box-custom-select'
        );


    if (
        modeBenchmark &&
        modeCustom
    ) {
        modeBenchmark.addEventListener(
            'change',
            () => {
                if (benchmarkBox) {
                    benchmarkBox.style.display =
                        'block';
                }

                if (customBox) {
                    customBox.style.display =
                        'none';
                }

                updateSelectedCompanyRole();
            }
        );

        modeCustom.addEventListener(
            'change',
            () => {
                if (benchmarkBox) {
                    benchmarkBox.style.display =
                        'none';
                }

                if (customBox) {
                    customBox.style.display =
                        'block';
                }

                updateSelectedCompanyRole();
            }
        );
    }


    const compSelect =
        document.getElementById(
            'select-company'
        );

    const roleSelect =
        document.getElementById(
            'select-role'
        );


    if (
        compSelect &&
        roleSelect
    ) {
        compSelect.addEventListener(
            'change',
            () => {
                if (
                    window.BENCHMARK_DATA &&
                    window.BENCHMARK_DATA[
                        compSelect.value
                    ]
                ) {
                    const roles =
                        Object.keys(
                            window.BENCHMARK_DATA[
                                compSelect.value
                            ].roles
                        );

                    roleSelect.innerHTML =
                        roles
                            .map(
                                r =>
                                    `<option value="${r}">${r}</option>`
                            )
                            .join('');
                }

                updateSelectedCompanyRole();
            }
        );

        roleSelect.addEventListener(
            'change',
            updateSelectedCompanyRole
        );
    }
}


// =============================================================
// UPDATE SELECTED COMPANY / ROLE
// =============================================================

function updateSelectedCompanyRole() {

    /*
     * IMPORTANT:
     * Do not run this function on the Login/Signup page.
     * The dashboard company/role controls only exist after login.
     */

    const modeBenchmark =
        document.getElementById(
            'mode-benchmark'
        );

    if (!modeBenchmark) {
        return;
    }


    let comp =
        'Google';

    let role =
        'Software Development Engineer (SDE)';

    let requiredSkills =
        [];


    const isBenchmark =
        modeBenchmark.checked;


    if (isBenchmark) {

        const compSelect =
            document.getElementById(
                'select-company'
            );

        const roleSelect =
            document.getElementById(
                'select-role'
            );


        if (
            compSelect &&
            roleSelect &&
            window.BENCHMARK_DATA
        ) {
            comp =
                compSelect.value;

            role =
                roleSelect.value;


            if (
                window.BENCHMARK_DATA[
                    comp
                ] &&
                window.BENCHMARK_DATA[
                    comp
                ].roles &&
                window.BENCHMARK_DATA[
                    comp
                ].roles[
                    role
                ]
            ) {
                requiredSkills =
                    window.BENCHMARK_DATA[
                        comp
                    ].roles[
                        role
                    ].required_skills ||
                    [];
            }
        }

    } else {

        const customCompanyInput =
            document.getElementById(
                'input-custom-company'
            );

        const customRoleInput =
            document.getElementById(
                'input-custom-role'
            );


        comp =
            customCompanyInput
                ? (
                    customCompanyInput.value ||
                    'Zoho'
                )
                : 'Zoho';


        role =
            customRoleInput
                ? (
                    customRoleInput.value ||
                    'Backend Engineer'
                )
                : 'Backend Engineer';


        const checked =
            document.querySelectorAll(
                '.custom-skill-checkbox:checked'
            );


        requiredSkills =
            Array.from(
                checked
            ).map(
                c =>
                    c.value
            );
    }


    window.TARGET_COMPANY =
        comp;

    window.TARGET_ROLE =
        role;

    window.REQUIRED_SKILLS =
        requiredSkills;


    // ---------------------------------------------------------
    // Update Company / Role Banner
    // ---------------------------------------------------------

    const bannerCompanyRole =
        document.getElementById(
            'banner-company-role'
        );

    if (bannerCompanyRole) {
        /*
         * Use ASCII hyphen to avoid encoding corruption.
         */
        bannerCompanyRole.textContent =
            `${comp} - ${role}`;
    }


    // ---------------------------------------------------------
    // Update PDF Report Hidden Fields
    // ---------------------------------------------------------

    const reportCompany =
        document.getElementById(
            'input-report-company'
        );

    const reportRole =
        document.getElementById(
            'report-target-role'
        );


    if (reportCompany) {
        reportCompany.value =
            comp;
    }

    if (reportRole) {
        reportRole.value =
            role;
    }


    fetchMetrics();
}


// =============================================================
// FETCH METRICS
// =============================================================

async function fetchMetrics() {
    const formData =
        new FormData();

    formData.append(
        'action',
        'get_metrics'
    );

    formData.append(
        'target_company',
        window.TARGET_COMPANY ||
            'Google'
    );

    formData.append(
        'target_role',
        window.TARGET_ROLE ||
            'Software Development Engineer (SDE)'
    );

    formData.append(
        'required_skills',
        JSON.stringify(
            window.REQUIRED_SKILLS ||
                []
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


        const data =
            await res.json();


        window.LATEST_METRICS =
            data;


        const readinessVal =
            data &&
            data.readiness_pct !==
                undefined &&
            data.readiness_pct !==
                null
                ? data.readiness_pct
                : 65.0;


        const confidenceVal =
            data &&
            data.confidence_pct !==
                undefined &&
            data.confidence_pct !==
                null
                ? data.confidence_pct
                : 80.0;


        const matchedSkills =
            data &&
            data.matched_skills
                ? data.matched_skills
                : [];


        const missingSkills =
            data &&
            data.missing_skills
                ? data.missing_skills
                : [];


        const reqTotal =
            window.REQUIRED_SKILLS &&
            window.REQUIRED_SKILLS.length
                ? window.REQUIRED_SKILLS.length
                : (
                    matchedSkills.length +
                    missingSkills.length
                );


        // -----------------------------------------------------
        // Readiness
        // -----------------------------------------------------

        const readinessEl =
            document.getElementById(
                'metric-readiness'
            );

        if (readinessEl) {
            readinessEl.textContent =
                `${readinessVal}%`;
        }


        // -----------------------------------------------------
        // Matched Skills
        // -----------------------------------------------------

        const matchedCountEl =
            document.getElementById(
                'metric-matched-count'
            );

        if (matchedCountEl) {
            matchedCountEl.textContent =
                `${matchedSkills.length} of ${reqTotal} Skills Matched`;
        }


        // -----------------------------------------------------
        // Confidence
        // -----------------------------------------------------

        const confidenceEl =
            document.getElementById(
                'metric-confidence'
            );

        if (confidenceEl) {
            confidenceEl.textContent =
                `${confidenceVal}%`;
        }


        // -----------------------------------------------------
        // Strength
        // -----------------------------------------------------

        const strengthEl =
            document.getElementById(
                'metric-strength'
            );

        if (strengthEl) {
            strengthEl.textContent =
                data.strength_label ||
                'Strong';

            strengthEl.style.color =
                data.strength_color ||
                '#34d399';
        }


        // -----------------------------------------------------
        // Matched Skill Tags
        // -----------------------------------------------------

        const matchedBox =
            document.getElementById(
                'matched-skills-tags'
            );

        const missingBox =
            document.getElementById(
                'missing-skills-tags'
            );


        if (matchedBox) {
            matchedBox.innerHTML =
                matchedSkills.length
                    ? matchedSkills
                        .map(
                            s =>
                                `<span class="skill-tag-matched">${s}</span>`
                        )
                        .join('')
                    : '<p style="color:#94a3b8;">No matching skills detected yet.</p>';
        }


        // -----------------------------------------------------
        // Missing Skill Tags
        // -----------------------------------------------------

        if (missingBox) {
            missingBox.innerHTML =
                missingSkills.length
                    ? missingSkills
                        .map(
                            s =>
                                `<span class="skill-tag-missing">${s}</span>`
                        )
                        .join('')
                    : '<p style="color:#10b981;">Awesome! All required skills are matched.</p>';
        }


        // -----------------------------------------------------
        // Charts
        // -----------------------------------------------------

        updateCharts(data);


        // -----------------------------------------------------
        // Dynamic Roadmap / Interview
        // -----------------------------------------------------

        loadDynamicRoadmap();
        loadDynamicInterview();

    } catch (err) {
        console.error(
            'Error fetching metrics:',
            err
        );
    }
}


// =============================================================
// DYNAMIC CAREER ROADMAP
// =============================================================

async function loadDynamicRoadmap() {

    const roadmapContainer =
        document.getElementById(
            'container-dynamic-roadmap'
        );

    const resourcesContainer =
        document.getElementById(
            'container-dynamic-resources'
        );


    if (
        !roadmapContainer ||
        !resourcesContainer
    ) {
        return;
    }


    const missingSkills =
        window.LATEST_METRICS &&
        window.LATEST_METRICS.missing_skills
            ? window.LATEST_METRICS.missing_skills
            : [];


    const formData =
        new FormData();


    formData.append(
        'action',
        'get_roadmap'
    );

    formData.append(
        'missing_skills',
        JSON.stringify(
            missingSkills
        )
    );

    formData.append(
        'target_company',
        window.TARGET_COMPANY ||
            'Google'
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
                'success' &&
            json.roadmap
        ) {
            const r =
                json.roadmap;


            // -------------------------------------------------
            // Render Phases
            // -------------------------------------------------

            roadmapContainer.innerHTML =
                (r.phases || [])
                    .map(
                        p =>
                            `
                <div class="roadmap-phase-card">

                    <div class="roadmap-phase-title">
                        ${p.phase} - ${p.objective}
                    </div>

                    <div class="roadmap-phase-duration">
                        Timeline: ${p.duration} |
                        Target Skills: ${(p.skills || []).join(', ')}
                    </div>

                    <ul style="color: #d1d5db; padding-left: 20px; line-height: 1.6;">
                        ${(p.action_items || [])
                            .map(
                                item =>
                                    `<li>${item}</li>`
                            )
                            .join('')}
                    </ul>

                </div>
            `
                    )
                    .join('');


            // -------------------------------------------------
            // Render Resources
            // -------------------------------------------------

            resourcesContainer.innerHTML =
                (r.resources || [])
                    .map(
                        resItem =>
                            `
                    <details style="margin-bottom: 12px;">

                        <summary>
                            📖 ${resItem.skill}
                            Mastery Guide & Portfolio Project
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

                                <a
                                    href="${resItem.docs}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="extracted-link"
                                >
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
        console.error(
            'Error loading roadmap:',
            err
        );
    }
}


// =============================================================
// DYNAMIC AI INTERVIEW PREP
// =============================================================

async function loadDynamicInterview() {

    const container =
        document.getElementById(
            'container-dynamic-interview'
        );


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


    const formData =
        new FormData();


    formData.append(
        'action',
        'get_interview'
    );

    formData.append(
        'target_role',
        window.TARGET_ROLE ||
            'Software Engineer'
    );

    formData.append(
        'matched_skills',
        JSON.stringify(
            matchedSkills
        )
    );

    formData.append(
        'missing_skills',
        JSON.stringify(
            missingSkills
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
                'success' &&
            json.prep_data
        ) {
            const prep =
                json.prep_data;

            let html =
                '';


            // -------------------------------------------------
            // Technical Known Questions
            // -------------------------------------------------

            if (
                prep.technical_known &&
                prep.technical_known.length
            ) {
                html += `
                    <h4 style="color: var(--cyan-light); margin-bottom: 14px;">
                        🧠 Technical Questions on Skills You Have
                    </h4>
                `;


                html +=
                    prep.technical_known
                        .map(
                            (item, idx) =>
                                `
                        <details style="margin-bottom: 12px;">

                            <summary>
                                Q${idx + 1}
                                (${item.skill}):
                                ${item.q}
                            </summary>

                            <div style="padding-top: 12px; color: #d1d5db; line-height: 1.6;">

                                <p>
                                    <strong>Ideal Answer:</strong>
                                    ${item.a}
                                </p>

                                <p style="color: var(--cyan-light); margin-top: 6px;">
                                    💡
                                    <strong>Mentor Tip:</strong>
                                    ${item.tip}
                                </p>

                            </div>

                        </details>
                    `
                        )
                        .join('');
            }


            // -------------------------------------------------
            // Skill Gap Questions
            // -------------------------------------------------

            if (
                prep.gap_questions &&
                prep.gap_questions.length
            ) {
                html += `
                    <h4 style="color: var(--rose); margin-top: 24px; margin-bottom: 14px;">
                        ⚠️ Skill-Gap Drill Questions (Study Before Placement)
                    </h4>
                `;


                html +=
                    prep.gap_questions
                        .map(
                            (item, idx) =>
                                `
                        <details style="margin-bottom: 12px;">

                            <summary>
                                Gap Drill ${idx + 1}
                                (${item.skill}):
                                ${item.q}
                            </summary>

                            <div style="padding-top: 12px; color: #d1d5db; line-height: 1.6;">

                                <p>
                                    <strong>Ideal Answer:</strong>
                                    ${item.a}
                                </p>

                                <p style="color: var(--amber); margin-top: 6px;">
                                    💡
                                    <strong>Preparation Tip:</strong>
                                    ${item.tip}
                                </p>

                            </div>

                        </details>
                    `
                        )
                        .join('');
            }


            // -------------------------------------------------
            // Behavioral Questions
            // -------------------------------------------------

            if (
                prep.behavioral &&
                prep.behavioral.length
            ) {
                html += `
                    <h4 style="color: var(--emerald); margin-top: 24px; margin-bottom: 14px;">
                        👔 HR & Behavioral Questions (STAR Framework)
                    </h4>
                `;


                html +=
                    prep.behavioral
                        .map(
                            (item, idx) =>
                                `
                        <details style="margin-bottom: 12px;">

                            <summary>
                                HR Q${idx + 1}:
                                ${item.q}
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


            container.innerHTML =
                html;
        }

    } catch (err) {
        console.error(
            'Error loading interview prep:',
            err
        );
    }
}


// =============================================================
// CHART.JS RADAR & PIE
// =============================================================

let radarChart =
    null;

let pieChart =
    null;


function initCharts() {

    const radarCtx =
        document.getElementById(
            'radarChartCtx'
        );

    const pieCtx =
        document.getElementById(
            'pieChartCtx'
        );


    if (
        radarCtx &&
        pieCtx &&
        typeof Chart !== 'undefined'
    ) {

        radarChart =
            new Chart(
                radarCtx,
                {
                    type: 'radar',

                    data: {
                        labels: [
                            'Technical Depth',
                            'ATS Compliance',
                            'Project Experience',
                            'Core CS Fundamentals',
                            'Target Role Fit'
                        ],

                        datasets: [{
                            label: 'Competency Score',

                            data: [
                                70,
                                72,
                                85,
                                75,
                                65
                            ],

                            backgroundColor:
                                'rgba(99, 102, 241, 0.35)',

                            borderColor:
                                '#6366f1',

                            pointBackgroundColor:
                                '#38bdf8'
                        }]
                    },

                    options: {
                        responsive: true,
                        maintainAspectRatio: false,

                        scales: {
                            r: {
                                angleLines: {
                                    color:
                                        'rgba(255, 255, 255, 0.1)'
                                },

                                grid: {
                                    color:
                                        'rgba(255, 255, 255, 0.1)'
                                },

                                pointLabels: {
                                    color:
                                        '#f9fafb',

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
                }
            );


        pieChart =
            new Chart(
                pieCtx,
                {
                    type: 'doughnut',

                    data: {
                        labels: [
                            'Software Engineering',
                            'Web & Full Stack',
                            'Data Science & Analytics'
                        ],

                        datasets: [{
                            data: [
                                50,
                                30,
                                20
                            ],

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
                                    color:
                                        '#f9fafb'
                                }
                            }
                        }
                    }
                }
            );
    }
}


// =============================================================
// UPDATE CHARTS
// =============================================================

function updateCharts(data) {

    if (
        radarChart &&
        data
    ) {
        const skillsCount =
            (
                window.EXTRACTED_SKILLS ||
                []
            ).length;


        const atsScore =
            window.ATS_SCORE ||
            72;


        const readiness =
            data.readiness_pct ||
            65;


        radarChart.data.datasets[0].data = [
            Math.min(
                100,
                skillsCount * 8.5
            ),

            atsScore,

            85,

            skillsCount > 3
                ? 75
                : 45,

            readiness
        ];


        radarChart.update();
    }


    if (
        pieChart &&
        data &&
        data.domain_percentages
    ) {
        const labels =
            Object.keys(
                data.domain_percentages
            ).filter(
                k =>
                    data.domain_percentages[k] >
                    0
            );


        const values =
            labels.map(
                k =>
                    data.domain_percentages[k]
            );


        pieChart.data.labels =
            labels.length
                ? labels
                : [
                    'General Engineering'
                ];


        pieChart.data.datasets[0].data =
            values.length
                ? values
                : [100];


        pieChart.update();
    }
}


// =============================================================
// INTERACTIVE SKILL EDITOR
// =============================================================

function initSkillEditor() {

    const updateBtn =
        document.getElementById(
            'btn-update-skills-live'
        );


    if (updateBtn) {
        updateBtn.addEventListener(
            'click',
            async () => {

                const checked =
                    document.querySelectorAll(
                        '.active-profile-skill-checkbox:checked'
                    );


                const newSkills =
                    Array.from(
                        checked
                    ).map(
                        c =>
                            c.value
                    );


                const formData =
                    new FormData();


                formData.append(
                    'action',
                    'update_skills'
                );

                formData.append(
                    'skills',
                    JSON.stringify(
                        newSkills
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
                        window.EXTRACTED_SKILLS =
                            json.skills;


                        fetchMetrics();


                        alert(
                            'Active skills updated live!'
                        );
                    } else {
                        alert(
                            json.message ||
                            'Unable to update skills.'
                        );
                    }

                } catch (err) {
                    console.error(
                        'Skill update error:',
                        err
                    );

                    alert(
                        'Network error while updating skills.'
                    );
                }
            }
        );
    }
}


// =============================================================
// RESUME UPLOAD & SAMPLE
// =============================================================

function initResumeUpload() {

    const uploadForm =
        document.getElementById(
            'form-resume-upload'
        );

    const sampleBtn =
        document.getElementById(
            'btn-load-sample-resume'
        );


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
                    !fileInput ||
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


                if (statusBox) {

                    statusBox.className =
                        'alert alert-info';

                    statusBox.textContent =
                        'Extracting skills and evaluating ATS compatibility...';

                    statusBox.style.display =
                        'block';
                }


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
                    window.TARGET_COMPANY ||
                        'Google'
                );

                formData.append(
                    'target_role',
                    window.TARGET_ROLE ||
                        'Software Engineer'
                );

                formData.append(
                    'required_skills',
                    JSON.stringify(
                        window.REQUIRED_SKILLS ||
                            []
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

                        if (statusBox) {

                            statusBox.className =
                                'alert alert-success';

                            statusBox.textContent =
                                'Resume parsed and recorded successfully!';
                        }


                        window.location.reload();

                    } else {

                        if (statusBox) {

                            statusBox.className =
                                'alert alert-error';

                            statusBox.textContent =
                                `Upload Error: ${
                                    json.message ||
                                    'Unable to process resume.'
                                }`;
                        }
                    }

                } catch (err) {

                    console.error(
                        'Resume upload error:',
                        err
                    );


                    if (statusBox) {

                        statusBox.className =
                            'alert alert-error';

                        statusBox.textContent =
                            'Network error during upload.';
                    }
                }
            }
        );
    }


    // ---------------------------------------------------------
    // Sample Resume
    // ---------------------------------------------------------

    if (sampleBtn) {

        sampleBtn.addEventListener(
            'click',
            async () => {

                const statusBox =
                    document.getElementById(
                        'resume-upload-status'
                    );


                if (statusBox) {

                    statusBox.className =
                        'alert alert-info';

                    statusBox.textContent =
                        'Loading sample profile...';

                    statusBox.style.display =
                        'block';
                }


                try {

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
                    } else if (statusBox) {

                        statusBox.className =
                            'alert alert-error';

                        statusBox.textContent =
                            json.message ||
                            'Unable to load sample profile.';
                    }

                } catch (err) {

                    console.error(
                        'Sample resume error:',
                        err
                    );


                    if (statusBox) {

                        statusBox.className =
                            'alert alert-error';

                        statusBox.textContent =
                            'Network error while loading sample profile.';
                    }
                }
            }
        );
    }
}


// =============================================================
// DYNAMIC JOB RANKING FILTER
// =============================================================

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
                        renderJobTable(
                            json.jobs ||
                                [],
                            searchInput.value
                        );
                    }

                } catch (err) {

                    console.error(
                        'Job ranking error:',
                        err
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


// =============================================================
// RENDER JOB TABLE
// =============================================================

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
        (
            query ||
            ''
        ).toLowerCase();


    const filtered =
        jobs.filter(
            j =>
                !query ||
                (
                    j.company ||
                    ''
                )
                    .toLowerCase()
                    .includes(query) ||
                (
                    j.role ||
                    ''
                )
                    .toLowerCase()
                    .includes(query)
        );


    tbody.innerHTML =
        filtered
            .map(
                j =>
                    `
        <tr>

            <td>
                <strong>
                    ${j.company || ''}
                </strong>
            </td>

            <td>
                ${j.role || ''}
            </td>

            <td>
                ${j.domain || ''}
            </td>

            <td>
                <strong style="color: var(--cyan-light);">
                    ${j.match_pct ?? 0}%
                </strong>
            </td>

            <td>
                ${j.matched_count ?? 0}
                /
                ${j.total_count ?? 0}
            </td>

            <td>
                <span
                    style="color: ${
                        j.fit_label ===
                        'High Match'
                            ? 'var(--emerald)'
                            : (
                                j.fit_label ===
                                'Moderate Match'
                                    ? 'var(--amber)'
                                    : 'var(--rose)'
                            )
                    }; font-weight: 700;"
                >
                    ${j.fit_label || 'No Match'}
                </span>
            </td>

            <td>
                ${
                    j.missing_skills &&
                    j.missing_skills.length
                        ? j.missing_skills
                            .slice(0, 3)
                            .join(', ')
                        : 'None'
                }
            </td>

        </tr>
    `
            )
            .join('');
}


// =============================================================
// WEB SCRAPER
// =============================================================

function initWebScraper() {

    const scrapeBtn =
        document.getElementById(
            'btn-scrape-url'
        );


    if (scrapeBtn) {

        scrapeBtn.addEventListener(
            'click',
            async () => {

                const urlElement =
                    document.getElementById(
                        'input-scrape-url'
                    );


                const resDiv =
                    document.getElementById(
                        'scrape-results-box'
                    );


                if (!urlElement) {
                    return;
                }


                const urlInput =
                    urlElement.value.trim();


                if (!urlInput) {

                    alert(
                        'Please enter a valid job posting URL.'
                    );

                    return;
                }


                if (resDiv) {

                    resDiv.className =
                        'alert alert-info';

                    resDiv.textContent =
                        'Scraping webpage and analyzing required competencies...';

                    resDiv.style.display =
                        'block';
                }


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

                        if (resDiv) {

                            resDiv.className =
                                'alert alert-success';

                            resDiv.innerHTML = `
                                <strong>Scraped Title:</strong>
                                ${json.title || ''}<br/>

                                <strong>Text Excerpt:</strong>
                                ${
                                    (
                                        json.text ||
                                        ''
                                    ).substring(
                                        0,
                                        200
                                    )
                                }...
                            `;
                        }

                    } else {

                        if (resDiv) {

                            resDiv.className =
                                'alert alert-error';

                            resDiv.textContent =
                                `Scrape Error: ${
                                    json.error ||
                                    'Failed to fetch webpage.'
                                }`;
                        }
                    }

                } catch (err) {

                    console.error(
                        'Scraper error:',
                        err
                    );


                    if (resDiv) {

                        resDiv.className =
                            'alert alert-error';

                        resDiv.textContent =
                            'Network error while scraping the webpage.';
                    }
                }
            }
        );
    }
}


// =============================================================
// PROFILE SETTINGS FORM
// =============================================================

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
                    new FormData(
                        profileForm
                    );


                formData.append(
                    'action',
                    'update_profile'
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

                        alert(
                            'Profile updated successfully!'
                        );


                        window.location.reload();

                    } else {

                        alert(
                            json.message ||
                            'Unable to update profile.'
                        );
                    }

                } catch (err) {

                    console.error(
                        'Profile update error:',
                        err
                    );


                    alert(
                        'Network error while updating profile.'
                    );
                }
            }
        );
    }
}


// =============================================================
// AI INTERVIEW ASSISTANT & PRACTICE LAB
// =============================================================

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
        tabQuestions &&
        subAssistant &&
        subEvaluator &&
        subQuestions
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


    // =========================================================
    // AI ASSISTANT PROMPT
    // =========================================================

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


            if (
                !resCard ||
                !resTitle ||
                !resBody
            ) {
                return;
            }


            resCard.style.display =
                'block';


            resTitle.textContent =
                '⏳ Thinking... Generating tailored AI interview answer...';


            resBody.innerHTML = `
                <p style="color: var(--text-muted);">
                    Analyzing role:
                    ${
                        window.TARGET_ROLE ||
                        'Software Engineer'
                    }
                    at
                    ${
                        window.TARGET_COMPANY ||
                        'Google'
                    }...
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
                        json.title ||
                        'AI Interview Guidance';


                    let html =
                        `
                        <div
                            style="
                                line-height: 1.7;
                                color: #e2e8f0;
                                font-size: 14px;
                            "
                        >
                        `;


                    html += `
                        <h5 style="color: var(--cyan-light); margin-bottom: 8px;">
                            📌 Strategic Guidance & Steps:
                        </h5>
                    `;


                    html += `
                        <ul style="padding-left: 20px; margin-bottom: 16px;">
                    `;


                    (
                        json.advice_steps ||
                        []
                    ).forEach(
                        step => {
                            html +=
                                `<li>${step}</li>`;
                        }
                    );


                    html +=
                        `</ul>`;


                    html += `
                        <div
                            style="
                                background: rgba(15, 23, 42, 0.8);
                                padding: 14px;
                                border-radius: 8px;
                                border-left: 4px solid var(--emerald);
                                margin-top: 12px;
                            "
                        >

                            <p
                                style="
                                    color: var(--emerald);
                                    font-weight: 700;
                                    margin-bottom: 4px;
                                "
                            >
                                ❓ Practice Question:
                            </p>

                            <p
                                style="
                                    font-weight: 600;
                                    margin-bottom: 8px;
                                "
                            >
                                ${
                                    json.sample_question ||
                                    ''
                                }
                            </p>

                            <p
                                style="
                                    color: var(--cyan-light);
                                    font-weight: 700;
                                    margin-bottom: 4px;
                                "
                            >
                                💡 Model Answer Strategy:
                            </p>

                            <p style="margin: 0;">
                                ${
                                    json.sample_answer ||
                                    ''
                                }
                            </p>

                        </div>
                    `;


                    html +=
                        `</div>`;


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

                console.error(
                    'AI Assistant error:',
                    err
                );


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

                if (
                    e.key ===
                    'Enter'
                ) {
                    executePrompt(
                        promptInput.value.trim()
                    );
                }
            }
        );
    }


    // ---------------------------------------------------------
    // Preset AI Buttons
    // ---------------------------------------------------------

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
                            query || '';
                    }


                    executePrompt(
                        query
                    );
                }
            );
        }
    );


    // =========================================================
    // ANSWER EVALUATOR - QUESTION SELECT
    // =========================================================

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


    // =========================================================
    // ANSWER EVALUATOR - SUBMIT
    // =========================================================

    const btnEvalSubmit =
        document.getElementById(
            'btn-submit-eval-answer'
        );


    if (btnEvalSubmit) {

        btnEvalSubmit.addEventListener(
            'click',
            async () => {

                if (!selectQ) {
                    return;
                }


                let questionText =
                    selectQ.value;


                if (
                    questionText ===
                    'custom'
                ) {

                    questionText =
                        customQInput
                            ? (
                                customQInput.value.trim() ||
                                'Custom Technical Question'
                            )
                            : 'Custom Technical Question';
                }


                const answerInput =
                    document.getElementById(
                        'input-eval-user-answer'
                    );


                if (!answerInput) {
                    return;
                }


                const userAnswerText =
                    answerInput.value.trim();


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


                if (evalCard) {
                    evalCard.style.display =
                        'block';
                }


                const overallScore =
                    document.getElementById(
                        'eval-overall-score-display'
                    );


                if (overallScore) {
                    overallScore.textContent =
                        'Score: Evaluating...';
                }


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

                        const ratingBadge =
                            document.getElementById(
                                'eval-rating-badge'
                            );


                        if (ratingBadge) {

                            ratingBadge.textContent =
                                json.rating ||
                                'Evaluated';

                            if (json.color) {
                                ratingBadge.style.background =
                                    json.color;
                            }
                        }


                        if (overallScore) {

                            overallScore.textContent =
                                `Overall Score: ${
                                    json.total_score ??
                                    0
                                } / 100`;
                        }


                        const b =
                            json.breakdown ||
                            {};


                        const scoreTech =
                            document.getElementById(
                                'eval-score-tech'
                            );

                        if (scoreTech) {
                            scoreTech.textContent =
                                `${
                                    b.technical_accuracy ||
                                    0
                                } / 20`;
                        }


                        const scoreKW =
                            document.getElementById(
                                'eval-score-kw'
                            );

                        if (scoreKW) {
                            scoreKW.textContent =
                                `${
                                    b.keywords_terminology ||
                                    0
                                } / 20`;
                        }


                        const scoreStruct =
                            document.getElementById(
                                'eval-score-struct'
                            );

                        if (scoreStruct) {
                            scoreStruct.textContent =
                                `${
                                    b.structure_clarity ||
                                    0
                                } / 20`;
                        }


                        const scoreRel =
                            document.getElementById(
                                'eval-score-rel'
                            );

                        if (scoreRel) {
                            scoreRel.textContent =
                                `${
                                    b.real_world_relevance ||
                                    0
                                } / 20`;
                        }


                        const scoreComp =
                            document.getElementById(
                                'eval-score-comp'
                            );

                        if (scoreComp) {
                            scoreComp.textContent =
                                `${
                                    b.completeness ||
                                    0
                                } / 20`;
                        }


                        const strengthsList =
                            document.getElementById(
                                'eval-strengths-list'
                            );


                        if (strengthsList) {

                            strengthsList.innerHTML =
                                (
                                    json.strengths ||
                                    []
                                )
                                    .map(
                                        s =>
                                            `<li>${s}</li>`
                                    )
                                    .join('');
                        }


                        const missingList =
                            document.getElementById(
                                'eval-missing-list'
                            );


                        if (missingList) {

                            missingList.innerHTML =
                                (
                                    json.missing_points ||
                                    []
                                )
                                    .map(
                                        m =>
                                            `<li>${m}</li>`
                                    )
                                    .join('');
                        }


                        const idealAnswer =
                            document.getElementById(
                                'eval-ideal-answer'
                            );


                        if (idealAnswer) {

                            idealAnswer.textContent =
                                json.ideal_answer ||
                                '';
                        }

                    } else {

                        if (overallScore) {

                            overallScore.textContent =
                                json.message ||
                                'Evaluation Failed';
                        }
                    }

                } catch (err) {

                    console.error(
                        'Answer evaluation error:',
                        err
                    );


                    if (overallScore) {

                        overallScore.textContent =
                            'Evaluation Failed';
                    }
                }
            }
        );
    }
}
