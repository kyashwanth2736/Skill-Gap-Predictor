/**
 * ============================================================
 * SKILL-GAP PREDICTOR
 * Frontend Application
 * ============================================================
 *
 * Dynamic Career URL + Resume + ATS + Job Matching
 *
 * IMPORTANT:
 * - No predefined company
 * - No predefined job role
 * - No benchmark company/role initialization
 * - Safe initialization on login and dashboard pages
 * - API errors are displayed instead of infinite loading
 * ============================================================
 */

'use strict';


/* ============================================================
   GLOBAL APPLICATION STATE
   ============================================================ */

window.APP_STATE = window.APP_STATE || {

    targetCompany: '',

    targetRole: '',

    requiredSkills: [],

    extractedSkills: [],

    atsScore: 0,

    careerUrl: '',

    careerJobs: [],

    recommendedJob: null,

    latestMetrics: null,

    currentView: 'view-dashboard'
};


/* ============================================================
   INITIAL DATA FROM PHP
   ============================================================ */

(function loadServerState() {

    const data = window.APP_DATA || {};

    window.APP_STATE.targetCompany =
        data.targetCompany || '';

    window.APP_STATE.targetRole =
        data.targetRole || '';

    window.APP_STATE.requiredSkills =
        Array.isArray(data.requiredSkills)
            ? data.requiredSkills
            : [];

    window.APP_STATE.extractedSkills =
        Array.isArray(data.extractedSkills)
            ? data.extractedSkills
            : [];

    window.APP_STATE.atsScore =
        Number(data.atsScore || 0);

    window.APP_STATE.careerUrl =
        data.careerUrl || '';

    window.APP_STATE.recommendedJob =
        data.recommendedJob || null;

    /*
     * Optional career jobs if index.php provides them.
     */
    if (Array.isArray(data.careerJobs)) {

        window.APP_STATE.careerJobs =
            data.careerJobs;
    }

})();


/* ============================================================
   DOM HELPERS
   ============================================================ */

function $(id) {

    return document.getElementById(id);
}


function exists(id) {

    return !!$(id);
}


function query(selector, parent) {

    return (parent || document).querySelector(selector);
}


function queryAll(selector, parent) {

    return Array.from(
        (parent || document).querySelectorAll(selector)
    );
}


/* ============================================================
   HTML ESCAPE
   ============================================================ */

function escapeHtml(value) {

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


/* ============================================================
   SKILL NORMALIZATION
   ============================================================ */

function normalizeSkill(value) {

    return String(value || '')
        .toLowerCase()
        .replace(/[._/\\-]+/g, ' ')
        .replace(/[^\w+# ]+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}


function normalizeSkills(skills) {

    if (!Array.isArray(skills)) {

        return [];
    }

    const output = [];

    skills.forEach(function (skill) {

        const clean =
            String(skill || '').trim();

        if (!clean) {
            return;
        }

        const normalized =
            normalizeSkill(clean);

        if (!normalized) {
            return;
        }

        const existsAlready =
            output.some(function (item) {

                return normalizeSkill(item) === normalized;
            });

        if (!existsAlready) {

            output.push(clean);
        }

    });

    return output;
}


/* ============================================================
   SAFE API REQUEST
   ============================================================ */

async function apiRequest(
    action,
    data = {},
    timeout = 60000
) {

    const controller =
        new AbortController();

    const timeoutId =
        setTimeout(
            function () {
                controller.abort();
            },
            timeout
        );

    try {

        const formData =
            new FormData();

        formData.append(
            'action',
            action
        );

        Object.keys(data).forEach(
            function (key) {

                let value =
                    data[key];

                if (
                    typeof value === 'object' &&
                    value !== null
                ) {

                    value =
                        JSON.stringify(value);
                }

                formData.append(
                    key,
                    value === null ||
                    value === undefined
                        ? ''
                        : value
                );
            }
        );

        const response =
            await fetch(
                'api.php',
                {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin',
                    signal: controller.signal,
                    cache: 'no-store'
                }
            );

        const rawText =
            await response.text();

        let result;

        try {

            result =
                JSON.parse(rawText);

        } catch (error) {

            console.error(
                'API returned non-JSON response:',
                rawText
            );

            throw new Error(
                'Server returned an invalid response. HTTP ' +
                response.status
            );
        }

        if (!response.ok) {

            throw new Error(
                result.message ||
                result.error ||
                'Server error: HTTP ' +
                response.status
            );
        }

        return result;

    } catch (error) {

        if (
            error &&
            error.name === 'AbortError'
        ) {

            throw new Error(
                'The request took too long. Please try again.'
            );
        }

        throw error;

    } finally {

        clearTimeout(timeoutId);
    }
}


/* ============================================================
   DOM READY
   ============================================================ */

document.addEventListener(
    'DOMContentLoaded',
    function () {

        console.log(
            '[Skill Gap Predictor] Starting...'
        );

        try {

            /*
             * Authentication
             */
            initAuthTabs();

            initPasswordToggles();


            /*
             * Main application
             */
            initNavigation();

            initMobileUI();

            initThemeToggle();

            initCharts();

            initSkillEditor();

            initResumeUpload();

            initJobRanking();

            initWebScraper();

            initProfileForm();

            initAIInterviewAssistant();


            /*
             * Dynamic career system
             */
            initializeDynamicCareerState();


            /*
             * Remove old benchmark controls
             */
            hideLegacyBenchmarkUI();


            /*
             * Loading screen
             */
            hideLoadingScreen();


            console.log(
                '[Skill Gap Predictor] Ready.'
            );

        } catch (error) {

            console.error(
                '[Skill Gap Predictor] Initialization failed:',
                error
            );

            hideLoadingScreen();

            showApplicationError(error);
        }
    }
);


/* ============================================================
   LOADING SCREEN
   ============================================================ */

function hideLoadingScreen() {

    const selectors = [

        '#app-loader',

        '#loading-screen',

        '#page-loader',

        '.loading-screen',

        '.page-loader',

        '.app-loading',

        '.preloader'
    ];

    selectors.forEach(
        function (selector) {

            queryAll(selector)
                .forEach(
                    function (element) {

                        element.style.display =
                            'none';

                        element.classList.remove(
                            'active',
                            'show',
                            'visible'
                        );

                        element.setAttribute(
                            'aria-hidden',
                            'true'
                        );
                    }
                );
        }
    );

    document.body.classList.remove(
        'loading',
        'is-loading'
    );
}


/* ============================================================
   APPLICATION ERROR
   ============================================================ */

function showApplicationError(error) {

    const message =
        error &&
        error.message
            ? error.message
            : 'Unknown application error.';

    console.error(
        '[Application Error]',
        message
    );

    const main =
        query(
            '.main-content'
        ) ||
        query(
            '.app-container'
        ) ||
        document.body;

    if (!main) {
        return;
    }

    let box =
        $('javascript-error-box');

    if (!box) {

        box =
            document.createElement(
                'div'
            );

        box.id =
            'javascript-error-box';

        box.style.cssText = `
            margin:20px;
            padding:16px;
            border-radius:10px;
            background:rgba(239,68,68,.12);
            border:1px solid rgba(239,68,68,.35);
            color:#fecaca;
            font-family:Arial,sans-serif;
            position:relative;
            z-index:99999;
        `;

        main.prepend(box);
    }

    box.innerHTML = `
        <strong>
            Application Error
        </strong>

        <br><br>

        <span>
            ${escapeHtml(message)}
        </span>

        <br><br>

        <button
            type="button"
            onclick="window.location.reload()"
            style="
                padding:8px 14px;
                border:0;
                border-radius:6px;
                cursor:pointer;
            "
        >
            Reload
        </button>
    `;
}


/* ============================================================
   AUTH TABS
   ============================================================ */

function initAuthTabs() {

    const loginTab =
        $('tab-btn-login');

    const signupTab =
        $('tab-btn-signup');

    const loginBox =
        $('form-login-box');

    const signupBox =
        $('form-signup-box');


    if (
        loginTab &&
        signupTab &&
        loginBox &&
        signupBox
    ) {

        loginTab.addEventListener(
            'click',
            function () {

                loginTab.classList.add(
                    'active'
                );

                signupTab.classList.remove(
                    'active'
                );

                loginBox.style.display =
                    'block';

                signupBox.style.display =
                    'none';
            }
        );


        signupTab.addEventListener(
            'click',
            function () {

                signupTab.classList.add(
                    'active'
                );

                loginTab.classList.remove(
                    'active'
                );

                signupBox.style.display =
                    'block';

                loginBox.style.display =
                    'none';
            }
        );
    }


    /* ========================================================
       LOGIN
       ======================================================== */

    const loginButton =
        $('btn-do-login');

    if (loginButton) {

        loginButton.addEventListener(
            'click',
            async function (event) {

                event.preventDefault();

                const emailInput =
                    $('login_email');

                const passwordInput =
                    $('login_password');

                const message =
                    $('login-error-msg') ||
                    $('login-message');

                if (
                    !emailInput ||
                    !passwordInput
                ) {

                    return;
                }

                const email =
                    emailInput.value.trim();

                const password =
                    passwordInput.value;


                if (
                    !email ||
                    !password
                ) {

                    if (message) {

                        message.textContent =
                            'Please enter both email and password.';

                        message.style.display =
                            'block';
                    }

                    return;
                }


                const originalText =
                    loginButton.innerHTML;

                loginButton.disabled =
                    true;

                loginButton.innerHTML =
                    '⏳ Signing In...';


                if (message) {

                    message.style.display =
                        'none';
                }


                try {

                    const result =
                        await apiRequest(
                            'login',
                            {
                                email:
                                    email,

                                password:
                                    password
                            }
                        );


                    if (
                        result.status !==
                        'success'
                    ) {

                        throw new Error(
                            result.message ||
                            'Invalid login credentials.'
                        );
                    }


                    loginButton.innerHTML =
                        '✓ Login Successful';


                    /*
                     * IMPORTANT:
                     *
                     * PHP session is created by api.php.
                     * Reload index.php so it reads that session.
                     */
                    setTimeout(
                        function () {

                            window.location.replace(
                                window.location.pathname +
                                '?login=' +
                                Date.now()
                            );

                        },
                        250
                    );


                } catch (error) {

                    console.error(
                        '[LOGIN]',
                        error
                    );

                    if (message) {

                        message.textContent =
                            error.message ||
                            'Login failed.';

                        message.style.display =
                            'block';
                    }

                    loginButton.disabled =
                        false;

                    loginButton.innerHTML =
                        originalText;
                }

            }
        );
    }


    /* ========================================================
       SIGNUP
       ======================================================== */

    const signupButton =
        $('btn-do-signup');

    if (signupButton) {

        signupButton.addEventListener(
            'click',
            async function (event) {

                event.preventDefault();


                const name =
                    $('signup_name')?.value.trim() ||
                    '';

                const email =
                    $('signup_email')?.value.trim() ||
                    '';

                const password =
                    $('signup_pwd')?.value ||
                    '';

                const university =
                    $('signup_uni')?.value ||
                    '';

                const branch =
                    $('signup_branch')?.value ||
                    '';

                const year =
                    $('signup_gradyear')?.value ||
                    $('signup_year')?.value ||
                    '';

                const linkedin =
                    $('signup_linkedin')?.value ||
                    '';

                const github =
                    $('signup_github')?.value ||
                    '';

                const errorMessage =
                    $('signup-error-msg') ||
                    $('signup-message');

                const successMessage =
                    $('signup-success-msg') ||
                    $('signup-success');


                if (
                    !name ||
                    !email ||
                    !password
                ) {

                    if (errorMessage) {

                        errorMessage.textContent =
                            'Please fill all required fields.';

                        errorMessage.style.display =
                            'block';
                    }

                    return;
                }


                /*
                 * Password validation
                 */
                const passwordPattern =
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;


                if (
                    !passwordPattern.test(
                        password
                    )
                ) {

                    if (errorMessage) {

                        errorMessage.textContent =
                            'Password must contain at least 8 characters, including uppercase, lowercase, number and special character.';

                        errorMessage.style.display =
                            'block';
                    }

                    return;
                }


                signupButton.disabled =
                    true;

                signupButton.innerHTML =
                    '⏳ Creating Account...';


                try {

                    const result =
                        await apiRequest(
                            'signup',
                            {
                                name:
                                    name,

                                email:
                                    email,

                                password:
                                    password,

                                university:
                                    university,

                                branch:
                                    branch,

                                graduation_year:
                                    year,

                                linkedin:
                                    linkedin,

                                github:
                                    github
                            }
                        );


                    if (
                        result.status !==
                        'success'
                    ) {

                        throw new Error(
                            result.message ||
                            'Registration failed.'
                        );
                    }


                    if (successMessage) {

                        successMessage.textContent =
                            result.message ||
                            'Account created successfully.';

                        successMessage.style.display =
                            'block';
                    }


                    if (errorMessage) {

                        errorMessage.style.display =
                            'none';
                    }


                    setTimeout(
                        function () {

                            if (loginTab) {
                                loginTab.click();
                            }

                            if ($('login_email')) {

                                $('login_email').value =
                                    email;
                            }

                        },
                        1000
                    );


                } catch (error) {

                    console.error(
                        '[SIGNUP]',
                        error
                    );

                    if (errorMessage) {

                        errorMessage.textContent =
                            error.message ||
                            'Registration failed.';

                        errorMessage.style.display =
                            'block';
                    }


                } finally {

                    signupButton.disabled =
                        false;

                    signupButton.innerHTML =
                        '✨ Register Account';
                }

            }
        );
    }


    /* ========================================================
       LOGOUT
       ======================================================== */

    const logoutButton =
        $('btn-logout');

    if (logoutButton) {

        logoutButton.addEventListener(
            'click',
            async function () {

                logoutButton.disabled =
                    true;

                try {

                    await fetch(
                        'api.php?action=logout',
                        {
                            credentials:
                                'same-origin',

                            cache:
                                'no-store'
                        }
                    );

                } catch (error) {

                    console.error(
                        '[LOGOUT]',
                        error
                    );

                } finally {

                    window.location.replace(
                        window.location.pathname +
                        '?logout=' +
                        Date.now()
                    );
                }
            }
        );
    }
}


/* ============================================================
   PASSWORD TOGGLE
   ============================================================ */

function initPasswordToggles() {

    const buttons =
        queryAll(
            '#toggle-login-password, ' +
            '#toggle-password, ' +
            '.password-toggle'
        );

    buttons.forEach(
        function (button) {

            button.addEventListener(
                'click',
                function () {

                    const targetId =
                        button.dataset.target ||
                        'login_password';

                    const input =
                        $(targetId);

                    if (!input) {
                        return;
                    }

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
    );
}


/* ============================================================
   NAVIGATION
   ============================================================ */

function initNavigation() {

    const navItems =
        queryAll(
            '.nav-item[data-view]'
        );

    const views =
        queryAll(
            '.view-panel'
        );


    if (!navItems.length) {
        return;
    }


    navItems.forEach(
        function (item) {

            item.addEventListener(
                'click',
                function (event) {

                    event.preventDefault();

                    const viewId =
                        item.getAttribute(
                            'data-view'
                        );

                    if (!viewId) {
                        return;
                    }


                    navItems.forEach(
                        function (nav) {

                            nav.classList.remove(
                                'active'
                            );
                        }
                    );


                    views.forEach(
                        function (view) {

                            view.style.display =
                                'none';
                        }
                    );


                    item.classList.add(
                        'active'
                    );


                    const target =
                        $(viewId);

                    if (target) {

                        target.style.display =
                            'block';

                        window.APP_STATE.currentView =
                            viewId;


                        if (
                            viewId ===
                            'view-roadmap'
                        ) {

                            loadDynamicRoadmap();
                        }


                        if (
                            viewId ===
                            'view-interview'
                        ) {

                            loadDynamicInterview();
                        }


                        if (
                            viewId ===
                            'view-jobranking'
                        ) {

                            loadDynamicJobs();
                        }
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

function initMobileUI() {

    const menuButton =
        query(
            '#mobile-menu-toggle,' +
            '#btn-mobile-menu,' +
            '#menu-toggle,' +
            '#mobile-menu-btn,' +
            '#sidebar-toggle,' +
            '.mobile-menu-toggle'
        );

    const sidebar =
        query(
            '#sidebar,' +
            '#app-sidebar,' +
            '.sidebar,' +
            '.dashboard-sidebar'
        );

    const overlay =
        query(
            '#sidebar-overlay,' +
            '#mobile-overlay,' +
            '.sidebar-overlay,' +
            '.mobile-overlay'
        );


    if (
        !menuButton ||
        !sidebar
    ) {

        return;
    }


    menuButton.addEventListener(
        'click',
        function () {

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
            closeMobileSidebar
        );
    }
}


function closeMobileSidebar() {

    const sidebar =
        query(
            '#sidebar,' +
            '#app-sidebar,' +
            '.sidebar,' +
            '.dashboard-sidebar'
        );

    const overlay =
        query(
            '#sidebar-overlay,' +
            '#mobile-overlay,' +
            '.sidebar-overlay,' +
            '.mobile-overlay'
        );


    if (sidebar) {

        sidebar.classList.remove(
            'mobile-open'
        );
    }


    if (overlay) {

        overlay.classList.remove(
            'active'
        );
    }
}


/* ============================================================
   THEME
   ============================================================ */

function initThemeToggle() {

    const themeButton =
        query(
            '#theme-toggle,' +
            '#btn-theme-toggle,' +
            '#toggle-theme,' +
            '#theme-switch,' +
            '#dark-mode-toggle'
        );


    const savedTheme =
        localStorage.getItem(
            'sgp-theme'
        );


    if (
        savedTheme ===
        'light'
    ) {

        document.body.classList.add(
            'light-theme'
        );

    } else {

        document.body.classList.remove(
            'light-theme'
        );
    }


    if (!themeButton) {
        return;
    }


    updateThemeButton(
        themeButton
    );


    themeButton.addEventListener(
        'click',
        function () {

            document.body.classList.toggle(
                'light-theme'
            );


            const isLight =
                document.body.classList.contains(
                    'light-theme'
                );


            localStorage.setItem(
                'sgp-theme',
                isLight
                    ? 'light'
                    : 'dark'
            );


            updateThemeButton(
                themeButton
            );
        }
    );
}


function updateThemeButton(button) {

    if (!button) {
        return;
    }

    const isLight =
        document.body.classList.contains(
            'light-theme'
        );

    /*
     * Only change simple icon-only buttons.
     */
    if (
        button.children.length === 0
    ) {

        button.textContent =
            isLight
                ? '☀️'
                : '🌙';
    }
}


/* ============================================================
   DYNAMIC CAREER STATE
   ============================================================ */

function initializeDynamicCareerState() {

    /*
     * IMPORTANT:
     *
     * There is intentionally NO call to:
     *
     * updateSelectedCompanyRole()
     *
     * because the old function used benchmark data
     * and caused the loading crash.
     */


    const data =
        window.APP_DATA || {};

    const state =
        window.APP_STATE;


    state.targetCompany =
        data.targetCompany ||
        state.targetCompany ||
        '';


    state.targetRole =
        data.targetRole ||
        state.targetRole ||
        '';


    state.requiredSkills =
        normalizeSkills(
            Array.isArray(
                data.requiredSkills
            )
                ? data.requiredSkills
                : state.requiredSkills
        );


    state.extractedSkills =
        normalizeSkills(
            Array.isArray(
                data.extractedSkills
            )
                ? data.extractedSkills
                : state.extractedSkills
        );


    state.atsScore =
        Number(
            data.atsScore ||
            state.atsScore ||
            0
        );


    state.careerUrl =
        data.careerUrl ||
        state.careerUrl ||
        '';


    if (
        Array.isArray(
            data.careerJobs
        )
    ) {

        state.careerJobs =
            data.careerJobs;
    }


    updateDynamicTargetUI();


    /*
     * Only dashboard pages should request metrics.
     */
    const loginButton =
        $('btn-do-login');

    if (!loginButton) {

        fetchInitialMetrics();
    }
}


/* ============================================================
   DYNAMIC TARGET UI
   ============================================================ */

function updateDynamicTargetUI() {

    const state =
        window.APP_STATE;


    const banner =
        $('banner-company-role');


    if (banner) {

        if (
            state.targetCompany &&
            state.targetRole
        ) {

            banner.textContent =
                state.targetCompany +
                ' · ' +
                state.targetRole;

        } else if (
            state.targetRole
        ) {

            banner.textContent =
                state.targetRole;

        } else {

            banner.textContent =
                'Dynamic Career Analysis';
        }
    }


    const roleElements =
        queryAll(
            '[data-dynamic-role]'
        );


    roleElements.forEach(
        function (element) {

            element.textContent =
                state.targetRole ||
                'Select a job from your career URL';
        }
    );


    const companyElements =
        queryAll(
            '[data-dynamic-company]'
        );


    companyElements.forEach(
        function (element) {

            element.textContent =
                state.targetCompany ||
                'Detected from job posting';
        }
    );


    const skillsElements =
        queryAll(
            '[data-required-skills]'
        );


    skillsElements.forEach(
        function (element) {

            element.textContent =
                state.requiredSkills.length
                    ? state.requiredSkills.join(
                        ', '
                    )
                    : 'Requirements will be detected from the selected job.';
        }
    );
}


/* ============================================================
   HIDE OLD BENCHMARK UI
   ============================================================ */

function hideLegacyBenchmarkUI() {

    /*
     * Hide the old mode controls.
     */
    const oldModeElements = [
        'mode-benchmark',
        'mode-custom'
    ];


    oldModeElements.forEach(
        function (id) {

            const element =
                $(id);

            if (!element) {
                return;
            }

            const container =
                element.closest(
                    '.form-group'
                ) ||
                element.closest(
                    '.input-group'
                ) ||
                element.parentElement;


            if (container) {

                container.style.display =
                    'none';
            }
        }
    );


    /*
     * Hide old benchmark selection boxes.
     */
    [
        'box-benchmark-select',
        'box-custom-select'
    ].forEach(
        function (id) {

            const element =
                $(id);

            if (element) {

                element.style.display =
                    'none';
            }
        }
    );


    /*
     * Remove old predefined dropdown values.
     */
    const companySelect =
        $('select-company');

    const roleSelect =
        $('select-role');


    if (companySelect) {

        companySelect.innerHTML =
            '<option value="">Select from career URL</option>';

        companySelect.disabled =
            true;
    }


    if (roleSelect) {

        roleSelect.innerHTML =
            '<option value="">Select from scraped jobs</option>';

        roleSelect.disabled =
            true;
    }
}


/* ============================================================
   METRICS
   ============================================================ */

async function fetchInitialMetrics() {

    const state =
        window.APP_STATE;


    /*
     * Don't fabricate a target.
     */
    if (
        !state.targetRole &&
        !state.requiredSkills.length
    ) {

        updateMetricDisplay({
            readiness_pct: 0,
            confidence_pct: 0,
            matched_skills: [],
            missing_skills: []
        });

        return;
    }


    try {

        const result =
            await apiRequest(
                'get_metrics',
                {
                    target_company:
                        state.targetCompany,

                    target_role:
                        state.targetRole,

                    required_skills:
                        state.requiredSkills
                }
            );


        state.latestMetrics =
            result;


        updateMetricDisplay(
            result
        );


    } catch (error) {

        console.error(
            '[Metrics]',
            error
        );
    }
}


/* ============================================================
   METRIC DISPLAY
   ============================================================ */

function updateMetricDisplay(data) {

    if (!data) {
        return;
    }


    const readiness =
        Number(
            data.readiness_pct || 0
        );


    const confidence =
        Number(
            data.confidence_pct || 0
        );


    const matched =
        Array.isArray(
            data.matched_skills
        )
            ? data.matched_skills
            : [];


    const missing =
        Array.isArray(
            data.missing_skills
        )
            ? data.missing_skills
            : [];


    const readinessElement =
        $('metric-readiness');


    if (readinessElement) {

        readinessElement.textContent =
            `${readiness}%`;
    }


    const confidenceElement =
        $('metric-confidence');


    if (confidenceElement) {

        confidenceElement.textContent =
            `${confidence}%`;
    }


    const matchedCount =
        $('metric-matched-count');


    if (matchedCount) {

        const total =
            matched.length +
            missing.length;

        matchedCount.textContent =
            `${matched.length} of ${total} Skills Matched`;
    }


    const strength =
        $('metric-strength');


    if (strength) {

        if (readiness >= 80) {

            strength.textContent =
                'Strong';

        } else if (readiness >= 60) {

            strength.textContent =
                'Moderate';

        } else {

            strength.textContent =
                'Needs Improvement';
        }
    }


    const matchedBox =
        $('matched-skills-tags');


    if (matchedBox) {

        matchedBox.innerHTML =
            matched.length
                ? matched.map(
                    function (skill) {

                        return `
                            <span class="skill-tag-matched">
                                ${escapeHtml(skill)}
                            </span>
                        `;
                    }
                ).join('')
                : '<p>No matching skills detected yet.</p>';
    }


    const missingBox =
        $('missing-skills-tags');


    if (missingBox) {

        missingBox.innerHTML =
            missing.length
                ? missing.map(
                    function (skill) {

                        return `
                            <span class="skill-tag-missing">
                                ${escapeHtml(skill)}
                            </span>
                        `;
                    }
                ).join('')
                : '<p>No missing skills detected.</p>';
    }


    updateCharts(
        data
    );
}


/* ============================================================
   CHARTS
   ============================================================ */

let radarChart = null;

let pieChart = null;


function initCharts() {

    if (
        typeof Chart ===
        'undefined'
    ) {

        console.warn(
            'Chart.js is not loaded.'
        );

        return;
    }


    const radarCanvas =
        $('radarChartCtx');

    const pieCanvas =
        $('pieChartCtx');


    if (radarCanvas) {

        try {

            radarChart =
                new Chart(
                    radarCanvas,
                    {
                        type:
                            'radar',

                        data: {

                            labels: [
                                'Technical Skills',
                                'ATS Compatibility',
                                'Projects',
                                'Core Knowledge',
                                'Job Match'
                            ],

                            datasets: [
                                {
                                    label:
                                        'Profile',

                                    data: [
                                        0,
                                        window.APP_STATE.atsScore || 0,
                                        0,
                                        0,
                                        0
                                    ]
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
                                        100
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

        } catch (error) {

            console.error(
                'Radar chart error:',
                error
            );
        }
    }


    if (pieCanvas) {

        try {

            pieChart =
                new Chart(
                    pieCanvas,
                    {
                        type:
                            'doughnut',

                        data: {

                            labels: [
                                'Matched',
                                'Missing'
                            ],

                            datasets: [
                                {
                                    data: [
                                        0,
                                        0
                                    ]
                                }
                            ]
                        },

                        options: {

                            responsive:
                                true,

                            maintainAspectRatio:
                                false
                        }
                    }
                );

        } catch (error) {

            console.error(
                'Pie chart error:',
                error
            );
        }
    }
}


function updateCharts(data) {

    if (
        !data
    ) {
        return;
    }


    if (radarChart) {

        const skillCount =
            window.APP_STATE
                .extractedSkills
                .length;


        const ats =
            Number(
                window.APP_STATE
                    .atsScore || 0
            );


        const readiness =
            Number(
                data.readiness_pct || 0
            );


        radarChart.data
            .datasets[0]
            .data = [

                Math.min(
                    100,
                    skillCount * 8
                ),

                ats,

                Math.min(
                    100,
                    skillCount * 10
                ),

                Math.min(
                    100,
                    skillCount * 7
                ),

                readiness
            ];


        radarChart.update();
    }


    if (pieChart) {

        const matched =
            Array.isArray(
                data.matched_skills
            )
                ? data.matched_skills.length
                : 0;


        const missing =
            Array.isArray(
                data.missing_skills
            )
                ? data.missing_skills.length
                : 0;


        pieChart.data
            .datasets[0]
            .data = [
                matched,
                missing
            ];


        pieChart.update();
    }
}


/* ============================================================
   RESUME UPLOAD
   ============================================================ */

function initResumeUpload() {

    const form =
        $('form-resume-upload');

    const sampleButton =
        $('btn-load-sample-resume');


    if (form) {

        form.addEventListener(
            'submit',
            async function (event) {

                event.preventDefault();


                const fileInput =
                    $('input-resume-file');


                if (
                    !fileInput ||
                    !fileInput.files ||
                    !fileInput.files.length
                ) {

                    alert(
                        'Please select a resume PDF or DOCX file.'
                    );

                    return;
                }


                const status =
                    $('resume-upload-status');


                if (status) {

                    status.style.display =
                        'block';

                    status.className =
                        'alert alert-info';

                    status.textContent =
                        'Extracting resume information and evaluating ATS compatibility...';
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
                    window.APP_STATE.targetCompany
                );


                formData.append(
                    'target_role',
                    window.APP_STATE.targetRole
                );


                formData.append(
                    'required_skills',
                    JSON.stringify(
                        window.APP_STATE.requiredSkills
                    )
                );


                try {

                    const response =
                        await fetch(
                            'api.php',
                            {
                                method:
                                    'POST',

                                body:
                                    formData,

                                credentials:
                                    'same-origin'
                            }
                        );


                    const raw =
                        await response.text();


                    let result;


                    try {

                        result =
                            JSON.parse(
                                raw
                            );

                        } catch (error) {

                        throw new Error(
                            'Server returned an invalid upload response.'
                        );
                    }


                    if (
                        result.status !==
                        'success'
                    ) {

                        throw new Error(
                            result.message ||
                            result.error ||
                            'Resume upload failed.'
                        );
                    }


                    window.APP_STATE.extractedSkills =
                        normalizeSkills(
                            result.extracted_skills ||
                            result.skills ||
                            []
                        );


                    window.APP_STATE.atsScore =
                        Number(
                            result.ats_score ||
                            result.atsScore ||
                            0
                        );


                    if (status) {

                        status.className =
                            'alert alert-success';

                        status.textContent =
                            'Resume parsed successfully.';
                    }


                    /*
                     * Refresh page so PHP-rendered resume
                     * information is updated.
                     */
                    setTimeout(
                        function () {

                            window.location.reload();

                        },
                        700
                    );


                } catch (error) {

                    console.error(
                        '[Resume Upload]',
                        error
                    );


                    if (status) {

                        status.className =
                            'alert alert-error';

                        status.textContent =
                            error.message ||
                            'Resume upload failed.';
                    }
                }
            }
        );
    }


    /*
     * Sample loader is retained only if your UI has it.
     */
    if (sampleButton) {

        sampleButton.addEventListener(
            'click',
            async function () {

                try {

                    sampleButton.disabled =
                        true;

                    sampleButton.innerHTML =
                        '⏳ Loading...';


                    const response =
                        await fetch(
                            'api.php?action=load_sample',
                            {
                                credentials:
                                    'same-origin'
                            }
                        );


                    const result =
                        await response.json();


                    if (
                        result.status !==
                        'success'
                    ) {

                        throw new Error(
                            result.message ||
                            'Unable to load sample.'
                        );
                    }


                    window.location.reload();


                } catch (error) {

                    alert(
                        error.message
                    );


                    sampleButton.disabled =
                        false;
                }
            }
        );
    }
}


/* ============================================================
   CAREER URL SCRAPER
   ============================================================ */

function initWebScraper() {

    let scrapeButton =
        $('btn-scrape-url');

    let urlInput =
        $('input-scrape-url');


    /*
     * Support alternative IDs.
     */
    if (!urlInput) {

        urlInput =
            $('career-url') ||
            $('career_url') ||
            $('input-career-url') ||
            $('job-url') ||
            $('job_url');
    }


    if (!scrapeButton) {

        scrapeButton =
            $('btn-scrape-career-url') ||
            $('scrape-career-url') ||
            $('btn-load-careers');
    }


    if (
        !scrapeButton ||
        !urlInput
    ) {

        /*
         * If the old HTML doesn't contain the new
         * career URL controls, create them.
         */
        createDynamicCareerURLPanel();

        return;
    }


    scrapeButton.addEventListener(
        'click',
        function (event) {

            event.preventDefault();

            scrapeCareerURL(
                urlInput,
                scrapeButton
            );
        }
    );


    urlInput.addEventListener(
        'keydown',
        function (event) {

            if (
                event.key ===
                'Enter'
            ) {

                event.preventDefault();

                scrapeCareerURL(
                    urlInput,
                    scrapeButton
                );
            }
        }
    );


    if (
        window.APP_STATE.careerUrl
    ) {

        urlInput.value =
            window.APP_STATE.careerUrl;
    }
}


/* ============================================================
   CREATE CAREER URL PANEL
   ============================================================ */

function createDynamicCareerURLPanel() {

    /*
     * Don't create duplicate panels.
     */
    if (
        $('dynamic-career-url-panel')
    ) {

        return;
    }


    const sidebar =
        query(
            '#sidebar'
        ) ||
        query(
            '.sidebar'
        ) ||
        query(
            '#app-sidebar'
        );


    if (!sidebar) {

        return;
    }


    const panel =
        document.createElement(
            'div'
        );


    panel.id =
        'dynamic-career-url-panel';


    panel.style.cssText = `
        margin:16px;
        padding:16px;
        border-radius:12px;
        background:rgba(99,102,241,.08);
        border:1px solid rgba(99,102,241,.25);
    `;


    panel.innerHTML = `

        <div
            style="
                font-weight:700;
                margin-bottom:8px;
            "
        >
            Career URL
        </div>

        <div
            style="
                font-size:12px;
                opacity:.75;
                margin-bottom:10px;
                line-height:1.5;
            "
        >
            Enter a career or job-listing URL.
            Jobs and required skills will be detected dynamically.
        </div>

        <input
            type="url"
            id="dynamic-career-url"
            placeholder="https://example.com/careers"
            style="
                width:100%;
                box-sizing:border-box;
                padding:10px;
                border-radius:8px;
                border:1px solid rgba(148,163,184,.35);
                margin-bottom:8px;
            "
        >

        <button
            type="button"
            id="dynamic-career-url-button"
            style="
                width:100%;
                padding:10px;
                border:0;
                border-radius:8px;
                cursor:pointer;
            "
        >
            Analyze Career URL
        </button>

        <div
            id="dynamic-career-url-status"
            style="
                display:none;
                margin-top:10px;
                font-size:12px;
                line-height:1.5;
            "
        ></div>
    `;


    sidebar.prepend(
        panel
    );


    const input =
        $('dynamic-career-url');

    const button =
        $('dynamic-career-url-button');


    if (
        window.APP_STATE.careerUrl
    ) {

        input.value =
            window.APP_STATE.careerUrl;
    }


    button.addEventListener(
        'click',
        function () {

            scrapeCareerURL(
                input,
                button
            );
        }
    );


    input.addEventListener(
        'keydown',
        function (event) {

            if (
                event.key ===
                'Enter'
            ) {

                event.preventDefault();

                scrapeCareerURL(
                    input,
                    button
                );
            }
        }
    );
}


/* ============================================================
   SCRAPE CAREER URL
   ============================================================ */

async function scrapeCareerURL(
    input,
    button
) {

    if (!input) {
        return;
    }


    const url =
        input.value.trim();


    if (!url) {

        alert(
            'Please enter a career or job URL.'
        );

        return;
    }


    try {

        new URL(
            url
        );

    } catch (error) {

        alert(
            'Please enter a valid URL beginning with http:// or https://'
        );

        return;
    }


    const status =
        $('scrape-results-box') ||
        $('dynamic-career-url-status');


    const originalText =
        button
            ? button.innerHTML
            : 'Analyze';


    if (button) {

        button.disabled =
            true;

        button.innerHTML =
            '⏳ Analyzing...';
    }


    if (status) {

        status.style.display =
            'block';

        status.className =
            'alert alert-info';

        status.textContent =
            'Opening career page and detecting available jobs...';
    }


    try {

        const result =
            await apiRequest(
                'scrape_url',
                {
                    url:
                        url
                },
                90000
            );


        if (
            result.status !==
            'success'
        ) {

            throw new Error(
                result.message ||
                result.error ||
                'Unable to analyze this URL.'
            );
        }


        window.APP_STATE.careerUrl =
            url;


        /*
         * The API may return:
         *
         * jobs
         * careers
         * data.jobs
         */
        let jobs =
            result.jobs ||
            result.careers ||
            (
                result.data &&
                result.data.jobs
            ) ||
            [];


        jobs =
            normalizeJobs(
                jobs
            );


        window.APP_STATE.careerJobs =
            jobs;


        /*
         * Show scraper result.
         */
        if (status) {

            status.className =
                'alert alert-success';

            status.innerHTML =
                `
                <strong>
                    Career URL analyzed successfully.
                </strong>
                <br>
                ${jobs.length}
                job(s) detected.
                `;
        }


        /*
         * Render detected jobs.
         */
        renderCareerJobs(
            jobs
        );


        /*
         * If jobs exist and resume exists,
         * calculate recommendation.
         */
        if (
            jobs.length
        ) {

            recommendBestJob(
                jobs
            );

        } else {

            /*
             * The scraper may return only page text.
             * Ask rank_jobs as a fallback.
             */
            await loadDynamicJobs();
        }


    } catch (error) {

        console.error(
            '[Career URL]',
            error
        );


        if (status) {

            status.className =
                'alert alert-error';

            status.textContent =
                error.message ||
                'Career URL analysis failed.';
        }

    } finally {

        if (button) {

            button.disabled =
                false;

            button.innerHTML =
                originalText;
        }
    }
}


/* ============================================================
   NORMALIZE JOBS
   ============================================================ */

function normalizeJobs(jobs) {

    if (!Array.isArray(jobs)) {

        return [];
    }


    return jobs
        .map(
            function (job) {

                if (
                    typeof job !==
                    'object' ||
                    job === null
                ) {

                    return null;
                }


                const company =
                    job.company ||
                    job.company_name ||
                    '';


                const role =
                    job.role ||
                    job.title ||
                    job.job_title ||
                    '';


                const skills =
                    job.required_skills ||
                    job.skills ||
                    job.requirements ||
                    [];


                return {

                    ...job,

                    company:
                        String(company),

                    role:
                        String(role),

                    title:
                        String(
                            job.title ||
                            role
                        ),

                    required_skills:
                        normalizeSkills(
                            Array.isArray(skills)
                                ? skills
                                : []
                        ),

                    domain:
                        job.domain ||
                        '',

                    url:
                        job.url ||
                        job.link ||
                        '',

                    description:
                        job.description ||
                        job.text ||
                        ''
                };
            }
        )
        .filter(
            function (job) {

                return job &&
                    (
                        job.role ||
                        job.title
                    );
            }
        );
}


/* ============================================================
   JOB MATCHING
   ============================================================ */

function calculateJobMatch(
    job,
    resumeSkills
) {

    const required =
        normalizeSkills(
            job.required_skills || []
        );


    const resume =
        normalizeSkills(
            resumeSkills || []
        );


    if (
        !required.length
    ) {

        return {

            score:
                0,

            matched:
                [],

            missing:
                [],

            total:
                0
        };
    }


    const resumeNormalized =
        resume.map(
            normalizeSkill
        );


    const matched = [];

    const missing = [];


    required.forEach(
        function (requiredSkill) {

            const normalizedRequired =
                normalizeSkill(
                    requiredSkill
                );


            const exactMatch =
                resumeNormalized.includes(
                    normalizedRequired
                );


            const safePartialMatch =
                !exactMatch &&
                normalizedRequired.length >= 4 &&
                resumeNormalized.some(
                    function (resumeSkill) {

                        return (
                            resumeSkill.includes(
                                normalizedRequired
                            ) ||
                            normalizedRequired.includes(
                                resumeSkill
                            )
                        );
                    }
                );


            if (
                exactMatch ||
                safePartialMatch
            ) {

                matched.push(
                    requiredSkill
                );

            } else {

                missing.push(
                    requiredSkill
                );
            }
        }
    );


    const score =
        required.length
            ? Math.round(
                (
                    matched.length /
                    required.length
                ) * 100
            )
            : 0;


    return {

        score:
            score,

        matched:
            matched,

        missing:
            missing,

        total:
            required.length
    };
}


/* ============================================================
   RECOMMEND BEST JOB
   ============================================================ */

function recommendBestJob(
    jobs
) {

    const resumeSkills =
        window.APP_STATE.extractedSkills;


    if (
        !Array.isArray(jobs) ||
        !jobs.length
    ) {

        return null;
    }


    if (
        !resumeSkills.length
    ) {

        renderRecommendationMessage(
            'Upload your resume to calculate the best job match.'
        );

        renderCareerJobs(
            jobs
        );

        return null;
    }


    const scored =
        jobs.map(
            function (job) {

                const match =
                    calculateJobMatch(
                        job,
                        resumeSkills
                    );

                return {

                    ...job,

                    match_pct:
                        match.score,

                    matched_count:
                        match.matched.length,

                    total_count:
                        match.total,

                    matched_skills:
                        match.matched,

                    missing_skills:
                        match.missing
                };
            }
        );


    /*
     * Sort only for selecting the highest
     * numerical match.
     */
    scored.sort(
        function (a, b) {

            if (
                b.match_pct !==
                a.match_pct
            ) {

                return (
                    b.match_pct -
                    a.match_pct
                );
            }


            if (
                b.matched_count !==
                a.matched_count
            ) {

                return (
                    b.matched_count -
                    a.matched_count
                );
            }


            return (
                a.total_count -
                b.total_count
            );
        }
    );


    const best =
        scored[0];


    if (!best) {
        return null;
    }


    window.APP_STATE.recommendedJob =
        best;


    window.APP_STATE.targetCompany =
        best.company || '';


    window.APP_STATE.targetRole =
        best.role ||
        best.title ||
        '';


    window.APP_STATE.requiredSkills =
        normalizeSkills(
            best.required_skills
        );


    /*
     * Update UI.
     */
    updateDynamicTargetUI();


    renderCareerJobs(
        scored,
        best
    );


    renderRecommendation(
        best
    );


    /*
     * Store the dynamic target in PHP session.
     */
    syncDynamicTargetWithServer(
        best
    );


    /*
     * Refresh metrics.
     */
    fetchInitialMetrics();


    return best;
}


/* ============================================================
   SERVER TARGET SYNC
   ============================================================ */

async function syncDynamicTargetWithServer(
    job
) {

    if (!job) {
        return;
    }


    try {

        await apiRequest(
            'get_metrics',
            {
                target_company:
                    job.company || '',

                target_role:
                    job.role ||
                    job.title ||
                    '',

                required_skills:
                    job.required_skills || []
            }
        );

    } catch (error) {

        console.warn(
            'Could not sync target:',
            error
        );
    }
}


/* ============================================================
   RENDER RECOMMENDATION
   ============================================================ */

function renderRecommendation(
    job
) {

    const container =
        $('recommended-job') ||
        $('recommended-job-card') ||
        $('job-recommendation');


    if (!container) {
        return;
    }


    const score =
        Number(
            job.match_pct || 0
        );


    container.innerHTML =
        `

        <div
            class="recommended-job-inner"
        >

            <div
                style="
                    font-size:12px;
                    opacity:.7;
                    margin-bottom:6px;
                "
            >
                Dynamic Job Match
            </div>

            <h3>
                ${escapeHtml(
                    job.role ||
                    job.title ||
                    'Job'
                )}
            </h3>

            ${
                job.company
                    ? `
                    <p>
                        ${escapeHtml(
                            job.company
                        )}
                    </p>
                    `
                    : ''
            }

            <div
                style="
                    font-size:28px;
                    font-weight:800;
                    margin-top:10px;
                "
            >
                ${score}%
            </div>

            <div
                style="
                    margin-top:6px;
                    opacity:.75;
                "
            >
                Resume skill match
            </div>

            ${
                job.url
                    ? `
                    <a
                        href="${escapeHtml(job.url)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        View Job
                    </a>
                    `
                    : ''
            }

        </div>
        `;
}


/* ============================================================
   RECOMMENDATION MESSAGE
   ============================================================ */

function renderRecommendationMessage(
    message
) {

    const container =
        $('recommended-job') ||
        $('recommended-job-card') ||
        $('job-recommendation');


    if (!container) {
        return;
    }


    container.innerHTML =
        `
        <div
            style="
                padding:16px;
                border-radius:10px;
            "
        >
            ${escapeHtml(message)}
        </div>
        `;
}


/* ============================================================
   RENDER CAREER JOBS
   ============================================================ */

function renderCareerJobs(
    jobs,
    recommended
) {

    const container =
        $('career-jobs') ||
        $('job-results') ||
        $('job-ranking-results') ||
        $('dynamic-job-results');


    if (!container) {
        return;
    }


    if (
        !Array.isArray(jobs) ||
        !jobs.length
    ) {

        container.innerHTML =
            `
            <div class="empty-state">
                No jobs detected yet.
            </div>
            `;

        return;
    }


    container.innerHTML =
        jobs.map(
            function (job, index) {

                const isRecommended =
                    recommended &&
                    (
                        recommended ===
                        job
                    );


                const score =
                    Number(
                        job.match_pct || 0
                    );


                return `

                    <div
                        class="career-job-card"
                        data-job-index="${index}"
                        style="
                            margin-bottom:14px;
                            padding:16px;
                            border-radius:12px;
                            border:1px solid rgba(148,163,184,.2);
                        "
                    >

                        ${
                            isRecommended
                                ? `
                                <div
                                    style="
                                        font-size:11px;
                                        font-weight:700;
                                        margin-bottom:8px;
                                    "
                                >
                                    Best Resume Match
                                </div>
                                `
                                : ''
                        }


                        <h3>
                            ${escapeHtml(
                                job.role ||
                                job.title ||
                                'Job'
                            )}
                        </h3>


                        ${
                            job.company
                                ? `
                                <div>
                                    ${escapeHtml(
                                        job.company
                                    )}
                                </div>
                                `
                                : ''
                        }


                        ${
                            job.domain
                                ? `
                                <div>
                                    ${escapeHtml(
                                        job.domain
                                    )}
                                </div>
                                `
                                : ''
                        }


                        ${
                            window.APP_STATE.extractedSkills.length
                                ? `
                                <div
                                    style="
                                        margin-top:8px;
                                        font-weight:700;
                                    "
                                >
                                    Match:
                                    ${score}%
                                </div>
                                `
                                : ''
                        }


                        ${
                            job.required_skills &&
                            job.required_skills.length
                                ? `
                                <div
                                    style="
                                        margin-top:8px;
                                        font-size:13px;
                                        opacity:.8;
                                    "
                                >
                                    Required:
                                    ${escapeHtml(
                                        job.required_skills.join(
                                            ', '
                                        )
                                    )}
                                </div>
                                `
                                : ''
                        }


                        <div
                            style="
                                display:flex;
                                gap:8px;
                                margin-top:12px;
                                flex-wrap:wrap;
                            "
                        >

                            <button
                                type="button"
                                class="use-job-button"
                                data-job-index="${index}"
                            >
                                Use This Job
                            </button>


                            ${
                                job.url
                                    ? `
                                    <a
                                        href="${escapeHtml(job.url)}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Open Job
                                    </a>
                                    `
                                    : ''
                            }

                        </div>

                    </div>
                `;
            }
        ).join('');


    queryAll(
        '.use-job-button',
        container
    ).forEach(
        function (button) {

            button.addEventListener(
                'click',
                function () {

                    const index =
                        Number(
                            button.dataset.jobIndex
                        );


                    const job =
                        jobs[index];


                    if (job) {

                        applySelectedJob(
                            job
                        );
                    }
                }
            );
        }
    );
}


/* ============================================================
   APPLY SELECTED JOB
   ============================================================ */

function applySelectedJob(
    job
) {

    window.APP_STATE.recommendedJob =
        job;


    window.APP_STATE.targetCompany =
        job.company || '';


    window.APP_STATE.targetRole =
        job.role ||
        job.title ||
        '';


    window.APP_STATE.requiredSkills =
        normalizeSkills(
            job.required_skills ||
            []
        );


    updateDynamicTargetUI();


    renderRecommendation(
        job
    );


    syncDynamicTargetWithServer(
        job
    );


    fetchInitialMetrics();


    /*
     * If dashboard navigation exists,
     * switch to it.
     */
    const dashboard =
        query(
            '.nav-item[data-view="view-dashboard"]'
        );


    if (dashboard) {

        dashboard.click();
    }
}


/* ============================================================
   JOB RANKING
   ============================================================ */

function initJobRanking() {

    const domainFilter =
        $('select-job-domain-filter');

    const searchInput =
        $('input-job-search');


    if (
        domainFilter
    ) {

        domainFilter.addEventListener(
            'change',
            function () {

                loadDynamicJobs();
            }
        );
    }


    if (
        searchInput
    ) {

        searchInput.addEventListener(
            'input',
            function () {

                filterRenderedJobs(
                    searchInput.value
                );
            }
        );
    }
}


async function loadDynamicJobs() {

    /*
     * First use jobs already scraped.
     */
    if (
        Array.isArray(
            window.APP_STATE.careerJobs
        ) &&
        window.APP_STATE.careerJobs.length
    ) {

        recommendBestJob(
            window.APP_STATE.careerJobs
        );

        return;
    }


    try {

        const domainFilter =
            $('select-job-domain-filter');


        const result =
            await apiRequest(
                'rank_jobs',
                {
                    domain_filter:
                        domainFilter
                            ? domainFilter.value
                            : ''
                }
            );


        if (
            result.status !==
            'success'
        ) {

            throw new Error(
                result.message ||
                'Unable to load jobs.'
            );
        }


        const jobs =
            normalizeJobs(
                result.jobs || []
            );


        window.APP_STATE.careerJobs =
            jobs;


        if (jobs.length) {

            recommendBestJob(
                jobs
            );

        } else {

            renderRecommendationMessage(
                'No dynamically detected jobs are available yet.'
            );
        }


    } catch (error) {

        console.error(
            '[Jobs]',
            error
        );
    }
}


/* ============================================================
   FILTER RENDERED JOBS
   ============================================================ */

function filterRenderedJobs(
    searchText
) {

    const queryText =
        String(
            searchText || ''
        )
        .toLowerCase()
        .trim();


    const jobs =
        window.APP_STATE.careerJobs;


    if (!jobs.length) {
        return;
    }


    const filtered =
        jobs.filter(
            function (job) {

                return (
                    !queryText ||
                    String(
                        job.company || ''
                    )
                        .toLowerCase()
                        .includes(queryText) ||
                    String(
                        job.role ||
                        job.title ||
                        ''
                    )
                        .toLowerCase()
                        .includes(queryText)
                );
            }
        );


    renderCareerJobs(
        filtered,
        window.APP_STATE.recommendedJob
    );
}


/* ============================================================
   SKILL EDITOR
   ============================================================ */

function initSkillEditor() {

    const button =
        $('btn-update-skills-live');


    if (!button) {
        return;
    }


    button.addEventListener(
        'click',
        async function () {

            const checkboxes =
                queryAll(
                    '.active-profile-skill-checkbox:checked'
                );


            const skills =
                normalizeSkills(
                    checkboxes.map(
                        function (checkbox) {

                            return checkbox.value;
                        }
                    )
                );


            button.disabled =
                true;


            try {

                const result =
                    await apiRequest(
                        'update_skills',
                        {
                            skills:
                                skills
                        }
                    );


                if (
                    result.status !==
                    'success'
                ) {

                    throw new Error(
                        result.message ||
                        'Unable to update skills.'
                    );
                }


                window.APP_STATE.extractedSkills =
                    normalizeSkills(
                        result.skills ||
                        skills
                    );


                await fetchInitialMetrics();


                alert(
                    'Skills updated successfully.'
                );


            } catch (error) {

                alert(
                    error.message
                );

            } finally {

                button.disabled =
                    false;
            }
        }
    );
}


/* ============================================================
   PROFILE FORM
   ============================================================ */

function initProfileForm() {

    const form =
        $('form-update-profile');


    if (!form) {
        return;
    }


    form.addEventListener(
        'submit',
        async function (event) {

            event.preventDefault();


            const formData =
                new FormData(
                    form
                );


            formData.append(
                'action',
                'update_profile'
            );


            try {

                const response =
                    await fetch(
                        'api.php',
                        {
                            method:
                                'POST',

                            body:
                                formData,

                            credentials:
                                'same-origin'
                        }
                    );


                const result =
                    await response.json();


                if (
                    result.status !==
                    'success'
                ) {

                    throw new Error(
                        result.message ||
                        'Profile update failed.'
                    );
                }


                alert(
                    'Profile updated successfully.'
                );


                window.location.reload();


            } catch (error) {

                alert(
                    error.message
                );
            }
        }
    );
}


/* ============================================================
   ROADMAP
   ============================================================ */

async function loadDynamicRoadmap() {

    const roadmapContainer =
        $('container-dynamic-roadmap');


    const resourcesContainer =
        $('container-dynamic-resources');


    if (
        !roadmapContainer
    ) {

        return;
    }


    const metrics =
        window.APP_STATE.latestMetrics ||
        {};


    const missingSkills =
        Array.isArray(
            metrics.missing_skills
        )
            ? metrics.missing_skills
            : [];


    if (
        !window.APP_STATE.targetRole &&
        !missingSkills.length
    ) {

        roadmapContainer.innerHTML =
            `
            <p>
                Select a job from your career URL to generate a personalized roadmap.
            </p>
            `;

        return;
    }


    try {

        const result =
            await apiRequest(
                'get_roadmap',
                {
                    missing_skills:
                        missingSkills,

                    target_company:
                        window.APP_STATE.targetCompany,

                    target_role:
                        window.APP_STATE.targetRole
                }
            );


        if (
            result.status !==
            'success'
        ) {

            throw new Error(
                result.message ||
                'Roadmap could not be generated.'
            );
        }


        const roadmap =
            result.roadmap;


        if (
            !roadmap
        ) {

            return;
        }


        const phases =
            Array.isArray(
                roadmap.phases
            )
                ? roadmap.phases
                : [];


        roadmapContainer.innerHTML =
            phases.length
                ? phases.map(
                    function (phase) {

                        return `

                            <div
                                class="roadmap-phase-card"
                                style="
                                    margin-bottom:14px;
                                "
                            >

                                <h3>
                                    ${escapeHtml(
                                        phase.phase ||
                                        ''
                                    )}
                                </h3>

                                <p>
                                    ${escapeHtml(
                                        phase.objective ||
                                        ''
                                    )}
                                </p>

                                <div>
                                    Duration:
                                    ${escapeHtml(
                                        phase.duration ||
                                        ''
                                    )}
                                </div>

                                ${
                                    phase.skills &&
                                    phase.skills.length
                                        ? `
                                        <div>
                                            Skills:
                                            ${escapeHtml(
                                                phase.skills.join(
                                                    ', '
                                                )
                                            )}
                                        </div>
                                        `
                                        : ''
                                }

                                ${
                                    phase.action_items &&
                                    phase.action_items.length
                                        ? `
                                        <ul>
                                            ${
                                                phase.action_items
                                                    .map(
                                                        function (item) {

                                                            return `
                                                                <li>
                                                                    ${escapeHtml(
                                                                        item
                                                                    )}
                                                                </li>
                                                            `;
                                                        }
                                                    )
                                                    .join('')
                                            }
                                        </ul>
                                        `
                                        : ''
                                }

                            </div>
                        `;
                    }
                ).join('')
                : `
                    <p>
                        No roadmap items were generated.
                    </p>
                `;


        if (
            resourcesContainer
        ) {

            const resources =
                Array.isArray(
                    roadmap.resources
                )
                    ? roadmap.resources
                    : [];


            resourcesContainer.innerHTML =
                resources.map(
                    function (resource) {

                        return `
                            <details
                                style="
                                    margin-bottom:12px;
                                "
                            >

                                <summary>
                                    ${escapeHtml(
                                        resource.skill ||
                                        'Skill'
                                    )}
                                </summary>

                                <div
                                    style="
                                        padding-top:10px;
                                    "
                                >

                                    ${
                                        resource.platform
                                            ? `
                                            <p>
                                                Platform:
                                                ${escapeHtml(
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
                                                Time:
                                                ${escapeHtml(
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
                                                Documentation:
                                                <a
                                                    href="${escapeHtml(resource.docs)}"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Open Documentation
                                                </a>
                                            </p>
                                            `
                                            : ''
                                    }

                                    ${
                                        resource.project
                                            ? `
                                            <p>
                                                Project:
                                                ${escapeHtml(
                                                    resource.project
                                                )}
                                            </p>
                                            `
                                            : ''
                                    }

                                </div>

                            </details>
                        `;
                    }
                ).join('');
        }


    } catch (error) {

        console.error(
            '[Roadmap]',
            error
        );
    }
}


/* ============================================================
   INTERVIEW PREPARATION
   ============================================================ */

async function loadDynamicInterview() {

    const container =
        $('container-dynamic-interview');


    if (!container) {
        return;
    }


    if (
        !window.APP_STATE.targetRole
    ) {

        container.innerHTML =
            `
            <p>
                Select a job to generate interview preparation.
            </p>
            `;

        return;
    }


    const metrics =
        window.APP_STATE.latestMetrics ||
        {};


    const matchedSkills =
        Array.isArray(
            metrics.matched_skills
        )
            ? metrics.matched_skills
            : [];


    const missingSkills =
        Array.isArray(
            metrics.missing_skills
        )
            ? metrics.missing_skills
            : [];


    try {

        const result =
            await apiRequest(
                'get_interview',
                {
                    target_role:
                        window.APP_STATE.targetRole,

                    matched_skills:
                        matchedSkills,

                    missing_skills:
                        missingSkills
                }
            );


        if (
            result.status !==
            'success'
        ) {

            throw new Error(
                result.message ||
                'Interview preparation unavailable.'
            );
        }


        const prep =
            result.prep_data ||
            {};


        let html =
            '';


        if (
            Array.isArray(
                prep.technical_known
            ) &&
            prep.technical_known.length
        ) {

            html +=
                `
                <h3>
                    Technical Questions
                </h3>
                `;


            html +=
                prep.technical_known
                    .map(
                        function (item, index) {

                            return `
                                <details
                                    style="
                                        margin-bottom:10px;
                                    "
                                >

                                    <summary>
                                        Q${index + 1}:
                                        ${escapeHtml(
                                            item.q || ''
                                        )}
                                    </summary>

                                    <div
                                        style="
                                            padding:10px;
                                        "
                                    >

                                        <p>
                                            <strong>
                                                Answer:
                                            </strong>

                                            ${escapeHtml(
                                                item.a || ''
                                            )}
                                        </p>

                                        ${
                                            item.tip
                                                ? `
                                                <p>
                                                    <strong>
                                                        Tip:
                                                    </strong>
                                                    ${escapeHtml(
                                                        item.tip
                                                    )}
                                                </p>
                                                `
                                                : ''
                                        }

                                    </div>

                                </details>
                            `;
                        }
                    )
                    .join('');
        }


        if (
            Array.isArray(
                prep.gap_questions
            ) &&
            prep.gap_questions.length
        ) {

            html +=
                `
                <h3>
                    Skill Gap Questions
                </h3>
                `;


            html +=
                prep.gap_questions
                    .map(
                        function (item, index) {

                            return `
                                <details
                                    style="
                                        margin-bottom:10px;
                                    "
                                >

                                    <summary>
                                        Gap ${index + 1}:
                                        ${escapeHtml(
                                            item.q || ''
                                        )}
                                    </summary>

                                    <div
                                        style="
                                            padding:10px;
                                        "
                                    >

                                        <p>
                                            ${escapeHtml(
                                                item.a || ''
                                            )}
                                        </p>

                                        ${
                                            item.tip
                                                ? `
                                                <p>
                                                    Tip:
                                                    ${escapeHtml(
                                                        item.tip
                                                    )}
                                                </p>
                                                `
                                                : ''
                                        }

                                    </div>

                                </details>
                            `;
                        }
                    )
                    .join('');
        }


        if (
            Array.isArray(
                prep.behavioral
            ) &&
            prep.behavioral.length
        ) {

            html +=
                `
                <h3>
                    Behavioral Questions
                </h3>
                `;


            html +=
                prep.behavioral
                    .map(
                        function (item, index) {

                            return `
                                <details
                                    style="
                                        margin-bottom:10px;
                                    "
                                >

                                    <summary>
                                        HR Q${index + 1}:
                                        ${escapeHtml(
                                            item.q || ''
                                        )}
                                    </summary>

                                    <div
                                        style="
                                            padding:10px;
                                        "
                                    >

                                        <p>
                                            Framework:
                                            ${escapeHtml(
                                                item.framework || ''
                                            )}
                                        </p>

                                        <p>
                                            ${escapeHtml(
                                                item.guide || ''
                                            )}
                                        </p>

                                    </div>

                                </details>
                            `;
                        }
                    )
                    .join('');
        }


        container.innerHTML =
            html ||
            `
                <p>
                    No interview preparation data is available yet.
                </p>
            `;


    } catch (error) {

        console.error(
            '[Interview]',
            error
        );


        container.innerHTML =
            `
            <p>
                ${escapeHtml(
                    error.message ||
                    'Interview preparation could not be loaded.'
                )}
            </p>
            `;
    }
}


/* ============================================================
   AI INTERVIEW ASSISTANT
   ============================================================ */

function initAIInterviewAssistant() {

    const assistantTab =
        $('tab-btn-ai-assistant');

    const evaluatorTab =
        $('tab-btn-ai-evaluator');

    const questionsTab =
        $('tab-btn-ai-questions');


    const assistantPanel =
        $('subtab-ai-assistant');

    const evaluatorPanel =
        $('subtab-ai-evaluator');

    const questionsPanel =
        $('subtab-ai-questions');


    if (
        assistantTab &&
        evaluatorTab &&
        questionsTab &&
        assistantPanel &&
        evaluatorPanel &&
        questionsPanel
    ) {


        assistantTab.addEventListener(
            'click',
            function () {

                assistantTab.classList.add(
                    'active'
                );

                evaluatorTab.classList.remove(
                    'active'
                );

                questionsTab.classList.remove(
                    'active'
                );


                assistantPanel.style.display =
                    'block';

                evaluatorPanel.style.display =
                    'none';

                questionsPanel.style.display =
                    'none';
            }
        );


        evaluatorTab.addEventListener(
            'click',
            function () {

                evaluatorTab.classList.add(
                    'active'
                );

                assistantTab.classList.remove(
                    'active'
                );

                questionsTab.classList.remove(
                    'active'
                );


                evaluatorPanel.style.display =
                    'block';

                assistantPanel.style.display =
                    'none';

                questionsPanel.style.display =
                    'none';
            }
        );


        questionsTab.addEventListener(
            'click',
            function () {

                questionsTab.classList.add(
                    'active'
                );

                assistantTab.classList.remove(
                    'active'
                );

                evaluatorTab.classList.remove(
                    'active'
                );


                questionsPanel.style.display =
                    'block';

                assistantPanel.style.display =
                    'none';

                evaluatorPanel.style.display =
                    'none';
            }
        );
    }


    /* ========================================================
       AI ASSISTANT
       ======================================================== */

    const promptInput =
        $('input-ai-prompt');

    const promptButton =
        $('btn-submit-ai-prompt');

    const responseCard =
        $('ai-assistant-response-card');

    const responseTitle =
        $('ai-response-title');

    const responseBody =
        $('ai-response-body');


    async function executePrompt(
        text
    ) {

        if (!text) {
            return;
        }


        if (responseCard) {

            responseCard.style.display =
                'block';
        }


        if (responseTitle) {

            responseTitle.textContent =
                '⏳ Generating response...';
        }


        if (responseBody) {

            responseBody.innerHTML =
                '<p>Analyzing your question...</p>';
        }


        try {

            const result =
                await apiRequest(
                    'ask_interview_ai',
                    {
                        prompt:
                            text,

                        target_role:
                            window.APP_STATE.targetRole,

                        target_company:
                            window.APP_STATE.targetCompany
                    }
                );


            if (
                result.status !==
                'success'
            ) {

                throw new Error(
                    result.message ||
                    'AI response failed.'
                );
            }


            if (responseTitle) {

                responseTitle.textContent =
                    result.title ||
                    'Interview Guidance';
            }


            if (responseBody) {

                let html =
                    '';


                if (
                    Array.isArray(
                        result.advice_steps
                    )
                ) {

                    html +=
                        '<ul>';


                    result.advice_steps
                        .forEach(
                            function (step) {

                                html +=
                                    `
                                    <li>
                                        ${escapeHtml(step)}
                                    </li>
                                    `;
                            }
                        );


                    html +=
                        '</ul>';
                }


                if (
                    result.sample_question
                ) {

                    html +=
                        `
                        <h4>
                            Practice Question
                        </h4>

                        <p>
                            ${escapeHtml(
                                result.sample_question
                            )}
                        </p>
                        `;
                }


                if (
                    result.sample_answer
                ) {

                    html +=
                        `
                        <h4>
                            Answer Strategy
                        </h4>

                        <p>
                            ${escapeHtml(
                                result.sample_answer
                            )}
                        </p>
                        `;
                }


                responseBody.innerHTML =
                    html;
            }


        } catch (error) {

            console.error(
                '[AI Assistant]',
                error
            );


            if (responseTitle) {

                responseTitle.textContent =
                    'AI Assistant Error';
            }


            if (responseBody) {

                responseBody.innerHTML =
                    `
                    <p>
                        ${escapeHtml(
                            error.message
                        )}
                    </p>
                    `;
            }
        }
    }


    if (
        promptButton &&
        promptInput
    ) {

        promptButton.addEventListener(
            'click',
            function () {

                executePrompt(
                    promptInput.value.trim()
                );
            }
        );


        promptInput.addEventListener(
            'keydown',
            function (event) {

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


    /*
     * Preset buttons.
     */
    queryAll(
        '.ai-preset-btn'
    ).forEach(
        function (button) {

            button.addEventListener(
                'click',
                function () {

                    const text =
                        button.dataset.query ||
                        button.textContent.trim();


                    if (promptInput) {

                        promptInput.value =
                            text;
                    }


                    executePrompt(
                        text
                    );
                }
            );
        }
    );


    /* ========================================================
       ANSWER EVALUATOR
       ======================================================== */

    const evaluatorButton =
        $('btn-submit-eval-answer');


    if (evaluatorButton) {

        evaluatorButton.addEventListener(
            'click',
            async function () {

                const questionSelect =
                    $('select-eval-question');

                const customQuestion =
                    $('input-eval-custom-q');

                const answerInput =
                    $('input-eval-user-answer');


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


                const answer =
                    answerInput
                        ? answerInput.value.trim()
                        : '';


                if (!answer) {

                    alert(
                        'Please enter your answer.'
                    );

                    return;
                }


                const resultCard =
                    $('ai-evaluator-result-card');


                if (resultCard) {

                    resultCard.style.display =
                        'block';
                }


                try {

                    const result =
                        await apiRequest(
                            'evaluate_answer',
                            {
                                question:
                                    question,

                                user_answer:
                                    answer,

                                target_role:
                                    window.APP_STATE.targetRole
                            }
                        );


                    if (
                        result.status !==
                        'success'
                    ) {

                        throw new Error(
                            result.message ||
                            'Evaluation failed.'
                        );
                    }


                    if ($('eval-rating-badge')) {

                        $('eval-rating-badge')
                            .textContent =
                            result.rating ||
                            '';
                    }


                    if ($(
                        'eval-overall-score-display'
                    )) {

                        $('eval-overall-score-display')
                            .textContent =
                            `Overall Score: ${
                                result.total_score || 0
                            } / 100`;
                    }


                    const breakdown =
                        result.breakdown ||
                        {};


                    const scoreMap = {

                        'eval-score-tech':
                            breakdown.technical_accuracy,

                        'eval-score-kw':
                            breakdown.keywords_terminology,

                        'eval-score-struct':
                            breakdown.structure_clarity,

                        'eval-score-rel':
                            breakdown.real_world_relevance,

                        'eval-score-comp':
                            breakdown.completeness
                    };


                    Object.keys(
                        scoreMap
                    ).forEach(
                        function (id) {

                            const element =
                                $(id);

                            if (element) {

                                element.textContent =
                                    `${
                                        scoreMap[id] || 0
                                    } / 20`;
                            }
                        }
                    );


                    if (
                        $('eval-strengths-list')
                    ) {

                        $('eval-strengths-list')
                            .innerHTML =
                            (
                                result.strengths ||
                                []
                            )
                            .map(
                                function (item) {

                                    return `
                                        <li>
                                            ${escapeHtml(item)}
                                        </li>
                                    `;
                                }
                            )
                            .join('');
                    }


                    if (
                        $('eval-missing-list')
                    ) {

                        $('eval-missing-list')
                            .innerHTML =
                            (
                                result.missing_points ||
                                []
                            )
                            .map(
                                function (item) {

                                    return `
                                        <li>
                                            ${escapeHtml(item)}
                                        </li>
                                    `;
                                }
                            )
                            .join('');
                    }


                    if (
                        $('eval-ideal-answer')
                    ) {

                        $('eval-ideal-answer')
                            .textContent =
                            result.ideal_answer ||
                            '';
                    }


                } catch (error) {

                    console.error(
                        '[Evaluator]',
                        error
                    );


                    if (
                        $('eval-overall-score-display')
                    ) {

                        $('eval-overall-score-display')
                            .textContent =
                            error.message ||
                            'Evaluation failed.';
                    }
                }
            }
        );
    }


    /* ========================================================
       CUSTOM QUESTION VISIBILITY
       ======================================================== */

    const questionSelect =
        $('select-eval-question');

    const customQuestion =
        $('input-eval-custom-q');


    if (
        questionSelect &&
        customQuestion
    ) {

        questionSelect.addEventListener(
            'change',
            function () {

                customQuestion.style.display =
                    questionSelect.value ===
                    'custom'
                        ? 'block'
                        : 'none';
            }
        );
    }
}


/* ============================================================
   EXPORT SOME FUNCTIONS
   ============================================================ */

window.SkillGapPredictor = {

    scrapeCareerURL:
        scrapeCareerURL,

    recommendBestJob:
        recommendBestJob,

    applySelectedJob:
        applySelectedJob,

    loadDynamicJobs:
        loadDynamicJobs,

    loadDynamicRoadmap:
        loadDynamicRoadmap,

    loadDynamicInterview:
        loadDynamicInterview,

    fetchInitialMetrics:
        fetchInitialMetrics
};
