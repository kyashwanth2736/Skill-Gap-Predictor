/* =========================================================
   SKILL-GAP PREDICTOR
   FRONTEND CONTROLLER
========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const APP = window.APP_DATA || {};

    /* =====================================================
       LOADER
    ===================================================== */

    setTimeout(() => {

        const loader = document.getElementById("page-loader");

        if (loader) {
            loader.classList.add("hidden");
        }

    }, 450);


    /* =====================================================
       THEME
    ===================================================== */

    initTheme();


    /* =====================================================
       AUTH
    ===================================================== */

    initAuth();


    /* =====================================================
       SIDEBAR
    ===================================================== */

    initSidebar();


    /* =====================================================
       NAVIGATION
    ===================================================== */

    initNavigation();


    /* =====================================================
       RESUME
    ===================================================== */

    initResume();


    /* =====================================================
       CAREER URL
    ===================================================== */

    initCareerURL();


    /* =====================================================
       PROFILE
    ===================================================== */

    initProfile();


    /* =====================================================
       INTERVIEW
    ===================================================== */

    initInterview();

});


/* =========================================================
   HELPERS
========================================================= */

async function api(action, data = {}, method = "POST") {

    const options = {
        method,
        headers: {}
    };

    if (method !== "GET") {

        const body = new URLSearchParams();

        Object.keys(data).forEach(key => {

            if (
                Array.isArray(data[key]) ||
                typeof data[key] === "object"
            ) {
                body.append(
                    key,
                    JSON.stringify(data[key])
                );
            } else {
                body.append(
                    key,
                    data[key] ?? ""
                );
            }

        });

        options.headers["Content-Type"] =
            "application/x-www-form-urlencoded;charset=UTF-8";

        options.body = body.toString();
    }

    const response = await fetch(
        `api.php?action=${encodeURIComponent(action)}`,
        options
    );

    const text = await response.text();

    let result;

    try {
        result = JSON.parse(text);
    } catch (error) {

        console.error("Invalid API response:", text);

        throw new Error(
            "Server returned an invalid response."
        );
    }

    if (!response.ok) {

        throw new Error(
            result.message ||
            "Request failed."
        );
    }

    return result;
}


function setMessage(element, message, type = "") {

    if (!element) {
        return;
    }

    element.textContent = message;

    element.className =
        `form-message ${type}`.trim();
}


function setStatus(element, message, type = "") {

    if (!element) {
        return;
    }

    element.textContent = message;

    element.className =
        `status-message ${type}`.trim();
}


function escapeHTML(value) {

    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
}


/* =========================================================
   THEME
========================================================= */

function initTheme() {

    const savedTheme =
        localStorage.getItem("sgp-theme") ||
        "dark";

    applyTheme(savedTheme);

    const buttons = [
        document.getElementById("theme-toggle"),
        document.getElementById("top-theme-toggle")
    ];

    buttons.forEach(button => {

        if (!button) {
            return;
        }

        button.addEventListener("click", () => {

            const current =
                document.documentElement.dataset.theme === "light"
                    ? "light"
                    : "dark";

            const next =
                current === "dark"
                    ? "light"
                    : "dark";

            applyTheme(next);

            localStorage.setItem(
                "sgp-theme",
                next
            );

        });

    });
}


function applyTheme(theme) {

    document.documentElement.dataset.theme =
        theme;

    const icon =
        document.getElementById("theme-icon");

    const text =
        document.getElementById("theme-text");

    const topButton =
        document.getElementById("top-theme-toggle");

    if (theme === "light") {

        if (icon) {
            icon.textContent = "☀️";
        }

        if (text) {
            text.textContent = "Light Mode";
        }

        if (topButton) {
            topButton.textContent = "☀️";
        }

    } else {

        if (icon) {
            icon.textContent = "🌙";
        }

        if (text) {
            text.textContent = "Dark Mode";
        }

        if (topButton) {
            topButton.textContent = "🌙";
        }
    }
}


/* =========================================================
   AUTH
========================================================= */

function initAuth() {

    const loginTab =
        document.getElementById("login-tab");

    const signupTab =
        document.getElementById("signup-tab");

    const loginPanel =
        document.getElementById("login-panel");

    const signupPanel =
        document.getElementById("signup-panel");

    if (loginTab && signupTab) {

        loginTab.addEventListener("click", () => {

            loginTab.classList.add("active");
            signupTab.classList.remove("active");

            loginPanel.classList.add("active");
            signupPanel.classList.remove("active");

        });

        signupTab.addEventListener("click", () => {

            signupTab.classList.add("active");
            loginTab.classList.remove("active");

            signupPanel.classList.add("active");
            loginPanel.classList.remove("active");

        });

    }


    /* LOGIN */

    const loginForm =
        document.getElementById("login-form");

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const email =
                    document.getElementById("login_email")
                        ?.value
                        .trim();

                const password =
                    document.getElementById("login_password")
                        ?.value;

                const message =
                    document.getElementById("login-message");

                setMessage(
                    message,
                    "Signing in...",
                    ""
                );

                try {

                    const result = await api(
                        "login",
                        {
                            email,
                            password
                        }
                    );

                    if (!result.success) {

                        throw new Error(
                            result.message ||
                            "Login failed."
                        );
                    }

                    setMessage(
                        message,
                        "Login successful. Loading dashboard...",
                        "success"
                    );

                    setTimeout(() => {
                        window.location.reload();
                    }, 500);

                } catch (error) {

                    setMessage(
                        message,
                        error.message,
                        "error"
                    );
                }

            }
        );

    }


    /* SIGNUP */

    const signupForm =
        document.getElementById("signup-form");

    const terms =
        document.getElementById("signup-terms");

    const signupButton =
        document.getElementById("btn-do-signup");

    if (terms && signupButton) {

        terms.addEventListener(
            "change",
            () => {

                signupButton.disabled =
                    !terms.checked;

            }
        );

    }


    if (signupForm) {

        signupForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                if (terms && !terms.checked) {
                    return;
                }

                const password =
                    document.getElementById("signup_pwd")
                        ?.value || "";

                const passwordRegex =
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

                const message =
                    document.getElementById("signup-message");

                if (!passwordRegex.test(password)) {

                    setMessage(
                        message,
                        "Password must contain uppercase, lowercase, number, special character and at least 8 characters.",
                        "error"
                    );

                    return;
                }

                setMessage(
                    message,
                    "Creating your account..."
                );

                try {

                    const result = await api(
                        "signup",
                        {
                            name:
                                document.getElementById("signup_name")?.value.trim(),

                            email:
                                document.getElementById("signup_email")?.value.trim(),

                            password,

                            university:
                                document.getElementById("signup_uni")?.value.trim(),

                            degree:
                                document.getElementById("signup_branch")?.value.trim(),

                            major:
                                document.getElementById("signup_major")?.value.trim(),

                            graduation_year:
                                document.getElementById("signup_gradyear")?.value,

                            linkedin:
                                document.getElementById("signup_linkedin")?.value.trim(),

                            github:
                                document.getElementById("signup_github")?.value.trim(),

                            skills: []
                        }
                    );

                    if (!result.success) {

                        throw new Error(
                            result.message ||
                            "Registration failed."
                        );
                    }

                    setMessage(
                        message,
                        "Account created successfully. You can now log in.",
                        "success"
                    );

                    signupForm.reset();

                    if (signupButton) {
                        signupButton.disabled = true;
                    }

                } catch (error) {

                    setMessage(
                        message,
                        error.message,
                        "error"
                    );

                }

            }
        );

    }


    /* PASSWORD TOGGLES */

    setupPasswordToggle(
        "toggle-login-password",
        "login_password"
    );

    setupPasswordToggle(
        "toggle-signup-password",
        "signup_pwd"
    );

}


function setupPasswordToggle(buttonId, inputId) {

    const button =
        document.getElementById(buttonId);

    const input =
        document.getElementById(inputId);

    if (!button || !input) {
        return;
    }

    button.addEventListener(
        "click",
        () => {

            if (input.type === "password") {

                input.type = "text";
                button.textContent = "🙈";

            } else {

                input.type = "password";
                button.textContent = "👁️";

            }

        }
    );

}


/* =========================================================
   SIDEBAR
========================================================= */

function initSidebar() {

    const sidebar =
        document.getElementById("sidebar");

    const overlay =
        document.getElementById("sidebar-overlay");

    const menu =
        document.getElementById("mobile-menu-toggle");

    const close =
        document.getElementById("sidebar-close");

    function openSidebar() {

        if (!sidebar) {
            return;
        }

        sidebar.classList.add("open");

        if (overlay) {
            overlay.classList.add("active");
        }

    }

    function closeSidebar() {

        if (!sidebar) {
            return;
        }

        sidebar.classList.remove("open");

        if (overlay) {
            overlay.classList.remove("active");
        }

    }

    if (menu) {
        menu.addEventListener(
            "click",
            openSidebar
        );
    }

    if (close) {
        close.addEventListener(
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

    window.closeSidebar =
        closeSidebar;

}


/* =========================================================
   NAVIGATION
========================================================= */

function initNavigation() {

    const navItems =
        document.querySelectorAll(
            ".nav-item[data-view]"
        );

    const panels =
        document.querySelectorAll(
            ".view-panel"
        );

    function showView(viewName) {

        panels.forEach(panel => {

            panel.classList.remove(
                "active-view"
            );

        });

        navItems.forEach(item => {

            item.classList.remove(
                "active"
            );

        });

        const target =
            document.getElementById(
                `view-${viewName}`
            );

        if (target) {

            target.classList.add(
                "active-view"
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }

        navItems.forEach(item => {

            if (
                item.dataset.view === viewName
            ) {

                item.classList.add(
                    "active"
                );

            }

        });

        if (window.closeSidebar) {
            window.closeSidebar();
        }

    }

    navItems.forEach(item => {

        item.addEventListener(
            "click",
            () => {

                showView(
                    item.dataset.view
                );

            }
        );

    });


    document.querySelectorAll(
        "[data-open-view]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                showView(
                    button.dataset.openView
                );

            }
        );

    });

}


/* =========================================================
   RESUME
========================================================= */

function initResume() {

    const fileInput =
        document.getElementById("resume-file");

    const dropZone =
        document.getElementById("resume-drop-zone");

    const evaluateButton =
        document.getElementById("evaluate-resume");

    if (!fileInput || !evaluateButton) {
        return;
    }


    if (dropZone) {

        [
            "dragenter",
            "dragover"
        ].forEach(eventName => {

            dropZone.addEventListener(
                eventName,
                event => {

                    event.preventDefault();

                    dropZone.classList.add(
                        "dragging"
                    );

                }
            );

        });

        [
            "dragleave",
            "drop"
        ].forEach(eventName => {

            dropZone.addEventListener(
                eventName,
                event => {

                    event.preventDefault();

                    dropZone.classList.remove(
                        "dragging"
                    );

                }
            );

        });

        dropZone.addEventListener(
            "drop",
            event => {

                const files =
                    event.dataTransfer.files;

                if (files.length) {

                    fileInput.files =
                        files;

                    updateUploadText(
                        files[0]
                    );

                }

            }
        );

    }


    fileInput.addEventListener(
        "change",
        () => {

            if (fileInput.files.length) {

                updateUploadText(
                    fileInput.files[0]
                );

            }

        }
    );


    evaluateButton.addEventListener(
        "click",
        async () => {

            const file =
                fileInput.files[0];

            const status =
                document.getElementById(
                    "resume-status"
                );

            if (!file) {

                setStatus(
                    status,
                    "Please select a PDF or DOCX resume.",
                    "error"
                );

                return;
            }

            const formData =
                new FormData();

            formData.append(
                "resume",
                file
            );

            setStatus(
                status,
                "Parsing your resume...",
                "loading"
            );

            evaluateButton.disabled = true;

            try {

                const response =
                    await fetch(
                        "api.php?action=upload_resume",
                        {
                            method: "POST",
                            body: formData
                        }
                    );

                const result =
                    await response.json();

                if (!result.success) {

                    throw new Error(
                        result.message ||
                        "Resume processing failed."
                    );

                }

                updateResumeUI(result);

                setStatus(
                    status,
                    "Resume parsed and analyzed successfully.",
                    "success"
                );

                setTimeout(() => {
                    window.location.reload();
                }, 900);

            } catch (error) {

                setStatus(
                    status,
                    error.message,
                    "error"
                );

            } finally {

                evaluateButton.disabled = false;

            }

        }
    );

}


function updateUploadText(file) {

    const zone =
        document.getElementById(
            "resume-drop-zone"
        );

    if (!zone) {
        return;
    }

    const title =
        zone.querySelector("h3");

    const text =
        zone.querySelector("p");

    if (title) {
        title.textContent =
            file.name;
    }

    if (text) {
        text.textContent =
            `${(file.size / 1024 / 1024).toFixed(2)} MB`;
    }

}


function updateResumeUI(result) {

    const parsed =
        result.parsed_resume ||
        result.parsed ||
        {};

    const contact =
        parsed.contact_info ||
        {};

    const skills =
        result.extracted_skills ||
        result.skills ||
        [];

    const ats =
        result.ats_score;

    setText(
        "resume-name",
        contact.name || "N/A"
    );

    setText(
        "resume-email",
        contact.email || "N/A"
    );

    setText(
        "resume-phone",
        contact.phone || "N/A"
    );

    setText(
        "resume-linkedin",
        contact.linkedin || "N/A"
    );

    setText(
        "resume-github",
        contact.github || "N/A"
    );

    setText(
        "resume-word-count",
        parsed.word_count || 0
    );

    const skillContainer =
        document.getElementById(
            "extracted-skills-container"
        );

    if (skillContainer) {

        skillContainer.innerHTML = "";

        skills.forEach(skill => {

            const pill =
                document.createElement("span");

            pill.className =
                "skill-pill";

            pill.textContent =
                skill;

            skillContainer.appendChild(
                pill
            );

        });

    }

    if (ats !== undefined) {

        setText(
            "stat-ats",
            `${Math.round(ats)}%`
        );

    }

    setText(
        "stat-skills",
        skills.length
    );

}


function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value;
    }

}


/* =========================================================
   CAREER URL
========================================================= */

function initCareerURL() {

    const mainButton =
        document.getElementById(
            "scrape-career-url"
        );

    const rankingButton =
        document.getElementById(
            "rank-career-jobs"
        );

    const mainInput =
        document.getElementById(
            "career-url"
        );

    const rankingInput =
        document.getElementById(
            "jobs-career-url"
        );


    if (mainButton) {

        mainButton.addEventListener(
            "click",
            () => {

                const url =
                    mainInput?.value.trim();

                analyzeCareerURL(url);

            }
        );

    }


    if (rankingButton) {

        rankingButton.addEventListener(
            "click",
            () => {

                const url =
                    rankingInput?.value.trim();

                analyzeCareerURL(url, true);

            }
        );

    }

}


async function analyzeCareerURL(
    url,
    showJobs = false
) {

    const status =
        document.getElementById(
            "scrape-status"
        );

    if (!url) {

        setStatus(
            status,
            "Please enter a career URL.",
            "error"
        );

        return;
    }

    try {

        new URL(url);

    } catch {

        setStatus(
            status,
            "Please enter a valid URL.",
            "error"
        );

        return;
    }

    setStatus(
        status,
        "Reading the career page and discovering available jobs...",
        "loading"
    );

    try {

        const result =
            await api(
                "scrape_url",
                {
                    url
                }
            );

        if (!result.success) {

            throw new Error(
                result.message ||
                "Could not analyze career page."
            );

        }

        const jobs =
            result.jobs ||
            result.data?.jobs ||
            [];

        renderJobs(jobs);

        setText(
            "stat-jobs",
            jobs.length
        );

        if (result.recommendation) {

            renderRecommendation(
                result.recommendation
            );

        }

        setStatus(
            status,
            `${jobs.length} job(s) discovered successfully.`,
            "success"
        );

        if (showJobs) {

            const jobsPanel =
                document.getElementById(
                    "view-jobs"
                );

            document
                .querySelectorAll(".view-panel")
                .forEach(panel => {

                    panel.classList.remove(
                        "active-view"
                    );

                });

            jobsPanel?.classList.add(
                "active-view"
            );

        }

    } catch (error) {

        setStatus(
            status,
            error.message,
            "error"
        );

    }

}


/* =========================================================
   JOB RENDERING
========================================================= */

function renderJobs(jobs) {

    const container =
        document.getElementById(
            "job-results"
        );

    if (!container) {
        return;
    }

    if (!Array.isArray(jobs) || !jobs.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔎</div>
                <h3>No jobs were discovered</h3>
                <p>
                    The supplied career page did not expose
                    readable job listings.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        jobs.map(
            (job, index) => {

                const role =
                    job.role ||
                    job.title ||
                    job.job_title ||
                    "Job Role";

                const company =
                    job.company ||
                    job.company_name ||
                    job.employer ||
                    "";

                const score =
                    Number(
                        job.score ||
                        job.match_score ||
                        0
                    );

                const skills =
                    job.required_skills ||
                    job.skills ||
                    [];

                const url =
                    job.url ||
                    job.job_url ||
                    job.link ||
                    "";

                return `
                    <article
                        class="job-card ${index === 0 ? "recommended" : ""}"
                    >

                        <div class="job-card-header">

                            <div>

                                <h3>
                                    ${escapeHTML(role)}
                                </h3>

                                ${
                                    company
                                        ? `<div class="job-company">
                                            ${escapeHTML(company)}
                                           </div>`
                                        : ""
                                }

                            </div>

                            ${
                                score
                                    ? `<div class="job-score">
                                        ${Math.round(score)}%
                                       </div>`
                                    : ""
                            }

                        </div>

                        ${
                            Array.isArray(skills) &&
                            skills.length
                                ? `
                                    <div class="job-skills">
                                        ${skills
                                            .map(
                                                skill =>
                                                    `<span class="job-skill">
                                                        ${escapeHTML(skill)}
                                                     </span>`
                                            )
                                            .join("")}
                                    </div>
                                  `
                                : ""
                        }

                        ${
                            url
                                ? `
                                    <div class="job-actions">
                                        <a
                                            href="${escapeHTML(url)}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="job-link"
                                        >
                                            View Job →
                                        </a>
                                    </div>
                                  `
                                : ""
                        }

                    </article>
                `;

            }
        ).join("");

}


function renderRecommendation(job) {

    const card =
        document.getElementById(
            "recommendation-card"
        );

    if (!card) {
        return;
    }

    const role =
        job.role ||
        job.title ||
        "Recommended Job Role";

    const company =
        job.company ||
        job.company_name ||
        "";

    const score =
        Number(
            job.score ||
            job.match_score ||
            0
        );

    card.classList.add(
        "has-result"
    );

    card.innerHTML = `

        <div class="recommendation-top">

            <span class="success-badge">
                ✓ Recommended Match
            </span>

            <span class="match-score">
                ${Math.round(score)}%
            </span>

        </div>

        <h2>
            ${escapeHTML(role)}
        </h2>

        ${
            company
                ? `<p class="company-name">
                    ${escapeHTML(company)}
                   </p>`
                : ""
        }

    `;

    setText(
        "stat-match",
        `${Math.round(score)}%`
    );

}


/* =========================================================
   PROFILE
========================================================= */

function initProfile() {

    const form =
        document.getElementById(
            "profile-form"
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const message =
                document.getElementById(
                    "profile-message"
                );

            try {

                const result =
                    await api(
                        "update_profile",
                        {
                            name:
                                document.getElementById(
                                    "profile_name"
                                )?.value.trim(),

                            university:
                                document.getElementById(
                                    "profile_university"
                                )?.value.trim(),

                            degree:
                                document.getElementById(
                                    "profile_degree"
                                )?.value.trim(),

                            major:
                                document.getElementById(
                                    "profile_major"
                                )?.value.trim(),

                            graduation_year:
                                document.getElementById(
                                    "profile_gradyear"
                                )?.value.trim(),

                            linkedin:
                                document.getElementById(
                                    "profile_linkedin"
                                )?.value.trim(),

                            github:
                                document.getElementById(
                                    "profile_github"
                                )?.value.trim()
                        }
                    );

                if (!result.success) {

                    throw new Error(
                        result.message ||
                        "Profile update failed."
                    );

                }

                setMessage(
                    message,
                    "Profile updated successfully.",
                    "success"
                );

            } catch (error) {

                setMessage(
                    message,
                    error.message,
                    "error"
                );

            }

        }
    );


    const logout =
        document.getElementById(
            "logout-button"
        );

    if (logout) {

        logout.addEventListener(
            "click",
            async () => {

                try {

                    await api(
                        "logout",
                        {}
                    );

                } finally {

                    window.location.href =
                        window.location.pathname;

                }

            }
        );

    }

}


/* =========================================================
   INTERVIEW
========================================================= */

function initInterview() {

    const submit =
        document.getElementById(
            "submit-interview-answer"
        );

    if (!submit) {
        return;
    }

    submit.addEventListener(
        "click",
        async () => {

            const answer =
                document.getElementById(
                    "interview-answer"
                )?.value.trim();

            const feedback =
                document.getElementById(
                    "interview-feedback"
                );

            if (!answer) {

                if (feedback) {
                    feedback.innerHTML =
                        `<div class="empty-text">
                            Please enter an answer first.
                         </div>`;
                }

                return;
            }

            if (feedback) {

                feedback.innerHTML =
                    `<div class="empty-text">
                        Evaluating your answer...
                     </div>`;

            }

            try {

                const result =
                    await api(
                        "evaluate_answer",
                        {
                            answer
                        }
                    );

                if (!result.success) {

                    throw new Error(
                        result.message ||
                        "Could not evaluate answer."
                    );

                }

                if (feedback) {

                    feedback.innerHTML = `
                        <div class="roadmap-step">

                            <div class="roadmap-number">
                                ✓
                            </div>

                            <div>

                                <h3>
                                    Feedback
                                </h3>

                                <p>
                                    ${escapeHTML(
                                        result.feedback ||
                                        "Answer evaluated successfully."
                                    )}
                                </p>

                            </div>

                        </div>
                    `;

                }

            } catch (error) {

                if (feedback) {

                    feedback.innerHTML =
                        `<div class="form-message error">
                            ${escapeHTML(error.message)}
                         </div>`;

                }

            }

        }
    );

}
