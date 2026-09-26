/**
 * ================================================================
 * Skill-Gap Predictor
 * Career Navigation AI
 * Frontend Application
 *
 * Dynamic career URL
 * Dynamic job discovery
 * Resume parsing
 * ATS analysis
 * Skill-gap prediction
 * Job ranking
 * Roadmap
 * Interview preparation
 * Profile
 * Theme
 * Authentication
 * ================================================================
 */

(() => {
    "use strict";

    /* ============================================================
       GLOBAL APPLICATION DATA
    ============================================================ */

    const APP = window.APP_DATA || {};

    const STATE = {
        loggedIn: !!APP.loggedIn,

        user: APP.user || {},

        careerUrl: APP.careerUrl || "",

        careerJobs: Array.isArray(APP.careerJobs)
            ? APP.careerJobs
            : [],

        extractedSkills: Array.isArray(APP.extractedSkills)
            ? APP.extractedSkills
            : [],

        requiredSkills: Array.isArray(APP.requiredSkills)
            ? APP.requiredSkills
            : [],

        atsScore: Number(APP.atsScore || 0),

        targetCompany: APP.targetCompany || "",

        targetRole: APP.targetRole || "",

        recommendedJob: APP.recommendedJob || null,

        metrics: null,

        roadmapLoaded: false,

        interviewLoaded: false,

        currentQuestionIndex: 0
    };


    /* ============================================================
       BASIC HELPERS
    ============================================================ */

    function $(selector) {
        return document.querySelector(selector);
    }


    function $all(selector) {
        return Array.from(document.querySelectorAll(selector));
    }


    function byId(id) {
        return document.getElementById(id);
    }


    function escapeHtml(value) {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function normalizeSkill(skill) {
        return String(skill || "")
            .trim()
            .toLowerCase()
            .replace(/[._/-]+/g, " ")
            .replace(/\s+/g, " ");
    }


    function normalizeSkills(skills) {
        if (!Array.isArray(skills)) {
            return [];
        }

        const result = [];
        const seen = new Set();

        skills.forEach(skill => {
            const value = String(skill || "").trim();

            if (!value) {
                return;
            }

            const normalized = normalizeSkill(value);

            if (!seen.has(normalized)) {
                seen.add(normalized);
                result.push(value);
            }
        });

        return result;
    }


    function getElementText(element) {
        return element
            ? element.textContent.trim()
            : "";
    }


    function showElement(element) {
        if (element) {
            element.style.display = "";
        }
    }


    function hideElement(element) {
        if (element) {
            element.style.display = "none";
        }
    }


    function setText(idOrElement, value) {
        const element =
            typeof idOrElement === "string"
                ? byId(idOrElement)
                : idOrElement;

        if (element) {
            element.textContent =
                value === null ||
                value === undefined
                    ? ""
                    : String(value);
        }
    }


    function setHtml(idOrElement, value) {
        const element =
            typeof idOrElement === "string"
                ? byId(idOrElement)
                : idOrElement;

        if (element) {
            element.innerHTML =
                value === null ||
                value === undefined
                    ? ""
                    : String(value);
        }
    }


    function setButtonLoading(button, loading, loadingText) {
        if (!button) {
            return;
        }

        if (loading) {
            if (!button.dataset.originalText) {
                button.dataset.originalText =
                    button.innerHTML;
            }

            button.disabled = true;

            button.innerHTML =
                `<span class="button-spinner"></span>${escapeHtml(
                    loadingText || "Processing..."
                )}`;
        } else {
            button.disabled = false;

            if (button.dataset.originalText) {
                button.innerHTML =
                    button.dataset.originalText;

                delete button.dataset.originalText;
            }
        }
    }


    /* ============================================================
       STATUS / ALERTS
    ============================================================ */

    function showStatus(
        element,
        message,
        type = "info"
    ) {
        if (!element) {
            return;
        }

        element.className =
            `status-area status-${type}`;

        element.textContent = message;

        element.style.display = "block";
    }


    function hideStatus(element) {
        if (!element) {
            return;
        }

        element.style.display = "none";
        element.textContent = "";
    }


    function showAuthMessage(
        type,
        message
    ) {
        const errorIds =
            type === "login"
                ? [
                    "login-error-msg",
                    "login-message"
                ]
                : [
                    "signup-error-msg",
                    "signup-message"
                ];

        const successIds =
            type === "login"
                ? [
                    "login-success-msg"
                ]
                : [
                    "signup-success-msg"
                ];

        errorIds.forEach(id => {
            const el = byId(id);

            if (el) {
                if (message) {
                    el.textContent = message;
                    el.style.display = "block";
                } else {
                    el.style.display = "none";
                }
            }
        });

        successIds.forEach(id => {
            const el = byId(id);

            if (el) {
                el.style.display = "none";
            }
        });
    }


    function showAuthSuccess(
        type,
        message
    ) {
        const errorIds =
            type === "login"
                ? [
                    "login-error-msg",
                    "login-message"
                ]
                : [
                    "signup-error-msg",
                    "signup-message"
                ];

        const successIds =
            type === "login"
                ? [
                    "login-success-msg"
                ]
                : [
                    "signup-success-msg"
                ];

        errorIds.forEach(id => {
            const el = byId(id);

            if (el) {
                el.style.display = "none";
            }
        });

        successIds.forEach(id => {
            const el = byId(id);

            if (el) {
                el.textContent = message;
                el.style.display = "block";
            }
        });
    }


    /* ============================================================
       API
    ============================================================ */

    async function apiRequest(
        action,
        fields = {},
        method = "POST"
    ) {
        const formData = new FormData();

        formData.append(
            "action",
            action
        );

        Object.entries(fields).forEach(
            ([key, value]) => {
                if (
                    value !== undefined &&
                    value !== null
                ) {
                    formData.append(
                        key,
                        typeof value === "object" &&
                        !(value instanceof File) &&
                        !(value instanceof Blob)
                            ? JSON.stringify(value)
                            : value
                    );
                }
            }
        );

        const response =
            await fetch(
                "api.php",
                {
                    method,
                    body: formData,
                    credentials: "same-origin"
                }
            );

        let data;

        try {
            data = await response.json();
        } catch (error) {
            throw new Error(
                "The server returned an invalid response."
            );
        }

        if (!response.ok) {
            throw new Error(
                data.message ||
                data.error ||
                `Request failed (${response.status})`
            );
        }

        return data;
    }


    /* ============================================================
       PAGE LOADER
    ============================================================ */

    function hidePageLoader() {
        const loader =
            byId("page-loader");

        if (!loader) {
            return;
        }

        loader.classList.add("loaded");

        setTimeout(() => {
            loader.style.display = "none";
        }, 350);
    }


    /* ============================================================
       AUTH TABS
    ============================================================ */

    function initAuthTabs() {
        const loginTab =
            byId("tab-btn-login") ||
            byId("login-tab") ||
            $("[data-auth-tab='login']");

        const signupTab =
            byId("tab-btn-signup") ||
            byId("signup-tab") ||
            $("[data-auth-tab='signup']");

        const loginPanel =
            byId("form-login-box") ||
            byId("login-panel") ||
            byId("login-form-panel") ||
            $("[data-auth-panel='login']");

        const signupPanel =
            byId("form-signup-box") ||
            byId("signup-panel") ||
            byId("signup-form-panel") ||
            $("[data-auth-panel='signup']");


        function showLogin() {
            if (loginTab) {
                loginTab.classList.add("active");
            }

            if (signupTab) {
                signupTab.classList.remove("active");
            }

            if (loginPanel) {
                loginPanel.style.display = "";
            }

            if (signupPanel) {
                signupPanel.style.display = "none";
            }
        }


        function showSignup() {
            if (signupTab) {
                signupTab.classList.add("active");
            }

            if (loginTab) {
                loginTab.classList.remove("active");
            }

            if (signupPanel) {
                signupPanel.style.display = "";
            }

            if (loginPanel) {
                loginPanel.style.display = "none";
            }
        }


        if (loginTab) {
            loginTab.addEventListener(
                "click",
                showLogin
            );
        }


        if (signupTab) {
            signupTab.addEventListener(
                "click",
                showSignup
            );
        }


        const createAccountLinks =
            $all(
                "#create-account, #create-account-link, .create-account-link, [data-action='create-account']"
            );


        createAccountLinks.forEach(
            link => {
                link.addEventListener(
                    "click",
                    event => {
                        event.preventDefault();
                        showSignup();
                    }
                );
            }
        );


        const backLoginLinks =
            $all(
                "#back-to-login, .back-to-login, [data-action='back-login']"
            );


        backLoginLinks.forEach(
            link => {
                link.addEventListener(
                    "click",
                    event => {
                        event.preventDefault();
                        showLogin();
                    }
                );
            }
        );


        initLogin();
        initSignup();
        initPasswordToggles();
    }


    /* ============================================================
       LOGIN
    ============================================================ */

    function initLogin() {
        const button =
            byId("btn-do-login") ||
            byId("login-submit");

        if (!button) {
            return;
        }

        if (button.dataset.bound === "1") {
            return;
        }

        button.dataset.bound = "1";


        async function submitLogin(event) {
            event.preventDefault();

            const emailInput =
                byId("login_email") ||
                byId("login-email");

            const passwordInput =
                byId("login_password") ||
                byId("login-password");

            const email =
                emailInput
                    ? emailInput.value.trim()
                    : "";

            const password =
                passwordInput
                    ? passwordInput.value
                    : "";


            if (!email || !password) {
                showAuthMessage(
                    "login",
                    "Please enter both email and password."
                );

                return;
            }


            setButtonLoading(
                button,
                true,
                "Signing in..."
            );


            try {
                const data =
                    await apiRequest(
                        "login",
                        {
                            email,
                            password
                        }
                    );


                if (
                    data.status === "success" ||
                    data.success === true
                ) {
                    showAuthSuccess(
                        "login",
                        data.message ||
                        "Login successful. Opening your dashboard..."
                    );

                    setTimeout(() => {
                        window.location.href =
                            window.location.pathname;
                    }, 400);

                    return;
                }


                showAuthMessage(
                    "login",
                    data.message ||
                    data.error ||
                    "Invalid email or password."
                );

            } catch (error) {
                showAuthMessage(
                    "login",
                    error.message ||
                    "Unable to connect to the server."
                );
            } finally {
                setButtonLoading(
                    button,
                    false
                );
            }
        }


        button.addEventListener(
            "click",
            submitLogin
        );


        const loginForm =
            byId("login-form") ||
            $("form[data-form='login']");


        if (loginForm) {
            loginForm.addEventListener(
                "submit",
                submitLogin
            );
        }
    }


    /* ============================================================
       CREATE ACCOUNT
    ============================================================ */

    function initSignup() {
        const button =
            byId("btn-do-signup") ||
            byId("signup-submit");

        if (!button) {
            return;
        }

        if (button.dataset.bound === "1") {
            return;
        }

        button.dataset.bound = "1";


        async function submitSignup(event) {
            event.preventDefault();


            const name =
                getValue(
                    [
                        "signup_name"
                    ]
                );

            const email =
                getValue(
                    [
                        "signup_email"
                    ]
                );

            const password =
                getValue(
                    [
                        "signup_pwd",
                        "signup-password"
                    ]
                );

            const university =
                getValue(
                    [
                        "signup_uni"
                    ]
                );

            const branch =
                getValue(
                    [
                        "signup_branch"
                    ]
                );

            const major =
                getValue(
                    [
                        "signup_major"
                    ]
                );

            const graduationYear =
                getValue(
                    [
                        "signup_gradyear",
                        "signup_year"
                    ]
                );

            const linkedin =
                getValue(
                    [
                        "signup_linkedin"
                    ]
                );

            const github =
                getValue(
                    [
                        "signup_github"
                    ]
                );


            const terms =
                byId("signup-terms");


            if (!name) {
                showAuthMessage(
                    "signup",
                    "Please enter your full name."
                );

                return;
            }


            if (!email) {
                showAuthMessage(
                    "signup",
                    "Please enter your email address."
                );

                return;
            }


            if (!isValidEmail(email)) {
                showAuthMessage(
                    "signup",
                    "Please enter a valid email address."
                );

                return;
            }


            if (!password) {
                showAuthMessage(
                    "signup",
                    "Please create a password."
                );

                return;
            }


            if (password.length < 4) {
                showAuthMessage(
                    "signup",
                    "Password must contain at least 4 characters."
                );

                return;
            }


            if (
                terms &&
                !terms.checked
            ) {
                showAuthMessage(
                    "signup",
                    "Please confirm the information before creating your account."
                );

                return;
            }


            setButtonLoading(
                button,
                true,
                "Creating account..."
            );


            try {
                const data =
                    await apiRequest(
                        "signup",
                        {
                            name,
                            email,
                            password,
                            university,
                            branch,
                            major,
                            graduation_year: graduationYear,
                            linkedin,
                            github,

                            /*
                             * Important:
                             * No company or role is predefined.
                             */
                            target_company: "",
                            target_role: ""
                        }
                    );


                if (
                    data.status === "success" ||
                    data.success === true
                ) {
                    showAuthSuccess(
                        "signup",
                        data.message ||
                        "Account created successfully. You can now log in."
                    );


                    setTimeout(() => {

                        const loginTab =
                            byId("tab-btn-login");

                        if (loginTab) {
                            loginTab.click();
                        }

                        const loginEmail =
                            byId("login_email");

                        if (loginEmail) {
                            loginEmail.value =
                                email;
                        }

                    }, 900);

                } else {
                    showAuthMessage(
                        "signup",
                        data.message ||
                        data.error ||
                        "Unable to create the account."
                    );
                }

            } catch (error) {

                showAuthMessage(
                    "signup",
                    error.message ||
                    "Registration failed."
                );

            } finally {

                setButtonLoading(
                    button,
                    false
                );

            }
        }


        button.addEventListener(
            "click",
            submitSignup
        );


        const signupForm =
            byId("signup-form") ||
            $("form[data-form='signup']");


        if (signupForm) {
            signupForm.addEventListener(
                "submit",
                submitSignup
            );
        }
    }


    function getValue(ids) {
        for (const id of ids) {
            const element =
                byId(id);

            if (element) {
                return element.value.trim();
            }
        }

        return "";
    }


    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(email);
    }


    /* ============================================================
       PASSWORD TOGGLES
    ============================================================ */

    function initPasswordToggles() {
        const pairs = [
            [
                "toggle-login-password",
                "login_password"
            ],
            [
                "toggle-signup-password",
                "signup_pwd"
            ]
        ];


        pairs.forEach(
            ([buttonId, inputId]) => {

                const button =
                    byId(buttonId);

                const input =
                    byId(inputId);


                if (!button || !input) {
                    return;
                }


                button.addEventListener(
                    "click",
                    () => {

                        const visible =
                            input.type === "text";


                        input.type =
                            visible
                                ? "password"
                                : "text";


                        button.textContent =
                            visible
                                ? "👁"
                                : "🙈";

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
            $all(
                ".nav-item[data-view]"
            );

        const views =
            $all(".view-panel");


        if (!navItems.length) {
            return;
        }


        navItems.forEach(
            item => {

                item.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        const targetId =
                            item.getAttribute(
                                "data-view"
                            );


                        if (!targetId) {
                            return;
                        }


                        navItems.forEach(
                            nav => {
                                nav.classList.remove(
                                    "active"
                                );
                            }
                        );


                        views.forEach(
                            view => {
                                view.classList.remove(
                                    "active"
                                );

                                view.style.display =
                                    "none";
                            }
                        );


                        item.classList.add(
                            "active"
                        );


                        const target =
                            byId(targetId);


                        if (target) {

                            target.classList.add(
                                "active"
                            );

                            target.style.display =
                                "block";


                            window.scrollTo({
                                top: 0,
                                behavior: "smooth"
                            });


                            handleViewLoad(
                                targetId
                            );
                        }


                        closeSidebar();

                    }
                );

            }
        );


        /*
         * Make the dashboard visible initially.
         */
        const activeItem =
            navItems.find(
                item =>
                    item.classList.contains(
                        "active"
                    )
            );


        if (activeItem) {

            const targetId =
                activeItem.getAttribute(
                    "data-view"
                );

            const target =
                byId(targetId);

            if (target) {
                target.classList.add(
                    "active"
                );

                target.style.display =
                    "block";
            }

        } else {

            const dashboard =
                byId("view-analytics");

            if (dashboard) {
                dashboard.classList.add(
                    "active"
                );

                dashboard.style.display =
                    "block";
            }

        }
    }


    function handleViewLoad(viewId) {

        if (viewId === "view-roadmap") {
            loadDynamicRoadmap();
        }


        if (viewId === "view-interview") {
            loadDynamicInterview();
        }


        if (viewId === "view-jobranking") {
            renderCurrentJobs();
        }


        if (viewId === "view-skillgap") {
            renderSkillGap();
        }


        if (viewId === "view-analytics") {
            renderRecommendation();
        }
    }


    /* ============================================================
       SIDEBAR / MOBILE MENU
    ============================================================ */

    function initSidebar() {
        const menuButton =
            byId("mobile-menu-toggle");

        const sidebar =
            byId("app-sidebar");

        const overlay =
            byId("sidebar-overlay");

        const closeButton =
            byId("sidebar-close");


        if (menuButton) {

            menuButton.addEventListener(
                "click",
                () => {
                    openSidebar();
                }
            );

        }


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeSidebar
            );

        }


        if (overlay) {

            overlay.addEventListener(
                "click",
                closeSidebar
            );

        }
    }


    function openSidebar() {

        const sidebar =
            byId("app-sidebar");

        const overlay =
            byId("sidebar-overlay");


        if (sidebar) {
            sidebar.classList.add(
                "sidebar-open"
            );

            sidebar.classList.add(
                "open"
            );
        }


        if (overlay) {
            overlay.classList.add(
                "active"
            );
        }


        document.body.classList.add(
            "sidebar-is-open"
        );
    }


    function closeSidebar() {

        const sidebar =
            byId("app-sidebar");

        const overlay =
            byId("sidebar-overlay");


        if (sidebar) {
            sidebar.classList.remove(
                "sidebar-open"
            );

            sidebar.classList.remove(
                "open"
            );
        }


        if (overlay) {
            overlay.classList.remove(
                "active"
            );
        }


        document.body.classList.remove(
            "sidebar-is-open"
        );
    }


    /* ============================================================
       THEME
    ============================================================ */

    function initTheme() {

        const savedTheme =
            localStorage.getItem(
                "skillgap-theme"
            );


        const prefersDark =
            window.matchMedia &&
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;


        if (
            savedTheme === "dark" ||
            (
                !savedTheme &&
                prefersDark
            )
        ) {
            applyTheme("dark");
        } else {
            applyTheme("light");
        }


        const buttons =
            $all(
                "#theme-toggle, #top-theme-toggle"
            );


        buttons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const isDark =
                            document.body.classList.contains(
                                "dark-mode"
                            );


                        applyTheme(
                            isDark
                                ? "light"
                                : "dark"
                        );

                    }
                );

            }
        );
    }


    function applyTheme(theme) {

        const dark =
            theme === "dark";


        document.body.classList.toggle(
            "dark-mode",
            dark
        );


        document.documentElement.setAttribute(
            "data-theme",
            dark
                ? "dark"
                : "light"
        );


        localStorage.setItem(
            "skillgap-theme",
            dark
                ? "dark"
                : "light"
        );


        const icon =
            byId("theme-icon");

        const text =
            byId("theme-text");


        if (icon) {
            icon.textContent =
                dark
                    ? "☀️"
                    : "🌙";
        }


        if (text) {
            text.textContent =
                dark
                    ? "Light Mode"
                    : "Dark Mode";
        }


        updateThemeButtons(
            dark
        );


        updateChartsTheme();
    }


    function updateThemeButtons(
        dark
    ) {

        const buttons =
            $all(
                "#top-theme-toggle"
            );


        buttons.forEach(
            button => {

                const span =
                    button.querySelector(
                        "span"
                    );


                if (span) {
                    span.textContent =
                        dark
                            ? "☀️"
                            : "🌙";
                }

            }
        );
    }


    /* ============================================================
       CAREER URL
    ============================================================ */

    function initCareerURL() {

        const button =
            byId("scrape-career-url") ||
            byId("btn-scrape-url");


        const input =
            byId("career-url") ||
            byId("input-scrape-url");


        if (!button || !input) {
            return;
        }


        button.addEventListener(
            "click",
            () => {
                scrapeCareerURL(
                    input.value.trim(),
                    button
                );
            }
        );


        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    scrapeCareerURL(
                        input.value.trim(),
                        button
                    );

                }

            }
        );


        const jobsInput =
            byId("jobs-career-url");

        const jobsButton =
            byId("rank-career-jobs");


        if (
            jobsInput &&
            jobsButton
        ) {

            jobsButton.addEventListener(
                "click",
                () => {

                    const url =
                        jobsInput.value.trim();

                    if (url) {
                        scrapeCareerURL(
                            url,
                            jobsButton
                        );
                    } else {
                        renderCurrentJobs();
                    }

                }
            );

        }
    }


    async function scrapeCareerURL(
        url,
        button
    ) {

        const status =
            byId("career-url-status") ||
            byId("scrape-results-box");


        if (!url) {

            showStatus(
                status,
                "Please enter a career or jobs URL.",
                "error"
            );

            return;
        }


        try {
            new URL(url);
        } catch (error) {

            showStatus(
                status,
                "Please enter a valid URL beginning with http:// or https://.",
                "error"
            );

            return;
        }


        setButtonLoading(
            button,
            true,
            "Analyzing..."
        );


        showStatus(
            status,
            "Fetching the career page and discovering available jobs...",
            "info"
        );


        try {

            const data =
                await apiRequest(
                    "scrape_url",
                    {
                        url
                    }
                );


            if (
                data.status === "success" ||
                data.success === true
            ) {

                STATE.careerUrl =
                    url;


                const jobs =
                    extractJobsFromResponse(
                        data
                    );


                if (jobs.length) {

                    STATE.careerJobs =
                        jobs;

                    updateJobCount(
                        jobs.length
                    );

                }


                const normalized =
                    normalizeCareerResponse(
                        data,
                        jobs
                    );


                if (
                    normalized.company ||
                    normalized.role
                ) {

                    STATE.targetCompany =
                        normalized.company ||
                        "";

                    STATE.targetRole =
                        normalized.role ||
                        "";

                }


                if (
                    normalized.requiredSkills.length
                ) {

                    STATE.requiredSkills =
                        normalized.requiredSkills;

                }


                updateCareerURLInputs(
                    url
                );


                updateTargetUI();


                showStatus(
                    status,
                    `Career source analyzed successfully. ${jobs.length} job${jobs.length === 1 ? "" : "s"} discovered.`,
                    "success"
                );


                await refreshMetrics();


                renderCurrentJobs();

                renderSkillGap();

                renderRecommendation();


            } else {

                showStatus(
                    status,
                    data.message ||
                    data.error ||
                    "Unable to analyze this career URL.",
                    "error"
                );

            }

        } catch (error) {

            console.error(
                "Career URL error:",
                error
            );


            showStatus(
                status,
                error.message ||
                "Unable to fetch the career page.",
                "error"
            );

        } finally {

            setButtonLoading(
                button,
                false
            );

        }
    }


    function updateCareerURLInputs(
        url
    ) {

        [
            "career-url",
            "jobs-career-url",
            "input-scrape-url"
        ].forEach(
            id => {

                const input =
                    byId(id);

                if (input) {
                    input.value =
                        url;
                }

            }
        );
    }


    /* ============================================================
       CAREER RESPONSE NORMALIZATION
    ============================================================ */

    function normalizeCareerResponse(
        data,
        jobs = []
    ) {

        const company =
            data.target_company ||
            data.company ||
            "";


        const role =
            data.target_role ||
            data.role ||
            "";


        let skills =
            data.required_skills ||
            data.skills ||
            [];


        if (
            typeof skills === "string"
        ) {

            try {
                skills =
                    JSON.parse(skills);
            } catch (error) {
                skills =
                    skills
                        .split(",")
                        .map(
                            item =>
                                item.trim()
                        );
            }

        }


        if (
            !Array.isArray(skills)
        ) {
            skills = [];
        }


        if (
            !skills.length &&
            jobs.length
        ) {

            skills =
                collectRequiredSkills(
                    jobs
                );

        }


        return {
            company,
            role,
            requiredSkills:
                normalizeSkills(
                    skills
                )
        };
    }


    function extractJobsFromResponse(
        data
    ) {

        const possible =
            data.jobs ||
            data.career_jobs ||
            data.results ||
            data.job_results ||
            [];


        if (!Array.isArray(possible)) {
            return [];
        }


        return possible
            .map(
                normalizeJob
            )
            .filter(
                job =>
                    job.title ||
                    job.role
            );
    }


    /* ============================================================
       JOB NORMALIZATION
    ============================================================ */

    function normalizeJob(
        raw
    ) {

        raw =
            raw || {};


        const title =
            raw.title ||
            raw.role ||
            raw.position ||
            raw.job_title ||
            "";


        const company =
            raw.company ||
            raw.company_name ||
            STATE.targetCompany ||
            "";


        const location =
            raw.location ||
            raw.locations ||
            raw.city ||
            "";


        const url =
            raw.url ||
            raw.link ||
            raw.job_url ||
            raw.apply_url ||
            "";


        let skills =
            raw.required_skills ||
            raw.skills ||
            raw.requirements ||
            [];


        if (
            typeof skills === "string"
        ) {

            skills =
                skills
                    .split(
                        /[,;\n|]+/
                    )
                    .map(
                        item =>
                            item.trim()
                    )
                    .filter(Boolean);

        }


        if (
            !Array.isArray(skills)
        ) {
            skills = [];
        }


        return {
            ...raw,

            title:
                String(title),

            role:
                String(title),

            company:
                String(company),

            location:
                String(location),

            url:
                String(url),

            requiredSkills:
                normalizeSkills(
                    skills
                ),

            skills:
                normalizeSkills(
                    skills
                )
        };
    }


    function collectRequiredSkills(
        jobs
    ) {

        const result = [];
        const seen = new Set();


        jobs.forEach(
            job => {

                const skills =
                    job.requiredSkills ||
                    job.skills ||
                    [];


                skills.forEach(
                    skill => {

                        const normalized =
                            normalizeSkill(
                                skill
                            );


                        if (
                            normalized &&
                            !seen.has(
                                normalized
                            )
                        {

                            seen.add(
                                normalized
                            );

                            result.push(
                                skill
                            );

                        }

                    }
                );

            }
        );


        return result;
    }


    /* ============================================================
       JOB MATCHING
    ============================================================ */

    function calculateJobMatch(
        job
    ) {

        const resumeSkills =
            normalizeSkills(
                STATE.extractedSkills
            );


        const jobSkills =
            normalizeSkills(
                job.requiredSkills ||
                job.skills ||
                []
            );


        if (!jobSkills.length) {

            return {
                score: 0,
                matched: [],
                missing: []
            };

        }


        const resumeSet =
            new Set(
                resumeSkills.map(
                    normalizeSkill
                )
            );


        const matched = [];
        const missing = [];


        jobSkills.forEach(
            skill => {

                const normalized =
                    normalizeSkill(
                        skill
                    );


                let found =
                    resumeSet.has(
                        normalized
                    );


                if (!found) {

                    for (
                        const resumeSkill
                        of resumeSkills
                    ) {

                        const resumeNormalized =
                            normalizeSkill(
                                resumeSkill
                            );


                        if (
                            resumeNormalized.includes(
                                normalized
                            ) ||
                            normalized.includes(
                                resumeNormalized
                            )
                        ) {

                            found = true;
                            break;

                        }

                    }

                }


                if (found) {
                    matched.push(
                        skill
                    );
                } else {
                    missing.push(
                        skill
                    );
                }

            }
        );


        const score =
            Math.round(
                (
                    matched.length /
                    jobSkills.length
                ) * 100
            );


        return {
            score,
            matched,
            missing
        };
    }


    function rankJobs(
        jobs
    ) {

        return jobs
            .map(
                job => {

                    const match =
                        calculateJobMatch(
                            job
                        );


                    return {
                        ...job,

                        matchScore:
                            match.score,

                        matched:
                            match.matched,

                        missing:
                            match.missing
                    };

                }
            )
            .sort(
                (a, b) =>
                    b.matchScore -
                    a.matchScore
            );
    }


    /* ============================================================
       RESUME UPLOAD
    ============================================================ */

    function initResumeUpload() {

        const form =
            byId("form-resume-upload");


        const fileInput =
            byId("resume-file") ||
            byId("input-resume-file");


        const evaluateButton =
            byId("evaluate-resume");


        if (!form && !fileInput) {
            return;
        }


        if (form) {

            form.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    uploadResume(
                        fileInput,
                        evaluateButton
                    );

                }
            );

        } else if (evaluateButton) {

            evaluateButton.addEventListener(
                "click",
                () => {

                    uploadResume(
                        fileInput,
                        evaluateButton
                    );

                }
            );

        }


        if (fileInput) {

            fileInput.addEventListener(
                "change",
                () => {

                    const file =
                        fileInput.files &&
                        fileInput.files[0];


                    if (file) {

                        const status =
                            byId(
                                "resume-upload-status"
                            );


                        if (status) {

                            showStatus(
                                status,
                                `${file.name} selected. Click Evaluate Resume to continue.`,
                                "info"
                            );

                        }

                    }

                }
            );

        }


        initResumeDropZone(
            fileInput
        );
    }


    function initResumeDropZone(
        fileInput
    ) {

        const dropZone =
            byId("resume-drop-zone");


        if (
            !dropZone ||
            !fileInput
        ) {
            return;
        }


        [
            "dragenter",
            "dragover"
        ].forEach(
            eventName => {

                dropZone.addEventListener(
                    eventName,
                    event => {

                        event.preventDefault();

                        dropZone.classList.add(
                            "drag-active"
                        );

                    }
                );

            }
        );


        [
            "dragleave",
            "drop"
        ].forEach(
            eventName => {

                dropZone.addEventListener(
                    eventName,
                    event => {

                        event.preventDefault();

                        dropZone.classList.remove(
                            "drag-active"
                        );

                    }
                );

            }
        );


        dropZone.addEventListener(
            "drop",
            event => {

                const files =
                    event.dataTransfer.files;


                if (
                    files &&
                    files.length
                ) {

                    try {

                        fileInput.files =
                            files;

                    } catch (error) {
                        console.warn(
                            "Could not assign dropped file.",
                            error
                        );
                    }

                    const status =
                        byId(
                            "resume-upload-status"
                        );


                    showStatus(
                        status,
                        `${files[0].name} selected.`,
                        "success"
                    );

                }

            }
        );


        dropZone.addEventListener(
            "click",
            event => {

                if (
                    event.target !== fileInput
                ) {

                    fileInput.click();

                }

            }
        );
    }


    async function uploadResume(
        fileInput,
        button
    ) {

        const status =
            byId(
                "resume-upload-status"
            );


        if (
            !fileInput ||
            !fileInput.files ||
            !fileInput.files[0]
        ) {

            showStatus(
                status,
                "Please select a resume first.",
                "error"
            );

            return;
        }


        const file =
            fileInput.files[0];


        const allowed =
            [
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "text/plain"
            ];


        const extension =
            file.name
                .split(".")
                .pop()
                .toLowerCase();


        if (
            !allowed.includes(
                file.type
            ) &&
            ![
                "pdf",
                "docx",
                "txt"
            ].includes(
                extension
            )
        ) {

            showStatus(
                status,
                "Please upload a PDF, DOCX or TXT resume.",
                "error"
            );

            return;
        }


        setButtonLoading(
            button,
            true,
            "Evaluating..."
        );


        showStatus(
            status,
            "Extracting resume information and calculating ATS score...",
            "info"
        );


        try {

            const formData =
                new FormData();


            formData.append(
                "action",
                "upload_resume"
            );


            /*
             * Support both the old API name
             * and the new form name.
             */
            formData.append(
                "resume_file",
                file
            );

            formData.append(
                "resume",
                file
            );


            formData.append(
                "target_company",
                STATE.targetCompany
            );


            formData.append(
                "target_role",
                STATE.targetRole
            );


            formData.append(
                "required_skills",
                JSON.stringify(
                    STATE.requiredSkills
                )
            );


            const response =
                await fetch(
                    "api.php",
                    {
                        method: "POST",
                        body: formData,
                        credentials: "same-origin"
                    }
                );


            const data =
                await response.json();


            if (
                data.status === "success" ||
                data.success === true
            ) {

                if (
                    Array.isArray(
                        data.extracted_skills
                    )
                ) {

                    STATE.extractedSkills =
                        normalizeSkills(
                            data.extracted_skills
                        );

                }


                if (
                    data.ats_score !== undefined
                ) {

                    STATE.atsScore =
                        Number(
                            data.ats_score
                        );

                }


                showStatus(
                    status,
                    data.message ||
                    "Resume analyzed successfully.",
                    "success"
                );


                updateResumeUI(
                    data
                );


                await refreshMetrics();

                renderSkillGap();

                renderRecommendation();


            } else {

                showStatus(
                    status,
                    data.message ||
                    data.error ||
                    "Resume evaluation failed.",
                    "error"
                );

            }

        } catch (error) {

            console.error(
                "Resume upload error:",
                error
            );


            showStatus(
                status,
                error.message ||
                "Unable to process the resume.",
                "error"
            );

        } finally {

            setButtonLoading(
                button,
                false
            );

        }
    }


    /* ============================================================
       RESUME UI
    ============================================================ */

    function updateResumeUI(
        data = {}
    ) {

        const skills =
            normalizeSkills(
                data.extracted_skills ||
                STATE.extractedSkills
            );


        STATE.extractedSkills =
            skills;


        if (
            data.ats_score !== undefined
        ) {

            STATE.atsScore =
                Number(
                    data.ats_score
                );

        }


        setText(
            "ats-score",
            Math.round(
                STATE.atsScore
            )
        );


        setText(
            "metric-ats",
            `${Math.round(
                STATE.atsScore
            )}/100`
        );


        renderSkills(
            "resume-skills-list",
            skills,
            "matched"
        );


        renderSkills(
            "skillgap-user-skills",
            skills,
            "matched"
        );


        if (
            data.name
        ) {
            setText(
                "resume-name",
                data.name
            );
        }


        if (
            data.email
        ) {
            setText(
                "resume-email",
                data.email
            );
        }


        if (
            data.phone
        ) {
            setText(
                "resume-phone",
                data.phone
            );
        }


        updateStats();
    }


    function renderSkills(
        containerId,
        skills,
        className = ""
    ) {

        const container =
            byId(containerId);


        if (!container) {
            return;
        }


        if (!skills.length) {

            container.innerHTML =
                `<span class="empty-inline">
                    No skills detected yet.
                </span>`;

            return;
        }


        container.innerHTML =
            skills
                .map(
                    skill =>
                        `<span class="skill-tag ${escapeHtml(
                            className
                        )}">
                            ${escapeHtml(skill)}
                        </span>`
                )
                .join("");
    }


    /* ============================================================
       METRICS
    ============================================================ */

    async function refreshMetrics() {

        try {

            const data =
                await apiRequest(
                    "get_metrics",
                    {
                        target_company:
                            STATE.targetCompany,

                        target_role:
                            STATE.targetRole,

                        required_skills:
                            STATE.requiredSkills
                    }
                );


            STATE.metrics =
                data;


            if (
                Array.isArray(
                    data.required_skills
                )
            ) {

                STATE.requiredSkills =
                    normalizeSkills(
                        data.required_skills
                    );

            }


            if (
                Array.isArray(
                    data.matched_skills
                )
            ) {

                STATE.matchedSkills =
                    normalizeSkills(
                        data.matched_skills
                    );

            }


            if (
                Array.isArray(
                    data.missing_skills
                )
            ) {

                STATE.missingSkills =
                    normalizeSkills(
                        data.missing_skills
                    );

            }


            updateMetricsUI(
                data
            );


            updateStats();


            updateCharts(
                data
            );


            return data;

        } catch (error) {

            console.warn(
                "Metrics request failed:",
                error
            );


            /*
             * Local fallback keeps the UI useful
             * even if the API doesn't return metrics.
             */
            const fallback =
                calculateLocalMetrics();


            STATE.metrics =
                fallback;


            updateMetricsUI(
                fallback
            );


            updateStats();


            return fallback;
        }
    }


    function calculateLocalMetrics() {

        const required =
            normalizeSkills(
                STATE.requiredSkills
            );


        const current =
            normalizeSkills(
                STATE.extractedSkills
            );


        const currentSet =
            new Set(
                current.map(
                    normalizeSkill
                )
            );


        const matched =
            required.filter(
                skill =>
                    currentSet.has(
                        normalizeSkill(
                            skill
                        )
                    )
            );


        const missing =
            required.filter(
                skill =>
                    !currentSet.has(
                        normalizeSkill(
                            skill
                        )
                    )
            );


        const readiness =
            required.length
                ? Math.round(
                    (
                        matched.length /
                        required.length
                    ) * 100
                )
                : 0;


        return {
            readiness_pct:
                readiness,

            confidence_pct:
                current.length
                    ? Math.min(
                        95,
                        55 +
                        current.length * 3
                    )
                    : 0,

            matched_skills:
                matched,

            missing_skills:
                missing,

            required_skills:
                required,

            ats_score:
                STATE.atsScore
        };
    }


    function updateMetricsUI(
        data
    ) {

        const readiness =
            Number(
                data.readiness_pct ??
                data.readiness ??
                0
            );


        const confidence =
            Number(
                data.confidence_pct ??
                data.confidence ??
                0
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


        const required =
            Array.isArray(
                data.required_skills
            )
                ? data.required_skills
                : [
                    ...matched,
                    ...missing
                ];


        if (
            data.ats_score !== undefined
        ) {

            STATE.atsScore =
                Number(
                    data.ats_score
                );

        }


        setText(
            "metric-ats",
            `${Math.round(
                STATE.atsScore
            )}/100`
        );


        setText(
            "metric-readiness",
            `${Math.round(
                readiness
            )}%`
        );


        setText(
            "metric-confidence",
            `${Math.round(
                confidence
            )}%`
        );


        setText(
            "metric-jobs",
            STATE.careerJobs.length
        );


        setText(
            "metric-match",
            `${Math.round(
                readiness
            )}%`
        );


        setText(
            "metric-matched-count",
            `${matched.length} of ${required.length} Skills Matched`
        );


        let strength =
            "Getting Started";


        if (readiness >= 80) {
            strength = "Strong";
        } else if (readiness >= 60) {
            strength = "Good";
        } else if (readiness >= 40) {
            strength = "Developing";
        }


        setText(
            "metric-strength",
            strength
        );


        renderSkills(
            "skillgap-user-skills",
            STATE.extractedSkills,
            "matched"
        );


        renderSkills(
            "skillgap-required-skills",
            required,
            "required"
        );


        renderMissingSkills(
            missing
        );


        STATE.requiredSkills =
            normalizeSkills(
                required
            );


        updateTargetUI();
    }


    function updateStats() {

        setText(
            "metric-ats",
            `${Math.round(
                STATE.atsScore || 0
            )}/100`
        );


        setText(
            "metric-jobs",
            STATE.careerJobs.length
        );


        const metrics =
            STATE.metrics ||
            calculateLocalMetrics();


        const readiness =
            Number(
                metrics.readiness_pct || 0
            );


        setText(
            "metric-readiness",
            `${Math.round(
                readiness
            )}%`
        );


        setText(
            "metric-match",
            `${Math.round(
                readiness
            )}%`
        );
    }


    function renderMissingSkills(
        missing
    ) {

        const container =
            byId(
                "missing-skills-list"
            );


        if (!container) {
            return;
        }


        if (!missing.length) {

            container.innerHTML =
                `<span class="skill-tag matched">
                    All currently identified required skills are matched.
                </span>`;

            return;
        }


        container.innerHTML =
            missing
                .map(
                    skill =>
                        `<span class="skill-tag missing">
                            ${escapeHtml(skill)}
                        </span>`
                )
                .join("");
    }


    /* ============================================================
       TARGET UI
    ============================================================ */

    function updateTargetUI() {

        const company =
            STATE.targetCompany;


        const role =
            STATE.targetRole;


        const heading =
            byId(
                "banner-company-role"
            );


        if (heading) {

            if (company && role) {

                heading.textContent =
                    `${company} · ${role}`;

            } else if (role) {

                heading.textContent =
                    role;

            } else if (company) {

                heading.textContent =
                    company;

            } else {

                heading.textContent =
                    "Career Target Not Selected";

            }

        }


        const sidebarTarget =
            byId(
                "sidebar-target-summary"
            );


        if (sidebarTarget) {

            if (
                company ||
                role
            ) {

                sidebarTarget.innerHTML =
                    `<strong>
                        ${escapeHtml(
                            company ||
                            "Dynamic Career Target"
                        )}
                    </strong>
                    ${
                        role
                            ? `<span>
                                ${escapeHtml(role)}
                               </span>`
                            : ""
                    }`;

            } else {

                sidebarTarget.innerHTML =
                    `<span class="muted">
                        No target selected
                    </span>`;

            }

        }


        const reportCompany =
            byId(
                "report-target-company"
            );


        const reportRole =
            byId(
                "report-target-role"
            );


        if (reportCompany) {
            reportCompany.value =
                company;
        }


        if (reportRole) {
            reportRole.value =
                role;
        }
    }


    /* ============================================================
       SKILL GAP
    ============================================================ */

    function renderSkillGap() {

        const metrics =
            STATE.metrics ||
            calculateLocalMetrics();


        const required =
            normalizeSkills(
                metrics.required_skills ||
                STATE.requiredSkills
            );


        const current =
            normalizeSkills(
                STATE.extractedSkills
            );


        const currentSet =
            new Set(
                current.map(
                    normalizeSkill
                )
            );


        const missing =
            normalizeSkills(
                metrics.missing_skills ||
                required.filter(
                    skill =>
                        !currentSet.has(
                            normalizeSkill(
                                skill
                            )
                        )
                )
            );


        renderSkills(
            "skillgap-user-skills",
            current,
            "matched"
        );


        renderSkills(
            "skillgap-required-skills",
            required,
            "required"
        );


        renderMissingSkills(
            missing
        );
    }


    /* ============================================================
       RECOMMENDATION
    ============================================================ */

    function renderRecommendation() {

        const container =
            byId(
                "recommended-job"
            );


        if (!container) {
            return;
        }


        if (
            STATE.recommendedJob &&
            typeof STATE.recommendedJob ===
                "object"
        ) {

            renderSingleRecommendation(
                container,
                STATE.recommendedJob
            );

            return;
        }


        const ranked =
            rankJobs(
                STATE.careerJobs
            );


        if (!ranked.length) {

            container.innerHTML =
                `<div class="empty-state">
                    <div class="empty-icon">🔎</div>
                    <h3>No recommendation yet</h3>
                    <p>
                        Analyze a career URL and upload your
                        resume to generate a dynamic recommendation.
                    </p>
                </div>`;

            return;
        }


        const best =
            ranked[0];


        STATE.recommendedJob =
            best;


        renderSingleRecommendation(
            container,
            best
        );
    }


    function renderSingleRecommendation(
        container,
        job
    ) {

        const match =
            job.matchScore !== undefined
                ? job.matchScore
                : calculateJobMatch(
                    normalizeJob(job)
                ).score;


        const title =
            job.title ||
            job.role ||
            "Job Opportunity";


        const company =
            job.company ||
            "";


        const location =
            job.location ||
            "";


        const url =
            job.url ||
            job.link ||
            "";


        const missing =
            Array.isArray(
                job.missing
            )
                ? job.missing
                : calculateJobMatch(
                    normalizeJob(job)
                ).missing;


        container.innerHTML =
            `<div class="recommendation-content">

                <div class="recommendation-main">

                    <span class="recommendation-badge">
                        BEST DYNAMIC MATCH
                    </span>

                    <h3>
                        ${escapeHtml(title)}
                    </h3>

                    ${
                        company
                            ? `<div class="recommendation-company">
                                ${escapeHtml(company)}
                               </div>`
                            : ""
                    }

                    ${
                        location
                            ? `<div class="recommendation-location">
                                📍 ${escapeHtml(location)}
                               </div>`
                            : ""
                    }

                    <div class="recommendation-score">
                        <strong>
                            ${Math.round(match)}%
                        </strong>
                        <span>
                            Skill Match
                        </span>
                    </div>

                    ${
                        missing.length
                            ? `<div class="recommendation-missing">
                                <strong>Skills to develop:</strong>
                                <div class="skill-list">
                                    ${missing
                                        .slice(0, 8)
                                        .map(
                                            skill =>
                                                `<span class="skill-tag missing">
                                                    ${escapeHtml(skill)}
                                                </span>`
                                        )
                                        .join("")}
                                </div>
                               </div>`
                            : `<div class="recommendation-success">
                                All identified job skills are matched.
                               </div>`
                    }

                    ${
                        url
                            ? `<a
                                class="btn btn-primary"
                                href="${escapeHtml(url)}"
                                target="_blank"
                                rel="noopener noreferrer"
                               >
                                View Job
                               </a>`
                            : ""
                    }

                </div>

            </div>`;
    }


    /* ============================================================
       JOB RANKING
    ============================================================ */

    function initJobRanking() {

        const rankButton =
            byId(
                "rank-career-jobs"
            );


        if (rankButton) {

            rankButton.addEventListener(
                "click",
                async () => {

                    const input =
                        byId(
                            "jobs-career-url"
                        );


                    const url =
                        input
                            ? input.value.trim()
                            : "";


                    if (url) {

                        await scrapeCareerURL(
                            url,
                            rankButton
                        );

                    } else {

                        await loadRankedJobs();

                    }

                }
            );

        }


        const oldDomainFilter =
            byId(
                "select-job-domain-filter"
            );


        const oldSearch =
            byId(
                "input-job-search"
            );


        if (
            oldDomainFilter ||
            oldSearch
        ) {

            if (oldDomainFilter) {

                oldDomainFilter.addEventListener(
                    "change",
                    () => {
                        renderCurrentJobs();
                    }
                );

            }


            if (oldSearch) {

                oldSearch.addEventListener(
                    "input",
                    () => {
                        renderCurrentJobs();
                    }
                );

            }

        }
    }


    async function loadRankedJobs() {

        try {

            const data =
                await apiRequest(
                    "rank_jobs",
                    {}
                );


            const jobs =
                extractJobsFromResponse(
                    data
                );


            if (jobs.length) {

                STATE.careerJobs =
                    jobs;

            }


            renderCurrentJobs();

        } catch (error) {

            console.warn(
                "Server ranking failed:",
                error
            );


            renderCurrentJobs();

        }
    }


    function renderCurrentJobs() {

        const container =
            byId(
                "job-results"
            );


        if (!container) {
            return;
        }


        let jobs =
            rankJobs(
                STATE.careerJobs
            );


        const searchInput =
            byId(
                "input-job-search"
            );


        const search =
            searchInput
                ? searchInput.value
                    .trim()
                    .toLowerCase()
                : "";


        if (search) {

            jobs =
                jobs.filter(
                    job =>
                        String(
                            job.company
                        )
                            .toLowerCase()
                            .includes(search) ||

                        String(
                            job.title
                        )
                            .toLowerCase()
                            .includes(search) ||

                        String(
                            job.location
                        )
                            .toLowerCase()
                            .includes(search)
                );

        }


        if (!jobs.length) {

            container.innerHTML =
                `<div class="empty-state-card">

                    <div class="empty-icon">
                        💼
                    </div>

                    <h3>
                        No jobs available
                    </h3>

                    <p>
                        Analyze a career URL to discover
                        jobs dynamically.
                    </p>

                </div>`;

            return;
        }


        container.innerHTML =
            `<div class="jobs-grid">

                ${jobs
                    .map(
                        (job, index) =>
                            renderJobCard(
                                job,
                                index
                            )
                    )
                    .join("")}

            </div>`;


        updateJobCount(
            jobs.length
        );
    }


    function renderJobCard(
        job,
        index
    ) {

        const title =
            job.title ||
            job.role ||
            "Job Opportunity";


        const company =
            job.company ||
            "";


        const location =
            job.location ||
            "";


        const url =
            job.url ||
            job.link ||
            "";


        const score =
            Number(
                job.matchScore || 0
            );


        const matched =
            Array.isArray(
                job.matched
            )
                ? job.matched
                : [];


        const missing =
            Array.isArray(
                job.missing
            )
                ? job.missing
                : [];


        return `
            <article
                class="job-card"
                data-job-index="${index}"
            >

                <div class="job-card-top">

                    <span class="job-rank">
                        #${index + 1}
                    </span>

                    <span class="job-match">
                        ${score}% Match
                    </span>

                </div>


                <h3>
                    ${escapeHtml(title)}
                </h3>


                ${
                    company
                        ? `<div class="job-company">
                            ${escapeHtml(company)}
                           </div>`
                        : ""
                }


                ${
                    location
                        ? `<div class="job-location">
                            📍 ${escapeHtml(location)}
                           </div>`
                        : ""
                }


                <div class="job-skills">

                    ${
                        matched
                            .slice(0, 6)
                            .map(
                                skill =>
                                    `<span class="skill-tag matched">
                                        ${escapeHtml(skill)}
                                    </span>`
                            )
                            .join("")
                    }

                    ${
                        missing
                            .slice(0, 5)
                            .map(
                                skill =>
                                    `<span class="skill-tag missing">
                                        ${escapeHtml(skill)}
                                    </span>`
                            )
                            .join("")
                    }

                </div>


                <div class="job-card-actions">

                    <button
                        type="button"
                        class="btn btn-secondary btn-use-job"
                        data-job-index="${index}"
                    >
                        Use as Target
                    </button>

                    ${
                        url
                            ? `<a
                                href="${escapeHtml(url)}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="btn btn-primary"
                               >
                                Open Job
                               </a>`
                            : ""
                    }

                </div>

            </article>
        `;
    }


    function initJobCardActions() {

        document.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        ".btn-use-job"
                    );


                if (!button) {
                    return;
                }


                const index =
                    Number(
                        button.dataset.jobIndex
                    );


                const job =
                    STATE.careerJobs[index];


                if (!job) {
                    return;
                }


                useJobAsTarget(
                    job
                );

            }
        );
    }


    function useJobAsTarget(
        job
    ) {

        STATE.targetCompany =
            job.company || "";


        STATE.targetRole =
            job.title ||
            job.role ||
            "";


        STATE.requiredSkills =
            normalizeSkills(
                job.requiredSkills ||
                job.skills ||
                []
            );


        STATE.recommendedJob =
            job;


        updateTargetUI();


        renderRecommendation();


        refreshMetrics();


        const dashboardNav =
            $(
                ".nav-item[data-view='view-analytics']"
            );


        if (dashboardNav) {
            dashboardNav.click();
        }
    }


    function updateJobCount(
        count
    ) {

        setText(
            "metric-jobs",
            count
        );
    }


    /* ============================================================
       ROADMAP
    ============================================================ */

    async function loadDynamicRoadmap() {

        const container =
            byId(
                "container-dynamic-roadmap"
            );


        const resources =
            byId(
                "container-dynamic-resources"
            );


        if (!container) {
            return;
        }


        const metrics =
            STATE.metrics ||
            calculateLocalMetrics();


        const missing =
            Array.isArray(
                metrics.missing_skills
            )
                ? metrics.missing_skills
                : [];


        container.innerHTML =
            `<div class="loading-inline">
                Generating your personalized roadmap...
             </div>`;


        try {

            const data =
                await apiRequest(
                    "get_roadmap",
                    {
                        missing_skills:
                            missing,

                        target_company:
                            STATE.targetCompany,

                        target_role:
                            STATE.targetRole
                    }
                );


            if (
                data.status !== "success" &&
                data.success !== true
            ) {

                throw new Error(
                    data.message ||
                    "Roadmap generation failed."
                );

            }


            const roadmap =
                data.roadmap ||
                data.data ||
                {};


            const phases =
                Array.isArray(
                    roadmap.phases
                )
                    ? roadmap.phases
                    : [];


            const resourceItems =
                Array.isArray(
                    roadmap.resources
                )
                    ? roadmap.resources
                    : [];


            if (!phases.length) {

                container.innerHTML =
                    `<div class="empty-state-card">

                        <div class="empty-icon">
                            🗺️
                        </div>

                        <h3>
                            Roadmap is not available yet
                        </h3>

                        <p>
                            Upload your resume and analyze
                            a career URL first.
                        </p>

                    </div>`;

            } else {

                container.innerHTML =
                    phases
                        .map(
                            (
                                phase,
                                index
                            ) =>
                                renderRoadmapPhase(
                                    phase,
                                    index
                                )
                        )
                        .join("");

            }


            if (resources) {

                if (
                    resourceItems.length
                ) {

                    resources.innerHTML =
                        `<div class="resource-grid">
                            ${resourceItems
                                .map(
                                    resource =>
                                        renderRoadmapResource(
                                            resource
                                        )
                                )
                                .join("")}
                         </div>`;

                } else {

                    resources.innerHTML =
                        "";

                }

            }


            STATE.roadmapLoaded =
                true;

        } catch (error) {

            console.warn(
                "Roadmap error:",
                error
            );


            /*
             * Local fallback.
             */
            renderLocalRoadmap(
                container,
                resources,
                missing
            );

        }
    }


    function renderRoadmapPhase(
        phase,
        index
    ) {

        const title =
            phase.phase ||
            `Phase ${index + 1}`;


        const objective =
            phase.objective ||
            phase.description ||
            "";


        const duration =
            phase.duration ||
            "";


        const skills =
            Array.isArray(
                phase.skills
            )
                ? phase.skills
                : [];


        const actions =
            Array.isArray(
                phase.action_items
            )
                ? phase.action_items
                : (
                    Array.isArray(
                        phase.actions
                    )
                        ? phase.actions
                        : []
                );


        return `
            <div class="roadmap-phase-card">

                <div class="roadmap-number">
                    ${index + 1}
                </div>

                <div class="roadmap-phase-content">

                    <div class="roadmap-phase-header">

                        <h3>
                            ${escapeHtml(title)}
                        </h3>

                        ${
                            duration
                                ? `<span>
                                    ${escapeHtml(duration)}
                                   </span>`
                                : ""
                        }

                    </div>


                    ${
                        objective
                            ? `<p>
                                ${escapeHtml(objective)}
                               </p>`
                            : ""
                    }


                    ${
                        skills.length
                            ? `<div class="skill-list">
                                ${skills
                                    .map(
                                        skill =>
                                            `<span class="skill-tag required">
                                                ${escapeHtml(skill)}
                                            </span>`
                                    )
                                    .join("")}
                               </div>`
                            : ""
                    }


                    ${
                        actions.length
                            ? `<ul class="roadmap-actions">
                                ${actions
                                    .map(
                                        action =>
                                            `<li>
                                                ${escapeHtml(action)}
                                             </li>`
                                    )
                                    .join("")}
                               </ul>`
                            : ""
                    }

                </div>

            </div>
        `;
    }


    function renderRoadmapResource(
        resource
    ) {

        const skill =
            resource.skill ||
            "Skill";


        const platform =
            resource.platform ||
            "";


        const time =
            resource.time ||
            "";


        const docs =
            resource.docs ||
            "";


        const project =
            resource.project ||
            "";


        return `
            <div class="resource-card">

                <h3>
                    ${escapeHtml(skill)}
                </h3>

                ${
                    platform
                        ? `<p>
                            <strong>Platform:</strong>
                            ${escapeHtml(platform)}
                           </p>`
                        : ""
                }

                ${
                    time
                        ? `<p>
                            <strong>Time:</strong>
                            ${escapeHtml(time)}
                           </p>`
                        : ""
                }

                ${
                    docs
                        ? `<p>
                            <a
                                href="${escapeHtml(docs)}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Official Documentation ↗
                            </a>
                           </p>`
                        : ""
                }

                ${
                    project
                        ? `<p>
                            <strong>Project:</strong>
                            ${escapeHtml(project)}
                           </p>`
                        : ""
                }

            </div>
        `;
    }


    function renderLocalRoadmap(
        container,
        resources,
        missing
    ) {

        if (!missing.length) {

            container.innerHTML =
                `<div class="empty-state-card">

                    <div class="empty-icon">
                        🎉
                    </div>

                    <h3>
                        No major skill gaps detected
                    </h3>

                    <p>
                        Continue strengthening your current
                        skills through projects and practice.
                    </p>

                </div>`;

            if (resources) {
                resources.innerHTML =
                    "";
            }

            return;
        }


        const phases = [
            {
                phase:
                    "Phase 1 — Foundation",

                objective:
                    "Understand the concepts behind the missing skills.",

                duration:
                    "1–2 weeks",

                skills:
                    missing.slice(0, 4),

                action_items:
                    [
                        "Study the fundamentals.",
                        "Practice small examples.",
                        "Create short notes.",
                        "Solve basic exercises."
                    ]
            },

            {
                phase:
                    "Phase 2 — Practical Skills",

                objective:
                    "Apply the missing skills through hands-on work.",

                duration:
                    "2–3 weeks",

                skills:
                    missing.slice(0, 5),

                action_items:
                    [
                        "Build a small practical project.",
                        "Use the skills together.",
                        "Debug common problems.",
                        "Document your implementation."
                    ]
            },

            {
                phase:
                    "Phase 3 — Portfolio",

                objective:
                    "Demonstrate the skills through a meaningful project.",

                duration:
                    "2–4 weeks",

                skills:
                    missing.slice(0, 6),

                action_items:
                    [
                        "Build one portfolio project.",
                        "Add tests and documentation.",
                        "Publish the project.",
                        "Prepare an explanation for interviews."
                    ]
            }
        ];


        container.innerHTML =
            phases
                .map(
                    renderRoadmapPhase
                )
                .join("");


        if (resources) {

            resources.innerHTML =
                `<div class="resource-card">

                    <h3>
                        Skill Development Resources
                    </h3>

                    <p>
                        Focus on official documentation,
                        practical projects and hands-on exercises
                        for each missing skill.
                    </p>

                </div>`;

        }
    }


    /* ============================================================
       INTERVIEW PREPARATION
    ============================================================ */

    async function loadDynamicInterview() {

        const questionElement =
            byId(
                "interview-question"
            );


        if (!questionElement) {
            return;
        }


        questionElement.textContent =
            "Generating interview questions based on your current career analysis...";


        const metrics =
            STATE.metrics ||
            calculateLocalMetrics();


        const matched =
            Array.isArray(
                metrics.matched_skills
            )
                ? metrics.matched_skills
                : [];


        const missing =
            Array.isArray(
                metrics.missing_skills
            )
                ? metrics.missing_skills
                : [];


        try {

            const data =
                await apiRequest(
                    "get_interview",
                    {
                        target_role:
                            STATE.targetRole,

                        target_company:
                            STATE.targetCompany,

                        matched_skills:
                            matched,

                        missing_skills:
                            missing
                    }
                );


            if (
                data.status !== "success" &&
                data.success !== true
            ) {

                throw new Error(
                    data.message ||
                    "Interview preparation unavailable."
                );

            }


            const prep =
                data.prep_data ||
                data.interview ||
                data.data ||
                {};


            const questions =
                buildInterviewQuestions(
                    prep
                );


            STATE.interviewQuestions =
                questions;


            STATE.currentQuestionIndex =
                0;


            if (questions.length) {

                renderCurrentInterviewQuestion();

            } else {

                questionElement.textContent =
                    "No interview questions are available yet. Analyze your career source first.";

            }


            STATE.interviewLoaded =
                true;


        } catch (error) {

            console.warn(
                "Interview API error:",
                error
            );


            const questions =
                buildLocalInterviewQuestions(
                    matched,
                    missing
                );


            STATE.interviewQuestions =
                questions;


            STATE.currentQuestionIndex =
                0;


            renderCurrentInterviewQuestion();
        }
    }


    function buildInterviewQuestions(
        prep
    ) {

        const questions = [];


        const known =
            Array.isArray(
                prep.technical_known
            )
                ? prep.technical_known
                : [];


        const gaps =
            Array.isArray(
                prep.gap_questions
            )
                ? prep.gap_questions
                : [];


        const behavioral =
            Array.isArray(
                prep.behavioral
            )
                ? prep.behavioral
                : [];


        known.forEach(
            item => {

                questions.push({
                    category:
                        "Technical",

                    skill:
                        item.skill || "",

                    question:
                        item.q ||
                        item.question ||
                        "",

                    answer:
                        item.a ||
                        item.answer ||
                        "",

                    tip:
                        item.tip ||
                        ""
                });

            }
        );


        gaps.forEach(
            item => {

                questions.push({
                    category:
                        "Skill Gap",

                    skill:
                        item.skill || "",

                    question:
                        item.q ||
                        item.question ||
                        "",

                    answer:
                        item.a ||
                        item.answer ||
                        "",

                    tip:
                        item.tip ||
                        ""
                });

            }
        );


        behavioral.forEach(
            item => {

                questions.push({
                    category:
                        "HR / Behavioral",

                    skill:
                        "",

                    question:
                        item.q ||
                        item.question ||
                        "",

                    answer:
                        item.guide ||
                        item.a ||
                        "",

                    tip:
                        item.framework ||
                        ""
                });

            }
        );


        return questions.filter(
            question =>
                question.question
        );
    }


    function buildLocalInterviewQuestions(
        matched,
        missing
    ) {

        const questions = [];


        matched
            .slice(0, 5)
            .forEach(
                skill => {

                    questions.push({
                        category:
                            "Technical",

                        skill,

                        question:
                            `Explain ${skill} and describe how you have used it in a project.`,

                        answer:
                            "",

                        tip:
                            "Give a definition, explain the practical use and provide a project example."
                    });

                }
            );


        missing
            .slice(0, 5)
            .forEach(
                skill => {

                    questions.push({
                        category:
                            "Skill Gap",

                        skill,

                        question:
                            `What do you know about ${skill}, and how would you approach learning or applying it?`,

                        answer:
                            "",

                        tip:
                            "Be honest about your current level and explain a concrete learning plan."
                    });

                }
            );


        questions.push({
            category:
                "HR / Behavioral",

            skill:
                "",

            question:
                "Tell me about yourself and explain the kind of role you are preparing for.",

            answer:
                "",

            tip:
                "Keep the answer structured around education, skills, projects and career direction."
        });


        return questions;
    }


    function renderCurrentInterviewQuestion() {

        const element =
            byId(
                "interview-question"
            );


        if (!element) {
            return;
        }


        const questions =
            Array.isArray(
                STATE.interviewQuestions
            )
                ? STATE.interviewQuestions
                : [];


        if (!questions.length) {

            element.textContent =
                "Generate an interview question to begin.";

            return;
        }


        const question =
            questions[
                STATE.currentQuestionIndex
            ];


        element.innerHTML =
            `<div class="interview-question-inner">

                <span class="interview-category">
                    ${escapeHtml(
                        question.category
                    )}
                </span>

                <h3>
                    ${escapeHtml(
                        question.question
                    )}
                </h3>

                ${
                    question.skill
                        ? `<span class="skill-tag required">
                            ${escapeHtml(
                                question.skill
                            )}
                           </span>`
                        : ""
                }

            </div>`;


        const feedback =
            byId(
                "interview-feedback"
            );


        if (feedback) {

            feedback.style.display =
                "none";

            feedback.innerHTML =
                "";

        }


        const answer =
            byId(
                "interview-answer"
            );


        if (answer) {
            answer.value = "";
        }
    }


    function initInterviewControls() {

        const generateButton =
            byId(
                "generate-interview-question"
            );


        const submitButton =
            byId(
                "submit-interview-answer"
            );


        if (generateButton) {

            generateButton.addEventListener(
                "click",
                () => {

                    const questions =
                        Array.isArray(
                            STATE.interviewQuestions
                        )
                            ? STATE.interviewQuestions
                            : [];


                    if (!questions.length) {

                        loadDynamicInterview();

                        return;
                    }


                    STATE.currentQuestionIndex =
                        (
                            STATE.currentQuestionIndex +
                            1
                        ) %
                        questions.length;


                    renderCurrentInterviewQuestion();

                }
            );

        }


        if (submitButton) {

            submitButton.addEventListener(
                "click",
                evaluateInterviewAnswer
            );

        }
    }


    async function evaluateInterviewAnswer() {

        const answerInput =
            byId(
                "interview-answer"
            );


        const feedback =
            byId(
                "interview-feedback"
            );


        const questions =
            Array.isArray(
                STATE.interviewQuestions
            )
                ? STATE.interviewQuestions
                : [];


        const current =
            questions[
                STATE.currentQuestionIndex
            ];


        if (!current) {

            showStatus(
                feedback,
                "Generate an interview question first.",
                "error"
            );

            return;
        }


        const answer =
            answerInput
                ? answerInput.value.trim()
                : "";


        if (!answer) {

            showStatus(
                feedback,
                "Please enter your answer first.",
                "error"
            );

            return;
        }


        try {

            const data =
                await apiRequest(
                    "evaluate_answer",
                    {
                        question:
                            current.question,

                        user_answer:
                            answer,

                        target_role:
                            STATE.targetRole
                    }
                );


            if (
                data.status === "success" ||
                data.success === true
            ) {

                renderInterviewEvaluation(
                    feedback,
                    data
                );

            } else {

                throw new Error(
                    data.message ||
                    "Unable to evaluate answer."
                );

            }

        } catch (error) {

            /*
             * Local evaluation fallback.
             */
            const score =
                calculateLocalAnswerScore(
                    answer
                );


            feedback.style.display =
                "block";


            feedback.innerHTML =
                `<div class="interview-evaluation">

                    <h3>
                        Practice Feedback
                    </h3>

                    <div class="evaluation-score">
                        ${score}/100
                    </div>

                    <p>
                        Your answer contains useful information.
                        Improve it by adding a clear structure,
                        technical details and a practical example.
                    </p>

                </div>`;

        }
    }


    function calculateLocalAnswerScore(
        answer
    ) {

        let score = 40;


        if (
            answer.length > 80
        ) {
            score += 15;
        }


        if (
            answer.length > 180
        ) {
            score += 10;
        }


        if (
            /\b(example|project|implemented|used|built|developed)\b/i
                .test(answer)
        ) {
            score += 15;
        }


        if (
            /\b(because|therefore|approach|reason)\b/i
                .test(answer)
        ) {
            score += 10;
        }


        if (
            /\b(result|impact|performance|improved)\b/i
                .test(answer)
        ) {
            score += 10;
        }


        return Math.min(
            100,
            score
        );
    }


    function renderInterviewEvaluation(
        container,
        data
    ) {

        const score =
            data.total_score ??
            data.score ??
            0;


        const rating =
            data.rating ||
            "Practice Result";


        const strengths =
            Array.isArray(
                data.strengths
            )
                ? data.strengths
                : [];


        const missing =
            Array.isArray(
                data.missing_points
            )
                ? data.missing_points
                : [];


        container.style.display =
            "block";


        container.innerHTML =
            `<div class="interview-evaluation">

                <div class="evaluation-header">

                    <span>
                        ${escapeHtml(rating)}
                    </span>

                    <strong>
                        ${escapeHtml(score)}/100
                    </strong>

                </div>


                ${
                    strengths.length
                        ? `<div>
                            <h4>Strengths</h4>
                            <ul>
                                ${strengths
                                    .map(
                                        item =>
                                            `<li>
                                                ${escapeHtml(item)}
                                             </li>`
                                    )
                                    .join("")}
                            </ul>
                           </div>`
                        : ""
                }


                ${
                    missing.length
                        ? `<div>
                            <h4>Improve</h4>
                            <ul>
                                ${missing
                                    .map(
                                        item =>
                                            `<li>
                                                ${escapeHtml(item)}
                                             </li>`
                                    )
                                    .join("")}
                            </ul>
                           </div>`
                        : ""
                }


                ${
                    data.ideal_answer
                        ? `<div class="ideal-answer">
                            <h4>Suggested Answer Direction</h4>
                            <p>
                                ${escapeHtml(
                                    data.ideal_answer
                                )}
                            </p>
                           </div>`
                        : ""
                }

            </div>`;
    }


    /* ============================================================
       AI INTERVIEW ASSISTANT
    ============================================================ */

    function initAIAssistant() {

        const button =
            byId(
                "btn-submit-ai-prompt"
            );


        const input =
            byId(
                "input-ai-prompt"
            );


        if (
            !button ||
            !input
        ) {
            return;
        }


        async function askAI() {

            const prompt =
                input.value.trim();


            if (!prompt) {
                return;
            }


            const card =
                byId(
                    "ai-assistant-response-card"
                );


            const title =
                byId(
                    "ai-response-title"
                );


            const body =
                byId(
                    "ai-response-body"
                );


            if (card) {
                card.style.display =
                    "block";
            }


            setText(
                title,
                "Thinking..."
            );


            setHtml(
                body,
                `<p>
                    Preparing your interview guidance...
                </p>`
            );


            setButtonLoading(
                button,
                true,
                "Thinking..."
            );


            try {

                const data =
                    await apiRequest(
                        "ask_interview_ai",
                        {
                            prompt,

                            target_role:
                                STATE.targetRole,

                            target_company:
                                STATE.targetCompany
                        }
                    );


                if (
                    data.status !== "success" &&
                    data.success !== true
                ) {

                    throw new Error(
                        data.message ||
                        "AI response unavailable."
                    );

                }


                setText(
                    title,
                    data.title ||
                    "AI Interview Guidance"
                );


                let html = "";


                if (
                    Array.isArray(
                        data.advice_steps
                    )
                ) {

                    html +=
                        `<h4>
                            Strategic Guidance
                         </h4>
                         <ul>
                            ${
                                data.advice_steps
                                    .map(
                                        step =>
                                            `<li>
                                                ${escapeHtml(step)}
                                             </li>`
                                    )
                                    .join("")
                            }
                         </ul>`;

                }


                if (
                    data.sample_question
                ) {

                    html +=
                        `<div class="ai-practice-box">

                            <h4>
                                Practice Question
                            </h4>

                            <p>
                                ${escapeHtml(
                                    data.sample_question
                                )}
                            </p>

                            ${
                                data.sample_answer
                                    ? `<h4>
                                        Model Answer Direction
                                       </h4>
                                       <p>
                                        ${escapeHtml(
                                            data.sample_answer
                                        )}
                                       </p>`
                                    : ""
                            }

                         </div>`;

                }


                if (
                    data.answer ||
                    data.response
                ) {

                    html +=
                        `<div>
                            ${escapeHtml(
                                data.answer ||
                                data.response
                            )}
                         </div>`;

                }


                if (!html) {

                    html =
                        `<p>
                            ${escapeHtml(
                                data.message ||
                                "No additional guidance was returned."
                            )}
                         </p>`;

                }


                setHtml(
                    body,
                    html
                );


            } catch (error) {

                setText(
                    title,
                    "AI Assistant"
                );


                setHtml(
                    body,
                    `<p class="error-text">
                        ${escapeHtml(
                            error.message ||
                            "Unable to connect to the interview assistant."
                        )}
                    </p>`
                );

            } finally {

                setButtonLoading(
                    button,
                    false
                );

            }
        }


        button.addEventListener(
            "click",
            askAI
        );


        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    askAI();

                }

            }
        );
    }


    /* ============================================================
       PROFILE
    ============================================================ */

    function initProfileForm() {

        const form =
            byId(
                "profile-form"
            ) ||
            byId(
                "form-update-profile"
            );


        if (!form) {
            return;
        }


        form.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const message =
                    byId(
                        "profile-message"
                    );


                const formData =
                    new FormData(
                        form
                    );


                formData.append(
                    "action",
                    "update_profile"
                );


                try {

                    const response =
                        await fetch(
                            "api.php",
                            {
                                method:
                                    "POST",

                                body:
                                    formData,

                                credentials:
                                    "same-origin"
                            }
                        );


                    const data =
                        await response.json();


                    if (
                        data.status === "success" ||
                        data.success === true
                    ) {

                        showStatus(
                            message,
                            data.message ||
                            "Profile updated successfully.",
                            "success"
                        );


                        setTimeout(
                            () => {
                                window.location.reload();
                            },
                            700
                        );

                    } else {

                        showStatus(
                            message,
                            data.message ||
                            "Unable to update profile.",
                            "error"
                        );

                    }

                } catch (error) {

                    showStatus(
                        message,
                        error.message ||
                        "Profile update failed.",
                        "error"
                    );

                }

            }
        );
    }


    /* ============================================================
       LOGOUT
    ============================================================ */

    function initLogout() {

        const buttons =
            $all(
                "#logout-button, #btn-logout"
            );


        buttons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        setButtonLoading(
                            button,
                            true,
                            "Logging out..."
                        );


                        try {

                            await apiRequest(
                                "logout",
                                {}
                            );

                        } catch (error) {

                            /*
                             * Even if the API response
                             * is unavailable, reload.
                             */

                            console.warn(
                                "Logout request:",
                                error
                            );

                        }


                        window.location.href =
                            window.location.pathname;

                    }
                );

            }
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
            "undefined"
        ) {
            return;
        }


        const radarCanvas =
            byId(
                "radarChartCtx"
            );


        const pieCanvas =
            byId(
                "pieChartCtx"
            );


        if (radarCanvas) {

            radarChart =
                new Chart(
                    radarCanvas,
                    {
                        type:
                            "radar",

                        data: {

                            labels: [
                                "Skills",
                                "ATS",
                                "Projects",
                                "Fundamentals",
                                "Job Fit"
                            ],

                            datasets: [
                                {
                                    label:
                                        "Career Profile",

                                    data: [
                                        0,
                                        0,
                                        0,
                                        0,
                                        0
                                    ],

                                    backgroundColor:
                                        "rgba(99, 102, 241, 0.18)",

                                    borderColor:
                                        "#6366f1",

                                    pointBackgroundColor:
                                        "#6366f1"
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
                        type:
                            "doughnut",

                        data: {

                            labels: [
                                "Matched Skills",
                                "Missing Skills"
                            ],

                            datasets: [
                                {
                                    data: [
                                        0,
                                        1
                                    ],

                                    backgroundColor: [
                                        "#10b981",
                                        "#f59e0b"
                                    ],

                                    borderWidth:
                                        0
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
                                        "bottom"
                                }

                            }

                        }

                    }
                );

        }


        updateCharts(
            STATE.metrics ||
            calculateLocalMetrics()
        );
    }


    function updateCharts(
        data
    ) {

        if (!data) {
            return;
        }


        const skills =
            STATE.extractedSkills
                .length;


        const ats =
            Number(
                STATE.atsScore || 0
            );


        const readiness =
            Number(
                data.readiness_pct || 0
            );


        const required =
            Array.isArray(
                data.required_skills
            )
                ? data.required_skills
                : [];


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


        if (radarChart) {

            radarChart.data.datasets[0].data =
                [
                    Math.min(
                        100,
                        skills * 8
                    ),

                    ats,

                    Math.min(
                        100,
                        skills * 7
                    ),

                    Math.min(
                        100,
                        skills * 9
                    ),

                    readiness
                ];


            radarChart.update();
        }


        if (pieChart) {

            pieChart.data.datasets[0].data =
                [
                    matched.length,
                    missing.length
                ];


            pieChart.update();
        }
    }


    function updateChartsTheme() {

        if (!radarChart && !pieChart) {
            return;
        }


        const dark =
            document.body.classList.contains(
                "dark-mode"
            );


        const textColor =
            dark
                ? "#e5e7eb"
                : "#334155";


        if (radarChart) {

            radarChart.options.scales.r.angleLines =
                {
                    color:
                        dark
                            ? "rgba(255,255,255,.10)"
                            : "rgba(15,23,42,.10)"
                };


            radarChart.options.scales.r.grid =
                {
                    color:
                        dark
                            ? "rgba(255,255,255,.10)"
                            : "rgba(15,23,42,.10)"
                };


            radarChart.options.scales.r.pointLabels =
                {
                    color:
                        textColor
                };


            radarChart.update();
        }


        if (pieChart) {

            pieChart.options.plugins.legend.labels =
                {
                    color:
                        textColor
                };


            pieChart.update();
        }
    }


    /* ============================================================
       INITIAL DATA
    ============================================================ */

    function initializeState() {

        STATE.extractedSkills =
            normalizeSkills(
                STATE.extractedSkills
            );


        STATE.requiredSkills =
            normalizeSkills(
                STATE.requiredSkills
            );


        STATE.careerJobs =
            STATE.careerJobs
                .map(
                    normalizeJob
                );


        if (
            STATE.careerJobs.length
        ) {

            const ranked =
                rankJobs(
                    STATE.careerJobs
                );


            if (!STATE.recommendedJob) {

                STATE.recommendedJob =
                    ranked[0] ||
                    null;

            }

        }


        updateCareerURLInputs(
            STATE.careerUrl
        );


        updateTargetUI();


        updateStats();


        renderSkills(
            "resume-skills-list",
            STATE.extractedSkills,
            "matched"
        );


        renderSkillGap();


        renderRecommendation();


        renderCurrentJobs();
    }


    /* ============================================================
       EXISTING DATA
    ============================================================ */

    async function loadExistingData() {

        if (!STATE.loggedIn) {
            return;
        }


        try {

            /*
             * Refresh current metrics from the server.
             */
            await refreshMetrics();

        } catch (error) {

            console.warn(
                "Existing data load:",
                error
            );

        }
    }


    /* ============================================================
       REMOVE OLD BENCHMARK UI
    ============================================================ */

    function removeLegacyBenchmarkUI() {

        const legacySelectors = [
            "#box-benchmark-select",
            "#box-custom-select",
            "#mode-benchmark",
            "#mode-custom",
            "#select-company",
            "#select-role",
            "#input-custom-company",
            "#input-custom-role",
            ".custom-skill-checkbox",
            ".benchmark-controls"
        ];


        legacySelectors.forEach(
            selector => {

                $all(selector)
                    .forEach(
                        element => {

                            /*
                             * Do not remove checkboxes that are
                             * unrelated to the old benchmark UI.
                             */
                            if (
                                element.classList.contains(
                                    "custom-skill-checkbox"
                                ) ||
                                element.id ===
                                    "mode-benchmark" ||
                                element.id ===
                                    "mode-custom"
                            ) {

                                element
                                    .closest(
                                        ".form-group, .section-panel, details"
                                    )
                                    ?.remove();

                            }

                        }
                    );

            }
        );
    }


    /* ============================================================
       HIDE CAREER UI WHEN LOGGED OUT
    ============================================================ */

    function hideCareerElementsWhenLoggedOut() {

        if (STATE.loggedIn) {
            return;
        }


        [
            "#dashboard-app",
            "#career-url",
            "#scrape-career-url",
            "#jobs-career-url"
        ].forEach(
            selector => {

                $all(selector)
                    .forEach(
                        element => {

                            /*
                             * Dashboard is already hidden by PHP.
                             */
                            if (
                                element.id !==
                                "dashboard-app"
                            ) {
                                element.style.display =
                                    "none";
                            }

                        }
                    );

            }
        );
    }


    /* ============================================================
       KEYBOARD SHORTCUTS
    ============================================================ */

    function initKeyboardShortcuts() {

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape"
                ) {

                    closeSidebar();

                }

            }
        );
    }


    /* ============================================================
       INITIALIZATION
    ============================================================ */

    async function boot() {

        /*
         * Prevent old UI logic from running.
         */
        removeLegacyBenchmarkUI();


        initAuthTabs();


        if (STATE.loggedIn) {

            initNavigation();

            initSidebar();

            initTheme();

            initCareerURL();

            initResumeUpload();

            initJobRanking();

            initJobCardActions();

            initInterviewControls();

            initAIAssistant();

            initProfileForm();

            initLogout();

            initCharts();

            initializeState();

            await loadExistingData();

        } else {

            /*
             * Auth-only initialization.
             */
            initTheme();

        }


        initKeyboardShortcuts();


        hideCareerElementsWhenLoggedOut();


        /*
         * Hide loader after everything has initialized.
         */
        setTimeout(
            hidePageLoader,
            250
        );
    }


    /* ============================================================
       START
    ============================================================ */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            boot
        );

    } else {

        boot();

    }

})();
