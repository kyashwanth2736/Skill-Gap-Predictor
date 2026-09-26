/* ============================================================
   SKILL-GAP PREDICTOR
   static/app.js
   Complete Updated Frontend
   ============================================================ */

(function () {

    "use strict";

    /* ============================================================
       GLOBAL APP DATA
       ============================================================ */

    const APP =
        window.APP_DATA ||
        {};

    const state = {

        loggedIn:
            Boolean(
                APP.loggedIn
            ),

        user:
            APP.user ||
            null,

        careerUrl:
            APP.careerUrl ||
            "",

        careerJobs:
            Array.isArray(
                APP.careerJobs
            )
                ? APP.careerJobs
                : [],

        careerJobCount:
            Number(
                APP.careerJobCount ||
                APP.jobCount ||
                (
                    Array.isArray(
                        APP.careerJobs
                    )
                        ? APP.careerJobs.length
                        : 0
                )
            ),

        extractedSkills:
            Array.isArray(
                APP.extractedSkills
            )
                ? APP.extractedSkills
                : [],

        requiredSkills:
            Array.isArray(
                APP.requiredSkills
            )
                ? APP.requiredSkills
                : [],

        atsScore:
            Number(
                APP.atsScore ||
                0
            ),

        targetCompany:
            APP.targetCompany ||
            "",

        targetRole:
            APP.targetRole ||
            "",

        recommendedJob:
            APP.recommendedJob ||
            null
    };

    let authController =
        null;

    let activePopup =
        null;

    /* ============================================================
       BASIC HELPERS
       ============================================================ */

    function $(id) {
        return document.getElementById(id);
    }

    function qs(
        selector,
        root = document
    ) {
        return root.querySelector(
            selector
        );
    }

    function qsa(
        selector,
        root = document
    ) {
        return Array.from(
            root.querySelectorAll(
                selector
            )
        );
    }

    function safeText(
        value,
        fallback = ""
    ) {
        if (
            value === null ||
            value === undefined
        ) {
            return fallback;
        }

        return String(
            value
        ).trim() || fallback;
    }

    function escapeHtml(
        value
    ) {
        const div =
            document.createElement(
                "div"
            );

        div.textContent =
            value == null
                ? ""
                : String(value);

        return div.innerHTML;
    }

    function normalizeSkill(
        skill
    ) {
        return safeText(
            skill
        )
            .toLowerCase()
            .replace(
                /[()[\]{}]/g,
                ""
            )
            .replace(
                /[._/-]/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }

    function normalizeSkills(
        skills
    ) {
        if (
            !Array.isArray(
                skills
            )
        ) {
            return [];
        }

        const result = [];
        const seen =
            new Set();

        skills.forEach(
            skill => {

                let value =
                    "";

                if (
                    typeof skill ===
                    "string"
                ) {
                    value =
                        skill;
                } else if (
                    skill &&
                    typeof skill ===
                    "object"
                ) {
                    value =
                        skill.name ||
                        skill.skill ||
                        skill.title ||
                        skill.label ||
                        "";
                }

                value =
                    safeText(
                        value
                    );

                if (!value) {
                    return;
                }

                const key =
                    normalizeSkill(
                        value
                    );

                if (
                    !key ||
                    seen.has(
                        key
                    )
                ) {
                    return;
                }

                seen.add(
                    key
                );

                result.push(
                    value
                );
            }
        );

        return result;
    }

    /* ============================================================
       JOB NORMALIZATION
       ============================================================ */

    function normalizeJob(
        job,
        index = 0
    ) {

        if (
            !job ||
            typeof job !==
                "object"
        ) {
            return null;
        }

        const title =
            job.title ||
            job.role ||
            job.job_title ||
            job.position ||
            job.name ||
            "";

        const company =
            job.company ||
            job.company_name ||
            job.employer ||
            job.organization ||
            "";

        const location =
            job.location ||
            job.locations ||
            job.city ||
            "";

        const url =
            job.url ||
            job.link ||
            job.job_url ||
            job.apply_url ||
            job.application_url ||
            "";

        const description =
            job.description ||
            job.summary ||
            job.text ||
            job.details ||
            "";

        const skills =
            job.required_skills ||
            job.skills ||
            job.requirements ||
            job.technical_skills ||
            [];

        return {

            id:
                job.id ||
                job.job_id ||
                job.jobId ||
                `job-${index + 1}`,

            title:
                safeText(
                    title,
                    "Job Opportunity"
                ),

            company:
                safeText(
                    company,
                    "Company not specified"
                ),

            location:
                safeText(
                    location,
                    "Location not specified"
                ),

            url:
                safeText(
                    url,
                    ""
                ),

            description:
                safeText(
                    description,
                    ""
                ),

            skills:
                normalizeSkills(
                    Array.isArray(
                        skills
                    )
                        ? skills
                        : typeof skills ===
                            "string"
                            ? skills.split(
                                /[,;\n|]+/
                            )
                            : []
                ),

            matchScore:
                Number(
                    job.matchScore ??
                    job.match_score ??
                    job.match ??
                    job.score ??
                    0
                )
        };
    }

    function normalizeJobs(
        jobs
    ) {

        if (
            !Array.isArray(
                jobs
            )
        ) {
            return [];
        }

        return jobs
            .map(
                (
                    job,
                    index
                ) =>
                    normalizeJob(
                        job,
                        index
                    )
            )
            .filter(
                Boolean
            );
    }

    /* ============================================================
       RESPONSE JOB EXTRACTION
       ============================================================ */

    function extractJobsFromResponse(
        result
    ) {

        if (
            !result ||
            typeof result !==
                "object"
        ) {
            return [];
        }

        const candidates = [

            result.jobs,

            result.careerJobs,

            result.career_jobs,

            result.data?.jobs,

            result.data?.careerJobs,

            result.data?.career_jobs,

            result.result?.jobs,

            result.result?.careerJobs,

            result.result?.career_jobs,

            result.data?.result?.jobs,

            result.data?.result?.careerJobs,

            result.response?.jobs,

            result.response?.careerJobs
        ];

        for (
            const candidate
            of candidates
        ) {

            if (
                Array.isArray(
                    candidate
                )
            ) {
                return candidate;
            }
        }

        return [];
    }

    function extractJobCountFromResponse(
        result
    ) {

        if (
            !result ||
            typeof result !==
                "object"
        ) {
            return 0;
        }

        const values = [

            result.job_count,

            result.jobs_count,

            result.jobCount,

            result.count,

            result.data?.job_count,

            result.data?.jobs_count,

            result.data?.jobCount,

            result.data?.count,

            result.result?.job_count,

            result.result?.jobs_count,

            result.result?.jobCount,

            result.result?.count
        ];

        for (
            const value
            of values
        ) {

            const number =
                Number(
                    value
                );

            if (
                Number.isFinite(
                    number
                ) &&
                number >= 0
            ) {
                return number;
            }
        }

        return 0;
    }

    /* ============================================================
       API
       ============================================================ */

    async function apiRequest(
        action,
        data = {},
        method = "POST"
    ) {

        const options = {
            method,
            headers: {}
        };

        let url =
            `api.php?action=${encodeURIComponent(
                action
            )}`;

        if (
            data instanceof
            FormData
        ) {

            if (
                !data.has(
                    "action"
                )
            ) {
                data.append(
                    "action",
                    action
                );
            }

            options.body =
                data;

        } else if (
            method.toUpperCase() ===
            "GET"
        ) {

            const params =
                new URLSearchParams();

            Object.entries(
                data || {}
            ).forEach(
                (
                    [
                        key,
                        value
                    ]
                ) => {

                    if (
                        value !==
                            undefined &&
                        value !== null
                    ) {
                        params.append(
                            key,
                            String(
                                value
                            )
                        );
                    }
                }
            );

            const query =
                params.toString();

            if (query) {
                url +=
                    `&${query}`;
            }

        } else {

            options.headers[
                "Content-Type"
            ] =
                "application/x-www-form-urlencoded";

            const body =
                new URLSearchParams();

            Object.entries(
                data || {}
            ).forEach(
                (
                    [
                        key,
                        value
                    ]
                ) => {

                    if (
                        value !==
                            undefined &&
                        value !== null
                    ) {
                        body.append(
                            key,
                            String(
                                value
                            )
                        );
                    }
                }
            );

            options.body =
                body.toString();
        }

        try {

            const response =
                await fetch(
                    url,
                    options
                );

            const text =
                await response.text();

            let result;

            try {

                result =
                    JSON.parse(
                        text
                    );

            } catch (
                parseError
            ) {

                console.error(
                    "Invalid API JSON:",
                    text
                );

                return {
                    success:
                        false,

                    message:
                        response.status >=
                        400
                            ? `Server error (${response.status}).`
                            : "The server returned an invalid response."
                };
            }

            if (
                !response.ok &&
                result.success ===
                    undefined
            ) {
                result.success =
                    false;
            }

            return result;

        } catch (
            error
        ) {

            console.error(
                "API Error:",
                error
            );

            return {

                success:
                    false,

                message:
                    "Unable to connect to the server. Please check your internet connection and try again."
            };
        }
    }

    function apiSuccess(
        result
    ) {
        return Boolean(
            result &&
            (
                result.success ===
                    true ||

                result.status ===
                    "success" ||

                result.status ===
                    "ok"
            )
        );
    }

    /* ============================================================
       POPUP SYSTEM
       ============================================================ */

    function initPopupSystem() {

        if (
            $("sgp-popup-styles")
        ) {
            return;
        }

        const style =
            document.createElement(
                "style"
            );

        style.id =
            "sgp-popup-styles";

        style.textContent = `

            .sgp-popup-overlay {
                position: fixed;
                inset: 0;
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                background: rgba(15,23,42,.58);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                animation: sgpFade .18s ease;
            }

            .sgp-popup-card {
                width: min(540px,100%);
                background: #ffffff;
                border-radius: 24px;
                padding: 36px 32px 30px;
                text-align: center;
                box-shadow:
                    0 25px 80px rgba(15,23,42,.25),
                    0 8px 30px rgba(15,23,42,.12);
                animation: sgpSlide .22s ease;
            }

            .sgp-popup-icon {
                width: 84px;
                height: 84px;
                margin: 0 auto 22px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 42px;
                font-weight: 800;
            }

            .sgp-popup-icon.success {
                background: #dcfce7;
                color: #16a34a;
            }

            .sgp-popup-icon.error {
                background: #fee2e2;
                color: #dc2626;
            }

            .sgp-popup-icon.warning {
                background: #fef3c7;
                color: #d97706;
            }

            .sgp-popup-icon.info {
                background: #dbeafe;
                color: #2563eb;
            }

            .sgp-popup-title {
                margin: 0;
                color: #172033;
                font-size: 26px;
                line-height: 1.25;
                font-weight: 800;
            }

            .sgp-popup-message {
                margin: 14px auto 26px;
                max-width: 440px;
                color: #66758d;
                font-size: 16px;
                line-height: 1.65;
            }

            .sgp-popup-button {
                min-width: 140px;
                border: 0;
                border-radius: 12px;
                padding: 13px 28px;
                background: #5146e5;
                color: #ffffff;
                font-size: 15px;
                font-weight: 700;
                cursor: pointer;
                transition: .15s ease;
            }

            .sgp-popup-button:hover {
                transform: translateY(-1px);
                box-shadow:
                    0 8px 22px
                    rgba(81,70,229,.28);
            }

            body.dark-mode .sgp-popup-card,
            body.dark .sgp-popup-card,
            html.dark .sgp-popup-card {
                background: #172033;
            }

            body.dark-mode .sgp-popup-title,
            body.dark .sgp-popup-title,
            html.dark .sgp-popup-title {
                color: #f8fafc;
            }

            body.dark-mode .sgp-popup-message,
            body.dark .sgp-popup-message,
            html.dark .sgp-popup-message {
                color: #aebbd0;
            }

            @keyframes sgpFade {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes sgpSlide {
                from {
                    opacity: 0;
                    transform:
                        translateY(12px)
                        scale(.98);
                }

                to {
                    opacity: 1;
                    transform:
                        translateY(0)
                        scale(1);
                }
            }

            @media(max-width:520px) {

                .sgp-popup-card {
                    padding:
                        30px
                        22px
                        24px;
                    border-radius:
                        20px;
                }

                .sgp-popup-icon {
                    width: 70px;
                    height: 70px;
                    font-size: 34px;
                }

                .sgp-popup-title {
                    font-size: 22px;
                }

                .sgp-popup-message {
                    font-size: 15px;
                }

                .sgp-popup-button {
                    width: 100%;
                }
            }
        `;

        document.head.appendChild(
            style
        );
    }

    function showPopup(
        type,
        title,
        message,
        buttonText = "OK"
    ) {

        initPopupSystem();

        return new Promise(
            resolve => {

                if (
                    activePopup
                ) {
                    activePopup.remove();
                    activePopup =
                        null;
                }

                const overlay =
                    document.createElement(
                        "div"
                    );

                overlay.id =
                    "sgp-popup";

                overlay.className =
                    "sgp-popup-overlay";

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "sgp-popup-card";

                const icon =
                    document.createElement(
                        "div"
                    );

                icon.className =
                    `sgp-popup-icon ${type}`;

                if (
                    type ===
                    "success"
                ) {
                    icon.textContent =
                        "✓";
                } else if (
                    type ===
                    "error"
                ) {
                    icon.textContent =
                        "×";
                } else if (
                    type ===
                    "warning"
                ) {
                    icon.textContent =
                        "!";
                } else {
                    icon.textContent =
                        "i";
                }

                const titleElement =
                    document.createElement(
                        "h2"
                    );

                titleElement.className =
                    "sgp-popup-title";

                titleElement.textContent =
                    title;

                const messageElement =
                    document.createElement(
                        "p"
                    );

                messageElement.className =
                    "sgp-popup-message";

                messageElement.textContent =
                    message;

                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.className =
                    "sgp-popup-button";

                button.textContent =
                    buttonText;

                card.appendChild(
                    icon
                );

                card.appendChild(
                    titleElement
                );

                card.appendChild(
                    messageElement
                );

                card.appendChild(
                    button
                );

                overlay.appendChild(
                    card
                );

                document.body.appendChild(
                    overlay
                );

                activePopup =
                    overlay;

                function close() {

                    if (
                        overlay.parentNode
                    ) {
                        overlay.parentNode.removeChild(
                            overlay
                        );
                    }

                    if (
                        activePopup ===
                        overlay
                    ) {
                        activePopup =
                            null;
                    }

                    document.removeEventListener(
                        "keydown",
                        keyHandler
                    );

                    resolve(
                        true
                    );
                }

                function keyHandler(
                    event
                ) {

                    if (
                        event.key ===
                        "Escape"
                    ) {
                        close();
                    }
                }

                button.addEventListener(
                    "click",
                    close
                );

                overlay.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target ===
                            overlay
                        ) {
                            close();
                        }
                    }
                );

                document.addEventListener(
                    "keydown",
                    keyHandler
                );

                setTimeout(
                    () => {
                        button.focus();
                    },
                    50
                );
            }
        );
    }

    function showSuccessPopup(
        title,
        message
    ) {
        return showPopup(
            "success",
            title,
            message,
            "Continue"
        );
    }

    function showErrorPopup(
        title,
        message
    ) {
        return showPopup(
            "error",
            title,
            message,
            "OK"
        );
    }

    function showWarningPopup(
        title,
        message
    ) {
        return showPopup(
            "warning",
            title,
            message,
            "OK"
        );
    }

    /* ============================================================
       INLINE MESSAGE
       ============================================================ */

    function showMessage(
        id,
        message,
        type = "info"
    ) {

        const element =
            typeof id ===
            "string"
                ? $(id)
                : id;

        if (!element) {
            return;
        }

        element.textContent =
            message || "";

        element.className =
            `message ${type}`;

        element.style.display =
            message
                ? "block"
                : "none";
    }

    function clearMessage(
        id
    ) {

        const element =
            $(id);

        if (!element) {
            return;
        }

        element.textContent =
            "";

        element.style.display =
            "none";
    }

    /* ============================================================
       LOADING
       ============================================================ */

    function setLoading(
        element,
        loading,
        loadingText = "Loading..."
    ) {

        if (!element) {
            return;
        }

        if (loading) {

            if (
                !element.dataset
                    .originalText
            ) {
                element.dataset
                    .originalText =
                    element.textContent;
            }

            element.disabled =
                true;

            element.classList.add(
                "is-loading"
            );

            element.textContent =
                loadingText;

        } else {

            element.disabled =
                false;

            element.classList.remove(
                "is-loading"
            );

            if (
                element.dataset
                    .originalText
            ) {
                element.textContent =
                    element.dataset
                        .originalText;
            }
        }
    }

    /* ============================================================
       PAGE LOADER
       ============================================================ */

    function hidePageLoader() {

        const loader =
            $("page-loader");

        if (!loader) {
            return;
        }

        loader.classList.add(
            "hidden"
        );

        loader.classList.add(
            "is-hidden"
        );

        loader.style.opacity =
            "0";

        loader.style.visibility =
            "hidden";

        loader.style.pointerEvents =
            "none";

        setTimeout(
            () => {

                if (
                    loader
                ) {
                    loader.style.display =
                        "none";
                }

            },
            500
        );
    }

    /* ============================================================
       AUTH TABS
       ============================================================ */

    function initAuthTabs() {

        const loginTab =
            $("tab-btn-login");

        const signupTab =
            $("tab-btn-signup");

        const loginPanel =
            $("form-login-box");

        const signupPanel =
            $("form-signup-box");

        if (
            !loginTab ||
            !signupTab ||
            !loginPanel ||
            !signupPanel
        ) {
            return;
        }

        function showLogin() {

            loginTab.classList.add(
                "active"
            );

            signupTab.classList.remove(
                "active"
            );

            loginPanel.classList.add(
                "active"
            );

            signupPanel.classList.remove(
                "active"
            );

            loginPanel.style.display =
                "block";

            signupPanel.style.display =
                "none";
        }

        function showSignup() {

            signupTab.classList.add(
                "active"
            );

            loginTab.classList.remove(
                "active"
            );

            signupPanel.classList.add(
                "active"
            );

            loginPanel.classList.remove(
                "active"
            );

            signupPanel.style.display =
                "block";

            loginPanel.style.display =
                "none";
        }

        loginTab.addEventListener(
            "click",
            showLogin
        );

        signupTab.addEventListener(
            "click",
            showSignup
        );

        authController = {

            showLogin,

            showSignup
        };

        if (
            !loginPanel.classList.contains(
                "active"
            ) &&
            !signupPanel.classList.contains(
                "active"
            )
        ) {
            showLogin();
        }
    }

    function openLoginTab() {

        if (
            authController &&
            typeof authController.showLogin ===
                "function"
        ) {

            authController.showLogin();

            return;
        }

        const button =
            $("tab-btn-login");

        if (button) {
            button.click();
        }
    }

    /* ============================================================
       LOGIN
       ============================================================ */

    function initLogin() {

        const form =
            $("form-login");

        const button =
            $("btn-do-login");

        if (
            !form &&
            !button
        ) {
            return;
        }

        if (
            form &&
            form.dataset.initialized ===
                "true"
        ) {
            return;
        }

        if (form) {
            form.dataset.initialized =
                "true";
        }

        async function submitLogin(
            event
        ) {

            if (event) {
                event.preventDefault();
            }

            const email =
                safeText(
                    $("login_email")
                        ?.value
                ).toLowerCase();

            const password =
                $("login_password")
                    ?.value ||
                "";

            clearMessage(
                "login-error-msg"
            );

            clearMessage(
                "login-success-msg"
            );

            if (
                !email ||
                !password
            ) {

                await showErrorPopup(
                    "Login Failed",
                    "Please enter your email address and password."
                );

                return;
            }

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
                            email,
                            password
                        }
                    );

                if (
                    !apiSuccess(
                        result
                    )
                ) {

                    showMessage(
                        "login-error-msg",
                        result?.message ||
                            "Invalid email or password.",
                        "error"
                    );

                    await showErrorPopup(
                        "Login Failed",
                        result?.message ||
                            "Invalid email or password."
                    );

                    return;
                }

                showMessage(
                    "login-success-msg",
                    result.message ||
                        "Login successful.",
                    "success"
                );

                await showSuccessPopup(
                    "Login Successful",
                    result.message ||
                        "Welcome back to Skill-Gap Predictor."
                );

                window.location.reload();

            } catch (
                error
            ) {

                console.error(
                    "Login error:",
                    error
                );

                await showErrorPopup(
                    "Login Failed",
                    "Something went wrong while signing in."
                );

            } finally {

                setLoading(
                    button,
                    false
                );
            }
        }

        if (form) {

            form.addEventListener(
                "submit",
                submitLogin
            );

        } else if (
            button
        ) {

            button.addEventListener(
                "click",
                submitLogin
            );
        }
    }

    /* ============================================================
       ACCOUNT EXISTS DETECTION
       ============================================================ */

    function isAccountExistsResponse(
        result
    ) {

        if (!result) {
            return false;
        }

        const code =
            String(
                result.code ||
                result.error_code ||
                result.status ||
                ""
            ).toUpperCase();

        const message =
            String(
                result.message ||
                result.error ||
                ""
            ).toLowerCase();

        const duplicateCodes = [

            "ACCOUNT_EXISTS",

            "EMAIL_EXISTS",

            "EMAIL_TAKEN",

            "DUPLICATE",

            "DUPLICATE_EMAIL"
        ];

        if (
            duplicateCodes.includes(
                code
            )
        ) {
            return true;
        }

        return (

            message.includes(
                "already exists"
            ) ||

            message.includes(
                "already registered"
            ) ||

            message.includes(
                "email already"
            ) ||

            message.includes(
                "duplicate email"
            ) ||

            message.includes(
                "email is taken"
            ) ||

            message.includes(
                "account already"
            )
        );
    }

    /* ============================================================
       SIGNUP
       ============================================================ */

    function initSignup() {

        const form =
            $("form-signup");

        const button =
            $("btn-do-signup");

        if (
            !form &&
            !button
        ) {
            return;
        }

        if (
            form &&
            form.dataset.initialized ===
                "true"
        ) {
            return;
        }

        if (form) {
            form.dataset.initialized =
                "true";
        }

        async function submitSignup(
            event
        ) {

            if (event) {
                event.preventDefault();
            }

            const name =
                safeText(
                    $("signup_name")
                        ?.value
                );

            const email =
                safeText(
                    $("signup_email")
                        ?.value
                ).toLowerCase();

            const password =
                $("signup_pwd")
                    ?.value ||
                "";

            const university =
                safeText(
                    $("signup_uni")
                        ?.value
                );

            const branch =
                safeText(
                    $("signup_branch")
                        ?.value
                );

            const major =
                safeText(
                    $("signup_major")
                        ?.value
                );

            const gradYear =
                safeText(
                    $("signup_gradyear")
                        ?.value
                );

            const linkedin =
                safeText(
                    $("signup_linkedin")
                        ?.value
                );

            const github =
                safeText(
                    $("signup_github")
                        ?.value
                );

            const terms =
                $("signup-terms");

            clearMessage(
                "signup-error-msg"
            );

            clearMessage(
                "signup-success-msg"
            );

            if (
                !name ||
                !email ||
                !password
            ) {

                await showErrorPopup(
                    "Registration Failed",
                    "Please fill in your name, email address, and password."
                );

                return;
            }

            if (
                password.length <
                6
            ) {

                await showErrorPopup(
                    "Password Too Short",
                    "Your password must contain at least 6 characters."
                );

                return;
            }

            if (
                terms &&
                !terms.checked
            ) {

                await showWarningPopup(
                    "Terms Required",
                    "Please accept the terms and conditions before creating your account."
                );

                return;
            }

            setLoading(
                button,
                true,
                "Creating account..."
            );

            try {

                const result =
                    await apiRequest(
                        "register",
                        {
                            name,
                            email,
                            password,
                            university,
                            branch,
                            major,
                            gradyear:
                                gradYear,
                            grad_year:
                                gradYear,
                            linkedin,
                            github
                        }
                    );

                /*
                 * Check duplicate BEFORE success.
                 */
                if (
                    isAccountExistsResponse(
                        result
                    )
                ) {

                    showMessage(
                        "signup-error-msg",
                        "An account with this email already exists.",
                        "error"
                    );

                    await showPopup(
                        "warning",
                        "Account Already Exists",
                        "An account with this email is already registered. Please log in instead.",
                        "Go to Login"
                    );

                    openLoginTab();

                    const loginEmail =
                        $("login_email");

                    if (
                        loginEmail
                    ) {
                        loginEmail.value =
                            email;

                        loginEmail.focus();
                    }

                    return;
                }

                if (
                    !apiSuccess(
                        result
                    )
                ) {

                    const message =
                        result?.message ||
                        "Unable to create your account. Please try again.";

                    showMessage(
                        "signup-error-msg",
                        message,
                        "error"
                    );

                    await showErrorPopup(
                        "Registration Failed",
                        message
                    );

                    return;
                }

                showMessage(
                    "signup-success-msg",
                    "Account registered successfully.",
                    "success"
                );

                await showSuccessPopup(
                    "Account Registered Successfully",
                    "Your account has been created successfully. Please log in with your new account."
                );

                /*
                 * Automatically move to Login.
                 */
                openLoginTab();

                const loginEmail =
                    $("login_email");

                if (
                    loginEmail
                ) {
                    loginEmail.value =
                        email;

                    loginEmail.focus();
                }

                const loginPassword =
                    $("login_password");

                if (
                    loginPassword
                ) {
                    loginPassword.value =
                        "";
                }

            } catch (
                error
            ) {

                console.error(
                    "Signup error:",
                    error
                );

                await showErrorPopup(
                    "Registration Failed",
                    "Something went wrong while creating your account."
                );

            } finally {

                setLoading(
                    button,
                    false
                );
            }
        }

        if (form) {

            form.addEventListener(
                "submit",
                submitSignup
            );

        } else if (
            button
        ) {

            button.addEventListener(
                "click",
                submitSignup
            );
        }
    }

    /* ============================================================
       PASSWORD TOGGLES
       ============================================================ */

    function initPasswordToggles() {

        qsa(
            "[data-password-toggle]"
        ).forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const targetId =
                            button.dataset
                                .passwordToggle ||
                            button.getAttribute(
                                "data-target"
                            );

                        const input =
                            $(targetId);

                        if (!input) {
                            return;
                        }

                        input.type =
                            input.type ===
                            "password"
                                ? "text"
                                : "password";

                        button.classList.toggle(
                            "active",
                            input.type ===
                                "text"
                        );
                    }
                );
            }
        );

        qsa(
            ".password-toggle"
        ).forEach(
            button => {

                if (
                    button.dataset
                        .initialized ===
                    "true"
                ) {
                    return;
                }

                button.dataset
                    .initialized =
                    "true";

                button.addEventListener(
                    "click",
                    () => {

                        const parent =
                            button.closest(
                                ".password-field"
                            ) ||
                            button.parentElement;

                        const input =
                            parent?.querySelector(
                                "input"
                            );

                        if (!input) {
                            return;
                        }

                        input.type =
                            input.type ===
                            "password"
                                ? "text"
                                : "password";
                    }
                );
            }
        );
    }

    /* ============================================================
       THEME
       ============================================================ */

    function applyTheme(
        theme
    ) {

        const isDark =
            theme ===
            "dark";

        /*
         * Your CSS uses dark-mode.
         * Also keep dark for compatibility.
         */
        document.documentElement.classList.toggle(
            "dark",
            isDark
        );

        document.body.classList.toggle(
            "dark",
            isDark
        );

        document.body.classList.toggle(
            "dark-mode",
            isDark
        );

        document.documentElement.dataset.theme =
            isDark
                ? "dark"
                : "light";

        document.body.dataset.theme =
            isDark
                ? "dark"
                : "light";

        const icon =
            $("theme-icon");

        const text =
            $("theme-text");

        if (icon) {
            icon.textContent =
                isDark
                    ? "☀"
                    : "🌙";
        }

        if (text) {
            text.textContent =
                isDark
                    ? "Light Mode"
                    : "Dark Mode";
        }
    }

    function initTheme() {

        const saved =
            localStorage.getItem(
                "skillGapTheme"
            );

        const initial =
            saved ||
            (
                window.matchMedia &&
                window.matchMedia(
                    "(prefers-color-scheme: dark)"
                ).matches
                    ? "dark"
                    : "light"
            );

        applyTheme(
            initial
        );

        const toggles = [
            $("theme-toggle"),
            $("top-theme-toggle")
        ].filter(
            Boolean
        );

        toggles.forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        const isDark =
                            document.body.classList.contains(
                                "dark-mode"
                            );

                        const next =
                            isDark
                                ? "light"
                                : "dark";

                        localStorage.setItem(
                            "skillGapTheme",
                            next
                        );

                        applyTheme(
                            next
                        );
                    }
                );
            }
        );
    }

    /* ============================================================
       SIDEBAR
       ============================================================ */

    function initSidebar() {

        const menuButton =
            $("mobile-menu-toggle");

        const sidebar =
            qs(
                ".app-sidebar"
            );

        const closeButton =
            $("sidebar-close");

        const overlay =
            $("sidebar-overlay");

        if (!sidebar) {
            return;
        }

        function openSidebar() {

            sidebar.classList.add(
                "open"
            );

            if (overlay) {
                overlay.classList.add(
                    "active"
                );
            }

            document.body.classList.add(
                "sidebar-open"
            );
        }

        function closeSidebar() {

            sidebar.classList.remove(
                "open"
            );

            if (overlay) {
                overlay.classList.remove(
                    "active"
                );
            }

            document.body.classList.remove(
                "sidebar-open"
            );
        }

        if (menuButton) {

            menuButton.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    if (
                        sidebar.classList.contains(
                            "open"
                        )
                    ) {
                        closeSidebar();
                    } else {
                        openSidebar();
                    }
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

        qsa(
            ".nav-item"
        ).forEach(
            item => {

                item.addEventListener(
                    "click",
                    closeSidebar
                );
            }
        );
    }

    /* ============================================================
       NAVIGATION
       ============================================================ */

    function initNavigation() {

        const items =
            qsa(
                ".nav-item"
            );

        const views =
            qsa(
                ".view-panel"
            );

        items.forEach(
            item => {

                item.addEventListener(
                    "click",
                    event => {

                        const viewName =
                            item.dataset
                                .view ||
                            item.getAttribute(
                                "data-view"
                            );

                        if (!viewName) {
                            return;
                        }

                        event.preventDefault();

                        items.forEach(
                            nav => {

                                nav.classList.toggle(
                                    "active",
                                    (
                                        nav.dataset
                                            .view ===
                                        viewName
                                    )
                                );
                            }
                        );

                        views.forEach(
                            view => {

                                const matches =
                                    view.id ===
                                        viewName ||
                                    view.id ===
                                        `view-${viewName}` ||
                                    view.dataset
                                        .view ===
                                        viewName;

                                view.classList.toggle(
                                    "active",
                                    matches
                                );
                            }
                        );
                    }
                );
            }
        );
    }

    /* ============================================================
       CAREER URL INPUT
       ============================================================ */

    function findCareerUrlInput() {

        return (
            $("career-url") ||
            $("jobs-career-url")
        );
    }

    function updateCareerUrlStatus(
        message,
        type = "info"
    ) {

        const element =
            $("career-url-status");

        if (!element) {
            return;
        }

        element.textContent =
            message || "";

        element.className =
            `career-source-${type}`;

        element.style.display =
            message
                ? "block"
                : "none";
    }

    async function scrapeCareerUrl() {

        const button =
            $("scrape-career-url");

        const input =
            $("career-url");

        const url =
            safeText(
                input?.value
            );

        if (!url) {

            await showErrorPopup(
                "Career URL Required",
                "Please enter a career or jobs URL first."
            );

            return;
        }

        try {
            new URL(
                url
            );
        } catch (
            error
        ) {

            await showErrorPopup(
                "Invalid Career URL",
                "Please enter a complete valid URL."
            );

            return;
        }

        setLoading(
            button,
            true,
            "Fetching jobs..."
        );

        updateCareerUrlStatus(
            "Analyzing career page and extracting job postings...",
            "info"
        );

        try {

            const result =
                await apiRequest(
                    "scrape_url",
                    {
                        url
                    }
                );

            if (
                !apiSuccess(
                    result
                )
            ) {

                updateCareerUrlStatus(
                    result?.message ||
                        "Unable to extract jobs.",
                    "error"
                );

                await showErrorPopup(
                    "Job Extraction Failed",
                    result?.message ||
                        "Unable to extract jobs from this URL."
                );

                return;
            }

            const rawJobs =
                extractJobsFromResponse(
                    result
                );

            const jobs =
                normalizeJobs(
                    rawJobs
                );

            state.careerUrl =
                url;

            state.careerJobs =
                jobs;

            const responseCount =
                extractJobCountFromResponse(
                    result
                );

            state.careerJobCount =
                jobs.length >
                0
                    ? jobs.length
                    : responseCount;

            const skills =
                result.required_skills ||
                result.requiredSkills ||
                result.data?.required_skills ||
                result.data?.requiredSkills ||
                [];

            if (
                Array.isArray(
                    skills
                )
            ) {

                state.requiredSkills =
                    normalizeSkills(
                        skills
                    );
            }

            if (
                result.recommended_job
            ) {
                state.recommendedJob =
                    result.recommended_job;
            }

            window.APP_DATA =
                window.APP_DATA ||
                {};

            window.APP_DATA.careerUrl =
                state.careerUrl;

            window.APP_DATA.careerJobs =
                state.careerJobs;

            window.APP_DATA.careerJobCount =
                state.careerJobCount;

            window.APP_DATA.requiredSkills =
                state.requiredSkills;

            /*
             * Update both career URL fields.
             */
            if (
                $("career-url")
            ) {
                $("career-url").value =
                    url;
            }

            if (
                $("jobs-career-url")
            ) {
                $("jobs-career-url").value =
                    url;
            }

            /*
             * Render immediately.
             */
            renderJobs();

            renderSkillGap();

            updateTargetUI();

            /*
             * Load metrics.
             */
            await loadMetrics();

            /*
             * IMPORTANT:
             * Run this AFTER loadMetrics so that the
             * server cannot overwrite the local job count.
             */
            updateStats();

            const count =
                state.careerJobs.length ||
                state.careerJobCount ||
                0;

            if (
                count > 0
            ) {

                updateCareerUrlStatus(
                    `${count} job(s) extracted successfully.`,
                    "success"
                );

                await showSuccessPopup(
                    "Jobs Extracted Successfully",
                    `${count} job(s) were extracted from the career source and added to your dashboard.`
                );

            } else {

                updateCareerUrlStatus(
                    "No job postings were found.",
                    "error"
                );

                await showWarningPopup(
                    "No Jobs Found",
                    "The career page was analyzed, but no job postings could be extracted. Try a direct jobs or search URL from the same website."
                );
            }

        } catch (
            error
        ) {

            console.error(
                "Career scraping error:",
                error
            );

            updateCareerUrlStatus(
                "An unexpected error occurred.",
                "error"
            );

            await showErrorPopup(
                "Job Extraction Failed",
                "An unexpected error occurred while analyzing the career URL."
            );

        } finally {

            setLoading(
                button,
                false
            );
        }
    }

    function initCareerUrl() {

        const button =
            $("scrape-career-url");

        const input =
            $("career-url");

        if (button) {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    scrapeCareerUrl();
                }
            );
        }

        if (input) {

            input.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();

                        scrapeCareerUrl();
                    }
                }
            );
        }
    }

    /* ============================================================
       TARGET UI
       ============================================================ */

    function updateTargetUI() {

        qsa(
            "[data-target-company]"
        ).forEach(
            element => {

                element.textContent =
                    state.targetCompany ||
                    "Dynamic career source";
            }
        );

        qsa(
            "[data-target-role]"
        ).forEach(
            element => {

                element.textContent =
                    state.targetRole ||
                    "Dynamic job recommendations";
            }
        );
    }

    /* ============================================================
       JOB MATCHING
       ============================================================ */

    function getJobSkills(
        job
    ) {

        return normalizeSkills(
            job?.skills ||
            job?.required_skills ||
            job?.requiredSkills ||
            []
        );
    }

    function calculateJobMatch(
        job
    ) {

        const resumeSkills =
            normalizeSkills(
                state.extractedSkills
            );

        const jobSkills =
            getJobSkills(
                job
            );

        if (
            !resumeSkills.length ||
            !jobSkills.length
        ) {
            return 0;
        }

        const resumeSet =
            new Set(
                resumeSkills.map(
                    normalizeSkill
                )
            );

        let matched =
            0;

        jobSkills.forEach(
            skill => {

                if (
                    resumeSet.has(
                        normalizeSkill(
                            skill
                        )
                    )
                ) {
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

    function rankJobs(
        jobs
    ) {

        return jobs
            .map(
                job => ({

                    ...job,

                    matchScore:
                        calculateJobMatch(
                            job
                        )
                })
            )
            .sort(
                (
                    a,
                    b
                ) => {

                    if (
                        b.matchScore !==
                        a.matchScore
                    ) {
                        return (
                            b.matchScore -
                            a.matchScore
                        );
                    }

                    return String(
                        a.title
                    ).localeCompare(
                        String(
                            b.title
                        )
                    );
                }
            );
    }

    /* ============================================================
       JOB RENDERING
       ============================================================ */

    function renderJobs() {

        const container =
            $("job-results");

        if (
            !Array.isArray(
                state.careerJobs
            )
        ) {
            state.careerJobs =
                [];
        }

        const ranked =
            rankJobs(
                state.careerJobs
            );

        state.careerJobs =
            ranked;

        if (
            ranked.length
        ) {
            state.careerJobCount =
                ranked.length;
        }

        updateStats();

        if (!container) {

            updateRecommendation(
                ranked[0] ||
                null
            );

            return;
        }

        if (
            !ranked.length
        ) {

            container.innerHTML = `

                <div class="empty-state">

                    <h3>
                        No job postings available
                    </h3>

                    <p>
                        Enter a career URL and
                        fetch jobs to see dynamically
                        extracted opportunities here.
                    </p>

                </div>

            `;

            updateRecommendation(
                null
            );

            return;
        }

        container.innerHTML =
            ranked.map(
                (
                    job,
                    index
                ) => {

                    const skills =
                        getJobSkills(
                            job
                        );

                    const skillsHtml =
                        skills.length

                            ? skills
                                .slice(
                                    0,
                                    8
                                )
                                .map(
                                    skill =>
                                        `<span class="skill-tag">${escapeHtml(
                                            skill
                                        )}</span>`
                                )
                                .join("")

                            : `<span class="muted">Skills not specified</span>`;

                    const link =
                        job.url
                            ? `
                                <a
                                    href="${escapeHtml(
                                        job.url
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="btn btn-primary"
                                >
                                    View Job
                                </a>
                            `
                            : "";

                    return `

                        <div class="job-card">

                            <div class="job-card-header">

                                <div>

                                    <span class="job-rank">
                                        #${index + 1}
                                    </span>

                                    <h3>
                                        ${escapeHtml(
                                            job.title
                                        )}
                                    </h3>

                                </div>

                                <div class="job-match-score">
                                    ${job.matchScore || 0}%
                                </div>

                            </div>

                            <div class="job-company">
                                ${escapeHtml(
                                    job.company
                                )}
                            </div>

                            <div class="job-location">
                                ${escapeHtml(
                                    job.location
                                )}
                            </div>

                            <div class="job-description">
                                ${escapeHtml(
                                    job.description
                                        ? job.description.substring(
                                            0,
                                            320
                                        ) +
                                        (
                                            job.description.length >
                                            320
                                                ? "..."
                                                : ""
                                        )
                                        : "No description available."
                                )}
                            </div>

                            <div class="job-skills">
                                ${skillsHtml}
                            </div>

                            <div class="job-card-actions">
                                ${link}
                            </div>

                        </div>

                    `;
                }
            ).join("");

        updateRecommendation(
            ranked[0] ||
            null
        );
    }

    /* ============================================================
       RECOMMENDATION
       ============================================================ */

    function updateRecommendation(
        job
    ) {

        const card =
            $("recommendation-card");

        const target =
            $("recommended-job");

        if (
            !card &&
            !target
        ) {
            return;
        }

        if (!job) {

            if (card) {
                card.style.display =
                    "none";
            }

            if (target) {
                target.innerHTML =
                    "";
            }

            return;
        }

        if (card) {
            card.style.display =
                "";
        }

        if (!target) {
            return;
        }

        target.innerHTML = `

            <div class="recommendation-content">

                <div class="recommendation-main">

                    <span class="recommendation-label">
                        Recommended Job
                    </span>

                    <h3>
                        ${escapeHtml(
                            job.title
                        )}
                    </h3>

                    <p>
                        ${escapeHtml(
                            job.company
                        )}
                    </p>

                    <span class="recommendation-location">
                        ${escapeHtml(
                            job.location
                        )}
                    </span>

                </div>

                <div class="recommendation-score">

                    <strong>
                        ${job.matchScore || 0}%
                    </strong>

                    <span>
                        Match
                    </span>

                </div>

            </div>

            ${
                job.url
                    ? `
                        <a
                            href="${escapeHtml(
                                job.url
                            )}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="btn btn-primary"
                        >
                            View Recommended Job
                        </a>
                    `
                    : ""
            }

        `;
    }

    /* ============================================================
       DASHBOARD STATS
       ============================================================ */

    function getBestMatchScore() {

        if (
            Array.isArray(
                state.careerJobs
            ) &&
            state.careerJobs.length
        ) {

            return Math.max(
                ...state.careerJobs.map(
                    job =>
                        Number(
                            job.matchScore ||
                            0
                        )
                )
            );
        }

        if (
            state.recommendedJob
        ) {

            return Number(
                state.recommendedJob.matchScore ??
                state.recommendedJob.match_score ??
                state.recommendedJob.score ??
                0
            );
        }

        return 0;
    }

    function updateStats() {

        const jobCount =
            state.careerJobs.length ||
            state.careerJobCount ||
            0;

        const bestMatch =
            getBestMatchScore();

        const values = {

            "stat-skills":
                state.extractedSkills.length,

            "stat-ats":
                Math.round(
                    state.atsScore ||
                    0
                ),

            "stat-jobs":
                jobCount,

            "stat-match":
                bestMatch,

            "metric-ats":
                Math.round(
                    state.atsScore ||
                    0
                ),

            "metric-jobs":
                jobCount,

            "metric-match":
                bestMatch
        };

        Object.entries(
            values
        ).forEach(
            (
                [
                    id,
                    value
                ]
            ) => {

                const element =
                    $(id);

                if (element) {
                    element.textContent =
                        value;
                }
            }
        );
    }

    /* ============================================================
       METRICS
       ============================================================ */

    async function loadMetrics() {

        try {

            const result =
                await apiRequest(
                    "get_metrics",
                    {},
                    "GET"
                );

            if (
                !apiSuccess(
                    result
                )
            ) {

                updateStats();

                return;
            }

            const metrics =
                result.metrics ||
                result.data ||
                result;

            if (
                metrics.ats_score !==
                undefined
            ) {

                state.atsScore =
                    Number(
                        metrics.ats_score
                    ) ||
                    0;
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

            const serverCount =
                Number(
                    metrics.job_count ??
                    metrics.jobs_count ??
                    metrics.career_job_count ??
                    0
                );

            /*
             * Never replace locally extracted jobs
             * with server count 0.
             */
            if (
                state.careerJobs.length ===
                    0 &&
                serverCount >
                    0
            ) {

                state.careerJobCount =
                    serverCount;
            }

            renderATS();

            renderExtractedSkills();

            renderSkillGap();

            updateStats();

        } catch (
            error
        ) {

            console.error(
                "Metrics error:",
                error
            );

            updateStats();
        }
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
                    Math.round(
                        state.atsScore ||
                        0
                    )
                )
            );

        const scoreElement =
            $("ats-score");

        if (
            scoreElement
        ) {
            scoreElement.textContent =
                score;
        }

        const metric =
            $("metric-ats");

        if (
            metric
        ) {
            metric.textContent =
                score;
        }

        const feedback =
            $("ats-feedback");

        if (
            feedback
        ) {

            if (
                score >=
                80
            ) {

                feedback.textContent =
                    "Strong resume alignment with the analyzed requirements.";

            } else if (
                score >=
                60
            ) {

                feedback.textContent =
                    "Good alignment, with some skills or resume improvements recommended.";

            } else if (
                score >
                0
            ) {

                feedback.textContent =
                    "Several relevant skills may be missing from the resume.";

            } else {

                feedback.textContent =
                    "Upload and analyze your resume to calculate the ATS score.";
            }
        }
    }

    /* ============================================================
       RESUME FILE
       ============================================================ */

    function getSelectedResumeFile() {

        const input =
            $("resume-file");

        if (!input) {
            return null;
        }

        if (
            input.files &&
            input.files.length
        ) {
            return input.files[0];
        }

        return (
            input._selectedFile ||
            null
        );
    }

    function isValidResumeFile(
        file
    ) {

        if (!file) {
            return false;
        }

        const name =
            String(
                file.name ||
                ""
            ).toLowerCase();

        return [
            ".pdf",
            ".doc",
            ".docx"
        ].some(
            extension =>
                name.endsWith(
                    extension
                )
        );
    }

    function assignResumeFile(
        file
    ) {

        if (!file) {
            return;
        }

        if (
            !isValidResumeFile(
                file
            )
        ) {

            showErrorPopup(
                "Invalid Resume File",
                "Please select a PDF, DOC, or DOCX resume file."
            );

            return;
        }

        const input =
            $("resume-file");

        if (!input) {
            return;
        }

        /*
         * Store fallback file.
         */
        input._selectedFile =
            file;

        /*
         * Try to put file into native input.
         */
        try {

            const transfer =
                new DataTransfer();

            transfer.items.add(
                file
            );

            input.files =
                transfer.files;

        } catch (
            error
        ) {

            console.warn(
                "DataTransfer unavailable:",
                error
            );
        }

        showSelectedResume(
            file
        );
    }

    function showSelectedResume(
        file
    ) {

        if (!file) {
            return;
        }

        const dropZone =
            $("resume-drop-zone");

        if (dropZone) {

            dropZone.classList.add(
                "has-file"
            );

            const nameElement =
                dropZone.querySelector(
                    ".resume-file-name"
                );

            if (
                nameElement
            ) {

                nameElement.textContent =
                    file.name;
            }
        }

        qsa(
            "[data-resume-file-name]"
        ).forEach(
            element => {

                element.textContent =
                    file.name;
            }
        );
    }

    function initResumeFileHandling() {

        const input =
            $("resume-file");

        const dropZone =
            $("resume-drop-zone");

        if (!input) {
            return;
        }

        input.addEventListener(
            "change",
            () => {

                const file =
                    input.files?.[0];

                if (file) {
                    assignResumeFile(
                        file
                    );
                }
            }
        );

        if (!dropZone) {
            return;
        }

        dropZone.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest(
                        "button"
                    )
                ) {
                    return;
                }

                input.click();
            }
        );

        dropZone.addEventListener(
            "dragover",
            event => {

                event.preventDefault();

                dropZone.classList.add(
                    "drag-over"
                );
            }
        );

        dropZone.addEventListener(
            "dragleave",
            event => {

                event.preventDefault();

                dropZone.classList.remove(
                    "drag-over"
                );
            }
        );

        dropZone.addEventListener(
            "drop",
            event => {

                event.preventDefault();

                dropZone.classList.remove(
                    "drag-over"
                );

                const file =
                    event.dataTransfer
                        ?.files?.[0];

                if (file) {

                    assignResumeFile(
                        file
                    );
                }
            }
        );
    }

    /* ============================================================
       RESUME UPLOAD
       ============================================================ */

    async function uploadResume() {

        const button =
            $("evaluate-resume");

        const file =
            getSelectedResumeFile();

        if (!file) {

            await showErrorPopup(
                "Resume Analysis Failed",
                "Please select a valid resume file before starting the analysis."
            );

            return;
        }

        if (
            !isValidResumeFile(
                file
            )
        ) {

            await showErrorPopup(
                "Invalid Resume File",
                "Please select a PDF, DOC, or DOCX resume file."
            );

            return;
        }

        setLoading(
            button,
            true,
            "Analyzing Resume..."
        );

        try {

            const formData =
                new FormData();

            formData.append(
                "resume",
                file,
                file.name
            );

            const result =
                await apiRequest(
                    "upload_resume",
                    formData
                );

            if (
                !apiSuccess(
                    result
                )
            ) {

                await showErrorPopup(
                    "Resume Analysis Failed",
                    result?.message ||
                        "The resume could not be analyzed."
                );

                return;
            }

            const data =
                result.data ||
                result;

            if (
                Array.isArray(
                    data.extracted_skills
                )
            ) {

                state.extractedSkills =
                    normalizeSkills(
                        data.extracted_skills
                    );
            }

            if (
                Array.isArray(
                    data.required_skills
                )
            ) {

                state.requiredSkills =
                    normalizeSkills(
                        data.required_skills
                    );
            }

            if (
                data.ats_score !==
                undefined
            ) {

                state.atsScore =
                    Number(
                        data.ats_score
                    ) ||
                    0;
            }

            if (
                data.recommended_job
            ) {

                state.recommendedJob =
                    data.recommended_job;
            }

            if (
                Array.isArray(
                    data.career_jobs
                )
            ) {

                const jobs =
                    normalizeJobs(
                        data.career_jobs
                    );

                if (
                    jobs.length
                ) {

                    state.careerJobs =
                        jobs;

                    state.careerJobCount =
                        jobs.length;
                }
            }

            renderATS();

            renderExtractedSkills();

            renderSkillGap();

            if (
                state.careerJobs.length
            ) {
                renderJobs();
            }

            updateStats();

            await loadMetrics();

            updateStats();

            await showSuccessPopup(
                "Resume Analysis Complete",
                "Your resume has been successfully analyzed. Your ATS score, skills, and career matching results are now available."
            );

        } catch (
            error
        ) {

            console.error(
                "Resume upload error:",
                error
            );

            await showErrorPopup(
                "Resume Analysis Failed",
                "An unexpected error occurred while processing your resume."
            );

        } finally {

            setLoading(
                button,
                false
            );
        }
    }

    function initResumeUpload() {

        const form =
            $("form-resume-upload");

        const button =
            $("evaluate-resume");

        if (
            form &&
            form.dataset.initialized !==
                "true"
        ) {

            form.dataset.initialized =
                "true";

            form.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    uploadResume();
                }
            );
        }

        if (
            button &&
            !form &&
            button.dataset.initialized !==
                "true"
        ) {

            button.dataset.initialized =
                "true";

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    uploadResume();
                }
            );
        }

        initResumeFileHandling();
    }

    /* ============================================================
       EXTRACTED SKILLS
       ============================================================ */

    function renderExtractedSkills() {

        const container =
            $("resume-skills-list");

        if (!container) {
            return;
        }

        const skills =
            normalizeSkills(
                state.extractedSkills
            );

        if (
            !skills.length
        ) {

            container.innerHTML = `
                <div class="empty-state">
                    No resume skills detected yet.
                </div>
            `;

            return;
        }

        container.innerHTML =
            skills
                .map(
                    skill =>
                        `<span class="skill-tag">${escapeHtml(
                            skill
                        )}</span>`
                )
                .join("");
    }

    /* ============================================================
       SKILL GAP
       ============================================================ */

    function renderSkillGap() {

        const userContainer =
            $("skillgap-user-skills");

        const requiredContainer =
            $("skillgap-required-skills");

        const missingContainer =
            $("missing-skills-list");

        const userSkills =
            normalizeSkills(
                state.extractedSkills
            );

        const requiredSkills =
            normalizeSkills(
                state.requiredSkills
            );

        const userSet =
            new Set(
                userSkills.map(
                    normalizeSkill
                )
            );

        const missing =
            requiredSkills.filter(
                skill =>
                    !userSet.has(
                        normalizeSkill(
                            skill
                        )
                    )
            );

        if (
            userContainer
        ) {

            userContainer.innerHTML =
                userSkills.length

                    ? userSkills
                        .map(
                            skill =>
                                `<span class="skill-tag">${escapeHtml(
                                    skill
                                )}</span>`
                        )
                        .join("")

                    : `<span class="muted">No skills detected</span>`;
        }

        if (
            requiredContainer
        ) {

            requiredContainer.innerHTML =
                requiredSkills.length

                    ? requiredSkills
                        .map(
                            skill =>
                                `<span class="skill-tag required">${escapeHtml(
                                    skill
                                )}</span>`
                        )
                        .join("")

                    : `<span class="muted">No required skills available</span>`;
        }

        if (
            missingContainer
        ) {

            missingContainer.innerHTML =
                missing.length

                    ? missing
                        .map(
                            skill =>
                                `<li>${escapeHtml(
                                    skill
                                )}</li>`
                        )
                        .join("")

                    : `<li>No major skill gaps detected.</li>`;
        }
    }

    /* ============================================================
       JOB RANKING
       ============================================================ */

    function initJobRanking() {

        const button =
            $("rank-career-jobs");

        if (!button) {
            return;
        }

        button.addEventListener(
            "click",
            async event => {

                event.preventDefault();

                if (
                    !state.careerJobs.length
                ) {

                    const url =
                        $("jobs-career-url")
                            ?.value ||
                        $("career-url")
                            ?.value ||
                        state.careerUrl;

                    if (url) {

                        if (
                            $("career-url")
                        ) {
                            $("career-url")
                                .value =
                                url;
                        }

                        await scrapeCareerUrl();

                    } else {

                        await showWarningPopup(
                            "No Career Source",
                            "Please enter a career URL before ranking jobs."
                        );
                    }

                    return;
                }

                state.careerJobs =
                    rankJobs(
                        state.careerJobs
                    );

                renderJobs();

                updateStats();

                await showSuccessPopup(
                    "Jobs Ranked",
                    "The available job postings have been ranked according to your resume skills."
                );
            }
        );
    }

    /* ============================================================
       ROADMAP
       ============================================================ */

    async function loadRoadmap() {

        try {

            const result =
                await apiRequest(
                    "roadmap",
                    {
                        skills:
                            JSON.stringify(
                                state.extractedSkills
                            ),

                        required_skills:
                            JSON.stringify(
                                state.requiredSkills
                            ),

                        target_role:
                            state.targetRole
                    }
                );

            if (
                !apiSuccess(
                    result
                )
            ) {
                return;
            }

            const container =
                $("container-dynamic-roadmap");

            const resources =
                $("container-dynamic-resources");

            const data =
                result.roadmap ||
                result.data ||
                result;

            const steps =
                Array.isArray(
                    data
                )
                    ? data
                    : Array.isArray(
                        data.steps
                    )
                        ? data.steps
                        : [];

            if (
                container
            ) {

                if (
                    !steps.length
                ) {

                    container.innerHTML = `
                        <div class="empty-state">
                            No roadmap steps are available yet.
                        </div>
                    `;

                } else {

                    container.innerHTML =
                        steps
                            .map(
                                (
                                    step,
                                    index
                                ) => {

                                    const title =
                                        typeof step ===
                                        "string"
                                            ? step
                                            : step.title ||
                                              step.name ||
                                              `Step ${index + 1}`;

                                    const description =
                                        typeof step ===
                                        "string"
                                            ? ""
                                            : step.description ||
                                              step.details ||
                                              "";

                                    return `

                                        <div class="roadmap-step">

                                            <div class="roadmap-number">
                                                ${index + 1}
                                            </div>

                                            <div class="roadmap-content">

                                                <h3>
                                                    ${escapeHtml(
                                                        title
                                                    )}
                                                </h3>

                                                ${
                                                    description
                                                        ? `
                                                            <p>
                                                                ${escapeHtml(
                                                                    description
                                                                )}
                                                            </p>
                                                        `
                                                        : ""
                                                }

                                            </div>

                                        </div>
                                    `;
                                }
                            )
                            .join("");
                }
            }

            if (
                resources
            ) {

                const list =
                    data.resources ||
                    data.learning_resources ||
                    [];

                if (
                    Array.isArray(
                        list
                    ) &&
                    list.length
                ) {

                    resources.innerHTML =
                        list
                            .map(
                                resource => {

                                    if (
                                        typeof resource ===
                                        "string"
                                    ) {

                                        return `
                                            <div class="resource-item">
                                                ${escapeHtml(
                                                    resource
                                                )}
                                            </div>
                                        `;
                                    }

                                    const title =
                                        resource.title ||
                                        resource.name ||
                                        "Learning Resource";

                                    const url =
                                        resource.url ||
                                        resource.link ||
                                        "";

                                    return `
                                        <div class="resource-item">

                                            ${
                                                url
                                                    ? `
                                                        <a
                                                            href="${escapeHtml(
                                                                url
                                                            )}"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            ${escapeHtml(
                                                                title
                                                            )}
                                                        </a>
                                                    `
                                                    : escapeHtml(
                                                        title
                                                    )
                                            }

                                        </div>
                                    `;
                                }
                            )
                            .join("");
                }
            }

        } catch (
            error
        ) {

            console.error(
                "Roadmap error:",
                error
            );
        }
    }

    /* ============================================================
       AI INTERVIEW TABS
       ============================================================ */

    function initAIInterviewTabs() {

        const buttons =
            qsa(
                "[data-interview-tab]"
            );

        if (
            !buttons.length
        ) {
            return;
        }

        buttons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const target =
                            button.dataset
                                .interviewTab;

                        buttons.forEach(
                            item =>
                                item.classList.toggle(
                                    "active",
                                    item ===
                                        button
                                )
                        );

                        qsa(
                            "[data-interview-panel]"
                        ).forEach(
                            panel => {

                                panel.classList.toggle(
                                    "active",
                                    panel.dataset
                                        .interviewPanel ===
                                        target
                                );
                            }
                        );
                    }
                );
            }
        );
    }

    /* ============================================================
       AI INTERVIEW QUESTION
       ============================================================ */

    async function generateInterviewQuestion() {

        const button =
            $("generate-interview-question");

        const question =
            $("interview-question");

        if (!question) {
            return;
        }

        setLoading(
            button,
            true,
            "Generating..."
        );

        try {

            const result =
                await apiRequest(
                    "interview_question",
                    {
                        target_role:
                            state.targetRole,

                        skills:
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
                !apiSuccess(
                    result
                )
            ) {

                await showErrorPopup(
                    "Interview Question Failed",
                    result?.message ||
                        "Unable to generate an interview question."
                );

                return;
            }

            const value =
                result.question ||
                result.data?.question ||
                result.data ||
                "No question generated.";

            question.textContent =
                typeof value ===
                "string"
                    ? value
                    : value.question ||
                      value.text ||
                      "No question generated.";

            const feedback =
                $("interview-feedback");

            if (
                feedback
            ) {
                feedback.textContent =
                    "";
            }

        } catch (
            error
        ) {

            console.error(
                "Interview question error:",
                error
            );

            await showErrorPopup(
                "Interview Error",
                "Unable to generate an interview question."
            );

        } finally {

            setLoading(
                button,
                false
            );
        }
    }

    function initAIInterviewAssistant() {

        const button =
            $("generate-interview-question");

        if (
            button &&
            button.dataset.initialized !==
                "true"
        ) {

            button.dataset.initialized =
                "true";

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    generateInterviewQuestion();
                }
            );
        }
    }

    /* ============================================================
       ANSWER EVALUATOR
       ============================================================ */

    async function submitInterviewAnswer() {

        const button =
            $("submit-interview-answer");

        const question =
            $("interview-question")
                ?.textContent ||
            "";

        const answer =
            $("interview-answer")
                ?.value ||
            "";

        const feedback =
            $("interview-feedback");

        if (
            !answer.trim()
        ) {

            await showWarningPopup(
                "Answer Required",
                "Please write your answer before submitting it."
            );

            return;
        }

        setLoading(
            button,
            true,
            "Evaluating..."
        );

        try {

            const result =
                await apiRequest(
                    "evaluate_interview",
                    {
                        question,
                        answer,
                        target_role:
                            state.targetRole
                    }
                );

            if (
                !apiSuccess(
                    result
                )
            ) {

                await showErrorPopup(
                    "Evaluation Failed",
                    result?.message ||
                        "Unable to evaluate your answer."
                );

                return;
            }

            const value =
                result.feedback ||
                result.data?.feedback ||
                result.data ||
                result.message ||
                "Answer evaluated successfully.";

            if (
                feedback
            ) {

                feedback.textContent =
                    typeof value ===
                    "string"
                        ? value
                        : value.feedback ||
                          value.text ||
                          "Answer evaluated successfully.";
            }

        } catch (
            error
        ) {

            console.error(
                "Answer evaluation error:",
                error
            );

            await showErrorPopup(
                "Evaluation Failed",
                "An unexpected error occurred while evaluating your answer."
            );

        } finally {

            setLoading(
                button,
                false
            );
        }
    }

    function initAnswerEvaluator() {

        const button =
            $("submit-interview-answer");

        if (
            button &&
            button.dataset.initialized !==
                "true"
        ) {

            button.dataset.initialized =
                "true";

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    submitInterviewAnswer();
                }
            );
        }
    }

    /* ============================================================
       AI ASSISTANT
       ============================================================ */

    async function submitAIAssistant() {

        const button =
            $("btn-submit-ai-prompt");

        const input =
            $("input-ai-prompt");

        const card =
            $("ai-assistant-response-card");

        const title =
            $("ai-response-title");

        const body =
            $("ai-response-body");

        const prompt =
            safeText(
                input?.value
            );

        if (!prompt) {

            await showWarningPopup(
                "Prompt Required",
                "Please enter a question or request for the AI assistant."
            );

            return;
        }

        setLoading(
            button,
            true,
            "Thinking..."
        );

        try {

            const result =
                await apiRequest(
                    "ai_assistant",
                    {
                        prompt,

                        target_role:
                            state.targetRole,

                        skills:
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
                !apiSuccess(
                    result
                )
            ) {

                await showErrorPopup(
                    "AI Assistant Error",
                    result?.message ||
                        "Unable to process your request."
                );

                return;
            }

            const response =
                result.response ||
                result.answer ||
                result.data?.response ||
                result.data?.answer ||
                result.data ||
                "";

            if (
                card
            ) {
                card.style.display =
                    "";
            }

            if (
                title
            ) {
                title.textContent =
                    "AI Assistant Response";
            }

            if (
                body
            ) {

                body.textContent =
                    typeof response ===
                    "string"
                        ? response
                        : JSON.stringify(
                            response,
                            null,
                            2
                        );
            }

        } catch (
            error
        ) {

            console.error(
                "AI assistant error:",
                error
            );

            await showErrorPopup(
                "AI Assistant Error",
                "An unexpected error occurred while processing your request."
            );

        } finally {

            setLoading(
                button,
                false
            );
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

        if (
            form.dataset.initialized ===
                "true"
        ) {
            return;
        }

        form.dataset.initialized =
            "true";

        form.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const formData =
                    new FormData(
                        form
                    );

                if (
                    !formData.has(
                        "action"
                    )
                ) {

                    formData.append(
                        "action",
                        "update_profile"
                    );
                }

                const message =
                    $("profile-message");

                try {

                    const result =
                        await apiRequest(
                            "update_profile",
                            formData
                        );

                    if (
                        apiSuccess(
                            result
                        )
                    ) {

                        showMessage(
                            "profile-message",
                            result.message ||
                                "Profile updated successfully.",
                            "success"
                        );

                        if (
                            result.user
                        ) {
                            state.user =
                                result.user;
                        }

                        await showSuccessPopup(
                            "Profile Updated",
                            result.message ||
                                "Your profile has been updated successfully."
                        );

                    } else {

                        showMessage(
                            "profile-message",
                            result.message ||
                                "Unable to update profile.",
                            "error"
                        );

                        await showErrorPopup(
                            "Profile Update Failed",
                            result.message ||
                                "Unable to update profile."
                        );
                    }

                } catch (
                    error
                ) {

                    console.error(
                        "Profile update error:",
                        error
                    );

                    showMessage(
                        "profile-message",
                        "Unable to update profile.",
                        "error"
                    );

                    await showErrorPopup(
                        "Profile Update Failed",
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

        const buttons = [

            $("logout-button"),

            $("btn-logout")

        ].filter(
            Boolean
        );

        buttons.forEach(
            button => {

                if (
                    button.dataset
                        .initialized ===
                    "true"
                ) {
                    return;
                }

                button.dataset
                    .initialized =
                    "true";

                button.addEventListener(
                    "click",
                    async event => {

                        event.preventDefault();

                        button.disabled =
                            true;

                        try {

                            await apiRequest(
                                "logout",
                                {},
                                "GET"
                            );

                        } catch (
                            error
                        ) {

                            console.error(
                                "Logout error:",
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
       REPORT
       ============================================================ */

    function initReportForm() {

        const form =
            $("report-form");

        if (!form) {
            return;
        }

        if (
            form.dataset.initialized ===
                "true"
        ) {
            return;
        }

        form.dataset.initialized =
            "true";

        form.addEventListener(
            "submit",
            () => {

                const company =
                    form.querySelector(
                        "[name='target_company']"
                    );

                const role =
                    form.querySelector(
                        "[name='target_role']"
                    );

                if (
                    company
                ) {

                    company.value =
                        state.targetCompany ||
                        "";
                }

                if (
                    role
                ) {

                    role.value =
                        state.targetRole ||
                        "";
                }
            }
        );
    }

    /* ============================================================
       DYNAMIC TARGET INITIALIZATION
       ============================================================ */

    function initializeTarget() {

        updateTargetUI();

        if (
            state.careerUrl
        ) {

            const input =
                findCareerUrlInput();

            if (
                input
            ) {

                input.value =
                    state.careerUrl;
            }

            const jobsInput =
                $("jobs-career-url");

            if (
                jobsInput
            ) {

                jobsInput.value =
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

        if (
            state.careerJobs.length
        ) {

            state.careerJobCount =
                state.careerJobs.length;
        }

        renderExtractedSkills();

        renderATS();

        renderSkillGap();

        renderJobs();

        updateStats();
    }

    /* ============================================================
       LOGGED OUT UI
       ============================================================ */

    function hideCareerElementsWhenLoggedOut() {

        if (
            state.loggedIn
        ) {
            return;
        }

        /*
         * The server-side PHP already prevents dashboard
         * rendering for logged-out users.
         *
         * This is an additional frontend safety layer.
         */
        const selectors = [

            "#career-url",

            "#scrape-career-url",

            "#jobs-career-url",

            "#rank-career-jobs"
        ];

        selectors.forEach(
            selector => {

                const element =
                    $(selector.replace(
                        "#",
                        ""
                    ));

                if (!element) {
                    return;
                }

                const parent =
                    element.closest(
                        ".career-url-card"
                    ) ||
                    element.closest(
                        ".career-source"
                    ) ||
                    element.closest(
                        ".career-url-section"
                    );

                if (
                    parent
                ) {

                    parent.style.display =
                        "none";
                }
            }
        );
    }

    /* ============================================================
       FAVICON
       ============================================================ */

    function fixFavicon404() {

        const existing =
            document.querySelector(
                "link[rel~='icon']"
            );

        if (
            existing
        ) {
            return;
        }

        const favicon =
            document.createElement(
                "link"
            );

        favicon.rel =
            "icon";

        favicon.type =
            "image/svg+xml";

        favicon.href =
            "data:image/svg+xml," +
            encodeURIComponent(`
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 64 64"
                >
                    <rect
                        width="64"
                        height="64"
                        rx="14"
                        fill="#635bff"
                    />

                    <text
                        x="32"
                        y="43"
                        text-anchor="middle"
                        font-size="34"
                        font-family="Arial, sans-serif"
                        font-weight="700"
                        fill="white"
                    >
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

    function safeInit(
        name,
        fn
    ) {

        try {

            if (
                typeof fn !==
                "function"
            ) {

                console.warn(
                    `Initialization skipped: ${name} is unavailable.`
                );

                return;
            }

            fn();

        } catch (
            error
        ) {

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

        /*
         * Popup FIRST
         */
        safeInit(
            "popup system",
            initPopupSystem
        );

        /*
         * Favicon
         */
        safeInit(
            "favicon",
            fixFavicon404
        );

        /*
         * Authentication
         */
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

        /*
         * Theme
         */
        safeInit(
            "theme",
            initTheme
        );

        /*
         * Sidebar
         */
        safeInit(
            "sidebar",
            initSidebar
        );

        /*
         * Navigation
         */
        safeInit(
            "navigation",
            initNavigation
        );

        /*
         * Career URL
         */
        safeInit(
            "career URL",
            initCareerUrl
        );

        /*
         * Resume
         */
        safeInit(
            "resume upload",
            initResumeUpload
        );

        /*
         * Job ranking
         */
        safeInit(
            "job ranking",
            initJobRanking
        );

        /*
         * Profile
         */
        safeInit(
            "profile",
            initProfileForm
        );

        /*
         * Interview tabs
         */
        safeInit(
            "AI interview tabs",
            initAIInterviewTabs
        );

        /*
         * AI interview
         */
        safeInit(
            "AI interview assistant",
            initAIInterviewAssistant
        );

        /*
         * Answer evaluator
         */
        safeInit(
            "answer evaluator",
            initAnswerEvaluator
        );

        /*
         * Logout
         */
        safeInit(
            "logout",
            initLogout
        );

        /*
         * Report
         */
        safeInit(
            "report",
            initReportForm
        );

        /*
         * Dynamic target data
         */
        safeInit(
            "target initialization",
            initializeTarget
        );

        /*
         * Logged-out protection
         */
        safeInit(
            "logged-out career UI",
            hideCareerElementsWhenLoggedOut
        );

        /*
         * Metrics
         *
         * IMPORTANT:
         * updateStats() runs AFTER loadMetrics().
         */
        if (
            state.loggedIn
        ) {

            loadMetrics()
                .then(
                    () => {

                        renderATS();

                        renderExtractedSkills();

                        renderSkillGap();

                        if (
                            state.careerJobs.length
                        ) {

                            renderJobs();
                        }

                        /*
                         * FINAL JOB COUNT UPDATE
                         */
                        updateStats();
                    }
                )
                .catch(
                    error => {

                        console.error(
                            "Initial metrics error:",
                            error
                        );

                        updateStats();
                    }
                );

        } else {

            updateStats();
        }

        /*
         * Remove loading screen.
         */
        hidePageLoader();

        /*
         * Extra protection.
         */
        setTimeout(
            () => {

                hidePageLoader();

            },
            1200
        );
    }

    /* ============================================================
       START APPLICATION
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

    /* ============================================================
       WINDOW LOAD SAFETY
       ============================================================ */

    window.addEventListener(
        "load",
        () => {

            hidePageLoader();

            setTimeout(
                () => {

                    hidePageLoader();

                },
                300
            );
        },
        {
            once: true
        }
    );

})();
