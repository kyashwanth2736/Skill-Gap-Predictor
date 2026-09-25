/**
 * Skill-Gap Predictor Frontend Application JS
 * IEEE CS Bangalore Chapter | Project ID: P19 | GITAM University
 *
 * Dynamic version:
 * - Mobile sidebar menu
 * - Theme toggle
 * - Login / Signup
 * - Password visibility
 * - Resume-based company/role recommendation
 * - Dynamic ATS target
 * - Dynamic skill-gap analysis
 * - Dynamic roadmap
 * - Dynamic interview preparation
 */

document.addEventListener('DOMContentLoaded', () => {
    initAuthTabs();
    initNavigation();
    initMobileUI();
    initThemeToggle();
    initCompanySelector();
    initCharts();
    initSkillEditor();
    initResumeUpload();
    initJobRanking();
    initWebScraper();
    initProfileForm();
    initAIInterviewAssistant();

    /*
     * Do NOT force Google/SDE.
     *
     * If the user already has extracted resume skills,
     * recommend a company/role from those skills.
     *
     * Otherwise initialize with the first available
     * benchmark company/role.
     */
    initializeDynamicTarget();
});


/* ============================================================= */
/* AUTHENTICATION */
/* ============================================================= */

function initAuthTabs() {
    const tabLogin = document.getElementById('tab-btn-login');
    const tabSignup = document.getElementById('tab-btn-signup');

    const formLogin = document.getElementById('form-login-box');
    const formSignup = document.getElementById('form-signup-box');

    if (tabLogin && tabSignup && formLogin && formSignup) {

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


    /* --------------------------------------------------------- */
    /* Password Visibility */
    /* --------------------------------------------------------- */

    initPasswordToggle(
        'login_password',
        'toggle-login-password'
    );

    initPasswordToggle(
        'signup_pwd',
        'toggle-signup-password'
    );


    /* --------------------------------------------------------- */
    /* Login */
    /* --------------------------------------------------------- */

    const loginBtn = document.getElementById('btn-do-login');

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

            if (!email || !password) {

                if (errDiv) {
                    errDiv.textContent =
                        'Please enter both email and password.';

                    errDiv.style.display =
                        'block';
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

                if (
                    json.status ===
                    'success'
                ) {

                    window.location.reload();

                } else {

                    if (errDiv) {

                        errDiv.textContent =
                            json.message ||
                            'Invalid email or password.';

                        errDiv.style.display =
                            'block';
                    }
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

            } finally {

                loginBtn.disabled = false;
                loginBtn.style.opacity = '1';
            }
        });
    }


    /* --------------------------------------------------------- */
    /* Signup */
    /* --------------------------------------------------------- */

    const signupBtn =
        document.getElementById(
            'btn-do-signup'
        );

    const termsCheckbox =
        document.getElementById(
            'signup-terms'
        );

    /*
     * Register button should only become active
     * after accepting Terms & Privacy Policy.
     */
    if (signupBtn && termsCheckbox) {

        signupBtn.disabled =
            !termsCheckbox.checked;

        updateSignupButtonState(
            signupBtn,
            termsCheckbox.checked
        );

        termsCheckbox.addEventListener(
            'change',
            () => {

                updateSignupButtonState(
                    signupBtn,
                    termsCheckbox.checked
                );
            }
        );
    }


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

                const uniInput =
                    document.getElementById(
                        'signup_uni'
                    );

                const branchInput =
                    document.getElementById(
                        'signup_branch'
                    );

                /*
                 * IMPORTANT:
                 * Your current index.php uses signup_gradyear.
                 */
                const yearInput =
                    document.getElementById(
                        'signup_gradyear'
                    ) ||
                    document.getElementById(
                        'signup_year'
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

                if (!nameInput ||
                    !emailInput ||
                    !passwordInput ||
                    !uniInput ||
                    !branchInput ||
                    !yearInput) {

                    if (errDiv) {

                        errDiv.textContent =
                            'Some registration fields are missing. Please refresh the page and try again.';

                        errDiv.style.display =
                            'block';
                    }

                    return;
                }


                /* Terms validation */

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


                /* Password validation */

                const password =
                    passwordInput.value;

                const strongPassword =
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

                if (
                    !strongPassword.test(
                        password
                    )
                ) {

                    if (errDiv) {

                        errDiv.textContent =
                            'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.';

                        errDiv.style.display =
                            'block';
                    }

                    return;
                }


                const email =
                    emailInput.value.trim();

                if (!email) {

                    if (errDiv) {

                        errDiv.textContent =
                            'Please enter your email address.';

                        errDiv.style.display =
                            'block';
                    }

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
                    nameInput.value.trim()
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
                    uniInput.value.trim()
                );

                formData.append(
                    'branch',
                    branchInput.value.trim()
                );

                formData.append(
                    'graduation_year',
                    yearInput.value
                );


                if (linkedinInput) {

                    formData.append(
                        'linkedin',
                        linkedinInput.value.trim()
                    );
                }


                if (githubInput) {

                    formData.append(
                        'github',
                        githubInput.value.trim()
                    );
                }


                if (skillsInput) {

                    formData.append(
                        'skills',
                        skillsInput.value.trim()
                    );
                }


                signupBtn.disabled = true;
                signupBtn.textContent =
                    'Creating Account...';

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
                                'Account created successfully.';

                            succDiv.style.display =
                                'block';
                        }

                        if (errDiv) {
                            errDiv.style.display =
                                'none';
                        }

                        setTimeout(
                            () => {

                                if (
                                    tabLogin
                                ) {
                                    tabLogin.click();
                                }

                            },
                            1200
                        );

                    } else {

                        if (errDiv) {

                            errDiv.textContent =
                                json.message ||
                                'Registration failed.';

                            errDiv.style.display =
                                'block';
                        }

                        if (succDiv) {
                            succDiv.style.display =
                                'none';
                        }
                    }

                } catch (err) {

                    console.error(
                        'Registration error:',
                        err
                    );

                    if (errDiv) {

                        errDiv.textContent =
                            'Registration error. Please try again.';

                        errDiv.style.display =
                            'block';
                    }

                } finally {

                    signupBtn.textContent =
                        'Register Account';

                    if (
                        termsCheckbox
                    ) {

                        updateSignupButtonState(
                            signupBtn,
                            termsCheckbox.checked
                        );

                    } else {

                        signupBtn.disabled =
                            false;
                    }
                }
            }
        );
    }


    /* --------------------------------------------------------- */
    /* Logout */
    /* --------------------------------------------------------- */

    const logoutBtn =
        document.getElementById(
            'btn-logout'
        );

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


/* Password visibility helper */

function initPasswordToggle(
    inputId,
    buttonId
) {

    const input =
        document.getElementById(
            inputId
        );

    const button =
        document.getElementById(
            buttonId
        );

    if (!input || !button) {
        return;
    }

    button.addEventListener(
        'click',
        () => {

            if (
                input.type ===
                'password'
            ) {

                input.type =
                    'text';

                button.textContent =
                    '🙈';

            } else {

                input.type =
                    'password';

                button.textContent =
                    '👁️';
            }
        }
    );
}


function updateSignupButtonState(
    button,
    enabled
) {

    button.disabled =
        !enabled;

    if (enabled) {

        button.style.opacity =
            '1';

        button.style.cursor =
            'pointer';

    } else {

        button.style.opacity =
            '0.6';

        button.style.cursor =
            'not-allowed';
    }
}


/* ============================================================= */
/* MOBILE MENU */
/* ============================================================= */

function initMobileUI() {

    const sidebar =
        document.querySelector(
            '.sidebar'
        );

    const overlay =
        document.querySelector(
            '.sidebar-overlay'
        );

    /*
     * Support several possible IDs so this works
     * with your existing HTML.
     */
    const menuButton =
        document.getElementById(
            'mobile-menu-toggle'
        ) ||
        document.getElementById(
            'btn-mobile-menu'
        ) ||
        document.getElementById(
            'mobile-menu-btn'
        ) ||
        document.querySelector(
            '.mobile-menu-toggle'
        );


    if (!sidebar || !menuButton) {
        return;
    }


    const openMenu = () => {

        sidebar.classList.add(
            'mobile-open'
        );

        if (overlay) {

            overlay.classList.add(
                'active'
            );
        }

        document.body.classList.add(
            'menu-open'
        );
    };


    const closeMenu = () => {

        sidebar.classList.remove(
            'mobile-open'
        );

        if (overlay) {

            overlay.classList.remove(
                'active'
            );
        }

        document.body.classList.remove(
            'menu-open'
        );
    };


    menuButton.addEventListener(
        'click',
        (e) => {

            e.preventDefault();
            e.stopPropagation();

            if (
                sidebar.classList.contains(
                    'mobile-open'
                )
            ) {

                closeMenu();

            } else {

                openMenu();
            }
        }
    );


    if (overlay) {

        overlay.addEventListener(
            'click',
            closeMenu
        );
    }


    /*
     * Close mobile menu after selecting
     * any navigation item.
     */
    document
        .querySelectorAll(
            '.nav-item'
        )
        .forEach(
            item => {

                item.addEventListener(
                    'click',
                    () => {

                        if (
                            window.innerWidth <=
                            900
                        ) {
                            closeMenu();
                        }
                    }
                );
            }
        );


    document.addEventListener(
        'keydown',
        (e) => {

            if (
                e.key ===
                'Escape'
            ) {
                closeMenu();
            }
        }
    );
}


/* ============================================================= */
/* THEME TOGGLE */
/* ============================================================= */

function initThemeToggle() {

    const themeButton =
        document.getElementById(
            'theme-toggle'
        ) ||
        document.getElementById(
            'btn-theme-toggle'
        ) ||
        document.getElementById(
            'toggle-theme'
        ) ||
        document.querySelector(
            '.theme-toggle'
        );


    if (!themeButton) {
        return;
    }


    const savedTheme =
        localStorage.getItem(
            'skillGapTheme'
        );


    if (
        savedTheme ===
        'light'
    ) {

        document.body.classList.add(
            'light-theme'
        );

        updateThemeIcon(
            themeButton,
            true
        );
    }


    themeButton.addEventListener(
        'click',
        (e) => {

            e.preventDefault();

            const isLight =
                document.body.classList.toggle(
                    'light-theme'
                );

            localStorage.setItem(
                'skillGapTheme',
                isLight
                    ? 'light'
                    : 'dark'
            );

            updateThemeIcon(
                themeButton,
                isLight
            );
        }
    );
}


function updateThemeIcon(
    button,
    isLight
) {

    button.textContent =
        isLight
            ? '☀️'
            : '🌙';
}


/* ============================================================= */
/* SIDEBAR NAVIGATION */
/* ============================================================= */

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

                    if (!targetViewId) {
                        return;
                    }


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


/* ============================================================= */
/* DYNAMIC TARGET INITIALIZATION */
/* ============================================================= */

function initializeDynamicTarget() {

    const skills =
        Array.isArray(
            window.EXTRACTED_SKILLS
        )
            ? window.EXTRACTED_SKILLS
            : [];


    /*
     * If actual resume skills exist,
     * use them to recommend the target.
     */
    if (
        skills.length > 0
    ) {

        const recommendation =
            recommendCompanyRole(
                skills
            );

        if (
            recommendation
        ) {

            applyRecommendedTarget(
                recommendation,
                false
            );

            return;
        }
    }


    /*
     * No resume yet:
     * initialize from first available
     * benchmark entry rather than hard-coded Google.
     */
    const firstTarget =
        getFirstBenchmarkTarget();


    if (firstTarget) {

        applyRecommendedTarget(
            firstTarget,
            false
        );

    } else {

        window.TARGET_COMPANY = '';
        window.TARGET_ROLE = '';
        window.REQUIRED_SKILLS = [];

        updateTargetBanner();
    }
}


/* ============================================================= */
/* COMPANY / ROLE SELECTION */
/* ============================================================= */

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
                            window
                                .BENCHMARK_DATA[
                                compSelect.value
                            ]
                                .roles ||
                            {}
                        );


                    roleSelect.innerHTML =
                        roles
                            .map(
                                r =>
                                    `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`
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


    /*
     * Custom company/role fields.
     */
    const customCompany =
        document.getElementById(
            'input-custom-company'
        );

    const customRole =
        document.getElementById(
            'input-custom-role'
        );


    if (customCompany) {

        customCompany.addEventListener(
            'input',
            updateSelectedCompanyRole
        );
    }


    if (customRole) {

        customRole.addEventListener(
            'input',
            updateSelectedCompanyRole
        );
    }


    document
        .querySelectorAll(
            '.custom-skill-checkbox'
        )
        .forEach(
            checkbox => {

                checkbox.addEventListener(
                    'change',
                    updateSelectedCompanyRole
                );
            }
        );
}


/* ============================================================= */
/* TARGET CALCULATION */
/* ============================================================= */

function updateSelectedCompanyRole() {

    let comp = '';
    let role = '';
    let requiredSkills = [];


    const modeBenchmark =
        document.getElementById(
            'mode-benchmark'
        );

    /*
     * If company selector does not exist,
     * do not crash the whole application.
     */
    if (!modeBenchmark) {

        comp =
            window.TARGET_COMPANY ||
            '';

        role =
            window.TARGET_ROLE ||
            '';

        requiredSkills =
            Array.isArray(
                window.REQUIRED_SKILLS
            )
                ? window.REQUIRED_SKILLS
                : [];

    } else {

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
                roleSelect
            ) {

                comp =
                    compSelect.value;

                role =
                    roleSelect.value;


                if (
                    window.BENCHMARK_DATA &&
                    window.BENCHMARK_DATA[
                        comp
                    ] &&
                    window
                        .BENCHMARK_DATA[
                        comp
                    ].roles &&
                    window
                        .BENCHMARK_DATA[
                        comp
                    ].roles[
                        role
                    ]
                ) {

                    requiredSkills =
                        window
                            .BENCHMARK_DATA[
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
                    ? customCompanyInput.value.trim()
                    : '';


            role =
                customRoleInput
                    ? customRoleInput.value.trim()
                    : '';


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
    }


    window.TARGET_COMPANY =
        comp;

    window.TARGET_ROLE =
        role;

    window.REQUIRED_SKILLS =
        requiredSkills;


    updateTargetBanner();


    /*
     * Do not call API if there is no target.
     */
    if (
        comp ||
        role
    ) {

        fetchMetrics();
    }
}


/* ============================================================= */
/* APPLY RECOMMENDED TARGET */
/* ============================================================= */

function applyRecommendedTarget(
    recommendation,
    fetchNow = true
) {

    if (!recommendation) {
        return;
    }


    const comp =
        recommendation.company ||
        '';

    const role =
        recommendation.role ||
        '';

    const skills =
        recommendation.required_skills ||
        [];


    window.TARGET_COMPANY =
        comp;

    window.TARGET_ROLE =
        role;

    window.REQUIRED_SKILLS =
        skills;


    /*
     * Synchronize benchmark selector
     * if it exists.
     */
    const modeBenchmark =
        document.getElementById(
            'mode-benchmark'
        );

    const compSelect =
        document.getElementById(
            'select-company'
        );

    const roleSelect =
        document.getElementById(
            'select-role'
        );


    if (
        modeBenchmark &&
        compSelect &&
        roleSelect &&
        window.BENCHMARK_DATA &&
        window.BENCHMARK_DATA[comp]
    ) {

        modeBenchmark.checked =
            true;


        const modeCustom =
            document.getElementById(
                'mode-custom'
            );

        if (modeCustom) {
            modeCustom.checked =
                false;
        }


        const benchmarkBox =
            document.getElementById(
                'box-benchmark-select'
            );

        const customBox =
            document.getElementById(
                'box-custom-select'
            );


        if (benchmarkBox) {
            benchmarkBox.style.display =
                'block';
        }

        if (customBox) {
            customBox.style.display =
                'none';
        }


        compSelect.value =
            comp;


        const roles =
            Object.keys(
                window
                    .BENCHMARK_DATA[
                    comp
                ].roles ||
                {}
            );


        roleSelect.innerHTML =
            roles
                .map(
                    r =>
                        `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`
                )
                .join('');


        if (
            roles.includes(
                role
            )
        ) {

            roleSelect.value =
                role;
        }
    }


    updateTargetBanner();


    if (fetchNow) {

        fetchMetrics();
    }
}


/* ============================================================= */
/* TARGET BANNER */
/* ============================================================= */

function updateTargetBanner() {

    const banner =
        document.getElementById(
            'banner-company-role'
        );


    if (!banner) {
        return;
    }


    const comp =
        window.TARGET_COMPANY ||
        '';

    const role =
        window.TARGET_ROLE ||
        '';


    if (
        comp &&
        role
    ) {

        banner.textContent =
            `${comp} - ${role}`;

    } else {

        banner.textContent =
            'Upload your resume to generate a personalized career target';
    }


    /*
     * Update PDF report fields.
     */
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
}


/* ============================================================= */
/* RESUME-BASED COMPANY / ROLE RECOMMENDER */
/* ============================================================= */

function recommendCompanyRole(
    extractedSkills
) {

    if (
        !Array.isArray(
            extractedSkills
        ) ||
        extractedSkills.length === 0 ||
        !window.BENCHMARK_DATA
    ) {

        return null;
    }


    const normalizedUserSkills =
        extractedSkills.map(
            normalizeSkill
        );


    let best =
        null;


    Object.entries(
        window.BENCHMARK_DATA
    ).forEach(
        ([companyName, companyInfo]) => {

            const roles =
                companyInfo.roles ||
                {};


            Object.entries(
                roles
            ).forEach(
                ([roleName, roleInfo]) => {

                    const required =
                        roleInfo.required_skills ||
                        [];


                    if (
                        required.length ===
                        0
                    ) {
                        return;
                    }


                    const normalizedRequired =
                        required.map(
                            normalizeSkill
                        );


                    let matched = 0;


                    normalizedRequired.forEach(
                        skill => {

                            if (
                                normalizedUserSkills.includes(
                                    skill
                                )
                            ) {

                                matched++;
                            }
                        }
                    );


                    const matchPercentage =
                        (
                            matched /
                            normalizedRequired.length
                        ) *
                        100;


                    /*
                     * Slight preference for roles
                     * with more direct skill overlap.
                     */
                    const score =
                        matchPercentage +
                        (
                            matched *
                            0.5
                        );


                    if (
                        !best ||
                        score >
                            best.score
                    ) {

                        best = {

                            company:
                                companyName,

                            role:
                                roleName,

                            required_skills:
                                required,

                            matched_skills:
                                required.filter(
                                    skill =>
                                        normalizedUserSkills.includes(
                                            normalizeSkill(
                                                skill
                                            )
                                        )
                                ),

                            missing_skills:
                                required.filter(
                                    skill =>
                                        !normalizedUserSkills.includes(
                                            normalizeSkill(
                                                skill
                                            )
                                        )
                                ),

                            match_percentage:
                                Math.round(
                                    matchPercentage *
                                    10
                                ) /
                                10,

                            score:
                                score
                        };
                    }
                }
            );
        }
    );


    return best;
}


/* Normalize skills for matching */

function normalizeSkill(
    skill
) {

    return String(
        skill || ''
    )
        .toLowerCase()
        .replace(
            /[^a-z0-9+#.]/g,
            ''
        );
}


/* First benchmark target */

function getFirstBenchmarkTarget() {

    if (
        !window.BENCHMARK_DATA
    ) {

        return null;
    }


    const companies =
        Object.entries(
            window.BENCHMARK_DATA
        );


    for (
        const [
            company,
            info
        ] of companies
    ) {

        const roles =
            info.roles ||
            {};


        const roleEntries =
            Object.entries(
                roles
            );


        if (
            roleEntries.length
        ) {

            const [
                role,
                roleInfo
            ] =
                roleEntries[0];


            return {

                company:
                    company,

                role:
                    role,

                required_skills:
                    roleInfo.required_skills ||
                    []
            };
        }
    }


    return null;
}


/* ============================================================= */
/* METRICS */
/* ============================================================= */

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
        ''
    );


    formData.append(
        'target_role',
        window.TARGET_ROLE ||
        ''
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
                : 0;


        const confidenceVal =
            data &&
            data.confidence_pct !==
                undefined &&
            data.confidence_pct !==
                null
                ? data.confidence_pct
                : 0;


        const matchedSkills =
            data &&
            Array.isArray(
                data.matched_skills
            )
                ? data.matched_skills
                : [];


        const missingSkills =
            data &&
            Array.isArray(
                data.missing_skills
            )
                ? data.missing_skills
                : [];


        const reqTotal =
            window.REQUIRED_SKILLS &&
            window.REQUIRED_SKILLS.length
                ? window.REQUIRED_SKILLS.length
                : matchedSkills.length +
                  missingSkills.length;


        /* ATS */

        const atsEl =
            document.getElementById(
                'metric-ats'
            );


        if (
            atsEl &&
            window.ATS_SCORE !==
                undefined
        ) {

            atsEl.textContent =
                `${window.ATS_SCORE} / 100`;
        }


        /* Readiness */

        const readinessEl =
            document.getElementById(
                'metric-readiness'
            );


        if (readinessEl) {

            readinessEl.textContent =
                `${readinessVal}%`;
        }


        /* Matched skills */

        const matchedCountEl =
            document.getElementById(
                'metric-matched-count'
            );


        if (matchedCountEl) {

            matchedCountEl.textContent =
                `${matchedSkills.length} of ${reqTotal} Skills Matched`;
        }


        /* Confidence */

        const confidenceEl =
            document.getElementById(
                'metric-confidence'
            );


        if (confidenceEl) {

            confidenceEl.textContent =
                `${confidenceVal}%`;
        }


        /* Strength */

        const strengthEl =
            document.getElementById(
                'metric-strength'
            );


        if (strengthEl) {

            strengthEl.textContent =
                data.strength_label ||
                'Not Evaluated';


            strengthEl.style.color =
                data.strength_color ||
                '#94a3b8';
        }


        /* Matched skill tags */

        const matchedBox =
            document.getElementById(
                'matched-skills-tags'
            );


        if (matchedBox) {

            matchedBox.innerHTML =
                matchedSkills.length

                    ? matchedSkills
                          .map(
                              skill =>
                                  `<span class="skill-tag-matched">${escapeHtml(skill)}</span>`
                          )
                          .join('')

                    : '<p style="color:#94a3b8;">No matching skills detected yet.</p>';
        }


        /* Missing skill tags */

        const missingBox =
            document.getElementById(
                'missing-skills-tags'
            );


        if (missingBox) {

            missingBox.innerHTML =
                missingSkills.length

                    ? missingSkills
                          .map(
                              skill =>
                                  `<span class="skill-tag-missing">${escapeHtml(skill)}</span>`
                          )
                          .join('')

                    : '<p style="color:#10b981;">All required skills are matched.</p>';
        }


        updateCharts(
            data
        );


        /*
         * These become dynamic automatically
         * because they use TARGET_COMPANY,
         * TARGET_ROLE and LATEST_METRICS.
         */
        loadDynamicRoadmap();
        loadDynamicInterview();


    } catch (err) {

        console.error(
            'Error fetching metrics:',
            err
        );
    }
}


/* ============================================================= */
/* DYNAMIC ROADMAP */
/* ============================================================= */

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
        Array.isArray(
            window.LATEST_METRICS
                .missing_skills
        )
            ? window.LATEST_METRICS
                  .missing_skills
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
        ''
    );


    formData.append(
        'target_role',
        window.TARGET_ROLE ||
        ''
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

            const roadmap =
                json.roadmap;


            roadmapContainer.innerHTML =
                Array.isArray(
                    roadmap.phases
                )

                    ? roadmap.phases
                          .map(
                              phase =>
                                  `
                        <div class="roadmap-phase-card">
                            <div class="roadmap-phase-title">
                                ${escapeHtml(phase.phase)} —
                                ${escapeHtml(phase.objective)}
                            </div>

                            <div class="roadmap-phase-duration">
                                Timeline:
                                ${escapeHtml(phase.duration)}
                                |
                                Target Skills:
                                ${(phase.skills || [])
                                    .map(
                                        escapeHtml
                                    )
                                    .join(', ')}
                            </div>

                            <ul style="color: #d1d5db; padding-left: 20px; line-height: 1.6;">
                                ${(phase.action_items || [])
                                    .map(
                                        item =>
                                            `<li>${escapeHtml(item)}</li>`
                                    )
                                    .join('')}
                            </ul>
                        </div>
                    `
                          )
                          .join('')

                    : '';


            resourcesContainer.innerHTML =
                Array.isArray(
                    roadmap.resources
                )

                    ? roadmap.resources
                          .map(
                              resource =>
                                  `
                            <details style="margin-bottom: 12px;">
                                <summary>
                                    📖
                                    ${escapeHtml(resource.skill)}
                                    Mastery Guide & Portfolio Project
                                </summary>

                                <div style="padding-top: 12px; color: #d1d5db; line-height: 1.6;">

                                    <p style="margin-bottom: 6px;">
                                        <strong>Recommended Platform:</strong>
                                        <code>${escapeHtml(resource.platform)}</code>
                                    </p>

                                    <p style="margin-bottom: 6px;">
                                        <strong>Estimated Commitment:</strong>
                                        <code>${escapeHtml(resource.time)}</code>
                                    </p>

                                    <p style="margin-bottom: 6px;">
                                        <strong>Official Documentation:</strong>
                                        <a
                                            href="${escapeAttribute(resource.docs)}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="extracted-link"
                                        >
                                            ${escapeHtml(resource.docs)} 🔗
                                        </a>
                                    </p>

                                    <p style="margin-top: 8px;">
                                        <strong>Portfolio Project Idea:</strong>
                                        💡
                                        <em>${escapeHtml(resource.project)}</em>
                                    </p>

                                </div>
                            </details>
                        `
                          )
                          .join('')

                    : '';
        }

    } catch (err) {

        console.error(
            'Error loading roadmap:',
            err
        );
    }
}


/* ============================================================= */
/* DYNAMIC INTERVIEW PREPARATION */
/* ============================================================= */

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
        Array.isArray(
            window.LATEST_METRICS
                .matched_skills
        )
            ? window.LATEST_METRICS
                  .matched_skills
            : [];


    const missingSkills =
        window.LATEST_METRICS &&
        Array.isArray(
            window.LATEST_METRICS
                .missing_skills
        )
            ? window.LATEST_METRICS
                  .missing_skills
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
        ''
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
                    prep
                        .technical_known
                        .map(
                            (item, idx) =>
                                `
                                <details style="margin-bottom: 12px;">

                                    <summary>
                                        Q${idx + 1}
                                        (${escapeHtml(item.skill)}):
                                        ${escapeHtml(item.q)}
                                    </summary>

                                    <div style="padding-top: 12px; color: #d1d5db; line-height: 1.6;">

                                        <p>
                                            <strong>Ideal Answer:</strong>
                                            ${escapeHtml(item.a)}
                                        </p>

                                        <p style="color: var(--cyan-light); margin-top: 6px;">
                                            💡
                                            <strong>Mentor Tip:</strong>
                                            ${escapeHtml(item.tip)}
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
                        ⚠️ Skill-Gap Drill Questions
                    </h4>
                `;


                html +=
                    prep
                        .gap_questions
                        .map(
                            (item, idx) =>
                                `
                                <details style="margin-bottom: 12px;">

                                    <summary>
                                        Gap Drill ${idx + 1}
                                        (${escapeHtml(item.skill)}):
                                        ${escapeHtml(item.q)}
                                    </summary>

                                    <div style="padding-top: 12px; color: #d1d5db; line-height: 1.6;">

                                        <p>
                                            <strong>Ideal Answer:</strong>
                                            ${escapeHtml(item.a)}
                                        </p>

                                        <p style="color: var(--amber); margin-top: 6px;">
                                            💡
                                            <strong>Preparation Tip:</strong>
                                            ${escapeHtml(item.tip)}
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
                        👔 HR & Behavioral Questions
                    </h4>
                `;


                html +=
                    prep
                        .behavioral
                        .map(
                            (item, idx) =>
                                `
                                <details style="margin-bottom: 12px;">

                                    <summary>
                                        HR Q${idx + 1}:
                                        ${escapeHtml(item.q)}
                                    </summary>

                                    <div style="padding-top: 12px; color: #d1d5db; line-height: 1.6;">

                                        <p>
                                            <strong>Framework:</strong>
                                            <code>${escapeHtml(item.framework)}</code>
                                        </p>

                                        <p style="margin-top: 6px;">
                                            <strong>Guide:</strong>
                                            ${escapeHtml(item.guide)}
                                        </p>

                                    </div>

                                </details>
                            `
                        )
                        .join('');
            }


            if (!html) {

                html =
                    '<p style="color: var(--text-muted);">No interview preparation data available for the current target yet.</p>';
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


/* ============================================================= */
/* CHARTS */
/* ============================================================= */

let radarChart = null;
let pieChart = null;


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
        typeof Chart ===
        'undefined'
    ) {

        return;
    }


    if (
        radarCtx &&
        pieCtx
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
                            label:
                                'Competency Score',

                            data: [
                                0,
                                0,
                                0,
                                0,
                                0
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

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        scales: {

                            r: {

                                angleLines: {
                                    color:
                                        'rgba(255,255,255,0.1)'
                                },

                                grid: {
                                    color:
                                        'rgba(255,255,255,0.1)'
                                },

                                pointLabels: {

                                    color:
                                        '#f9fafb',

                                    font: {
                                        size:
                                            12
                                    }
                                },

                                ticks: {

                                    display:
                                        false,

                                    max:
                                        100
                                }
                            }
                        },

                        plugins: {

                            legend: {
                                display:
                                    false
                            }
                        }
                    }
                }
            );


        pieChart =
            new Chart(
                pieCtx,
                {
                    type:
                        'doughnut',

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
                                '#10b981'
                            ]
                        }]
                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        plugins: {

                            legend: {

                                position:
                                    'bottom',

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


function updateCharts(
    data
) {

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
            Number(
                window.ATS_SCORE ||
                0
            );


        const readiness =
            Number(
                data.readiness_pct ||
                0
            );


        radarChart
            .data
            .datasets[0]
            .data = [

                Math.min(
                    100,
                    skillsCount * 8.5
                ),

                atsScore,

                Math.min(
                    100,
                    skillsCount * 10
                ),

                skillsCount >= 4
                    ? 75
                    : skillsCount * 15,

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
            )
            .filter(
                key =>
                    data
                        .domain_percentages[
                        key
                    ] > 0
            );


        const values =
            labels.map(
                key =>
                    data
                        .domain_percentages[
                        key
                    ]
            );


        pieChart.data.labels =
            labels.length
                ? labels
                : [
                    'General Engineering'
                ];


        pieChart
            .data
            .datasets[0]
            .data =
            values.length
                ? values
                : [100];


        pieChart.update();
    }
}


/* ============================================================= */
/* SKILL EDITOR */
/* ============================================================= */

function initSkillEditor() {

    const updateBtn =
        document.getElementById(
            'btn-update-skills-live'
        );


    if (!updateBtn) {
        return;
    }


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
                    checkbox =>
                        checkbox.value
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
                        json.skills ||
                        newSkills;


                    /*
                     * Recalculate target company
                     * and role from updated skills.
                     */
                    const recommendation =
                        recommendCompanyRole(
                            window.EXTRACTED_SKILLS
                        );


                    if (
                        recommendation
                    ) {

                        applyRecommendedTarget(
                            recommendation,
                            true
                        );

                    } else {

                        fetchMetrics();
                    }


                    alert(
                        'Active skills updated successfully!'
                    );
                }

            } catch (err) {

                console.error(
                    'Skill update error:',
                    err
                );

                alert(
                    'Unable to update skills.'
                );
            }
        }
    );
}


/* ============================================================= */
/* RESUME UPLOAD */
/* ============================================================= */

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
                        'Please select a resume PDF, DOCX, or TXT file first.'
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
                        'Extracting skills, evaluating ATS compatibility and finding suitable company roles...';

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


                /*
                 * IMPORTANT:
                 * Do NOT force Google/SDE.
                 *
                 * The backend receives empty target values.
                 * After extraction, the frontend recommends
                 * a target from the extracted skills.
                 */
                formData.append(
                    'target_company',
                    ''
                );


                formData.append(
                    'target_role',
                    ''
                );


                formData.append(
                    'required_skills',
                    JSON.stringify([])
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

                        /*
                         * Prefer skills returned by API.
                         */
                        if (
                            Array.isArray(
                                json.extracted_skills
                            )
                        ) {

                            window.EXTRACTED_SKILLS =
                                json.extracted_skills;

                        } else if (
                            Array.isArray(
                                json.skills
                            )
                        ) {

                            window.EXTRACTED_SKILLS =
                                json.skills;
                        }


                        /*
                         * Find company + role from resume.
                         */
                        const recommendation =
                            recommendCompanyRole(
                                window.EXTRACTED_SKILLS ||
                                []
                            );


                        if (
                            recommendation
                        ) {

                            /*
                             * Apply recommendation without
                             * another immediate fetch first.
                             */
                            applyRecommendedTarget(
                                recommendation,
                                false
                            );


                            /*
                             * Update ATS score if backend
                             * returned one.
                             */
                            if (
                                json.ats_score !==
                                    undefined &&
                                json.ats_score !==
                                    null
                            ) {

                                window.ATS_SCORE =
                                    Number(
                                        json.ats_score
                                    );
                            }


                            if (statusBox) {

                                statusBox.className =
                                    'alert alert-success';

                                statusBox.innerHTML =
                                    `
                                    <strong>Resume analyzed successfully.</strong><br>
                                    Detected
                                    ${
                                        (
                                            window.EXTRACTED_SKILLS ||
                                            []
                                        ).length
                                    }
                                    skills.<br><br>

                                    <strong>Recommended Target:</strong>
                                    ${escapeHtml(recommendation.company)}
                                    -
                                    ${escapeHtml(recommendation.role)}
                                    <br>

                                    <strong>Skill Match:</strong>
                                    ${recommendation.match_percentage}%
                                    `;
                            }


                            /*
                             * Now calculate all metrics
                             * using the recommended target.
                             */
                            fetchMetrics();


                        } else {

                            if (statusBox) {

                                statusBox.className =
                                    'alert alert-success';

                                statusBox.textContent =
                                    'Resume parsed successfully, but no benchmark company/role could be matched yet.';
                            }


                            /*
                             * Keep extracted skills
                             * and reload dashboard data.
                             */
                            fetchMetrics();
                        }


                    } else {

                        if (statusBox) {

                            statusBox.className =
                                'alert alert-error';

                            statusBox.textContent =
                                `Upload Error: ${
                                    json.message ||
                                    'Resume processing failed.'
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
                            'Network error during resume upload.';
                    }
                }
            }
        );
    }


    /* --------------------------------------------------------- */
    /* Sample Resume */
    /* --------------------------------------------------------- */

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

                        if (
                            Array.isArray(
                                json.extracted_skills
                            )
                        ) {

                            window.EXTRACTED_SKILLS =
                                json.extracted_skills;
                        }


                        const recommendation =
                            recommendCompanyRole(
                                window.EXTRACTED_SKILLS ||
                                []
                            );


                        if (
                            recommendation
                        ) {

                            applyRecommendedTarget(
                                recommendation,
                                true
                            );

                        } else {

                            window.location.reload();
                        }
                    }

                } catch (err) {

                    console.error(
                        'Sample profile error:',
                        err
                    );
                }
            }
        );
    }
}


/* ============================================================= */
/* JOB RANKING */
/* ============================================================= */

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
        !domainFilter ||
        !searchInput
    ) {
        return;
    }


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
        fetchRanked
    );


    fetchRanked();
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
        (
            query ||
            ''
        ).toLowerCase();


    const filtered =
        jobs.filter(
            job => {

                const company =
                    String(
                        job.company ||
                        ''
                    ).toLowerCase();


                const role =
                    String(
                        job.role ||
                        ''
                    ).toLowerCase();


                return (
                    !query ||
                    company.includes(
                        query
                    ) ||
                    role.includes(
                        query
                    )
                );
            }
        );


    tbody.innerHTML =
        filtered
            .map(
                job =>
                    `
                    <tr>

                        <td>
                            <strong>
                                ${escapeHtml(job.company)}
                            </strong>
                        </td>

                        <td>
                            ${escapeHtml(job.role)}
                        </td>

                        <td>
                            ${escapeHtml(job.domain)}
                        </td>

                        <td>
                            <strong style="color: var(--cyan-light);">
                                ${escapeHtml(job.match_pct)}%
                            </strong>
                        </td>

                        <td>
                            ${escapeHtml(job.matched_count)}
                            /
                            ${escapeHtml(job.total_count)}
                        </td>

                        <td>
                            <span style="
                                color:
                                ${
                                    job.fit_label ===
                                    'High Match'
                                        ? 'var(--emerald)'
                                        : (
                                            job.fit_label ===
                                            'Moderate Match'
                                                ? 'var(--amber)'
                                                : 'var(--rose)'
                                        )
                                };
                                font-weight: 700;
                            ">
                                ${escapeHtml(job.fit_label)}
                            </span>
                        </td>

                        <td>
                            ${
                                Array.isArray(
                                    job.missing_skills
                                )
                                    ? job.missing_skills
                                          .slice(0, 3)
                                          .map(
                                              escapeHtml
                                          )
                                          .join(', ')
                                    : 'None'
                            }
                        </td>

                    </tr>
                    `
            )
            .join('');
}


/* ============================================================= */
/* WEB SCRAPER */
/* ============================================================= */

function initWebScraper() {

    const scrapeBtn =
        document.getElementById(
            'btn-scrape-url'
        );


    if (!scrapeBtn) {
        return;
    }


    scrapeBtn.addEventListener(
        'click',
        async () => {

            const input =
                document.getElementById(
                    'input-scrape-url'
                );


            const resDiv =
                document.getElementById(
                    'scrape-results-box'
                );


            if (!input || !resDiv) {
                return;
            }


            const url =
                input.value.trim();


            if (!url) {

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
                url
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

                    resDiv.className =
                        'alert alert-success';


                    resDiv.innerHTML =
                        `
                        <strong>
                            Scraped Title:
                        </strong>
                        ${escapeHtml(json.title)}

                        <br>

                        <strong>
                            Text Excerpt:
                        </strong>
                        ${escapeHtml(
                            String(
                                json.text ||
                                ''
                            ).substring(
                                0,
                                200
                            )
                        )}...
                        `;

                } else {

                    resDiv.className =
                        'alert alert-error';


                    resDiv.textContent =
                        `Scrape Error: ${
                            json.error ||
                            json.message ||
                            'Failed to fetch webpage.'
                        }`;
                }

            } catch (err) {

                console.error(
                    'Scraper error:',
                    err
                );


                resDiv.className =
                    'alert alert-error';


                resDiv.textContent =
                    'Network error while scraping webpage.';
            }
        }
    );
}


/* ============================================================= */
/* PROFILE */
/* ============================================================= */

function initProfileForm() {

    const profileForm =
        document.getElementById(
            'form-update-profile'
        );


    if (!profileForm) {
        return;
    }


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
                        'Profile update failed.'
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


/* ============================================================= */
/* AI INTERVIEW ASSISTANT */
/* ============================================================= */

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


    /* --------------------------------------------------------- */
    /* AI Assistant */
    /* --------------------------------------------------------- */

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
        async (
            queryText
        ) => {

            if (
                !queryText ||
                !resCard ||
                !resTitle ||
                !resBody
            ) {
                return;
            }


            resCard.style.display =
                'block';


            resTitle.textContent =
                'Thinking... Generating tailored AI interview answer...';


            resBody.innerHTML =
                `
                <p style="color: var(--text-muted);">
                    Analyzing role:
                    ${escapeHtml(
                        window.TARGET_ROLE ||
                        'Not selected'
                    )}
                    at
                    ${escapeHtml(
                        window.TARGET_COMPANY ||
                        'Not selected'
                    )}...
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
                ''
            );


            formData.append(
                'target_company',
                window.TARGET_COMPANY ||
                ''
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
                        <div style="line-height: 1.7; color: #e2e8f0; font-size: 14px;">
                        `;


                    html +=
                        `
                        <h5 style="color: var(--cyan-light); margin-bottom: 8px;">
                            📌 Strategic Guidance & Steps:
                        </h5>

                        <ul style="padding-left: 20px; margin-bottom: 16px;">
                        `;


                    (
                        json.advice_steps ||
                        []
                    ).forEach(
                        step => {

                            html +=
                                `<li>${escapeHtml(step)}</li>`;
                        }
                    );


                    html +=
                        `
                        </ul>

                        <div style="background: rgba(15, 23, 42, 0.8); padding: 14px; border-radius: 8px; border-left: 4px solid var(--emerald); margin-top: 12px;">

                            <p style="color: var(--emerald); font-weight: 700; margin-bottom: 4px;">
                                ❓ Practice Question:
                            </p>

                            <p style="font-weight: 600; margin-bottom: 8px;">
                                ${escapeHtml(
                                    json.sample_question ||
                                    ''
                                )}
                            </p>

                            <p style="color: var(--cyan-light); font-weight: 700; margin-bottom: 4px;">
                                💡 Model Answer Strategy:
                            </p>

                            <p style="margin: 0;">
                                ${escapeHtml(
                                    json.sample_answer ||
                                    ''
                                )}
                            </p>

                        </div>

                        </div>
                        `;


                    resBody.innerHTML =
                        html;

                } else {

                    resTitle.textContent =
                        'Error';


                    resBody.innerHTML =
                        `
                        <p style="color: var(--rose);">
                            ${escapeHtml(
                                json.message ||
                                'Failed to generate response.'
                            )}
                        </p>
                        `;
                }

            } catch (err) {

                console.error(
                    'AI assistant error:',
                    err
                );


                resTitle.textContent =
                    'Connection Error';


                resBody.innerHTML =
                    `
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


    presetBtns.forEach(
        button => {

            button.addEventListener(
                'click',
                () => {

                    const query =
                        button.getAttribute(
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


    /* --------------------------------------------------------- */
    /* Evaluator Question */
    /* --------------------------------------------------------- */

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

                customQInput.style.display =
                    selectQ.value ===
                    'custom'
                        ? 'block'
                        : 'none';
            }
        );
    }


    /* --------------------------------------------------------- */
    /* Evaluator Submit */
    /* --------------------------------------------------------- */

    const btnEvalSubmit =
        document.getElementById(
            'btn-submit-eval-answer'
        );


    if (
        btnEvalSubmit &&
        selectQ &&
        customQInput
    ) {

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


                const scoreDisplay =
                    document.getElementById(
                        'eval-overall-score-display'
                    );


                if (scoreDisplay) {

                    scoreDisplay.textContent =
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
                    ''
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

                        setText(
                            'eval-rating-badge',
                            json.rating
                        );


                        const ratingBadge =
                            document.getElementById(
                                'eval-rating-badge'
                            );


                        if (
                            ratingBadge &&
                            json.color
                        ) {

                            ratingBadge.style.background =
                                json.color;
                        }


                        setText(
                            'eval-overall-score-display',
                            `Overall Score: ${json.total_score} / 100`
                        );


                        const breakdown =
                            json.breakdown ||
                            {};


                        setText(
                            'eval-score-tech',
                            `${breakdown.technical_accuracy || 0} / 20`
                        );


                        setText(
                            'eval-score-kw',
                            `${breakdown.keywords_terminology || 0} / 20`
                        );


                        setText(
                            'eval-score-struct',
                            `${breakdown.structure_clarity || 0} / 20`
                        );


                        setText(
                            'eval-score-rel',
                            `${breakdown.real_world_relevance || 0} / 20`
                        );


                        setText(
                            'eval-score-comp',
                            `${breakdown.completeness || 0} / 20`
                        );


                        const strengths =
                            document.getElementById(
                                'eval-strengths-list'
                            );


                        if (strengths) {

                            strengths.innerHTML =
                                (
                                    json.strengths ||
                                    []
                                )
                                    .map(
                                        item =>
                                            `<li>${escapeHtml(item)}</li>`
                                    )
                                    .join('');
                        }


                        const missing =
                            document.getElementById(
                                'eval-missing-list'
                            );


                        if (missing) {

                            missing.innerHTML =
                                (
                                    json.missing_points ||
                                    []
                                )
                                    .map(
                                        item =>
                                            `<li>${escapeHtml(item)}</li>`
                                    )
                                    .join('');
                        }


                        setText(
                            'eval-ideal-answer',
                            json.ideal_answer ||
                            ''
                        );
                    }

                } catch (err) {

                    console.error(
                        'Evaluation error:',
                        err
                    );


                    setText(
                        'eval-overall-score-display',
                        'Evaluation Failed'
                    );
                }
            }
        );
    }
}


/* ============================================================= */
/* HELPER FUNCTIONS */
/* ============================================================= */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            value ??
            '';
    }
}


function escapeHtml(
    value
) {

    return String(
        value ??
        ''
    )
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );
}


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );
}
