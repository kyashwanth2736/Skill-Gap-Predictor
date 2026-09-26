/**
 * Skill-Gap Predictor Frontend Application
 * Project ID: P19
 *
 * Dynamic Career URL Driven Version
 *
 * Features:
 * - Authentication
 * - Sidebar navigation
 * - Dark / Light mode
 * - Mobile sidebar
 * - Resume upload
 * - Resume parser + ATS
 * - Dynamic career URL scraping
 * - Dynamic job recommendation
 * - Dynamic job ranking
 * - Skill gap analysis
 * - Career roadmap
 * - AI interview preparation
 * - AI interview assistant
 * - Answer evaluator
 * - Profile management
 * - Charts
 *
 * IMPORTANT:
 * No predefined company or role is used as a recommendation target.
 * Company, role and required skills come from the career URL workflow.
 */


/* ============================================================
   GLOBAL STATE
   ============================================================ */

window.TARGET_COMPANY =
    window.APP_DATA?.targetCompany || '';

window.TARGET_ROLE =
    window.APP_DATA?.targetRole || '';

window.REQUIRED_SKILLS =
    Array.isArray(window.APP_DATA?.requiredSkills)
        ? window.APP_DATA.requiredSkills
        : [];

window.EXTRACTED_SKILLS =
    Array.isArray(window.APP_DATA?.extractedSkills)
        ? window.APP_DATA.extractedSkills
        : [];

window.ATS_SCORE =
    window.APP_DATA?.atsScore ?? null;

window.CAREER_URL =
    window.APP_DATA?.careerUrl || '';

window.RECOMMENDED_JOB =
    window.APP_DATA?.recommendedJob || null;

window.CAREER_JOBS = [];

window.LATEST_METRICS = null;

let radarChart = null;
let pieChart = null;


/* ============================================================
   DOM READY
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    initThemeToggle();
    initMobileUI();

    initAuthTabs();
    initNavigation();

    initDynamicCareerTarget();

    initCharts();
    initSkillEditor();
    initResumeUpload();
    initJobRanking();
    initWebScraper();
    initProfileForm();
    initAIInterviewAssistant();

    initializePasswordToggles();
    initializeSignupTerms();

    updateDynamicHeader();

    /*
     * Only fetch metrics when a real dynamic role exists.
     */
    if (
        window.TARGET_ROLE &&
        window.REQUIRED_SKILLS &&
        window.REQUIRED_SKILLS.length
    ) {
        fetchMetrics();
    }

});


/* ============================================================
   GENERAL HELPERS
   ============================================================ */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return '';
    }

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


function normalizeArray(value) {

    if (Array.isArray(value)) {
        return value
            .filter(v => v !== null && v !== undefined)
            .map(v => String(v).trim())
            .filter(Boolean);
    }

    if (typeof value === 'string') {

        try {

            const parsed = JSON.parse(value);

            if (Array.isArray(parsed)) {
                return normalizeArray(parsed);
            }

        } catch (e) {
            // Not JSON.
        }

        return value
            .split(/[,;\n]+/)
            .map(v => v.trim())
            .filter(Boolean);
    }

    return [];
}


function normalizeSkill(value) {

    return String(value || '')
        .toLowerCase()
        .replace(/[^\w+#./ -]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}


function uniqueSkills(skills) {

    const result = [];
    const seen = new Set();

    normalizeArray(skills).forEach(skill => {

        const normalized =
            normalizeSkill(skill);

        if (
            normalized &&
            !seen.has(normalized)
        ) {

            seen.add(normalized);
            result.push(String(skill).trim());
        }
    });

    return result;
}


function showElement(element) {

    if (element) {
        element.style.display = '';
    }
}


function hideElement(element) {

    if (element) {
        element.style.display = 'none';
    }
}


function setMessage(element, message, type = 'info') {

    if (!element) {
        return;
    }

    element.textContent = message;

    element.className =
        `alert alert-${type}`;

    element.style.display = 'block';
}


function setLoading(button, loading, text = '') {

    if (!button) {
        return;
    }

    if (loading) {

        button.dataset.originalText =
            button.innerHTML;

        button.disabled = true;

        button.innerHTML =
            `<span class="loading-spinner"></span> ${escapeHTML(text || 'Processing...')}`;

    } else {

        button.disabled = false;

        if (button.dataset.originalText) {

            button.innerHTML =
                button.dataset.originalText;
        }
    }
}


async function apiRequest(
    action,
    formData = null,
    method = 'POST'
) {

    try {

        let response;

        if (method === 'GET') {

            response = await fetch(
                `api.php?action=${encodeURIComponent(action)}`,
                {
                    method: 'GET',
                    credentials: 'same-origin',
                    cache: 'no-store'
                }
            );

        } else {

            if (!formData) {
                formData = new FormData();
            }

            formData.set(
                'action',
                action
            );

            response = await fetch(
                'api.php',
                {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin',
                    cache: 'no-store'
                }
            );
        }


        const contentType =
            response.headers.get('content-type') || '';


        if (!contentType.includes('application/json')) {

            const text =
                await response.text();

            console.error(
                'API returned non-JSON:',
                text
            );

            return {
                status: 'error',
                message:
                    'Server returned an unexpected response.'
            };
        }


        const data =
            await response.json();

        return data;

    } catch (error) {

        console.error(
            `API error [${action}]:`,
            error
        );

        return {
            status: 'error',
            message:
                'Unable to connect to the server.'
        };
    }
}


/* ============================================================
   AUTHENTICATION
   ============================================================ */

function initAuthTabs() {

    const tabLogin =
        document.getElementById(
            'tab-btn-login'
        );

    const tabSignup =
        document.getElementById(
            'tab-btn-signup'
        );

    const formLogin =
        document.getElementById(
            'form-login-box'
        );

    const formSignup =
        document.getElementById(
            'form-signup-box'
        );


    if (
        tabLogin &&
        tabSignup &&
        formLogin &&
        formSignup
    ) {

        tabLogin.addEventListener(
            'click',
            () => {

                tabLogin.classList.add(
                    'active'
                );

                tabSignup.classList.remove(
                    'active'
                );

                formLogin.style.display =
                    'block';

                formSignup.style.display =
                    'none';

            }
        );


        tabSignup.addEventListener(
            'click',
            () => {

                tabSignup.classList.add(
                    'active'
                );

                tabLogin.classList.remove(
                    'active'
                );

                formSignup.style.display =
                    'block';

                formLogin.style.display =
                    'none';

            }
        );
    }


    /* --------------------------------------------------------
       LOGIN
       -------------------------------------------------------- */

    const loginBtn =
        document.getElementById(
            'btn-do-login'
        );


    if (loginBtn) {

        loginBtn.addEventListener(
            'click',
            async event => {

                event.preventDefault();


                const emailInput =
                    document.getElementById(
                        'login_email'
                    );

                const passwordInput =
                    document.getElementById(
                        'login_password'
                    );

                const errorBox =
                    document.getElementById(
                        'login-error-msg'
                    );


                const email =
                    emailInput
                        ? emailInput.value.trim()
                        : '';

                const password =
                    passwordInput
                        ? passwordInput.value
                        : '';


                if (!email || !password) {

                    setMessage(
                        errorBox,
                        'Please enter both email and password.',
                        'error'
                    );

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


                setLoading(
                    loginBtn,
                    true,
                    'Signing in...'
                );


                const json =
                    await apiRequest(
                        'login',
                        formData
                    );


                setLoading(
                    loginBtn,
                    false
                );


                if (
                    json &&
                    json.status === 'success'
                ) {

                    /*
                     * Important:
                     *
                     * PHP has created the authenticated
                     * session.
                     *
                     * Reload the page so index.php can
                     * render the dashboard.
                     */

                    setMessage(
                        errorBox,
                        'Login successful. Opening your dashboard...',
                        'success'
                    );


                    setTimeout(
                        () => {
                            window.location.href =
                                window.location.pathname;
                        },
                        350
                    );


                    return;
                }


                setMessage(
                    errorBox,
                    json?.message ||
                    'Login failed. Please check your credentials.',
                    'error'
                );
            }
        );
    }


    /* --------------------------------------------------------
       SIGNUP
       -------------------------------------------------------- */

    const signupBtn =
        document.getElementById(
            'btn-do-signup'
        );


    if (signupBtn) {

        signupBtn.addEventListener(
            'click',
            async event => {

                event.preventDefault();


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

                const branchInput =
                    document.getElementById(
                        'signup_branch'
                    );

                /*
                 * Support both IDs.
                 *
                 * Older HTML:
                 * signup_year
                 *
                 * Newer HTML:
                 * signup_gradyear
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


                const errorBox =
                    document.getElementById(
                        'signup-error-msg'
                    );

                const successBox =
                    document.getElementById(
                        'signup-success-msg'
                    );


                const name =
                    nameInput
                        ? nameInput.value.trim()
                        : '';

                const email =
                    emailInput
                        ? emailInput.value.trim()
                        : '';

                const password =
                    passwordInput
                        ? passwordInput.value
                        : '';

                const university =
                    universityInput
                        ? universityInput.value.trim()
                        : '';

                const branch =
                    branchInput
                        ? branchInput.value.trim()
                        : '';

                const graduationYear =
                    yearInput
                        ? yearInput.value
                        : '';

                const linkedin =
                    linkedinInput
                        ? linkedinInput.value.trim()
                        : '';

                const github =
                    githubInput
                        ? githubInput.value.trim()
                        : '';


                if (!name) {

                    setMessage(
                        errorBox,
                        'Please enter your full name.',
                        'error'
                    );

                    return;
                }


                if (
                    !email ||
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                ) {

                    setMessage(
                        errorBox,
                        'Please enter a valid email address.',
                        'error'
                    );

                    return;
                }


                const passwordValid =
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
                        .test(password);


                if (!passwordValid) {

                    setMessage(
                        errorBox,
                        'Password must contain at least 8 characters, including uppercase, lowercase, number and special character.',
                        'error'
                    );

                    return;
                }


                const terms =
                    document.getElementById(
                        'signup-terms'
                    );


                if (
                    terms &&
                    !terms.checked
                ) {

                    setMessage(
                        errorBox,
                        'Please accept the Terms of Service and Privacy Policy.',
                        'error'
                    );

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
                    graduationYear
                );

                formData.append(
                    'linkedin',
                    linkedin
                );

                formData.append(
                    'github',
                    github
                );


                setLoading(
                    signupBtn,
                    true,
                    'Creating account...'
                );


                const json =
                    await apiRequest(
                        'signup',
                        formData
                    );


                setLoading(
                    signupBtn,
                    false
                );


                if (
                    json &&
                    json.status === 'success'
                ) {

                    setMessage(
                        successBox,
                        json.message ||
                        'Account created successfully.',
                        'success'
                    );


                    if (errorBox) {
                        errorBox.style.display =
                            'none';
                    }


                    setTimeout(
                        () => {

                            if (tabLogin) {
                                tabLogin.click();
                            }

                            if (emailInput) {
                                document.getElementById(
                                    'login_email'
                                )?.focus();
                            }

                        },
                        1200
                    );


                } else {

                    setMessage(
                        errorBox,
                        json?.message ||
                        'Registration failed.',
                        'error'
                    );
                }

            }
        );
    }


    /* --------------------------------------------------------
       LOGOUT
       -------------------------------------------------------- */

    const logoutBtn =
        document.getElementById(
            'btn-logout'
        );


    if (logoutBtn) {

        logoutBtn.addEventListener(
            'click',
            async () => {

                setLoading(
                    logoutBtn,
                    true,
                    'Logging out...'
                );


                const json =
                    await apiRequest(
                        'logout',
                        null,
                        'GET'
                    );


                if (
                    json &&
                    json.status === 'success'
                ) {

                    window.location.href =
                        window.location.pathname;

                } else {

                    window.location.reload();
                }
            }
        );
    }
}


/* ============================================================
   PASSWORD TOGGLE
   ============================================================ */

function initializePasswordToggles() {

    const toggles = [

        [
            'toggle-login-password',
            'login_password'
        ],

        [
            'toggle-signup-password',
            'signup_pwd'
        ]

    ];


    toggles.forEach(
        ([toggleId, inputId]) => {

            const toggle =
                document.getElementById(
                    toggleId
                );

            const input =
                document.getElementById(
                    inputId
                );


            if (
                !toggle ||
                !input
            ) {
                return;
            }


            toggle.addEventListener(
                'click',
                () => {

                    if (
                        input.type ===
                        'password'
                    ) {

                        input.type =
                            'text';

                        toggle.textContent =
                            '🙈';

                    } else {

                        input.type =
                            'password';

                        toggle.textContent =
                            '👁️';
                    }
                }
            );
        }
    );
}


/* ============================================================
   SIGNUP TERMS
   ============================================================ */

function initializeSignupTerms() {

    const terms =
        document.getElementById(
            'signup-terms'
        );

    const signupBtn =
        document.getElementById(
            'btn-do-signup'
        );


    if (
        !terms ||
        !signupBtn
    ) {
        return;
    }


    const updateButton =
        () => {

            signupBtn.disabled =
                !terms.checked;

            signupBtn.style.opacity =
                terms.checked
                    ? '1'
                    : '0.6';

            signupBtn.style.cursor =
                terms.checked
                    ? 'pointer'
                    : 'not-allowed';
        };


    terms.addEventListener(
        'change',
        updateButton
    );


    updateButton();
}


/* ============================================================
   SIDEBAR NAVIGATION
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


    navItems.forEach(
        item => {

            item.addEventListener(
                'click',
                event => {

                    event.preventDefault();


                    const targetViewId =
                        item.getAttribute(
                            'data-view'
                        );


                    if (!targetViewId) {
                        return;
                    }


                    navItems.forEach(
                        nav => {
                            nav.classList.remove(
                                'active'
                            );
                        }
                    );


                    views.forEach(
                        view => {

                            view.style.display =
                                'none';

                            view.classList.remove(
                                'view-active'
                            );
                        }
                    );


                    item.classList.add(
                        'active'
                    );


                    const targetView =
                        document.getElementById(
                            targetViewId
                        );


                    if (targetView) {

                        targetView.style.display =
                            'block';

                        requestAnimationFrame(
                            () => {
                                targetView.classList.add(
                                    'view-active'
                                );
                            }
                        );
                    }


                    if (
                        targetViewId ===
                        'view-roadmap'
                    ) {

                        loadDynamicRoadmap();
                    }


                    if (
                        targetViewId ===
                        'view-interview'
                    ) {

                        loadDynamicInterview();
                    }


                    if (
                        targetViewId ===
                        'view-jobranking'
                    ) {

                        loadDynamicJobsIntoRanking();
                    }


                    closeMobileSidebar();
                }
            );
        }
    );
}


/* ============================================================
   MOBILE SIDEBAR
   ============================================================ */

function findFirstSelector(
    selectors
) {

    for (
        const selector of selectors
    ) {

        const element =
            document.querySelector(
                selector
            );

        if (element) {
            return element;
        }
    }

    return null;
}


function initMobileUI() {

    const menuButton =
        findFirstSelector([
            '#mobile-menu-toggle',
            '#btn-mobile-menu',
            '#menu-toggle',
            '#mobile-menu-btn',
            '#sidebar-toggle',
            '.mobile-menu-toggle'
        ]);


    const sidebar =
        findFirstSelector([
            '#sidebar',
            '#app-sidebar',
            '.sidebar',
            '.dashboard-sidebar'
        ]);


    if (!sidebar) {
        return;
    }


    let overlay =
        findFirstSelector([
            '#sidebar-overlay',
            '#mobile-overlay',
            '.sidebar-overlay',
            '.mobile-overlay'
        ]);


    /*
     * Create overlay if the current UI doesn't already have one.
     */
    if (!overlay) {

        overlay =
            document.createElement(
                'div'
            );

        overlay.id =
            'sidebar-overlay';

        overlay.className =
            'sidebar-overlay';

        document.body.appendChild(
            overlay
        );


        Object.assign(
            overlay.style,
            {
                display: 'none',
                position: 'fixed',
                inset: '0',
                background:
                    'rgba(2, 6, 23, 0.58)',
                backdropFilter:
                    'blur(3px)',
                zIndex: '999',
                transition:
                    'opacity .25s ease'
            }
        );
    }


    if (menuButton) {

        menuButton.addEventListener(
            'click',
            event => {

                event.preventDefault();

                toggleMobileSidebar();
            }
        );
    }


    overlay.addEventListener(
        'click',
        closeMobileSidebar
    );


    /*
     * Close sidebar when a navigation item is clicked
     * on smaller screens.
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
                            closeMobileSidebar();
                        }
                    }
                );
            }
        );
}


function toggleMobileSidebar() {

    const sidebar =
        findFirstSelector([
            '#sidebar',
            '#app-sidebar',
            '.sidebar',
            '.dashboard-sidebar'
        ]);


    const overlay =
        findFirstSelector([
            '#sidebar-overlay',
            '#mobile-overlay',
            '.sidebar-overlay',
            '.mobile-overlay'
        ]);


    if (!sidebar) {
        return;
    }


    const isOpen =
        sidebar.classList.contains(
            'mobile-open'
        );


    if (isOpen) {

        closeMobileSidebar();

    } else {

        sidebar.classList.add(
            'mobile-open'
        );

        document.body.classList.add(
            'sidebar-open'
        );


        if (overlay) {

            overlay.style.display =
                'block';

            requestAnimationFrame(
                () => {
                    overlay.style.opacity =
                        '1';
                }
            );
        }
    }
}


function closeMobileSidebar() {

    const sidebar =
        findFirstSelector([
            '#sidebar',
            '#app-sidebar',
            '.sidebar',
            '.dashboard-sidebar'
        ]);


    const overlay =
        findFirstSelector([
            '#sidebar-overlay',
            '#mobile-overlay',
            '.sidebar-overlay',
            '.mobile-overlay'
        ]);


    if (sidebar) {

        sidebar.classList.remove(
            'mobile-open'
        );
    }


    document.body.classList.remove(
        'sidebar-open'
    );


    if (overlay) {

        overlay.style.opacity =
            '0';

        setTimeout(
            () => {

                if (
                    !document.body.classList.contains(
                        'sidebar-open'
                    )
                ) {

                    overlay.style.display =
                        'none';
                }

            },
            250
        );
    }
}


/* ============================================================
   DARK / LIGHT THEME
   ============================================================ */

function initThemeToggle() {

    const themeButton =
        findFirstSelector([
            '#theme-toggle',
            '#btn-theme-toggle',
            '#toggle-theme',
            '#theme-switch',
            '#dark-mode-toggle',
            '[data-theme-toggle]'
        ]);


    const savedTheme =
        localStorage.getItem(
            'sgp-theme'
        );


    if (savedTheme === 'light') {

        applyTheme(
            'light',
            false
        );

    } else {

        applyTheme(
            'dark',
            false
        );
    }


    if (!themeButton) {
        return;
    }


    themeButton.addEventListener(
        'click',
        event => {

            event.preventDefault();


            const isLight =
                document.body.classList.contains(
                    'light-theme'
                );


            applyTheme(
                isLight
                    ? 'dark'
                    : 'light',
                true
            );
        }
    );
}


function applyTheme(
    theme,
    animate = true
) {

    const isLight =
        theme === 'light';


    if (animate) {

        document.body.classList.add(
            'theme-transition'
        );


        setTimeout(
            () => {

                document.body.classList.remove(
                    'theme-transition'
                );

            },
            450
        );
    }


    document.body.classList.toggle(
        'light-theme',
        isLight
    );


    document.documentElement.dataset.theme =
        theme;


    localStorage.setItem(
        'sgp-theme',
        theme
    );


    const themeButton =
        findFirstSelector([
            '#theme-toggle',
            '#btn-theme-toggle',
            '#toggle-theme',
            '#theme-switch',
            '#dark-mode-toggle',
            '[data-theme-toggle]'
        ]);


    if (themeButton) {

        themeButton.setAttribute(
            'aria-label',
            isLight
                ? 'Switch to dark mode'
                : 'Switch to light mode'
        );


        /*
         * Preserve an icon if the existing button
         * contains other markup.
         */
        const icon =
            themeButton.querySelector(
                '.theme-icon'
            );


        if (icon) {

            icon.textContent =
                isLight
                    ? '🌙'
                    : '☀️';

        } else if (
            themeButton.children.length === 0
        ) {

            themeButton.textContent =
                isLight
                    ? '🌙'
                    : '☀️';
        }
    }


    /*
     * Update Chart.js colors when available.
     */
    updateChartTheme();
}


function updateChartTheme() {

    const isLight =
        document.body.classList.contains(
            'light-theme'
        );


    const textColor =
        isLight
            ? '#334155'
            : '#f9fafb';


    const gridColor =
        isLight
            ? 'rgba(15, 23, 42, 0.12)'
            : 'rgba(255,255,255,0.1)';


    if (radarChart) {

        if (
            radarChart.options.scales &&
            radarChart.options.scales.r
        ) {

            radarChart.options.scales.r.angleLines.color =
                gridColor;

            radarChart.options.scales.r.grid.color =
                gridColor;

            radarChart.options.scales.r.pointLabels.color =
                textColor;
        }


        radarChart.update(
            'none'
        );
    }


    if (pieChart) {

        if (
            pieChart.options.plugins &&
            pieChart.options.plugins.legend &&
            pieChart.options.plugins.legend.labels
        ) {

            pieChart.options.plugins.legend.labels.color =
                textColor;
        }


        pieChart.update(
            'none'
        );
    }
}


/* ============================================================
   DYNAMIC CAREER TARGET UI
   ============================================================ */

function initDynamicCareerTarget() {

    /*
     * The existing HTML contains the old benchmark selector.
     *
     * Hide the old benchmark/custom controls because the
     * application is now career-URL driven.
     */

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
            'none';
    }


    if (customBox) {

        customBox.style.display =
            'none';
    }


    const modeBenchmark =
        document.getElementById(
            'mode-benchmark'
        );

    const modeCustom =
        document.getElementById(
            'mode-custom'
        );


    if (modeBenchmark) {
        modeBenchmark.closest(
            'div'
        )?.style.setProperty(
            'display',
            'none'
        );
    }


    /*
     * Insert dynamic career URL controls before
     * the navigation menu if they are not already there.
     */

    const navMenu =
        document.querySelector(
            '.nav-menu'
        );


    if (!navMenu) {
        return;
    }


    if (
        document.getElementById(
            'dynamic-career-target-panel'
        )
    ) {
        return;
    }


    const panel =
        document.createElement(
            'div'
        );


    panel.id =
        'dynamic-career-target-panel';


    panel.innerHTML = `
        <div style="
            margin: 14px 0 18px;
            padding: 15px;
            border-radius: 14px;
            background: rgba(99,102,241,.10);
            border: 1px solid rgba(99,102,241,.25);
        ">

            <div style="
                font-size: 13px;
                font-weight: 800;
                color: var(--cyan-light);
                margin-bottom: 8px;
            ">
                🌐 Dynamic Career Source
            </div>

            <div style="
                font-size: 11px;
                color: var(--text-muted);
                line-height: 1.5;
                margin-bottom: 10px;
            ">
                Enter a career or job URL. Jobs and requirements
                will be extracted from the page.
            </div>

            <input
                type="url"
                id="dynamic-career-url"
                class="form-control"
                placeholder="https://careers.example.com/jobs/..."
                value="${escapeHTML(window.CAREER_URL)}"
                style="
                    width:100%;
                    margin-bottom:8px;
                    box-sizing:border-box;
                "
            >

            <button
                type="button"
                id="dynamic-career-url-btn"
                class="btn btn-block"
                style="font-size:12px;padding:9px 12px;"
            >
                🔎 Analyze Career URL
            </button>

            <div
                id="dynamic-career-status"
                style="
                    display:none;
                    margin-top:9px;
                    font-size:11px;
                    line-height:1.5;
                "
            ></div>

        </div>
    `;


    navMenu.parentNode.insertBefore(
        panel,
        navMenu
    );


    const input =
        document.getElementById(
            'dynamic-career-url'
        );

    const button =
        document.getElementById(
            'dynamic-career-url-btn'
        );


    if (button) {

        button.addEventListener(
            'click',
            async () => {

                const url =
                    input
                        ? input.value.trim()
                        : '';


                if (!url) {

                    showDynamicCareerStatus(
                        'Please enter a career URL.',
                        'error'
                    );

                    return;
                }


                await scrapeCareerURL(
                    url
                );
            }
        );
    }
}


/* ============================================================
   DYNAMIC CAREER URL SCRAPER
   ============================================================ */

async function scrapeCareerURL(url) {

    const statusBox =
        document.getElementById(
            'dynamic-career-status'
        );

    const button =
        document.getElementById(
            'dynamic-career-url-btn'
        );


    showDynamicCareerStatus(
        'Reading the career page and extracting available jobs...',
        'info'
    );


    setLoading(
        button,
        true,
        'Analyzing...'
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


    const json =
        await apiRequest(
            'scrape_url',
            formData
        );


    setLoading(
        button,
        false
    );


    if (
        !json ||
        json.status !== 'success'
    ) {

        showDynamicCareerStatus(
            json?.message ||
            json?.error ||
            'Unable to analyze the career URL.',
            'error'
        );

        return;
    }


    window.CAREER_URL =
        url;


    /*
     * Different scraper implementations can return
     * jobs under different keys.
     */

    const jobs =
        extractJobsFromResponse(
            json
        );


    window.CAREER_JOBS =
        jobs;


    if (!jobs.length) {

        showDynamicCareerStatus(
            'The page was read, but no structured job listings with requirements were found. Try a specific job listing URL or a career page that exposes job details.',
            'warning'
        );

        renderScrapeResults(
            json,
            []
        );

        return;
    }


    /*
     * We now have actual jobs.
     *
     * If resume skills exist, calculate the dynamic
     * recommendation immediately.
     */

    let recommendation =
        null;


    if (
        window.EXTRACTED_SKILLS &&
        window.EXTRACTED_SKILLS.length
    ) {

        recommendation =
            calculateBestJobMatch(
                jobs,
                window.EXTRACTED_SKILLS
            );
    }


    if (recommendation) {

        await applyDynamicRecommendation(
            recommendation
        );


        showDynamicCareerStatus(
            `Found ${jobs.length} job listing(s). Recommended match: ${recommendation.role}${recommendation.company ? ` at ${recommendation.company}` : ''}.`,
            'success'
        );

    } else {

        showDynamicCareerStatus(
            `Found ${jobs.length} job listing(s). Upload your resume to calculate the strongest role match.`,
            'success'
        );
    }


    renderScrapeResults(
        json,
        jobs
    );


    renderDynamicJobCards(
        jobs
    );


    loadDynamicJobsIntoRanking();
}


function showDynamicCareerStatus(
    message,
    type = 'info'
) {

    const box =
        document.getElementById(
            'dynamic-career-status'
        );


    if (!box) {
        return;
    }


    const colors = {

        info:
            'var(--cyan-light)',

        success:
            'var(--emerald)',

        warning:
            'var(--amber)',

        error:
            'var(--rose)'
    };


    box.style.display =
        'block';

    box.style.color =
        colors[type] ||
        colors.info;

    box.textContent =
        message;
}


/* ============================================================
   SCRAPER RESPONSE NORMALIZATION
   ============================================================ */

function extractJobsFromResponse(
    response
) {

    if (!response) {
        return [];
    }


    const possibleArrays = [

        response.jobs,

        response.roles,

        response.job_listings,

        response.jobListings,

        response.listings,

        response.data?.jobs,

        response.data?.roles,

        response.data?.job_listings,

        response.data?.jobListings,

        response.result?.jobs,

        response.result?.roles
    ];


    for (
        const candidate
        of possibleArrays
    ) {

        if (
            Array.isArray(candidate) &&
            candidate.length
        ) {

            const normalized =
                normalizeJobs(
                    candidate
                );


            if (normalized.length) {
                return normalized;
            }
        }
    }


    /*
     * Recursive fallback.
     */

    const recursive =
        findJobsRecursively(
            response
        );


    return normalizeJobs(
        recursive
    );
}


function findJobsRecursively(
    value,
    depth = 0
) {

    if (
        depth > 6 ||
        !value ||
        typeof value !== 'object'
    ) {

        return [];
    }


    if (Array.isArray(value)) {

        /*
         * Determine whether this looks like a job array.
         */

        const jobLike =
            value.filter(
                item =>
                    item &&
                    typeof item === 'object' &&
                    (
                        item.title ||
                        item.role ||
                        item.job_title ||
                        item.position
                    )
            );


        if (jobLike.length) {
            return jobLike;
        }


        for (
            const item
            of value
        ) {

            const found =
                findJobsRecursively(
                    item,
                    depth + 1
                );


            if (found.length) {
                return found;
            }
        }


        return [];
    }


    for (
        const key
        of Object.keys(value)
    ) {

        const child =
            value[key];


        if (
            child &&
            typeof child === 'object'
        ) {

            const found =
                findJobsRecursively(
                    child,
                    depth + 1
                );


            if (found.length) {
                return found;
            }
        }
    }


    return [];
}


function normalizeJobs(
    jobs
) {

    if (!Array.isArray(jobs)) {
        return [];
    }


    const result = [];


    jobs.forEach(
        (job, index) => {

            if (
                !job ||
                typeof job !== 'object'
            ) {
                return;
            }


            const company =
                firstValue(
                    job.company,
                    job.employer,
                    job.company_name,
                    job.organization,
                    job.organisation
                );


            const role =
                firstValue(
                    job.role,
                    job.title,
                    job.job_title,
                    job.position,
                    job.jobTitle,
                    job.name
                );


            let requiredSkills =
                firstValue(
                    job.required_skills,
                    job.requiredSkills,
                    job.skills,
                    job.technologies,
                    job.tech_stack,
                    job.requirements
                );


            const description =
                firstValue(
                    job.description,
                    job.text,
                    job.summary,
                    job.content,
                    ''
                );


            const url =
                firstValue(
                    job.url,
                    job.link,
                    job.job_url,
                    job.apply_url,
                    job.applyUrl,
                    ''
                );


            const domain =
                firstValue(
                    job.domain,
                    job.category,
                    job.department,
                    ''
                );


            requiredSkills =
                uniqueSkills(
                    requiredSkills
                );


            /*
             * If scraper returned requirements as a string
             * and not a skill array, split them carefully.
             */

            if (
                !requiredSkills.length &&
                typeof job.requirements ===
                    'string'
            ) {

                requiredSkills =
                    extractSkillLikeTerms(
                        job.requirements
                    );
            }


            /*
             * Do not keep empty records.
             */

            if (
                !role &&
                !requiredSkills.length
            ) {

                return;
            }


            result.push({

                id:
                    job.id ||
                    `job-${index + 1}`,

                company:
                    String(company || '').trim(),

                role:
                    String(role || '').trim(),

                required_skills:
                    requiredSkills,

                url:
                    String(url || '').trim(),

                description:
                    String(description || '').trim(),

                domain:
                    String(domain || '').trim()
            });
        }
    );


    return result;
}


function firstValue(...values) {

    for (
        const value
        of values
    ) {

        if (
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ''
        ) {

            return value;
        }
    }


    return '';
}


/*
 * Used only when the scraper returns requirements as
 * plain text instead of a structured skill list.
 *
 * This does NOT create a company or role.
 */
function extractSkillLikeTerms(
    text
) {

    if (
        !text ||
        typeof text !== 'string'
    ) {
        return [];
    }


    const knownPatterns = [

        'Python',
        'Java',
        'JavaScript',
        'TypeScript',
        'C++',
        'C#',
        'SQL',
        'HTML',
        'CSS',
        'React',
        'Angular',
        'Vue',
        'Node.js',
        'Express',
        'Django',
        'Flask',
        'PHP',
        'Laravel',
        'Spring',
        'Spring Boot',
        'REST API',
        'REST APIs',
        'GraphQL',
        'Docker',
        'Kubernetes',
        'AWS',
        'Azure',
        'Google Cloud',
        'GCP',
        'Linux',
        'Git',
        'GitHub',
        'Jenkins',
        'Terraform',
        'MySQL',
        'PostgreSQL',
        'MongoDB',
        'Redis',
        'Pandas',
        'NumPy',
        'Scikit-Learn',
        'TensorFlow',
        'PyTorch',
        'Data Structures',
        'Algorithms',
        'System Design',
        'Cyber Security',
        'Networking',
        'Computer Networks',
        'Machine Learning',
        'Deep Learning'
    ];


    const lower =
        text.toLowerCase();


    const found = [];


    knownPatterns.forEach(
        skill => {

            if (
                lower.includes(
                    skill.toLowerCase()
                )
            ) {

                found.push(skill);
            }
        }
    );


    return uniqueSkills(
        found
    );
}


/* ============================================================
   BEST DYNAMIC JOB MATCH
   ============================================================ */

function calculateBestJobMatch(
    jobs,
    resumeSkills
) {

    const skills =
        uniqueSkills(
            resumeSkills
        );


    if (
        !jobs.length ||
        !skills.length
    ) {

        return null;
    }


    const normalizedResume =
        skills.map(
            normalizeSkill
        );


    const scored =
        jobs.map(
            job => {

                const required =
                    uniqueSkills(
                        job.required_skills
                    );


                const normalizedRequired =
                    required.map(
                        normalizeSkill
                    );


                const matched = [];
                const missing = [];


                normalizedRequired.forEach(
                    (
                        requiredNormalized,
                        index
                    ) => {

                        const exact =
                            normalizedResume.some(
                                resumeSkill =>
                                    resumeSkill ===
                                        requiredNormalized
                                    ||
                                    resumeSkill.includes(
                                        requiredNormalized
                                    )
                                    ||
                                    requiredNormalized.includes(
                                        resumeSkill
                                    )
                            );


                        if (exact) {

                            matched.push(
                                required[index]
                            );

                        } else {

                            missing.push(
                                required[index]
                            );
                        }
                    }
                );


                let score = 0;


                if (required.length) {

                    score =
                        (
                            matched.length /
                            required.length
                        ) * 100;

                } else {

                    /*
                     * A job without requirements cannot
                     * produce a meaningful skill match.
                     */

                    score = 0;
                }


                return {

                    ...job,

                    matched_skills:
                        matched,

                    missing_skills:
                        missing,

                    match_pct:
                        Math.round(
                            score * 10
                        ) / 10,

                    matched_count:
                        matched.length,

                    total_count:
                        required.length
                };
            }
        );


    scored.sort(
        (a, b) => {

            if (
                b.match_pct !==
                a.match_pct
            ) {

                return (
                    b.match_pct -
                    a.match_pct
                );
            }


            return (
                b.matched_count -
                a.matched_count
            );
        }
    );


    return scored[0] || null;
}


/* ============================================================
   APPLY DYNAMIC RECOMMENDATION
   ============================================================ */

async function applyDynamicRecommendation(
    job
) {

    if (!job) {
        return;
    }


    window.RECOMMENDED_JOB =
        job;


    window.TARGET_COMPANY =
        job.company || '';

    window.TARGET_ROLE =
        job.role || '';

    window.REQUIRED_SKILLS =
        uniqueSkills(
            job.required_skills
        );


    window.APP_DATA =
        window.APP_DATA || {};


    window.APP_DATA.targetCompany =
        window.TARGET_COMPANY;

    window.APP_DATA.targetRole =
        window.TARGET_ROLE;

    window.APP_DATA.requiredSkills =
        window.REQUIRED_SKILLS;


    updateDynamicHeader();


    /*
     * Send the selected dynamic role to the backend.
     */

    const formData =
        new FormData();

    formData.append(
        'target_company',
        window.TARGET_COMPANY
    );

    formData.append(
        'target_role',
        window.TARGET_ROLE
    );

    formData.append(
        'required_skills',
        JSON.stringify(
            window.REQUIRED_SKILLS
        )
    );


    /*
     * get_metrics persists the current dynamic target
     * in the PHP session.
     */

    const metrics =
        await apiRequest(
            'get_metrics',
            formData
        );


    if (
        metrics &&
        metrics.status !== 'error'
    ) {

        window.LATEST_METRICS =
            metrics;

        updateMetricUI(
            metrics
        );
    }


    renderRecommendationCard(
        job
    );
}


/* ============================================================
   DYNAMIC HEADER
   ============================================================ */

function updateDynamicHeader() {

    const banner =
        document.getElementById(
            'banner-company-role'
        );


    if (!banner) {
        return;
    }


    const company =
        String(
            window.TARGET_COMPANY || ''
        ).trim();


    const role =
        String(
            window.TARGET_ROLE || ''
        ).trim();


    if (
        company &&
        role
    ) {

        banner.textContent =
            `${company} · ${role}`;

        return;
    }


    if (role) {

        banner.textContent =
            role;

        return;
    }


    banner.textContent =
        'Career Analysis Workspace';
}


/* ============================================================
   RECOMMENDATION CARD
   ============================================================ */

function renderRecommendationCard(
    job
) {

    if (!job) {
        return;
    }


    let container =
        document.getElementById(
            'dynamic-recommendation-card'
        );


    if (!container) {

        const main =
            document.querySelector(
                '.main-content'
            );


        if (!main) {
            return;
        }


        container =
            document.createElement(
                'div'
            );


        container.id =
            'dynamic-recommendation-card';


        main.insertBefore(
            container,
            main.firstElementChild
        );
    }


    const matched =
        normalizeArray(
            job.matched_skills
        );


    const missing =
        normalizeArray(
            job.missing_skills
        );


    const score =
        Number(
            job.match_pct || 0
        );


    container.innerHTML = `
        <div style="
            margin-bottom:22px;
            padding:20px;
            border-radius:18px;
            background:
                linear-gradient(
                    135deg,
                    rgba(99,102,241,.18),
                    rgba(6,182,212,.10)
                );
            border:1px solid rgba(99,102,241,.30);
            box-shadow:0 12px 35px rgba(0,0,0,.18);
            animation: fadeInUp .45s ease;
        ">

            <div style="
                font-size:12px;
                text-transform:uppercase;
                letter-spacing:.08em;
                color:var(--cyan-light);
                font-weight:800;
                margin-bottom:7px;
            ">
                🎯 Dynamic Job Recommendation
            </div>

            <div style="
                display:flex;
                justify-content:space-between;
                gap:18px;
                flex-wrap:wrap;
                align-items:flex-start;
            ">

                <div>

                    <h3 style="
                        margin:0 0 6px;
                    ">
                        ${escapeHTML(job.role || 'Job Role')}
                    </h3>

                    <p style="
                        margin:0;
                        color:var(--text-muted);
                    ">
                        ${escapeHTML(job.company || 'Company not specified')}
                    </p>

                    ${
                        job.url
                            ? `
                                <a
                                    href="${escapeHTML(job.url)}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="extracted-link"
                                    style="
                                        display:inline-block;
                                        margin-top:9px;
                                    "
                                >
                                    🔗 View Job
                                </a>
                            `
                            : ''
                    }

                </div>

                <div style="
                    min-width:110px;
                    text-align:center;
                ">

                    <div style="
                        font-size:28px;
                        font-weight:900;
                        color:var(--cyan-light);
                    ">
                        ${score}%
                    </div>

                    <div style="
                        font-size:11px;
                        color:var(--text-muted);
                    ">
                        Skill Match
                    </div>

                </div>

            </div>


            <div style="
                display:grid;
                grid-template-columns:
                    repeat(auto-fit,minmax(220px,1fr));
                gap:14px;
                margin-top:18px;
            ">

                <div>
                    <strong style="
                        color:var(--emerald);
                    ">
                        ✓ Matched Skills
                    </strong>

                    <div style="
                        margin-top:8px;
                    ">
                        ${
                            matched.length
                                ? matched
                                    .map(
                                        skill =>
                                            `<span class="skill-tag-matched">${escapeHTML(skill)}</span>`
                                    )
                                    .join('')
                                : '<span style="color:var(--text-muted);">None detected</span>'
                        }
                    </div>
                </div>


                <div>
                    <strong style="
                        color:var(--rose);
                    ">
                        ⚠ Missing Skills
                    </strong>

                    <div style="
                        margin-top:8px;
                    ">
                        ${
                            missing.length
                                ? missing
                                    .map(
                                        skill =>
                                            `<span class="skill-tag-missing">${escapeHTML(skill)}</span>`
                                    )
                                    .join('')
                                : '<span style="color:var(--emerald);">No missing required skills</span>'
                        }
                    </div>
                </div>

            </div>

        </div>
    `;
}


/* ============================================================
   SCRAPE RESULT DISPLAY
   ============================================================ */

function renderScrapeResults(
    response,
    jobs
) {

    const box =
        document.getElementById(
            'scrape-results-box'
        );


    if (!box) {
        return;
    }


    box.style.display =
        'block';


    if (!jobs.length) {

        box.className =
            'alert alert-warning';

        box.textContent =
            'Page was read, but no structured jobs were discovered.';

        return;
    }


    box.className =
        'alert alert-success';


    const title =
        response?.title ||
        response?.data?.title ||
        'Career Page';


    box.innerHTML = `
        <strong>
            ${escapeHTML(title)}
        </strong>

        <br>

        <span>
            ${jobs.length}
            job listing(s) discovered.
        </span>

        <br>

        <span style="
            display:block;
            margin-top:6px;
            color:var(--text-muted);
        ">
            Upload your resume to calculate the
            strongest skill match.
        </span>
    `;
}


/* ============================================================
   DYNAMIC JOB CARDS
   ============================================================ */

function renderDynamicJobCards(
    jobs
) {

    let container =
        document.getElementById(
            'dynamic-job-results'
        );


    if (!container) {

        const rankingView =
            document.getElementById(
                'view-jobranking'
            );


        if (!rankingView) {
            return;
        }


        container =
            document.createElement(
                'div'
            );


        container.id =
            'dynamic-job-results';


        rankingView.appendChild(
            container
        );
    }


    if (!jobs.length) {

        container.innerHTML =
            '';

        return;
    }


    const ranked =
        window.EXTRACTED_SKILLS.length
            ? jobs
                .map(
                    job =>
                        calculateJobScore(
                            job,
                            window.EXTRACTED_SKILLS
                        )
                )
                .sort(
                    (a, b) =>
                        b.match_pct -
                        a.match_pct
                )
            : jobs;


    container.innerHTML = `
        <div style="
            margin-top:24px;
        ">

            <h4 style="
                color:var(--cyan-light);
                margin-bottom:14px;
            ">
                🌐 Jobs Found From Career URL
            </h4>

            <div style="
                display:grid;
                grid-template-columns:
                    repeat(auto-fit,minmax(260px,1fr));
                gap:15px;
            ">

                ${
                    ranked
                        .map(
                            job => `

                            <div style="
                                padding:16px;
                                border-radius:14px;
                                border:1px solid var(--card-border);
                                background:rgba(15,23,42,.45);
                                transition:
                                    transform .25s ease,
                                    box-shadow .25s ease;
                            "
                            onmouseenter="
                                this.style.transform='translateY(-3px)';
                                this.style.boxShadow='0 12px 28px rgba(0,0,0,.18)';
                            "
                            onmouseleave="
                                this.style.transform='translateY(0)';
                                this.style.boxShadow='none';
                            ">

                                <div style="
                                    font-weight:800;
                                    margin-bottom:5px;
                                ">
                                    ${escapeHTML(job.role || 'Untitled Role')}
                                </div>

                                <div style="
                                    color:var(--text-muted);
                                    font-size:13px;
                                    margin-bottom:10px;
                                ">
                                    ${escapeHTML(job.company || 'Company not specified')}
                                </div>

                                <div style="
                                    color:var(--cyan-light);
                                    font-weight:800;
                                    margin-bottom:9px;
                                ">
                                    ${job.match_pct ?? 0}% match
                                </div>

                                ${
                                    job.url
                                        ? `
                                            <a
                                                href="${escapeHTML(job.url)}"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="extracted-link"
                                            >
                                                View Job →
                                            </a>
                                        `
                                        : ''
                                }

                            </div>
                        `
                        )
                        .join('')
                }

            </div>

        </div>
    `;
}


function calculateJobScore(
    job,
    resumeSkills
) {

    const required =
        uniqueSkills(
            job.required_skills
        );


    const resume =
        uniqueSkills(
            resumeSkills
        );


    const matched =
        required.filter(
            requiredSkill => {

                const r =
                    normalizeSkill(
                        requiredSkill
                    );


                return resume.some(
                    resumeSkill => {

                        const s =
                            normalizeSkill(
                                resumeSkill
                            );


                        return (
                            s === r ||
                            s.includes(r) ||
                            r.includes(s)
                        );
                    }
                );
            }
        );


    const missing =
        required.filter(
            skill =>
                !matched.includes(
                    skill
                )
        );


    const percentage =
        required.length
            ? (
                matched.length /
                required.length
            ) * 100
            : 0;


    return {

        ...job,

        matched_skills:
            matched,

        missing_skills:
            missing,

        match_pct:
            Math.round(
                percentage * 10
            ) / 10,

        matched_count:
            matched.length,

        total_count:
            required.length
    };
}


/* ============================================================
   METRICS
   ============================================================ */

async function fetchMetrics() {

    if (
        !window.TARGET_ROLE ||
        !window.REQUIRED_SKILLS.length
    ) {

        clearMetricsUI();

        return;
    }


    const formData =
        new FormData();

    formData.append(
        'target_company',
        window.TARGET_COMPANY
    );

    formData.append(
        'target_role',
        window.TARGET_ROLE
    );

    formData.append(
        'required_skills',
        JSON.stringify(
            window.REQUIRED_SKILLS
        )
    );


    const data =
        await apiRequest(
            'get_metrics',
            formData
        );


    if (
        !data ||
        data.status === 'error'
    ) {

        console.warn(
            'Metrics unavailable:',
            data?.message
        );

        return;
    }


    window.LATEST_METRICS =
        data;


    updateMetricUI(
        data
    );


    updateCharts(
        data
    );
}


function clearMetricsUI() {

    const readiness =
        document.getElementById(
            'metric-readiness'
        );

    const confidence =
        document.getElementById(
            'metric-confidence'
        );

    const matchedCount =
        document.getElementById(
            'metric-matched-count'
        );


    if (readiness) {
        readiness.textContent =
            '—';
    }


    if (confidence) {
        confidence.textContent =
            '—';
    }


    if (matchedCount) {
        matchedCount.textContent =
            'Select a career URL and job first';
    }
}


function updateMetricUI(
    data
) {

    const readiness =
        data.readiness_pct;


    const confidence =
        data.confidence_pct;


    const matchedSkills =
        normalizeArray(
            data.matched_skills
        );


    const missingSkills =
        normalizeArray(
            data.missing_skills
        );


    const total =
        window.REQUIRED_SKILLS.length ||
        (
            matchedSkills.length +
            missingSkills.length
        );


    const readinessEl =
        document.getElementById(
            'metric-readiness'
        );


    if (readinessEl) {

        readinessEl.textContent =
            typeof readiness === 'number'
                ? `${Math.round(readiness)}%`
                : '—';
    }


    const confidenceEl =
        document.getElementById(
            'metric-confidence'
        );


    if (confidenceEl) {

        confidenceEl.textContent =
            typeof confidence === 'number'
                ? `${Math.round(confidence)}%`
                : '—';
    }


    const matchedCountEl =
        document.getElementById(
            'metric-matched-count'
        );


    if (matchedCountEl) {

        matchedCountEl.textContent =
            `${matchedSkills.length} of ${total} Skills Matched`;
    }


    const strengthEl =
        document.getElementById(
            'metric-strength'
        );


    if (strengthEl) {

        strengthEl.textContent =
            data.strength_label ||
            '—';


        if (
            data.strength_color
        ) {

            strengthEl.style.color =
                data.strength_color;
        }
    }


    /*
     * ATS metric.
     */

    const atsEl =
        document.getElementById(
            'metric-ats'
        );


    if (atsEl) {

        atsEl.textContent =
            typeof window.ATS_SCORE ===
                'number'
                ? `${Math.round(window.ATS_SCORE)}`
                : '—';
    }


    /*
     * Skill tags.
     */

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
                        skill =>
                            `<span class="skill-tag-matched">${escapeHTML(skill)}</span>`
                    )
                    .join('')

                : `
                    <p style="
                        color:var(--text-muted);
                    ">
                        No matching skills detected yet.
                    </p>
                `;
    }


    if (missingBox) {

        missingBox.innerHTML =
            missingSkills.length

                ? missingSkills
                    .map(
                        skill =>
                            `<span class="skill-tag-missing">${escapeHTML(skill)}</span>`
                    )
                    .join('')

                : `
                    <p style="
                        color:var(--emerald);
                    ">
                        All required skills are currently matched.
                    </p>
                `;
    }


    updateCharts(
        data
    );
}


/* ============================================================
   SKILL GAP PREDICTOR
   ============================================================ */

function updateSkillGapFromMetrics(
    data
) {

    updateMetricUI(
        data
    );
}


/* ============================================================
   ROADMAP
   ============================================================ */

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


    if (!window.TARGET_ROLE) {

        roadmapContainer.innerHTML = `
            <div class="alert alert-info">
                Select a job from a career URL first.
            </div>
        `;

        resourcesContainer.innerHTML =
            '';

        return;
    }


    const missingSkills =
        normalizeArray(
            window.LATEST_METRICS?.missing_skills
        );


    roadmapContainer.innerHTML = `
        <div style="
            color:var(--text-muted);
            padding:14px 0;
        ">
            Generating a roadmap for
            <strong>
                ${escapeHTML(window.TARGET_ROLE)}
            </strong>...
        </div>
    `;


    const formData =
        new FormData();


    formData.append(
        'missing_skills',
        JSON.stringify(
            missingSkills
        )
    );


    formData.append(
        'target_company',
        window.TARGET_COMPANY
    );


    formData.append(
        'target_role',
        window.TARGET_ROLE
    );


    const json =
        await apiRequest(
            'get_roadmap',
            formData
        );


    if (
        !json ||
        json.status !== 'success' ||
        !json.roadmap
    ) {

        roadmapContainer.innerHTML = `
            <div class="alert alert-info">
                ${
                    escapeHTML(
                        json?.message ||
                        'Roadmap will appear after a dynamic job is selected.'
                    )
                }
            </div>
        `;

        return;
    }


    const roadmap =
        json.roadmap;


    const phases =
        Array.isArray(
            roadmap.phases
        )
            ? roadmap.phases
            : [];


    const resources =
        Array.isArray(
            roadmap.resources
        )
            ? roadmap.resources
            : [];


    roadmapContainer.innerHTML =
        phases.length

            ? phases
                .map(
                    phase => `

                    <div class="roadmap-phase-card"
                         style="
                            animation:
                                fadeInUp .35s ease;
                         ">

                        <div class="roadmap-phase-title">
                            ${escapeHTML(
                                phase.phase || 'Phase'
                            )}
                            —
                            ${escapeHTML(
                                phase.objective || ''
                            )}
                        </div>

                        <div class="roadmap-phase-duration">
                            ⏱️
                            ${escapeHTML(
                                phase.duration || ''
                            )}

                            ${
                                Array.isArray(
                                    phase.skills
                                ) &&
                                phase.skills.length
                                    ? `
                                        |
                                        Target Skills:
                                        ${escapeHTML(
                                            phase.skills.join(', ')
                                        )}
                                    `
                                    : ''
                            }
                        </div>

                        <ul style="
                            color:var(--text-muted);
                            padding-left:20px;
                            line-height:1.6;
                        ">
                            ${
                                Array.isArray(
                                    phase.action_items
                                )
                                    ? phase.action_items
                                        .map(
                                            item =>
                                                `<li>${escapeHTML(item)}</li>`
                                        )
                                        .join('')
                                    : ''
                            }
                        </ul>

                    </div>
                `
                )
                .join('')

            : `
                <div class="alert alert-info">
                    No roadmap phases were returned.
                </div>
            `;


    resourcesContainer.innerHTML =
        resources.length

            ? resources
                .map(
                    resource => `

                    <details
                        style="
                            margin-bottom:12px;
                            animation:
                                fadeInUp .35s ease;
                        "
                    >

                        <summary>
                            📖
                            ${escapeHTML(
                                resource.skill ||
                                'Skill'
                            )}
                            Mastery Guide
                        </summary>

                        <div style="
                            padding-top:12px;
                            color:var(--text-muted);
                            line-height:1.6;
                        ">

                            ${
                                resource.platform
                                    ? `
                                        <p>
                                            <strong>
                                                Recommended Platform:
                                            </strong>
                                            ${escapeHTML(
                                                resource.platform
                                            )}
                                        </p>
                                    `
                                    : ''
                            }

                            ${
                                resource.time
                                    ? `
                                        <p>
                                            <strong>
                                                Estimated Commitment:
                                            </strong>
                                            ${escapeHTML(
                                                resource.time
                                            )}
                                        </p>
                                    `
                                    : ''
                            }

                            ${
                                resource.docs
                                    ? `
                                        <p>
                                            <strong>
                                                Documentation:
                                            </strong>

                                            <a
                                                href="${escapeHTML(resource.docs)}"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="extracted-link"
                                            >
                                                Open Documentation →
                                            </a>
                                        </p>
                                    `
                                    : ''
                            }

                            ${
                                resource.project
                                    ? `
                                        <p>
                                            <strong>
                                                Portfolio Project:
                                            </strong>
                                            ${escapeHTML(
                                                resource.project
                                            )}
                                        </p>
                                    `
                                    : ''
                            }

                        </div>

                    </details>
                `
                )
                .join('')

            : `
                <p style="
                    color:var(--text-muted);
                ">
                    No additional resources returned.
                </p>
            `;
}


/* ============================================================
   INTERVIEW PREPARATION
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
            <div class="alert alert-info">
                Select a dynamic job role first.
            </div>
        `;

        return;
    }


    const matched =
        normalizeArray(
            window.LATEST_METRICS?.matched_skills
        );


    const missing =
        normalizeArray(
            window.LATEST_METRICS?.missing_skills
        );


    const formData =
        new FormData();


    formData.append(
        'target_role',
        window.TARGET_ROLE
    );


    formData.append(
        'matched_skills',
        JSON.stringify(matched)
    );


    formData.append(
        'missing_skills',
        JSON.stringify(missing)
    );


    container.innerHTML = `
        <div style="
            color:var(--text-muted);
            padding:14px 0;
        ">
            Generating interview preparation for
            <strong>
                ${escapeHTML(window.TARGET_ROLE)}
            </strong>...
        </div>
    `;


    const json =
        await apiRequest(
            'get_interview',
            formData
        );


    if (
        !json ||
        json.status !== 'success' ||
        !json.prep_data
    ) {

        container.innerHTML = `
            <div class="alert alert-info">
                ${
                    escapeHTML(
                        json?.message ||
                        'Interview preparation will appear after selecting a job.'
                    )
                }
            </div>
        `;

        return;
    }


    const prep =
        json.prep_data;


    let html = '';


    if (
        Array.isArray(
            prep.technical_known
        ) &&
        prep.technical_known.length
    ) {

        html += `
            <h4 style="
                color:var(--cyan-light);
                margin-bottom:14px;
            ">
                🧠 Technical Questions
            </h4>
        `;


        html +=
            prep.technical_known
                .map(
                    (item, index) => `

                    <details
                        style="
                            margin-bottom:12px;
                        "
                    >

                        <summary>
                            Q${index + 1}
                            ${
                                item.skill
                                    ? `(${escapeHTML(item.skill)})`
                                    : ''
                            }:
                            ${escapeHTML(item.q || '')}
                        </summary>

                        <div style="
                            padding-top:12px;
                            color:var(--text-muted);
                            line-height:1.6;
                        ">

                            <p>
                                <strong>
                                    Ideal Answer:
                                </strong>
                                ${escapeHTML(
                                    item.a || ''
                                )}
                            </p>

                            ${
                                item.tip
                                    ? `
                                        <p style="
                                            color:var(--cyan-light);
                                            margin-top:6px;
                                        ">
                                            💡
                                            <strong>
                                                Mentor Tip:
                                            </strong>
                                            ${escapeHTML(item.tip)}
                                        </p>
                                    `
                                    : ''
                            }

                        </div>

                    </details>
                `
                )
                .join('');
    }


    if (
        Array.isArray(
            prep.gap_questions
        ) &&
        prep.gap_questions.length
    ) {

        html += `
            <h4 style="
                color:var(--rose);
                margin-top:24px;
                margin-bottom:14px;
            ">
                ⚠️ Skill-Gap Drill Questions
            </h4>
        `;


        html +=
            prep.gap_questions
                .map(
                    (item, index) => `

                    <details
                        style="
                            margin-bottom:12px;
                        "
                    >

                        <summary>
                            Gap Drill ${index + 1}
                            ${
                                item.skill
                                    ? `(${escapeHTML(item.skill)})`
                                    : ''
                            }:
                            ${escapeHTML(item.q || '')}
                        </summary>

                        <div style="
                            padding-top:12px;
                            color:var(--text-muted);
                            line-height:1.6;
                        ">

                            <p>
                                <strong>
                                    Ideal Answer:
                                </strong>
                                ${escapeHTML(
                                    item.a || ''
                                )}
                            </p>

                            ${
                                item.tip
                                    ? `
                                        <p style="
                                            color:var(--amber);
                                            margin-top:6px;
                                        ">
                                            💡
                                            <strong>
                                                Preparation Tip:
                                            </strong>
                                            ${escapeHTML(item.tip)}
                                        </p>
                                    `
                                    : ''
                            }

                        </div>

                    </details>
                `
                )
                .join('');
    }


    if (
        Array.isArray(
            prep.behavioral
        ) &&
        prep.behavioral.length
    ) {

        html += `
            <h4 style="
                color:var(--emerald);
                margin-top:24px;
                margin-bottom:14px;
            ">
                👔 HR & Behavioral Questions
            </h4>
        `;


        html +=
            prep.behavioral
                .map(
                    (item, index) => `

                    <details
                        style="
                            margin-bottom:12px;
                        "
                    >

                        <summary>
                            HR Q${index + 1}:
                            ${escapeHTML(item.q || '')}
                        </summary>

                        <div style="
                            padding-top:12px;
                            color:var(--text-muted);
                            line-height:1.6;
                        ">

                            ${
                                item.framework
                                    ? `
                                        <p>
                                            <strong>
                                                Framework:
                                            </strong>
                                            <code>
                                                ${escapeHTML(item.framework)}
                                            </code>
                                        </p>
                                    `
                                    : ''
                            }

                            ${
                                item.guide
                                    ? `
                                        <p style="
                                            margin-top:6px;
                                        ">
                                            <strong>
                                                Guide:
                                            </strong>
                                            ${escapeHTML(item.guide)}
                                        </p>
                                    `
                                    : ''
                            }

                        </div>

                    </details>
                `
                )
                .join('');
    }


    if (!html) {

        html = `
            <div class="alert alert-info">
                No interview questions were returned.
            </div>
        `;
    }


    container.innerHTML =
        html;
}


/* ============================================================
   CHARTS
   ============================================================ */

function initCharts() {

    if (
        typeof Chart ===
        'undefined'
    ) {

        console.warn(
            'Chart.js is not available.'
        );

        return;
    }


    const radarCanvas =
        document.getElementById(
            'radarChartCtx'
        );


    const pieCanvas =
        document.getElementById(
            'pieChartCtx'
        );


    if (radarCanvas) {

        radarChart =
            new Chart(
                radarCanvas,
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

                        datasets: [
                            {
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
                                    'rgba(99,102,241,.20)',

                                borderColor:
                                    '#6366f1',

                                pointBackgroundColor:
                                    '#38bdf8'
                            }
                        ]
                    },

                    options: {

                        responsive:
                            true,

                        maintainAspectRatio:
                            false,

                        scales: {

                            r: {

                                min:
                                    0,

                                max:
                                    100,

                                angleLines: {
                                    color:
                                        'rgba(255,255,255,.1)'
                                },

                                grid: {
                                    color:
                                        'rgba(255,255,255,.1)'
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
                                        false
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
    }


    if (pieCanvas) {

        pieChart =
            new Chart(
                pieCanvas,
                {
                    type: 'doughnut',

                    data: {

                        labels: [
                            'Matched',
                            'Missing'
                        ],

                        datasets: [
                            {
                                data: [
                                    0,
                                    1
                                ],

                                backgroundColor: [
                                    '#10b981',
                                    '#f43f5e'
                                ]
                            }
                        ]
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


    updateChartTheme();
}


function updateCharts(
    data
) {

    if (!data) {
        return;
    }


    const matched =
        normalizeArray(
            data.matched_skills
        );


    const missing =
        normalizeArray(
            data.missing_skills
        );


    const ats =
        typeof window.ATS_SCORE ===
            'number'
            ? window.ATS_SCORE
            : 0;


    const readiness =
        typeof data.readiness_pct ===
            'number'
            ? data.readiness_pct
            : 0;


    const skillCount =
        window.EXTRACTED_SKILLS.length;


    if (radarChart) {

        radarChart.data.datasets[0].data = [

            Math.min(
                100,
                skillCount * 8
            ),

            ats,

            Math.min(
                100,
                skillCount * 7
            ),

            Math.min(
                100,
                skillCount * 8
            ),

            readiness

        ];


        radarChart.update();
    }


    if (pieChart) {

        const total =
            matched.length +
            missing.length;


        pieChart.data.labels = [
            'Matched',
            'Missing'
        ];


        pieChart.data.datasets[0].data =
            total
                ? [
                    matched.length,
                    missing.length
                ]
                : [0, 1];


        pieChart.update();
    }
}


/* ============================================================
   SKILL EDITOR
   ============================================================ */

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


            const skills =
                Array.from(
                    checked
                ).map(
                    checkbox =>
                        checkbox.value
                );


            const formData =
                new FormData();


            formData.append(
                'skills',
                JSON.stringify(
                    skills
                )
            );


            setLoading(
                updateBtn,
                true,
                'Updating...'
            );


            const json =
                await apiRequest(
                    'update_skills',
                    formData
                );


            setLoading(
                updateBtn,
                false
            );


            if (
                json &&
                json.status === 'success'
            ) {

                window.EXTRACTED_SKILLS =
                    uniqueSkills(
                        json.skills
                    );


                await fetchMetrics();


                showToast(
                    'Active skills updated successfully.',
                    'success'
                );

            } else {

                showToast(
                    json?.message ||
                    'Unable to update skills.',
                    'error'
                );
            }
        }
    );
}


/* ============================================================
   RESUME UPLOAD
   ============================================================ */

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
            async event => {

                event.preventDefault();


                const fileInput =
                    document.getElementById(
                        'input-resume-file'
                    );


                const statusBox =
                    document.getElementById(
                        'resume-upload-status'
                    );


                if (
                    !fileInput ||
                    !fileInput.files ||
                    !fileInput.files[0]
                ) {

                    setMessage(
                        statusBox,
                        'Please select a PDF, DOCX or TXT resume.',
                        'error'
                    );

                    return;
                }


                const file =
                    fileInput.files[0];


                const allowed =
                    [
                        'application/pdf',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'text/plain'
                    ];


                const extension =
                    file.name
                        .split('.')
                        .pop()
                        .toLowerCase();


                if (
                    !allowed.includes(
                        file.type
                    ) &&
                    !['pdf', 'docx', 'txt'].includes(
                        extension
                    )
                ) {

                    setMessage(
                        statusBox,
                        'Unsupported file type. Please upload PDF, DOCX or TXT.',
                        'error'
                    );

                    return;
                }


                setMessage(
                    statusBox,
                    'Extracting resume information and evaluating ATS...',
                    'info'
                );


                const formData =
                    new FormData();


                formData.append(
                    'resume_file',
                    file
                );


                /*
                 * These values are dynamic.
                 *
                 * If no job has been selected yet,
                 * empty values are sent.
                 */

                formData.append(
                    'target_company',
                    window.TARGET_COMPANY
                );


                formData.append(
                    'target_role',
                    window.TARGET_ROLE
                );


                formData.append(
                    'required_skills',
                    JSON.stringify(
                        window.REQUIRED_SKILLS
                    )
                );


                const json =
                    await apiRequest(
                        'upload_resume',
                        formData
                    );


                if (
                    json &&
                    json.status === 'success'
                ) {

                    /*
                     * Update frontend state from parser result.
                     */

                    const data =
                        json.data ||
                        {};


                    if (
                        Array.isArray(
                            data.extracted_skills
                        )
                    ) {

                        window.EXTRACTED_SKILLS =
                            uniqueSkills(
                                data.extracted_skills
                            );
                    }


                    if (
                        typeof data.ats_score ===
                        'number'
                    ) {

                        window.ATS_SCORE =
                            data.ats_score;
                    }


                    setMessage(
                        statusBox,
                        'Resume parsed successfully.',
                        'success'
                    );


                    /*
                     * If jobs have already been scraped,
                     * recalculate the strongest match.
                     */

                    if (
                        window.CAREER_JOBS.length
                    ) {

                        const recommendation =
                            calculateBestJobMatch(
                                window.CAREER_JOBS,
                                window.EXTRACTED_SKILLS
                            );


                        if (recommendation) {

                            await applyDynamicRecommendation(
                                recommendation
                            );
                        }
                    }


                    /*
                     * Reload after a short delay so the
                     * PHP-rendered extracted resume signals
                     * update as well.
                     */

                    setTimeout(
                        () => {
                            window.location.reload();
                        },
                        700
                    );


                } else {

                    setMessage(
                        statusBox,
                        json?.message ||
                        'Resume processing failed.',
                        'error'
                    );
                }

            }
        );
    }


    if (sampleBtn) {

        sampleBtn.addEventListener(
            'click',
            async () => {

                /*
                 * Sample profile is retained only for
                 * compatibility with the existing UI.
                 *
                 * It does NOT create a company or role.
                 */

                const statusBox =
                    document.getElementById(
                        'resume-upload-status'
                    );


                setMessage(
                    statusBox,
                    'Loading sample resume...',
                    'info'
                );


                const json =
                    await apiRequest(
                        'load_sample',
                        null,
                        'GET'
                    );


                if (
                    json &&
                    json.status === 'success'
                ) {

                    window.location.reload();

                } else {

                    setMessage(
                        statusBox,
                        json?.message ||
                        'Unable to load sample profile.',
                        'error'
                    );
                }
            }
        );
    }
}


/* ============================================================
   JOB RANKING
   ============================================================ */

function initJobRanking() {

    const domainFilter =
        document.getElementById(
            'select-job-domain-filter'
        );


    const searchInput =
        document.getElementById(
            'input-job-search'
        );


    if (domainFilter) {

        domainFilter.addEventListener(
            'change',
            loadDynamicJobsIntoRanking
        );
    }


    if (searchInput) {

        searchInput.addEventListener(
            'input',
            debounce(
                loadDynamicJobsIntoRanking,
                250
            )
        );
    }


    /*
     * If jobs were already supplied by the current
     * PHP session, show them.
     */

    if (
        window.CAREER_JOBS.length
    ) {

        renderJobTable(
            window.CAREER_JOBS,
            searchInput?.value || ''
        );
    }
}


async function loadDynamicJobsIntoRanking() {

    const domainFilter =
        document.getElementById(
            'select-job-domain-filter'
        );


    const searchInput =
        document.getElementById(
            'input-job-search'
        );


    /*
     * First try the backend ranking API.
     */

    const formData =
        new FormData();


    formData.append(
        'domain_filter',
        domainFilter
            ? domainFilter.value
            : 'All Domains'
    );


    const json =
        await apiRequest(
            'rank_jobs',
            formData
        );


    if (
        json &&
        json.status === 'success' &&
        Array.isArray(json.jobs)
    ) {

        renderJobTable(
            json.jobs,
            searchInput?.value || ''
        );

        return;
    }


    /*
     * Fallback:
     *
     * rank the jobs already extracted from the career URL
     * entirely in the browser.
     */

    if (
        window.CAREER_JOBS.length
    ) {

        const ranked =
            window.CAREER_JOBS
                .map(
                    job =>
                        calculateJobScore(
                            job,
                            window.EXTRACTED_SKILLS
                        )
                );


        renderJobTable(
            ranked,
            searchInput?.value || ''
        );

        return;
    }


    renderJobTable(
        [],
        ''
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
        String(
            query || ''
        )
        .toLowerCase()
        .trim();


    const filtered =
        (Array.isArray(jobs)
            ? jobs
            : []
        )
        .filter(
            job => {

                if (!search) {
                    return true;
                }


                const company =
                    String(
                        job.company || ''
                    )
                    .toLowerCase();


                const role =
                    String(
                        job.role || ''
                    )
                    .toLowerCase();


                return (
                    company.includes(search) ||
                    role.includes(search)
                );
            }
        );


    if (!filtered.length) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    style="
                        text-align:center;
                        color:var(--text-muted);
                        padding:25px;
                    "
                >
                    ${
                        window.CAREER_JOBS.length
                            ? 'No jobs match your search.'
                            : 'Enter a career URL to discover jobs.'
                    }
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        filtered
            .map(
                job => {

                    const match =
                        Number(
                            job.match_pct ??
                            job.match_percent ??
                            0
                        );


                    const matched =
                        Number(
                            job.matched_count ??
                            normalizeArray(
                                job.matched_skills
                            ).length
                        );


                    const total =
                        Number(
                            job.total_count ??
                            normalizeArray(
                                job.required_skills
                            ).length
                        );


                    const missing =
                        normalizeArray(
                            job.missing_skills
                        );


                    let fit =
                        'Low Match';

                    let fitClass =
                        'var(--rose)';


                    if (match >= 75) {

                        fit =
                            'High Match';

                        fitClass =
                            'var(--emerald)';

                    } else if (
                        match >= 50
                    ) {

                        fit =
                            'Moderate Match';

                        fitClass =
                            'var(--amber)';
                    }


                    return `
                        <tr>

                            <td>
                                <strong>
                                    ${escapeHTML(
                                        job.company ||
                                        'Not specified'
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${escapeHTML(
                                    job.role ||
                                    'Not specified'
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    job.domain ||
                                    '—'
                                )}
                            </td>

                            <td>
                                <strong style="
                                    color:var(--cyan-light);
                                ">
                                    ${match}%
                                </strong>
                            </td>

                            <td>
                                ${matched}
                                /
                                ${total}
                            </td>

                            <td>
                                <span style="
                                    color:${fitClass};
                                    font-weight:700;
                                ">
                                    ${fit}
                                </span>
                            </td>

                            <td>
                                ${
                                    missing.length
                                        ? escapeHTML(
                                            missing
                                                .slice(0, 3)
                                                .join(', ')
                                        )
                                        : 'None'
                                }
                            </td>

                        </tr>
                    `;
                }
            )
            .join('');
}


/* ============================================================
   WEB SCRAPER BUTTON
   ============================================================ */

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


            const url =
                input
                    ? input.value.trim()
                    : '';


            if (!url) {

                showToast(
                    'Please enter a career URL.',
                    'error'
                );

                return;
            }


            await scrapeCareerURL(
                url
            );
        }
    );
}


/* ============================================================
   PROFILE FORM
   ============================================================ */

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
        async event => {

            event.preventDefault();


            const message =
                document.getElementById(
                    'profile-message'
                );


            const formData =
                new FormData(
                    profileForm
                );


            const json =
                await apiRequest(
                    'update_profile',
                    formData
                );


            if (
                json &&
                json.status === 'success'
            ) {

                setMessage(
                    message,
                    json.message ||
                    'Profile updated successfully.',
                    'success'
                );


                setTimeout(
                    () => {
                        window.location.reload();
                    },
                    600
                );

            } else {

                setMessage(
                    message,
                    json?.message ||
                    'Unable to update profile.',
                    'error'
                );
            }
        }
    );
}


/* ============================================================
   AI INTERVIEW ASSISTANT
   ============================================================ */

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


                loadDynamicInterview();
            }
        );
    }


    /* --------------------------------------------------------
       AI ASSISTANT
       -------------------------------------------------------- */

    const promptInput =
        document.getElementById(
            'input-ai-prompt'
        );


    const promptSubmit =
        document.getElementById(
            'btn-submit-ai-prompt'
        );


    const presetButtons =
        document.querySelectorAll(
            '.ai-preset-btn'
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


    const executePrompt =
        async query => {

            if (!query) {
                return;
            }


            if (
                !window.TARGET_ROLE
            ) {

                if (responseCard) {
                    responseCard.style.display =
                        'block';
                }

                if (responseTitle) {
                    responseTitle.textContent =
                        'Select a dynamic job first';
                }

                if (responseBody) {
                    responseBody.innerHTML = `
                        <p style="
                            color:var(--text-muted);
                        ">
                            Enter a career URL and select a
                            dynamically discovered role before
                            using role-specific interview assistance.
                        </p>
                    `;
                }

                return;
            }


            if (responseCard) {
                responseCard.style.display =
                    'block';
            }


            if (responseTitle) {

                responseTitle.textContent =
                    '⏳ Generating tailored guidance...';
            }


            if (responseBody) {

                responseBody.innerHTML = `
                    <p style="
                        color:var(--text-muted);
                    ">
                        Analyzing
                        ${escapeHTML(window.TARGET_ROLE)}
                        ${
                            window.TARGET_COMPANY
                                ? `at ${escapeHTML(window.TARGET_COMPANY)}`
                                : ''
                        }...
                    </p>
                `;
            }


            const formData =
                new FormData();


            formData.append(
                'prompt',
                query
            );


            formData.append(
                'target_role',
                window.TARGET_ROLE
            );


            formData.append(
                'target_company',
                window.TARGET_COMPANY
            );


            const json =
                await apiRequest(
                    'ask_interview_ai',
                    formData
                );


            if (
                json &&
                json.status === 'success'
            ) {

                if (responseTitle) {

                    responseTitle.textContent =
                        json.title ||
                        'Interview Guidance';
                }


                if (responseBody) {

                    let html = `
                        <div style="
                            line-height:1.7;
                        ">
                    `;


                    if (
                        Array.isArray(
                            json.advice_steps
                        ) &&
                        json.advice_steps.length
                    ) {

                        html += `
                            <h5 style="
                                color:var(--cyan-light);
                                margin-bottom:8px;
                            ">
                                📌 Strategic Guidance
                            </h5>

                            <ul style="
                                padding-left:20px;
                                margin-bottom:16px;
                            ">
                                ${
                                    json.advice_steps
                                        .map(
                                            step =>
                                                `<li>${escapeHTML(step)}</li>`
                                        )
                                        .join('')
                                }
                            </ul>
                        `;
                    }


                    if (
                        json.sample_question ||
                        json.sample_answer
                    ) {

                        html += `
                            <div style="
                                background:
                                    rgba(15,23,42,.65);
                                padding:14px;
                                border-radius:10px;
                                border-left:
                                    4px solid var(--emerald);
                            ">

                                ${
                                    json.sample_question
                                        ? `
                                            <p style="
                                                color:var(--emerald);
                                                font-weight:700;
                                            ">
                                                ❓ Practice Question
                                            </p>

                                            <p>
                                                ${escapeHTML(
                                                    json.sample_question
                                                )}
                                            </p>
                                        `
                                        : ''
                                }

                                ${
                                    json.sample_answer
                                        ? `
                                            <p style="
                                                color:var(--cyan-light);
                                                font-weight:700;
                                                margin-top:10px;
                                            ">
                                                💡 Answer Strategy
                                            </p>

                                            <p>
                                                ${escapeHTML(
                                                    json.sample_answer
                                                )}
                                            </p>
                                        `
                                        : ''
                                }

                            </div>
                        `;
                    }


                    html += `
                        </div>
                    `;


                    responseBody.innerHTML =
                        html;
                }

            } else {

                if (responseTitle) {
                    responseTitle.textContent =
                        'Unable to generate guidance';
                }


                if (responseBody) {
                    responseBody.innerHTML = `
                        <p style="
                            color:var(--rose);
                        ">
                            ${escapeHTML(
                                json?.message ||
                                'The interview assistant could not complete the request.'
                            )}
                        </p>
                    `;
                }
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
            event => {

                if (
                    event.key ===
                    'Enter'
                ) {

                    event.preventDefault();

                    executePrompt(
                        promptInput.value.trim()
                    );
                }
            }
        );
    }


    presetButtons.forEach(
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
                            query || '';
                    }


                    executePrompt(
                        query || ''
                    );
                }
            );
        }
    );


    /* --------------------------------------------------------
       ANSWER QUESTION SELECT
       -------------------------------------------------------- */

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
                    questionSelect.value ===
                    'custom'
                        ? 'block'
                        : 'none';
            }
        );
    }


    /* --------------------------------------------------------
       ANSWER EVALUATOR
       -------------------------------------------------------- */

    const evaluatorButton =
        document.getElementById(
            'btn-submit-eval-answer'
        );


    if (evaluatorButton) {

        evaluatorButton.addEventListener(
            'click',
            async () => {

                let question =
                    questionSelect
                        ? questionSelect.value
                        : '';


                if (
                    question ===
                    'custom'
                ) {

                    question =
                        customQuestion
                            ? customQuestion.value.trim()
                            : '';
                }


                const answerInput =
                    document.getElementById(
                        'input-eval-user-answer'
                    );


                const answer =
                    answerInput
                        ? answerInput.value.trim()
                        : '';


                if (!question) {

                    showToast(
                        'Please select or enter an interview question.',
                        'error'
                    );

                    return;
                }


                if (!answer) {

                    showToast(
                        'Please type your answer first.',
                        'error'
                    );

                    return;
                }


                if (
                    !window.TARGET_ROLE
                ) {

                    showToast(
                        'Select a dynamic job role first.',
                        'error'
                    );

                    return;
                }


                const resultCard =
                    document.getElementById(
                        'ai-evaluator-result-card'
                    );


                if (resultCard) {
                    resultCard.style.display =
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
                    'question',
                    question
                );


                formData.append(
                    'user_answer',
                    answer
                );


                formData.append(
                    'target_role',
                    window.TARGET_ROLE
                );


                const json =
                    await apiRequest(
                        'evaluate_answer',
                        formData
                    );


                if (
                    json &&
                    json.status === 'success'
                ) {

                    const ratingBadge =
                        document.getElementById(
                            'eval-rating-badge'
                        );


                    if (ratingBadge) {

                        ratingBadge.textContent =
                            json.rating ||
                            'Evaluated';

                        if (
                            json.color
                        ) {

                            ratingBadge.style.background =
                                json.color;
                        }
                    }


                    if (scoreDisplay) {

                        scoreDisplay.textContent =
                            `Overall Score: ${
                                json.total_score ??
                                0
                            } / 100`;
                    }


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


                    setList(
                        'eval-strengths-list',
                        json.strengths || []
                    );


                    setList(
                        'eval-missing-list',
                        json.missing_points || []
                    );


                    setText(
                        'eval-ideal-answer',
                        json.ideal_answer ||
                        ''
                    );

                } else {

                    if (scoreDisplay) {

                        scoreDisplay.textContent =
                            'Evaluation Failed';
                    }


                    showToast(
                        json?.message ||
                        'Unable to evaluate answer.',
                        'error'
                    );
                }
            }
        );
    }
}


/* ============================================================
   UTILITY DOM HELPERS
   ============================================================ */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;
    }
}


function setList(
    id,
    values
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    const list =
        Array.isArray(values)
            ? values
            : [];


    element.innerHTML =
        list.length

            ? list
                .map(
                    item =>
                        `<li>${escapeHTML(item)}</li>`
                )
                .join('')

            : '<li>No items returned.</li>';
}


/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */

function showToast(
    message,
    type = 'info'
) {

    let container =
        document.getElementById(
            'sgp-toast-container'
        );


    if (!container) {

        container =
            document.createElement(
                'div'
            );


        container.id =
            'sgp-toast-container';


        Object.assign(
            container.style,
            {
                position: 'fixed',
                right: '22px',
                bottom: '22px',
                zIndex: '10000',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxWidth: '360px'
            }
        );


        document.body.appendChild(
            container
        );
    }


    const toast =
        document.createElement(
            'div'
        );


    const color =
        type === 'success'
            ? '#10b981'
            : type === 'error'
                ? '#f43f5e'
                : type === 'warning'
                    ? '#f59e0b'
                    : '#38bdf8';


    toast.innerHTML = `
        <div style="
            font-weight:700;
            margin-bottom:3px;
        ">
            ${
                type === 'success'
                    ? '✓'
                    : type === 'error'
                        ? '!'
                        : '•'
            }
        </div>

        <div>
            ${escapeHTML(message)}
        </div>
    `;


    Object.assign(
        toast.style,
        {
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            padding: '13px 16px',
            borderRadius: '12px',
            background:
                'rgba(15,23,42,.94)',
            color: '#f8fafc',
            border:
                `1px solid ${color}`,
            boxShadow:
                '0 15px 35px rgba(0,0,0,.25)',
            backdropFilter:
                'blur(12px)',
            transform:
                'translateY(20px)',
            opacity: '0',
            transition:
                'all .3s ease'
        }
    );


    container.appendChild(
        toast
    );


    requestAnimationFrame(
        () => {

            toast.style.transform =
                'translateY(0)';

            toast.style.opacity =
                '1';
        }
    );


    setTimeout(
        () => {

            toast.style.opacity =
                '0';

            toast.style.transform =
                'translateY(20px)';


            setTimeout(
                () => {
                    toast.remove();
                },
                300
            );

        },
        3500
    );
}


/* ============================================================
   DEBOUNCE
   ============================================================ */

function debounce(
    callback,
    delay
) {

    let timer = null;


    return function (...args) {

        clearTimeout(
            timer
        );


        timer =
            setTimeout(
                () => {
                    callback.apply(
                        this,
                        args
                    );
                },
                delay
            );
    };
}


/* ============================================================
   GLOBAL KEYBOARD SUPPORT
   ============================================================ */

document.addEventListener(
    'keydown',
    event => {

        /*
         * Escape closes mobile sidebar.
         */

        if (
            event.key ===
            'Escape'
        ) {

            closeMobileSidebar();
        }
    }
);


/* ============================================================
   WINDOW RESIZE
   ============================================================ */

window.addEventListener(
    'resize',
    debounce(
        () => {

            if (
                window.innerWidth >
                900
            ) {

                closeMobileSidebar();
            }


            if (radarChart) {
                radarChart.resize();
            }


            if (pieChart) {
                pieChart.resize();
            }

        },
        150
    )
);


/* ============================================================
   DYNAMIC JOB URL ENTER KEY
   ============================================================ */

document.addEventListener(
    'keydown',
    event => {

        const active =
            document.activeElement;


        if (
            active &&
            active.id ===
                'dynamic-career-url' &&
            event.key ===
                'Enter'
        ) {

            event.preventDefault();


            document
                .getElementById(
                    'dynamic-career-url-btn'
                )
                ?.click();
        }
    }
);


/* ============================================================
   ANIMATION SUPPORT
   ============================================================ */

(function injectAnimationStyles() {

    if (
        document.getElementById(
            'sgp-runtime-animation-styles'
        )
    ) {
        return;
    }


    const style =
        document.createElement(
            'style'
        );


    style.id =
        'sgp-runtime-animation-styles';


    style.textContent = `

        @keyframes fadeInUp {

            from {
                opacity: 0;
                transform:
                    translateY(12px);
            }

            to {
                opacity: 1;
                transform:
                    translateY(0);
            }
        }


        @keyframes pulseGlow {

            0% {
                box-shadow:
                    0 0 0
                    rgba(99,102,241,0);
            }

            50% {
                box-shadow:
                    0 0 28px
                    rgba(99,102,241,.22);
            }

            100% {
                box-shadow:
                    0 0 0
                    rgba(99,102,241,0);
            }
        }


        @keyframes spin {

            to {
                transform:
                    rotate(360deg);
            }
        }


        .loading-spinner {

            display:inline-block;

            width:14px;
            height:14px;

            border:
                2px solid
                rgba(255,255,255,.35);

            border-top-color:
                currentColor;

            border-radius:50%;

            animation:
                spin .7s linear infinite;

            vertical-align:
                -2px;
        }


        .view-panel {

            animation:
                fadeInUp .35s ease;
        }


        .theme-transition,
        .theme-transition * {

            transition:
                background-color .35s ease,
                color .35s ease,
                border-color .35s ease,
                box-shadow .35s ease !important;
        }


        .skill-tag-matched,
        .skill-tag-missing {

            display:inline-block;

            margin:
                3px 4px 3px 0;

            padding:
                5px 9px;

            border-radius:
                999px;

            font-size:
                11px;

            font-weight:
                700;
        }


        .skill-tag-matched {

            color:#10b981;

            background:
                rgba(16,185,129,.10);

            border:
                1px solid
                rgba(16,185,129,.25);
        }


        .skill-tag-missing {

            color:#fb7185;

            background:
                rgba(244,63,94,.10);

            border:
                1px solid
                rgba(244,63,94,.25);
        }


        @media (max-width: 900px) {

            .sidebar.mobile-open {

                transform:
                    translateX(0) !important;

                box-shadow:
                    15px 0 40px
                    rgba(0,0,0,.28);
            }

        }

    `;


    document.head.appendChild(
        style
    );

})();


/* ============================================================
   INITIAL STATE SYNCHRONIZATION
   ============================================================ */

(function synchronizeInitialState() {

    /*
     * Read dynamic job data from APP_DATA if supplied
     * by index.php.
     */

    if (
        window.APP_DATA &&
        Array.isArray(
            window.APP_DATA.extractedSkills
        )
    ) {

        window.EXTRACTED_SKILLS =
            uniqueSkills(
                window.APP_DATA.extractedSkills
            );
    }


    if (
        window.APP_DATA &&
        Array.isArray(
            window.APP_DATA.requiredSkills
        )
    ) {

        window.REQUIRED_SKILLS =
            uniqueSkills(
                window.APP_DATA.requiredSkills
            );
    }


    if (
        window.APP_DATA &&
        window.APP_DATA.targetCompany
    ) {

        window.TARGET_COMPANY =
            window.APP_DATA.targetCompany;
    }


    if (
        window.APP_DATA &&
        window.APP_DATA.targetRole
    ) {

        window.TARGET_ROLE =
            window.APP_DATA.targetRole;
    }


    if (
        window.APP_DATA &&
        window.APP_DATA.careerUrl
    ) {

        window.CAREER_URL =
            window.APP_DATA.careerUrl;
    }


    if (
        window.APP_DATA &&
        window.APP_DATA.recommendedJob
    ) {

        window.RECOMMENDED_JOB =
            window.APP_DATA.recommendedJob;
    }

})();
