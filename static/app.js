/**
 * ============================================================
 * SKILL-GAP PREDICTOR
 * Frontend Application
 * ============================================================
 *
 * Dynamic Career URL -> Jobs -> Resume -> Skill Matching
 *
 * No predefined company/role is used as the active target.
 * Existing HTML/UI is preserved.
 * ============================================================
 */

(function () {
    "use strict";

    /* =========================================================
       GLOBAL STATE
       ========================================================= */

    window.APP_DATA = window.APP_DATA || {};

    window.EXTRACTED_SKILLS =
        Array.isArray(window.APP_DATA.extractedSkills)
            ? window.APP_DATA.extractedSkills
            : [];

    window.ATS_SCORE =
        window.APP_DATA.atsScore !== undefined &&
        window.APP_DATA.atsScore !== null
            ? window.APP_DATA.atsScore
            : null;

    window.TARGET_COMPANY =
        window.APP_DATA.targetCompany || "";

    window.TARGET_ROLE =
        window.APP_DATA.targetRole || "";

    window.REQUIRED_SKILLS =
        Array.isArray(window.APP_DATA.requiredSkills)
            ? window.APP_DATA.requiredSkills
            : [];

    window.CAREER_URL =
        window.APP_DATA.careerUrl || "";

    window.CAREER_JOBS =
        Array.isArray(window.APP_DATA.careerJobs)
            ? window.APP_DATA.careerJobs
            : [];

    window.RECOMMENDED_JOB =
        window.APP_DATA.recommendedJob || null;

    window.LATEST_METRICS = null;

    let radarChart = null;
    let pieChart = null;

    let currentRequestController = null;


    /* =========================================================
       DOM READY
       ========================================================= */

    document.addEventListener("DOMContentLoaded", function () {

        try {
            initializeBaseUI();
        } catch (error) {
            console.error("Base UI initialization error:", error);
        }

        try {
            initAuthTabs();
        } catch (error) {
            console.error("Authentication initialization error:", error);
        }

        /*
         * Everything below is dashboard-only.
         * This is important because the login page does not contain
         * dashboard elements.
         */
        if (document.querySelector(".app-container")) {

            try {
                initNavigation();
            } catch (error) {
                console.error("Navigation error:", error);
            }

            try {
                initTargetSystem();
            } catch (error) {
                console.error("Target system error:", error);
            }

            try {
                initCharts();
            } catch (error) {
                console.error("Chart initialization error:", error);
            }

            try {
                initSkillEditor();
            } catch (error) {
                console.error("Skill editor error:", error);
            }

            try {
                initResumeUpload();
            } catch (error) {
                console.error("Resume upload error:", error);
            }

            try {
                initJobRanking();
            } catch (error) {
                console.error("Job ranking error:", error);
            }

            try {
                initWebScraper();
            } catch (error) {
                console.error("Web scraper error:", error);
            }

            try {
                initProfileForm();
            } catch (error) {
                console.error("Profile form error:", error);
            }

            try {
                initAIInterviewAssistant();
            } catch (error) {
                console.error("Interview assistant error:", error);
            }

            try {
                initMobileSidebar();
            } catch (error) {
                console.error("Mobile sidebar error:", error);
            }

            try {
                initThemeToggle();
            } catch (error) {
                console.error("Theme initialization error:", error);
            }

            try {
                initializeDynamicTarget();
            } catch (error) {
                console.error("Dynamic target initialization error:", error);
            }
        }
    });


    /* =========================================================
       BASE UI
       ========================================================= */

    function initializeBaseUI() {

        injectRuntimeStyles();

        document.body.classList.add("sgp-page-ready");

        /*
         * Prevent accidental form submission reloads.
         */
        document.querySelectorAll("form").forEach(function (form) {
            form.setAttribute("novalidate", "false");
        });

        /*
         * Password visibility
         */
        initPasswordToggle(
            "login_password",
            "toggle-login-password"
        );

        initPasswordToggle(
            "signup_pwd",
            "toggle-signup-password"
        );

        /*
         * Signup terms checkbox.
         */
        const terms = document.getElementById("signup-terms");
        const signupButton = document.getElementById("btn-do-signup");

        if (terms && signupButton) {

            function updateSignupButton() {

                signupButton.disabled = !terms.checked;

                signupButton.style.opacity =
                    terms.checked ? "1" : "0.6";

                signupButton.style.cursor =
                    terms.checked ? "pointer" : "not-allowed";
            }

            terms.addEventListener(
                "change",
                updateSignupButton
            );

            updateSignupButton();
        }
    }


    /* =========================================================
       RUNTIME CSS
       ========================================================= */

    function injectRuntimeStyles() {

        if (document.getElementById("sgp-runtime-styles")) {
            return;
        }

        const style = document.createElement("style");

        style.id = "sgp-runtime-styles";

        style.textContent = `
            .sgp-page-ready {
                opacity: 0;
                transition: opacity .35s ease;
            }

            .sgp-page-ready.sgp-loaded {
                opacity: 1;
            }

            .sgp-loading {
                position: relative;
                pointer-events: none;
                opacity: .72;
            }

            .sgp-spinner {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid currentColor;
                border-right-color: transparent;
                border-radius: 50%;
                animation: sgpSpin .7s linear infinite;
                vertical-align: middle;
                margin-right: 8px;
            }

            @keyframes sgpSpin {
                to {
                    transform: rotate(360deg);
                }
            }

            .sgp-fade-in {
                animation: sgpFadeIn .35s ease both;
            }

            @keyframes sgpFadeIn {
                from {
                    opacity: 0;
                    transform: translateY(8px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .sgp-job-card {
                border: 1px solid rgba(99,102,241,.22);
                border-radius: 14px;
                padding: 16px;
                margin-top: 12px;
                background: rgba(15,23,42,.42);
                transition: transform .2s ease, box-shadow .2s ease;
            }

            .sgp-job-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 30px rgba(0,0,0,.15);
            }

            .sgp-recommendation {
                border: 1px solid rgba(16,185,129,.4);
                background: rgba(16,185,129,.08);
                border-radius: 14px;
                padding: 18px;
                margin-top: 16px;
                animation: sgpFadeIn .4s ease;
            }

            .sgp-score {
                font-size: 28px;
                font-weight: 800;
                color: var(--cyan-light, #38bdf8);
            }

            .sgp-empty {
                padding: 20px;
                text-align: center;
                color: var(--text-muted, #94a3b8);
            }

            .sgp-mobile-menu-button {
                position: fixed;
                top: 14px;
                left: 14px;
                z-index: 10001;
                width: 44px;
                height: 44px;
                border: 0;
                border-radius: 12px;
                background: rgba(99,102,241,.95);
                color: white;
                font-size: 22px;
                cursor: pointer;
                box-shadow: 0 8px 24px rgba(0,0,0,.2);
                display: none;
            }

            .sgp-mobile-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,.55);
                z-index: 9998;
                display: none;
                backdrop-filter: blur(3px);
            }

            .sgp-mobile-overlay.active {
                display: block;
            }

            @media (max-width: 900px) {

                .sgp-mobile-menu-button {
                    display: block;
                }

                .sidebar {
                    transform: translateX(-105%);
                    transition: transform .3s ease;
                    z-index: 10000 !important;
                }

                .sidebar.sgp-mobile-open {
                    transform: translateX(0);
                }
            }

            body.light-theme {
                --bg-main: #f4f7fb;
                --bg-card: #ffffff;
                --bg-panel: #ffffff;
                --text-main: #172033;
                --text-muted: #64748b;
                --text-subtle: #94a3b8;
                --border-color: rgba(100,116,139,.20);
            }

            body.light-theme {
                background: #f4f7fb !important;
                color: #172033 !important;
            }

            body.light-theme .section-panel,
            body.light-theme .metric-card-container,
            body.light-theme .chart-card,
            body.light-theme .auth-card {
                background: #ffffff !important;
                color: #172033;
            }

            body.light-theme .form-control {
                background: #ffffff !important;
                color: #172033 !important;
                border-color: rgba(100,116,139,.25) !important;
            }

            body.light-theme .sgp-job-card {
                background: #f8fafc;
            }

            body.light-theme .main-content {
                background: #f4f7fb;
            }

            #career-url-panel {
                animation: sgpFadeIn .35s ease;
            }

            #career-url-panel input {
                width: 100%;
                box-sizing: border-box;
            }

            .sgp-target-pill {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 7px 11px;
                border-radius: 999px;
                background: rgba(56,189,248,.10);
                color: var(--cyan-light, #38bdf8);
                font-size: 12px;
                font-weight: 700;
                margin-top: 8px;
            }
        `;

        document.head.appendChild(style);

        requestAnimationFrame(function () {
            document.body.classList.add("sgp-loaded");
        });
    }


    /* =========================================================
       PASSWORD TOGGLE
       ========================================================= */

    function initPasswordToggle(inputId, buttonId) {

        const input = document.getElementById(inputId);
        const button = document.getElementById(buttonId);

        if (!input || !button) {
            return;
        }

        button.addEventListener("click", function () {

            if (input.type === "password") {
                input.type = "text";
                button.textContent = "🙈";
            } else {
                input.type = "password";
                button.textContent = "👁️";
            }
        });
    }


    /* =========================================================
       API HELPER
       ========================================================= */

    async function apiRequest(action, fields = {}, timeout = 60000) {

        if (currentRequestController) {
            /*
             * Do not abort every request globally.
             * The controller is only cleared after request completion.
             */
        }

        const controller = new AbortController();

        currentRequestController = controller;

        const timer = setTimeout(function () {
            controller.abort();
        }, timeout);

        const formData = new FormData();

        formData.append("action", action);

        Object.keys(fields).forEach(function (key) {

            let value = fields[key];

            if (value === undefined || value === null) {
                value = "";
            }

            if (
                typeof value === "object" &&
                !(value instanceof File) &&
                !(value instanceof Blob)
            ) {
                value = JSON.stringify(value);
            }

            formData.append(key, value);
        });

        try {

            const response = await fetch(
                "api.php",
                {
                    method: "POST",
                    body: formData,
                    credentials: "same-origin",
                    cache: "no-store",
                    signal: controller.signal,
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

            const text = await response.text();

            let json;

            try {
                json = JSON.parse(text);
            } catch (parseError) {

                console.error(
                    "API returned non-JSON response:",
                    text
                );

                throw new Error(
                    "Server returned an invalid response. Check the Render logs for PHP errors."
                );
            }

            if (!response.ok) {

                throw new Error(
                    json.message ||
                    "Server request failed."
                );
            }

            return json;

        } catch (error) {

            if (error.name === "AbortError") {

                throw new Error(
                    "Request timed out. Please check the server and try again."
                );
            }

            throw error;

        } finally {

            clearTimeout(timer);

            if (currentRequestController === controller) {
                currentRequestController = null;
            }
        }
    }


    /* =========================================================
       AUTHENTICATION
       ========================================================= */

    function initAuthTabs() {

        const tabLogin =
            document.getElementById("tab-btn-login");

        const tabSignup =
            document.getElementById("tab-btn-signup");

        const formLogin =
            document.getElementById("form-login-box");

        const formSignup =
            document.getElementById("form-signup-box");


        function showLogin() {

            if (tabLogin) {
                tabLogin.classList.add("active");
            }

            if (tabSignup) {
                tabSignup.classList.remove("active");
            }

            if (formLogin) {
                formLogin.style.display = "block";
            }

            if (formSignup) {
                formSignup.style.display = "none";
            }
        }


        function showSignup() {

            if (tabSignup) {
                tabSignup.classList.add("active");
            }

            if (tabLogin) {
                tabLogin.classList.remove("active");
            }

            if (formSignup) {
                formSignup.style.display = "block";
            }

            if (formLogin) {
                formLogin.style.display = "none";
            }
        }


        if (tabLogin) {
            tabLogin.addEventListener(
                "click",
                showLogin
            );
        }

        if (tabSignup) {
            tabSignup.addEventListener(
                "click",
                showSignup
            );
        }


        /* -----------------------------------------------------
           LOGIN
           ----------------------------------------------------- */

        const loginButton =
            document.getElementById("btn-do-login");

        if (loginButton) {

            loginButton.addEventListener(
                "click",
                async function (event) {

                    event.preventDefault();

                    const emailInput =
                        document.getElementById("login_email");

                    const passwordInput =
                        document.getElementById("login_password");

                    const errorBox =
                        document.getElementById("login-error-msg");

                    if (!emailInput || !passwordInput) {
                        return;
                    }

                    const email =
                        emailInput.value.trim();

                    const password =
                        passwordInput.value;

                    if (!email || !password) {

                        showMessage(
                            errorBox,
                            "Please enter both email and password.",
                            "error"
                        );

                        return;
                    }


                    setButtonLoading(
                        loginButton,
                        true,
                        "Signing In..."
                    );


                    try {

                        const json =
                            await apiRequest(
                                "login",
                                {
                                    email: email,
                                    password: password
                                },
                                30000
                            );


                        if (
                            json &&
                            json.status === "success"
                        ) {

                            showMessage(
                                errorBox,
                                "Login successful. Opening your dashboard...",
                                "success"
                            );


                            /*
                             * Give the browser enough time to receive
                             * the PHP session cookie before navigation.
                             */
                            setTimeout(
                                function () {

                                    const separator =
                                        window.location.pathname.indexOf("?") >= 0
                                            ? "&"
                                            : "?";

                                    window.location.replace(
                                        window.location.pathname +
                                        separator +
                                        "dashboard=" +
                                        Date.now()
                                    );

                                },
                                250
                            );

                        } else {

                            showMessage(
                                errorBox,
                                json.message ||
                                "Login failed.",
                                "error"
                            );

                            setButtonLoading(
                                loginButton,
                                false,
                                "🚀 Log In to My Dashboard"
                            );
                        }

                    } catch (error) {

                        console.error(
                            "Login error:",
                            error
                        );

                        showMessage(
                            errorBox,
                            error.message ||
                            "Unable to connect to the server.",
                            "error"
                        );

                        setButtonLoading(
                            loginButton,
                            false,
                            "🚀 Log In to My Dashboard"
                        );
                    }
                }
            );
        }


        /* -----------------------------------------------------
           SIGNUP
           ----------------------------------------------------- */

        const signupButton =
            document.getElementById("btn-do-signup");

        if (signupButton) {

            signupButton.addEventListener(
                "click",
                async function (event) {

                    event.preventDefault();

                    const name =
                        getValue("signup_name");

                    const email =
                        getValue("signup_email");

                    const password =
                        getValue("signup_pwd");

                    const university =
                        getValue("signup_uni");

                    /*
                     * Current HTML uses signup_branch for Degree
                     * and signup_major for Branch.
                     */
                    const branch =
                        getValue("signup_major") ||
                        getValue("signup_branch");

                    const year =
                        getValue("signup_gradyear") ||
                        getValue("signup_year");

                    const linkedin =
                        getValue("signup_linkedin");

                    const github =
                        getValue("signup_github");

                    const terms =
                        document.getElementById("signup-terms");

                    const errorBox =
                        document.getElementById(
                            "signup-error-msg"
                        );

                    const successBox =
                        document.getElementById(
                            "signup-success-msg"
                        );


                    if (
                        terms &&
                        !terms.checked
                    ) {

                        showMessage(
                            errorBox,
                            "Please accept the Terms of Service and Privacy Policy.",
                            "error"
                        );

                        return;
                    }


                    if (
                        !name ||
                        !email ||
                        !password
                    ) {

                        showMessage(
                            errorBox,
                            "Please fill in all required fields.",
                            "error"
                        );

                        return;
                    }


                    const passwordPattern =
                        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;


                    if (!passwordPattern.test(password)) {

                        showMessage(
                            errorBox,
                            "Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.",
                            "error"
                        );

                        return;
                    }


                    setButtonLoading(
                        signupButton,
                        true,
                        "Creating Account..."
                    );


                    try {

                        const json =
                            await apiRequest(
                                "signup",
                                {
                                    name: name,
                                    email: email,
                                    password: password,
                                    university: university,
                                    branch: branch,
                                    graduation_year: year,
                                    linkedin: linkedin,
                                    github: github
                                },
                                30000
                            );


                        if (
                            json &&
                            json.status === "success"
                        ) {

                            showMessage(
                                successBox,
                                json.message ||
                                "Account created successfully.",
                                "success"
                            );

                            if (errorBox) {
                                errorBox.style.display = "none";
                            }


                            setButtonLoading(
                                signupButton,
                                false,
                                "✨ Register Account"
                            );


                            setTimeout(
                                function () {
                                    showLogin();
                                },
                                1000
                            );

                        } else {

                            showMessage(
                                errorBox,
                                json.message ||
                                "Registration failed.",
                                "error"
                            );

                            setButtonLoading(
                                signupButton,
                                false,
                                "✨ Register Account"
                            );
                        }

                    } catch (error) {

                        console.error(
                            "Signup error:",
                            error
                        );

                        showMessage(
                            errorBox,
                            error.message ||
                            "Registration failed.",
                            "error"
                        );

                        setButtonLoading(
                            signupButton,
                            false,
                            "✨ Register Account"
                        );
                    }
                }
            );
        }


        /* -----------------------------------------------------
           LOGOUT
           ----------------------------------------------------- */

        const logoutButton =
            document.getElementById("btn-logout");

        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                async function () {

                    setButtonLoading(
                        logoutButton,
                        true,
                        "Logging Out..."
                    );

                    try {

                        await apiRequest(
                            "logout",
                            {},
                            15000
                        );

                    } catch (error) {

                        console.warn(
                            "Logout request error:",
                            error
                        );

                    } finally {

                        window.location.replace(
                            window.location.pathname +
                            "?logout=" +
                            Date.now()
                        );
                    }
                }
            );
        }
    }


    /* =========================================================
       SIDEBAR NAVIGATION
       ========================================================= */

    function initNavigation() {

        const navItems =
            document.querySelectorAll(
                ".nav-item"
            );

        const views =
            document.querySelectorAll(
                ".view-panel"
            );


        navItems.forEach(function (item) {

            item.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    const targetId =
                        item.getAttribute(
                            "data-view"
                        );

                    if (!targetId) {
                        return;
                    }


                    navItems.forEach(
                        function (nav) {
                            nav.classList.remove(
                                "active"
                            );
                        }
                    );


                    views.forEach(
                        function (view) {
                            view.style.display =
                                "none";
                        }
                    );


                    item.classList.add("active");


                    const target =
                        document.getElementById(
                            targetId
                        );


                    if (target) {

                        target.style.display =
                            "block";

                        target.classList.remove(
                            "sgp-fade-in"
                        );

                        void target.offsetWidth;

                        target.classList.add(
                            "sgp-fade-in"
                        );
                    }


                    closeMobileSidebar();


                    if (
                        targetId ===
                        "view-roadmap"
                    ) {
                        loadDynamicRoadmap();
                    }


                    if (
                        targetId ===
                        "view-interview"
                    ) {
                        loadDynamicInterview();
                    }


                    if (
                        targetId ===
                        "view-jobranking"
                    ) {
                        refreshJobRanking();
                    }
                }
            );
        });
    }


    /* =========================================================
       DYNAMIC TARGET SYSTEM
       ========================================================= */

    function initTargetSystem() {

        /*
         * Old benchmark/company controls are not used for
         * recommendation anymore.
         *
         * Keep the existing UI but hide the old selector so
         * predefined companies cannot become the active target.
         */

        const benchmarkMode =
            document.getElementById(
                "mode-benchmark"
            );

        const customMode =
            document.getElementById(
                "mode-custom"
            );

        const benchmarkBox =
            document.getElementById(
                "box-benchmark-select"
            );

        const customBox =
            document.getElementById(
                "box-custom-select"
            );


        if (benchmarkMode) {
            benchmarkMode.checked = false;
        }

        if (benchmarkBox) {
            benchmarkBox.style.display =
                "none";
        }

        if (customBox) {
            customBox.style.display =
                "none";
        }


        /*
         * Hide the old "Top Tech / Custom" row.
         */
        const companyMode =
            document.querySelector(
                'input[name="company_mode"]'
            );

        if (companyMode) {

            const modeContainer =
                companyMode.closest("div");

            if (modeContainer) {
                modeContainer.style.display =
                    "none";
            }
        }


        createCareerURLPanel();


        /*
         * Existing scrape box is still useful.
         * We connect it to the same dynamic system.
         */
    }


    function createCareerURLPanel() {

        if (
            document.getElementById(
                "career-url-panel"
            )
        ) {
            return;
        }


        const sidebar =
            document.querySelector(
                ".sidebar"
            );

        if (!sidebar) {
            return;
        }


        const panel =
            document.createElement("div");

        panel.id =
            "career-url-panel";

        panel.style.cssText =
            "margin-bottom:20px;padding:14px;border-radius:14px;background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.20);";


        panel.innerHTML = `
            <div style="
                font-weight:800;
                color:var(--cyan-light);
                margin-bottom:8px;
                font-size:14px;
            ">
                🎯 Dynamic Career Target
            </div>

            <div style="
                font-size:11px;
                color:var(--text-muted);
                margin-bottom:10px;
                line-height:1.5;
            ">
                Enter a company's career or jobs URL.
                The system will discover available roles
                and compare them with your resume.
            </div>

            <input
                type="url"
                id="career-url-input"
                class="form-control"
                placeholder="https://company.com/careers"
                value="${escapeHtml(window.CAREER_URL)}"
                style="margin-bottom:8px;"
            >

            <button
                type="button"
                id="career-url-analyze"
                class="btn btn-block"
                style="font-size:12px;padding:9px;"
            >
                🔎 Analyze Career URL
            </button>

            <div
                id="career-url-status"
                style="
                    display:none;
                    margin-top:9px;
                    font-size:11px;
                    line-height:1.5;
                "
            ></div>
        `;


        const nav =
            sidebar.querySelector(
                ".nav-menu"
            );


        if (nav) {
            sidebar.insertBefore(
                panel,
                nav
            );
        } else {
            sidebar.appendChild(panel);
        }


        const button =
            document.getElementById(
                "career-url-analyze"
            );

        if (button) {

            button.addEventListener(
                "click",
                async function () {

                    const input =
                        document.getElementById(
                            "career-url-input"
                        );

                    if (!input) {
                        return;
                    }

                    await scrapeCareerURL(
                        input.value.trim()
                    );
                }
            );
        }
    }


    function initializeDynamicTarget() {

        /*
         * Restore dynamic target from session data.
         * Never invent a target.
         */

        updateTargetDisplay();


        /*
         * If jobs were already returned by PHP,
         * use them immediately.
         */

        if (
            Array.isArray(
                window.CAREER_JOBS
            ) &&
            window.CAREER_JOBS.length
        ) {

            const recommendation =
                chooseBestJob(
                    window.CAREER_JOBS
                );

            if (recommendation) {

                applyJobRecommendation(
                    recommendation,
                    false
                );

                return;
            }
        }


        /*
         * If a career URL exists but jobs were not
         * embedded in APP_DATA, ask the backend for
         * the current session jobs.
         */

        if (window.CAREER_URL) {

            refreshDynamicJobsFromSession();
        } else {

            /*
             * Do not call get_metrics here.
             * There is no valid job yet.
             */
            updateEmptyDashboardState();
        }
    }


    async function refreshDynamicJobsFromSession() {

        try {

            const json =
                await apiRequest(
                    "rank_jobs",
                    {
                        domain_filter:
                            "All Domains"
                    },
                    45000
                );


            if (
                json &&
                json.status === "success" &&
                Array.isArray(json.jobs)
            ) {

                window.CAREER_JOBS =
                    normalizeJobs(
                        json.jobs
                    );


                const recommendation =
                    chooseBestJob(
                        window.CAREER_JOBS
                    );


                if (recommendation) {

                    applyJobRecommendation(
                        recommendation,
                        false
                    );
                }

                renderJobTable(
                    window.CAREER_JOBS,
                    ""
                );

            } else {

                updateEmptyDashboardState();
            }

        } catch (error) {

            console.warn(
                "Could not restore career jobs:",
                error
            );

            updateEmptyDashboardState();
        }
    }


    function updateTargetDisplay() {

        const banner =
            document.getElementById(
                "banner-company-role"
            );


        if (!banner) {
            return;
        }


        if (
            window.TARGET_ROLE
        ) {

            const company =
                window.TARGET_COMPANY ||
                "Selected Career Page";


            banner.textContent =
                company +
                " · " +
                window.TARGET_ROLE;

        } else {

            banner.textContent =
                "Dynamic Career Target";
        }
    }


    function updateEmptyDashboardState() {

        const banner =
            document.getElementById(
                "banner-company-role"
            );

        if (banner) {
            banner.textContent =
                "Add a Career URL to Find Your Best Role";
        }


        setText(
            "metric-ats",
            window.ATS_SCORE !== null
                ? window.ATS_SCORE
                : "—"
        );

        setText(
            "metric-readiness",
            "—"
        );

        setText(
            "metric-confidence",
            "—"
        );

        setText(
            "metric-strength",
            "Waiting"
        );


        const matched =
            document.getElementById(
                "matched-skills-tags"
            );

        const missing =
            document.getElementById(
                "missing-skills-tags"
            );


        if (matched) {

            matched.innerHTML =
                `<p class="sgp-empty">
                    Add a career URL and upload your resume
                    to calculate the match.
                </p>`;
        }


        if (missing) {

            missing.innerHTML =
                `<p class="sgp-empty">
                    Job requirements will appear here
                    after career URL analysis.
                </p>`;
        }
    }


    /* =========================================================
       CAREER URL SCRAPING
       ========================================================= */

    function initWebScraper() {

        const button =
            document.getElementById(
                "btn-scrape-url"
            );


        if (!button) {
            return;
        }


        /*
         * Prevent duplicate listeners.
         */
        if (
            button.dataset.sgpBound === "1"
        ) {
            return;
        }

        button.dataset.sgpBound = "1";


        button.addEventListener(
            "click",
            async function () {

                const input =
                    document.getElementById(
                        "input-scrape-url"
                    );

                if (!input) {
                    return;
                }

                await scrapeCareerURL(
                    input.value.trim()
                );
            }
        );
    }


    async function scrapeCareerURL(url) {

        const sidebarStatus =
            document.getElementById(
                "career-url-status"
            );

        const resultBox =
            document.getElementById(
                "scrape-results-box"
            );

        const scrapeButton =
            document.getElementById(
                "btn-scrape-url"
            );


        if (!url) {

            showScrapeStatus(
                "Please enter a career or jobs URL.",
                "error"
            );

            return;
        }


        try {

            new URL(url);

        } catch (error) {

            showScrapeStatus(
                "Please enter a valid URL beginning with http:// or https://.",
                "error"
            );

            return;
        }


        setButtonLoading(
            scrapeButton,
            true,
            "Analyzing..."
        );


        if (sidebarStatus) {

            sidebarStatus.style.display =
                "block";

            sidebarStatus.innerHTML =
                `<span class="sgp-spinner"></span>
                 Reading career page and discovering jobs...`;
        }


        if (resultBox) {

            resultBox.style.display =
                "block";

            resultBox.className =
                "alert alert-info";

            resultBox.innerHTML =
                `<span class="sgp-spinner"></span>
                 Extracting available job roles and requirements...`;
        }


        try {

            const json =
                await apiRequest(
                    "scrape_url",
                    {
                        url: url
                    },
                    90000
                );


            if (
                !json ||
                json.status !== "success"
            ) {

                throw new Error(
                    json.message ||
                    json.error ||
                    "Unable to analyze the career URL."
                );
            }


            window.CAREER_URL =
                url;


            window.CAREER_JOBS =
                normalizeJobs(
                    json.jobs || []
                );


            if (
                !window.CAREER_JOBS.length
            ) {

                const message =
                    "The page was reached, but no structured job listings were detected. Try a specific jobs/careers page or job listing URL.";

                if (resultBox) {

                    resultBox.className =
                        "alert alert-error";

                    resultBox.textContent =
                        message;
                }

                if (sidebarStatus) {
                    sidebarStatus.textContent =
                        message;
                }

                return;
            }


            const recommendation =
                chooseBestJob(
                    window.CAREER_JOBS
                );


            if (recommendation) {

                applyJobRecommendation(
                    recommendation,
                    true
                );
            }


            renderCareerScrapeResults(
                window.CAREER_JOBS,
                recommendation,
                json
            );


            renderJobTable(
                window.CAREER_JOBS,
                ""
            );


            if (sidebarStatus) {

                sidebarStatus.innerHTML =
                    `<strong>${window.CAREER_JOBS.length}</strong>
                     job role(s) discovered.`;
            }

        } catch (error) {

            console.error(
                "Career URL error:",
                error
            );


            if (resultBox) {

                resultBox.className =
                    "alert alert-error";

                resultBox.textContent =
                    error.message ||
                    "Failed to analyze the career URL.";
            }


            if (sidebarStatus) {

                sidebarStatus.style.display =
                    "block";

                sidebarStatus.textContent =
                    error.message ||
                    "Failed to analyze the career URL.";
            }

        } finally {

            setButtonLoading(
                scrapeButton,
                false,
                "Fetch & Analyze URL"
            );

            const careerButton =
                document.getElementById(
                    "career-url-analyze"
                );

            if (careerButton) {

                careerButton.disabled =
                    false;

                careerButton.innerHTML =
                    "🔎 Analyze Career URL";
            }
        }
    }


    function showScrapeStatus(
        message,
        type
    ) {

        const box =
            document.getElementById(
                "scrape-results-box"
            );

        if (!box) {
            return;
        }


        box.style.display =
            "block";

        box.className =
            type === "error"
                ? "alert alert-error"
                : "alert alert-info";

        box.textContent =
            message;
    }


    function renderCareerScrapeResults(
        jobs,
        recommendation,
        rawResponse
    ) {

        const box =
            document.getElementById(
                "scrape-results-box"
            );

        if (!box) {
            return;
        }


        let html = "";


        html += `
            <div class="sgp-fade-in">
                <strong>Career page analyzed successfully.</strong>
                <div style="margin-top:6px;">
                    ${jobs.length} job role(s) discovered.
                </div>
        `;


        if (recommendation) {

            html += `
                <div class="sgp-recommendation">
                    <div style="
                        font-size:12px;
                        color:var(--text-muted);
                        margin-bottom:6px;
                    ">
                        BEST RESUME MATCH
                    </div>

                    <div style="
                        font-size:20px;
                        font-weight:800;
                    ">
                        ${escapeHtml(
                            recommendation.role ||
                            "Job Role"
                        )}
                    </div>

                    ${
                        recommendation.company
                            ? `<div style="
                                margin-top:4px;
                                color:var(--text-muted);
                            ">
                                ${escapeHtml(
                                    recommendation.company
                                )}
                               </div>`
                            : ""
                    }

                    <div class="sgp-score">
                        ${Number(
                            recommendation.match_pct || 0
                        ).toFixed(1)}%
                    </div>

                    <div style="
                        color:var(--text-muted);
                        font-size:12px;
                    ">
                        Resume skill match
                    </div>

                    <button
                        type="button"
                        class="btn"
                        id="btn-use-recommended-job"
                        style="margin-top:12px;"
                    >
                        🎯 Use This Role
                    </button>
                </div>
            `;
        }


        html += `
            <div style="
                margin-top:16px;
                font-weight:700;
            ">
                Discovered Roles
            </div>
        `;


        jobs.slice(0, 10).forEach(
            function (job, index) {

                html += `
                    <div class="sgp-job-card">
                        <div style="
                            display:flex;
                            justify-content:space-between;
                            gap:12px;
                        ">
                            <div>
                                <strong>
                                    ${escapeHtml(
                                        job.role ||
                                        "Untitled Role"
                                    )}
                                </strong>

                                ${
                                    job.company
                                        ? `<div style="
                                            color:var(--text-muted);
                                            font-size:12px;
                                            margin-top:4px;
                                        ">
                                            ${escapeHtml(
                                                job.company
                                            )}
                                           </div>`
                                        : ""
                                }
                            </div>

                            <div style="
                                font-weight:800;
                                color:var(--cyan-light);
                            ">
                                ${Number(
                                    job.match_pct || 0
                                ).toFixed(1)}%
                            </div>
                        </div>

                        ${
                            Array.isArray(
                                job.required_skills
                            ) &&
                            job.required_skills.length
                                ? `<div style="
                                    margin-top:9px;
                                    font-size:11px;
                                    color:var(--text-muted);
                                  ">
                                    Skills:
                                    ${escapeHtml(
                                        job.required_skills.join(
                                            ", "
                                        )
                                    )}
                                  </div>`
                                : ""
                        }

                        ${
                            job.url
                                ? `<a
                                    href="${escapeAttribute(
                                        job.url
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="extracted-link"
                                    style="
                                        display:inline-block;
                                        margin-top:9px;
                                    "
                                  >
                                    View Job ↗
                                  </a>`
                                : ""
                        }
                    </div>
                `;
            }
        );


        html += `</div>`;


        box.className =
            "alert alert-success";

        box.innerHTML =
            html;


        const useButton =
            document.getElementById(
                "btn-use-recommended-job"
            );


        if (useButton && recommendation) {

            useButton.addEventListener(
                "click",
                function () {

                    applyJobRecommendation(
                        recommendation,
                        true
                    );

                    scrollToView(
                        "view-skillgap"
                    );
                }
            );
        }
    }


    /* =========================================================
       JOB NORMALIZATION + RECOMMENDATION
       ========================================================= */

    function normalizeJobs(jobs) {

        if (!Array.isArray(jobs)) {
            return [];
        }


        return jobs
            .map(function (job) {

                if (!job || typeof job !== "object") {
                    return null;
                }


                const company =
                    job.company ||
                    job.employer ||
                    job.company_name ||
                    "";


                const role =
                    job.role ||
                    job.title ||
                    job.job_title ||
                    job.position ||
                    "";


                const requiredSkills =
                    normalizeSkills(
                        job.required_skills ||
                        job.skills ||
                        job.requirements ||
                        []
                    );


                const url =
                    job.url ||
                    job.link ||
                    job.job_url ||
                    "";


                const description =
                    job.description ||
                    job.text ||
                    "";


                return {
                    company:
                        String(company).trim(),

                    role:
                        String(role).trim(),

                    required_skills:
                        requiredSkills,

                    url:
                        String(url).trim(),

                    description:
                        String(description).trim(),

                    domain:
                        String(
                            job.domain || ""
                        ).trim(),

                    match_pct:
                        Number(
                            job.match_pct ||
                            job.match_percentage ||
                            job.score ||
                            0
                        ),

                    matched_skills:
                        normalizeSkills(
                            job.matched_skills ||
                            job.matched ||
                            []
                        ),

                    missing_skills:
                        normalizeSkills(
                            job.missing_skills ||
                            job.missing ||
                            []
                        )
                };

            })
            .filter(function (job) {

                return job &&
                    (
                        job.role ||
                        job.required_skills.length
                    );
            });
    }


    function chooseBestJob(jobs) {

        const normalized =
            normalizeJobs(jobs);


        if (!normalized.length) {
            return null;
        }


        const resumeSkills =
            normalizeSkills(
                window.EXTRACTED_SKILLS
            );


        /*
         * Without a resume, we cannot honestly say
         * which role is the best match.
         */
        if (!resumeSkills.length) {

            return null;
        }


        const scored =
            normalized.map(
                function (job) {

                    const required =
                        normalizeSkills(
                            job.required_skills
                        );


                    if (!required.length) {

                        return {
                            ...job,
                            match_pct: 0,
                            matched_skills: [],
                            missing_skills: []
                        };
                    }


                    const matched = [];


                    required.forEach(
                        function (requiredSkill) {

                            const found =
                                resumeSkills.some(
                                    function (resumeSkill) {

                                        return skillsEquivalent(
                                            resumeSkill,
                                            requiredSkill
                                        );
                                    }
                                );


                            if (found) {
                                matched.push(
                                    requiredSkill
                                );
                            }
                        }
                    );


                    const missing =
                        required.filter(
                            function (skill) {
                                return !matched.includes(
                                    skill
                                );
                            }
                        );


                    const percentage =
                        (
                            matched.length /
                            required.length
                        ) * 100;


                    return {
                        ...job,

                        match_pct:
                            percentage,

                        matched_skills:
                            matched,

                        missing_skills:
                            missing
                    };
                }
            );


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

                return (
                    b.matched_skills.length -
                    a.matched_skills.length
                );
            }
        );


        return scored[0] || null;
    }


    function applyJobRecommendation(
        job,
        fetchNow
    ) {

        if (!job) {
            return;
        }


        window.TARGET_COMPANY =
            job.company || "";

        window.TARGET_ROLE =
            job.role || "";

        window.REQUIRED_SKILLS =
            normalizeSkills(
                job.required_skills
            );


        window.RECOMMENDED_JOB =
            job;


        updateTargetDisplay();


        /*
         * Update APP_DATA so all later modules see
         * the same dynamic target.
         */
        window.APP_DATA.targetCompany =
            window.TARGET_COMPANY;

        window.APP_DATA.targetRole =
            window.TARGET_ROLE;

        window.APP_DATA.requiredSkills =
            window.REQUIRED_SKILLS;

        window.APP_DATA.recommendedJob =
            job;


        /*
         * Send selected dynamic target to PHP session.
         * get_metrics performs that synchronization.
         */
        if (fetchNow !== false) {

            fetchMetrics();
        }
    }


    /* =========================================================
       METRICS
       ========================================================= */

    async function fetchMetrics() {

        /*
         * No job = no metrics.
         */
        if (
            !window.TARGET_ROLE ||
            !window.REQUIRED_SKILLS.length
        ) {

            updateEmptyDashboardState();

            return null;
        }


        try {

            const json =
                await apiRequest(
                    "get_metrics",
                    {
                        target_company:
                            window.TARGET_COMPANY,

                        target_role:
                            window.TARGET_ROLE,

                        required_skills:
                            window.REQUIRED_SKILLS
                    },
                    45000
                );


            if (
                !json ||
                json.status === "error"
            ) {

                console.warn(
                    "Metrics unavailable:",
                    json
                );

                return null;
            }


            window.LATEST_METRICS =
                json;


            /*
             * Use only real returned values.
             */
            updateMetricDisplay(
                json
            );


            updateSkillTags(
                json.matched_skills || [],
                json.missing_skills || []
            );


            updateCharts(
                json
            );


            return json;

        } catch (error) {

            console.error(
                "Metrics error:",
                error
            );

            return null;
        }
    }


    function updateMetricDisplay(data) {

        setText(
            "metric-ats",
            data.ats_score !== null &&
            data.ats_score !== undefined
                ? data.ats_score
                : "—"
        );


        setText(
            "metric-readiness",
            data.readiness_pct !== undefined &&
            data.readiness_pct !== null
                ? `${Number(
                    data.readiness_pct
                ).toFixed(1)}%`
                : "—"
        );


        setText(
            "metric-confidence",
            data.confidence_pct !== undefined &&
            data.confidence_pct !== null
                ? `${Number(
                    data.confidence_pct
                ).toFixed(1)}%`
                : "—"
        );


        const strength =
            document.getElementById(
                "metric-strength"
            );


        if (strength) {

            strength.textContent =
                data.strength_label ||
                "—";

            if (data.strength_color) {

                strength.style.color =
                    data.strength_color;
            }
        }


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


        const total =
            window.REQUIRED_SKILLS.length ||
            (
                matched.length +
                missing.length
            );


        setText(
            "metric-matched-count",
            `${matched.length} of ${total} Skills Matched`
        );
    }


    function updateSkillTags(
        matchedSkills,
        missingSkills
    ) {

        const matchedBox =
            document.getElementById(
                "matched-skills-tags"
            );

        const missingBox =
            document.getElementById(
                "missing-skills-tags"
            );


        if (matchedBox) {

            if (matchedSkills.length) {

                matchedBox.innerHTML =
                    matchedSkills.map(
                        function (skill) {

                            return `
                                <span class="skill-tag-matched">
                                    ${escapeHtml(
                                        skill
                                    )}
                                </span>
                            `;
                        }
                    ).join("");

            } else {

                matchedBox.innerHTML =
                    `<p class="sgp-empty">
                        No matching skills detected.
                    </p>`;
            }
        }


        if (missingBox) {

            if (missingSkills.length) {

                missingBox.innerHTML =
                    missingSkills.map(
                        function (skill) {

                            return `
                                <span class="skill-tag-missing">
                                    ${escapeHtml(
                                        skill
                                    )}
                                </span>
                            `;
                        }
                    ).join("");

            } else {

                missingBox.innerHTML =
                    `<p style="color:var(--emerald,#10b981);">
                        All detected job requirements are matched.
                    </p>`;
            }
        }
    }


    /* =========================================================
       CHARTS
       ========================================================= */

    function initCharts() {

        if (
            typeof Chart === "undefined"
        ) {
            console.warn(
                "Chart.js is not loaded."
            );

            return;
        }


        const radarCanvas =
            document.getElementById(
                "radarChartCtx"
            );

        const pieCanvas =
            document.getElementById(
                "pieChartCtx"
            );


        if (radarCanvas) {

            radarChart =
                new Chart(
                    radarCanvas,
                    {
                        type: "radar",

                        data: {
                            labels: [
                                "Technical Skills",
                                "ATS Compatibility",
                                "Project Readiness",
                                "Core Skills",
                                "Role Match"
                            ],

                            datasets: [{
                                label:
                                    "Current Readiness",

                                data: [
                                    0,
                                    0,
                                    0,
                                    0,
                                    0
                                ],

                                backgroundColor:
                                    "rgba(99,102,241,.25)",

                                borderColor:
                                    "#6366f1",

                                pointBackgroundColor:
                                    "#38bdf8"
                            }]
                        },

                        options: {
                            responsive: true,
                            maintainAspectRatio: false,

                            scales: {
                                r: {
                                    min: 0,
                                    max: 100,

                                    ticks: {
                                        display: false
                                    },

                                    grid: {
                                        color:
                                            "rgba(148,163,184,.18)"
                                    },

                                    angleLines: {
                                        color:
                                            "rgba(148,163,184,.18)"
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
        }


        if (pieCanvas) {

            pieChart =
                new Chart(
                    pieCanvas,
                    {
                        type: "doughnut",

                        data: {
                            labels: [
                                "Matched",
                                "Missing"
                            ],

                            datasets: [{
                                data: [
                                    0,
                                    1
                                ],

                                backgroundColor: [
                                    "#10b981",
                                    "#f43f5e"
                                ]
                            }]
                        },

                        options: {
                            responsive: true,
                            maintainAspectRatio: false,

                            plugins: {
                                legend: {
                                    position: "bottom"
                                }
                            }
                        }
                    }
                );
        }
    }


    function updateCharts(data) {

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


        const ats =
            Number(
                data.ats_score || 0
            );


        const readiness =
            Number(
                data.readiness_pct || 0
            );


        const confidence =
            Number(
                data.confidence_pct || 0
            );


        const total =
            matched + missing;


        const matchPct =
            total > 0
                ? (matched / total) * 100
                : 0;


        if (radarChart) {

            radarChart.data.datasets[0].data = [
                Math.min(
                    100,
                    window.EXTRACTED_SKILLS.length * 10
                ),

                ats,

                confidence,

                matchPct,

                readiness
            ];

            radarChart.update();
        }


        if (pieChart) {

            pieChart.data.labels = [
                "Matched Skills",
                "Missing Skills"
            ];

            pieChart.data.datasets[0].data = [
                matched,
                missing
            ];


            pieChart.update();
        }
    }


    /* =========================================================
       SKILL EDITOR
       ========================================================= */

    function initSkillEditor() {

        const button =
            document.getElementById(
                "btn-update-skills-live"
            );


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            async function () {

                const checked =
                    document.querySelectorAll(
                        ".active-profile-skill-checkbox:checked"
                    );


                const skills =
                    Array.from(
                        checked
                    ).map(
                        function (element) {
                            return element.value;
                        }
                    );


                setButtonLoading(
                    button,
                    true,
                    "Updating..."
                );


                try {

                    const json =
                        await apiRequest(
                            "update_skills",
                            {
                                skills: skills
                            }
                        );


                    if (
                        json.status ===
                        "success"
                    ) {

                        window.EXTRACTED_SKILLS =
                            normalizeSkills(
                                json.skills
                            );


                        await refreshCurrentRecommendation();


                        showTemporaryMessage(
                            "Profile skills updated successfully.",
                            "success"
                        );

                    } else {

                        showTemporaryMessage(
                            json.message ||
                            "Unable to update skills.",
                            "error"
                        );
                    }

                } catch (error) {

                    showTemporaryMessage(
                        error.message,
                        "error"
                    );

                } finally {

                    setButtonLoading(
                        button,
                        false,
                        "Update Profile Skills Live"
                    );
                }
            }
        );
    }


    async function refreshCurrentRecommendation() {

        if (
            window.CAREER_JOBS &&
            window.CAREER_JOBS.length
        ) {

            const recommendation =
                chooseBestJob(
                    window.CAREER_JOBS
                );


            if (recommendation) {

                applyJobRecommendation(
                    recommendation,
                    true
                );
            }

        } else {

            await fetchMetrics();
        }
    }


    /* =========================================================
       RESUME UPLOAD
       ========================================================= */

    function initResumeUpload() {

        const form =
            document.getElementById(
                "form-resume-upload"
            );

        const sampleButton =
            document.getElementById(
                "btn-load-sample-resume"
            );


        if (form) {

            form.addEventListener(
                "submit",
                async function (event) {

                    event.preventDefault();


                    const fileInput =
                        document.getElementById(
                            "input-resume-file"
                        );


                    if (
                        !fileInput ||
                        !fileInput.files ||
                        !fileInput.files[0]
                    ) {

                        showTemporaryMessage(
                            "Please select a PDF or DOCX resume first.",
                            "error"
                        );

                        return;
                    }


                    const file =
                        fileInput.files[0];


                    const statusBox =
                        document.getElementById(
                            "resume-upload-status"
                        );


                    if (statusBox) {

                        statusBox.style.display =
                            "block";

                        statusBox.className =
                            "alert alert-info";

                        statusBox.innerHTML =
                            `<span class="sgp-spinner"></span>
                             Parsing resume and extracting skills...`;
                    }


                    const uploadButton =
                        form.querySelector(
                            "button[type='submit']"
                        );


                    setButtonLoading(
                        uploadButton,
                        true,
                        "Evaluating..."
                    );


                    const formData =
                        new FormData();

                    formData.append(
                        "action",
                        "upload_resume"
                    );

                    formData.append(
                        "resume_file",
                        file
                    );


                    /*
                     * If a dynamic job is already selected,
                     * send its real requirements.
                     */
                    formData.append(
                        "target_company",
                        window.TARGET_COMPANY || ""
                    );

                    formData.append(
                        "target_role",
                        window.TARGET_ROLE || ""
                    );

                    formData.append(
                        "required_skills",
                        JSON.stringify(
                            window.REQUIRED_SKILLS || []
                        )
                    );


                    try {

                        const response =
                            await fetch(
                                "api.php",
                                {
                                    method: "POST",
                                    body: formData,
                                    credentials:
                                        "same-origin",
                                    cache: "no-store",
                                    headers: {
                                        "Accept":
                                            "application/json"
                                    }
                                }
                            );


                        const text =
                            await response.text();


                        let json;


                        try {

                            json =
                                JSON.parse(text);

                        } catch (parseError) {

                            console.error(
                                "Resume API response:",
                                text
                            );

                            throw new Error(
                                "The server returned an invalid response. Check the Render logs."
                            );
                        }


                        if (
                            json.status !==
                            "success"
                        ) {

                            throw new Error(
                                json.message ||
                                "Resume evaluation failed."
                            );
                        }


                        /*
                         * Update client state.
                         */
                        const data =
                            json.data || {};


                        window.EXTRACTED_SKILLS =
                            normalizeSkills(
                                data.extracted_skills ||
                                []
                            );


                        window.ATS_SCORE =
                            data.ats_score !==
                            undefined
                                ? data.ats_score
                                : null;


                        window.APP_DATA.extractedSkills =
                            window.EXTRACTED_SKILLS;

                        window.APP_DATA.atsScore =
                            window.ATS_SCORE;


                        if (statusBox) {

                            statusBox.className =
                                "alert alert-success";

                            statusBox.innerHTML =
                                `
                                <strong>
                                    Resume parsed successfully.
                                </strong>
                                <br>
                                ${
                                    window.EXTRACTED_SKILLS.length
                                }
                                skill(s) detected.
                                `;
                        }


                        /*
                         * If jobs were already scraped,
                         * recompute the recommendation now.
                         */
                        if (
                            window.CAREER_JOBS &&
                            window.CAREER_JOBS.length
                        ) {

                            const recommendation =
                                chooseBestJob(
                                    window.CAREER_JOBS
                                );


                            if (recommendation) {

                                applyJobRecommendation(
                                    recommendation,
                                    true
                                );
                            }


                            renderCareerScrapeResults(
                                window.CAREER_JOBS,
                                recommendation,
                                {}
                            );


                            renderJobTable(
                                window.CAREER_JOBS,
                                ""
                            );


                            await fetchMetrics();


                            /*
                             * Reload only after the session has
                             * been updated, so PHP-rendered resume
                             * signals are refreshed.
                             */
                            setTimeout(
                                function () {
                                    window.location.replace(
                                        window.location.pathname +
                                        "?resume=" +
                                        Date.now()
                                    );
                                },
                                700
                            );

                        } else {

                            /*
                             * Resume can be parsed without a
                             * career URL, but there is no role
                             * prediction yet.
                             */
                            if (statusBox) {

                                statusBox.innerHTML +=
                                    `<br>
                                     Enter a career URL to calculate
                                     your best role match.`;
                            }
                        }

                    } catch (error) {

                        console.error(
                            "Resume upload error:",
                            error
                        );


                        if (statusBox) {

                            statusBox.className =
                                "alert alert-error";

                            statusBox.textContent =
                                error.message ||
                                "Resume upload failed.";
                        }

                    } finally {

                        setButtonLoading(
                            uploadButton,
                            false,
                            "🚀 Evaluate Resume ATS"
                        );
                    }
                }
            );
        }


        /* -----------------------------------------------------
           SAMPLE
           ----------------------------------------------------- */

        if (sampleButton) {

            sampleButton.addEventListener(
                "click",
                async function () {

                    setButtonLoading(
                        sampleButton,
                        true,
                        "Loading..."
                    );


                    try {

                        const json =
                            await apiRequest(
                                "load_sample",
                                {},
                                45000
                            );


                        if (
                            json.status ===
                            "success"
                        ) {

                            const data =
                                json.data || {};


                            window.EXTRACTED_SKILLS =
                                normalizeSkills(
                                    data.extracted_skills ||
                                    []
                                );


                            window.ATS_SCORE =
                                data.ats_score !==
                                undefined
                                    ? data.ats_score
                                    : null;


                            showTemporaryMessage(
                                "Sample profile loaded.",
                                "success"
                            );


                            await refreshCurrentRecommendation();

                        } else {

                            throw new Error(
                                json.message ||
                                "Unable to load sample profile."
                            );
                        }

                    } catch (error) {

                        showTemporaryMessage(
                            error.message,
                            "error"
                        );

                    } finally {

                        setButtonLoading(
                            sampleButton,
                            false,
                            "🔄 Load Sample Profile"
                        );
                    }
                }
            );
        }
    }


    /* =========================================================
       JOB RANKING
       ========================================================= */

    function initJobRanking() {

        const domainFilter =
            document.getElementById(
                "select-job-domain-filter"
            );

        const searchInput =
            document.getElementById(
                "input-job-search"
            );


        if (domainFilter) {

            domainFilter.addEventListener(
                "change",
                refreshJobRanking
            );
        }


        if (searchInput) {

            let timer = null;

            searchInput.addEventListener(
                "input",
                function () {

                    clearTimeout(timer);

                    timer =
                        setTimeout(
                            refreshJobRanking,
                            250
                        );
                }
            );
        }


        /*
         * Do not automatically hit the backend on every
         * page load unless jobs already exist.
         */
        if (
            window.CAREER_JOBS &&
            window.CAREER_JOBS.length
        ) {

            renderJobTable(
                window.CAREER_JOBS,
                ""
            );
        }
    }


    async function refreshJobRanking() {

        const domainFilter =
            document.getElementById(
                "select-job-domain-filter"
            );

        const searchInput =
            document.getElementById(
                "input-job-search"
            );


        const domain =
            domainFilter
                ? domainFilter.value
                : "All Domains";


        const query =
            searchInput
                ? searchInput.value
                : "";


        if (
            window.CAREER_JOBS &&
            window.CAREER_JOBS.length
        ) {

            let jobs =
                normalizeJobs(
                    window.CAREER_JOBS
                );


            if (
                domain &&
                domain !== "All Domains"
            ) {

                jobs =
                    jobs.filter(
                        function (job) {

                            return !job.domain ||
                                job.domain
                                    .toLowerCase()
                                    .includes(
                                        domain.toLowerCase()
                                    );
                        }
                    );
            }


            renderJobTable(
                jobs,
                query
            );


            return;
        }


        try {

            const json =
                await apiRequest(
                    "rank_jobs",
                    {
                        domain_filter:
                            domain
                    },
                    45000
                );


            if (
                json.status === "success"
            ) {

                window.CAREER_JOBS =
                    normalizeJobs(
                        json.jobs || []
                    );


                renderJobTable(
                    window.CAREER_JOBS,
                    query
                );
            }

        } catch (error) {

            console.warn(
                "Job ranking unavailable:",
                error
            );
        }
    }


    function renderJobTable(
        jobs,
        query
    ) {

        const tbody =
            document.getElementById(
                "tbody-job-ranking"
            );


        if (!tbody) {
            return;
        }


        query =
            String(
                query || ""
            ).toLowerCase()
            .trim();


        const filtered =
            normalizeJobs(
                jobs
            ).filter(
                function (job) {

                    if (!query) {
                        return true;
                    }


                    return (
                        job.company
                            .toLowerCase()
                            .includes(query) ||

                        job.role
                            .toLowerCase()
                            .includes(query)
                    );
                }
            );


        if (!filtered.length) {

            tbody.innerHTML =
                `
                <tr>
                    <td colspan="7">
                        <div class="sgp-empty">
                            No dynamically discovered jobs available.
                            Enter a career URL first.
                        </div>
                    </td>
                </tr>
                `;

            return;
        }


        tbody.innerHTML =
            filtered.map(
                function (job) {

                    const matched =
                        job.matched_skills ||
                        [];


                    const missing =
                        job.missing_skills ||
                        [];


                    const total =
                        (
                            job.required_skills ||
                            []
                        ).length;


                    const fit =
                        job.match_pct >= 75
                            ? "High Match"
                            : job.match_pct >= 50
                                ? "Moderate Match"
                                : "Developing Match";


                    return `
                        <tr class="sgp-fade-in">

                            <td>
                                <strong>
                                    ${escapeHtml(
                                        job.company ||
                                        "Career Page"
                                    )}
                                </strong>
                            </td>

                            <td>
                                ${escapeHtml(
                                    job.role ||
                                    "Untitled Role"
                                )}
                            </td>

                            <td>
                                ${escapeHtml(
                                    job.domain ||
                                    "Not specified"
                                )}
                            </td>

                            <td>
                                <strong
                                    style="
                                        color:var(--cyan-light);
                                    "
                                >
                                    ${Number(
                                        job.match_pct || 0
                                    ).toFixed(1)}%
                                </strong>
                            </td>

                            <td>
                                ${matched.length}
                                /
                                ${total || matched.length + missing.length}
                            </td>

                            <td>
                                <span
                                    style="
                                        font-weight:700;
                                        color:var(
                                            --cyan-light
                                        );
                                    "
                                >
                                    ${fit}
                                </span>
                            </td>

                            <td>
                                ${
                                    missing.length
                                        ? escapeHtml(
                                            missing
                                                .slice(0, 3)
                                                .join(", ")
                                          )
                                        : "None"
                                }
                            </td>

                        </tr>
                    `;
                }
            ).join("");
    }


    /* =========================================================
       ROADMAP
       ========================================================= */

    async function loadDynamicRoadmap() {

        const container =
            document.getElementById(
                "container-dynamic-roadmap"
            );

        const resources =
            document.getElementById(
                "container-dynamic-resources"
            );


        if (!container) {
            return;
        }


        if (!window.TARGET_ROLE) {

            container.innerHTML =
                `
                <div class="sgp-empty">
                    Analyze a career URL and select a dynamically
                    discovered role before generating a roadmap.
                </div>
                `;

            if (resources) {
                resources.innerHTML = "";
            }

            return;
        }


        container.innerHTML =
            `
            <div class="sgp-empty">
                <span class="sgp-spinner"></span>
                Building your roadmap...
            </div>
            `;


        try {

            const missing =
                window.LATEST_METRICS &&
                Array.isArray(
                    window.LATEST_METRICS.missing_skills
                )
                    ? window.LATEST_METRICS.missing_skills
                    : [];


            const json =
                await apiRequest(
                    "get_roadmap",
                    {
                        missing_skills:
                            missing,

                        target_role:
                            window.TARGET_ROLE,

                        target_company:
                            window.TARGET_COMPANY
                    },
                    60000
                );


            if (
                json.status !== "success" ||
                !json.roadmap
            ) {

                throw new Error(
                    json.message ||
                    "Roadmap could not be generated."
                );
            }


            const roadmap =
                json.roadmap;


            const phases =
                Array.isArray(
                    roadmap.phases
                )
                    ? roadmap.phases
                    : [];


            const resourceList =
                Array.isArray(
                    roadmap.resources
                )
                    ? roadmap.resources
                    : [];


            if (!phases.length) {

                container.innerHTML =
                    `<div class="sgp-empty">
                        No roadmap phases were returned.
                    </div>`;

            } else {

                container.innerHTML =
                    phases.map(
                        function (phase) {

                            return `
                                <div
                                    class="roadmap-phase-card sgp-fade-in"
                                >

                                    <div
                                        class="roadmap-phase-title"
                                    >
                                        ${escapeHtml(
                                            phase.phase ||
                                            "Phase"
                                        )}
                                        —
                                        ${escapeHtml(
                                            phase.objective ||
                                            ""
                                        )}
                                    </div>

                                    <div
                                        class="roadmap-phase-duration"
                                    >
                                        ⏱️
                                        ${escapeHtml(
                                            phase.duration ||
                                            ""
                                        )}

                                        ${
                                            Array.isArray(
                                                phase.skills
                                            )
                                                ? `
                                                    |
                                                    Target Skills:
                                                    ${escapeHtml(
                                                        phase.skills.join(
                                                            ", "
                                                        )
                                                    )}
                                                  `
                                                : ""
                                        }
                                    </div>

                                    <ul
                                        style="
                                            color:var(
                                                --text-muted
                                            );
                                            padding-left:20px;
                                            line-height:1.7;
                                        "
                                    >
                                        ${
                                            Array.isArray(
                                                phase.action_items
                                            )
                                                ? phase.action_items
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
                                                    .join("")
                                                : ""
                                        }
                                    </ul>

                                </div>
                            `;
                        }
                    ).join("");
            }


            if (resources) {

                if (!resourceList.length) {

                    resources.innerHTML =
                        `<div class="sgp-empty">
                            No additional resources returned.
                        </div>`;

                } else {

                    resources.innerHTML =
                        resourceList.map(
                            function (item) {

                                return `
                                    <details
                                        style="
                                            margin-bottom:12px;
                                        "
                                        class="sgp-fade-in"
                                    >

                                        <summary>
                                            📖
                                            ${escapeHtml(
                                                item.skill ||
                                                "Skill"
                                            )}
                                            Mastery Guide
                                        </summary>

                                        <div
                                            style="
                                                padding-top:12px;
                                                line-height:1.7;
                                            "
                                        >

                                            <p>
                                                <strong>
                                                    Platform:
                                                </strong>
                                                ${escapeHtml(
                                                    item.platform ||
                                                    "Not specified"
                                                )}
                                            </p>

                                            <p>
                                                <strong>
                                                    Time:
                                                </strong>
                                                ${escapeHtml(
                                                    item.time ||
                                                    "Not specified"
                                                )}
                                            </p>

                                            ${
                                                item.docs
                                                    ? `
                                                        <p>
                                                            <strong>
                                                                Documentation:
                                                            </strong>
                                                            <a
                                                                href="${escapeAttribute(
                                                                    item.docs
                                                                )}"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                class="extracted-link"
                                                            >
                                                                Official Documentation ↗
                                                            </a>
                                                        </p>
                                                      `
                                                    : ""
                                            }

                                            ${
                                                item.project
                                                    ? `
                                                        <p>
                                                            <strong>
                                                                Project:
                                                            </strong>
                                                            ${escapeHtml(
                                                                item.project
                                                            )}
                                                        </p>
                                                      `
                                                    : ""
                                            }

                                        </div>

                                    </details>
                                `;
                            }
                        ).join("");
                }
            }

        } catch (error) {

            console.error(
                "Roadmap error:",
                error
            );


            container.innerHTML =
                `
                <div class="alert alert-error">
                    ${escapeHtml(
                        error.message ||
                        "Unable to generate roadmap."
                    )}
                </div>
                `;
        }
    }


    /* =========================================================
       INTERVIEW
       ========================================================= */

    async function loadDynamicInterview() {

        const container =
            document.getElementById(
                "container-dynamic-interview"
            );


        if (!container) {
            return;
        }


        if (!window.TARGET_ROLE) {

            container.innerHTML =
                `
                <div class="sgp-empty">
                    Analyze a career URL first so interview
                    preparation can be tailored to the discovered role.
                </div>
                `;

            return;
        }


        container.innerHTML =
            `
            <div class="sgp-empty">
                <span class="sgp-spinner"></span>
                Preparing interview questions...
            </div>
            `;


        const matched =
            window.LATEST_METRICS &&
            Array.isArray(
                window.LATEST_METRICS.matched_skills
            )
                ? window.LATEST_METRICS.matched_skills
                : [];


        const missing =
            window.LATEST_METRICS &&
            Array.isArray(
                window.LATEST_METRICS.missing_skills
            )
                ? window.LATEST_METRICS.missing_skills
                : [];


        try {

            const json =
                await apiRequest(
                    "get_interview",
                    {
                        target_role:
                            window.TARGET_ROLE,

                        matched_skills:
                            matched,

                        missing_skills:
                            missing
                    },
                    60000
                );


            if (
                json.status !== "success"
            ) {

                throw new Error(
                    json.message ||
                    "Interview preparation could not be generated."
                );
            }


            const prep =
                json.prep_data || {};


            let html = "";


            if (
                Array.isArray(
                    prep.technical_known
                ) &&
                prep.technical_known.length
            ) {

                html += `
                    <h4
                        style="
                            color:var(--cyan-light);
                            margin-bottom:14px;
                        "
                    >
                        🧠 Technical Questions
                    </h4>
                `;


                html +=
                    prep.technical_known
                        .map(
                            function (item, index) {

                                return `
                                    <details
                                        style="
                                            margin-bottom:12px;
                                        "
                                        class="sgp-fade-in"
                                    >

                                        <summary>
                                            Q${index + 1}
                                            —
                                            ${escapeHtml(
                                                item.skill ||
                                                ""
                                            )}
                                            :
                                            ${escapeHtml(
                                                item.q ||
                                                ""
                                            )}
                                        </summary>

                                        <div
                                            style="
                                                padding-top:12px;
                                                line-height:1.7;
                                            "
                                        >

                                            <p>
                                                <strong>
                                                    Ideal Answer:
                                                </strong>
                                                ${escapeHtml(
                                                    item.a ||
                                                    ""
                                                )}
                                            </p>

                                            <p
                                                style="
                                                    color:var(
                                                        --cyan-light
                                                    );
                                                "
                                            >
                                                💡
                                                ${escapeHtml(
                                                    item.tip ||
                                                    ""
                                                )}
                                            </p>

                                        </div>

                                    </details>
                                `;
                            }
                        )
                        .join("");
            }


            if (
                Array.isArray(
                    prep.gap_questions
                ) &&
                prep.gap_questions.length
            ) {

                html += `
                    <h4
                        style="
                            color:var(--rose);
                            margin-top:24px;
                            margin-bottom:14px;
                        "
                    >
                        ⚠️ Skill-Gap Questions
                    </h4>
                `;


                html +=
                    prep.gap_questions
                        .map(
                            function (item, index) {

                                return `
                                    <details
                                        style="
                                            margin-bottom:12px;
                                        "
                                    >

                                        <summary>
                                            Gap ${index + 1}
                                            —
                                            ${escapeHtml(
                                                item.skill ||
                                                ""
                                            )}
                                        </summary>

                                        <div
                                            style="
                                                padding-top:12px;
                                                line-height:1.7;
                                            "
                                        >

                                            <p>
                                                <strong>
                                                    Question:
                                                </strong>
                                                ${escapeHtml(
                                                    item.q ||
                                                    ""
                                                )}
                                            </p>

                                            <p>
                                                <strong>
                                                    Answer:
                                                </strong>
                                                ${escapeHtml(
                                                    item.a ||
                                                    ""
                                                )}
                                            </p>

                                            <p
                                                style="
                                                    color:var(
                                                        --amber
                                                    );
                                                "
                                            >
                                                💡
                                                ${escapeHtml(
                                                    item.tip ||
                                                    ""
                                                )}
                                            </p>

                                        </div>

                                    </details>
                                `;
                            }
                        )
                        .join("");
            }


            if (
                Array.isArray(
                    prep.behavioral
                ) &&
                prep.behavioral.length
            ) {

                html += `
                    <h4
                        style="
                            color:var(--emerald);
                            margin-top:24px;
                            margin-bottom:14px;
                        "
                    >
                        👔 HR & Behavioral Questions
                    </h4>
                `;


                html +=
                    prep.behavioral
                        .map(
                            function (item, index) {

                                return `
                                    <details
                                        style="
                                            margin-bottom:12px;
                                        "
                                    >

                                        <summary>
                                            HR Q${index + 1}:
                                            ${escapeHtml(
                                                item.q ||
                                                ""
                                            )}
                                        </summary>

                                        <div
                                            style="
                                                padding-top:12px;
                                                line-height:1.7;
                                            "
                                        >

                                            <p>
                                                <strong>
                                                    Framework:
                                                </strong>
                                                ${escapeHtml(
                                                    item.framework ||
                                                    ""
                                                )}
                                            </p>

                                            <p>
                                                <strong>
                                                    Guide:
                                                </strong>
                                                ${escapeHtml(
                                                    item.guide ||
                                                    ""
                                                )}
                                            </p>

                                        </div>

                                    </details>
                                `;
                            }
                        )
                        .join("");
            }


            if (!html) {

                html =
                    `<div class="sgp-empty">
                        No interview questions were returned.
                    </div>`;
            }


            container.innerHTML =
                html;

        } catch (error) {

            console.error(
                "Interview error:",
                error
            );


            container.innerHTML =
                `
                <div class="alert alert-error">
                    ${escapeHtml(
                        error.message ||
                        "Unable to load interview preparation."
                    )}
                </div>
                `;
        }
    }


    /* =========================================================
       AI INTERVIEW ASSISTANT
       ========================================================= */

    function initAIInterviewAssistant() {

        const assistantTab =
            document.getElementById(
                "tab-btn-ai-assistant"
            );

        const evaluatorTab =
            document.getElementById(
                "tab-btn-ai-evaluator"
            );

        const questionsTab =
            document.getElementById(
                "tab-btn-ai-questions"
            );


        const assistant =
            document.getElementById(
                "subtab-ai-assistant"
            );

        const evaluator =
            document.getElementById(
                "subtab-ai-evaluator"
            );

        const questions =
            document.getElementById(
                "subtab-ai-questions"
            );


        function activate(
            activeTab,
            activeView
        ) {

            [
                assistantTab,
                evaluatorTab,
                questionsTab
            ].forEach(
                function (tab) {

                    if (tab) {
                        tab.classList.remove(
                            "active"
                        );
                    }
                }
            );


            [
                assistant,
                evaluator,
                questions
            ].forEach(
                function (view) {

                    if (view) {
                        view.style.display =
                            "none";
                    }
                }
            );


            if (activeTab) {
                activeTab.classList.add(
                    "active"
                );
            }

            if (activeView) {
                activeView.style.display =
                    "block";
            }
        }


        if (assistantTab) {

            assistantTab.addEventListener(
                "click",
                function () {
                    activate(
                        assistantTab,
                        assistant
                    );
                }
            );
        }


        if (evaluatorTab) {

            evaluatorTab.addEventListener(
                "click",
                function () {
                    activate(
                        evaluatorTab,
                        evaluator
                    );
                }
            );
        }


        if (questionsTab) {

            questionsTab.addEventListener(
                "click",
                function () {
                    activate(
                        questionsTab,
                        questions
                    );

                    loadDynamicInterview();
                }
            );
        }


        /* -----------------------------------------------------
           AI PROMPT
           ----------------------------------------------------- */

        const prompt =
            document.getElementById(
                "input-ai-prompt"
            );

        const submit =
            document.getElementById(
                "btn-submit-ai-prompt"
            );

        const presetButtons =
            document.querySelectorAll(
                ".ai-preset-btn"
            );


        const responseCard =
            document.getElementById(
                "ai-assistant-response-card"
            );

        const responseTitle =
            document.getElementById(
                "ai-response-title"
            );

        const responseBody =
            document.getElementById(
                "ai-response-body"
            );


        async function executePrompt(
            query
        ) {

            if (!query) {
                return;
            }


            if (!window.TARGET_ROLE) {

                if (responseCard) {
                    responseCard.style.display =
                        "block";
                }

                if (responseTitle) {
                    responseTitle.textContent =
                        "Career target required";
                }

                if (responseBody) {
                    responseBody.innerHTML =
                        `<p>
                            Analyze a career URL first so the
                            assistant can tailor the discussion
                            to the discovered role.
                         </p>`;
                }

                return;
            }


            if (responseCard) {
                responseCard.style.display =
                    "block";
            }


            if (responseTitle) {
                responseTitle.textContent =
                    "⏳ Generating response...";
            }


            if (responseBody) {
                responseBody.innerHTML =
                    `<p>
                        Preparing guidance for
                        ${escapeHtml(
                            window.TARGET_ROLE
                        )}...
                    </p>`;
            }


            try {

                const json =
                    await apiRequest(
                        "ask_interview_ai",
                        {
                            prompt: query,

                            target_role:
                                window.TARGET_ROLE,

                            target_company:
                                window.TARGET_COMPANY
                        },
                        60000
                    );


                if (
                    json.status !== "success"
                ) {

                    throw new Error(
                        json.message ||
                        "AI assistant failed."
                    );
                }


                if (responseTitle) {

                    responseTitle.textContent =
                        json.title ||
                        "Interview Guidance";
                }


                let html =
                    `<div style="
                        line-height:1.7;
                        font-size:14px;
                    ">`;


                if (
                    Array.isArray(
                        json.advice_steps
                    )
                ) {

                    html +=
                        `<h5>
                            📌 Guidance
                         </h5>
                         <ul>`;


                    json.advice_steps.forEach(
                        function (step) {

                            html +=
                                `<li>
                                    ${escapeHtml(
                                        step
                                    )}
                                 </li>`;
                        }
                    );


                    html +=
                        `</ul>`;
                }


                if (
                    json.sample_question
                ) {

                    html +=
                        `
                        <div
                            style="
                                margin-top:14px;
                                padding:14px;
                                border-radius:10px;
                                border-left:4px solid var(--emerald);
                            "
                        >

                            <strong>
                                Practice Question
                            </strong>

                            <p>
                                ${escapeHtml(
                                    json.sample_question
                                )}
                            </p>

                            <strong>
                                Model Strategy
                            </strong>

                            <p>
                                ${escapeHtml(
                                    json.sample_answer ||
                                    ""
                                )}
                            </p>

                        </div>
                        `;
                }


                html +=
                    `</div>`;


                if (responseBody) {
                    responseBody.innerHTML =
                        html;
                }

            } catch (error) {

                if (responseTitle) {
                    responseTitle.textContent =
                        "Connection Error";
                }

                if (responseBody) {

                    responseBody.innerHTML =
                        `<p style="color:var(--rose);">
                            ${escapeHtml(
                                error.message
                            )}
                         </p>`;
                }
            }
        }


        if (
            submit &&
            prompt
        ) {

            submit.addEventListener(
                "click",
                function () {

                    executePrompt(
                        prompt.value.trim()
                    );
                }
            );


            prompt.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();

                        executePrompt(
                            prompt.value.trim()
                        );
                    }
                }
            );
        }


        presetButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const query =
                            button.getAttribute(
                                "data-query"
                            ) || "";


                        if (prompt) {
                            prompt.value =
                                query;
                        }


                        executePrompt(
                            query
                        );
                    }
                );
            }
        );


        /* -----------------------------------------------------
           ANSWER EVALUATOR
           ----------------------------------------------------- */

        const questionSelect =
            document.getElementById(
                "select-eval-question"
            );

        const customQuestion =
            document.getElementById(
                "input-eval-custom-q"
            );


        if (
            questionSelect &&
            customQuestion
        ) {

            questionSelect.addEventListener(
                "change",
                function () {

                    customQuestion.style.display =
                        questionSelect.value ===
                        "custom"
                            ? "block"
                            : "none";
                }
            );
        }


        const evaluateButton =
            document.getElementById(
                "btn-submit-eval-answer"
            );


        if (evaluateButton) {

            evaluateButton.addEventListener(
                "click",
                async function () {

                    if (!window.TARGET_ROLE) {

                        alert(
                            "Analyze a career URL first."
                        );

                        return;
                    }


                    let question =
                        questionSelect
                            ? questionSelect.value
                            : "";


                    if (
                        question ===
                        "custom"
                    ) {

                        question =
                            customQuestion
                                ? customQuestion.value.trim()
                                : "";
                    }


                    const answerInput =
                        document.getElementById(
                            "input-eval-user-answer"
                        );


                    const answer =
                        answerInput
                            ? answerInput.value.trim()
                            : "";


                    if (!question || !answer) {

                        alert(
                            "Please provide both the interview question and your answer."
                        );

                        return;
                    }


                    const resultCard =
                        document.getElementById(
                            "ai-evaluator-result-card"
                        );


                    if (resultCard) {
                        resultCard.style.display =
                            "block";
                    }


                    setText(
                        "eval-overall-score-display",
                        "Evaluating..."
                    );


                    try {

                        const json =
                            await apiRequest(
                                "evaluate_answer",
                                {
                                    question:
                                        question,

                                    user_answer:
                                        answer,

                                    target_role:
                                        window.TARGET_ROLE
                                },
                                60000
                            );


                        if (
                            json.status !==
                            "success"
                        ) {

                            throw new Error(
                                json.message ||
                                "Answer evaluation failed."
                            );
                        }


                        setText(
                            "eval-rating-badge",
                            json.rating ||
                            "Evaluated"
                        );


                        if (
                            json.color
                        ) {

                            const badge =
                                document.getElementById(
                                    "eval-rating-badge"
                                );

                            if (badge) {
                                badge.style.background =
                                    json.color;
                            }
                        }


                        setText(
                            "eval-overall-score-display",
                            `Overall Score: ${
                                json.total_score ??
                                0
                            } / 100`
                        );


                        const breakdown =
                            json.breakdown ||
                            {};


                        setText(
                            "eval-score-tech",
                            `${breakdown.technical_accuracy || 0} / 20`
                        );

                        setText(
                            "eval-score-kw",
                            `${breakdown.keywords_terminology || 0} / 20`
                        );

                        setText(
                            "eval-score-struct",
                            `${breakdown.structure_clarity || 0} / 20`
                        );

                        setText(
                            "eval-score-rel",
                            `${breakdown.real_world_relevance || 0} / 20`
                        );

                        setText(
                            "eval-score-comp",
                            `${breakdown.completeness || 0} / 20`
                        );


                        const strengths =
                            document.getElementById(
                                "eval-strengths-list"
                            );

                        if (strengths) {

                            strengths.innerHTML =
                                Array.isArray(
                                    json.strengths
                                )
                                    ? json.strengths
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
                                        .join("")
                                    : "";
                        }


                        const missing =
                            document.getElementById(
                                "eval-missing-list"
                            );

                        if (missing) {

                            missing.innerHTML =
                                Array.isArray(
                                    json.missing_points
                                )
                                    ? json.missing_points
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
                                        .join("")
                                    : "";
                        }


                        setText(
                            "eval-ideal-answer",
                            json.ideal_answer ||
                            ""
                        );

                    } catch (error) {

                        setText(
                            "eval-overall-score-display",
                            "Evaluation Failed"
                        );

                        console.error(
                            "Answer evaluator error:",
                            error
                        );
                    }
                }
            );
        }
    }


    /* =========================================================
       PROFILE
       ========================================================= */

    function initProfileForm() {

        const form =
            document.getElementById(
                "form-update-profile"
            );


        if (!form) {
            return;
        }


        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const button =
                    form.querySelector(
                        "button[type='submit']"
                    );


                setButtonLoading(
                    button,
                    true,
                    "Saving..."
                );


                try {

                    const formData =
                        new FormData(form);


                    formData.append(
                        "action",
                        "update_profile"
                    );


                    const response =
                        await fetch(
                            "api.php",
                            {
                                method: "POST",
                                body: formData,
                                credentials:
                                    "same-origin",
                                cache: "no-store",
                                headers: {
                                    "Accept":
                                        "application/json"
                                }
                            }
                        );


                    const json =
                        await response.json();


                    if (
                        json.status ===
                        "success"
                    ) {

                        showTemporaryMessage(
                            json.message ||
                            "Profile updated successfully.",
                            "success"
                        );


                        setTimeout(
                            function () {
                                window.location.reload();
                            },
                            700
                        );

                    } else {

                        throw new Error(
                            json.message ||
                            "Profile update failed."
                        );
                    }

                } catch (error) {

                    showTemporaryMessage(
                        error.message,
                        "error"
                    );

                } finally {

                    setButtonLoading(
                        button,
                        false,
                        "Save Profile Changes"
                    );
                }
            }
        );
    }


    /* =========================================================
       MOBILE SIDEBAR
       ========================================================= */

    function initMobileSidebar() {

        const sidebar =
            document.querySelector(
                ".sidebar"
            );


        if (!sidebar) {
            return;
        }


        let button =
            document.getElementById(
                "mobile-menu-toggle"
            );


        let overlay =
            document.getElementById(
                "sidebar-overlay"
            );


        if (!overlay) {

            overlay =
                document.createElement(
                    "div"
                );

            overlay.id =
                "sidebar-overlay";

            overlay.className =
                "sgp-mobile-overlay";

            document.body.appendChild(
                overlay
            );
        }


        if (!button) {

            button =
                document.createElement(
                    "button"
                );

            button.id =
                "mobile-menu-toggle";

            button.className =
                "sgp-mobile-menu-button";

            button.type =
                "button";

            button.setAttribute(
                "aria-label",
                "Open navigation"
            );

            button.innerHTML =
                "☰";

            document.body.appendChild(
                button
            );
        }


        button.addEventListener(
            "click",
            function () {

                sidebar.classList.toggle(
                    "sgp-mobile-open"
                );

                overlay.classList.toggle(
                    "active"
                );

                button.innerHTML =
                    sidebar.classList.contains(
                        "sgp-mobile-open"
                    )
                        ? "✕"
                        : "☰";
            }
        );


        overlay.addEventListener(
            "click",
            closeMobileSidebar
        );
    }


    function closeMobileSidebar() {

        const sidebar =
            document.querySelector(
                ".sidebar"
            );

        const overlay =
            document.getElementById(
                "sidebar-overlay"
            );

        const button =
            document.getElementById(
                "mobile-menu-toggle"
            );


        if (sidebar) {
            sidebar.classList.remove(
                "sgp-mobile-open"
            );
        }

        if (overlay) {
            overlay.classList.remove(
                "active"
            );
        }

        if (button) {
            button.innerHTML =
                "☰";
        }
    }


    /* =========================================================
       DARK / LIGHT MODE
       ========================================================= */

    function initThemeToggle() {

        let button =
            document.getElementById(
                "theme-toggle"
            );


        /*
         * Support existing theme button IDs.
         */
        if (!button) {

            const candidates = [
                "btn-theme-toggle",
                "toggle-theme",
                "theme-switch",
                "dark-mode-toggle"
            ];


            for (
                let i = 0;
                i < candidates.length;
                i++
            ) {

                button =
                    document.getElementById(
                        candidates[i]
                    );

                if (button) {
                    break;
                }
            }
        }


        /*
         * If no theme button exists, create one.
         */
        if (!button) {

            button =
                document.createElement(
                    "button"
                );

            button.id =
                "theme-toggle";

            button.type =
                "button";

            button.title =
                "Toggle dark/light mode";

            button.setAttribute(
                "aria-label",
                "Toggle dark/light mode"
            );

            button.style.cssText =
                `
                position:fixed;
                top:18px;
                right:18px;
                z-index:10001;
                width:44px;
                height:44px;
                border-radius:12px;
                border:1px solid rgba(100,116,139,.2);
                background:var(--bg-card,#fff);
                cursor:pointer;
                font-size:19px;
                box-shadow:0 8px 25px rgba(0,0,0,.12);
                `;

            button.innerHTML =
                "🌙";

            document.body.appendChild(
                button
            );
        }


        const savedTheme =
            localStorage.getItem(
                "sgp-theme"
            );


        if (
            savedTheme ===
            "light"
        ) {

            document.body.classList.add(
                "light-theme"
            );

            button.innerHTML =
                "☀️";

        } else {

            document.body.classList.remove(
                "light-theme"
            );

            button.innerHTML =
                "🌙";
        }


        button.addEventListener(
            "click",
            function () {

                const isLight =
                    document.body.classList.toggle(
                        "light-theme"
                    );


                localStorage.setItem(
                    "sgp-theme",
                    isLight
                        ? "light"
                        : "dark"
                );


                button.innerHTML =
                    isLight
                        ? "☀️"
                        : "🌙";
            }
        );
    }


    /* =========================================================
       HELPERS
       ========================================================= */

    function normalizeSkills(
        skills
    ) {

        if (
            typeof skills ===
            "string"
        ) {

            try {

                const decoded =
                    JSON.parse(
                        skills
                    );

                if (
                    Array.isArray(
                        decoded
                    )
                ) {

                    skills =
                        decoded;
                }

            } catch (error) {

                skills =
                    skills.split(
                        /[,;\n]+/
                    );
            }
        }


        if (
            !Array.isArray(
                skills
            )
        ) {

            return [];
        }


        const result = [];


        skills.forEach(
            function (skill) {

                if (
                    skill &&
                    typeof skill ===
                    "object"
                ) {

                    skill =
                        skill.name ||
                        skill.skill ||
                        skill.title ||
                        "";
                }


                skill =
                    String(
                        skill
                    )
                    .trim();


                if (
                    skill &&
                    !result.some(
                        function (existing) {
                            return (
                                existing
                                    .toLowerCase() ===
                                skill.toLowerCase()
                            );
                        }
                    )
                ) {

                    result.push(
                        skill
                    );
                }
            }
        );


        return result;
    }


    function skillsEquivalent(
        a,
        b
    ) {

        const first =
            normalizeSkillKey(
                a
            );

        const second =
            normalizeSkillKey(
                b
            );


        if (
            !first ||
            !second
        ) {
            return false;
        }


        if (
            first ===
            second
        ) {
            return true;
        }


        /*
         * Useful for forms such as:
         * Node.js -> nodejs
         * C++ -> c
         * React.js -> reactjs
         */
        if (
            first.length >= 5 &&
            second.length >= 5
        ) {

            return (
                first.includes(second) ||
                second.includes(first)
            );
        }


        return false;
    }


    function normalizeSkillKey(
        value
    ) {

        return String(
            value || ""
        )
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            ""
        );
    }


    function getValue(
        id
    ) {

        const element =
            document.getElementById(
                id
            );

        return element
            ? element.value.trim()
            : "";
    }


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


    function showMessage(
        element,
        message,
        type
    ) {

        if (!element) {
            return;
        }


        element.textContent =
            message;

        element.style.display =
            "block";


        if (type === "success") {

            element.className =
                "alert alert-success";

        } else {

            element.className =
                "alert alert-error";
        }
    }


    function showTemporaryMessage(
        message,
        type
    ) {

        let box =
            document.getElementById(
                "sgp-global-message"
            );


        if (!box) {

            box =
                document.createElement(
                    "div"
                );

            box.id =
                "sgp-global-message";

            box.style.cssText =
                `
                position:fixed;
                bottom:24px;
                right:24px;
                z-index:10010;
                max-width:360px;
                padding:14px 18px;
                border-radius:12px;
                box-shadow:0 12px 35px rgba(0,0,0,.18);
                `;

            document.body.appendChild(
                box
            );
        }


        box.textContent =
            message;


        box.style.background =
            type === "success"
                ? "rgba(16,185,129,.95)"
                : "rgba(244,63,94,.95)";


        box.style.color =
            "#ffffff";


        box.style.display =
            "block";


        clearTimeout(
            box._hideTimer
        );


        box._hideTimer =
            setTimeout(
                function () {

                    box.style.display =
                        "none";

                },
                3500
            );
    }


    function setButtonLoading(
        button,
        loading,
        text
    ) {

        if (!button) {
            return;
        }


        if (loading) {

            if (!button.dataset.originalText) {

                button.dataset.originalText =
                    button.innerHTML;
            }


            button.disabled =
                true;

            button.classList.add(
                "sgp-loading"
            );


            button.innerHTML =
                `<span class="sgp-spinner"></span>
                 ${escapeHtml(text)}`;

        } else {

            button.disabled =
                false;

            button.classList.remove(
                "sgp-loading"
            );


            button.innerHTML =
                text ||
                button.dataset.originalText ||
                "Submit";
        }
    }


    function escapeHtml(
        value
    ) {

        return String(
            value ?? ""
        )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
    }


    function escapeAttribute(
        value
    ) {

        return escapeHtml(
            value
        );
    }


    function scrollToView(
        id
    ) {

        const element =
            document.getElementById(
                id
            );


        if (element) {

            element.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }

})();
