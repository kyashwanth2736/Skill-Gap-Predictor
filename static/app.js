/* ============================================================
   SKILL-GAP PREDICTOR
   MAIN APPLICATION JAVASCRIPT
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

        recommendedJob:
            window.APP_DATA?.recommendedJob || null,

        currentView: "dashboard",

        selectedResume: null,

        charts: {}
    };


    /* ========================================================
       BASIC HELPERS
       ======================================================== */

    function $(id) {
        return document.getElementById(id);
    }


    function qs(selector, parent = document) {
        return parent.querySelector(selector);
    }


    function qsa(selector, parent = document) {
        return Array.from(parent.querySelectorAll(selector));
    }


    function escapeHtml(value) {

        const div =
            document.createElement("div");

        div.textContent =
            value == null ? "" : String(value);

        return div.innerHTML;
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

        skills.forEach(function (skill) {

            if (skill == null) {
                return;
            }

            const value =
                String(skill).trim();

            if (!value) {
                return;
            }

            const normalized =
                normalizeSkill(value);

            if (!seen.has(normalized)) {

                seen.add(normalized);

                result.push(value);
            }
        });

        return result;
    }


    function showMessage(
        element,
        message,
        type = "info"
    ) {

        if (!element) {
            return;
        }

        element.textContent =
            message;

        element.className =
            "auth-message " + type;

        element.style.display =
            "block";
    }


    function hideMessage(element) {

        if (!element) {
            return;
        }

        element.textContent =
            "";

        element.style.display =
            "none";
    }


    function setLoading(
        button,
        loading,
        loadingText = "Loading..."
    ) {

        if (!button) {
            return;
        }

        if (loading) {

            if (!button.dataset.originalText) {

                button.dataset.originalText =
                    button.textContent.trim();
            }

            button.disabled =
                true;

            button.classList.add(
                "loading"
            );

            button.textContent =
                loadingText;

        } else {

            button.disabled =
                false;

            button.classList.remove(
                "loading"
            );

            if (button.dataset.originalText) {

                button.textContent =
                    button.dataset.originalText;
            }
        }
    }


    /* ========================================================
       CUSTOM POPUP
       ======================================================== */

    function ensurePopupStyles() {

        if ($("sgp-popup-styles")) {
            return;
        }

        const style =
            document.createElement("style");

        style.id =
            "sgp-popup-styles";

        style.textContent = `
            .sgp-popup-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,.45);
                backdrop-filter: blur(5px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                padding: 20px;
                animation: sgpFadeIn .2s ease;
            }

            .sgp-popup {
                width: min(430px, 100%);
                background: var(--card-bg, #ffffff);
                color: var(--text-main, #111827);
                border-radius: 20px;
                padding: 28px;
                box-shadow: 0 25px 70px rgba(0,0,0,.25);
                border: 1px solid rgba(148,163,184,.25);
                text-align: center;
                animation: sgpPopupIn .25s ease;
            }

            .sgp-popup-icon {
                width: 62px;
                height: 62px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 18px;
                font-size: 30px;
                font-weight: 800;
            }

            .sgp-popup.success .sgp-popup-icon {
                background: rgba(34,197,94,.14);
                color: #16a34a;
            }

            .sgp-popup.error .sgp-popup-icon {
                background: rgba(239,68,68,.14);
                color: #dc2626;
            }

            .sgp-popup.warning .sgp-popup-icon {
                background: rgba(245,158,11,.14);
                color: #d97706;
            }

            .sgp-popup.info .sgp-popup-icon {
                background: rgba(59,130,246,.14);
                color: #2563eb;
            }

            .sgp-popup h3 {
                margin: 0 0 9px;
                font-size: 21px;
            }

            .sgp-popup p {
                margin: 0;
                line-height: 1.6;
                opacity: .82;
            }

            .sgp-popup-button {
                width: 100%;
                margin-top: 22px;
                border: 0;
                border-radius: 11px;
                padding: 12px 18px;
                font-weight: 700;
                cursor: pointer;
                background: #2563eb;
                color: white;
            }

            .sgp-popup-button:hover {
                opacity: .92;
            }

            @keyframes sgpFadeIn {
                from {
                    opacity: 0;
                }

                to {
                    opacity: 1;
                }
            }

            @keyframes sgpPopupIn {
                from {
                    opacity: 0;
                    transform: translateY(12px) scale(.97);
                }

                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
        `;

        document.head.appendChild(style);
    }


    function showPopup(
        title,
        message,
        type = "info",
        buttonText = "OK",
        callback = null
    ) {

        ensurePopupStyles();

        const existing =
            $("sgp-popup-overlay");

        if (existing) {
            existing.remove();
        }

        const overlay =
            document.createElement("div");

        overlay.id =
            "sgp-popup-overlay";

        overlay.className =
            "sgp-popup-overlay";

        let icon = "i";

        if (type === "success") {
            icon = "✓";
        } else if (
            type === "error" ||
            type === "warning"
        ) {
            icon = "!";
        }

        overlay.innerHTML = `
            <div class="sgp-popup ${escapeHtml(type)}">

                <div class="sgp-popup-icon">
                    ${escapeHtml(icon)}
                </div>

                <h3>
                    ${escapeHtml(title)}
                </h3>

                <p>
                    ${escapeHtml(message)}
                </p>

                <button
                    type="button"
                    class="sgp-popup-button"
                    id="sgp-popup-ok"
                >
                    ${escapeHtml(buttonText)}
                </button>

            </div>
        `;

        document.body.appendChild(
            overlay
        );


        const closePopup =
            function () {

                overlay.remove();

                if (
                    typeof callback ===
                    "function"
                ) {
                    callback();
                }
            };


        const ok =
            $("sgp-popup-ok");

        if (ok) {

            ok.addEventListener(
                "click",
                closePopup
            );
        }


        overlay.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === overlay
                ) {
                    closePopup();
                }
            }
        );
    }


    window.alert =
        function (message) {

            showPopup(
                "Skill-Gap Predictor",
                String(message || ""),
                "info"
            );
        };


    /* ========================================================
       API
       ======================================================== */

    async function apiRequest(
        action,
        data = {},
        options = {}
    ) {

        const method =
            options.method || "POST";

        let url =
            "api.php?action=" +
            encodeURIComponent(action);

        const fetchOptions = {

            method: method,

            credentials:
                "same-origin",

            cache:
                "no-store",

            headers: {}
        };


        if (
            method.toUpperCase() ===
            "GET"
        ) {

            const params =
                new URLSearchParams(data);

            const query =
                params.toString();

            if (query) {
                url += "&" + query;
            }

        } else {

            if (
                data instanceof FormData
            ) {

                fetchOptions.body =
                    data;

            } else {

                fetchOptions.headers[
                    "Content-Type"
                ] =
                    "application/x-www-form-urlencoded;charset=UTF-8";

                fetchOptions.body =
                    new URLSearchParams(
                        data
                    ).toString();
            }
        }


        const response =
            await fetch(
                url,
                fetchOptions
            );


        const text =
            await response.text();


        let result;


        try {

            result =
                JSON.parse(text);

        } catch (error) {

            console.error(
                "Invalid API response:",
                text
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

        if (!result) {
            return false;
        }

        return (
            result.success === true ||
            result.status === "success" ||
            result.ok === true
        );
    }


    /* ========================================================
       AUTHENTICATED DASHBOARD REDIRECT
       ======================================================== */

    function redirectToDashboard() {

        /*
         * The PHP session is created by api.php.
         * Reloading index.php makes PHP read that session
         * and render the authenticated dashboard.
         */

        try {

            const currentUrl =
                new URL(
                    window.location.href
                );

            currentUrl.search = "";
            currentUrl.hash = "";

            window.location.replace(
                currentUrl.href
            );

        } catch (error) {

            window.location.reload();
        }
    }


    /* ========================================================
       LOADING SCREEN
       ======================================================== */

    function hideLoader() {

        const loader =
            $("page-loader");

        if (!loader) {
            return;
        }

        loader.classList.add(
            "hidden"
        );

        loader.style.opacity =
            "0";

        loader.style.visibility =
            "hidden";

        loader.style.pointerEvents =
            "none";


        window.setTimeout(
            function () {

                if (loader) {

                    loader.style.display =
                        "none";
                }

            },
            500
        );
    }


    function initializeLoader() {

        hideLoader();

        window.setTimeout(
            hideLoader,
            800
        );

        window.setTimeout(
            hideLoader,
            2500
        );
    }


    /* ========================================================
       AUTH TABS
       ======================================================== */

    function initAuthTabs() {

        const buttons =
            qsa("[data-auth-tab]");

        if (!buttons.length) {
            return;
        }


        buttons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const tab =
                            button.dataset.authTab;


                        buttons.forEach(
                            function (item) {

                                item.classList.remove(
                                    "active"
                                );
                            }
                        );


                        button.classList.add(
                            "active"
                        );


                        const loginPanel =
                            $("form-login-box");

                        const signupPanel =
                            $("form-signup-box");


                        if (
                            tab === "signup"
                        ) {

                            if (loginPanel) {

                                loginPanel.classList.remove(
                                    "active"
                                );
                            }

                            if (signupPanel) {

                                signupPanel.classList.add(
                                    "active"
                                );
                            }

                        } else {

                            if (signupPanel) {

                                signupPanel.classList.remove(
                                    "active"
                                );
                            }

                            if (loginPanel) {

                                loginPanel.classList.add(
                                    "active"
                                );
                            }
                        }
                    }
                );
            }
        );
    }


    function openLoginTab(
        email = ""
    ) {

        const loginButton =
            $("tab-btn-login");

        const signupButton =
            $("tab-btn-signup");

        const loginPanel =
            $("form-login-box");

        const signupPanel =
            $("form-signup-box");


        if (loginButton) {

            loginButton.classList.add(
                "active"
            );
        }


        if (signupButton) {

            signupButton.classList.remove(
                "active"
            );
        }


        if (loginPanel) {

            loginPanel.classList.add(
                "active"
            );
        }


        if (signupPanel) {

            signupPanel.classList.remove(
                "active"
            );
        }


        if (
            email &&
            $("login_email")
        ) {

            $("login_email").value =
                email;
        }


        if ($("login_password")) {

            setTimeout(
                function () {

                    $("login_password").focus();

                },
                100
            );
        }
    }


    /* ========================================================
       LOGIN
       ======================================================== */

    function initLogin() {

        const form =
            $("form-login");

        if (!form) {
            return;
        }


        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const email =
                    $("login_email")?.value.trim() ||
                    "";

                const password =
                    $("login_password")?.value ||
                    "";


                const errorBox =
                    $("login-error-msg");

                const successBox =
                    $("login-success-msg");


                hideMessage(
                    errorBox
                );

                hideMessage(
                    successBox
                );


                if (!email) {

                    showMessage(
                        errorBox,
                        "Please enter your email address.",
                        "error"
                    );

                    return;
                }


                if (!password) {

                    showMessage(
                        errorBox,
                        "Please enter your password.",
                        "error"
                    );

                    return;
                }


                const button =
                    $("btn-do-login");


                setLoading(
                    button,
                    true,
                    "Signing in..."
                );


                try {

                    const result =
                        await apiRequest(
                            "login",
                            {
                                email:
                                    email,

                                password:
                                    password
                            }
                        );


                    console.log(
                        "Login response:",
                        result
                    );


                    if (
                        !apiSuccess(result)
                    ) {

                        throw new Error(
                            result.message ||
                            result.error ||
                            "Login failed."
                        );
                    }


                    /*
                     * Update local state immediately.
                     */

                    state.loggedIn =
                        true;

                    state.user =
                        result.user ||
                        null;


                    /*
                     * Show success message briefly.
                     */

                    showMessage(
                        successBox,
                        "Login successful. Redirecting to dashboard...",
                        "success"
                    );


                    /*
                     * Important:
                     * The PHP session exists on the server now.
                     * Reload the page so index.php renders the
                     * authenticated dashboard instead of the auth screen.
                     */

                    window.setTimeout(
                        function () {

                            redirectToDashboard();

                        },
                        350
                    );


                } catch (error) {

                    console.error(
                        "Login error:",
                        error
                    );


                    showMessage(
                        errorBox,
                        error.message ||
                        "Unable to login.",
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


    /* ========================================================
       SIGNUP
       ======================================================== */

    function initSignup() {

        const form =
            $("form-signup");

        if (!form) {
            return;
        }


        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const name =
                    $("signup_name")?.value.trim() ||
                    "";

                const email =
                    $("signup_email")?.value.trim() ||
                    "";

                const password =
                    $("signup_pwd")?.value ||
                    "";

                const university =
                    $("signup_uni")?.value.trim() ||
                    "";

                const branch =
                    $("signup_branch")?.value.trim() ||
                    "";

                const major =
                    $("signup_major")?.value.trim() ||
                    "";

                const gradyear =
                    $("signup_gradyear")?.value.trim() ||
                    "";

                const linkedin =
                    $("signup_linkedin")?.value.trim() ||
                    "";

                const github =
                    $("signup_github")?.value.trim() ||
                    "";

                const terms =
                    $("signup-terms")?.checked ||
                    false;


                const errorBox =
                    $("signup-error-msg");

                const successBox =
                    $("signup-success-msg");


                hideMessage(
                    errorBox
                );

                hideMessage(
                    successBox
                );


                if (!name) {

                    showMessage(
                        errorBox,
                        "Please enter your full name.",
                        "error"
                    );

                    return;
                }


                if (!email) {

                    showMessage(
                        errorBox,
                        "Please enter your email address.",
                        "error"
                    );

                    return;
                }


                if (!password) {

                    showMessage(
                        errorBox,
                        "Please create a password.",
                        "error"
                    );

                    return;
                }


                if (password.length < 6) {

                    showMessage(
                        errorBox,
                        "Password must contain at least 6 characters.",
                        "error"
                    );

                    return;
                }


                if (!terms) {

                    showMessage(
                        errorBox,
                        "Please accept the terms and conditions.",
                        "error"
                    );

                    return;
                }


                const button =
                    $("btn-do-signup");


                setLoading(
                    button,
                    true,
                    "Creating Account..."
                );


                try {

                    const result =
                        await apiRequest(
                            "register",
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

                                major:
                                    major,

                                gradyear:
                                    gradyear,

                                linkedin:
                                    linkedin,

                                github:
                                    github
                            }
                        );


                    console.log(
                        "Registration response:",
                        result
                    );


                    const resultCode =
                        String(
                            result.error_code ||
                            result.code ||
                            result.status_code ||
                            ""
                        ).toUpperCase();


                    const message =
                        String(
                            result.message ||
                            result.error ||
                            ""
                        );


                    const duplicate =
                        resultCode ===
                            "ACCOUNT_EXISTS" ||

                        resultCode ===
                            "EMAIL_EXISTS" ||

                        resultCode ===
                            "DUPLICATE" ||

                        result.accountExists ===
                            true ||

                        /already|exist|duplicate|taken|registered/i
                            .test(message);


                    if (duplicate) {

                        showPopup(
                            "Account Already Exists",
                            "An account with this email address already exists. Please login using your existing account.",
                            "warning",
                            "Go to Login",
                            function () {

                                openLoginTab(
                                    email
                                );
                            }
                        );

                        return;
                    }


                    if (!apiSuccess(result)) {

                        throw new Error(
                            message ||
                            "Unable to create your account."
                        );
                    }


                    showMessage(
                        successBox,
                        "Account registered successfully.",
                        "success"
                    );


                    form.reset();


                    showPopup(
                        "Account Registered Successfully",
                        "Your account has been created successfully. Please login to continue.",
                        "success",
                        "Go to Login",
                        function () {

                            openLoginTab(
                                email
                            );
                        }
                    );


                } catch (error) {

                    console.error(
                        "Registration error:",
                        error
                    );


                    showMessage(
                        errorBox,
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


    /* ========================================================
       PASSWORD TOGGLE
       ======================================================== */

    function initPasswordToggles() {

        qsa(
            "[data-password-target]"
        ).forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const targetId =
                            button.dataset.passwordTarget;

                        const input =
                            $(targetId);


                        if (!input) {
                            return;
                        }


                        if (
                            input.type ===
                            "password"
                        ) {

                            input.type =
                                "text";

                            button.textContent =
                                "Hide";

                        } else {

                            input.type =
                                "password";

                            button.textContent =
                                "Show";
                        }
                    }
                );
            }
        );
    }


    /* ========================================================
       THEME
       ======================================================== */

    function applyTheme(theme) {

        const html =
            document.documentElement;

        const body =
            document.body;


        const dark =
            theme === "dark";


        html.classList.toggle(
            "dark",
            dark
        );

        body.classList.toggle(
            "dark",
            dark
        );

        /*
         * Your styles.css uses dark-mode.
         */

        body.classList.toggle(
            "dark-mode",
            dark
        );


        localStorage.setItem(
            "sgp-theme",
            dark
                ? "dark"
                : "light"
        );


        updateThemeButtons(
            dark
        );
    }


    function updateThemeButtons(
        isDark
    ) {

        const icon =
            isDark
                ? "☀"
                : "☾";

        const text =
            isDark
                ? "Light Mode"
                : "Dark Mode";


        const themeIcon =
            $("theme-icon");

        const themeText =
            $("theme-text");

        const topTheme =
            $("top-theme-toggle");


        if (themeIcon) {

            themeIcon.textContent =
                icon;
        }


        if (themeText) {

            themeText.textContent =
                text;
        }


        if (topTheme) {

            topTheme.textContent =
                icon;
        }
    }


    function initTheme() {

        const savedTheme =
            localStorage.getItem(
                "sgp-theme"
            );


        if (
            savedTheme ===
            "dark"
        ) {

            applyTheme(
                "dark"
            );

        } else if (
            savedTheme ===
            "light"
        ) {

            applyTheme(
                "light"
            );

        } else {

            const prefersDark =
                window.matchMedia &&
                window.matchMedia(
                    "(prefers-color-scheme: dark)"
                ).matches;


            applyTheme(
                prefersDark
                    ? "dark"
                    : "light"
            );
        }


        const sidebarButton =
            $("sidebar-theme-toggle");

        const topButton =
            $("top-theme-toggle");


        function toggle() {

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


        if (sidebarButton) {

            sidebarButton.addEventListener(
                "click",
                toggle
            );
        }


        if (topButton) {

            topButton.addEventListener(
                "click",
                toggle
            );
        }
    }


    /* ========================================================
       SIDEBAR
       ======================================================== */

    function initSidebar() {

        const sidebar =
            $("app-sidebar");

        const overlay =
            $("sidebar-overlay");

        const openButton =
            $("mobile-menu-toggle");

        const closeButton =
            $("sidebar-close");


        function openSidebar() {

            if (!sidebar) {
                return;
            }

            sidebar.classList.add(
                "open"
            );

            if (overlay) {

                overlay.classList.add(
                    "active"
                );
            }
        }


        function closeSidebar() {

            if (!sidebar) {
                return;
            }

            sidebar.classList.remove(
                "open"
            );

            if (overlay) {

                overlay.classList.remove(
                    "active"
                );
            }
        }


        if (openButton) {

            openButton.addEventListener(
                "click",
                openSidebar
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


        qsa(
            ".nav-item"
        ).forEach(
            function (item) {

                item.addEventListener(
                    "click",
                    function () {

                        closeSidebar();
                    }
                );
            }
        );
    }


    /* ========================================================
       NAVIGATION
       ======================================================== */

    function navigateToView(
        view
    ) {

        const navItems =
            qsa(".nav-item");

        const panels =
            qsa(".view-panel");


        navItems.forEach(
            function (nav) {

                nav.classList.toggle(
                    "active",
                    nav.dataset.view === view
                );
            }
        );


        panels.forEach(
            function (panel) {

                panel.classList.toggle(
                    "active",
                    panel.id ===
                    "view-" + view
                );
            }
        );


        state.currentView =
            view;


        updatePageHeading(
            view
        );


        if (
            view === "roadmap"
        ) {

            loadRoadmap();
        }


        if (
            view === "interview"
        ) {

            prepareInterview();
        }
    }


    function initNavigation() {

        qsa(
            ".nav-item"
        ).forEach(
            function (item) {

                item.addEventListener(
                    "click",
                    function () {

                        const view =
                            item.dataset.view;

                        if (!view) {
                            return;
                        }

                        navigateToView(
                            view
                        );
                    }
                );
            }
        );
    }


    function updatePageHeading(
        view
    ) {

        const title =
            $("page-title");

        const subtitle =
            $("page-subtitle");


        const data = {

            dashboard: [
                "Dashboard",
                "Analyze your skills against live career opportunities."
            ],

            resume: [
                "ATS & Resume Parser",
                "Extract skills and evaluate your resume."
            ],

            skillgap: [
                "Skill Gap",
                "Identify the skills required for your career target."
            ],

            jobs: [
                "Career Jobs",
                "Explore and rank jobs from your selected career source."
            ],

            roadmap: [
                "Learning Roadmap",
                "Build a learning path around your missing skills."
            ],

            interview: [
                "Interview",
                "Practice career-specific interview questions."
            ],

            report: [
                "Report",
                "Generate your current career analysis report."
            ],

            profile: [
                "Profile",
                "Manage your personal and academic information."
            ]
        };


        if (data[view]) {

            if (title) {

                title.textContent =
                    data[view][0];
            }


            if (subtitle) {

                subtitle.textContent =
                    data[view][1];
            }
        }
    }


    /* ========================================================
       CAREER URL SCRAPING
       ======================================================== */

    function initCareerScraper() {

        const button =
            $("scrape-career-url");

        const input =
            $("career-url");


        if (!button || !input) {
            return;
        }


        button.addEventListener(
            "click",
            function () {

                scrapeCareerUrl(
                    input.value.trim()
                );
            }
        );


        input.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    scrapeCareerUrl(
                        input.value.trim()
                    );
                }
            }
        );
    }


    async function scrapeCareerUrl(
        url
    ) {

        if (!url) {

            showPopup(
                "Career URL Required",
                "Please enter a valid career or jobs URL.",
                "warning"
            );

            return;
        }


        try {

            const parsed =
                new URL(url);


            if (
                parsed.protocol !==
                    "http:" &&
                parsed.protocol !==
                    "https:"
            ) {

                throw new Error();
            }

        } catch (error) {

            showPopup(
                "Invalid Career URL",
                "Please enter a valid HTTP or HTTPS career URL.",
                "error"
            );

            return;
        }


        const button =
            $("scrape-career-url");

        const status =
            $("career-url-status");


        setLoading(
            button,
            true,
            "Fetching jobs..."
        );


        if (status) {

            status.textContent =
                "Connecting to the career source...";

            status.className =
                "inline-status loading";
        }


        try {

            const result =
                await apiRequest(
                    "scrape_url",
                    {
                        url:
                            url,

                        career_url:
                            url
                    }
                );


            if (
                !apiSuccess(result)
            ) {

                throw new Error(
                    result.message ||
                    result.error ||
                    "Unable to fetch jobs."
                );
            }


            const jobs =
                result.jobs ||
                result.career_jobs ||
                result.data?.jobs ||
                result.data?.career_jobs ||
                [];


            state.careerUrl =
                url;


            state.careerJobs =
                normalizeJobs(
                    jobs
                );


            if (
                Array.isArray(
                    result.required_skills
                )
            ) {

                state.requiredSkills =
                    normalizeSkills(
                        result.required_skills
                    );
            }


            if (
                result.recommended_job
            ) {

                state.recommendedJob =
                    result.recommended_job;
            }


            updateCareerInputs(
                url
            );

            renderJobs();

            updateRecommendation();

            updateStats();

            renderSkillGap();

            renderDashboardCharts();


            if (status) {

                status.textContent =
                    state.careerJobs.length +
                    " job(s) found from the career source.";

                status.className =
                    "inline-status success";
            }


            showPopup(
                "Jobs Extracted",
                state.careerJobs.length +
                " job(s) extracted successfully.",
                "success"
            );


        } catch (error) {

            console.error(
                "Career scraping error:",
                error
            );


            if (status) {

                status.textContent =
                    error.message ||
                    "Unable to fetch jobs.";

                status.className =
                    "inline-status error";
            }


            showPopup(
                "Unable to Fetch Jobs",
                error.message ||
                "The career source could not be processed.",
                "error"
            );


        } finally {

            setLoading(
                button,
                false
            );
        }
    }


    function updateCareerInputs(
        url
    ) {

        const careerUrl =
            $("career-url");

        const jobsCareerUrl =
            $("jobs-career-url");

        const reportCareerUrl =
            $("report-career-url");


        if (careerUrl) {

            careerUrl.value =
                url || "";
        }


        if (jobsCareerUrl) {

            jobsCareerUrl.value =
                url || "";
        }


        if (reportCareerUrl) {

            reportCareerUrl.value =
                url || "";
        }
    }


    /* ========================================================
       JOB NORMALIZATION
       ======================================================== */

    function normalizeJobs(
        jobs
    ) {

        if (!Array.isArray(jobs)) {
            return [];
        }


        return jobs
            .map(
                normalizeJob
            )
            .filter(
                function (job) {

                    return (
                        job.title ||
                        job.company ||
                        job.description
                    );
                }
            );
    }


    function normalizeJob(
        job
    ) {

        job =
            job &&
            typeof job ===
                "object"
                ? job
                : {};


        const skills =
            job.required_skills ||
            job.skills ||
            job.requirements ||
            job.technical_skills ||
            [];


        let normalizedSkills =
            [];


        if (
            Array.isArray(skills)
        ) {

            normalizedSkills =
                normalizeSkills(
                    skills
                );

        } else if (
            typeof skills ===
            "string"
        ) {

            normalizedSkills =
                normalizeSkills(
                    skills.split(
                        /[,;|]/g
                    )
                );
        }


        return {

            id:
                job.id ||
                job.job_id ||
                "",

            title:
                job.title ||
                job.role ||
                job.job_title ||
                job.position ||
                job.name ||
                "",

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
                "#",

            description:
                job.description ||
                job.summary ||
                job.text ||
                "",

            skills:
                normalizedSkills,

            match:
                Number(
                    job.match ||
                    job.match_score ||
                    0
                )
        };
    }


    /* ========================================================
       JOB MATCHING
       ======================================================== */

    function calculateJobMatch(
        job
    ) {

        const userSkills =
            normalizeSkills(
                state.extractedSkills
            );


        const jobSkills =
            normalizeSkills(
                job.skills
            );


        if (!jobSkills.length) {

            const text =
                normalizeSkill(
                    job.description
                );


            if (
                !text ||
                !userSkills.length
            ) {

                return 0;
            }


            let count = 0;


            userSkills.forEach(
                function (skill) {

                    if (
                        text.includes(
                            normalizeSkill(
                                skill
                            )
                        )
                    ) {

                        count++;
                    }
                }
            );


            return Math.round(
                (
                    count /
                    userSkills.length
                ) * 100
            );
        }


        if (!userSkills.length) {
            return 0;
        }


        let matched = 0;


        jobSkills.forEach(
            function (required) {

                const requiredNorm =
                    normalizeSkill(
                        required
                    );


                const found =
                    userSkills.some(
                        function (userSkill) {

                            const userNorm =
                                normalizeSkill(
                                    userSkill
                                );


                            return (
                                userNorm ===
                                    requiredNorm ||

                                userNorm.includes(
                                    requiredNorm
                                ) ||

                                requiredNorm.includes(
                                    userNorm
                                )
                            );
                        }
                    );


                if (found) {
                    matched++;
                }
            }
        );


        return Math.round(
            (
                matched /
                jobSkills.length
            ) * 100
        );
    }


    /* ========================================================
       RENDER JOBS
       ======================================================== */

    function renderJobs() {

        const container =
            $("job-results");


        if (!container) {
            return;
        }


        if (
            !state.careerJobs.length
        ) {

            container.innerHTML = `
                <div class="empty-state-card">
                    <h3>No jobs loaded</h3>
                    <p>
                        Enter a career URL above and fetch live jobs
                        to populate this table.
                    </p>
                </div>
            `;

            updateStats();

            return;
        }


        const ranked =
            state.careerJobs
                .map(
                    function (job) {

                        return {
                            ...job,

                            match:
                                calculateJobMatch(
                                    job
                                )
                        };
                    }
                )
                .sort(
                    function (a, b) {

                        return (
                            b.match -
                            a.match
                        );
                    }
                );


        state.careerJobs =
            ranked;


        const rows =
            ranked.map(
                function (job) {

                    const title =
                        job.title ||
                        "Job Opportunity";

                    const company =
                        job.company ||
                        "—";

                    const location =
                        Array.isArray(
                            job.location
                        )
                            ? job.location.join(
                                ", "
                            )
                            : job.location ||
                              "—";


                    const url =
                        job.url &&
                        job.url !== "#"
                            ? job.url
                            : "";


                    return `
                        <tr>

                            <td>
                                ${escapeHtml(title)}
                            </td>

                            <td>
                                ${escapeHtml(company)}
                            </td>

                            <td>
                                ${escapeHtml(location)}
                            </td>

                            <td>
                                <span class="match-badge">
                                    ${job.match}%
                                </span>
                            </td>

                            <td>

                                ${
                                    url
                                        ? `
                                            <a
                                                href="${escapeHtml(url)}"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="job-link"
                                            >
                                                View Job
                                            </a>
                                        `
                                        : "—"
                                }

                            </td>

                        </tr>
                    `;
                }
            ).join("");


        container.innerHTML = `
            <div class="job-table-wrapper">

                <table class="job-table">

                    <thead>

                        <tr>
                            <th>Job Role</th>
                            <th>Company</th>
                            <th>Location</th>
                            <th>Match</th>
                            <th>Action</th>
                        </tr>

                    </thead>

                    <tbody>
                        ${rows}
                    </tbody>

                </table>

            </div>
        `;


        updateRecommendation();

        updateStats();
    }


    /* ========================================================
       RECOMMENDATION
       ======================================================== */

    function updateRecommendation() {

        const title =
            $("recommended-job");

        const description =
            $("recommendation-description");


        if (
            !state.careerJobs.length
        ) {

            if (title) {

                title.textContent =
                    "No job recommendation yet";
            }


            if (description) {

                description.textContent =
                    "Fetch jobs from a career URL and upload your resume to generate a dynamic recommendation.";
            }


            const metric =
                $("metric-match");

            if (metric) {
                metric.textContent =
                    "0%";
            }

            return;
        }


        const sorted =
            [...state.careerJobs]
                .sort(
                    function (a, b) {

                        return (
                            Number(b.match || 0) -
                            Number(a.match || 0)
                        );
                    }
                );


        const best =
            sorted[0];


        if (!best) {
            return;
        }


        state.recommendedJob =
            best;


        if (title) {

            title.textContent =
                best.title ||
                "Recommended Career Opportunity";
        }


        if (description) {

            const company =
                best.company
                    ? " at " +
                      best.company
                    : "";


            description.textContent =
                "Best current skill match: " +
                Number(
                    best.match || 0
                ) +
                "%" +
                company +
                ".";
        }


        const metric =
            $("metric-match");


        if (metric) {

            metric.textContent =
                Number(
                    best.match || 0
                ) + "%";
        }
    }


    /* ========================================================
       DASHBOARD STATISTICS
       ======================================================== */

    function updateStats() {

        let bestMatch = 0;


        state.careerJobs.forEach(
            function (job) {

                const match =
                    Number(
                        job.match ||
                        calculateJobMatch(
                            job
                        ) ||
                        0
                    );


                if (
                    match >
                    bestMatch
                ) {

                    bestMatch =
                        match;
                }
            }
        );


        const ats =
            Math.round(
                state.atsScore || 0
            );


        const jobCount =
            state.careerJobs.length;


        const skillCount =
            state.extractedSkills.length;


        const values = {

            "stat-skills":
                skillCount,

            "stat-ats":
                ats + "%",

            "stat-jobs":
                jobCount,

            "stat-match":
                bestMatch + "%",


            "metric-skills":
                skillCount,

            "metric-ats":
                ats + "%",

            "metric-jobs":
                jobCount,

            "metric-match":
                bestMatch + "%"
        };


        Object.keys(values)
            .forEach(
                function (id) {

                    const element =
                        $(id);


                    if (!element) {
                        return;
                    }


                    element.textContent =
                        values[id];
                }
            );
    }


    /* ========================================================
       RESUME UPLOAD
       ======================================================== */

    function initResumeUpload() {

        const input =
            $("resume-file");

        const dropZone =
            $("resume-drop-zone");

        const selectButton =
            $("resume-select-button");

        const form =
            $("form-resume-upload");


        if (!input) {
            return;
        }


        if (selectButton) {

            selectButton.addEventListener(
                "click",
                function () {

                    input.click();
                }
            );
        }


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

                        try {

                            input.files =
                                files;

                        } catch (error) {
                            /*
                             * Some browsers do not allow
                             * assigning files directly.
                             */
                        }


                        state.selectedResume =
                            files[0];


                        updateResumeFileName(
                            files[0].name
                        );
                    }
                }
            );
        }


        if (form) {

            form.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    uploadResume();
                }
            );
        }
    }


    function updateResumeFileName(
        name
    ) {

        const element =
            $("resume-file-name");


        if (element) {

            element.textContent =
                name || "";
        }
    }


    async function uploadResume() {

        const input =
            $("resume-file");


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


        const button =
            $("evaluate-resume");


        const formData =
            new FormData();


        formData.append(
            "resume",
            input.files[0]
        );


        if (state.careerUrl) {

            formData.append(
                "career_url",
                state.careerUrl
            );
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


            if (
                !apiSuccess(result)
            ) {

                throw new Error(
                    result.message ||
                    result.error ||
                    "Resume analysis failed."
                );
            }


            state.extractedSkills =
                normalizeSkills(
                    result.extracted_skills ||
                    result.skills ||
                    result.data?.extracted_skills ||
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
                    result.ats_score ||
                    result.data?.ats_score ||
                    0
                );


            if (result.resume) {

                updateResumeContact(
                    result.resume
                );
            }


            renderATS();

            renderExtractedSkills();

            renderSkillGap();

            renderJobs();

            updateRecommendation();

            updateStats();

            renderDashboardCharts();


            showPopup(
                "Resume Analyzed",
                "Your resume has been processed successfully.",
                "success"
            );


        } catch (error) {

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


    function updateResumeContact(
        data
    ) {

        if (
            !data ||
            typeof data !== "object"
        ) {

            return;
        }


        const fields = {

            "resume-name":
                data.name ||
                data.full_name,

            "resume-email":
                data.email,

            "resume-phone":
                data.phone,

            "resume-linkedin":
                data.linkedin,

            "resume-github":
                data.github
        };


        Object.keys(fields)
            .forEach(
                function (id) {

                    const element =
                        $(id);


                    if (
                        element &&
                        fields[id] != null
                    ) {

                        element.textContent =
                            fields[id];
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


        const scoreElement =
            $("ats-score");

        const metric =
            $("metric-ats");

        const feedback =
            $("ats-feedback");


        if (scoreElement) {

            scoreElement.textContent =
                Math.round(score) + "%";
        }


        if (metric) {

            metric.textContent =
                Math.round(score) + "%";
        }


        if (feedback) {

            if (score >= 80) {

                feedback.textContent =
                    "Your resume currently has strong compatibility with the analyzed requirements.";

            } else if (score >= 60) {

                feedback.textContent =
                    "Your resume has moderate compatibility. Review the missing skills identified below.";

            } else if (score > 0) {

                feedback.textContent =
                    "Several improvements may be needed. Review the extracted skills and skill-gap analysis.";

            } else {

                feedback.textContent =
                    "Upload your resume to receive ATS feedback.";
            }
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

            container.innerHTML = `
                <span class="empty-state">
                    No skills extracted yet.
                </span>
            `;

            return;
        }


        container.innerHTML =
            state.extractedSkills
                .map(
                    function (skill) {

                        return `
                            <span class="skill-tag">
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

    function renderSkillGap() {

        const userContainer =
            $("skillgap-user-skills");

        const requiredContainer =
            $("skillgap-required-skills");

        const missingContainer =
            $("missing-skills-list");


        if (userContainer) {

            if (
                state.extractedSkills.length
            ) {

                userContainer.innerHTML =
                    state.extractedSkills
                        .map(
                            function (skill) {

                                return `
                                    <span class="skill-tag">
                                        ${escapeHtml(skill)}
                                    </span>
                                `;
                            }
                        )
                        .join("");

            } else {

                userContainer.innerHTML = `
                    <span class="empty-state">
                        Upload a resume to extract your skills.
                    </span>
                `;
            }
        }


        if (requiredContainer) {

            if (
                state.requiredSkills.length
            ) {

                requiredContainer.innerHTML =
                    state.requiredSkills
                        .map(
                            function (skill) {

                                return `
                                    <span class="skill-tag required">
                                        ${escapeHtml(skill)}
                                    </span>
                                `;
                            }
                        )
                        .join("");

            } else {

                requiredContainer.innerHTML = `
                    <span class="empty-state">
                        Fetch a career URL to identify required skills.
                    </span>
                `;
            }
        }


        const userNormalized =
            new Set(
                state.extractedSkills.map(
                    normalizeSkill
                )
            );


        const missing =
            state.requiredSkills.filter(
                function (skill) {

                    const normalized =
                        normalizeSkill(
                            skill
                        );


                    return !Array.from(
                        userNormalized
                    ).some(
                        function (userSkill) {

                            return (
                                userSkill ===
                                    normalized ||

                                userSkill.includes(
                                    normalized
                                ) ||

                                normalized.includes(
                                    userSkill
                                )
                            );
                        }
                    );
                }
            );


        if (missingContainer) {

            if (missing.length) {

                missingContainer.innerHTML =
                    missing
                        .map(
                            function (skill) {

                                return `
                                    <span class="skill-tag missing">
                                        ${escapeHtml(skill)}
                                    </span>
                                `;
                            }
                        )
                        .join("");

            } else {

                missingContainer.innerHTML = `
                    <span class="empty-state">
                        No missing skills detected.
                    </span>
                `;
            }
        }
    }


    /* ========================================================
       METRICS
       ======================================================== */

    async function loadMetrics() {

        if (!state.loggedIn) {
            return;
        }


        try {

            const result =
                await apiRequest(
                    "get_metrics",
                    {
                        target_company:
                            state.targetCompany,

                        target_role:
                            state.targetRole,

                        required_skills:
                            JSON.stringify(
                                state.requiredSkills
                            )
                    }
                );


            if (
                !apiSuccess(result)
            ) {

                updateStats();

                return;
            }


            if (
                result.ats_score != null
            ) {

                state.atsScore =
                    Number(
                        result.ats_score
                    );
            }


            if (
                Array.isArray(
                    result.extracted_skills
                )
            ) {

                state.extractedSkills =
                    normalizeSkills(
                        result.extracted_skills
                    );
            }


            if (
                Array.isArray(
                    result.required_skills
                )
            ) {

                state.requiredSkills =
                    normalizeSkills(
                        result.required_skills
                    );
            }


            renderATS();

            renderExtractedSkills();

            renderSkillGap();

            updateStats();

            renderDashboardCharts();


        } catch (error) {

            console.warn(
                "Metrics unavailable:",
                error.message
            );


            updateStats();
        }
    }


    /* ========================================================
       DASHBOARD CHARTS
       ======================================================== */

    function initCharts() {

        if (
            typeof Chart ===
            "undefined"
        ) {

            return;
        }


        const skillsCanvas =
            $("skills-chart");

        const readinessCanvas =
            $("readiness-chart");


        if (skillsCanvas) {

            state.charts.skills =
                new Chart(
                    skillsCanvas,
                    {
                        type:
                            "doughnut",

                        data: {

                            labels: [
                                "Your Skills",
                                "Skill Gap"
                            ],

                            datasets: [
                                {
                                    data: [
                                        state.extractedSkills.length,

                                        Math.max(
                                            state.requiredSkills.length -
                                            state.extractedSkills.length,
                                            0
                                        )
                                    ]
                                }
                            ]
                        },

                        options: {

                            responsive:
                                true,

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


        if (readinessCanvas) {

            state.charts.readiness =
                new Chart(
                    readinessCanvas,
                    {
                        type:
                            "doughnut",

                        data: {

                            labels: [
                                "ATS",
                                "Remaining"
                            ],

                            datasets: [
                                {
                                    data: [
                                        Math.round(
                                            state.atsScore
                                        ),

                                        Math.max(
                                            100 -
                                            Math.round(
                                                state.atsScore
                                            ),
                                            0
                                        )
                                    ]
                                }
                            ]
                        },

                        options: {

                            responsive:
                                true,

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
    }


    function renderDashboardCharts() {

        if (
            state.charts.skills
        ) {

            state.charts.skills.data
                .datasets[0]
                .data = [

                    state.extractedSkills.length,

                    Math.max(
                        state.requiredSkills.length -
                        state.extractedSkills.length,
                        0
                    )
                ];


            state.charts.skills.update();
        }


        if (
            state.charts.readiness
        ) {

            const score =
                Math.round(
                    state.atsScore || 0
                );


            state.charts.readiness.data
                .datasets[0]
                .data = [

                    score,

                    Math.max(
                        100 - score,
                        0
                    )
                ];


            state.charts.readiness.update();
        }
    }


    /* ========================================================
       JOB PAGE RANK BUTTON
       ======================================================== */

    function initJobRanking() {

        const button =
            $("rank-career-jobs");

        const input =
            $("jobs-career-url");


        if (!button || !input) {
            return;
        }


        button.addEventListener(
            "click",
            function () {

                const url =
                    input.value.trim();


                if (!url) {

                    showPopup(
                        "Career URL Required",
                        "Please enter a career URL.",
                        "warning"
                    );

                    return;
                }


                scrapeCareerUrl(
                    url
                );
            }
        );
    }


    /* ========================================================
       ROADMAP
       ======================================================== */

    async function loadRoadmap() {

        const container =
            $("container-dynamic-roadmap");

        const resources =
            $("container-dynamic-resources");


        if (!container) {
            return;
        }


        if (
            !state.extractedSkills.length &&
            !state.requiredSkills.length
        ) {

            container.innerHTML = `
                <div class="empty-state-card">
                    <h3>Roadmap not available yet</h3>
                    <p>
                        Upload your resume and fetch a career URL
                        before generating your roadmap.
                    </p>
                </div>
            `;


            if (resources) {
                resources.innerHTML =
                    "";
            }


            return;
        }


        container.innerHTML = `
            <div class="loading-state">
                Generating your learning roadmap...
            </div>
        `;


        try {

            /*
             * Correct API action:
             * api.php uses get_roadmap
             */

            const result =
                await apiRequest(
                    "get_roadmap",
                    {
                        required_skills:
                            JSON.stringify(
                                state.requiredSkills
                            ),

                        extracted_skills:
                            JSON.stringify(
                                state.extractedSkills
                            ),

                        target_role:
                            state.targetRole ||
                            ""
                    }
                );


            if (
                !apiSuccess(result)
            ) {

                throw new Error(
                    result.message ||
                    "Unable to generate roadmap."
                );
            }


            const roadmap =
                result.roadmap ||
                result.data?.roadmap ||
                [];


            const resourceList =
                result.resources ||
                result.data?.resources ||
                [];


            renderRoadmap(
                roadmap
            );

            renderResources(
                resourceList
            );


        } catch (error) {

            container.innerHTML = `
                <div class="empty-state-card">
                    <h3>Roadmap unavailable</h3>
                    <p>
                        ${escapeHtml(
                            error.message ||
                            "Unable to generate roadmap."
                        )}
                    </p>
                </div>
            `;
        }
    }


    function renderRoadmap(
        roadmap
    ) {

        const container =
            $("container-dynamic-roadmap");


        if (!container) {
            return;
        }


        if (
            !Array.isArray(
                roadmap
            )
        ) {

            container.innerHTML = `
                <div class="empty-state-card">
                    <h3>Roadmap unavailable</h3>
                    <p>
                        No roadmap data was returned.
                    </p>
                </div>
            `;

            return;
        }


        if (!roadmap.length) {

            container.innerHTML = `
                <div class="empty-state-card">
                    <h3>No additional roadmap steps</h3>
                    <p>
                        No missing skills were identified.
                    </p>
                </div>
            `;

            return;
        }


        container.innerHTML =
            roadmap.map(
                function (item, index) {

                    if (
                        typeof item ===
                        "string"
                    ) {

                        return `
                            <div class="roadmap-step">

                                <div class="roadmap-number">
                                    ${index + 1}
                                </div>

                                <div>
                                    ${escapeHtml(item)}
                                </div>

                            </div>
                        `;
                    }


                    const title =
                        item.title ||
                        item.skill ||
                        item.name ||
                        "Learning Step";


                    const description =
                        item.description ||
                        item.details ||
                        "";


                    return `
                        <div class="roadmap-step">

                            <div class="roadmap-number">
                                ${index + 1}
                            </div>

                            <div>

                                <h3>
                                    ${escapeHtml(title)}
                                </h3>

                                <p>
                                    ${escapeHtml(description)}
                                </p>

                            </div>

                        </div>
                    `;
                }
            ).join("");
    }


    function renderResources(
        resources
    ) {

        const container =
            $("container-dynamic-resources");


        if (!container) {
            return;
        }


        if (
            !Array.isArray(resources) ||
            !resources.length
        ) {

            container.innerHTML =
                "";

            return;
        }


        container.innerHTML = `
            <div class="content-card">

                <div class="card-header">
                    <h3>Learning Resources</h3>
                </div>

                <div class="resource-list">

                    ${
                        resources.map(
                            function (resource) {

                                if (
                                    typeof resource ===
                                    "string"
                                ) {

                                    return `
                                        <div class="resource-item">
                                            ${escapeHtml(resource)}
                                        </div>
                                    `;
                                }


                                const title =
                                    resource.title ||
                                    resource.name ||
                                    "Resource";


                                const url =
                                    resource.url ||
                                    resource.link ||
                                    "";


                                if (url) {

                                    return `
                                        <a
                                            href="${escapeHtml(url)}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="resource-item"
                                        >
                                            ${escapeHtml(title)}
                                        </a>
                                    `;
                                }


                                return `
                                    <div class="resource-item">
                                        ${escapeHtml(title)}
                                    </div>
                                `;
                            }
                        ).join("")
                    }

                </div>

            </div>
        `;
    }


    /* ========================================================
       INTERVIEW
       ======================================================== */

    function prepareInterview() {

        const question =
            $("interview-question");


        if (
            question &&
            !question.dataset.initialized
        ) {

            question.dataset.initialized =
                "true";

            question.textContent =
                "Generate an interview question to begin.";
        }
    }


    function initInterview() {

        const generate =
            $("generate-interview-question");

        const submit =
            $("submit-interview-answer");


        if (generate) {

            generate.addEventListener(
                "click",
                generateInterviewQuestion
            );
        }


        if (submit) {

            submit.addEventListener(
                "click",
                submitInterviewAnswer
            );
        }
    }


    async function generateInterviewQuestion() {

        const button =
            $("generate-interview-question");

        const question =
            $("interview-question");


        setLoading(
            button,
            true,
            "Generating..."
        );


        try {

            /*
             * Correct API action:
             * api.php uses get_interview
             */

            const result =
                await apiRequest(
                    "get_interview",
                    {
                        target_role:
                            state.targetRole ||
                            "",

                        extracted_skills:
                            JSON.stringify(
                                state.extractedSkills
                            ),

                        required_skills:
                            JSON.stringify(
                                state.requiredSkills
                            )
                    }
                );


            if (
                !apiSuccess(result)
            ) {

                throw new Error(
                    result.message ||
                    "Unable to generate question."
                );
            }


            const generated =
                result.question ||
                result.interview_question ||
                result.data?.question ||
                "Tell me about your most relevant technical project.";


            if (question) {

                question.textContent =
                    generated;
            }


            const answer =
                $("interview-answer");


            if (answer) {

                answer.value =
                    "";
            }


            const feedback =
                $("interview-feedback");


            if (feedback) {

                feedback.innerHTML =
                    "";
            }


        } catch (error) {

            showPopup(
                "Interview Question",
                error.message ||
                "Unable to generate question.",
                "error"
            );


        } finally {

            setLoading(
                button,
                false
            );
        }
    }


    async function submitInterviewAnswer() {

        const answer =
            $("interview-answer");

        const question =
            $("interview-question");

        const feedback =
            $("interview-feedback");

        const button =
            $("submit-interview-answer");


        const answerText =
            answer?.value.trim() ||
            "";

        const questionText =
            question?.textContent.trim() ||
            "";


        if (!answerText) {

            showPopup(
                "Answer Required",
                "Please write your answer before submitting.",
                "warning"
            );

            return;
        }


        setLoading(
            button,
            true,
            "Evaluating..."
        );


        try {

            /*
             * Correct API action:
             * api.php uses evaluate_answer
             */

            const result =
                await apiRequest(
                    "evaluate_answer",
                    {
                        question:
                            questionText,

                        answer:
                            answerText,

                        target_role:
                            state.targetRole ||
                            ""
                    }
                );


            if (
                !apiSuccess(result)
            ) {

                throw new Error(
                    result.message ||
                    "Unable to evaluate answer."
                );
            }


            const evaluation =
                result.feedback ||
                result.evaluation ||
                result.data?.feedback ||
                "Answer evaluated successfully.";


            if (feedback) {

                feedback.innerHTML = `
                    <strong>Feedback</strong>
                    <p>
                        ${escapeHtml(
                            evaluation
                        )}
                    </p>
                `;
            }


        } catch (error) {

            showPopup(
                "Interview Evaluation",
                error.message ||
                "Unable to evaluate answer.",
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
       AI ASSISTANT
       ======================================================== */

    function initAIAssistant() {

        const button =
            $("btn-submit-ai-prompt");


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            submitAIPrompt
        );
    }


    async function submitAIPrompt() {

        const input =
            $("input-ai-prompt");

        const responseCard =
            $("ai-assistant-response-card");

        const title =
            $("ai-response-title");

        const body =
            $("ai-response-body");

        const button =
            $("btn-submit-ai-prompt");


        const prompt =
            input?.value.trim() ||
            "";


        if (!prompt) {

            showPopup(
                "Question Required",
                "Please enter a question for the career assistant.",
                "warning"
            );

            return;
        }


        setLoading(
            button,
            true,
            "Thinking..."
        );


        try {

            /*
             * Correct API action:
             * api.php uses ask_interview_ai
             */

            const result =
                await apiRequest(
                    "ask_interview_ai",
                    {
                        prompt:
                            prompt,

                        target_role:
                            state.targetRole ||
                            "",

                        extracted_skills:
                            JSON.stringify(
                                state.extractedSkills
                            ),

                        required_skills:
                            JSON.stringify(
                                state.requiredSkills
                            )
                    }
                );


            if (
                !apiSuccess(result)
            ) {

                throw new Error(
                    result.message ||
                    "AI assistant request failed."
                );
            }


            const response =
                result.response ||
                result.answer ||
                result.data?.response ||
                result.data?.answer ||
                "No response was returned.";


            if (responseCard) {

                responseCard.style.display =
                    "block";
            }


            if (title) {

                title.textContent =
                    "Career Assistant";
            }


            if (body) {

                body.innerHTML =
                    escapeHtml(
                        response
                    ).replace(
                        /\n/g,
                        "<br>"
                    );
            }


        } catch (error) {

            showPopup(
                "Career Assistant",
                error.message ||
                "Unable to process your question.",
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
       PROFILE
       ======================================================== */

    function initProfileForm() {

        const form =
            $("profile-form");


        if (!form) {
            return;
        }


        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const data =
                    new FormData(
                        form
                    );


                try {

                    const result =
                        await apiRequest(
                            "update_profile",
                            data
                        );


                    if (
                        !apiSuccess(result)
                    ) {

                        throw new Error(
                            result.message ||
                            result.error ||
                            "Unable to update profile."
                        );
                    }


                    const message =
                        $("profile-message");


                    if (message) {

                        message.textContent =
                            "Profile updated successfully.";

                        message.className =
                            "inline-status success";
                    }


                    showPopup(
                        "Profile Updated",
                        "Your profile has been updated successfully.",
                        "success"
                    );


                } catch (error) {

                    const message =
                        $("profile-message");


                    if (message) {

                        message.textContent =
                            error.message ||
                            "Unable to update profile.";

                        message.className =
                            "inline-status error";
                    }


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
       LOGOUT
       ======================================================== */

    function initLogout() {

        const button =
            $("btn-logout");


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            async function () {

                try {

                    const result =
                        await apiRequest(
                            "logout",
                            {}
                        );


                    if (
                        apiSuccess(result)
                    ) {

                        window.location.replace(
                            window.location.pathname
                        );

                    } else {

                        throw new Error(
                            result.message ||
                            "Unable to logout."
                        );
                    }


                } catch (error) {

                    showPopup(
                        "Logout Failed",
                        error.message ||
                        "Unable to logout.",
                        "error"
                    );
                }
            }
        );
    }


    /* ========================================================
       REPORT
       ======================================================== */

    function initReport() {

        const form =
            $("report-form");


        if (!form) {
            return;
        }


        form.addEventListener(
            "submit",
            function () {

                const input =
                    $("report-career-url");


                if (input) {

                    input.value =
                        state.careerUrl ||
                        "";
                }
            }
        );
    }


    /* ========================================================
       FAVICON
       ======================================================== */

    function initializeFavicon() {

        const existing =
            document.querySelector(
                'link[rel="icon"]'
            );


        if (existing) {
            return;
        }


        const canvas =
            document.createElement(
                "canvas"
            );


        canvas.width =
            64;

        canvas.height =
            64;


        const context =
            canvas.getContext(
                "2d"
            );


        if (!context) {
            return;
        }


        context.fillStyle =
            "#2563eb";

        context.fillRect(
            0,
            0,
            64,
            64
        );


        context.fillStyle =
            "#ffffff";

        context.font =
            "bold 30px Arial";

        context.textAlign =
            "center";

        context.textBaseline =
            "middle";


        context.fillText(
            "SG",
            32,
            34
        );


        const link =
            document.createElement(
                "link"
            );


        link.rel =
            "icon";

        link.href =
            canvas.toDataURL(
                "image/png"
            );


        document.head.appendChild(
            link
        );
    }


    /* ========================================================
       INITIAL TARGET DATA
       ======================================================== */

    function initializeTarget() {

        state.careerUrl =
            window.APP_DATA?.careerUrl ||
            "";


        state.targetCompany =
            window.APP_DATA?.targetCompany ||
            "";


        state.targetRole =
            window.APP_DATA?.targetRole ||
            "";


        state.requiredSkills =
            normalizeSkills(
                window.APP_DATA?.requiredSkills ||
                []
            );


        state.extractedSkills =
            normalizeSkills(
                window.APP_DATA?.extractedSkills ||
                []
            );


        state.careerJobs =
            normalizeJobs(
                window.APP_DATA?.careerJobs ||
                []
            );


        state.atsScore =
            Number(
                window.APP_DATA?.atsScore ||
                0
            );


        state.recommendedJob =
            window.APP_DATA?.recommendedJob ||
            null;


        updateCareerInputs(
            state.careerUrl
        );
    }


    /* ========================================================
       AUTH SCREEN / APP SHELL
       ======================================================== */

    function initializeAuthVisibility() {

        const authScreen =
            $("auth-screen");

        const appShell =
            $("app-shell");


        if (state.loggedIn) {

            if (authScreen) {

                authScreen.style.display =
                    "none";
            }


            if (appShell) {

                appShell.style.display =
                    "";
            }

        } else {

            if (authScreen) {

                authScreen.style.display =
                    "";
            }


            if (appShell) {

                appShell.style.display =
                    "none";
            }
        }
    }


    /* ========================================================
       INITIALIZATION
       ======================================================== */

    function initializeApplication() {

        /*
         * Authentication visibility is handled first.
         */

        initializeAuthVisibility();


        initAuthTabs();

        initLogin();

        initSignup();

        initPasswordToggles();

        initTheme();

        initSidebar();

        initNavigation();

        initCareerScraper();

        initResumeUpload();

        initJobRanking();

        initInterview();

        initAIAssistant();

        initProfileForm();

        initLogout();

        initReport();


        initializeTarget();


        renderATS();

        renderExtractedSkills();

        renderSkillGap();

        renderJobs();

        updateRecommendation();

        updateStats();


        initCharts();

        renderDashboardCharts();


        if (state.loggedIn) {

            loadMetrics();

            /*
             * Always start authenticated users
             * on Dashboard after login/reload.
             */

            navigateToView(
                "dashboard"
            );
        }


        initializeFavicon();

        initializeLoader();
    }


    initializeApplication();

});
