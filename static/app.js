(() => {
    "use strict";

    /* ============================================================
       SKILL-GAP PREDICTOR
       Main Application JavaScript
       ============================================================ */

    const APP = window.APP_DATA || {};

    const state = {
        loggedIn: Boolean(APP.loggedIn),
        user: APP.user || null,

        careerUrl: APP.careerUrl || "",
        careerJobs: Array.isArray(APP.careerJobs) ? APP.careerJobs : [],

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

    const $ = (id) => document.getElementById(id);

    const qs = (selector, root = document) =>
        root.querySelector(selector);

    const qsa = (selector, root = document) =>
        Array.from(root.querySelectorAll(selector));

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function normalizeSkill(value) {
        return String(value || "")
            .toLowerCase()
            .replace(/[^\w+#./ -]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function normalizeSkills(list) {
        if (!Array.isArray(list)) {
            return [];
        }

        const output = [];
        const seen = new Set();

        list.forEach((skill) => {
            const clean = String(skill || "").trim();
            const key = normalizeSkill(clean);

            if (clean && key && !seen.has(key)) {
                seen.add(key);
                output.push(clean);
            }
        });

        return output;
    }

    function getMessageElement(...ids) {
        for (const id of ids) {
            const element = $(id);

            if (element) {
                return element;
            }
        }

        return null;
    }

    function showMessage(element, message, type = "error") {
        if (!element) {
            return;
        }

        element.textContent = message || "";
        element.style.display = message ? "block" : "none";

        element.classList.remove(
            "alert-error",
            "alert-success",
            "alert-warning",
            "alert-info"
        );

        element.classList.add(
            type === "success"
                ? "alert-success"
                : type === "warning"
                    ? "alert-warning"
                    : type === "info"
                        ? "alert-info"
                        : "alert-error"
        );
    }

    function setLoading(button, loading, loadingText = "Please wait...") {
        if (!button) {
            return;
        }

        if (loading) {
            if (!button.dataset.originalText) {
                button.dataset.originalText = button.innerHTML;
            }

            button.disabled = true;
            button.innerHTML = loadingText;
        } else {
            button.disabled = false;

            if (button.dataset.originalText) {
                button.innerHTML = button.dataset.originalText;
            }
        }
    }

    /* ============================================================
       API
       ============================================================ */

    async function apiRequest(action, data = {}, method = "POST") {
        const options = {
            method,
            headers: {}
        };

        if (method.toUpperCase() === "GET") {
            const params = new URLSearchParams();

            params.append("action", action);

            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(
                        key,
                        typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value)
                    );
                }
            });

            const response = await fetch(
                `api.php?${params.toString()}`,
                {
                    credentials: "same-origin"
                }
            );

            return await response.json();
        }

        const formData =
            data instanceof FormData
                ? data
                : new FormData();

        if (!(data instanceof FormData)) {
            formData.append("action", action);

            Object.entries(data).forEach(([key, value]) => {
                if (value === undefined || value === null) {
                    return;
                }

                if (typeof value === "object") {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, String(value));
                }
            });
        } else if (!formData.has("action")) {
            formData.append("action", action);
        }

        options.body = formData;

        const response = await fetch(
            "api.php",
            {
                ...options,
                credentials: "same-origin"
            }
        );

        const text = await response.text();

        try {
            return JSON.parse(text);
        } catch (error) {
            console.error("Invalid API response:", text);

            return {
                success: false,
                status: "error",
                message: "The server returned an invalid response."
            };
        }
    }

    function apiSuccess(result) {
        return Boolean(
            result &&
            (
                result.success === true ||
                result.status === "success"
            )
        );
    }

    /* ============================================================
       PAGE LOADER
       ============================================================ */

    function hidePageLoader() {
        const loader = $("page-loader");

        if (!loader) {
            return;
        }

        loader.classList.add("hidden");
        loader.classList.add("is-hidden");

        loader.style.opacity = "0";
        loader.style.visibility = "hidden";
        loader.style.pointerEvents = "none";

        setTimeout(() => {
            if (loader) {
                loader.style.display = "none";
            }
        }, 300);
    }

    /* Never leave the loader stuck */
    window.addEventListener("load", () => {
        setTimeout(hidePageLoader, 100);
    });

    /* Safety fallback */
    setTimeout(hidePageLoader, 2500);

    /* ============================================================
       AUTH TABS
       ============================================================ */

    function initAuthTabs() {
        const loginTab =
            $("login-tab") ||
            $("tab-btn-login") ||
            qs("[data-auth-tab='login']");

        const signupTab =
            $("signup-tab") ||
            $("tab-btn-signup") ||
            qs("[data-auth-tab='signup']");

        const loginPanel =
            $("login-panel") ||
            $("form-login-box") ||
            $("login-form-panel") ||
            qs("[data-auth-panel='login']");

        const signupPanel =
            $("signup-panel") ||
            $("form-signup-box") ||
            $("signup-form-panel") ||
            qs("[data-auth-panel='signup']");

        if (!loginPanel || !signupPanel) {
            return;
        }

        function showLogin() {
            loginPanel.style.display = "block";
            signupPanel.style.display = "none";

            if (loginTab) {
                loginTab.classList.add("active");
            }

            if (signupTab) {
                signupTab.classList.remove("active");
            }
        }

        function showSignup() {
            loginPanel.style.display = "none";
            signupPanel.style.display = "block";

            if (loginTab) {
                loginTab.classList.remove("active");
            }

            if (signupTab) {
                signupTab.classList.add("active");
            }
        }

        if (loginTab) {
            loginTab.addEventListener("click", showLogin);
        }

        if (signupTab) {
            signupTab.addEventListener("click", showSignup);
        }

        qsa(
            "#create-account, #create-account-link, .create-account-link, [data-action='create-account']"
        ).forEach((element) => {
            element.addEventListener("click", (event) => {
                event.preventDefault();
                showSignup();
            });
        });

        qsa(
            "#back-to-login, .back-to-login, [data-action='back-login']"
        ).forEach((element) => {
            element.addEventListener("click", (event) => {
                event.preventDefault();
                showLogin();
            });
        });
    }

    /* ============================================================
       LOGIN
       ============================================================ */

    function initLogin() {
        const loginForm = $("login-form");

        const loginButton =
            $("btn-do-login") ||
            $("login-submit");

        const emailInput =
            $("login_email") ||
            $("login-email");

        const passwordInput =
            $("login_password") ||
            $("login-password");

        const errorMessage = getMessageElement(
            "login-error-msg",
            "login-message"
        );

        if (!loginButton || !emailInput || !passwordInput) {
            return;
        }

        async function performLogin(event) {
            if (event) {
                event.preventDefault();
            }

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            showMessage(errorMessage, "");

            if (!email) {
                showMessage(
                    errorMessage,
                    "Please enter your email address."
                );
                return;
            }

            if (!password) {
                showMessage(
                    errorMessage,
                    "Please enter your password."
                );
                return;
            }

            setLoading(
                loginButton,
                true,
                "Signing in..."
            );

            try {
                const result = await apiRequest(
                    "login",
                    {
                        email,
                        password
                    }
                );

                if (apiSuccess(result)) {
                    window.location.href = window.location.pathname;
                    return;
                }

                showMessage(
                    errorMessage,
                    result.message ||
                    "Invalid email or password."
                );
            } catch (error) {
                console.error(error);

                showMessage(
                    errorMessage,
                    "Unable to connect to the server."
                );
            } finally {
                setLoading(loginButton, false);
            }
        }

        if (loginForm) {
            loginForm.addEventListener(
                "submit",
                performLogin
            );
        } else {
            loginButton.addEventListener(
                "click",
                performLogin
            );
        }
    }

    /* ============================================================
       SIGN UP
       ============================================================ */

    function initSignup() {
        const signupForm = $("signup-form");

        const signupButton =
            $("btn-do-signup") ||
            $("signup-submit");

        const nameInput = $("signup_name");
        const emailInput = $("signup_email");
        const passwordInput = $("signup_pwd");

        const universityInput = $("signup_uni");
        const branchInput = $("signup_branch");
        const majorInput = $("signup_major");

        const yearInput =
            $("signup_gradyear") ||
            $("signup_year");

        const linkedinInput =
            $("signup_linkedin");

        const githubInput =
            $("signup_github");

        const termsInput =
            $("signup-terms");

        const errorMessage = getMessageElement(
            "signup-error-msg",
            "signup-message"
        );

        const successMessage = $("signup-success-msg");

        if (!signupButton || !nameInput || !emailInput || !passwordInput) {
            return;
        }

        async function performSignup(event) {
            if (event) {
                event.preventDefault();
            }

            showMessage(errorMessage, "");
            showMessage(successMessage, "");

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            const university =
                universityInput
                    ? universityInput.value.trim()
                    : "";

            const branch =
                branchInput
                    ? branchInput.value.trim()
                    : "";

            const major =
                majorInput
                    ? majorInput.value.trim()
                    : "";

            const graduationYear =
                yearInput
                    ? yearInput.value.trim()
                    : "";

            const linkedin =
                linkedinInput
                    ? linkedinInput.value.trim()
                    : "";

            const github =
                githubInput
                    ? githubInput.value.trim()
                    : "";

            if (!name) {
                showMessage(
                    errorMessage,
                    "Please enter your full name."
                );
                return;
            }

            if (!email) {
                showMessage(
                    errorMessage,
                    "Please enter your email address."
                );
                return;
            }

            if (!/^\S+@\S+\.\S+$/.test(email)) {
                showMessage(
                    errorMessage,
                    "Please enter a valid email address."
                );
                return;
            }

            if (password.length < 6) {
                showMessage(
                    errorMessage,
                    "Password must contain at least 6 characters."
                );
                return;
            }

            if (termsInput && !termsInput.checked) {
                showMessage(
                    errorMessage,
                    "Please accept the terms to create your account."
                );
                return;
            }

            setLoading(
                signupButton,
                true,
                "Creating account..."
            );

            try {
                const result = await apiRequest(
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
                         * IMPORTANT:
                         * No predefined company or role.
                         */
                        target_company: "",
                        target_role: ""
                    }
                );

                if (apiSuccess(result)) {
                    showMessage(
                        successMessage,
                        result.message ||
                        "Account created successfully. You can now log in.",
                        "success"
                    );

                    if (errorMessage) {
                        errorMessage.style.display = "none";
                    }

                    setTimeout(() => {
                        const loginTab =
                            $("login-tab") ||
                            $("tab-btn-login");

                        if (loginTab) {
                            loginTab.click();
                        }
                    }, 1200);

                    return;
                }

                showMessage(
                    errorMessage,
                    result.message ||
                    "Unable to create account."
                );
            } catch (error) {
                console.error(error);

                showMessage(
                    errorMessage,
                    "Registration failed. Please try again."
                );
            } finally {
                setLoading(
                    signupButton,
                    false
                );
            }
        }

        if (signupForm) {
            signupForm.addEventListener(
                "submit",
                performSignup
            );
        } else {
            signupButton.addEventListener(
                "click",
                performSignup
            );
        }
    }

    /* ============================================================
       PASSWORD TOGGLES
       ============================================================ */

    function initPasswordToggles() {
        const togglePairs = [
            ["toggle-login-password", "login_password"],
            ["toggle-signup-password", "signup_pwd"]
        ];

        togglePairs.forEach(([buttonId, inputId]) => {
            const button = $(buttonId);
            const input = $(inputId);

            if (!button || !input) {
                return;
            }

            button.addEventListener("click", () => {
                if (input.type === "password") {
                    input.type = "text";
                    button.textContent = "🙈";
                } else {
                    input.type = "password";
                    button.textContent = "👁️";
                }
            });
        });
    }

    /* ============================================================
       THEME
       ============================================================ */

    function applyTheme(theme) {
        const isDark = theme === "dark";

        document.body.classList.toggle(
            "dark",
            isDark
        );

        document.documentElement.classList.toggle(
            "dark",
            isDark
        );

        document.documentElement.dataset.theme =
            isDark ? "dark" : "light";

        const icon = $("theme-icon");
        const textElement = $("theme-text");

        if (icon) {
            icon.textContent =
                isDark ? "☀️" : "🌙";
        }

        if (textElement) {
            textElement.textContent =
                isDark ? "Light" : "Dark";
        }
    }

    function initTheme() {
        const savedTheme =
            localStorage.getItem("sgp-theme");

        const initialTheme =
            savedTheme === "dark"
                ? "dark"
                : "light";

        applyTheme(initialTheme);

        const toggleButtons = [];

        [
            $("theme-toggle"),
            $("top-theme-toggle")
        ].forEach((button) => {
            if (button && !toggleButtons.includes(button)) {
                toggleButtons.push(button);
            }
        });

        toggleButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const isDark =
                    document.body.classList.contains("dark");

                const nextTheme =
                    isDark ? "light" : "dark";

                localStorage.setItem(
                    "sgp-theme",
                    nextTheme
                );

                applyTheme(nextTheme);
            });
        });
    }

    /* ============================================================
       SIDEBAR
       ============================================================ */

    function initSidebar() {
        const sidebar = qs(".sidebar");

        const menuButtons = [
            $("mobile-menu-toggle"),
            $("menu-toggle")
        ].filter(Boolean);

        const closeButton =
            $("sidebar-close");

        const overlay =
            $("sidebar-overlay");

        if (!sidebar) {
            return;
        }

        function openSidebar() {
            sidebar.classList.add("open");
            sidebar.classList.add("active");
            sidebar.classList.add("show");

            if (overlay) {
                overlay.classList.add("active");
                overlay.classList.add("show");
            }
        }

        function closeSidebar() {
            sidebar.classList.remove("open");
            sidebar.classList.remove("active");
            sidebar.classList.remove("show");

            if (overlay) {
                overlay.classList.remove("active");
                overlay.classList.remove("show");
            }
        }

        menuButtons.forEach((button) => {
            button.addEventListener("click", () => {
                if (
                    sidebar.classList.contains("open") ||
                    sidebar.classList.contains("active")
                ) {
                    closeSidebar();
                } else {
                    openSidebar();
                }
            });
        });

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

        window.addEventListener("resize", () => {
            if (window.innerWidth > 800) {
                closeSidebar();
            }
        });
    }

    /* ============================================================
       NAVIGATION
       ============================================================ */

    function initNavigation() {
        const navItems =
            qsa(".nav-item[data-view]");

        const views =
            qsa(".view-panel");

        if (!navItems.length) {
            return;
        }

        function showView(viewId, clickedItem = null) {
            views.forEach((view) => {
                view.style.display = "none";
                view.classList.remove("active");
            });

            navItems.forEach((item) => {
                item.classList.remove("active");
            });

            const target =
                $(viewId);

            if (target) {
                target.style.display = "block";
                target.classList.add("active");
            }

            if (clickedItem) {
                clickedItem.classList.add("active");
            }

            if (viewId === "view-roadmap") {
                loadDynamicRoadmap();
            }

            if (viewId === "view-interview") {
                loadDynamicInterview();
            }

            if (viewId === "view-analytics") {
                loadMetrics();
            }

            const sidebar =
                qs(".sidebar");

            if (
                sidebar &&
                window.innerWidth <= 800
            ) {
                sidebar.classList.remove("open");
                sidebar.classList.remove("active");
            }
        }

        navItems.forEach((item) => {
            item.addEventListener("click", (event) => {
                event.preventDefault();

                const viewId =
                    item.getAttribute("data-view");

                if (viewId) {
                    showView(
                        viewId,
                        item
                    );
                }
            });
        });

        qsa("[data-open-view]").forEach((button) => {
            button.addEventListener("click", () => {
                const view =
                    button.getAttribute(
                        "data-open-view"
                    );

                if (!view) {
                    return;
                }

                const viewId =
                    view.startsWith("view-")
                        ? view
                        : `view-${view}`;

                const matchingNav =
                    navItems.find(
                        (item) =>
                            item.getAttribute(
                                "data-view"
                            ) === viewId
                    );

                showView(
                    viewId,
                    matchingNav || null
                );
            });
        });
    }

    /* ============================================================
       HIDE CAREER DATA WHEN LOGGED OUT
       ============================================================ */

    function hideCareerElementsWhenLoggedOut() {
        if (state.loggedIn) {
            return;
        }

        [
            "#career-url",
            "#career-url-section",
            "#career-target-section",
            "#career-target-card"
        ].forEach((selector) => {
            qsa(selector).forEach((element) => {
                element.style.display = "none";
            });
        });
    }

    /* ============================================================
       CAREER URL
       ============================================================ */

    function findCareerUrlInput() {
        return (
            $("career-url") ||
            $("input-scrape-url") ||
            $("jobs-career-url")
        );
    }

    function findCareerScrapeButton() {
        return (
            $("scrape-career-url") ||
            $("btn-scrape-url")
        );
    }

    function initCareerUrl() {
        const input =
            findCareerUrlInput();

        const button =
            findCareerScrapeButton();

        if (!input || !button) {
            return;
        }

        if (state.careerUrl) {
            input.value =
                state.careerUrl;
        }

        button.addEventListener(
            "click",
            scrapeCareerUrl
        );
    }

    async function scrapeCareerUrl() {
        const input =
            findCareerUrlInput();

        const button =
            findCareerScrapeButton();

        if (!input || !button) {
            return;
        }

        const url =
            input.value.trim();

        if (!url) {
            alert(
                "Please enter a career or jobs URL."
            );
            return;
        }

        if (
            !/^https?:\/\//i.test(url)
        ) {
            alert(
                "Please enter a valid URL beginning with http:// or https://"
            );
            return;
        }

        setLoading(
            button,
            true,
            "Fetching jobs..."
        );

        try {
            const result =
                await apiRequest(
                    "scrape_url",
                    {
                        url
                    }
                );

            if (!apiSuccess(result)) {
                alert(
                    result.message ||
                    "Unable to analyze this URL."
                );
                return;
            }

            state.careerUrl = url;

            if (Array.isArray(result.jobs)) {
                state.careerJobs =
                    normalizeJobs(
                        result.jobs
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

            if (result.recommended_job) {
                state.recommendedJob =
                    result.recommended_job;
            }

            renderJobs();
            updateTargetUI();
            updateStats();

            await loadMetrics();

            alert(
                result.message ||
                `Successfully analyzed ${state.careerJobs.length} job posting(s).`
            );
        } catch (error) {
            console.error(
                "Career URL error:",
                error
            );

            alert(
                "Unable to connect to the career URL service."
            );
        } finally {
            setLoading(
                button,
                false
            );
        }
    }

    /* ============================================================
       JOB NORMALIZATION
       ============================================================ */

    function normalizeJob(job) {
        if (!job || typeof job !== "object") {
            return null;
        }

        const skills =
            normalizeSkills(
                job.required_skills ||
                job.skills ||
                job.requirements ||
                []
            );

        return {
            id:
                job.id ||
                job.job_id ||
                "",

            title:
                job.title ||
                job.role ||
                job.job_title ||
                "Job Opportunity",

            company:
                job.company ||
                job.company_name ||
                "",

            location:
                job.location ||
                "",

            url:
                job.url ||
                job.link ||
                job.job_url ||
                "",

            description:
                job.description ||
                "",

            skills
        };
    }

    function normalizeJobs(jobs) {
        if (!Array.isArray(jobs)) {
            return [];
        }

        return jobs
            .map(normalizeJob)
            .filter(Boolean);
    }

    /* ============================================================
       JOB MATCHING
       ============================================================ */

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

        const matched =
            required.filter(
                (skill) =>
                    resumeSet.has(
                        normalizeSkill(skill)
                    )
            );

        const missing =
            required.filter(
                (skill) =>
                    !resumeSet.has(
                        normalizeSkill(skill)
                    )
            );

        const score =
            Math.round(
                (matched.length /
                    required.length) *
                    100
            );

        return {
            score,
            matched,
            missing
        };
    }

    function rankJobs(jobs) {
        return jobs
            .map((job) => {
                const match =
                    calculateJobMatch(job);

                return {
                    ...job,
                    matchScore:
                        match.score,
                    matchedSkills:
                        match.matched,
                    missingSkills:
                        match.missing
                };
            })
            .sort(
                (a, b) =>
                    b.matchScore -
                    a.matchScore
            );
    }

    /* ============================================================
       JOB RENDERING
       ============================================================ */

    function renderJobs() {
        const container =
            $("job-results") ||
            $("tbody-job-ranking");

        if (!container) {
            return;
        }

        if (!state.careerJobs.length) {
            if (
                container.tagName === "TBODY"
            ) {
                container.innerHTML = `
                    <tr>
                        <td colspan="7">
                            No jobs have been analyzed yet.
                        </td>
                    </tr>
                `;
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">💼</div>
                        <div class="empty-state-title">
                            No jobs analyzed yet
                        </div>
                        <div class="empty-state-text">
                            Enter a career URL and analyze available jobs.
                        </div>
                    </div>
                `;
            }

            return;
        }

        const ranked =
            rankJobs(
                state.careerJobs
            );

        if (
            container.tagName === "TBODY"
        ) {
            container.innerHTML =
                ranked
                    .map((job) => `
                        <tr>
                            <td>
                                <strong>
                                    ${escapeHtml(job.company)}
                                </strong>
                            </td>
                            <td>
                                ${escapeHtml(job.title)}
                            </td>
                            <td>
                                ${escapeHtml(job.location)}
                            </td>
                            <td>
                                <strong>
                                    ${job.matchScore}%
                                </strong>
                            </td>
                            <td>
                                ${job.matchedSkills.length}
                                /
                                ${
                                    job.matchedSkills.length +
                                    job.missingSkills.length
                                }
                            </td>
                            <td>
                                ${job.matchScore >= 70
                                    ? "High Match"
                                    : job.matchScore >= 40
                                        ? "Moderate Match"
                                        : "Low Match"}
                            </td>
                            <td>
                                ${
                                    job.missingSkills.length
                                        ? escapeHtml(
                                            job.missingSkills.join(", ")
                                        )
                                        : "None"
                                }
                            </td>
                        </tr>
                    `)
                    .join("");

            return;
        }

        container.innerHTML =
            ranked
                .map((job, index) => `
                    <article class="job-card">
                        <div style="
                            display:flex;
                            justify-content:space-between;
                            gap:15px;
                            align-items:flex-start;
                        ">
                            <div>
                                <div class="job-title">
                                    ${escapeHtml(job.title)}
                                </div>

                                <div class="job-company">
                                    ${escapeHtml(job.company)}
                                </div>

                                ${
                                    job.location
                                        ? `
                                            <div class="job-location">
                                                📍
                                                ${escapeHtml(job.location)}
                                            </div>
                                        `
                                        : ""
                                }
                            </div>

                            <span class="match-score">
                                ${job.matchScore}% Match
                            </span>
                        </div>

                        ${
                            job.matchedSkills.length
                                ? `
                                    <div style="margin-top:14px;">
                                        <strong>
                                            Matched Skills
                                        </strong>

                                        <div class="skills-container"
                                             style="margin-top:8px;">
                                            ${job.matchedSkills
                                                .map(
                                                    (skill) =>
                                                        `<span class="skill-tag-matched">
                                                            ${escapeHtml(skill)}
                                                        </span>`
                                                )
                                                .join("")}
                                        </div>
                                    </div>
                                `
                                : ""
                        }

                        ${
                            job.missingSkills.length
                                ? `
                                    <div style="margin-top:14px;">
                                        <strong>
                                            Skill Gaps
                                        </strong>

                                        <div class="skills-container"
                                             style="margin-top:8px;">
                                            ${job.missingSkills
                                                .map(
                                                    (skill) =>
                                                        `<span class="skill-tag-missing">
                                                            ${escapeHtml(skill)}
                                                        </span>`
                                                )
                                                .join("")}
                                        </div>
                                    </div>
                                `
                                : ""
                        }

                        ${
                            job.url
                                ? `
                                    <div style="margin-top:15px;">
                                        <a
                                            href="${escapeHtml(job.url)}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="btn btn-sm"
                                        >
                                            View Job
                                        </a>
                                    </div>
                                `
                                : ""
                        }
                    </article>
                `)
                .join("");

        updateRecommendation(ranked[0]);
    }

    /* ============================================================
       RECOMMENDATION
       ============================================================ */

    function updateRecommendation(job = null) {
        const card =
            $("recommendation-card") ||
            $("recommended-job") ||
            $("job-recommendation") ||
            $("recommendedJob");

        if (!card) {
            return;
        }

        if (!job) {
            card.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-title">
                        No career recommendation yet
                    </div>
                    <div class="empty-state-text">
                        Analyze a career URL and upload your resume first.
                    </div>
                </div>
            `;

            return;
        }

        state.recommendedJob = job;

        card.innerHTML = `
            <div class="recommendation-title">
                Recommended Job Match
            </div>

            <div class="recommendation-role">
                ${escapeHtml(job.title)}
            </div>

            ${
                job.company
                    ? `
                        <div style="
                            margin-top:4px;
                            color:var(--text-muted);
                        ">
                            ${escapeHtml(job.company)}
                        </div>
                    `
                    : ""
            }

            <div style="margin-top:12px;">
                <span class="match-score">
                    ${job.matchScore}% Skill Match
                </span>
            </div>

            ${
                job.matchedSkills.length
                    ? `
                        <div style="margin-top:15px;">
                            <strong>Matched Skills</strong>

                            <div class="skills-container"
                                 style="margin-top:8px;">
                                ${job.matchedSkills
                                    .map(
                                        (skill) =>
                                            `<span class="skill-tag-matched">
                                                ${escapeHtml(skill)}
                                            </span>`
                                    )
                                    .join("")}
                            </div>
                        </div>
                    `
                    : ""
            }

            ${
                job.missingSkills.length
                    ? `
                        <div style="margin-top:15px;">
                            <strong>Skills to Develop</strong>

                            <div class="skills-container"
                                 style="margin-top:8px;">
                                ${job.missingSkills
                                    .map(
                                        (skill) =>
                                            `<span class="skill-tag-missing">
                                                ${escapeHtml(skill)}
                                            </span>`
                                    )
                                    .join("")}
                            </div>
                        </div>
                    `
                    : ""
            }
        `;
    }

    /* ============================================================
       RESUME UPLOAD
       ============================================================ */

    function initResumeUpload() {
        const input =
            $("resume-file");

        const dropZone =
            $("resume-drop-zone");

        const evaluateButton =
            $("evaluate-resume");

        if (!input) {
            return;
        }

        input.addEventListener(
            "change",
            () => {
                if (input.files.length) {
                    uploadResume(
                        input.files[0],
                        evaluateButton
                    );
                }
            }
        );

        if (dropZone) {
            dropZone.addEventListener(
                "dragover",
                (event) => {
                    event.preventDefault();
                    dropZone.classList.add("drag-over");
                }
            );

            dropZone.addEventListener(
                "dragleave",
                () => {
                    dropZone.classList.remove(
                        "drag-over"
                    );
                }
            );

            dropZone.addEventListener(
                "drop",
                (event) => {
                    event.preventDefault();

                    dropZone.classList.remove(
                        "drag-over"
                    );

                    const files =
                        event.dataTransfer.files;

                    if (files.length) {
                        uploadResume(
                            files[0],
                            evaluateButton
                        );
                    }
                }
            );
        }

        if (evaluateButton) {
            evaluateButton.addEventListener(
                "click",
                () => {
                    if (input.files.length) {
                        uploadResume(
                            input.files[0],
                            evaluateButton
                        );
                    } else {
                        alert(
                            "Please select a resume first."
                        );
                    }
                }
            );
        }
    }

    async function uploadResume(
        file,
        button = null
    ) {
        if (!file) {
            return;
        }

        const allowed =
            [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ];

        const extension =
            file.name
                .split(".")
                .pop()
                .toLowerCase();

        if (
            !allowed.includes(file.type) &&
            !["pdf", "doc", "docx"].includes(
                extension
            )
        ) {
            alert(
                "Please upload a PDF, DOC, or DOCX resume."
            );

            return;
        }

        const formData =
            new FormData();

        formData.append(
            "action",
            "upload_resume"
        );

        formData.append(
            "resume",
            file
        );

        if (button) {
            setLoading(
                button,
                true,
                "Analyzing Resume..."
            );
        }

        try {
            const result =
                await apiRequest(
                    "upload_resume",
                    formData
                );

            if (!apiSuccess(result)) {
                alert(
                    result.message ||
                    "Resume analysis failed."
                );

                return;
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
                result.ats_score !== undefined
            ) {
                state.atsScore =
                    Number(
                        result.ats_score
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

            renderExtractedSkills();
            renderATS();
            updateStats();
            renderJobs();

            await loadMetrics();

            alert(
                result.message ||
                "Resume analyzed successfully."
            );
        } catch (error) {
            console.error(
                "Resume upload error:",
                error
            );

            alert(
                "Unable to analyze the resume."
            );
        } finally {
            if (button) {
                setLoading(
                    button,
                    false
                );
            }
        }
    }

    /* ============================================================
       SKILLS DISPLAY
       ============================================================ */

    function renderExtractedSkills() {
        const containers = [
            $("extracted-skills"),
            $("extracted-skills-tags"),
            $("resume-skills"),
            $("skills-container")
        ].filter(Boolean);

        if (!containers.length) {
            return;
        }

        const skills =
            normalizeSkills(
                state.extractedSkills
            );

        const html =
            skills.length
                ? skills
                    .map(
                        (skill) =>
                            `<span class="skill-tag-matched">
                                ${escapeHtml(skill)}
                            </span>`
                    )
                    .join("")
                : `
                    <span class="text-muted">
                        No skills extracted yet.
                    </span>
                `;

        containers.forEach(
            (container) => {
                container.innerHTML =
                    html;
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
                        state.atsScore || 0
                    )
                )
            );

        [
            $("stat-ats"),
            $("metric-ats"),
            $("ats-score"),
            $("ats-score-value")
        ]
            .filter(Boolean)
            .forEach((element) => {
                element.textContent =
                    `${Math.round(score)}`;
            });

        const circle =
            $(".ats-circle");

        if (circle) {
            circle.style.setProperty(
                "--ats-progress",
                `${score}%`
            );
        }
    }

    /* ============================================================
       TARGET UI
       ============================================================ */

    function updateTargetUI() {
        const company =
            state.targetCompany;

        const role =
            state.targetRole;

        const title =
            $("banner-company-role");

        if (title) {
            if (company && role) {
                title.textContent =
                    `${company} · ${role}`;
            } else if (role) {
                title.textContent =
                    role;
            } else if (company) {
                title.textContent =
                    company;
            } else {
                title.textContent =
                    "Career Target Not Selected";
            }
        }

        [
            $("target-company"),
            $("selected-company"),
            $("profile-target-company")
        ]
            .filter(Boolean)
            .forEach((element) => {
                element.textContent =
                    company ||
                    "Not selected";
            });

        [
            $("target-role"),
            $("selected-role"),
            $("profile-target-role")
        ]
            .filter(Boolean)
            .forEach((element) => {
                element.textContent =
                    role ||
                    "Not selected";
            });
    }

    /* ============================================================
       METRICS
       ============================================================ */

    async function loadMetrics() {
        if (!state.loggedIn) {
            return;
        }

        try {
            const result =
                await apiRequest(
                    "get_metrics",
                    {},
                    "GET"
                );

            if (!apiSuccess(result)) {
                return;
            }

            window.LATEST_METRICS =
                result.metrics ||
                result.data ||
                result;

            const metrics =
                window.LATEST_METRICS;

            if (
                metrics.ats_score !== undefined
            ) {
                state.atsScore =
                    Number(
                        metrics.ats_score
                    );
            }

            if (
                Array.isArray(
                    metrics.extracted_skills
                )
            ) {
                state.extractedSkills =
                    normalizeSkills(
                        metrics.extracted_skills
                    );
            }

            if (
                Array.isArray(
                    metrics.required_skills
                )
            ) {
                state.requiredSkills =
                    normalizeSkills(
                        metrics.required_skills
                    );
            }

            renderATS();
            renderExtractedSkills();
            updateStats();

            renderMetricSkills(
                metrics
            );
        } catch (error) {
            console.error(
                "Metrics error:",
                error
            );
        }
    }

    function renderMetricSkills(metrics) {
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

        const matchedBox =
            $("matched-skills-tags");

        const missingBox =
            $("missing-skills-tags");

        if (matchedBox) {
            matchedBox.innerHTML =
                matched.length
                    ? matched
                        .map(
                            (skill) =>
                                `<span class="skill-tag-matched">
                                    ${escapeHtml(skill)}
                                </span>`
                        )
                        .join("")
                    : `
                        <span class="text-muted">
                            No matching skills detected.
                        </span>
                    `;
        }

        if (missingBox) {
            missingBox.innerHTML =
                missing.length
                    ? missing
                        .map(
                            (skill) =>
                                `<span class="skill-tag-missing">
                                    ${escapeHtml(skill)}
                                </span>`
                        )
                        .join("")
                    : `
                        <span class="text-success">
                            All currently required skills matched.
                        </span>
                    `;
        }
    }

    function updateStats() {
        const ranked =
            rankJobs(
                state.careerJobs
            );

        const bestMatch =
            ranked.length
                ? ranked[0].matchScore
                : 0;

        const values = {
            "stat-skills":
                state.extractedSkills.length,

            "stat-ats":
                Math.round(
                    state.atsScore || 0
                ),

            "stat-jobs":
                state.careerJobs.length,

            "stat-match":
                bestMatch
        };

        Object.entries(values)
            .forEach(
                ([id, value]) => {
                    const element = $(id);

                    if (element) {
                        element.textContent =
                            value;
                    }
                }
            );
    }

    /* ============================================================
       JOB RANKING BUTTON
       ============================================================ */

    function initJobRanking() {
        const button =
            $("rank-career-jobs");

        if (!button) {
            return;
        }

        button.addEventListener(
            "click",
            async () => {
                const urlInput =
                    $("jobs-career-url") ||
                    $("career-url");

                const url =
                    urlInput
                        ? urlInput.value.trim()
                        : state.careerUrl;

                if (url) {
                    state.careerUrl =
                        url;

                    await scrapeCareerUrl();
                    return;
                }

                renderJobs();
            }
        );
    }

    /* ============================================================
       ROADMAP
       ============================================================ */

    async function loadDynamicRoadmap() {
        const roadmapContainer =
            $("container-dynamic-roadmap") ||
            $("roadmap-content");

        const resourcesContainer =
            $("container-dynamic-resources");

        if (!roadmapContainer) {
            return;
        }

        const metrics =
            window.LATEST_METRICS || {};

        const missingSkills =
            Array.isArray(
                metrics.missing_skills
            )
                ? metrics.missing_skills
                : state.requiredSkills.filter(
                    (skill) =>
                        !state.extractedSkills
                            .map(normalizeSkill)
                            .includes(
                                normalizeSkill(skill)
                            )
                );

        roadmapContainer.innerHTML = `
            <div class="empty-state">
                <div class="loader-ring"
                     style="
                        width:30px;
                        height:30px;
                        margin:auto;
                     ">
                </div>

                <div class="empty-state-text">
                    Building your personalized roadmap...
                </div>
            </div>
        `;

        try {
            const result =
                await apiRequest(
                    "get_roadmap",
                    {
                        missing_skills:
                            missingSkills,
                        target_company:
                            state.targetCompany,
                        target_role:
                            state.targetRole
                    }
                );

            if (!apiSuccess(result)) {
                roadmapContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-title">
                            Roadmap unavailable
                        </div>

                        <div class="empty-state-text">
                            ${
                                escapeHtml(
                                    result.message ||
                                    "No roadmap could be generated."
                                )
                            }
                        </div>
                    </div>
                `;

                return;
            }

            const roadmap =
                result.roadmap ||
                result.data ||
                {};

            const phases =
                Array.isArray(
                    roadmap.phases
                )
                    ? roadmap.phases
                    : [];

            if (!phases.length) {
                roadmapContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-title">
                            No roadmap data available
                        </div>
                    </div>
                `;
            } else {
                roadmapContainer.innerHTML =
                    phases
                        .map(
                            (phase, index) => `
                                <div class="roadmap-phase-card">
                                    <div class="roadmap-phase-title">
                                        ${escapeHtml(
                                            phase.phase ||
                                            `Phase ${index + 1}`
                                        )}

                                        ${
                                            phase.objective
                                                ? `
                                                    — ${escapeHtml(
                                                        phase.objective
                                                    )}
                                                `
                                                : ""
                                        }
                                    </div>

                                    ${
                                        phase.duration
                                            ? `
                                                <div class="roadmap-phase-duration">
                                                    ⏱️
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
                                                <div class="skills-container"
                                                     style="margin-bottom:10px;">
                                                    ${phase.skills
                                                        .map(
                                                            (skill) =>
                                                                `<span class="skill-tag">
                                                                    ${escapeHtml(skill)}
                                                                </span>`
                                                        )
                                                        .join("")}
                                                </div>
                                            `
                                            : ""
                                    }

                                    ${
                                        Array.isArray(
                                            phase.action_items
                                        ) &&
                                        phase.action_items.length
                                            ? `
                                                <ul style="
                                                    padding-left:20px;
                                                    color:var(--text-secondary);
                                                ">
                                                    ${phase.action_items
                                                        .map(
                                                            (item) =>
                                                                `<li>
                                                                    ${escapeHtml(item)}
                                                                </li>`
                                                        )
                                                        .join("")}
                                                </ul>
                                            `
                                            : ""
                                    }
                                </div>
                            `
                        )
                        .join("");
            }

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
                    resources.length
                        ? resources
                            .map(
                                (resource) => `
                                    <details>
                                        <summary>
                                            📚
                                            ${escapeHtml(
                                                resource.skill ||
                                                "Recommended Resource"
                                            )}
                                        </summary>

                                        <div style="padding-top:12px;">
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
                                                                Time:
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
                                                                href="${escapeHtml(resource.docs)}"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                class="extracted-link"
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
                                                        <p style="margin-top:8px;">
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
                                `
                            )
                            .join("")
                        : `
                            <p class="text-muted">
                                No additional resources available.
                            </p>
                        `;
            }
        } catch (error) {
            console.error(
                "Roadmap error:",
                error
            );

            roadmapContainer.innerHTML = `
                <div class="alert alert-error">
                    Unable to load the career roadmap.
                </div>
            `;
        }
    }

    /* ============================================================
       INTERVIEW PREPARATION
       ============================================================ */

    async function loadDynamicInterview() {
        const container =
            $("container-dynamic-interview");

        if (!container) {
            return;
        }

        const metrics =
            window.LATEST_METRICS || {};

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

        container.innerHTML = `
            <div class="empty-state">
                <div class="loader-ring"
                     style="
                        width:30px;
                        height:30px;
                        margin:auto;
                     ">
                </div>

                <div class="empty-state-text">
                    Preparing personalized interview questions...
                </div>
            </div>
        `;

        try {
            const result =
                await apiRequest(
                    "get_interview",
                    {
                        target_company:
                            state.targetCompany,

                        target_role:
                            state.targetRole,

                        matched_skills:
                            matchedSkills,

                        missing_skills:
                            missingSkills
                    }
                );

            if (!apiSuccess(result)) {
                container.innerHTML = `
                    <div class="alert alert-error">
                        ${
                            escapeHtml(
                                result.message ||
                                "Interview preparation is unavailable."
                            )
                        }
                    </div>
                `;

                return;
            }

            const prep =
                result.prep_data ||
                result.interview ||
                result.data ||
                {};

            let html = "";

            if (
                Array.isArray(
                    prep.technical_known
                ) &&
                prep.technical_known.length
            ) {
                html += `
                    <h4 class="card-title">
                        Technical Questions
                    </h4>
                `;

                html +=
                    prep.technical_known
                        .map(
                            (item, index) => `
                                <details style="margin-bottom:12px;">
                                    <summary>
                                        Q${index + 1} —
                                        ${escapeHtml(
                                            item.skill || ""
                                        )}

                                        ${
                                            item.q
                                                ? `: ${escapeHtml(item.q)}`
                                                : ""
                                        }
                                    </summary>

                                    <div style="
                                        padding-top:12px;
                                        color:var(--text-secondary);
                                    ">
                                        ${
                                            item.a
                                                ? `
                                                    <p>
                                                        <strong>
                                                            Answer:
                                                        </strong>
                                                        ${escapeHtml(item.a)}
                                                    </p>
                                                `
                                                : ""
                                        }

                                        ${
                                            item.tip
                                                ? `
                                                    <p style="
                                                        margin-top:8px;
                                                    ">
                                                        <strong>
                                                            Tip:
                                                        </strong>
                                                        ${escapeHtml(item.tip)}
                                                    </p>
                                                `
                                                : ""
                                        }
                                    </div>
                                </details>
                            `
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
                    <h4 class="card-title"
                        style="margin-top:24px;">
                        Skill-Gap Questions
                    </h4>
                `;

                html +=
                    prep.gap_questions
                        .map(
                            (item, index) => `
                                <details style="margin-bottom:12px;">
                                    <summary>
                                        Gap Question ${index + 1}
                                        ${
                                            item.skill
                                                ? ` — ${escapeHtml(item.skill)}`
                                                : ""
                                        }
                                    </summary>

                                    <div style="
                                        padding-top:12px;
                                        color:var(--text-secondary);
                                    ">
                                        ${
                                            item.q
                                                ? `
                                                    <p>
                                                        <strong>
                                                            Question:
                                                        </strong>
                                                        ${escapeHtml(item.q)}
                                                    </p>
                                                `
                                                : ""
                                        }

                                        ${
                                            item.a
                                                ? `
                                                    <p style="margin-top:8px;">
                                                        <strong>
                                                            Answer:
                                                        </strong>
                                                        ${escapeHtml(item.a)}
                                                    </p>
                                                `
                                                : ""
                                        }
                                    </div>
                                </details>
                            `
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
                    <h4 class="card-title"
                        style="margin-top:24px;">
                        HR & Behavioral Questions
                    </h4>
                `;

                html +=
                    prep.behavioral
                        .map(
                            (item, index) => `
                                <details style="margin-bottom:12px;">
                                    <summary>
                                        HR Question ${index + 1}
                                    </summary>

                                    <div style="
                                        padding-top:12px;
                                        color:var(--text-secondary);
                                    ">
                                        ${
                                            item.q
                                                ? `
                                                    <p>
                                                        <strong>
                                                            Question:
                                                        </strong>
                                                        ${escapeHtml(item.q)}
                                                    </p>
                                                `
                                                : ""
                                        }

                                        ${
                                            item.framework
                                                ? `
                                                    <p style="margin-top:8px;">
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
                                                    <p style="margin-top:8px;">
                                                        <strong>
                                                            Guide:
                                                        </strong>
                                                        ${escapeHtml(
                                                            item.guide
                                                        )}
                                                    </p>
                                                `
                                                : ""
                                        }
                                    </div>
                                </details>
                            `
                        )
                        .join("");
            }

            if (!html) {
                html = `
                    <div class="empty-state">
                        <div class="empty-state-title">
                            No interview questions available yet
                        </div>
                    </div>
                `;
            }

            container.innerHTML =
                html;
        } catch (error) {
            console.error(
                "Interview error:",
                error
            );

            container.innerHTML = `
                <div class="alert alert-error">
                    Unable to load interview preparation.
                </div>
            `;
        }
    }

    /* ============================================================
       AI INTERVIEW TABS
       ============================================================ */

    function initAIInterviewTabs() {
        const tabs = [
            [
                "tab-btn-ai-assistant",
                "subtab-ai-assistant"
            ],
            [
                "tab-btn-ai-evaluator",
                "subtab-ai-evaluator"
            ],
            [
                "tab-btn-ai-questions",
                "subtab-ai-questions"
            ]
        ];

        const available =
            tabs.filter(
                ([tabId, panelId]) =>
                    $(tabId) &&
                    $(panelId)
            );

        available.forEach(
            ([tabId, panelId]) => {
                $(tabId).addEventListener(
                    "click",
                    () => {
                        available.forEach(
                            ([otherTab, otherPanel]) => {
                                $(otherTab)
                                    .classList
                                    .remove(
                                        "active"
                                    );

                                $(otherPanel)
                                    .style
                                    .display =
                                    "none";
                            }
                        );

                        $(tabId)
                            .classList
                            .add("active");

                        $(panelId)
                            .style
                            .display =
                            "block";

                        if (
                            panelId ===
                            "subtab-ai-questions"
                        ) {
                            loadDynamicInterview();
                        }
                    }
                );
            }
        );
    }

    /* ============================================================
       AI INTERVIEW ASSISTANT
       ============================================================ */

    function initAIInterviewAssistant() {
        const input =
            $("input-ai-prompt");

        const submit =
            $("btn-submit-ai-prompt");

        const responseCard =
            $("ai-assistant-response-card");

        const responseTitle =
            $("ai-response-title");

        const responseBody =
            $("ai-response-body");

        if (
            !input ||
            !submit ||
            !responseCard ||
            !responseBody
        ) {
            return;
        }

        async function askAI() {
            const prompt =
                input.value.trim();

            if (!prompt) {
                return;
            }

            responseCard.style.display =
                "block";

            if (responseTitle) {
                responseTitle.textContent =
                    "Generating response...";
            }

            responseBody.innerHTML = `
                <p class="text-muted">
                    Processing your interview question...
                </p>
            `;

            setLoading(
                submit,
                true,
                "Thinking..."
            );

            try {
                const result =
                    await apiRequest(
                        "ask_interview_ai",
                        {
                            prompt,
                            target_company:
                                state.targetCompany,

                            target_role:
                                state.targetRole,

                            matched_skills:
                                state.extractedSkills,

                            missing_skills:
                                state.requiredSkills
                        }
                    );

                if (!apiSuccess(result)) {
                    responseBody.innerHTML = `
                        <div class="alert alert-error">
                            ${
                                escapeHtml(
                                    result.message ||
                                    "Unable to generate an answer."
                                )
                            }
                        </div>
                    `;

                    return;
                }

                if (responseTitle) {
                    responseTitle.textContent =
                        result.title ||
                        "AI Interview Guidance";
                }

                const steps =
                    Array.isArray(
                        result.advice_steps
                    )
                        ? result.advice_steps
                        : [];

                let html = "";

                if (result.answer) {
                    html += `
                        <div style="
                            color:var(--text-secondary);
                            line-height:1.7;
                        ">
                            ${escapeHtml(
                                result.answer
                            )}
                        </div>
                    `;
                }

                if (steps.length) {
                    html += `
                        <h4 style="margin-top:18px;">
                            Recommended Approach
                        </h4>

                        <ol style="
                            padding-left:20px;
                            color:var(--text-secondary);
                        ">
                            ${steps
                                .map(
                                    (step) =>
                                        `<li>
                                            ${escapeHtml(step)}
                                        </li>`
                                )
                                .join("")}
                        </ol>
                    `;
                }

                if (result.sample_question) {
                    html += `
                        <div style="
                            margin-top:18px;
                            padding:15px;
                            border-radius:12px;
                            background:var(--surface-soft);
                            border:1px solid var(--border);
                        ">
                            <strong>
                                Practice Question
                            </strong>

                            <p style="margin-top:7px;">
                                ${escapeHtml(
                                    result.sample_question
                                )}
                            </p>
                        </div>
                    `;
                }

                responseBody.innerHTML =
                    html ||
                    `
                        <p class="text-muted">
                            No response was generated.
                        </p>
                    `;
            } catch (error) {
                console.error(
                    "AI interview error:",
                    error
                );

                responseBody.innerHTML = `
                    <div class="alert alert-error">
                        Unable to connect to the AI service.
                    </div>
                `;
            } finally {
                setLoading(
                    submit,
                    false
                );
            }
        }

        submit.addEventListener(
            "click",
            askAI
        );

        input.addEventListener(
            "keydown",
            (event) => {
                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {
                    event.preventDefault();
                    askAI();
                }
            }
        );

        qsa(".ai-preset-btn")
            .forEach((button) => {
                button.addEventListener(
                    "click",
                    () => {
                        const query =
                            button.getAttribute(
                                "data-query"
                            ) ||
                            button.textContent.trim();

                        input.value =
                            query;

                        askAI();
                    }
                );
            });
    }

    /* ============================================================
       ANSWER EVALUATOR
       ============================================================ */

    function initAnswerEvaluator() {
        const submit =
            $("btn-submit-eval-answer");

        if (!submit) {
            return;
        }

        submit.addEventListener(
            "click",
            async () => {
                const select =
                    $("select-eval-question");

                const customQuestion =
                    $("input-eval-custom-q");

                const answer =
                    $("input-eval-user-answer");

                const resultCard =
                    $("ai-evaluator-result-card");

                if (!answer) {
                    return;
                }

                const userAnswer =
                    answer.value.trim();

                if (!userAnswer) {
                    alert(
                        "Please type your answer first."
                    );
                    return;
                }

                let question =
                    select
                        ? select.value
                        : "";

                if (
                    question === "custom" &&
                    customQuestion
                ) {
                    question =
                        customQuestion.value.trim();
                }

                setLoading(
                    submit,
                    true,
                    "Evaluating..."
                );

                try {
                    const result =
                        await apiRequest(
                            "evaluate_answer",
                            {
                                question,
                                answer:
                                    userAnswer,

                                target_company:
                                    state.targetCompany,

                                target_role:
                                    state.targetRole
                            }
                        );

                    if (!apiSuccess(result)) {
                        alert(
                            result.message ||
                            "Answer evaluation failed."
                        );

                        return;
                    }

                    if (resultCard) {
                        resultCard.style.display =
                            "block";
                    }

                    setText(
                        "eval-overall-score-display",
                        `Score: ${
                            result.score ??
                            result.overall_score ??
                            0
                        } / 100`
                    );

                    setText(
                        "eval-rating-badge",
                        result.rating ||
                        "Evaluation Complete"
                    );

                    setText(
                        "eval-score-tech",
                        result.technical_score ??
                        "-"
                    );

                    setText(
                        "eval-score-kw",
                        result.keyword_score ??
                        "-"
                    );

                    setText(
                        "eval-score-struct",
                        result.structure_score ??
                        "-"
                    );

                    setText(
                        "eval-score-rel",
                        result.relevance_score ??
                        "-"
                    );

                    setText(
                        "eval-score-comp",
                        result.completeness_score ??
                        "-"
                    );

                    const strengths =
                        $("eval-strengths-list");

                    if (strengths) {
                        strengths.innerHTML =
                            (
                                Array.isArray(
                                    result.strengths
                                )
                                    ? result.strengths
                                    : []
                            )
                                .map(
                                    (item) =>
                                        `<li>
                                            ${escapeHtml(item)}
                                        </li>`
                                )
                                .join("");
                    }

                    const missing =
                        $("eval-missing-list");

                    if (missing) {
                        missing.innerHTML =
                            (
                                Array.isArray(
                                    result.improvements
                                )
                                    ? result.improvements
                                    : []
                            )
                                .map(
                                    (item) =>
                                        `<li>
                                            ${escapeHtml(item)}
                                        </li>`
                                )
                                .join("");
                    }

                    setText(
                        "eval-ideal-answer",
                        result.ideal_answer ||
                        result.feedback ||
                        ""
                    );
                } catch (error) {
                    console.error(
                        "Evaluation error:",
                        error
                    );

                    alert(
                        "Unable to evaluate the answer."
                    );
                } finally {
                    setLoading(
                        submit,
                        false
                    );
                }
            }
        );
    }

    function setText(id, value) {
        const element = $(id);

        if (element) {
            element.textContent =
                value ?? "";
        }
    }

    /* ============================================================
       PROFILE
       ============================================================ */

    function initProfileForm() {
        const form =
            $("profile-form") ||
            $("form-update-profile");

        if (!form) {
            return;
        }

        form.addEventListener(
            "submit",
            async (event) => {
                event.preventDefault();

                const formData =
                    new FormData(form);

                formData.append(
                    "action",
                    "update_profile"
                );

                const message =
                    $("profile-message");

                try {
                    const result =
                        await apiRequest(
                            "update_profile",
                            formData
                        );

                    if (apiSuccess(result)) {
                        showMessage(
                            message,
                            result.message ||
                            "Profile updated successfully.",
                            "success"
                        );

                        if (result.user) {
                            state.user =
                                result.user;
                        }
                    } else {
                        showMessage(
                            message,
                            result.message ||
                            "Unable to update profile."
                        );
                    }
                } catch (error) {
                    console.error(error);

                    showMessage(
                        message,
                        "Unable to update profile."
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
            [
                $("logout-button"),
                $("btn-logout")
            ].filter(Boolean);

        buttons.forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    async () => {
                        button.disabled =
                            true;

                        try {
                            await apiRequest(
                                "logout",
                                {},
                                "GET"
                            );
                        } catch (error) {
                            console.error(error);
                        }

                        window.location.href =
                            window.location.pathname;
                    }
                );
            }
        );
    }

    /* ============================================================
       REPORT
       ============================================================ */

    function initReportForm() {
        const form =
            $("report-form");

        if (!form) {
            return;
        }

        form.addEventListener(
            "submit",
            (event) => {
                /*
                 * Allow the PHP form to submit normally.
                 * Only make sure dynamic target data is used.
                 */

                const company =
                    form.querySelector(
                        "[name='target_company']"
                    );

                const role =
                    form.querySelector(
                        "[name='target_role']"
                    );

                if (company) {
                    company.value =
                        state.targetCompany;
                }

                if (role) {
                    role.value =
                        state.targetRole;
                }
            }
        );
    }

    /* ============================================================
       DYNAMIC TARGET DATA
       ============================================================ */

    function initializeTarget() {
        updateTargetUI();

        if (state.careerUrl) {
            const input =
                findCareerUrlInput();

            if (input) {
                input.value =
                    state.careerUrl;
            }
        }

        state.extractedSkills =
            normalizeSkills(
                state.extractedSkills
            );

        state.requiredSkills =
            normalizeSkills(
                state.requiredSkills
            );

        state.careerJobs =
            normalizeJobs(
                state.careerJobs
            );

        renderExtractedSkills();
        renderATS();
        renderJobs();
        updateStats();
    }

    /* ============================================================
       FAVICON FALLBACK
       ============================================================ */

    function fixFavicon404() {
        const existing =
            document.querySelector(
                "link[rel~='icon']"
            );

        if (existing) {
            return;
        }

        /*
         * Uses a data URI, so the browser does not request
         * /favicon.ico from the server.
         */
        const favicon =
            document.createElement("link");

        favicon.rel = "icon";
        favicon.type = "image/svg+xml";

        favicon.href =
            "data:image/svg+xml," +
            encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg"
                     viewBox="0 0 64 64">
                    <rect width="64"
                          height="64"
                          rx="14"
                          fill="#635bff"/>
                    <text x="32"
                          y="43"
                          text-anchor="middle"
                          font-size="34"
                          fill="white">
                        S
                    </text>
                </svg>
            `);

        document.head.appendChild(
            favicon
        );
    }

    /* ============================================================
       SAFE INITIALIZATION
       ============================================================ */

    function safeInit(name, fn) {
        try {
            fn();
        } catch (error) {
            console.error(
                `Initialization error: ${name}`,
                error
            );
        }
    }

    /* ============================================================
       BOOT
       ============================================================ */

    function boot() {
        safeInit(
            "favicon",
            fixFavicon404
        );

        safeInit(
            "auth tabs",
            initAuthTabs
        );

        safeInit(
            "login",
            initLogin
        );

        safeInit(
            "signup",
            initSignup
        );

        safeInit(
            "password toggles",
            initPasswordToggles
        );

        safeInit(
            "theme",
            initTheme
        );

        safeInit(
            "sidebar",
            initSidebar
        );

        safeInit(
            "navigation",
            initNavigation
        );

        safeInit(
            "career URL",
            initCareerUrl
        );

        safeInit(
            "resume upload",
            initResumeUpload
        );

        safeInit(
            "job ranking",
            initJobRanking
        );

        safeInit(
            "profile",
            initProfileForm
        );

        safeInit(
            "AI interview tabs",
            initAIInterviewTabs
        );

        safeInit(
            "AI interview assistant",
            initAIInterviewAssistant
        );

        safeInit(
            "answer evaluator",
            initAnswerEvaluator
        );

        safeInit(
            "logout",
            initLogout
        );

        safeInit(
            "report",
            initReportForm
        );

        safeInit(
            "target initialization",
            initializeTarget
        );

        hideCareerElementsWhenLoggedOut();

        if (state.loggedIn) {
            loadMetrics();
        }

        hidePageLoader();
    }

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
