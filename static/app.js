/* ============================================================
   SKILL-GAP PREDICTOR
   COMPLETE FRONTEND APPLICATION JAVASCRIPT
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    /* ========================================================
       GLOBAL STATE
       ======================================================== */

    const state = {
        loggedIn: Boolean(window.APP_DATA?.loggedIn),
        user: window.APP_DATA?.user || null,

        careerUrl: window.APP_DATA?.careerUrl || "",
        careerJobs: Array.isArray(window.APP_DATA?.careerJobs)
            ? window.APP_DATA.careerJobs
            : [],

        extractedSkills: Array.isArray(window.APP_DATA?.extractedSkills)
            ? window.APP_DATA.extractedSkills
            : [],

        requiredSkills: Array.isArray(window.APP_DATA?.requiredSkills)
            ? window.APP_DATA.requiredSkills
            : [],

        atsScore: Number(window.APP_DATA?.atsScore || 0),

        targetCompany: window.APP_DATA?.targetCompany || "",
        targetRole: window.APP_DATA?.targetRole || "",

        recommendedJob: window.APP_DATA?.recommendedJob || null,

        currentView: "dashboard",
        selectedResume: null,

        charts: {
            radar: null,
            pie: null
        }
    };


    /* ========================================================
       BASIC HELPERS
       ======================================================== */

    function $(id) {
        return document.getElementById(id);
    }

    function qs(selector) {
        return document.querySelector(selector);
    }

    function qsa(selector) {
        return Array.from(document.querySelectorAll(selector));
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

    function normalizeSkill(value) {
        return String(value || "")
            .trim()
            .replace(/\s+/g, " ");
    }

    function normalizeSkills(skills) {
        if (!Array.isArray(skills)) {
            return [];
        }

        const result = [];

        skills.forEach(function (skill) {
            let value = "";

            if (typeof skill === "string") {
                value = skill;
            } else if (skill && typeof skill === "object") {
                value =
                    skill.name ||
                    skill.skill ||
                    skill.title ||
                    skill.value ||
                    "";
            }

            value = normalizeSkill(value);

            if (value && !result.some(function (x) {
                return x.toLowerCase() === value.toLowerCase();
            })) {
                result.push(value);
            }
        });

        return result;
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


    /* ========================================================
       POPUP SYSTEM
       ======================================================== */

    function ensurePopup() {
        if ($("sg-popup-overlay")) {
            return;
        }

        const overlay = document.createElement("div");

        overlay.id = "sg-popup-overlay";

        overlay.innerHTML = `
            <div class="sg-popup-card">
                <button type="button"
                        id="sg-popup-close"
                        class="sg-popup-close">
                    ×
                </button>

                <div id="sg-popup-icon"
                     class="sg-popup-icon">
                    ✓
                </div>

                <h3 id="sg-popup-title">
                    Message
                </h3>

                <p id="sg-popup-message">
                    Message
                </p>

                <button type="button"
                        id="sg-popup-ok"
                        class="btn">
                    OK
                </button>
            </div>
        `;

        document.body.appendChild(overlay);

        const style = document.createElement("style");

        style.id = "sg-popup-style";

        style.textContent = `
            #sg-popup-overlay {
                position: fixed;
                inset: 0;
                z-index: 999999;
                display: none;
                align-items: center;
                justify-content: center;
                background: rgba(0,0,0,.72);
                backdrop-filter: blur(5px);
                padding: 20px;
            }

            .sg-popup-card {
                position: relative;
                width: min(440px, 95vw);
                padding: 30px 26px;
                border-radius: 18px;
                text-align: center;
                background: var(--card-bg, #111827);
                color: var(--text-main, #f8fafc);
                border: 1px solid rgba(148,163,184,.25);
                box-shadow: 0 25px 70px rgba(0,0,0,.5);
            }

            .sg-popup-close {
                position: absolute;
                right: 15px;
                top: 10px;
                border: 0;
                background: transparent;
                color: #94a3b8;
                font-size: 27px;
                cursor: pointer;
            }

            .sg-popup-icon {
                width: 58px;
                height: 58px;
                margin: 0 auto 15px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 27px;
                font-weight: 800;
                background: rgba(16,185,129,.15);
                color: #34d399;
            }

            .sg-popup-card h3 {
                margin: 0 0 10px;
                font-size: 21px;
            }

            .sg-popup-card p {
                margin: 0 0 22px;
                color: #94a3b8;
                line-height: 1.6;
            }

            .sg-popup-card .btn {
                min-width: 110px;
            }
        `;

        document.head.appendChild(style);

        $("sg-popup-close").addEventListener(
            "click",
            hidePopup
        );

        $("sg-popup-ok").addEventListener(
            "click",
            hidePopup
        );

        overlay.addEventListener("click", function (event) {
            if (event.target === overlay) {
                hidePopup();
            }
        });
    }

    function showPopup(title, message, type) {
        ensurePopup();

        const overlay = $("sg-popup-overlay");
        const titleElement = $("sg-popup-title");
        const messageElement = $("sg-popup-message");
        const iconElement = $("sg-popup-icon");

        if (!overlay) {
            return;
        }

        titleElement.textContent = title || "Message";
        messageElement.textContent = message || "";

        if (type === "error") {
            iconElement.textContent = "!";
            iconElement.style.color = "#fb7185";
            iconElement.style.background = "rgba(244,63,94,.15)";
        } else if (type === "warning") {
            iconElement.textContent = "!";
            iconElement.style.color = "#fbbf24";
            iconElement.style.background = "rgba(245,158,11,.15)";
        } else {
            iconElement.textContent = "✓";
            iconElement.style.color = "#34d399";
            iconElement.style.background = "rgba(16,185,129,.15)";
        }

        overlay.style.display = "flex";
    }

    function hidePopup() {
        const overlay = $("sg-popup-overlay");

        if (overlay) {
            overlay.style.display = "none";
        }
    }

    window.showSkillGapPopup = showPopup;

    const nativeAlert = window.alert;

    window.alert = function (message) {
        try {
            showPopup(
                "Skill-Gap Predictor",
                String(message || ""),
                "info"
            );
        } catch (error) {
            nativeAlert(message);
        }
    };


    /* ========================================================
       LOADING SYSTEM
       ======================================================== */

    function setLoading(button, loading, text) {
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
                `<span class="button-loading"></span> ${escapeHtml(
                    text || "Processing..."
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

    function hidePageLoader() {
        const loader = $("page-loader");

        if (!loader) {
            return;
        }

        loader.classList.add("loaded");

        setTimeout(function () {
            loader.style.display = "none";
        }, 300);
    }

    window.addEventListener(
        "load",
        hidePageLoader
    );

    setTimeout(
        hidePageLoader,
        3000
    );


    /* ========================================================
       API REQUEST
       ======================================================== */

    async function apiRequest(action, data, options) {
        data = data || {};
        options = options || {};

        const method =
            String(options.method || "POST").toUpperCase();

        let url =
            "api.php?action=" +
            encodeURIComponent(action);

        const fetchOptions = {
            method: method,
            credentials: "same-origin",
            cache: "no-store",
            headers: {}
        };

        if (method === "GET") {
            const params = new URLSearchParams();

            Object.keys(data).forEach(function (key) {
                if (
                    data[key] !== undefined &&
                    data[key] !== null
                ) {
                    params.append(
                        key,
                        String(data[key])
                    );
                }
            });

            const query = params.toString();

            if (query) {
                url += "&" + query;
            }
        } else {
            if (data instanceof FormData) {
                fetchOptions.body = data;
            } else {
                const params = new URLSearchParams();

                Object.keys(data).forEach(function (key) {
                    if (
                        data[key] !== undefined &&
                        data[key] !== null
                    ) {
                        params.append(
                            key,
                            String(data[key])
                        );
                    }
                });

                fetchOptions.headers[
                    "Content-Type"
                ] =
                    "application/x-www-form-urlencoded;charset=UTF-8";

                fetchOptions.body =
                    params.toString();
            }
        }

        const response =
            await fetch(url, fetchOptions);

        const responseText =
            await response.text();

        let result;

        try {
            result = JSON.parse(responseText);
        } catch (error) {
            console.error(
                "Invalid API response:",
                responseText
            );

            throw new Error(
                "Invalid server response."
            );
        }

        if (!response.ok) {
            throw new Error(
                result.message ||
                result.error ||
                "Request failed."
            );
        }

        return result;
    }

    function apiSuccess(result) {
        return Boolean(
            result &&
            (
                result.success === true ||
                result.status === "success" ||
                result.ok === true
            )
        );
    }


    /* ========================================================
       AUTHENTICATION
       ======================================================== */

    function initAuth() {
        const tabLogin =
            $("tab-btn-login");

        const tabSignup =
            $("tab-btn-signup");

        const formLoginBox =
            $("form-login-box");

        const formSignupBox =
            $("form-signup-box");

        function showLogin() {
            if (tabLogin) {
                tabLogin.classList.add("active");
            }

            if (tabSignup) {
                tabSignup.classList.remove("active");
            }

            showElement(formLoginBox);
            hideElement(formSignupBox);
        }

        function showSignup() {
            if (tabSignup) {
                tabSignup.classList.add("active");
            }

            if (tabLogin) {
                tabLogin.classList.remove("active");
            }

            showElement(formSignupBox);
            hideElement(formLoginBox);
        }

        if (tabLogin) {
            tabLogin.addEventListener(
                "click",
                function (event) {
                    event.preventDefault();
                    showLogin();
                }
            );
        }

        if (tabSignup) {
            tabSignup.addEventListener(
                "click",
                function (event) {
                    event.preventDefault();
                    showSignup();
                }
            );
        }

        const loginForm =
            $("form-login");

        if (loginForm) {
            loginForm.addEventListener(
                "submit",
                async function (event) {
                    event.preventDefault();

                    const emailElement =
                        $("login_email");

                    const passwordElement =
                        $("login_password");

                    const errorElement =
                        $("login-error-msg");

                    const successElement =
                        $("login-success-msg");

                    const button =
                        $("btn-do-login");

                    const email =
                        emailElement
                            ? emailElement.value.trim()
                            : "";

                    const password =
                        passwordElement
                            ? passwordElement.value
                            : "";

                    if (!email || !password) {
                        if (errorElement) {
                            errorElement.textContent =
                                "Please enter both email and password.";

                            errorElement.style.display =
                                "block";
                        }

                        return;
                    }

                    if (errorElement) {
                        errorElement.style.display =
                            "none";
                    }

                    setLoading(
                        button,
                        true,
                        "Signing in..."
                    );

                    const formData =
                        new FormData(loginForm);

                    formData.set(
                        "action",
                        "login"
                    );

                    try {
                        const result =
                            await apiRequest(
                                "login",
                                formData
                            );

                        if (!apiSuccess(result)) {
                            throw new Error(
                                result.message ||
                                "Login failed."
                            );
                        }

                        if (successElement) {
                            successElement.textContent =
                                "Login successful. Opening dashboard...";

                            successElement.style.display =
                                "block";
                        }

                        /*
                         * IMPORTANT:
                         * Reload after the PHP session has been created.
                         * This prevents the old "login successful -> login page"
                         * problem caused by only changing frontend state.
                         */
                        setTimeout(function () {
                            window.location.replace(
                                window.location.pathname +
                                "?logged_in=1"
                            );
                        }, 500);

                    } catch (error) {
                        if (errorElement) {
                            errorElement.textContent =
                                error.message ||
                                "Unable to sign in.";

                            errorElement.style.display =
                                "block";
                        }

                        setLoading(
                            button,
                            false
                        );
                    }
                }
            );
        }

        const signupForm =
            $("form-signup");

        if (signupForm) {
            signupForm.addEventListener(
                "submit",
                async function (event) {
                    event.preventDefault();

                    const errorElement =
                        $("signup-error-msg");

                    const successElement =
                        $("signup-success-msg");

                    const button =
                        $("btn-do-signup");

                    if (errorElement) {
                        errorElement.style.display =
                            "none";
                    }

                    if (successElement) {
                        successElement.style.display =
                            "none";
                    }

                    const name =
                        $("signup_name")
                            ?.value.trim() || "";

                    const email =
                        $("signup_email")
                            ?.value.trim() || "";

                    const password =
                        $("signup_pwd")
                            ?.value || "";

                    const university =
                        $("signup_uni")
                            ?.value.trim() || "";

                    const branch =
                        $("signup_branch")
                            ?.value.trim() || "";

                    const graduationYear =
                        (
                            $("signup_gradyear") ||
                            $("signup_year")
                        )?.value || "";

                    const terms =
                        $("signup-terms");

                    if (
                        !name ||
                        !email ||
                        !password ||
                        !university ||
                        !branch ||
                        !graduationYear
                    ) {
                        if (errorElement) {
                            errorElement.textContent =
                                "Please fill in all required fields.";

                            errorElement.style.display =
                                "block";
                        }

                        return;
                    }

                    if (
                        terms &&
                        !terms.checked
                    ) {
                        if (errorElement) {
                            errorElement.textContent =
                                "Please accept the terms before creating your account.";

                            errorElement.style.display =
                                "block";
                        }

                        return;
                    }

                    setLoading(
                        button,
                        true,
                        "Creating Account..."
                    );

                    const formData =
                        new FormData(signupForm);

                    formData.set(
                        "action",
                        "signup"
                    );

                    formData.set(
                        "name",
                        name
                    );

                    formData.set(
                        "email",
                        email
                    );

                    formData.set(
                        "password",
                        password
                    );

                    formData.set(
                        "university",
                        university
                    );

                    formData.set(
                        "branch",
                        branch
                    );

                    formData.set(
                        "graduation_year",
                        graduationYear
                    );

                    try {
                        const result =
                            await apiRequest(
                                "signup",
                                formData
                            );

                        if (!apiSuccess(result)) {
                            throw new Error(
                                result.message ||
                                "Account registration failed."
                            );
                        }

                        if (successElement) {
                            successElement.textContent =
                                "Account registered successfully.";

                            successElement.style.display =
                                "block";
                        }

                        showPopup(
                            "Account Registered Successfully",
                            "Your account has been created. Please log in with your new account.",
                            "success"
                        );

                        setTimeout(function () {
                            showLogin();

                            if (emailElementExists()) {
                                $("login_email").value =
                                    email;
                            }
                        }, 1200);

                    } catch (error) {
                        if (errorElement) {
                            errorElement.textContent =
                                error.message ||
                                "Unable to create account.";

                            errorElement.style.display =
                                "block";
                        }

                        showPopup(
                            "Registration Failed",
                            error.message ||
                            "Unable to create account.",
                            "error"
                        );
                    } finally {
                        setLoading(
                            button,
                            false
                        );
                    }
                }
            );
        }

        function emailElementExists() {
            return Boolean(
                $("login_email")
            );
        }

        const logoutButton =
            $("btn-logout");

        if (logoutButton) {
            logoutButton.addEventListener(
                "click",
                async function (event) {
                    event.preventDefault();

                    try {
                        await apiRequest(
                            "logout",
                            {},
                            {
                                method: "GET"
                            }
                        );
                    } catch (error) {
                        console.error(
                            "Logout error:",
                            error
                        );
                    }

                    window.location.replace(
                        window.location.pathname
                    );
                }
            );
        }
    }


    /* ========================================================
       THEME
       ======================================================== */

    function initTheme() {
        const savedTheme =
            localStorage.getItem(
                "skillGapTheme"
            );

        if (savedTheme === "dark") {
            document.body.classList.add(
                "dark-mode"
            );

            document.documentElement.classList.add(
                "dark-mode"
            );
        }

        const buttons =
            qsa(
                "#theme-toggle, #btn-theme-toggle, .theme-toggle"
            );

        buttons.forEach(function (button) {
            button.addEventListener(
                "click",
                function () {
                    const enabled =
                        document.body.classList.toggle(
                            "dark-mode"
                        );

                    document.documentElement.classList.toggle(
                        "dark-mode",
                        enabled
                    );

                    localStorage.setItem(
                        "skillGapTheme",
                        enabled
                            ? "dark"
                            : "light"
                    );

                    updateChartsTheme();
                }
            );
        });
    }


    /* ========================================================
       SIDEBAR / MOBILE MENU
       ======================================================== */

    function initSidebar() {
        const menuButtons =
            qsa(
                "#menu-toggle, #mobile-menu-toggle, .menu-toggle"
            );

        const sidebar =
            $("sidebar");

        menuButtons.forEach(function (button) {
            button.addEventListener(
                "click",
                function () {
                    if (sidebar) {
                        sidebar.classList.toggle(
                            "open"
                        );
                    }

                    document.body.classList.toggle(
                        "sidebar-open"
                    );
                }
            );
        });

        const closeButtons =
            qsa(
                "#sidebar-close, .sidebar-close"
            );

        closeButtons.forEach(function (button) {
            button.addEventListener(
                "click",
                function () {
                    if (sidebar) {
                        sidebar.classList.remove(
                            "open"
                        );
                    }

                    document.body.classList.remove(
                        "sidebar-open"
                    );
                }
            );
        });
    }


    /* ========================================================
       NAVIGATION
       ======================================================== */

    function initNavigation() {
        const navItems =
            qsa(".nav-item");

        const views =
            qsa(".view-panel");

        navItems.forEach(function (item) {
            item.addEventListener(
                "click",
                function (event) {
                    event.preventDefault();

                    const targetView =
                        item.getAttribute(
                            "data-view"
                        );

                    if (!targetView) {
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

                    item.classList.add(
                        "active"
                    );

                    const target =
                        $(targetView);

                    if (target) {
                        target.style.display =
                            "block";
                    }

                    state.currentView =
                        targetView;

                    if (
                        targetView ===
                        "view-roadmap"
                    ) {
                        loadDynamicRoadmap();
                    }

                    if (
                        targetView ===
                        "view-interview"
                    ) {
                        loadDynamicInterview();
                    }

                    if (
                        targetView ===
                        "view-jobranking"
                    ) {
                        loadRankedJobs();
                    }

                    if (
                        targetView ===
                        "view-report"
                    ) {
                        updateReport();
                    }
                }
            );
        });
    }


    /* ========================================================
       CAREER URL / DYNAMIC JOB SCRAPER
       ======================================================== */

    function initWebScraper() {
        const button =
            $("btn-scrape-url");

        const input =
            $("input-scrape-url");

        if (!button || !input) {
            return;
        }

        if (
            state.careerUrl &&
            !input.value
        ) {
            input.value =
                state.careerUrl;
        }

        button.addEventListener(
            "click",
            async function () {
                const url =
                    input.value.trim();

                const resultBox =
                    $("scrape-results-box");

                if (!url) {
                    showPopup(
                        "Career URL Required",
                        "Please enter a valid career or jobs URL.",
                        "warning"
                    );

                    return;
                }

                try {
                    new URL(url);
                } catch (error) {
                    showPopup(
                        "Invalid URL",
                        "Please enter a complete valid URL.",
                        "warning"
                    );

                    return;
                }

                if (resultBox) {
                    resultBox.className =
                        "alert alert-info";

                    resultBox.textContent =
                        "Analyzing career page and extracting available jobs...";

                    resultBox.style.display =
                        "block";
                }

                setLoading(
                    button,
                    true,
                    "Analyzing..."
                );

                try {
                    const result =
                        await apiRequest(
                            "scrape_url",
                            {
                                url: url,
                                career_url: url
                            }
                        );

                    if (!apiSuccess(result)) {
                        throw new Error(
                            result.message ||
                            result.error ||
                            "Unable to scrape the URL."
                        );
                    }

                    state.careerUrl =
                        url;

                    const jobs =
                        result.jobs ||
                        result.career_jobs ||
                        result.data?.jobs ||
                        [];

                    state.careerJobs =
                        normalizeJobs(
                            jobs
                        );

                    state.requiredSkills =
                        normalizeSkills(
                            result.required_skills ||
                            result.data?.required_skills ||
                            extractRequiredSkillsFromJobs(
                                state.careerJobs
                            )
                        );

                    updateGlobalData();

                    if (resultBox) {
                        resultBox.className =
                            "alert alert-success";

                        resultBox.innerHTML =
                            `<strong>${state.careerJobs.length}</strong> job(s) extracted successfully.`;
                    }

                    renderJobs();
                    renderSkillGap();
                    updateRecommendation();
                    updateStats();
                    renderDashboardCharts();

                    showPopup(
                        "Career URL Analyzed",
                        state.careerJobs.length +
                        " job(s) were extracted from the career page.",
                        "success"
                    );

                } catch (error) {
                    if (resultBox) {
                        resultBox.className =
                            "alert alert-error";

                        resultBox.textContent =
                            error.message ||
                            "Unable to analyze the career URL.";
                    }

                    showPopup(
                        "Career URL Analysis Failed",
                        error.message ||
                        "Unable to analyze the career URL.",
                        "error"
                    );
                } finally {
                    setLoading(
                        button,
                        false
                    );
                }
            }
        );
    }


    function normalizeJob(job) {
        job = job || {};

        return {
            title:
                job.title ||
                job.role ||
                job.job_title ||
                job.position ||
                job.name ||
                "Untitled Job",

            company:
                job.company ||
                job.company_name ||
                job.employer ||
                "",

            location:
                job.location ||
                job.locations ||
                "",

            url:
                job.url ||
                job.link ||
                job.job_url ||
                job.apply_url ||
                "",

            description:
                job.description ||
                job.summary ||
                job.text ||
                "",

            skills:
                normalizeSkills(
                    job.skills ||
                    job.required_skills ||
                    job.requirements ||
                    job.technical_skills ||
                    []
                )
        };
    }

    function normalizeJobs(jobs) {
        if (!Array.isArray(jobs)) {
            return [];
        }

        return jobs
            .map(normalizeJob)
            .filter(function (job) {
                return (
                    job.title ||
                    job.description ||
                    job.url
                );
            });
    }

    function extractRequiredSkillsFromJobs(jobs) {
        const allSkills = [];

        jobs.forEach(function (job) {
            job.skills.forEach(
                function (skill) {
                    if (
                        !allSkills.some(
                            function (existing) {
                                return (
                                    existing.toLowerCase() ===
                                    skill.toLowerCase()
                                );
                            }
                        )
                    ) {
                        allSkills.push(
                            skill
                        );
                    }
                }
            );
        });

        return allSkills;
    }


    /* ========================================================
       JOB RENDERING
       ======================================================== */

    function renderJobs() {
        const containers =
            [
                $("jobs-container"),
                $("career-jobs-container"),
                $("dynamic-jobs-container")
            ].filter(Boolean);

        if (!containers.length) {
            return;
        }

        const jobs =
            state.careerJobs;

        const html =
            jobs.length
                ? jobs.map(
                    function (job, index) {
                        return `
                            <div class="job-card">
                                <div class="job-card-header">
                                    <h4>
                                        ${escapeHtml(
                                            job.title
                                        )}
                                    </h4>

                                    ${
                                        job.company
                                            ? `<span>${escapeHtml(job.company)}</span>`
                                            : ""
                                    }
                                </div>

                                ${
                                    job.location
                                        ? `
                                            <div class="job-location">
                                                ${escapeHtml(job.location)}
                                            </div>
                                        `
                                        : ""
                                }

                                ${
                                    job.skills.length
                                        ? `
                                            <div class="job-skills">
                                                ${job.skills
                                                    .slice(0, 12)
                                                    .map(
                                                        function (
                                                            skill
                                                        ) {
                                                            return `
                                                                <span class="skill-tag">
                                                                    ${escapeHtml(skill)}
                                                                </span>
                                                            `;
                                                        }
                                                    )
                                                    .join("")}
                                            </div>
                                        `
                                        : ""
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
                                                View Job
                                            </a>
                                        `
                                        : ""
                                }
                            </div>
                        `;
                    }
                ).join("")
                : `
                    <div class="empty-state">
                        <h4>No jobs extracted yet</h4>
                        <p>
                            Enter a career or jobs URL and analyze it
                            to load real job openings.
                        </p>
                    </div>
                `;

        containers.forEach(
            function (container) {
                container.innerHTML =
                    html;
            }
        );
    }


    /* ========================================================
       DYNAMIC JOB MATCHING
       ======================================================== */

    function calculateJobMatch(job) {
        const resumeSkills =
            normalizeSkills(
                state.extractedSkills
            );

        const required =
            normalizeSkills(
                job.skills
            );

        if (!required.length) {
            return {
                matched: [],
                missing: [],
                percentage: 0
            };
        }

        const matched =
            required.filter(
                function (requiredSkill) {
                    return resumeSkills.some(
                        function (resumeSkill) {
                            return (
                                resumeSkill
                                    .toLowerCase()
                                    .includes(
                                        requiredSkill
                                            .toLowerCase()
                                    ) ||
                                requiredSkill
                                    .toLowerCase()
                                    .includes(
                                        resumeSkill
                                            .toLowerCase()
                                    )
                            );
                        }
                    );
                }
            );

        const missing =
            required.filter(
                function (requiredSkill) {
                    return !matched.includes(
                        requiredSkill
                    );
                }
            );

        const percentage =
            Math.round(
                (
                    matched.length /
                    required.length
                ) * 100
            );

        return {
            matched: matched,
            missing: missing,
            percentage: percentage
        };
    }

    function getBestJob() {
        if (!state.careerJobs.length) {
            return null;
        }

        let best = null;

        state.careerJobs.forEach(
            function (job) {
                const match =
                    calculateJobMatch(
                        job
                    );

                if (
                    !best ||
                    match.percentage >
                    best.match.percentage
                ) {
                    best = {
                        job: job,
                        match: match
                    };
                }
            }
        );

        return best;
    }

    function updateRecommendation() {
        const best =
            getBestJob();

        state.recommendedJob =
            best;

        const titleElements =
            [
                $("recommended-job-title"),
                $("recommendation-role"),
                $("best-job-role")
            ].filter(Boolean);

        const companyElements =
            [
                $("recommended-job-company"),
                $("recommendation-company"),
                $("best-job-company")
            ].filter(Boolean);

        const scoreElements =
            [
                $("recommended-job-score"),
                $("recommendation-score"),
                $("best-job-score")
            ].filter(Boolean);

        if (!best) {
            titleElements.forEach(
                function (element) {
                    element.textContent =
                        "No recommendation yet";
                }
            );

            companyElements.forEach(
                function (element) {
                    element.textContent =
                        "";
                }
            );

            scoreElements.forEach(
                function (element) {
                    element.textContent =
                        "0%";
                }
            );

            return;
        }

        titleElements.forEach(
            function (element) {
                element.textContent =
                    best.job.title;
            }
        );

        companyElements.forEach(
            function (element) {
                element.textContent =
                    best.job.company ||
                    "";
            }
        );

        scoreElements.forEach(
            function (element) {
                element.textContent =
                    best.match.percentage +
                    "%";
            }
        );
    }


    /* ========================================================
       RESUME UPLOAD
       ======================================================== */

    function initResumeUpload() {
        /*
         * SUPPORT BOTH:
         *   Current index.php -> resume-file
         *   Older HTML        -> input-resume-file
         */

        const input =
            $("resume-file") ||
            $("input-resume-file");

        const uploadForm =
            $("form-resume-upload");

        const dropZone =
            $("resume-drop-zone");

        const selectButton =
            $("resume-select-button");

        const evaluateButton =
            $("evaluate-resume");

        const sampleButton =
            $("btn-load-sample-resume");

        if (!input) {
            console.warn(
                "Resume file input not found."
            );

            return;
        }

        /* ----------------------------------------------------
           SELECT BUTTON
           ---------------------------------------------------- */

        if (selectButton) {
            selectButton.addEventListener(
                "click",
                function (event) {
                    event.preventDefault();
                    input.click();
                }
            );
        }

        /* ----------------------------------------------------
           FILE SELECTION
           ---------------------------------------------------- */

        input.addEventListener(
            "change",
            function () {
                if (
                    input.files &&
                    input.files.length
                ) {
                    state.selectedResume =
                        input.files[0];

                    updateResumeFileName(
                        input.files[0].name
                    );
                }
            }
        );

        /* ----------------------------------------------------
           DRAG & DROP
           ---------------------------------------------------- */

        if (dropZone) {
            [
                "dragenter",
                "dragover"
            ].forEach(
                function (eventName) {
                    dropZone.addEventListener(
                        eventName,
                        function (event) {
                            event.preventDefault();
                            event.stopPropagation();

                            dropZone.classList.add(
                                "dragover"
                            );
                        }
                    );
                }
            );

            [
                "dragleave",
                "drop"
            ].forEach(
                function (eventName) {
                    dropZone.addEventListener(
                        eventName,
                        function (event) {
                            event.preventDefault();
                            event.stopPropagation();

                            dropZone.classList.remove(
                                "dragover"
                            );
                        }
                    );
                }
            );

            dropZone.addEventListener(
                "drop",
                function (event) {
                    const files =
                        event.dataTransfer.files;

                    if (
                        files &&
                        files.length
                    ) {
                        state.selectedResume =
                            files[0];

                        /*
                         * Do not depend on assigning
                         * input.files because some browsers
                         * restrict it.
                         */
                        try {
                            const transfer =
                                new DataTransfer();

                            transfer.items.add(
                                files[0]
                            );

                            input.files =
                                transfer.files;
                        } catch (error) {
                            console.warn(
                                "Could not assign dropped file to input.",
                                error
                            );
                        }

                        updateResumeFileName(
                            files[0].name
                        );
                    }
                }
            );
        }

        /* ----------------------------------------------------
           FORM SUBMIT
           ---------------------------------------------------- */

        if (uploadForm) {
            uploadForm.addEventListener(
                "submit",
                function (event) {
                    event.preventDefault();

                    uploadResume();
                }
            );
        }

        /*
         * Some versions of index.php use a button instead
         * of a form submit. Support both.
         */
        if (
            evaluateButton &&
            !uploadForm
        ) {
            evaluateButton.addEventListener(
                "click",
                function (event) {
                    event.preventDefault();

                    uploadResume();
                }
            );
        }

        /* ----------------------------------------------------
           SAMPLE RESUME
           ---------------------------------------------------- */

        if (sampleButton) {
            sampleButton.addEventListener(
                "click",
                async function () {
                    const status =
                        $("resume-upload-status");

                    if (status) {
                        status.style.display =
                            "block";

                        status.className =
                            "alert alert-info";

                        status.textContent =
                            "Loading sample profile...";
                    }

                    try {
                        const result =
                            await apiRequest(
                                "load_sample",
                                {},
                                {
                                    method: "GET"
                                }
                            );

                        if (
                            !apiSuccess(
                                result
                            )
                        ) {
                            throw new Error(
                                result.message ||
                                "Unable to load sample profile."
                            );
                        }

                        window.location.reload();

                    } catch (error) {
                        showPopup(
                            "Sample Profile Failed",
                            error.message ||
                            "Unable to load sample profile.",
                            "error"
                        );
                    }
                }
            );
        }
    }


    function updateResumeFileName(name) {
        const elements =
            [
                $("resume-file-name"),
                $("selected-resume-name")
            ].filter(Boolean);

        elements.forEach(
            function (element) {
                element.textContent =
                    name || "";
            }
        );
    }


    /* ========================================================
       ACTUAL RESUME UPLOAD
       ======================================================== */

    async function uploadResume() {
        /*
         * IMPORTANT:
         * Current HTML:
         *     id="resume-file"
         *
         * Old HTML:
         *     id="input-resume-file"
         */

        const input =
            $("resume-file") ||
            $("input-resume-file");

        const button =
            $("evaluate-resume");

        if (
            !input ||
            !input.files ||
            !input.files.length
        ) {
            showPopup(
                "Resume Required",
                "Please select a PDF or DOCX resume first.",
                "warning"
            );

            return;
        }

        const file =
            input.files[0];

        if (!file) {
            showPopup(
                "Resume Required",
                "Please select a valid resume file.",
                "warning"
            );

            return;
        }

        /* ----------------------------------------------------
           FILE VALIDATION
           ---------------------------------------------------- */

        const fileName =
            String(
                file.name || ""
            ).toLowerCase();

        const extension =
            fileName.includes(".")
                ? fileName
                    .substring(
                        fileName.lastIndexOf(".") + 1
                    )
                : "";

        const allowedExtensions =
            [
                "pdf",
                "doc",
                "docx"
            ];

        if (
            !allowedExtensions.includes(
                extension
            )
        ) {
            showPopup(
                "Invalid Resume File",
                "Please upload a PDF, DOC, or DOCX resume.",
                "warning"
            );

            return;
        }

        /*
         * 15 MB frontend limit.
         * Backend should also validate this.
         */
        if (
            file.size >
            15 * 1024 * 1024
        ) {
            showPopup(
                "File Too Large",
                "Please upload a resume smaller than 15 MB.",
                "warning"
            );

            return;
        }

        /* ----------------------------------------------------
           FORM DATA
           ---------------------------------------------------- */

        const formData =
            new FormData();

        /*
         * THIS IS THE IMPORTANT FIX.
         *
         * Send the same file using both names.
         *
         * PHP backend versions may check:
         *     $_FILES['resume_file']
         *
         * or:
         *     $_FILES['resume']
         *
         * Sending both prevents the frontend/backend
         * naming mismatch.
         */

        formData.append(
            "resume_file",
            file,
            file.name
        );

        formData.append(
            "resume",
            file,
            file.name
        );

        formData.append(
            "file",
            file,
            file.name
        );

        /*
         * Action is also sent in POST body.
         */
        formData.append(
            "action",
            "upload_resume"
        );

        if (state.careerUrl) {
            formData.append(
                "career_url",
                state.careerUrl
            );
        }

        formData.append(
            "target_company",
            state.targetCompany || ""
        );

        formData.append(
            "target_role",
            state.targetRole || ""
        );

        formData.append(
            "required_skills",
            JSON.stringify(
                state.requiredSkills || []
            )
        );

        /* ----------------------------------------------------
           STATUS
           ---------------------------------------------------- */

        const statusBox =
            $("resume-upload-status");

        if (statusBox) {
            statusBox.className =
                "alert alert-info";

            statusBox.textContent =
                "Uploading resume and extracting skills...";

            statusBox.style.display =
                "block";
        }

        setLoading(
            button,
            true,
            "Analyzing Resume..."
        );

        try {
            const result =
                await apiRequest(
                    "upload_resume",
                    formData
                );

            console.log(
                "Resume API response:",
                result
            );

            if (!apiSuccess(result)) {
                throw new Error(
                    result.message ||
                    result.error ||
                    "Resume analysis failed."
                );
            }

            /* ------------------------------------------------
               SAVE RESULTS
               ------------------------------------------------ */

            state.extractedSkills =
                normalizeSkills(
                    result.extracted_skills ||
                    result.skills ||
                    result.data?.extracted_skills ||
                    result.data?.skills ||
                    []
                );

            state.requiredSkills =
                normalizeSkills(
                    result.required_skills ||
                    result.data?.required_skills ||
                    state.requiredSkills
                );

            state.atsScore =
                Number(
                    result.ats_score ??
                    result.data?.ats_score ??
                    0
                );

            if (
                result.resume
            ) {
                updateResumeContact(
                    result.resume
                );
            }

            if (
                result.data?.resume
            ) {
                updateResumeContact(
                    result.data.resume
                );
            }

            window.EXTRACTED_SKILLS =
                state.extractedSkills;

            window.REQUIRED_SKILLS =
                state.requiredSkills;

            window.ATS_SCORE =
                state.atsScore;

            updateGlobalData();

            /* ------------------------------------------------
               RENDER EVERYTHING
               ------------------------------------------------ */

            renderATS();
            renderExtractedSkills();
            renderSkillGap();
            renderJobs();
            updateRecommendation();
            updateStats();
            renderDashboardCharts();

            if (statusBox) {
                statusBox.className =
                    "alert alert-success";

                statusBox.textContent =
                    "Resume analyzed successfully.";
            }

            showPopup(
                "Resume Analyzed Successfully",
                "Your resume has been processed and your skills have been compared with the available jobs.",
                "success"
            );

        } catch (error) {
            console.error(
                "Resume analysis error:",
                error
            );

            if (statusBox) {
                statusBox.className =
                    "alert alert-error";

                statusBox.textContent =
                    error.message ||
                    "Unable to analyze the resume.";
            }

            showPopup(
                "Resume Analysis Failed",
                error.message ||
                "Unable to analyze the resume.",
                "error"
            );

        } finally {
            setLoading(
                button,
                false
            );
        }
    }


    /* ========================================================
       RESUME CONTACT INFORMATION
       ======================================================== */

    function updateResumeContact(resume) {
        if (!resume) {
            return;
        }

        const mappings = {
            "resume-name":
                resume.name,

            "resume-email":
                resume.email,

            "resume-phone":
                resume.phone,

            "resume-linkedin":
                resume.linkedin,

            "resume-github":
                resume.github
        };

        Object.keys(mappings).forEach(
            function (id) {
                const element =
                    $(id);

                if (
                    element &&
                    mappings[id] !== undefined &&
                    mappings[id] !== null
                ) {
                    if (
                        "value" in element
                    ) {
                        element.value =
                            mappings[id];
                    } else {
                        element.textContent =
                            mappings[id];
                    }
                }
            }
        );
    }


    /* ========================================================
       ATS
       ======================================================== */

    function renderATS() {
        const score =
            Math.max(
                0,
                Math.min(
                    100,
                    Number(
                        state.atsScore || 0
                    )
                )
            );

        const scoreElements =
            [
                $("ats-score"),
                $("ats-score-value"),
                $("metric-ats-score")
            ].filter(Boolean);

        scoreElements.forEach(
            function (element) {
                element.textContent =
                    Math.round(score);
            }
        );

        const feedback =
            $("ats-feedback");

        if (feedback) {
            let text =
                "";

            if (score >= 80) {
                text =
                    "Your resume has strong ATS compatibility.";
            } else if (score >= 60) {
                text =
                    "Your resume has moderate ATS compatibility. Adding relevant skills and keywords may improve the match.";
            } else if (score > 0) {
                text =
                    "Your resume needs improvement for stronger ATS compatibility.";
            } else {
                text =
                    "Upload a resume to calculate your ATS score.";
            }

            feedback.textContent =
                text;
        }
    }


    /* ========================================================
       EXTRACTED SKILLS
       ======================================================== */

    function renderExtractedSkills() {
        const container =
            $("resume-skills-list");

        if (!container) {
            return;
        }

        if (
            !state.extractedSkills.length
        ) {
            container.innerHTML =
                `
                    <p style="color:var(--text-muted);">
                        No skills extracted yet.
                    </p>
                `;

            return;
        }

        container.innerHTML =
            state.extractedSkills
                .map(
                    function (skill) {
                        return `
                            <span class="skill-tag-matched">
                                ${escapeHtml(skill)}
                            </span>
                        `;
                    }
                )
                .join("");
    }


    /* ========================================================
       SKILL GAP
       ======================================================== */

    function calculateOverallSkillGap() {
        const required =
            normalizeSkills(
                state.requiredSkills
            );

        const extracted =
            normalizeSkills(
                state.extractedSkills
            );

        const matched =
            required.filter(
                function (requiredSkill) {
                    return extracted.some(
                        function (skill) {
                            return (
                                skill
                                    .toLowerCase()
                                    .includes(
                                        requiredSkill
                                            .toLowerCase()
                                    ) ||
                                requiredSkill
                                    .toLowerCase()
                                    .includes(
                                        skill
                                            .toLowerCase()
                                    )
                            );
                        }
                    );
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

        return {
            matched: matched,
            missing: missing
        };
    }

    function renderSkillGap() {
        const result =
            calculateOverallSkillGap();

        const matchedBox =
            $("matched-skills-tags");

        const missingBox =
            $("missing-skills-tags");

        if (matchedBox) {
            matchedBox.innerHTML =
                result.matched.length
                    ? result.matched
                        .map(
                            function (skill) {
                                return `
                                    <span class="skill-tag-matched">
                                        ${escapeHtml(skill)}
                                    </span>
                                `;
                            }
                        )
                        .join("")
                    : `
                        <p style="color:var(--text-muted);">
                            No matching skills detected yet.
                        </p>
                    `;
        }

        if (missingBox) {
            missingBox.innerHTML =
                result.missing.length
                    ? result.missing
                        .map(
                            function (skill) {
                                return `
                                    <span class="skill-tag-missing">
                                        ${escapeHtml(skill)}
                                    </span>
                                `;
                            }
                        )
                        .join("")
                    : `
                        <p style="color:var(--emerald);">
                            All currently identified required skills are matched.
                        </p>
                    `;
        }
    }


    /* ========================================================
       DASHBOARD STATISTICS
       ======================================================== */

    function updateStats() {
        const jobs =
            state.careerJobs.length;

        const required =
            state.requiredSkills.length;

        const extracted =
            state.extractedSkills.length;

        const gap =
            calculateOverallSkillGap();

        const matched =
            gap.matched.length;

        const readiness =
            required > 0
                ? Math.round(
                    (
                        matched /
                        required
                    ) * 100
                )
                : 0;

        const values = {
            "stat-jobs": jobs,
            "metric-jobs": jobs,

            "stat-skills": extracted,
            "metric-skills": extracted,

            "stat-required-skills":
                required,

            "metric-required-skills":
                required,

            "stat-matched":
                matched,

            "metric-matched":
                matched,

            "stat-readiness":
                readiness + "%",

            "metric-readiness":
                readiness + "%",

            "stat-ats":
                Math.round(
                    state.atsScore
                ),

            "metric-ats":
                Math.round(
                    state.atsScore
                )
        };

        Object.keys(values).forEach(
            function (id) {
                const element =
                    $(id);

                if (element) {
                    element.textContent =
                        values[id];
                }
            }
        );

        const matchedCount =
            $("metric-matched-count");

        if (matchedCount) {
            matchedCount.textContent =
                `${matched} of ${required} Skills Matched`;
        }

        const confidence =
            $("metric-confidence");

        if (confidence) {
            confidence.textContent =
                required
                    ? readiness + "%"
                    : "0%";
        }

        const strength =
            $("metric-strength");

        if (strength) {
            if (readiness >= 80) {
                strength.textContent =
                    "Strong";
            } else if (readiness >= 60) {
                strength.textContent =
                    "Moderate";
            } else {
                strength.textContent =
                    "Needs Improvement";
            }
        }
    }


    /* ========================================================
       CHARTS
       ======================================================== */

    function initCharts() {
        if (
            typeof Chart ===
            "undefined"
        ) {
            return;
        }

        const radarCanvas =
            $("radarChartCtx");

        const pieCanvas =
            $("pieChartCtx");

        if (radarCanvas) {
            state.charts.radar =
                new Chart(
                    radarCanvas,
                    {
                        type: "radar",

                        data: {
                            labels: [
                                "Technical Skills",
                                "ATS Compatibility",
                                "Projects",
                                "Core CS",
                                "Role Fit"
                            ],

                            datasets: [
                                {
                                    label:
                                        "Score",

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
                                    min: 0,
                                    max: 100,

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
            state.charts.pie =
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
                                        0
                                    ],

                                    backgroundColor: [
                                        "#10b981",
                                        "#f43f5e"
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
                                        "bottom"
                                }
                            }
                        }
                    }
                );
        }

        updateDashboardCharts();
    }

    function updateDashboardCharts() {
        const required =
            state.requiredSkills.length;

        const extracted =
            state.extractedSkills.length;

        const gap =
            calculateOverallSkillGap();

        const readiness =
            required
                ? Math.round(
                    (
                        gap.matched.length /
                        required
                    ) * 100
                )
                : 0;

        if (state.charts.radar) {
            state.charts.radar.data.datasets[0].data =
                [
                    Math.min(
                        100,
                        extracted * 8
                    ),

                    Number(
                        state.atsScore || 0
                    ),

                    Math.min(
                        100,
                        state.careerJobs.length * 10
                    ),

                    Math.min(
                        100,
                        extracted * 7
                    ),

                    readiness
                ];

            state.charts.radar.update();
        }

        if (state.charts.pie) {
            state.charts.pie.data.datasets[0].data =
                [
                    gap.matched.length,
                    gap.missing.length
                ];

            state.charts.pie.update();
        }
    }

    function renderDashboardCharts() {
        updateDashboardCharts();
    }

    function updateChartsTheme() {
        if (state.charts.radar) {
            state.charts.radar.update();
        }

        if (state.charts.pie) {
            state.charts.pie.update();
        }
    }


    /* ========================================================
       ROADMAP
       ======================================================== */

    async function loadDynamicRoadmap() {
        const container =
            $("container-dynamic-roadmap");

        const resources =
            $("container-dynamic-resources");

        if (!container) {
            return;
        }

        const gap =
            calculateOverallSkillGap();

        const formData =
            new FormData();

        formData.append(
            "action",
            "get_roadmap"
        );

        formData.append(
            "missing_skills",
            JSON.stringify(
                gap.missing
            )
        );

        formData.append(
            "target_company",
            state.targetCompany || ""
        );

        formData.append(
            "target_role",
            state.targetRole || ""
        );

        try {
            const result =
                await apiRequest(
                    "get_roadmap",
                    formData
                );

            if (
                !apiSuccess(result) ||
                !result.roadmap
            ) {
                return;
            }

            const roadmap =
                result.roadmap;

            const phases =
                Array.isArray(
                    roadmap.phases
                )
                    ? roadmap.phases
                    : [];

            container.innerHTML =
                phases.length
                    ? phases
                        .map(
                            function (phase) {
                                return `
                                    <div class="roadmap-phase-card">

                                        <div class="roadmap-phase-title">
                                            ${escapeHtml(
                                                phase.phase || ""
                                            )}
                                            ${
                                                phase.objective
                                                    ? " — " +
                                                      escapeHtml(
                                                          phase.objective
                                                      )
                                                    : ""
                                            }
                                        </div>

                                        ${
                                            phase.duration
                                                ? `
                                                    <div class="roadmap-phase-duration">
                                                        Timeline:
                                                        ${escapeHtml(
                                                            phase.duration
                                                        )}
                                                    </div>
                                                `
                                                : ""
                                        }

                                        ${
                                            Array.isArray(
                                                phase.skills
                                            ) &&
                                            phase.skills.length
                                                ? `
                                                    <p>
                                                        <strong>
                                                            Target Skills:
                                                        </strong>
                                                        ${escapeHtml(
                                                            phase.skills.join(
                                                                ", "
                                                            )
                                                        )}
                                                    </p>
                                                `
                                                : ""
                                        }

                                        ${
                                            Array.isArray(
                                                phase.action_items
                                            ) &&
                                            phase.action_items.length
                                                ? `
                                                    <ul>
                                                        ${phase.action_items
                                                            .map(
                                                                function (
                                                                    item
                                                                ) {
                                                                    return `
                                                                        <li>
                                                                            ${escapeHtml(
                                                                                item
                                                                            )}
                                                                        </li>
                                                                    `;
                                                                }
                                                            )
                                                            .join("")}
                                                    </ul>
                                                `
                                                : ""
                                        }

                                    </div>
                                `;
                            }
                        )
                        .join("")
                    : `
                        <div class="empty-state">
                            <p>
                                Upload a resume and analyze a career URL
                                to generate a personalized roadmap.
                            </p>
                        </div>
                    `;

            if (
                resources
            ) {
                const resourceList =
                    Array.isArray(
                        roadmap.resources
                    )
                        ? roadmap.resources
                        : [];

                resources.innerHTML =
                    resourceList
                        .map(
                            function (resource) {
                                return `
                                    <details>
                                        <summary>
                                            ${escapeHtml(
                                                resource.skill || "Learning Resource"
                                            )}
                                        </summary>

                                        <div style="padding:12px;">

                                            ${
                                                resource.platform
                                                    ? `
                                                        <p>
                                                            <strong>
                                                                Platform:
                                                            </strong>
                                                            ${escapeHtml(
                                                                resource.platform
                                                            )}
                                                        </p>
                                                    `
                                                    : ""
                                            }

                                            ${
                                                resource.time
                                                    ? `
                                                        <p>
                                                            <strong>
                                                                Estimated Time:
                                                            </strong>
                                                            ${escapeHtml(
                                                                resource.time
                                                            )}
                                                        </p>
                                                    `
                                                    : ""
                                            }

                                            ${
                                                resource.docs
                                                    ? `
                                                        <p>
                                                            <strong>
                                                                Documentation:
                                                            </strong>
                                                            <a
                                                                href="${escapeHtml(
                                                                    resource.docs
                                                                )}"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                Open Documentation
                                                            </a>
                                                        </p>
                                                    `
                                                    : ""
                                            }

                                            ${
                                                resource.project
                                                    ? `
                                                        <p>
                                                            <strong>
                                                                Project:
                                                            </strong>
                                                            ${escapeHtml(
                                                                resource.project
                                                            )}
                                                        </p>
                                                    `
                                                    : ""
                                            }

                                        </div>
                                    </details>
                                `;
                            }
                        )
                        .join("");
            }

        } catch (error) {
            console.error(
                "Roadmap error:",
                error
            );
        }
    }


    /* ========================================================
       INTERVIEW PREPARATION
       ======================================================== */

    async function loadDynamicInterview() {
        const container =
            $("container-dynamic-interview");

        if (!container) {
            return;
        }

        const gap =
            calculateOverallSkillGap();

        const formData =
            new FormData();

        formData.append(
            "action",
            "get_interview"
        );

        formData.append(
            "target_role",
            state.targetRole || ""
        );

        formData.append(
            "matched_skills",
            JSON.stringify(
                gap.matched
            )
        );

        formData.append(
            "missing_skills",
            JSON.stringify(
                gap.missing
            )
        );

        try {
            const result =
                await apiRequest(
                    "get_interview",
                    formData
                );

            if (
                !apiSuccess(result)
            ) {
                return;
            }

            const prep =
                result.prep_data ||
                result.data ||
                {};

            let html =
                "";

            if (
                Array.isArray(
                    prep.technical_known
                )
            ) {
                html +=
                    `
                        <h4>
                            Technical Questions
                        </h4>
                    `;

                html +=
                    prep.technical_known
                        .map(
                            function (
                                item,
                                index
                            ) {
                                return `
                                    <details>
                                        <summary>
                                            Q${index + 1}:
                                            ${escapeHtml(
                                                item.q || ""
                                            )}
                                        </summary>

                                        <div style="padding:12px;">
                                            <p>
                                                <strong>
                                                    Answer:
                                                </strong>
                                                ${escapeHtml(
                                                    item.a || ""
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
                                                    : ""
                                            }
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
                )
            ) {
                html +=
                    `
                        <h4 style="margin-top:20px;">
                            Skill-Gap Questions
                        </h4>
                    `;

                html +=
                    prep.gap_questions
                        .map(
                            function (
                                item,
                                index
                            ) {
                                return `
                                    <details>
                                        <summary>
                                            Gap Question ${index + 1}:
                                            ${escapeHtml(
                                                item.q || ""
                                            )}
                                        </summary>

                                        <div style="padding:12px;">
                                            <p>
                                                <strong>
                                                    Answer:
                                                </strong>
                                                ${escapeHtml(
                                                    item.a || ""
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
                )
            ) {
                html +=
                    `
                        <h4 style="margin-top:20px;">
                            HR & Behavioral Questions
                        </h4>
                    `;

                html +=
                    prep.behavioral
                        .map(
                            function (
                                item,
                                index
                            ) {
                                return `
                                    <details>
                                        <summary>
                                            HR Q${index + 1}:
                                            ${escapeHtml(
                                                item.q || ""
                                            )}
                                        </summary>

                                        <div style="padding:12px;">
                                            ${
                                                item.framework
                                                    ? `
                                                        <p>
                                                            <strong>
                                                                Framework:
                                                            </strong>
                                                            ${escapeHtml(
                                                                item.framework
                                                            )}
                                                        </p>
                                                    `
                                                    : ""
                                            }

                                            ${
                                                item.guide
                                                    ? `
                                                        <p>
                                                            ${escapeHtml(
                                                                item.guide
                                                            )}
                                                        </p>
                                                    `
                                                    : ""
                                            }
                                        </div>
                                    </details>
                                `;
                            }
                        )
                        .join("");
            }

            if (!html) {
                html =
                    `
                        <div class="empty-state">
                            <p>
                                Interview preparation will appear
                                after your resume and career data
                                are analyzed.
                            </p>
                        </div>
                    `;
            }

            container.innerHTML =
                html;

        } catch (error) {
            console.error(
                "Interview preparation error:",
                error
            );
        }
    }


    /* ========================================================
       JOB RANKING
       ======================================================== */

    function initJobRanking() {
        const filter =
            $("select-job-domain-filter");

        const search =
            $("input-job-search");

        if (filter) {
            filter.addEventListener(
                "change",
                loadRankedJobs
            );
        }

        if (search) {
            search.addEventListener(
                "input",
                function () {
                    renderLocalJobRanking(
                        search.value
                    );
                }
            );
        }

        loadRankedJobs();
    }

    async function loadRankedJobs() {
        const filter =
            $("select-job-domain-filter");

        const search =
            $("input-job-search");

        if (!state.careerJobs.length) {
            renderLocalJobRanking(
                search?.value || ""
            );

            return;
        }

        renderLocalJobRanking(
            search?.value || ""
        );

        /*
         * The local ranking is intentionally used as a fallback.
         * If the backend supports rank_jobs, use it too.
         */
        try {
            const formData =
                new FormData();

            formData.append(
                "action",
                "rank_jobs"
            );

            formData.append(
                "domain_filter",
                filter?.value || ""
            );

            const result =
                await apiRequest(
                    "rank_jobs",
                    formData
                );

            if (
                apiSuccess(result) &&
                Array.isArray(result.jobs)
            ) {
                renderJobTable(
                    result.jobs,
                    search?.value || ""
                );
            }

        } catch (error) {
            console.warn(
                "Backend ranking unavailable. Using local ranking.",
                error
            );
        }
    }

    function renderLocalJobRanking(
        query
    ) {
        const jobs =
            state.careerJobs.map(
                function (job) {
                    const match =
                        calculateJobMatch(
                            job
                        );

                    return {
                        company:
                            job.company || "",

                        role:
                            job.title || "",

                        domain:
                            "",

                        match_pct:
                            match.percentage,

                        matched_count:
                            match.matched.length,

                        total_count:
                            job.skills.length,

                        fit_label:
                            match.percentage >= 80
                                ? "High Match"
                                : match.percentage >= 50
                                    ? "Moderate Match"
                                    : "Needs Improvement",

                        missing_skills:
                            match.missing
                    };
                }
            );

        renderJobTable(
            jobs,
            query
        );
    }

    function renderJobTable(
        jobs,
        query
    ) {
        const tbody =
            $("tbody-job-ranking");

        if (!tbody) {
            return;
        }

        query =
            String(
                query || ""
            ).toLowerCase();

        const filtered =
            (Array.isArray(jobs)
                ? jobs
                : []
            ).filter(
                function (job) {
                    return (
                        !query ||
                        String(
                            job.company || ""
                        )
                            .toLowerCase()
                            .includes(query) ||
                        String(
                            job.role || ""
                        )
                            .toLowerCase()
                            .includes(query)
                    );
                }
            );

        tbody.innerHTML =
            filtered.length
                ? filtered
                    .map(
                        function (job) {
                            return `
                                <tr>
                                    <td>
                                        <strong>
                                            ${escapeHtml(
                                                job.company || ""
                                            )}
                                        </strong>
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                            job.role || ""
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                            job.domain || ""
                                        )}
                                    </td>

                                    <td>
                                        <strong>
                                            ${Number(
                                                job.match_pct || 0
                                            )}%
                                        </strong>
                                    </td>

                                    <td>
                                        ${Number(
                                            job.matched_count || 0
                                        )}
                                        /
                                        ${Number(
                                            job.total_count || 0
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                            job.fit_label || ""
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                            Array.isArray(
                                                job.missing_skills
                                            )
                                                ? job.missing_skills
                                                    .slice(0, 3)
                                                    .join(", ")
                                                : ""
                                        )}
                                    </td>
                                </tr>
                            `;
                        }
                    )
                    .join("")
                : `
                    <tr>
                        <td colspan="7">
                            No matching jobs found.
                        </td>
                    </tr>
                `;
    }


    /* ========================================================
       SKILL EDITOR
       ======================================================== */

    function initSkillEditor() {
        const button =
            $("btn-update-skills-live");

        if (!button) {
            return;
        }

        button.addEventListener(
            "click",
            async function () {
                const checked =
                    qsa(
                        ".active-profile-skill-checkbox:checked"
                    );

                const skills =
                    checked.map(
                        function (checkbox) {
                            return checkbox.value;
                        }
                    );

                const formData =
                    new FormData();

                formData.append(
                    "action",
                    "update_skills"
                );

                formData.append(
                    "skills",
                    JSON.stringify(
                        skills
                    )
                );

                try {
                    const result =
                        await apiRequest(
                            "update_skills",
                            formData
                        );

                    if (
                        !apiSuccess(
                            result
                        )
                    ) {
                        throw new Error(
                            result.message ||
                            "Unable to update skills."
                        );
                    }

                    state.extractedSkills =
                        normalizeSkills(
                            result.skills ||
                            result.extracted_skills ||
                            skills
                        );

                    updateGlobalData();

                    renderExtractedSkills();
                    renderSkillGap();
                    updateStats();
                    renderDashboardCharts();

                    showPopup(
                        "Skills Updated",
                        "Your active skills have been updated.",
                        "success"
                    );

                } catch (error) {
                    showPopup(
                        "Skill Update Failed",
                        error.message ||
                        "Unable to update skills.",
                        "error"
                    );
                }
            }
        );
    }


    /* ========================================================
       PROFILE
       ======================================================== */

    function initProfileForm() {
        const form =
            $("form-update-profile");

        if (!form) {
            return;
        }

        form.addEventListener(
            "submit",
            async function (event) {
                event.preventDefault();

                const formData =
                    new FormData(form);

                formData.set(
                    "action",
                    "update_profile"
                );

                try {
                    const result =
                        await apiRequest(
                            "update_profile",
                            formData
                        );

                    if (
                        !apiSuccess(
                            result
                        )
                    ) {
                        throw new Error(
                            result.message ||
                            "Unable to update profile."
                        );
                    }

                    showPopup(
                        "Profile Updated",
                        "Your profile has been updated successfully.",
                        "success"
                    );

                } catch (error) {
                    showPopup(
                        "Profile Update Failed",
                        error.message ||
                        "Unable to update profile.",
                        "error"
                    );
                }
            }
        );
    }


    /* ========================================================
       AI INTERVIEW ASSISTANT
       ======================================================== */

    function initAIInterviewAssistant() {
        const tabAssistant =
            $("tab-btn-ai-assistant");

        const tabEvaluator =
            $("tab-btn-ai-evaluator");

        const tabQuestions =
            $("tab-btn-ai-questions");

        const subAssistant =
            $("subtab-ai-assistant");

        const subEvaluator =
            $("subtab-ai-evaluator");

        const subQuestions =
            $("subtab-ai-questions");

        function activateTab(
            activeTab,
            activeSub
        ) {
            [
                tabAssistant,
                tabEvaluator,
                tabQuestions
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
                subAssistant,
                subEvaluator,
                subQuestions
            ].forEach(
                function (sub) {
                    if (sub) {
                        sub.style.display =
                            "none";
                    }
                }
            );

            if (activeTab) {
                activeTab.classList.add(
                    "active"
                );
            }

            if (activeSub) {
                activeSub.style.display =
                    "block";
            }
        }

        if (
            tabAssistant &&
            tabEvaluator &&
            tabQuestions
        ) {
            tabAssistant.addEventListener(
                "click",
                function () {
                    activateTab(
                        tabAssistant,
                        subAssistant
                    );
                }
            );

            tabEvaluator.addEventListener(
                "click",
                function () {
                    activateTab(
                        tabEvaluator,
                        subEvaluator
                    );
                }
            );

            tabQuestions.addEventListener(
                "click",
                function () {
                    activateTab(
                        tabQuestions,
                        subQuestions
                    );
                }
            );
        }

        /* ----------------------------------------------------
           AI ASSISTANT
           ---------------------------------------------------- */

        const promptInput =
            $("input-ai-prompt");

        const submitButton =
            $("btn-submit-ai-prompt");

        const presetButtons =
            qsa(".ai-preset-btn");

        const responseCard =
            $("ai-assistant-response-card");

        const responseTitle =
            $("ai-response-title");

        const responseBody =
            $("ai-response-body");

        async function executePrompt(
            query
        ) {
            if (!query) {
                return;
            }

            if (responseCard) {
                responseCard.style.display =
                    "block";
            }

            if (responseTitle) {
                responseTitle.textContent =
                    "Generating response...";
            }

            if (responseBody) {
                responseBody.innerHTML =
                    `
                        <p>
                            Preparing an answer based on your
                            current career and resume data...
                        </p>
                    `;
            }

            const formData =
                new FormData();

            formData.append(
                "action",
                "ask_interview_ai"
            );

            formData.append(
                "prompt",
                query
            );

            formData.append(
                "target_role",
                state.targetRole || ""
            );

            formData.append(
                "target_company",
                state.targetCompany || ""
            );

            try {
                const result =
                    await apiRequest(
                        "ask_interview_ai",
                        formData
                    );

                if (
                    !apiSuccess(
                        result
                    )
                ) {
                    throw new Error(
                        result.message ||
                        "Unable to generate AI response."
                    );
                }

                if (responseTitle) {
                    responseTitle.textContent =
                        result.title ||
                        "Interview Guidance";
                }

                if (responseBody) {
                    let html =
                        "";

                    if (
                        Array.isArray(
                            result.advice_steps
                        )
                    ) {
                        html +=
                            `
                                <ul>
                                    ${result.advice_steps
                                        .map(
                                            function (
                                                step
                                            ) {
                                                return `
                                                    <li>
                                                        ${escapeHtml(
                                                            step
                                                        )}
                                                    </li>
                                                `;
                                            }
                                        )
                                        .join("")}
                                </ul>
                            `;
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
                                    Model Answer Strategy
                                </h4>

                                <p>
                                    ${escapeHtml(
                                        result.sample_answer
                                    )}
                                </p>
                            `;
                    }

                    responseBody.innerHTML =
                        html ||
                        "<p>No response content returned.</p>";
                }

            } catch (error) {
                if (responseTitle) {
                    responseTitle.textContent =
                        "AI Assistant Error";
                }

                if (responseBody) {
                    responseBody.innerHTML =
                        `
                            <p style="color:var(--rose);">
                                ${escapeHtml(
                                    error.message ||
                                    "Unable to generate response."
                                )}
                            </p>
                        `;
                }
            }
        }

        if (
            submitButton &&
            promptInput
        ) {
            submitButton.addEventListener(
                "click",
                function () {
                    executePrompt(
                        promptInput.value.trim()
                    );
                }
            );

            promptInput.addEventListener(
                "keydown",
                function (event) {
                    if (
                        event.key ===
                        "Enter"
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
            function (button) {
                button.addEventListener(
                    "click",
                    function () {
                        const query =
                            button.getAttribute(
                                "data-query"
                            ) || "";

                        if (
                            promptInput
                        ) {
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

        /* ----------------------------------------------------
           ANSWER EVALUATOR
           ---------------------------------------------------- */

        const questionSelect =
            $("select-eval-question");

        const customQuestion =
            $("input-eval-custom-q");

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
            $("btn-submit-eval-answer");

        if (evaluateButton) {
            evaluateButton.addEventListener(
                "click",
                async function () {
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
                                ?.value.trim() ||
                            "";
                    }

                    const answer =
                        $("input-eval-user-answer")
                            ?.value.trim() ||
                        "";

                    if (!answer) {
                        showPopup(
                            "Answer Required",
                            "Please type your answer before submitting it for evaluation.",
                            "warning"
                        );

                        return;
                    }

                    const resultCard =
                        $("ai-evaluator-result-card");

                    if (resultCard) {
                        resultCard.style.display =
                            "block";
                    }

                    const scoreDisplay =
                        $("eval-overall-score-display");

                    if (scoreDisplay) {
                        scoreDisplay.textContent =
                            "Evaluating...";
                    }

                    const formData =
                        new FormData();

                    formData.append(
                        "action",
                        "evaluate_answer"
                    );

                    formData.append(
                        "question",
                        question
                    );

                    formData.append(
                        "user_answer",
                        answer
                    );

                    formData.append(
                        "target_role",
                        state.targetRole || ""
                    );

                    try {
                        const result =
                            await apiRequest(
                                "evaluate_answer",
                                formData
                            );

                        if (
                            !apiSuccess(
                                result
                            )
                        ) {
                            throw new Error(
                                result.message ||
                                "Evaluation failed."
                            );
                        }

                        if (scoreDisplay) {
                            scoreDisplay.textContent =
                                `Overall Score: ${
                                    result.total_score || 0
                                } / 100`;
                        }

                        const badge =
                            $("eval-rating-badge");

                        if (badge) {
                            badge.textContent =
                                result.rating ||
                                "Evaluated";

                            if (
                                result.color
                            ) {
                                badge.style.background =
                                    result.color;
                            }
                        }

                        const breakdown =
                            result.breakdown ||
                            {};

                        const mapping = {
                            "eval-score-tech":
                                breakdown.technical_accuracy,

                            "eval-score-kw":
                                breakdown.keywords_terminology,

                            "eval-score-struct":
                                breakdown.structure_clarity,

                            "eval-score-rel":
                                breakdown.real_world_relevance,

                            "eval-score-comp":
                                breakdown.completeness
                        };

                        Object.keys(
                            mapping
                        ).forEach(
                            function (id) {
                                const element =
                                    $(id);

                                if (element) {
                                    element.textContent =
                                        `${mapping[id] || 0} / 20`;
                                }
                            }
                        );

                        const strengths =
                            $("eval-strengths-list");

                        if (strengths) {
                            strengths.innerHTML =
                                (
                                    result.strengths ||
                                    []
                                )
                                    .map(
                                        function (
                                            item
                                        ) {
                                            return `
                                                <li>
                                                    ${escapeHtml(
                                                        item
                                                    )}
                                                </li>
                                            `;
                                        }
                                    )
                                    .join("");
                        }

                        const missing =
                            $("eval-missing-list");

                        if (missing) {
                            missing.innerHTML =
                                (
                                    result.missing_points ||
                                    []
                                )
                                    .map(
                                        function (
                                            item
                                        ) {
                                            return `
                                                <li>
                                                    ${escapeHtml(
                                                        item
                                                    )}
                                                </li>
                                            `;
                                        }
                                    )
                                    .join("");
                        }

                        const ideal =
                            $("eval-ideal-answer");

                        if (ideal) {
                            ideal.textContent =
                                result.ideal_answer ||
                                "";
                        }

                    } catch (error) {
                        if (scoreDisplay) {
                            scoreDisplay.textContent =
                                "Evaluation Failed";
                        }

                        showPopup(
                            "Evaluation Failed",
                            error.message ||
                            "Unable to evaluate the answer.",
                            "error"
                        );
                    }
                }
            );
        }
    }


    /* ========================================================
       REPORT
       ======================================================== */

    function updateReport() {
        const url =
            state.careerUrl;

        const elements =
            [
                $("report-career-url"),
                $("report-url")
            ].filter(Boolean);

        elements.forEach(
            function (element) {
                element.textContent =
                    url || "Not analyzed";
            }
        );

        const jobs =
            $("report-job-count");

        if (jobs) {
            jobs.textContent =
                state.careerJobs.length;
        }

        const skills =
            $("report-skill-count");

        if (skills) {
            skills.textContent =
                state.extractedSkills.length;
        }

        const ats =
            $("report-ats-score");

        if (ats) {
            ats.textContent =
                Math.round(
                    state.atsScore
                );
        }
    }


    /* ========================================================
       PDF REPORT
       ======================================================== */

    function initReportDownload() {
        const form =
            $("form-report-download");

        if (!form) {
            return;
        }

        form.addEventListener(
            "submit",
            function (event) {
                /*
                 * Allow normal POST submission if the backend
                 * expects a downloadable PDF response.
                 */
                const action =
                    form.getAttribute(
                        "action"
                    ) || "";

                if (
                    action.includes(
                        "download_pdf"
                    )
                ) {
                    return;
                }

                event.preventDefault();

                const formData =
                    new FormData(form);

                formData.set(
                    "action",
                    "download_pdf"
                );

                apiRequest(
                    "download_pdf",
                    formData
                ).catch(
                    function (error) {
                        showPopup(
                            "Report Generation Failed",
                            error.message ||
                            "Unable to generate report.",
                            "error"
                        );
                    }
                );
            }
        );
    }


    /* ========================================================
       GLOBAL DATA SYNCHRONIZATION
       ======================================================== */

    function updateGlobalData() {
        window.EXTRACTED_SKILLS =
            state.extractedSkills;

        window.REQUIRED_SKILLS =
            state.requiredSkills;

        window.ATS_SCORE =
            state.atsScore;

        window.CAREER_URL =
            state.careerUrl;

        window.CAREER_JOBS =
            state.careerJobs;

        /*
         * DO NOT create fake company/role defaults.
         *
         * These values come only from actual analyzed data.
         */
        window.TARGET_COMPANY =
            state.targetCompany || "";

        window.TARGET_ROLE =
            state.targetRole || "";
    }


    /* ========================================================
       INITIALIZE EXISTING APP DATA
       ======================================================== */

    function initializeState() {
        updateGlobalData();

        renderJobs();
        renderExtractedSkills();
        renderATS();
        renderSkillGap();
        updateRecommendation();
        updateStats();
        updateReport();

        const careerInput =
            $("input-scrape-url");

        if (
            careerInput &&
            state.careerUrl
        ) {
            careerInput.value =
                state.careerUrl;
        }

        const banner =
            $("banner-company-role");

        if (banner) {
            if (
                state.targetCompany ||
                state.targetRole
            ) {
                banner.textContent =
                    [
                        state.targetCompany,
                        state.targetRole
                    ]
                        .filter(Boolean)
                        .join(" · ");
            } else {
                banner.textContent =
                    "Dynamic Career Analysis";
            }
        }
    }


    /* ========================================================
       REMOVE OLD COMPANY / ROLE SELECTOR
       ======================================================== */

    function disableLegacyCompanySelector() {
        /*
         * The previous version contained:
         *
         * Google
         * Software Development Engineer
         * Zoho
         * Backend Engineer
         *
         * Those values must NOT be used.
         *
         * If old selector HTML is still present,
         * hide it rather than allowing it to overwrite
         * the dynamically scraped career information.
         */

        const oldSelector =
            $("box-benchmark-select");

        const oldMode =
            $("mode-benchmark");

        const oldCustom =
            $("box-custom-select");

        if (oldSelector) {
            oldSelector.style.display =
                "none";
        }

        if (oldCustom) {
            oldCustom.style.display =
                "none";
        }

        if (oldMode) {
            oldMode.checked =
                false;
        }

        /*
         * Remove old selector event handlers by disabling
         * the controls.
         */
        qsa(
            "#select-company, #select-role, #input-custom-company, #input-custom-role"
        ).forEach(
            function (element) {
                element.disabled =
                    true;
            }
        );
    }


    /* ========================================================
       FAVICON
       ======================================================== */

    function ensureFavicon() {
        const existing =
            document.querySelector(
                'link[rel="icon"]'
            );

        if (existing) {
            return;
        }

        const favicon =
            document.createElement(
                "link"
            );

        favicon.rel =
            "icon";

        favicon.href =
            "data:image/svg+xml," +
            encodeURIComponent(
                `
                    <svg xmlns="http://www.w3.org/2000/svg"
                         viewBox="0 0 100 100">
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="#06b6d4"/>
                        <text
                            x="50"
                            y="63"
                            text-anchor="middle"
                            font-size="42"
                            fill="white">
                            S
                        </text>
                    </svg>
                `
            );

        document.head.appendChild(
            favicon
        );
    }


    /* ========================================================
       START APPLICATION
       ======================================================== */

    try {
        ensurePopup();
        ensureFavicon();

        initTheme();
        initSidebar();
        initAuth();

        /*
         * Only initialize dashboard features when
         * the authenticated application exists.
         */
        if (state.loggedIn) {
            initNavigation();
            initCharts();
            initSkillEditor();
            initResumeUpload();
            initJobRanking();
            initWebScraper();
            initProfileForm();
            initAIInterviewAssistant();
            initReportDownload();

            disableLegacyCompanySelector();
            initializeState();

            /*
             * Load dynamic data only when available.
             */
            if (
                state.careerUrl &&
                state.careerJobs.length === 0
            ) {
                /*
                 * Do not automatically scrape again here.
                 * The user can explicitly analyze the URL.
                 */
            }

            loadDynamicRoadmap();
            loadDynamicInterview();
        }

    } catch (error) {
        console.error(
            "Application initialization error:",
            error
        );
    } finally {
        /*
         * NEVER allow the loading overlay to remain
         * permanently visible because of a JS exception.
         */
        hidePageLoader();
    }
});
