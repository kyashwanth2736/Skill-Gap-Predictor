(() => {
    "use strict";

    /* ============================================================
       SKILL GAP PREDICTOR
       MAIN FRONTEND JAVASCRIPT
       ============================================================ */

    const APP = window.APP_DATA || {};

    const state = {
        loggedIn: Boolean(APP.loggedIn),
        user: APP.user || null,

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

        recommendedJob: APP.recommendedJob || null
    };


    /* ============================================================
       BASIC HELPERS
       ============================================================ */

    function $(id) {
        return document.getElementById(id);
    }

    function qs(selector, parent = document) {
        return parent.querySelector(selector);
    }

    function qsa(selector, parent = document) {
        return Array.from(parent.querySelectorAll(selector));
    }

    function text(value) {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value);
    }

    function escapeHtml(value) {
        return text(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* ============================================================
       SKILL NORMALIZATION
       ============================================================ */

    function normalizeSkill(skill) {

        if (skill === null || skill === undefined) {
            return "";
        }

        return String(skill)
            .toLowerCase()
            .replace(/[^a-z0-9+#.\- ]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }


    function normalizeSkills(skills) {

        if (!Array.isArray(skills)) {
            return [];
        }

        const output = [];

        skills.forEach(item => {

            let value = "";

            if (typeof item === "string") {
                value = item;
            } else if (item && typeof item === "object") {
                value =
                    item.name ||
                    item.skill ||
                    item.title ||
                    item.value ||
                    "";
            }

            value = String(value).trim();

            if (!value) {
                return;
            }

            const normalized = normalizeSkill(value);

            const exists = output.some(
                existing =>
                    normalizeSkill(existing) === normalized
            );

            if (!exists) {
                output.push(value);
            }
        });

        return output;
    }


    /* ============================================================
       MESSAGES
       ============================================================ */

    function showMessage(element, message, type = "info") {

        if (!element) {
            return;
        }

        element.textContent = message || "";

        element.className =
            "form-message " + type;

        element.style.display =
            message ? "block" : "none";
    }


    /* ============================================================
       BUTTON LOADING
       ============================================================ */

    function setButtonLoading(
        button,
        loading,
        normalText
    ) {

        if (!button) {
            return;
        }

        if (loading) {

            if (!button.dataset.originalText) {
                button.dataset.originalText =
                    button.textContent;
            }

            button.disabled = true;
            button.textContent = "Loading...";

        } else {

            button.disabled = false;

            button.textContent =
                button.dataset.originalText ||
                normalText ||
                "Submit";

            delete button.dataset.originalText;
        }
    }


    /* ============================================================
       LOADING SCREEN
       ============================================================ */

    function hideLoadingScreen() {

        const selectors = [
            "#loading-screen",
            "#app-loading",
            "#loading-overlay",
            "#page-loader",
            ".loading-screen",
            ".loading-overlay",
            ".app-loading",
            ".preloader"
        ];

        selectors.forEach(selector => {

            qsa(selector).forEach(element => {

                element.style.opacity = "0";
                element.style.visibility = "hidden";
                element.style.pointerEvents = "none";

                setTimeout(() => {
                    element.style.display = "none";
                }, 200);

            });

        });


        /*
         * Extra protection for loading text.
         */

        qsa("body *").forEach(element => {

            if (
                element.children.length === 0 &&
                element.textContent
            ) {

                const loadingText =
                    element.textContent.trim();

                if (
                    loadingText ===
                        "Loading Skill-Gap Predictor..." ||
                    loadingText ===
                        "Loading Skill-Gap Predictor ..."
                ) {

                    let parent = element;

                    for (
                        let i = 0;
                        i < 5 &&
                        parent.parentElement;
                        i++
                    ) {

                        parent = parent.parentElement;

                        const style =
                            window.getComputedStyle(
                                parent
                            );

                        if (
                            style.position === "fixed" ||
                            style.position === "absolute" ||
                            (parent.id &&
                             parent.id.toLowerCase().includes("load"))
                        ) {

                            parent.style.display = "none";
                            parent.style.visibility = "hidden";
                            parent.style.opacity = "0";
                            parent.style.pointerEvents = "none";

                            break;
                        }
                    }
                }
            }
        });
    }


    /*
     * Never allow loading screen to remain visible
     * because of a JavaScript error.
     */

    window.addEventListener(
        "load",
        hideLoadingScreen
    );

    window.addEventListener(
        "error",
        () => {
            hideLoadingScreen();
        }
    );

    window.addEventListener(
        "unhandledrejection",
        () => {
            hideLoadingScreen();
        }
    );


    /* ============================================================
       API REQUEST
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
                () => controller.abort(),
                timeout
            );

        try {

            const formData =
                new FormData();

            formData.append(
                "action",
                action
            );


            Object.keys(data).forEach(key => {

                const value = data[key];

                if (
                    value === null ||
                    value === undefined
                ) {

                    formData.append(
                        key,
                        ""
                    );

                } else if (
                    value instanceof File
                ) {

                    formData.append(
                        key,
                        value
                    );

                } else if (
                    Array.isArray(value) ||
                    typeof value === "object"
                ) {

                    formData.append(
                        key,
                        JSON.stringify(value)
                    );

                } else {

                    formData.append(
                        key,
                        String(value)
                    );
                }
            });


            const response =
                await fetch(
                    "api.php?action=" +
                    encodeURIComponent(action),
                    {
                        method: "POST",
                        body: formData,
                        credentials: "same-origin",
                        cache: "no-store",
                        signal: controller.signal
                    }
                );


            const raw =
                await response.text();


            let result;

            try {

                result =
                    JSON.parse(raw);

            } catch (error) {

                console.error(
                    "Invalid API response:",
                    raw
                );

                throw new Error(
                    "Server returned an invalid response. Check api.php."
                );
            }


            if (!response.ok) {

                throw new Error(
                    result.message ||
                    result.error ||
                    "Server request failed."
                );
            }


            if (result.success === false) {

                throw new Error(
                    result.message ||
                    result.error ||
                    "Request failed."
                );
            }


            return result;

        } catch (error) {

            if (
                error.name ===
                "AbortError"
            ) {

                throw new Error(
                    "Request timed out. Please try again."
                );
            }

            throw error;

        } finally {

            clearTimeout(
                timeoutId
            );
        }
    }


    /* ============================================================
       AUTH TABS
       ============================================================ */

    function initAuthTabs() {

        const loginTab =
            $("login-tab") ||
            qs(
                '[data-auth-tab="login"]'
            );

        const signupTab =
            $("signup-tab") ||
            qs(
                '[data-auth-tab="signup"]'
            );

        const loginPanel =
            $("login-panel") ||
            $("login-form-panel") ||
            qs(
                '[data-auth-panel="login"]'
            );

        const signupPanel =
            $("signup-panel") ||
            $("signup-form-panel") ||
            qs(
                '[data-auth-panel="signup"]'
            );


        function showLogin() {

            if (loginTab) {
                loginTab.classList.add(
                    "active"
                );
            }

            if (signupTab) {
                signupTab.classList.remove(
                    "active"
                );
            }

            if (loginPanel) {
                loginPanel.style.display = "";
            }

            if (signupPanel) {
                signupPanel.style.display =
                    "none";
            }
        }


        function showSignup() {

            if (signupTab) {
                signupTab.classList.add(
                    "active"
                );
            }

            if (loginTab) {
                loginTab.classList.remove(
                    "active"
                );
            }

            if (signupPanel) {
                signupPanel.style.display = "";
            }

            if (loginPanel) {
                loginPanel.style.display =
                    "none";
            }
        }


        if (loginTab) {

            loginTab.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    showLogin();
                }
            );
        }


        if (signupTab) {

            signupTab.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    showSignup();
                }
            );
        }


        qsa(
            "#create-account, " +
            "#create-account-link, " +
            ".create-account-link, " +
            "[data-action='create-account']"
        ).forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    showSignup();
                }
            );
        });


        qsa(
            "#back-to-login, " +
            ".back-to-login, " +
            "[data-action='back-login']"
        ).forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    showLogin();
                }
            );
        });


        if (
            loginPanel &&
            signupPanel
        ) {
            showLogin();
        }
    }


    /* ============================================================
       LOGIN
       ============================================================ */

    function initLogin() {

        const form =
            $("login-form") ||
            qs(
                "form[data-form='login']"
            );

        const button =
            $("btn-do-login") ||
            $("login-submit") ||
            qs(
                "#login-form button[type='submit']"
            );


        if (!form && !button) {
            return;
        }


        async function login(event) {

            event.preventDefault();


            const email =
                $("login_email")?.value.trim() ||
                $("login-email")?.value.trim() ||
                "";


            const password =
                $("login_password")?.value ||
                $("login-password")?.value ||
                "";


            const message =
                $("login-message") ||
                qs(".login-message");


            if (!email || !password) {

                showMessage(
                    message,
                    "Please enter your email and password.",
                    "error"
                );

                return;
            }


            setButtonLoading(
                button,
                true,
                "Sign In →"
            );


            try {

                const result =
                    await apiRequest(
                        "login",
                        {
                            email,
                            password
                        }
                    );


                state.loggedIn = true;

                state.user =
                    result.user ||
                    null;


                showMessage(
                    message,
                    result.message ||
                    "Login successful.",
                    "success"
                );


                setTimeout(() => {

                    window.location.replace(
                        window.location.pathname +
                        "?t=" +
                        Date.now()
                    );

                }, 500);


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                showMessage(
                    message,
                    error.message ||
                    "Login failed.",
                    "error"
                );


                setButtonLoading(
                    button,
                    false,
                    "Sign In →"
                );
            }
        }


        if (form) {

            form.addEventListener(
                "submit",
                login
            );

        } else {

            button.addEventListener(
                "click",
                login
            );
        }
    }


    /* ============================================================
       CREATE ACCOUNT
       ============================================================ */

    function initSignup() {

        const form =
            $("signup-form") ||
            qs(
                "form[data-form='signup']"
            );

        const button =
            $("btn-do-signup") ||
            $("signup-submit") ||
            qs(
                "#signup-form button[type='submit']"
            );


        if (!form && !button) {
            return;
        }


        async function signup(event) {

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

            const gradYear =
                $("signup_gradyear")?.value.trim() ||
                "";

            const linkedin =
                $("signup_linkedin")?.value.trim() ||
                "";

            const github =
                $("signup_github")?.value.trim() ||
                "";

            const termsElement =
                $("signup-terms");

            const terms =
                !termsElement ||
                termsElement.checked;


            const message =
                $("signup-message") ||
                qs(".signup-message");


            if (
                !name ||
                !email ||
                !password
            ) {

                showMessage(
                    message,
                    "Please fill in all required fields.",
                    "error"
                );

                return;
            }


            const passwordRegex =
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;


            if (
                !passwordRegex.test(
                    password
                )
            ) {

                showMessage(
                    message,
                    "Password must contain at least 8 characters, including uppercase, lowercase, number and special character.",
                    "error"
                );

                return;
            }


            if (!terms) {

                showMessage(
                    message,
                    "Please accept the terms and conditions.",
                    "error"
                );

                return;
            }


            setButtonLoading(
                button,
                true,
                "Create Account"
            );


            try {

                const result =
                    await apiRequest(
                        "signup",
                        {
                            name,
                            email,
                            password,
                            university,
                            branch,
                            major,
                            graduation_year:
                                gradYear,
                            linkedin,
                            github,

                            target_company: "",
                            target_role: ""
                        }
                    );


                showMessage(
                    message,
                    result.message ||
                    "Account created successfully.",
                    "success"
                );


                setTimeout(() => {

                    const loginTab =
                        $("login-tab") ||
                        qs(
                            '[data-auth-tab="login"]'
                        );

                    if (loginTab) {
                        loginTab.click();
                    }

                    if ($("login_email")) {
                        $("login_email").value =
                            email;
                    }

                }, 700);


            } catch (error) {

                showMessage(
                    message,
                    error.message ||
                    "Account creation failed.",
                    "error"
                );

            } finally {

                setButtonLoading(
                    button,
                    false,
                    "Create Account"
                );
            }
        }


        if (form) {

            form.addEventListener(
                "submit",
                signup
            );

        } else {

            button.addEventListener(
                "click",
                signup
            );
        }
    }


    /* ============================================================
       PASSWORD TOGGLE
       ============================================================ */

    function initPasswordToggles() {

        qsa(
            "#toggle-login-password, " +
            "#toggle-signup-password, " +
            "[data-toggle-password]"
        ).forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    let input = null;


                    const targetId =
                        button.dataset.togglePassword;


                    if (targetId) {
                        input = $(targetId);
                    }


                    if (
                        !input &&
                        button.id.includes("login")
                    ) {
                        input =
                            $("login_password");
                    }


                    if (
                        !input &&
                        button.id.includes("signup")
                    ) {
                        input =
                            $("signup_pwd");
                    }


                    if (!input) {
                        return;
                    }


                    if (
                        input.type ===
                        "password"
                    ) {

                        input.type = "text";

                        button.textContent =
                            "🙈";

                    } else {

                        input.type =
                            "password";

                        button.textContent =
                            "👁️";
                    }
                }
            );
        });
    }


    /* ============================================================
       THEME
       ============================================================ */

    function initThemeToggle() {

        const toggles = qsa(
            "#theme-toggle, " +
            "#themeToggle, " +
            "#dark-mode-toggle, " +
            "#darkModeToggle, " +
            "#btn-theme, " +
            "#theme-btn, " +
            "#top-theme-toggle, " +
            "[data-theme-toggle]"
        );


        let toggle =
            toggles[0] || null;


        /*
         * If no button exists, create one.
         */

        if (!toggle) {

            const header =
                qs(".topbar") ||
                qs(".navbar") ||
                qs(".header") ||
                qs("header");


            if (header) {

                toggle =
                    document.createElement(
                        "button"
                    );

                toggle.type = "button";

                toggle.id =
                    "theme-toggle";

                toggle.className =
                    "theme-toggle";

                toggle.setAttribute(
                    "aria-label",
                    "Toggle theme"
                );

                toggle.innerHTML = "🌙";

                header.appendChild(
                    toggle
                );
            }
        }


        if (!toggle) {
            return;
        }


        function applyTheme(theme) {

            const dark =
                theme === "dark";


            document.documentElement
                .setAttribute(
                    "data-theme",
                    theme
                );


            document.body.classList.toggle(
                "dark-mode",
                dark
            );


            document.body.classList.toggle(
                "dark-theme",
                dark
            );


            document.body.classList.toggle(
                "light-mode",
                !dark
            );


            document.body.classList.toggle(
                "light-theme",
                !dark
            );


            localStorage.setItem(
                "skill-gap-theme",
                theme
            );


            qsa(
                "#theme-toggle, " +
                "#themeToggle, " +
                "#dark-mode-toggle, " +
                "#darkModeToggle, " +
                "#btn-theme, " +
                "#theme-btn, " +
                "#top-theme-toggle, " +
                "[data-theme-toggle]"
            ).forEach(themeButton => {

                themeButton.setAttribute(
                    "aria-label",
                    dark
                        ? "Switch to light mode"
                        : "Switch to dark mode"
                );

                if (
                    themeButton.children.length === 0
                ) {

                    themeButton.textContent =
                        dark
                            ? "☀️"
                            : "🌙";
                }
            });
        }


        const saved =
            localStorage.getItem(
                "skill-gap-theme"
            );


        applyTheme(
            saved === "dark"
                ? "dark"
                : "light"
        );


        qsa(
            "#theme-toggle, " +
            "#themeToggle, " +
            "#dark-mode-toggle, " +
            "#darkModeToggle, " +
            "#btn-theme, " +
            "#theme-btn, " +
            "#top-theme-toggle, " +
            "[data-theme-toggle]"
        ).forEach(themeButton => {

            if (
                themeButton.dataset.themeBound ===
                "true"
            ) {
                return;
            }


            themeButton.dataset.themeBound =
                "true";


            themeButton.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    const current =
                        document.documentElement
                            .getAttribute(
                                "data-theme"
                            ) ||
                        "light";


                    applyTheme(
                        current === "dark"
                            ? "light"
                            : "dark"
                    );
                }
            );
        });
    }


    /* ============================================================
       AUTH PAGE VISIBILITY
       ============================================================ */

    function hideCareerElementsWhenLoggedOut() {

        if (state.loggedIn) {
            return;
        }


        const selectors = [

            "#career-url-panel",

            "#career-url-section",

            "#career-url-container",

            "#career-scraper",

            "#dynamic-career-panel",

            ".career-url-panel",

            ".career-scraper",

            "#career-url",

            "#dynamic-career-url"
        ];


        selectors.forEach(selector => {

            qsa(selector).forEach(element => {

                element.style.display =
                    "none";

            });
        });


        /*
         * Hide dashboard-specific elements.
         */

        qsa(
            "#dashboard, " +
            "#app-dashboard, " +
            ".dashboard-page, " +
            ".main-app"
        ).forEach(element => {

            if (
                element.id ===
                "login-panel" ||
                element.id ===
                "signup-panel"
            ) {
                return;
            }

            if (
                element.contains(
                    $("login-panel")
                ) ||
                element.contains(
                    $("signup-panel")
                )
            ) {
                return;
            }

            element.style.display =
                "none";
        });
    }


    /* ============================================================
       SIDEBAR / NAVIGATION
       ============================================================ */

    function initNavigation() {

        qsa(
            "[data-view], [data-page], [data-section]"
        ).forEach(link => {

            link.addEventListener(
                "click",
                event => {

                    const view =
                        link.dataset.view ||
                        link.dataset.page ||
                        link.dataset.section;


                    if (!view) {
                        return;
                    }


                    event.preventDefault();


                    qsa(
                        ".page-view, " +
                        ".dashboard-view, " +
                        "[data-page-view]"
                    ).forEach(page => {

                        const pageName =
                            page.dataset.view ||
                            page.dataset.page ||
                            page.dataset.section ||
                            page.id;


                        page.style.display =
                            pageName === view
                                ? ""
                                : "none";
                    });


                    qsa(
                        "[data-view], " +
                        "[data-page], " +
                        "[data-section]"
                    ).forEach(item => {

                        const itemView =
                            item.dataset.view ||
                            item.dataset.page ||
                            item.dataset.section;


                        item.classList.toggle(
                            "active",
                            itemView === view
                        );
                    });


                    closeSidebar();
                }
            );
        });
    }


    /* ============================================================
       MOBILE MENU
       ============================================================ */

    function closeSidebar() {

        document.body.classList.remove(
            "sidebar-open"
        );


        qsa(
            "#sidebar, " +
            ".sidebar, " +
            ".side-nav"
        ).forEach(sidebar => {

            sidebar.classList.remove(
                "open"
            );

            sidebar.classList.remove(
                "active"
            );
        });


        qsa(
            "#sidebar-overlay, " +
            ".sidebar-overlay, " +
            ".overlay"
        ).forEach(overlay => {

            overlay.classList.remove(
                "active"
            );

            overlay.style.display = "";
        });
    }


    function initMobileMenu() {

        qsa(
            "#menu-toggle, " +
            "#hamburger, " +
            "#mobile-menu, " +
            "#mobile-menu-toggle, " +
            ".menu-toggle, " +
            "[data-menu-toggle]"
        ).forEach(button => {

            if (
                button.dataset.menuBound ===
                "true"
            ) {
                return;
            }

            button.dataset.menuBound =
                "true";


            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    const isOpen =
                        document.body.classList.toggle(
                            "sidebar-open"
                        );


                    qsa(
                        "#sidebar, " +
                        ".sidebar, " +
                        ".side-nav"
                    ).forEach(sidebar => {

                        sidebar.classList.toggle(
                            "open",
                            isOpen
                        );

                        sidebar.classList.toggle(
                            "active",
                            isOpen
                        );
                    });


                    qsa(
                        "#sidebar-overlay, " +
                        ".sidebar-overlay, " +
                        ".overlay"
                    ).forEach(overlay => {

                        overlay.classList.toggle(
                            "active",
                            isOpen
                        );

                        if (isOpen) {
                            overlay.style.display = "";
                        }
                    });
                }
            );
        });


        qsa(
            "#sidebar-close, " +
            ".sidebar-close, " +
            "[data-sidebar-close]"
        ).forEach(button => {

            button.addEventListener(
                "click",
                closeSidebar
            );
        });


        qsa(
            "#sidebar-overlay, " +
            ".sidebar-overlay, " +
            ".overlay"
        ).forEach(overlay => {

            overlay.addEventListener(
                "click",
                closeSidebar
            );
        });
    }


    /* ============================================================
       CAREER URL INPUT
       ============================================================ */

    function findCareerURLInput() {

        const selectors = [

            "#career-url",

            "#career_url",

            "#scrape-url",

            "#job-url",

            "#target-url",

            "#url-input",

            "#careerUrl",

            "input[name='career_url']",

            "input[name='careerUrl']"
        ];


        for (
            const selector of selectors
        ) {

            const element =
                qs(selector);

            if (element) {
                return element;
            }
        }


        return null;
    }


    function findCareerButton() {

        const selectors = [

            "#scrape-career-url",

            "#scrape",

            "#btn-scrape",

            "#btn-scrape-url",

            "#scrape-url-btn",

            "#load-careers",

            "#find-jobs",

            "#career-scrape-btn",

            "#dynamic-career-scrape-btn"
        ];


        for (
            const selector of selectors
        ) {

            const element =
                qs(selector);

            if (element) {
                return element;
            }
        }


        return null;
    }


    /* ============================================================
       CREATE DYNAMIC CAREER PANEL
       ============================================================ */

    function createCareerPanel() {

        if (!state.loggedIn) {
            return;
        }


        if (
            $("dynamic-career-panel")
        ) {
            return;
        }


        const sidebar =
            $("sidebar") ||
            qs(".sidebar") ||
            qs(".side-nav");


        if (!sidebar) {
            return;
        }


        /*
         * If the main dashboard already contains
         * the Career URL field, do not create another one.
         */

        if (findCareerURLInput()) {
            return;
        }


        const panel =
            document.createElement(
                "div"
            );


        panel.id =
            "dynamic-career-panel";


        panel.className =
            "career-url-panel";


        panel.innerHTML = `

            <div class="career-url-title">
                Career URL
            </div>

            <div class="career-url-description">
                Paste a careers or jobs page URL.
            </div>

            <input
                type="url"
                id="dynamic-career-url"
                placeholder="https://example.com/careers"
                autocomplete="off"
            >

            <button
                type="button"
                id="dynamic-career-scrape-btn"
            >
                Find Jobs
            </button>

            <div
                id="dynamic-career-status"
                class="form-message"
            ></div>
        `;


        sidebar.prepend(
            panel
        );
    }


    /* ============================================================
       GET CAREER URL
       ============================================================ */

    function getCareerURL() {

        const input =
            findCareerURLInput() ||
            $("dynamic-career-url");


        if (!input) {
            return "";
        }


        return input.value.trim();
    }


    /* ============================================================
       NORMALIZE JOB
       ============================================================ */

    function normalizeJob(job) {

        if (
            !job ||
            typeof job !== "object"
        ) {
            return null;
        }


        const title =
            job.title ||
            job.role ||
            job.position ||
            "";


        const company =
            job.company ||
            job.organization ||
            job.employer ||
            "";


        let skills =
            job.required_skills ||
            job.requiredSkills ||
            job.skills ||
            job.requirements ||
            [];


        if (
            typeof skills === "string"
        ) {

            skills =
                skills
                    .split(
                        /[,;\n|]/
                    )
                    .map(
                        x => x.trim()
                    )
                    .filter(Boolean);
        }


        return {

            ...job,

            title:
                text(title),

            role:
                text(
                    job.role ||
                    title
                ),

            company:
                text(company),

            required_skills:
                normalizeSkills(
                    skills
                ),

            url:
                job.url ||
                job.link ||
                job.apply_url ||
                "",

            location:
                job.location ||
                "",

            description:
                job.description ||
                ""
        };
    }


    function normalizeJobs(jobs) {

        if (!Array.isArray(jobs)) {
            return [];
        }


        return jobs
            .map(normalizeJob)
            .filter(
                job =>
                    job &&
                    job.title
            );
    }


    /* ============================================================
       MATCHING
       ============================================================ */

    function skillMatches(
        resumeSkill,
        requiredSkill
    ) {

        const a =
            normalizeSkill(
                resumeSkill
            );

        const b =
            normalizeSkill(
                requiredSkill
            );


        if (!a || !b) {
            return false;
        }


        if (a === b) {
            return true;
        }


        if (
            a.length >= 4 &&
            b.length >= 4 &&
            (
                a.includes(b) ||
                b.includes(a)
            )
        ) {
            return true;
        }


        return false;
    }


    function calculateMatch(
        job,
        resumeSkills
    ) {

        const required =
            normalizeSkills(
                job.required_skills
            );


        const resume =
            normalizeSkills(
                resumeSkills
            );


        if (!required.length) {

            return {

                score: 0,

                matched: [],

                missing: [],

                hasRequirements: false
            };
        }


        const matched = [];
        const missing = [];


        required.forEach(
            requiredSkill => {

                const exists =
                    resume.some(
                        resumeSkill =>
                            skillMatches(
                                resumeSkill,
                                requiredSkill
                            )
                    );


                if (exists) {

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
            Math.round(
                (
                    matched.length /
                    required.length
                ) * 100
            );


        return {

            score,

            matched,

            missing,

            hasRequirements: true
        };
    }


    function rankJobs(jobs) {

        return normalizeJobs(jobs)
            .map(job => {

                const match =
                    calculateMatch(
                        job,
                        state.extractedSkills
                    );


                return {

                    ...job,

                    matchScore:
                        match.score,

                    matchedSkills:
                        match.matched,

                    missingSkills:
                        match.missing,

                    hasRequirements:
                        match.hasRequirements
                };
            })
            .sort(
                (a, b) => {

                    if (
                        b.matchScore !==
                        a.matchScore
                    ) {

                        return (
                            b.matchScore -
                            a.matchScore
                        );
                    }


                    return (
                        b.matchedSkills.length -
                        a.matchedSkills.length
                    );
                }
            );
    }


    /* ============================================================
       JOB RESULTS
       ============================================================ */

    function getJobContainer() {

        const selectors = [

            "#job-results",

            "#career-jobs",

            "#job-ranking-results",

            "#job-results-container",

            ".job-results"
        ];


        for (
            const selector of selectors
        ) {

            const element =
                qs(selector);

            if (element) {
                return element;
            }
        }


        return null;
    }


    function renderJobs(jobs) {

        const container =
            getJobContainer();


        if (!container) {
            return;
        }


        const ranked =
            rankJobs(jobs);


        if (!ranked.length) {

            container.innerHTML = `

                <div class="empty-state">
                    No jobs were detected from the career URL.
                </div>

            `;

            return;
        }


        container.innerHTML = `

            <div class="job-results-header">

                <h3>
                    Career Opportunities
                </h3>

                <span>
                    ${ranked.length} role(s) found
                </span>

            </div>


            <div class="dynamic-job-list">

                ${ranked.map(
                    (job, index) => `

                    <div
                        class="dynamic-job-card ${
                            index === 0 &&
                            state.extractedSkills.length
                                ? "recommended"
                                : ""
                        }"
                    >

                        <div class="job-card-header">

                            <div>

                                <h4>
                                    ${escapeHtml(
                                        job.title
                                    )}
                                </h4>

                                ${
                                    job.company
                                        ? `
                                            <div class="job-company">
                                                ${escapeHtml(
                                                    job.company
                                                )}
                                            </div>
                                          `
                                        : ""
                                }

                            </div>


                            <div class="job-match-score">

                                ${
                                    job.hasRequirements
                                        ? job.matchScore +
                                          "% Match"
                                        : "Requirements unavailable"
                                }

                            </div>

                        </div>


                        ${
                            job.location
                                ? `
                                    <div class="job-location">
                                        ${escapeHtml(
                                            job.location
                                        )}
                                    </div>
                                  `
                                : ""
                        }


                        ${
                            job.hasRequirements
                                ? `

                                    <div class="job-skills">

                                        ${
                                            job.matchedSkills.length
                                                ? `
                                                    <div>
                                                        <strong>
                                                            Matched:
                                                        </strong>

                                                        ${job.matchedSkills
                                                            .map(
                                                                skill =>
                                                                    `
                                                                    <span class="skill matched">
                                                                        ${escapeHtml(
                                                                            skill
                                                                        )}
                                                                    </span>
                                                                    `
                                                            )
                                                            .join("")}
                                                    </div>
                                                  `
                                                : ""
                                        }


                                        ${
                                            job.missingSkills.length
                                                ? `
                                                    <div>
                                                        <strong>
                                                            Missing:
                                                        </strong>

                                                        ${job.missingSkills
                                                            .map(
                                                                skill =>
                                                                    `
                                                                    <span class="skill missing">
                                                                        ${escapeHtml(
                                                                            skill
                                                                        )}
                                                                    </span>
                                                                    `
                                                            )
                                                            .join("")}
                                                    </div>
                                                  `
                                                : ""
                                        }

                                    </div>

                                  `
                                : ""
                        }


                        <div class="job-card-actions">

                            <button
                                type="button"
                                class="use-job-btn"
                                data-index="${index}"
                            >
                                Use This Job
                            </button>


                            ${
                                job.url
                                    ? `
                                        <a
                                            href="${escapeHtml(
                                                job.url
                                            )}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="job-link"
                                        >
                                            View Job
                                        </a>
                                      `
                                    : ""
                            }

                        </div>

                    </div>

                `
                ).join("")}

            </div>
        `;


        qsa(
            ".use-job-btn",
            container
        ).forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const index =
                        Number(
                            button.dataset.index
                        );


                    const selected =
                        ranked[index];


                    if (selected) {

                        await useJob(
                            selected
                        );
                    }
                }
            );
        });
    }


    /* ============================================================
       SELECT JOB
       ============================================================ */

    async function useJob(job) {

        state.recommendedJob =
            job;

        state.targetCompany =
            job.company || "";

        state.targetRole =
            job.role ||
            job.title ||
            "";

        state.requiredSkills =
            normalizeSkills(
                job.required_skills
            );


        APP.targetCompany =
            state.targetCompany;

        APP.targetRole =
            state.targetRole;

        APP.requiredSkills =
            state.requiredSkills;

        APP.recommendedJob =
            job;


        updateTargetUI();


        try {

            await apiRequest(
                "get_metrics",
                {
                    target_company:
                        state.targetCompany,

                    target_role:
                        state.targetRole,

                    required_skills:
                        state.requiredSkills
                }
            );

        } catch (error) {

            console.warn(
                "Target save warning:",
                error.message
            );
        }


        renderRecommendation(
            job
        );
    }


    /* ============================================================
       SCRAPE CAREER URL
       ============================================================ */

    async function scrapeCareerURL() {

        if (!state.loggedIn) {
            return;
        }


        const url =
            getCareerURL();


        const status =
            $("dynamic-career-status") ||
            $("career-url-status") ||
            $("scrape-status");


        const button =
            findCareerButton();


        if (!url) {

            showMessage(
                status,
                "Please enter a career or jobs URL.",
                "error"
            );

            return;
        }


        if (
            !/^https?:\/\/.+/i.test(
                url
            )
        ) {

            showMessage(
                status,
                "Please enter a valid URL beginning with http:// or https://.",
                "error"
            );

            return;
        }


        setButtonLoading(
            button,
            true,
            "Find Jobs"
        );


        showMessage(
            status,
            "Reading jobs from the career page...",
            "info"
        );


        try {

            const result =
                await apiRequest(
                    "scrape_url",
                    {
                        url
                    },
                    90000
                );


            const jobs =
                normalizeJobs(
                    result.jobs ||
                    result.data ||
                    result.results ||
                    []
                );


            state.careerUrl =
                url;

            state.careerJobs =
                jobs;


            renderJobs(
                jobs
            );


            if (!jobs.length) {

                showMessage(
                    status,
                    "No job listings were detected from this page.",
                    "error"
                );

                return;
            }


            showMessage(
                status,
                `${jobs.length} job(s) found successfully.`,
                "success"
            );


            if (
                state.extractedSkills.length
            ) {

                const ranked =
                    rankJobs(
                        jobs
                    );


                if (
                    ranked.length
                ) {

                    await useJob(
                        ranked[0]
                    );
                }
            }


        } catch (error) {

            console.error(
                "Career URL error:",
                error
            );


            showMessage(
                status,
                error.message ||
                "Unable to read the career URL.",
                "error"
            );


        } finally {

            setButtonLoading(
                button,
                false,
                "Find Jobs"
            );
        }
    }


    /* ============================================================
       CAREER URL INITIALIZATION
       ============================================================ */

    function initCareerURL() {

        if (!state.loggedIn) {
            return;
        }


        createCareerPanel();


        const input =
            findCareerURLInput() ||
            $("dynamic-career-url");


        const button =
            findCareerButton();


        if (button) {

            if (
                button.dataset.careerBound !==
                "true"
            ) {

                button.dataset.careerBound =
                    "true";

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        scrapeCareerURL();
                    }
                );
            }
        }


        if (input) {

            if (state.careerUrl) {
                input.value =
                    state.careerUrl;
            }


            if (
                input.dataset.careerBound !==
                "true"
            ) {

                input.dataset.careerBound =
                    "true";

                input.addEventListener(
                    "keydown",
                    event => {

                        if (
                            event.key ===
                            "Enter"
                        ) {

                            event.preventDefault();

                            scrapeCareerURL();
                        }
                    }
                );
            }
        }
    }


    /* ============================================================
       RESUME UPLOAD
       ============================================================ */

    function findResumeInput() {

        const selectors = [

            "#resume_file",

            "#resume-file",

            "#resume",

            "#resume_upload",

            "input[name='resume']", 

            "input[type='file']"
        ];


        for (
            const selector of selectors
        ) {

            const input =
                qs(selector);

            if (input) {
                return input;
            }
        }


        return null;
    }


    async function uploadResume(file) {

        if (!file) {
            return;
        }


        const status =
            $("resume-status") ||
            $("upload-status") ||
            $("resume-message");


        showMessage(
            status,
            "Parsing your resume...",
            "info"
        );


        try {

            const result =
                await apiRequest(
                    "upload_resume",
                    {
                        resume: file
                    },
                    90000
                );


            state.extractedSkills =
                normalizeSkills(
                    result.extracted_skills ||
                    result.skills ||
                    result.extractedSkills ||
                    []
                );


            state.atsScore =
                Number(
                    result.ats_score ||
                    result.atsScore ||
                    0
                );


            APP.extractedSkills =
                state.extractedSkills;

            APP.atsScore =
                state.atsScore;


            renderSkills();

            renderATS();


            showMessage(
                status,
                result.message ||
                "Resume parsed successfully.",
                "success"
            );


            if (
                state.careerJobs.length
            ) {

                renderJobs(
                    state.careerJobs
                );


                const ranked =
                    rankJobs(
                        state.careerJobs
                    );


                if (
                    ranked.length
                ) {

                    await useJob(
                        ranked[0]
                    );
                }
            }


        } catch (error) {

            showMessage(
                status,
                error.message ||
                "Unable to parse the resume.",
                "error"
            );
        }
    }


    function initResumeUpload() {

        const input =
            findResumeInput();


        if (!input) {
            return;
        }


        if (
            input.dataset.resumeBound ===
            "true"
        ) {
            return;
        }


        input.dataset.resumeBound =
            "true";


        input.addEventListener(
            "change",
            () => {

                const file =
                    input.files &&
                    input.files[0];


                if (file) {
                    uploadResume(
                        file
                    );
                }
            }
        );
    }


    /* ============================================================
       SKILLS
       ============================================================ */

    function renderSkills() {

        const containers = [

            $("extracted-skills"),

            $("resume-skills"),

            $("skills-list"),

            $("skill-list")
        ].filter(Boolean);


        containers.forEach(
            container => {

                if (
                    !state.extractedSkills.length
                ) {

                    container.innerHTML = `
                        <div class="empty-state">
                            Upload a resume to extract your skills.
                        </div>
                    `;

                    return;
                }


                container.innerHTML =
                    state.extractedSkills
                        .map(
                            skill =>
                                `
                                <span class="skill-tag">
                                    ${escapeHtml(
                                        skill
                                    )}
                                </span>
                                `
                        )
                        .join("");
            }
        );
    }


    /* ============================================================
       ATS
       ============================================================ */

    function renderATS() {

        const score =
            Math.max(
                0,
                Math.min(
                    100,
                    Number(
                        state.atsScore ||
                        0
                    )
                )
            );


        qsa(
            "#ats-score, " +
            "#atsScore, " +
            "#ats-score-value"
        ).forEach(
            element => {

                element.textContent =
                    Math.round(score) +
                    "%";
            }
        );


        const progress =
            $("ats-progress") ||
            qs(
                ".ats-progress-bar"
            );


        if (progress) {

            progress.style.width =
                score + "%";
        }
    }


    /* ============================================================
       TARGET UI
       ============================================================ */

    function updateTargetUI() {

        const role =
            state.targetRole ||
            "No career role selected";


        const company =
            state.targetCompany ||
            "Dynamic career target";


        qsa(
            "#target-role, " +
            "#targetRole, " +
            ".target-role"
        ).forEach(
            element => {

                element.textContent =
                    role;
            }
        );


        qsa(
            "#target-company, " +
            "#targetCompany, " +
            ".target-company"
        ).forEach(
            element => {

                element.textContent =
                    company;
            }
        );


        qsa(
            "#required-skills, " +
            ".required-skills"
        ).forEach(
            container => {

                if (
                    !state.requiredSkills.length
                ) {

                    container.innerHTML = `
                        <div class="empty-state">
                            No job requirements detected yet.
                        </div>
                    `;

                    return;
                }


                container.innerHTML =
                    state.requiredSkills
                        .map(
                            skill =>
                                `
                                <span class="skill-tag required">
                                    ${escapeHtml(
                                        skill
                                    )}
                                </span>
                                `
                        )
                        .join("");
            }
        );
    }


    /* ============================================================
       RECOMMENDATION
       ============================================================ */

    function renderRecommendation(
        job
    ) {

        if (!job) {
            return;
        }


        qsa(
            "#recommendation-card, " +
            "#recommended-job, " +
            "#job-recommendation, " +
            "#recommendedJob"
        ).forEach(
            container => {

                container.innerHTML = `

                    <div class="recommendation-card">

                        <div class="recommendation-label">
                            Recommended Match
                        </div>

                        <h3>
                            ${escapeHtml(
                                job.title ||
                                job.role ||
                                ""
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
                                : ""
                        }

                        ${
                            job.matchScore !== undefined
                                ? `
                                    <strong>
                                        ${job.matchScore}% skill match
                                    </strong>
                                  `
                                : ""
                        }

                    </div>

                `;
            }
        );
    }


    /* ============================================================
       PROFILE
       ============================================================ */

    function initProfile() {

        const form =
            $("profile-form");


        if (!form) {
            return;
        }


        form.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const data =
                    Object.fromEntries(
                        new FormData(
                            form
                        ).entries()
                    );


                const button =
                    form.querySelector(
                        "button[type='submit']"
                    );


                const message =
                    $("profile-message");


                setButtonLoading(
                    button,
                    true,
                    "Save Changes"
                );


                try {

                    const result =
                        await apiRequest(
                            "update_profile",
                            data
                        );


                    if (result.user) {
                        state.user =
                            result.user;
                    }


                    showMessage(
                        message,
                        result.message ||
                        "Profile updated successfully.",
                        "success"
                    );


                } catch (error) {

                    showMessage(
                        message,
                        error.message ||
                        "Unable to update profile.",
                        "error"
                    );


                } finally {

                    setButtonLoading(
                        button,
                        false,
                        "Save Changes"
                    );
                }
            }
        );
    }


    /* ============================================================
       ROADMAP
       ============================================================ */

    async function loadRoadmap() {

        const container =
            $("roadmap-content") ||
            $("roadmap-container") ||
            $("roadmap-results");


        if (!container) {
            return;
        }


        if (!state.targetRole) {

            container.innerHTML = `
                <div class="empty-state">
                    Select a job from your career URL first.
                </div>
            `;

            return;
        }


        container.innerHTML = `
            <div class="loading-state">
                Generating roadmap...
            </div>
        `;


        try {

            const result =
                await apiRequest(
                    "get_roadmap",
                    {
                        target_role:
                            state.targetRole,

                        target_company:
                            state.targetCompany,

                        required_skills:
                            state.requiredSkills
                    }
                );


            const roadmap =
                result.roadmap ||
                result.data ||
                result.result ||
                [];


            /*
             * FIXED:
             * Missing closing parenthesis was causing
             * Unexpected token '{'.
             */

            if (
                Array.isArray(
                    roadmap
                )
            ) {

                container.innerHTML =
                    roadmap
                        .map(
                            (item, index) =>
                                `
                                <div class="roadmap-item">

                                    <div class="roadmap-number">
                                        ${index + 1}
                                    </div>

                                    <div>

                                        <h4>
                                            ${escapeHtml(
                                                item.title ||
                                                item.skill ||
                                                item.topic ||
                                                `Step ${index + 1}`
                                            )}
                                        </h4>

                                        <p>
                                            ${escapeHtml(
                                                item.description ||
                                                item.details ||
                                                ""
                                            )}
                                        </p>

                                    </div>

                                </div>
                                `
                        )
                        .join("");

            } else {

                container.textContent =
                    text(roadmap);
            }


        } catch (error) {

            container.innerHTML = `
                <div class="form-message error">
                    ${escapeHtml(
                        error.message
                    )}
                </div>
            `;
        }
    }


    /* ============================================================
       INTERVIEW
       ============================================================ */

    async function loadInterview() {

        const container =
            $("interview-content") ||
            $("interview-container") ||
            $("interview-results");


        if (!container) {
            return;
        }


        if (!state.targetRole) {

            container.innerHTML = `
                <div class="empty-state">
                    Select a job from your career URL first.
                </div>
            `;

            return;
        }


        container.innerHTML = `
            <div class="loading-state">
                Preparing interview questions...
            </div>
        `;


        try {

            const result =
                await apiRequest(
                    "get_interview",
                    {
                        target_role:
                            state.targetRole,

                        target_company:
                            state.targetCompany,

                        required_skills:
                            state.requiredSkills
                    }
                );


            const questions =
                result.questions ||
                result.interview_questions ||
                result.data ||
                [];


            /*
             * FIXED:
             * Missing closing parenthesis was causing
             * Unexpected token '{'.
             */

            if (
                Array.isArray(
                    questions
                )
            ) {

                container.innerHTML =
                    questions
                        .map(
                            (question, index) => {

                                const value =
                                    typeof question ===
                                    "string"
                                        ? question
                                        : (
                                            question.question ||
                                            question.text ||
                                            ""
                                        );


                                return `

                                    <div class="interview-question">

                                        <strong>
                                            Question ${index + 1}
                                        </strong>

                                        <p>
                                            ${escapeHtml(
                                                value
                                            )}
                                        </p>

                                    </div>

                                `;
                            }
                        )
                        .join("");

            } else {

                container.textContent =
                    text(questions);
            }


        } catch (error) {

            container.innerHTML = `
                <div class="form-message error">
                    ${escapeHtml(
                        error.message
                    )}
                </div>
            `;
        }
    }


    /* ============================================================
       AI INTERVIEW
       ============================================================ */

    function initAIInterview() {

        const button =
            $("ai-interview-submit") ||
            $("btn-ai-interview") ||
            $("ask-ai-btn") ||
            $("submit-interview-answer");


        const input =
            $("ai-interview-question") ||
            $("interview-question-input") ||
            $("interview-question");


        const output =
            $("ai-interview-answer") ||
            $("ai-response") ||
            $("ai-interview-output") ||
            $("interview-feedback");


        if (
            !button ||
            !input ||
            !output
        ) {
            return;
        }


        button.addEventListener(
            "click",
            async event => {

                event.preventDefault();


                const question =
                    input.value.trim();


                if (!question) {
                    return;
                }


                setButtonLoading(
                    button,
                    true,
                    "Ask AI"
                );


                try {

                    const result =
                        await apiRequest(
                            "ask_interview_ai",
                            {
                                question,

                                target_role:
                                    state.targetRole,

                                target_company:
                                    state.targetCompany
                            }
                        );


                    output.textContent =
                        result.answer ||
                        result.response ||
                        result.message ||
                        "No response received.";


                } catch (error) {

                    output.textContent =
                        error.message;


                } finally {

                    setButtonLoading(
                        button,
                        false,
                        "Ask AI"
                    );
                }
            }
        );
    }


    /* ============================================================
       ROADMAP / INTERVIEW BUTTONS
       ============================================================ */

    function initFeatureButtons() {

        qsa(
            "#roadmap-btn, " +
            "[data-action='roadmap'], " +
            ".roadmap-btn"
        ).forEach(
            button => {

                button.addEventListener(
                    "click",
                    loadRoadmap
                );
            }
        );


        qsa(
            "#interview-btn, " +
            "[data-action='interview'], " +
            ".interview-btn"
        ).forEach(
            button => {

                button.addEventListener(
                    "click",
                    loadInterview
                );
            }
        );
    }


    /* ============================================================
       REMOVE OLD PREDEFINED TARGET CONTROLS
       ============================================================ */

    function removeOldTargetControls() {

        const selectors = [

            "#company-select",

            "#companySelect",

            "#role-select",

            "#roleSelect",

            "#benchmark-company",

            "#benchmark-role",

            "#benchmark-company-select",

            "#benchmark-role-select"
        ];


        selectors.forEach(
            selector => {

                qsa(selector).forEach(
                    element => {

                        element.style.display =
                            "none";
                    }
                );
            }
        );
    }


    /* ============================================================
       LOAD EXISTING JOBS
       ============================================================ */

    function loadExistingJobs() {

        if (!state.loggedIn) {
            return;
        }


        if (
            Array.isArray(
                APP.careerJobs
            ) &&
            APP.careerJobs.length
        ) {

            state.careerJobs =
                normalizeJobs(
                    APP.careerJobs
                );


            renderJobs(
                state.careerJobs
            );
        }
    }


    /* ============================================================
       INITIAL TARGET
       ============================================================ */

    function initializeTarget() {

        state.targetCompany =
            APP.targetCompany || "";

        state.targetRole =
            APP.targetRole || "";

        state.requiredSkills =
            normalizeSkills(
                APP.requiredSkills || []
            );

        state.extractedSkills =
            normalizeSkills(
                APP.extractedSkills || []
            );

        state.atsScore =
            Number(
                APP.atsScore || 0
            );


        if (
            APP.recommendedJob
        ) {

            state.recommendedJob =
                normalizeJob(
                    APP.recommendedJob
                );
        }


        updateTargetUI();

        renderSkills();

        renderATS();


        if (
            state.recommendedJob
        ) {

            renderRecommendation(
                state.recommendedJob
            );
        }
    }


    /* ============================================================
       SAFE INITIALIZER
       ============================================================ */

    function safeInit(
        name,
        callback
    ) {

        try {

            callback();

        } catch (error) {

            console.error(
                "Skill Gap Predictor - " +
                name +
                ":",
                error
            );
        }
    }


    /* ============================================================
       START APPLICATION
       ============================================================ */

    function boot() {

        /*
         * FIRST:
         * Remove loading screen.
         */

        hideLoadingScreen();


        /*
         * Login/signup features must always load.
         */

        safeInit(
            "Auth Tabs",
            initAuthTabs
        );

        safeInit(
            "Login",
            initLogin
        );

        safeInit(
            "Signup",
            initSignup
        );

        safeInit(
            "Password Toggle",
            initPasswordToggles
        );

        safeInit(
            "Theme",
            initThemeToggle
        );


        /*
         * Logged-in navigation.
         */

        safeInit(
            "Navigation",
            initNavigation
        );

        safeInit(
            "Mobile Menu",
            initMobileMenu
        );


        if (state.loggedIn) {

            /*
             * ONLY logged-in users get Career URL.
             */

            safeInit(
                "Career URL",
                initCareerURL
            );


            safeInit(
                "Resume Upload",
                initResumeUpload
            );


            safeInit(
                "Profile",
                initProfile
            );


            safeInit(
                "Features",
                initFeatureButtons
            );


            safeInit(
                "AI Interview",
                initAIInterview
            );


            safeInit(
                "Target",
                initializeTarget
            );


            safeInit(
                "Existing Jobs",
                loadExistingJobs
            );


            safeInit(
                "Remove Old Target Controls",
                removeOldTargetControls
            );


        } else {

            /*
             * Logged-out page.
             */

            safeInit(
                "Login Page Cleanup",
                hideCareerElementsWhenLoggedOut
            );
        }


        /*
         * FINAL SAFETY:
         * Never leave loading screen visible.
         */

        hideLoadingScreen();
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
            boot,
            {
                once: true
            }
        );

    } else {

        boot();
    }

})();
