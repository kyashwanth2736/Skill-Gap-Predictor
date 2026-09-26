(() => {
    "use strict";

    /* ============================================================
       SKILL GAP PREDICTOR - MAIN FRONTEND SCRIPT
       ============================================================ */

    const APP = window.APP_DATA || {};

    const state = {
        loggedIn: !!APP.loggedIn,
        user: APP.user || null,
        careerJobs: Array.isArray(APP.careerJobs) ? APP.careerJobs : [],
        extractedSkills: Array.isArray(APP.extractedSkills)
            ? APP.extractedSkills
            : [],
        requiredSkills: Array.isArray(APP.requiredSkills)
            ? APP.requiredSkills
            : [],
        atsScore: Number(APP.atsScore || 0),
        recommendedJob: APP.recommendedJob || null,
        targetCompany: APP.targetCompany || "",
        targetRole: APP.targetRole || "",
        currentView: "dashboard"
    };

    /* ============================================================
       BASIC HELPERS
       ============================================================ */

    function $(id) {
        return document.getElementById(id);
    }

    function qs(selector, parent) {
        return (parent || document).querySelector(selector);
    }

    function qsa(selector, parent) {
        return Array.from((parent || document).querySelectorAll(selector));
    }

    function safeText(value) {
        return value == null ? "" : String(value);
    }

    function escapeHtml(value) {
        return safeText(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function normalizeSkill(skill) {
        return safeText(skill)
            .toLowerCase()
            .replace(/[^a-z0-9+#.\- ]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function normalizeSkills(skills) {
        if (!Array.isArray(skills)) return [];

        const result = [];

        skills.forEach(skill => {
            const value = typeof skill === "string"
                ? skill
                : skill?.name || skill?.skill || skill?.title || "";

            const cleaned = value.trim();

            if (
                cleaned &&
                !result.some(x => normalizeSkill(x) === normalizeSkill(cleaned))
            ) {
                result.push(cleaned);
            }
        });

        return result;
    }

    function showMessage(element, message, type = "info") {
        if (!element) return;

        element.textContent = message;
        element.className = "form-message " + type;

        element.style.display = message ? "block" : "none";
    }

    function setButtonLoading(button, loading, normalText) {
        if (!button) return;

        if (loading) {
            button.dataset.originalText =
                button.textContent || normalText || "Submit";

            button.disabled = true;
            button.textContent = "Loading...";
        } else {
            button.disabled = false;
            button.textContent =
                button.dataset.originalText || normalText || "Submit";
        }
    }

    /* ============================================================
       LOADING SCREEN
       ============================================================ */

    function hideLoadingScreen() {
        const selectors = [
            "#app-loading",
            "#loading-screen",
            "#loading-overlay",
            ".app-loading",
            ".loading-screen",
            ".loading-overlay",
            ".preloader"
        ];

        selectors.forEach(selector => {
            qsa(selector).forEach(element => {
                element.style.opacity = "0";
                element.style.pointerEvents = "none";

                setTimeout(() => {
                    element.style.display = "none";
                }, 250);
            });
        });

        /* Also handle a loading element containing the exact text */
        qsa("body *").forEach(element => {
            if (
                element.children.length === 0 &&
                element.textContent &&
                element.textContent.trim() === "Loading Skill Gap Predictor"
            ) {
                let parent = element;

                for (let i = 0; i < 3 && parent.parentElement; i++) {
                    parent = parent.parentElement;

                    const style = window.getComputedStyle(parent);

                    if (
                        style.position === "fixed" ||
                        style.position === "absolute" ||
                        parent.id.toLowerCase().includes("load")
                    ) {
                        parent.style.opacity = "0";
                        parent.style.pointerEvents = "none";

                        setTimeout(() => {
                            parent.style.display = "none";
                        }, 250);

                        break;
                    }
                }
            }
        });
    }

    window.addEventListener("load", hideLoadingScreen);

    window.addEventListener("error", () => {
        hideLoadingScreen();
    });

    window.addEventListener("unhandledrejection", () => {
        hideLoadingScreen();
    });

    /* ============================================================
       API REQUEST
       ============================================================ */

    async function apiRequest(action, data = {}, timeout = 60000) {
        const controller = new AbortController();

        const timer = setTimeout(() => {
            controller.abort();
        }, timeout);

        try {
            const formData = new FormData();

            formData.append("action", action);

            Object.keys(data).forEach(key => {
                const value = data[key];

                if (value === undefined || value === null) {
                    formData.append(key, "");
                } else if (value instanceof File) {
                    formData.append(key, value);
                } else if (Array.isArray(value) || typeof value === "object") {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, String(value));
                }
            });

            const response = await fetch(
                "api.php?action=" + encodeURIComponent(action),
                {
                    method: "POST",
                    body: formData,
                    credentials: "same-origin",
                    cache: "no-store",
                    signal: controller.signal
                }
            );

            const raw = await response.text();

            let result;

            try {
                result = JSON.parse(raw);
            } catch (error) {
                console.error("API returned non-JSON:", raw);

                throw new Error(
                    "Server returned an invalid response. Please check api.php."
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
            if (error.name === "AbortError") {
                throw new Error(
                    "Request timed out. Please try again."
                );
            }

            throw error;

        } finally {
            clearTimeout(timer);
        }
    }

    /* ============================================================
       AUTH TABS
       ============================================================ */

    function initAuthTabs() {
        const loginTab = $(
            "login-tab"
        ) || qs(
            '[data-auth-tab="login"]'
        );

        const signupTab = $(
            "signup-tab"
        ) || qs(
            '[data-auth-tab="signup"]'
        );

        const loginPanel =
            $("login-panel") ||
            $("login-form-panel") ||
            qs('[data-auth-panel="login"]');

        const signupPanel =
            $("signup-panel") ||
            $("signup-form-panel") ||
            qs('[data-auth-panel="signup"]');

        if (!loginTab || !signupTab) return;

        function showLogin() {
            loginTab.classList.add("active");
            signupTab.classList.remove("active");

            if (loginPanel) loginPanel.style.display = "";
            if (signupPanel) signupPanel.style.display = "none";
        }

        function showSignup() {
            signupTab.classList.add("active");
            loginTab.classList.remove("active");

            if (signupPanel) signupPanel.style.display = "";
            if (loginPanel) loginPanel.style.display = "none";
        }

        loginTab.addEventListener("click", event => {
            event.preventDefault();
            showLogin();
        });

        signupTab.addEventListener("click", event => {
            event.preventDefault();
            showSignup();
        });

        /* Create Account links/buttons */
        qsa(
            "#create-account, #create-account-link, .create-account-link, [data-action='create-account']"
        ).forEach(button => {
            button.addEventListener("click", event => {
                event.preventDefault();
                showSignup();
            });
        });

        /* Back to login */
        qsa(
            "#back-to-login, .back-to-login, [data-action='back-login']"
        ).forEach(button => {
            button.addEventListener("click", event => {
                event.preventDefault();
                showLogin();
            });
        });

        /* Default */
        showLogin();
    }

    /* ============================================================
       LOGIN
       ============================================================ */

    function initLogin() {
        const button =
            $("btn-do-login") ||
            $("login-submit") ||
            qs("#login-form button[type='submit']");

        const form =
            $("login-form") ||
            qs("form[data-form='login']");

        if (!button && !form) return;

        const handler = async event => {
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

            setButtonLoading(button, true, "Sign In →");

            try {
                const result = await apiRequest("login", {
                    email,
                    password
                });

                state.loggedIn = true;
                state.user = result.user || null;

                showMessage(
                    message,
                    result.message || "Login successful.",
                    "success"
                );

                /*
                 * IMPORTANT:
                 * Reload after login so PHP session becomes available
                 * and the login page disappears completely.
                 */
                setTimeout(() => {
                    window.location.replace(
                        window.location.pathname +
                        "?logged_in=1&t=" +
                        Date.now()
                    );
                }, 500);

            } catch (error) {
                showMessage(
                    message,
                    error.message || "Login failed.",
                    "error"
                );

                setButtonLoading(button, false, "Sign In →");
            }
        };

        if (form) {
            form.addEventListener("submit", handler);
        } else {
            button.addEventListener("click", handler);
        }
    }

    /* ============================================================
       CREATE ACCOUNT
       ============================================================ */

    function initSignup() {
        const form =
            $("signup-form") ||
            qs("form[data-form='signup']");

        const button =
            $("btn-do-signup") ||
            $("signup-submit") ||
            qs("#signup-form button[type='submit']");

        if (!form && !button) return;

        const handler = async event => {
            event.preventDefault();

            const name =
                $("signup_name")?.value.trim() || "";

            const email =
                $("signup_email")?.value.trim() || "";

            const password =
                $("signup_pwd")?.value || "";

            const university =
                $("signup_uni")?.value.trim() || "";

            const branch =
                $("signup_branch")?.value.trim() || "";

            const major =
                $("signup_major")?.value.trim() || "";

            const gradYear =
                $("signup_gradyear")?.value.trim() || "";

            const linkedin =
                $("signup_linkedin")?.value.trim() || "";

            const github =
                $("signup_github")?.value.trim() || "";

            const terms =
                $("signup-terms")?.checked !== false;

            const message =
                $("signup-message") ||
                qs(".signup-message");

            if (!name || !email || !password) {
                showMessage(
                    message,
                    "Please fill in all required fields.",
                    "error"
                );
                return;
            }

            const passwordRegex =
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

            if (!passwordRegex.test(password)) {
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

            setButtonLoading(button, true, "Create Account");

            try {
                const result = await apiRequest("signup", {
                    name,
                    email,
                    password,
                    university,
                    branch,
                    major,
                    graduation_year: gradYear,
                    linkedin,
                    github,

                    /*
                     * IMPORTANT:
                     * Do not create a predefined company or role.
                     */
                    target_company: "",
                    target_role: ""
                });

                showMessage(
                    message,
                    result.message || "Account created successfully.",
                    "success"
                );

                /*
                 * Go back to login tab.
                 */
                const loginTab =
                    $("login-tab") ||
                    qs('[data-auth-tab="login"]');

                if (loginTab) {
                    setTimeout(() => {
                        loginTab.click();

                        if ($("login_email")) {
                            $("login_email").value = email;
                        }
                    }, 700);
                }

            } catch (error) {
                showMessage(
                    message,
                    error.message || "Account creation failed.",
                    "error"
                );

            } finally {
                setButtonLoading(
                    button,
                    false,
                    "Create Account"
                );
            }
        };

        if (form) {
            form.addEventListener("submit", handler);
        } else {
            button.addEventListener("click", handler);
        }
    }

    /* ============================================================
       PASSWORD TOGGLE
       ============================================================ */

    function initPasswordToggles() {
        qsa(
            "#toggle-login-password, #toggle-signup-password, [data-toggle-password]"
        ).forEach(button => {
            button.addEventListener("click", event => {
                event.preventDefault();

                let input;

                const targetId =
                    button.dataset.togglePassword;

                if (targetId) {
                    input = $(targetId);
                }

                if (!input && button.id.includes("login")) {
                    input = $("login_password");
                }

                if (!input && button.id.includes("signup")) {
                    input = $("signup_pwd");
                }

                if (!input) return;

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

    function initThemeToggle() {
        const possibleButtons = [
            $("theme-toggle"),
            $("themeToggle"),
            $("dark-mode-toggle"),
            $("darkModeToggle"),
            $("btn-theme"),
            $("theme-btn"),
            qs("[data-theme-toggle]")
        ];

        let toggle = possibleButtons.find(Boolean);

        /*
         * If the HTML does not contain a theme button,
         * create one in the header.
         */
        if (!toggle) {
            const header =
                qs(".topbar") ||
                qs(".navbar") ||
                qs(".header") ||
                qs("header");

            if (header) {
                toggle = document.createElement("button");

                toggle.type = "button";
                toggle.id = "theme-toggle";
                toggle.className = "theme-toggle";
                toggle.setAttribute(
                    "aria-label",
                    "Toggle theme"
                );

                toggle.innerHTML = "🌙";

                header.appendChild(toggle);
            }
        }

        if (!toggle) return;

        function applyTheme(theme) {
            const isDark = theme === "dark";

            document.documentElement.setAttribute(
                "data-theme",
                theme
            );

            document.body.classList.toggle(
                "dark-mode",
                isDark
            );

            document.body.classList.toggle(
                "dark-theme",
                isDark
            );

            document.body.classList.toggle(
                "light-mode",
                !isDark
            );

            document.body.classList.toggle(
                "light-theme",
                !isDark
            );

            localStorage.setItem(
                "skill-gap-theme",
                theme
            );

            toggle.setAttribute(
                "aria-label",
                isDark
                    ? "Switch to light mode"
                    : "Switch to dark mode"
            );

            /*
             * Change only the icon.
             */
            if (
                toggle.children.length === 0 ||
                toggle.textContent.includes("🌙") ||
                toggle.textContent.includes("☀️")
            ) {
                toggle.textContent = isDark ? "☀️" : "🌙";
            }
        }

        const savedTheme =
            localStorage.getItem("skill-gap-theme");

        /*
         * Default = light mode.
         */
        applyTheme(
            savedTheme === "dark"
                ? "dark"
                : "light"
        );

        /*
         * Remove previous listeners by cloning.
         */
        const freshToggle =
            toggle.cloneNode(true);

        toggle.parentNode.replaceChild(
            freshToggle,
            toggle
        );

        toggle = freshToggle;

        toggle.addEventListener("click", event => {
            event.preventDefault();

            const current =
                document.documentElement.getAttribute(
                    "data-theme"
                ) || "light";

            applyTheme(
                current === "dark"
                    ? "light"
                    : "dark"
            );
        });
    }

    /* ============================================================
       AUTH PAGE VISIBILITY
       ============================================================ */

    function controlLoginPageVisibility() {
        /*
         * IMPORTANT:
         * Career URL must NEVER appear on login/signup page.
         */

        const loggedIn =
            !!APP.loggedIn ||
            state.loggedIn;

        const careerSelectors = [
            "#career-url-panel",
            "#career-url-section",
            "#career-url-container",
            "#career-scraper",
            "#dynamic-career-panel",
            ".career-url-panel",
            ".career-scraper"
        ];

        careerSelectors.forEach(selector => {
            qsa(selector).forEach(element => {
                if (!loggedIn) {
                    element.style.display = "none";
                }
            });
        });

        /*
         * Hide dashboard/sidebar when logged out.
         */
        if (!loggedIn) {
            qsa(
                "#dashboard, #app-dashboard, .dashboard-page, .main-app, .app-layout"
            ).forEach(element => {
                /*
                 * Do not hide the actual login container.
                 */
                if (
                    !element.contains($("login-panel")) &&
                    !element.contains($("signup-panel"))
                ) {
                    if (
                        element.id !== "login-panel" &&
                        element.id !== "signup-panel"
                    ) {
                        element.style.display = "none";
                    }
                }
            });
        }
    }

    /* ============================================================
       NAVIGATION
       ============================================================ */

    function initNavigation() {
        const links = qsa(
            "[data-view], [data-page], [data-section]"
        );

        if (!links.length) return;

        function showView(viewName) {
            if (!viewName) return;

            state.currentView = viewName;

            qsa(
                ".page-view, .dashboard-view, [data-page-view]"
            ).forEach(view => {
                const name =
                    view.dataset.view ||
                    view.dataset.page ||
                    view.dataset.section ||
                    view.id;

                view.style.display =
                    name === viewName
                        ? ""
                        : "none";
            });

            links.forEach(link => {
                const name =
                    link.dataset.view ||
                    link.dataset.page ||
                    link.dataset.section;

                link.classList.toggle(
                    "active",
                    name === viewName
                );
            });

            document.body.dataset.currentView =
                viewName;
        }

        links.forEach(link => {
            link.addEventListener("click", event => {
                const view =
                    link.dataset.view ||
                    link.dataset.page ||
                    link.dataset.section;

                if (!view) return;

                event.preventDefault();

                showView(view);

                closeMobileSidebar();
            });
        });
    }

    /* ============================================================
       MOBILE SIDEBAR
       ============================================================ */

    function closeMobileSidebar() {
        document.body.classList.remove("sidebar-open");

        qsa(
            ".sidebar, #sidebar, .side-nav"
        ).forEach(sidebar => {
            sidebar.classList.remove("open");
            sidebar.classList.remove("active");
        });
    }

    function initMobileUI() {
        const menuButtons = qsa(
            "#menu-toggle, #hamburger, #mobile-menu, .menu-toggle, [data-menu-toggle]"
        );

        menuButtons.forEach(button => {
            button.addEventListener("click", event => {
                event.preventDefault();

                document.body.classList.toggle(
                    "sidebar-open"
                );

                qsa(
                    ".sidebar, #sidebar, .side-nav"
                ).forEach(sidebar => {
                    sidebar.classList.toggle(
                        "open"
                    );

                    sidebar.classList.toggle(
                        "active"
                    );
                });
            });
        });

        qsa(
            "#sidebar-close, .sidebar-close, [data-sidebar-close]"
        ).forEach(button => {
            button.addEventListener(
                "click",
                closeMobileSidebar
            );
        });
    }

    /* ============================================================
       DYNAMIC CAREER URL
       ============================================================ */

    function findCareerUrlInput() {
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

        for (const selector of selectors) {
            const element = qs(selector);

            if (element) return element;
        }

        return null;
    }

    function findCareerScrapeButton() {
        const selectors = [
            "#scrape",
            "#btn-scrape",
            "#btn-scrape-url",
            "#scrape-url-btn",
            "#load-careers",
            "#find-jobs",
            "#career-scrape-btn"
        ];

        for (const selector of selectors) {
            const element = qs(selector);

            if (element) return element;
        }

        return null;
    }

    function createCareerURLPanel() {
        /*
         * NEVER create this on login/signup page.
         */
        if (!state.loggedIn) return;

        if ($("dynamic-career-panel")) {
            return;
        }

        const sidebar =
            qs("#sidebar") ||
            qs(".sidebar") ||
            qs(".side-nav");

        if (!sidebar) return;

        const panel =
            document.createElement("div");

        panel.id =
            "dynamic-career-panel";

        panel.className =
            "career-url-panel";

        panel.innerHTML = `
            <div class="career-url-title">
                Career URL
            </div>

            <div class="career-url-description">
                Paste a careers or jobs page URL to find current roles.
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

        sidebar.prepend(panel);
    }

    function getCareerUrl() {
        const input =
            findCareerUrlInput() ||
            $("dynamic-career-url");

        return input
            ? input.value.trim()
            : "";
    }

    function normalizeJob(job) {
        if (!job || typeof job !== "object") {
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

        if (typeof skills === "string") {
            skills = skills
                .split(/[,;\n|]/)
                .map(x => x.trim())
                .filter(Boolean);
        }

        return {
            ...job,
            title: safeText(title),
            role: safeText(job.role || title),
            company: safeText(company),
            required_skills:
                normalizeSkills(skills),
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
        if (!Array.isArray(jobs)) return [];

        return jobs
            .map(normalizeJob)
            .filter(job => job && job.title);
    }

    /* ============================================================
       JOB MATCHING
       ============================================================ */

    function skillMatches(resumeSkill, requiredSkill) {
        const a = normalizeSkill(resumeSkill);
        const b = normalizeSkill(requiredSkill);

        if (!a || !b) return false;

        if (a === b) return true;

        /*
         * Safe partial matching for longer technical terms.
         */
        if (
            a.length >= 4 &&
            b.length >= 4 &&
            (a.includes(b) || b.includes(a))
        ) {
            return true;
        }

        return false;
    }

    function calculateJobMatch(job, resumeSkills) {
        const required =
            normalizeSkills(job.required_skills);

        const resume =
            normalizeSkills(resumeSkills);

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

        required.forEach(requiredSkill => {
            const found = resume.some(
                resumeSkill =>
                    skillMatches(
                        resumeSkill,
                        requiredSkill
                    )
            );

            if (found) {
                matched.push(requiredSkill);
            } else {
                missing.push(requiredSkill);
            }
        });

        const score = Math.round(
            (matched.length / required.length) * 100
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
                    calculateJobMatch(
                        job,
                        state.extractedSkills
                    );

                return {
                    ...job,
                    matchScore: match.score,
                    matchedSkills: match.matched,
                    missingSkills: match.missing,
                    hasRequirements:
                        match.hasRequirements
                };
            })
            .sort((a, b) => {
                if (b.matchScore !== a.matchScore) {
                    return b.matchScore - a.matchScore;
                }

                return (
                    b.matchedSkills.length -
                    a.matchedSkills.length
                );
            });
    }

    /* ============================================================
       JOB RESULTS UI
       ============================================================ */

    function getJobResultsContainer() {
        const selectors = [
            "#job-results",
            "#career-jobs",
            "#job-ranking-results",
            "#job-results-container",
            ".job-results"
        ];

        for (const selector of selectors) {
            const element = qs(selector);

            if (element) return element;
        }

        return null;
    }

    function renderJobResults(jobs) {
        const container =
            getJobResultsContainer();

        if (!container) return;

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
                <h3>Available Career Opportunities</h3>
                <span>${ranked.length} role(s) found</span>
            </div>

            <div class="dynamic-job-list">
                ${ranked.map((job, index) => `
                    <div
                        class="dynamic-job-card ${
                            index === 0 && state.extractedSkills.length
                                ? "recommended"
                                : ""
                        }"
                        data-job-index="${index}"
                    >

                        <div class="job-card-header">
                            <div>
                                <h4>
                                    ${escapeHtml(job.title)}
                                </h4>

                                ${
                                    job.company
                                        ? `<div class="job-company">
                                            ${escapeHtml(job.company)}
                                           </div>`
                                        : ""
                                }
                            </div>

                            ${
                                job.hasRequirements
                                    ? `<div class="job-match-score">
                                        ${job.matchScore}% Match
                                       </div>`
                                    : `<div class="job-match-score">
                                        Requirements unavailable
                                       </div>`
                            }
                        </div>

                        ${
                            job.location
                                ? `<div class="job-location">
                                    ${escapeHtml(job.location)}
                                   </div>`
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
                                                <strong>Matched:</strong>
                                                ${job.matchedSkills
                                                    .map(skill =>
                                                        `<span class="skill matched">
                                                            ${escapeHtml(skill)}
                                                         </span>`
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
                                                <strong>Missing:</strong>
                                                ${job.missingSkills
                                                    .map(skill =>
                                                        `<span class="skill missing">
                                                            ${escapeHtml(skill)}
                                                         </span>`
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
                                        class="job-link"
                                    >
                                        View Job
                                    </a>
                                    `
                                    : ""
                            }

                        </div>
                    </div>
                `).join("")}
            </div>
        `;

        qsa(
            ".use-job-btn",
            container
        ).forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const index =
                        Number(
                            button.dataset.jobIndex
                        );

                    const selected =
                        ranked[index];

                    if (selected) {
                        useJobAsTarget(selected);
                    }
                }
            );
        });
    }

    /* ============================================================
       USE JOB AS TARGET
       ============================================================ */

    async function useJobAsTarget(job) {
        state.recommendedJob = job;

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

        updateTargetLabels();

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
                "Could not save target:",
                error.message
            );
        }

        renderJobRecommendation(job);
        renderSkills();
        renderATS();
        renderTargetInfo();
    }

    /* ============================================================
       SCRAPE CAREER URL
       ============================================================ */

    async function scrapeCareerURL() {
        if (!state.loggedIn) {
            return;
        }

        const url = getCareerUrl();

        const status =
            $("dynamic-career-status") ||
            $("career-url-status") ||
            $("scrape-status");

        const button =
            findCareerScrapeButton() ||
            $("dynamic-career-scrape-btn");

        if (!url) {
            showMessage(
                status,
                "Please enter a career or jobs URL.",
                "error"
            );
            return;
        }

        if (
            !/^https?:\/\/.+/i.test(url)
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
                    { url },
                    90000
                );

            const jobs =
                normalizeJobs(
                    result.jobs ||
                    result.data ||
                    result.results ||
                    []
                );

            state.careerJobs = jobs;

            renderJobResults(jobs);

            if (!jobs.length) {
                showMessage(
                    status,
                    "The page was reached, but no job listings were detected.",
                    "error"
                );

                return;
            }

            showMessage(
                status,
                `${jobs.length} job(s) found successfully.`,
                "success"
            );

            /*
             * Automatically select the best match only
             * when an actual resume has been uploaded.
             */
            if (state.extractedSkills.length) {
                const ranked =
                    rankJobs(jobs);

                if (ranked.length) {
                    await useJobAsTarget(
                        ranked[0]
                    );
                }
            }

        } catch (error) {
            console.error(
                "Career scraping error:",
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

    function initDynamicCareerURL() {
        /*
         * VERY IMPORTANT:
         * Never initialize the Career URL panel on login.
         */
        if (!state.loggedIn) {
            controlLoginPageVisibility();
            return;
        }

        createCareerURLPanel();

        const input =
            findCareerUrlInput() ||
            $("dynamic-career-url");

        const button =
            findCareerScrapeButton() ||
            $("dynamic-career-scrape-btn");

        if (button) {
            button.addEventListener(
                "click",
                event => {
                    event.preventDefault();
                    scrapeCareerURL();
                }
            );
        }

        if (input) {
            input.addEventListener(
                "keydown",
                event => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        scrapeCareerURL();
                    }
                }
            );

            if (APP.careerUrl) {
                input.value =
                    APP.careerUrl;
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
            "input[type='file'][accept*='pdf']"
        ];

        for (const selector of selectors) {
            const input = qs(selector);

            if (input) return input;
        }

        return null;
    }

    async function uploadResume(file) {
        if (!file) return;

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

            /*
             * Recalculate career matches.
             */
            if (state.careerJobs.length) {
                const ranked =
                    rankJobs(
                        state.careerJobs
                    );

                renderJobResults(
                    state.careerJobs
                );

                if (ranked.length) {
                    await useJobAsTarget(
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

        if (!input) return;

        input.addEventListener(
            "change",
            () => {
                const file =
                    input.files &&
                    input.files[0];

                if (file) {
                    uploadResume(file);
                }
            }
        );
    }

    /* ============================================================
       SKILL DISPLAY
       ============================================================ */

    function renderSkills() {
        const containers = [
            $("extracted-skills"),
            $("resume-skills"),
            $("skills-list"),
            $("skill-list")
        ].filter(Boolean);

        if (!containers.length) return;

        containers.forEach(container => {
            if (!state.extractedSkills.length) {
                container.innerHTML = `
                    <div class="empty-state">
                        Upload a resume to extract your skills.
                    </div>
                `;
                return;
            }

            container.innerHTML =
                state.extractedSkills
                    .map(skill =>
                        `<span class="skill-tag">
                            ${escapeHtml(skill)}
                         </span>`
                    )
                    .join("");
        });
    }

    /* ============================================================
       ATS
       ============================================================ */

    function renderATS() {
        const score =
            Number(state.atsScore || 0);

        const scoreElements = [
            $("ats-score"),
            $("atsScore"),
            $("ats-score-value")
        ].filter(Boolean);

        scoreElements.forEach(element => {
            element.textContent =
                `${Math.round(score)}%`;
        });

        const progress =
            qs(".ats-progress-bar") ||
            $("ats-progress");

        if (progress) {
            progress.style.width =
                Math.max(
                    0,
                    Math.min(100, score)
                ) + "%";
        }
    }

    /* ============================================================
       TARGET INFORMATION
       ============================================================ */

    function updateTargetLabels() {
        const role =
            state.targetRole ||
            "No career role selected";

        const company =
            state.targetCompany;

        qsa(
            "#target-role, #targetRole, .target-role"
        ).forEach(element => {
            element.textContent =
                role;
        });

        qsa(
            "#target-company, #targetCompany, .target-company"
        ).forEach(element => {
            element.textContent =
                company || "Dynamic career target";
        });
    }

    function renderTargetInfo() {
        updateTargetLabels();

        qsa(
            ".required-skills, #required-skills"
        ).forEach(container => {
            container.innerHTML =
                state.requiredSkills.length
                    ? state.requiredSkills
                        .map(skill =>
                            `<span class="skill-tag required">
                                ${escapeHtml(skill)}
                             </span>`
                        )
                        .join("")
                    : `
                        <div class="empty-state">
                            No job requirements detected yet.
                        </div>
                    `;
        });
    }

    function renderJobRecommendation(job) {
        if (!job) return;

        const containers = [
            $("recommended-job"),
            $("job-recommendation"),
            $("recommendedJob")
        ].filter(Boolean);

        containers.forEach(container => {
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
                            ? `<p>
                                ${escapeHtml(job.company)}
                               </p>`
                            : ""
                    }

                    <strong>
                        ${
                            job.matchScore != null
                                ? `${job.matchScore}% skill match`
                                : ""
                        }
                    </strong>
                </div>
            `;
        });
    }

    /* ============================================================
       PROFILE
       ============================================================ */

    function initProfileForm() {
        const form =
            $("profile-form");

        if (!form) return;

        form.addEventListener(
            "submit",
            async event => {
                event.preventDefault();

                const formData =
                    new FormData(form);

                formData.delete("action");
                formData.append(
                    "action",
                    "update_profile"
                );

                const button =
                    form.querySelector(
                        "button[type='submit']"
                    );

                const message =
                    $("profile-message") ||
                    qs(".profile-message");

                setButtonLoading(
                    button,
                    true,
                    "Save Changes"
                );

                try {
                    const result =
                        await apiRequest(
                            "update_profile",
                            Object.fromEntries(
                                formData.entries()
                            )
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

        if (!container) return;

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
                Generating your roadmap...
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

            if (Array.isArray(roadmap)) {
                container.innerHTML =
                    roadmap
                        .map((item, index) =>
                            `<div class="roadmap-item">
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
                             </div>`
                        )
                        .join("");
            } else {
                container.textContent =
                    safeText(roadmap);
            }

        } catch (error) {
            container.innerHTML = `
                <div class="form-message error">
                    ${escapeHtml(error.message)}
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

        if (!container) return;

        if (!state.targetRole) {
            container.innerHTML = `
                <div class="empty-state">
                    Select a job from the career URL first.
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

            if (Array.isArray(questions)) {
                container.innerHTML =
                    questions
                        .map((question, index) =>
                            `<div class="interview-question">
                                <strong>
                                    Question ${index + 1}
                                </strong>
                                <p>
                                    ${escapeHtml(
                                        typeof question === "string"
                                            ? question
                                            : question.question ||
                                              question.text ||
                                              ""
                                    )}
                                </p>
                             </div>`
                        )
                        .join("");
            } else {
                container.textContent =
                    safeText(questions);
            }

        } catch (error) {
            container.innerHTML = `
                <div class="form-message error">
                    ${escapeHtml(error.message)}
                </div>
            `;
        }
    }

    /* ============================================================
       AI INTERVIEW ASSISTANT
       ============================================================ */

    function initAIInterviewAssistant() {
        const button =
            $("ai-interview-submit") ||
            $("btn-ai-interview") ||
            $("ask-ai-btn");

        const input =
            $("ai-interview-question") ||
            $("interview-question-input");

        const output =
            $("ai-interview-answer") ||
            $("ai-response") ||
            $("ai-interview-output");

        if (!button || !input || !output) {
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
       CHARTS
       ============================================================ */

    function initCharts() {
        /*
         * Do not create fake statistics.
         * Charts are only initialized if Chart.js exists
         * and the page already contains chart canvases.
         */

        if (typeof Chart === "undefined") {
            return;
        }

        qsa("canvas").forEach(canvas => {
            if (canvas.dataset.sgpInitialized) {
                return;
            }

            /*
             * Leave charts to existing dashboard logic
             * if they already have a Chart instance.
             */
        });
    }

    /* ============================================================
       DYNAMIC TARGET INITIALIZATION
       ============================================================ */

    function initializeDynamicTarget() {
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
            Number(APP.atsScore || 0);

        if (APP.recommendedJob) {
            state.recommendedJob =
                normalizeJob(
                    APP.recommendedJob
                );
        }

        updateTargetLabels();
        renderSkills();
        renderATS();
        renderTargetInfo();

        if (state.recommendedJob) {
            renderJobRecommendation(
                state.recommendedJob
            );
        }
    }

    /* ============================================================
       LOAD EXISTING CAREER JOBS
       ============================================================ */

    function loadExistingJobs() {
        if (!state.loggedIn) return;

        if (
            Array.isArray(APP.careerJobs) &&
            APP.careerJobs.length
        ) {
            state.careerJobs =
                normalizeJobs(
                    APP.careerJobs
                );

            renderJobResults(
                state.careerJobs
            );
        }
    }

    /* ============================================================
       HIDE OLD PREDEFINED COMPANY/ROLE UI
       ============================================================ */

    function hideLegacyTargetControls() {
        /*
         * Hide old company/role selectors so the system is
         * completely dynamic.
         */

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

        selectors.forEach(selector => {
            qsa(selector).forEach(element => {
                element.style.display = "none";
            });
        });

        /*
         * Disable legacy selectors instead of letting them
         * insert predefined values.
         */
        qsa("select").forEach(select => {
            const id =
                (select.id || "").toLowerCase();

            if (
                id.includes("company") ||
                id.includes("role") ||
                id.includes("benchmark")
            ) {
                select.innerHTML =
                    "<option value=''>Select from career URL</option>";

                select.value = "";
                select.disabled = true;
            }
        });
    }

    /* ============================================================
       EVENT BUTTONS
       ============================================================ */

    function initFeatureButtons() {
        qsa(
            "#roadmap-btn, [data-action='roadmap'], .roadmap-btn"
        ).forEach(button => {
            button.addEventListener(
                "click",
                loadRoadmap
            );
        });

        qsa(
            "#interview-btn, [data-action='interview'], .interview-btn"
        ).forEach(button => {
            button.addEventListener(
                "click",
                loadInterview
            );
        });
    }

    /* ============================================================
       GLOBAL BOOT
       ============================================================ */

    function safeInit(name, fn) {
        try {
            fn();
        } catch (error) {
            console.error(
                "Skill Gap Predictor:",
                name,
                error
            );
        }
    }

    function boot() {
        /*
         * Always remove loading screen first.
         * This prevents the application from being stuck
         * at "Loading Skill Gap Predictor".
         */
        hideLoadingScreen();

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
            initThemeToggle
        );

        safeInit(
            "navigation",
            initNavigation
        );

        safeInit(
            "mobile UI",
            initMobileUI
        );

        /*
         * Login page MUST NOT initialize career URL.
         */
        if (state.loggedIn) {
            safeInit(
                "career URL",
                initDynamicCareerURL
            );

            safeInit(
                "resume upload",
                initResumeUpload
            );

            safeInit(
                "profile",
                initProfileForm
            );

            safeInit(
                "features",
                initFeatureButtons
            );

            safeInit(
                "dynamic target",
                initializeDynamicTarget
            );

            safeInit(
                "existing jobs",
                loadExistingJobs
            );

            safeInit(
                "skills",
                renderSkills
            );

            safeInit(
                "ATS",
                renderATS
            );

            safeInit(
                "AI interview",
                initAIInterviewAssistant
            );

            safeInit(
                "charts",
                initCharts
            );

            safeInit(
                "legacy target controls",
                hideLegacyTargetControls
            );
        } else {
            /*
             * Logged out:
             * explicitly hide all career/dashboard controls.
             */
            safeInit(
                "login visibility",
                controlLoginPageVisibility
            );
        }

        /*
         * Final safety check.
         */
        hideLoadingScreen();
    }

    /* ============================================================
       START
       ============================================================ */

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            boot,
            { once: true }
        );
    } else {
        boot();
    }

})();
