document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("typeform-questionnaire");
    const formContainer = document.querySelector(".form-container");
    const homepage = document.querySelector(".homepage");
    const startButton = document.getElementById("start-form");
    const questions = document.querySelectorAll(".question");
    const progressBar = document.getElementById("progress-bar");
    let currentStep = 0;
    let isTransitioning = false;

    const maxCVSize = 2 * 1024 * 1024;
    const maxPortfolioSize = 10 * 1024 * 1024;
    const allowedCVTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    const allowedPortfolioTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

    // Initialize Virtual Select dropdowns
    initializeVirtualSelect();

    // Show form and hide homepage
    startButton.addEventListener("click", () => {
        homepage.style.display = "none";
        formContainer.style.display = "block";
        updateProgressBar();
        focusInputField();
    });

    // Next button logic
    const nextButtons = document.querySelectorAll(".next-btn");
    nextButtons.forEach((button) => {
        button.addEventListener("click", () => {
            moveToNextQuestion();
        });
    });

    // Back button logic
    const backButtons = document.querySelectorAll(".back-btn");
    backButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!isTransitioning) {
                moveToPreviousQuestion();
            }
        });
    });

    // Move to next question
    function moveToNextQuestion() {
        if (isTransitioning) return;
        isTransitioning = true;

        const currentQuestion = questions[currentStep];
        console.log("Moving to next question - Step: ", currentStep);
        console.log("Current Question: ", currentQuestion);
        if (!validateCurrentQuestion()) {
            isTransitioning = false;
            return;
        }

        if (currentStep === 0) {
            userName = form.elements["first-name"].value;
            const userNameSpans = document.querySelectorAll(".user-name");
            userNameSpans.forEach((span) => {
                span.textContent = userName;
            });
        }

        currentQuestion.classList.add("slide-up");
        setTimeout(() => {
            currentQuestion.classList.remove("active", "slide-up");
            currentStep++;
            if (currentStep < questions.length) {
                const nextQuestion = questions[currentStep];
                nextQuestion.classList.add("active");
                nextQuestion.classList.remove("slide-up");
                console.log("Next Question: ", nextQuestion);
                updateProgressBar();
                focusInputField();
            }
            isTransitioning = false;
        }, 250);
    }

    // Move to previous question
    function moveToPreviousQuestion() {
        if (currentStep > 0 && !isTransitioning) {
            isTransitioning = true;
            const currentQuestion = questions[currentStep];
            currentQuestion.classList.add("slide-down");
            setTimeout(() => {
                currentQuestion.classList.remove("active", "slide-down");
                currentStep--;
                const previousQuestion = questions[currentStep];
                previousQuestion.classList.add("active");
                previousQuestion.classList.remove("slide-down");
                updateProgressBar();
                focusInputField();
                isTransitioning = false;
            }, 250);
        }
    }

    // Validate current question
    function validateCurrentQuestion() {
        const currentQuestion = questions[currentStep];
        const warningMessage = currentQuestion.querySelector(".warning");

        if (warningMessage) {
            warningMessage.style.display = "none";
        }

        // Special handling for portfolio step
        if (currentQuestion.id === "portfolio-section") {
            return validatePortfolio();
        }

        const inputs = currentQuestion.querySelectorAll("input, select");

        for (const input of inputs) {
            console.log("Validating input:", input);
            
            // Skip validation for the search input of VirtualSelect
            if (input.classList.contains("vscomp-search-input")) {
                console.log("Skipping VirtualSelect search input");
                continue;
            }

            if (input.classList.contains("vscomp-hidden-input")) {
                console.log("VirtualSelect input found:", input);
                const selectId = input.closest('.vscomp-ele').id;
                const selectedItems = document.querySelector(`#${selectId}`).getSelectedOptions();
                console.log("Selected items:", selectedItems);

                if (!selectedItems || selectedItems.length === 0) {
                    showWarningMessage(warningMessage, "Please select at least one option.");
                    return false;
                }
            } else if (input.type === "radio") {
                const radioGroup = currentQuestion.querySelectorAll('input[type="radio"]');
                const isChecked = Array.from(radioGroup).some((radio) => radio.checked);

                if (!isChecked) {
                    showWarningMessage(warningMessage, "Please select an option.");
                    return false;
                }
            } else if (input.type === "email" && !validateEmail(input.value)) {
                showWarningMessage(warningMessage, "Please enter a valid email.");
                return false;
            } else if (input.type === "tel" && !validatePhoneNumber(input.value)) {
                showWarningMessage(warningMessage, "Please enter a valid phone number.");
                return false;
            } else if (input.name === "postcode" && !validatePostcode(input.value)) { 
                showWarningMessage(warningMessage, "Please enter a valid UK postcode.");
                return false;
            } else if (input.type !== "radio" && !input.classList.contains("vscomp-hidden-input") && input.value.trim() === "") {
                showWarningMessage(warningMessage, "Please fill this in.");
                return false;
            }
        }

        return true;
    }

    // File validation
    function validateFile(input, warningMessage) {
        const file = input.files[0];
        let maxSize;
        let allowedTypes;

        if (input.id === "cvUpload") {
            maxSize = maxCVSize;
            allowedTypes = allowedCVTypes;
            if (!file) {
                showWarningMessage(warningMessage, "Please upload your CV.");
                return false;
            }
        } else if (input.id === "portfolioUpload") {
            maxSize = maxPortfolioSize;
            allowedTypes = allowedPortfolioTypes;
            if (!file && !noPortfolioCheckbox.checked && portfolioURL.value === "") {
                showWarningMessage(warningMessage, "Please upload a portfolio file, enter a URL, or select 'I don't have a portfolio.'");
                return false;
            }
        }

        if (file) {
            if (file.size > maxSize) {
                showWarningMessage(warningMessage, `File is too large. Max size is ${maxSize / (1024 * 1024)}MB.`);
                return false;
            } else if (!allowedTypes.includes(file.type)) {
                showWarningMessage(warningMessage, "Unsupported file type.");
                return false;
            }
        }
        return true;
    }

    // Validate URL format
    function validateURL(url) {
        const urlPattern = /^(https?:\/\/)?(www\.)?[\w-]+(\.[\w-]+)+([/?#].*)?$/i;
        return urlPattern.test(url);
    }

    // Validate email format
    function validateEmail(email) {
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailPattern.test(email);
    }

    // Validate phone number format
    function validatePhoneNumber(phone) {
        const phonePattern = /^\+?[0-9\s\-().]{7,15}$/;
        return phonePattern.test(phone);
    }

    // Postcode validation
    function validatePostcode(postcode) {
        const postcodePattern = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i;
        return postcodePattern.test(postcode);
    }   

    // Portfolio checkbox logic
    const noPortfolioCheckbox = document.getElementById("noPortfolioCheckbox");
    const portfolioUpload = document.getElementById("portfolioUpload");
    const portfolioURL = document.getElementById("portfolioURL");

    noPortfolioCheckbox.addEventListener("change", () => {
        if (noPortfolioCheckbox.checked) {
            portfolioUpload.disabled = true;
            portfolioURL.disabled = true;
            portfolioUpload.value = "";
            portfolioURL.value = "";
        } else {
            portfolioUpload.disabled = false;
            portfolioURL.disabled = false;
        }
    });

    function validatePortfolio() {
        const warningMessage = document.querySelector("#portfolio-section .warning");
        if (warningMessage) {
            warningMessage.style.display = "none";
        }
                
        if (noPortfolioCheckbox.checked) return true;

        const urlValid = portfolioURL.value !== "" && validateURL(portfolioURL.value);
        const fileValid = portfolioUpload.files.length > 0;

        if (!urlValid && !fileValid) {
            showWarningMessage(warningMessage, "Please upload a portfolio file, enter a valid URL, or select 'I don't have a portfolio.'");
            return false;
        }
        return true;
    }

    function showWarningMessage(warningMessage, message) {
        warningMessage.textContent = message;
        warningMessage.style.display = "block";
    }

    function updateProgressBar() {
        const stepPercentage = ((currentStep + 1) / questions.length) * 100;
        progressBar.style.width = stepPercentage + "%";
    }

    function focusInputField() {
        const input = questions[currentStep].querySelector('input[type="text"], input[type="email"], input[type="radio"], input[type="tel"]');
        if (input) {
            input.focus();
        }
    }

    form.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && currentStep < questions.length - 1) {
            e.preventDefault();
            moveToNextQuestion();
        }
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (currentStep === questions.length - 1) {
            alert("Form submitted successfully!");
        }
    });

    function initializeVirtualSelect() {
        const selectElements = [
            {
                id: 'fields-select',
                maxValues: null,
                allowNewOption: false,
                options: [
                    { label: 'Marketing', value: 'Marketing' },
                    { label: 'Branding', value: 'Branding' },
                    { label: 'Social Media', value: 'Social Media' },
                    { label: 'Influencers', value: 'Influencers' },
                    { label: 'Content', value: 'Content' },
                    { label: 'Copywriting', value: 'Copywriting' },
                    { label: 'CRM', value: 'CRM' },
                    { label: 'Retention', value: 'Retention' },
                    { label: 'Events', value: 'Events' },
                    { label: 'Ecommerce', value: 'Ecommerce' },
                    { label: 'Digital', value: 'Digital' },
                    { label: 'Growth', value: 'Growth' },
                    { label: 'Graphic Design', value: 'Graphic-Design' },
                    { label: 'Digital Design', value: 'Digital-Design' },
                    { label: 'Motion Graphics', value: 'Motion-Graphics' },
                    { label: 'Product Design', value: 'Product Design' },
                    { label: 'Art Direction', value: 'Art Direction' },
                    { label: 'Videography', value: 'Videography' },
                    { label: 'Web Development', value: 'Web-Development' }
                ]
            },
            {
                id: 'skills-select',
                maxValues: 10,
                allowNewOption: true,
                options: [
                    { label: '2D Animation', value: '2D Animation' },
                    { label: '3D Animation', value: '3D Animation' },
                    { label: 'A/B Testing', value: 'A/B Testing' },
                    { label: 'Accessibility Design', value: 'Accessibility Design' },
                    { label: 'Account Management', value: 'Account Management' },
                    { label: 'Active Listening', value: 'Active Listening' },
                    { label: 'Adaptability & Flexibility', value: 'Adaptability & Flexibility' },
                    { label: 'Affiliate Marketing', value: 'Affiliate Marketing' },
                    { label: 'Algorithm Optimisation', value: 'Algorithm Optimisation' },
                    { label: 'App Development', value: 'App Development' },
                    { label: 'Analytics', value: 'Analytics' },
                    { label: 'Art Direction', value: 'Art Direction' },
                    { label: 'Articulating Ideas', value: 'Articulating Ideas' },
                    { label: 'Audience Research & Personas', value: 'Audience Research & Personas' },
                    { label: 'Audience Targeting', value: 'Audience Targeting' },
                    { label: 'Audio Editing', value: 'Audio Editing' },
                    { label: 'Audio Mixing', value: 'Audio Mixing' },
                    { label: 'Automated Email Campaigns', value: 'Automated Email Campaigns' },
                    { label: 'Back-End Development', value: 'Back-End Development' },
                    { label: 'Banner Ads', value: 'Banner Ads' },
                    { label: 'Blog Writing', value: 'Blog Writing' },
                    { label: 'Bounce Rate Analysis', value: 'Bounce Rate Analysis' },
                    { label: 'Brainstorming Solutions', value: 'Brainstorming Solutions' },
                    { label: 'Branding', value: 'Branding' },
                    { label: 'Brand Guidelines', value: 'Brand Guidelines' },
                    { label: 'Brand Identity Development', value: 'Brand Identity Development' },
                    { label: 'Brand Positioning', value: 'Brand Positioning' },
                    { label: 'Brand Storytelling', value: 'Brand Storytelling' },
                    { label: 'Brand Strategy & Development', value: 'Brand Strategy & Development' },
                    { label: 'Branding & Identity Design', value: 'Branding & Identity Design' },
                    { label: 'Budget Management', value: 'Budget Management' },
                    { label: 'Camera Operation', value: 'Camera Operation' },
                    { label: 'Campaign Budgeting & Forecasting', value: 'Campaign Budgeting & Forecasting' },
                    { label: 'Campaign Planning & Execution', value: 'Campaign Planning & Execution' },
                    { label: 'Campaign Strategy', value: 'Campaign Strategy' },
                    { label: 'Cart Abandonment Recovery', value: 'Cart Abandonment Recovery' },
                    { label: 'Case Studies & Reports', value: 'Case Studies & Reports' },
                    { label: 'Churn Analysis', value: 'Churn Analysis' },
                    { label: 'Cinematography', value: 'Cinematography' },
                    { label: 'Click-Through Rate (CTR)', value: 'Click-Through Rate (CTR)' },
                    { label: 'Client Communication', value: 'Client Communication' },
                    { label: 'Client Relationships', value: 'Client Relationships' },
                    { label: 'Client Retention Strategies', value: 'Client Retention Strategies' },
                    { label: 'CMS', value: 'CMS' },
                    { label: 'Collaboration', value: 'Collaboration' },
                    { label: 'Colour Grading', value: 'Colour Grading' },
                    { label: 'Colour Theory', value: 'Colour Theory' },
                    { label: 'Community Building & Management', value: 'Community Building & Management' },
                    { label: 'Compassion', value: 'Compassion' },
                    { label: 'Compromising', value: 'Compromising' },
                    { label: 'Composition & Layout', value: 'Composition & Layout' },
                    { label: 'Concept Development', value: 'Concept Development' },
                    { label: 'Conflict Prevention & Resolution', value: 'Conflict Prevention & Resolution' },
                    { label: 'Continuous Integration/Continuous Deployment (CI/CD)', value: 'Continuous Integration/Continuous Deployment (CI/CD)' },
                    { label: 'Conversion Rate Optimisation (CRO)', value: 'Conversion Rate Optimisation (CRO)' },
                    { label: 'Conversion Tracking', value: 'Conversion Tracking' },
                    { label: 'Copywriting', value: 'Copywriting' },
                    { label: 'Creativity & Innovation', value: 'Creativity & Innovation' },
                    { label: 'Cross-Channel Content Strategy', value: 'Cross-Channel Content Strategy' },
                    { label: 'Cross-Channel Marketing', value: 'Cross-Channel Marketing' },
                    { label: 'Cross-Sell & Up-Sell Strategies', value: 'Cross-Sell & Up-Sell Strategies' },
                    { label: 'Crisis Communication', value: 'Crisis Communication' },
                    { label: 'Critical Thinking & Analysis', value: 'Critical Thinking & Analysis' },
                    { label: 'Customer Acquisition & Retention', value: 'Customer Acquisition & Retention' },
                    { label: 'Customer Acquisition Cost (CAC)', value: 'Customer Acquisition Cost (CAC)' },
                    { label: 'Customer Journey Mapping', value: 'Customer Journey Mapping' },
                    { label: 'Customer Lifetime Value (CLV) Analysis', value: 'Customer Lifetime Value (CLV) Analysis' },
                    { label: 'Customer Relationship Management (CRM)', value: 'Customer Relationship Management (CRM)' },
                    { label: 'Customer Retention Strategies', value: 'Customer Retention Strategies' },
                    { label: 'Customer Service & Client Relations', value: 'Customer Service & Client Relations' },
                    { label: 'Data Analysis & Interpretation', value: 'Data Analysis & Interpretation' },
                    { label: 'Data-Driven Campaigns', value: 'Data-Driven Campaigns' },
                    { label: 'Data-Driven Decision Making', value: 'Data-Driven Decision Making' },
                    { label: 'Data Segmentation & Personalisation', value: 'Data Segmentation & Personalisation' },
                    { label: 'Data Visualisation', value: 'Data Visualisation' },
                    { label: 'Database Management', value: 'Database Management' },
                    { label: 'Decision-Making', value: 'Decision-Making' },
                    { label: 'Delegation of Tasks', value: 'Delegation of Tasks' },
                    { label: 'Design Thinking Process', value: 'Design Thinking Process' },
                    { label: 'Digital Asset Creation', value: 'Digital Asset Creation' },
                    { label: 'Digital Marketing', value: 'Digital Marketing' },
                    { label: 'Digital Marketing Analysis', value: 'Digital Marketing Analysis' },
                    { label: 'Display Advertising', value: 'Display Advertising' },
                    { label: 'Drip Campaigns', value: 'Drip Campaigns' },
                    { label: 'Drone Videography', value: 'Drone Videography' },
                    { label: 'E-commerce Development', value: 'E-commerce Development' },
                    { label: 'Ecommerce Strategy', value: 'Ecommerce Strategy' },
                    { label: 'Email Marketing', value: 'Email Marketing' },
                    { label: 'Email Newsletter Design', value: 'Email Newsletter Design' },
                    { label: 'Email Performance Metrics', value: 'Email Performance Metrics' },
                    { label: 'Emotional Intelligence', value: 'Emotional Intelligence' },
                    { label: 'Empathy', value: 'Empathy' },
                    { label: 'Engagement Metrics Analysis', value: 'Engagement Metrics Analysis' },
                    { label: 'Event Marketing', value: 'Event Marketing' },
                    { label: 'Front-End Development', value: 'Front-End Development' },
                    { label: 'Full-Stack Development', value: 'Full-Stack Development' },
                    { label: 'Funnel Optimisation', value: 'Funnel Optimisation' },
                    { label: 'GIF Creation', value: 'GIF Creation' },
                    { label: 'Green Screen', value: 'Green Screen' },
                    { label: 'Growth Hacking Strategies', value: 'Growth Hacking Strategies' },
                    { label: 'Growth Marketing', value: 'Growth Marketing' },
                    { label: 'Headline & Tagline Writing', value: 'Headline & Tagline Writing' },
                    { label: 'Heatmap Analysis', value: 'Heatmap Analysis' },
                    { label: 'Identifying Issues', value: 'Identifying Issues' },
                    { label: 'Influencer Campaign Management', value: 'Influencer Campaign Management' },
                    { label: 'Influencer Collaboration & Partnership Deals', value: 'Influencer Collaboration & Partnership Deals' },
                    { label: 'Influencer Identification & Outreach', value: 'Influencer Identification & Outreach' },
                    { label: 'Influencer Marketing', value: 'Influencer Marketing' },
                    { label: 'Influencer Relations', value: 'Influencer Relations' },
                    { label: 'Information Architecture', value: 'Information Architecture' },
                    { label: 'Integrated Marketing Campaigns', value: 'Integrated Marketing Campaigns' },
                    { label: 'Interaction Design', value: 'Interaction Design' },
                    { label: 'Interactive Content', value: 'Interactive Content' },
                    { label: 'Interactive Prototyping', value: 'Interactive Prototyping' },
                    { label: 'Interview Filming', value: 'Interview Filming' },
                    { label: 'Iterative Thinking', value: 'Iterative Thinking' },
                    { label: 'Keyword Research', value: 'Keyword Research' },
                    { label: 'KPI Setting & Measurement', value: 'KPI Setting & Measurement' },
                    { label: 'Lead Scoring', value: 'Lead Scoring' },
                    { label: 'Leadership & Management', value: 'Leadership & Management' },
                    { label: 'Learning & Self-Improvement', value: 'Learning & Self-Improvement' },
                    { label: 'Lifecycle Marketing', value: 'Lifecycle Marketing' },
                    { label: 'Lighting Setup', value: 'Lighting Setup' },
                    { label: 'Link Building Strategy', value: 'Link Building Strategy' },
                    { label: 'Live Streaming', value: 'Live Streaming' },
                    { label: 'Local SEO', value: 'Local SEO' },
                    { label: 'Long-Form Content', value: 'Long-Form Content' },
                    { label: 'Loyalty Programmes', value: 'Loyalty Programmes' },
                    { label: 'Managing Difficult Conversations', value: 'Managing Difficult Conversations' },
                    { label: 'Market Research & Analysis', value: 'Market Research & Analysis' },
                    { label: 'Market Segmentation', value: 'Market Segmentation' },
                    { label: 'Marketing Automation', value: 'Marketing Automation' },
                    { label: 'Marketing Communications', value: 'Marketing Communications' },
                    { label: 'Marketing Metrics (CPC, CTR, ROI)', value: 'Marketing Metrics (CPC, CTR, ROI)' },
                    { label: 'Marketing Project Management', value: 'Marketing Project Management' },
                    { label: 'Media Relations', value: 'Media Relations' },
                    { label: 'Meeting Deadlines', value: 'Meeting Deadlines' },
                    { label: 'Mentorship & Coaching', value: 'Mentorship & Coaching' },
                    { label: 'Mobile Development', value: 'Mobile Development' },
                    { label: 'Mobile Optimisation for Web', value: 'Mobile Optimisation for Web' },
                    { label: 'Moodboard Creation', value: 'Moodboard Creation' },
                    { label: 'Motion Graphics', value: 'Motion Graphics' },
                    { label: 'Multi-Camera Setup', value: 'Multi-Camera Setup' },
                    { label: 'Multitasking', value: 'Multitasking' },
                    { label: 'Native Mobile Development', value: 'Native Mobile Development' },
                    { label: 'Negotiation & Persuasion', value: 'Negotiation & Persuasion' },
                    { label: 'On-Page SEO', value: 'On-Page SEO' },
                    { label: 'Online Reputation Management', value: 'Online Reputation Management' },
                    { label: 'Paid Social Advertising', value: 'Paid Social Advertising' },
                    { label: 'Pay-Per-Click (PPC) Campaigns', value: 'Pay-Per-Click (PPC) Campaigns' },
                    { label: 'Performance Benchmarking', value: 'Performance Benchmarking' },
                    { label: 'Performance Management', value: 'Performance Management' },
                    { label: 'Persuasive Writing', value: 'Persuasive Writing' },
                    { label: 'Pitching Ideas', value: 'Pitching Ideas' },
                    { label: 'Planning & Scheduling', value: 'Planning & Scheduling' },
                    { label: 'Press Releases', value: 'Press Releases' },
                    { label: 'Problem-Solving & Critical Thinking', value: 'Problem-Solving & Critical Thinking' },
                    { label: 'Product Design', value: 'Product Design' },
                    { label: 'Product Pricing Strategies', value: 'Product Pricing Strategies' },
                    { label: 'Product Roadmapping', value: 'Product Roadmapping' },
                    { label: 'Programmatic Advertising', value: 'Programmatic Advertising' },
                    { label: 'Project Management', value: 'Project Management' },
                    { label: 'Prototyping', value: 'Prototyping' },
                    { label: 'Public Relations', value: 'Public Relations' },
                    { label: 'Rapid Iteration & Feedback Loops', value: 'Rapid Iteration & Feedback Loops' },
                    { label: 'Re-Engagement Campaigns', value: 'Re-Engagement Campaigns' },
                    { label: 'Reaching Agreements', value: 'Reaching Agreements' },
                    { label: 'Rebranding Strategy', value: 'Rebranding Strategy' },
                    { label: 'Reporting & Dashboard Creation', value: 'Reporting & Dashboard Creation' },
                    { label: 'RESTful APIs', value: 'RESTful APIs' },
                    { label: 'Retargeting', value: 'Retargeting' },
                    { label: 'Root Cause Analysis', value: 'Root Cause Analysis' },
                    { label: 'Sales Copywriting', value: 'Sales Copywriting' },
                    { label: 'Script Writing', value: 'Script Writing' },
                    { label: 'Search Engine Marketing (SEM)', value: 'Search Engine Marketing (SEM)' },
                    { label: 'Search Engine Optimisation (SEO)', value: 'Search Engine Optimisation (SEO)' },
                    { label: 'SEO Content Writing', value: 'SEO Content Writing' },
                    { label: 'Social Media Advertising', value: 'Social Media Advertising' },
                    { label: 'Social Media Calendars', value: 'Social Media Calendars' },
                    { label: 'Social Media Strategy', value: 'Social Media Strategy' },
                    { label: 'Social Media Trends Tracking', value: 'Social Media Trends Tracking' },
                    { label: 'Sound Design', value: 'Sound Design' },
                    { label: 'Stakeholder Communication', value: 'Stakeholder Communication' },
                    { label: 'Strategic Partnerships', value: 'Strategic Partnerships' },
                    { label: 'Strategic Thinking', value: 'Strategic Thinking' },
                    { label: 'Storyboarding', value: 'Storyboarding' },
                    { label: 'Storytelling', value: 'Storytelling' },
                    { label: 'Supporting Team Members', value: 'Supporting Team Members' },
                    { label: 'SWOT Analysis', value: 'SWOT Analysis' },
                    { label: 'Team-Building', value: 'Team-Building' },
                    { label: 'Team Leadership & Collaboration', value: 'Team Leadership & Collaboration' },
                    { label: 'Time Management & Organisation', value: 'Time Management & Organisation' },
                    { label: 'Tone of Voice', value: 'Tone of Voice' },
                    { label: 'Trend Spotting', value: 'Trend Spotting' },
                    { label: 'Typography', value: 'Typography' },
                    { label: 'UI/UX Design Principles', value: 'UI/UX Design Principles' },
                    { label: 'UI/UX Development', value: 'UI/UX Development' },
                    { label: 'Upselling & Cross-Selling', value: 'Upselling & Cross-Selling' },
                    { label: 'Usability Testing', value: 'Usability Testing' },
                    { label: 'User-Centred Design (UCD)', value: 'User-Centred Design (UCD)' },
                    { label: 'User Experience (UX) in Ecommerce', value: 'User Experience (UX) in Ecommerce' },
                    { label: 'User-Generated Content', value: 'User-Generated Content' },
                    { label: 'UX Copywriting', value: 'UX Copywriting' },
                    { label: 'Version Control', value: 'Version Control' },
                    { label: 'Video Content Creation', value: 'Video Content Creation' },
                    { label: 'Video Editing', value: 'Video Editing' },
                    { label: 'Video Production', value: 'Video Production' },
                    { label: 'Viral Loops', value: 'Viral Loops' },
                    { label: 'Visual Effects (VFX)', value: 'Visual Effects (VFX)' },
                    { label: 'Visual Storytelling', value: 'Visual Storytelling' },
                    { label: 'Web Design', value: 'Web Design' },
                    { label: 'Web Development', value: 'Web Development' },
                    { label: 'Wireframing', value: 'Wireframing' }
                ]
            },
            {
                id: 'software-select',
                maxValues: null,
                allowNewOption: true,
                options: [
                    { label: 'ActiveCampaign', value: 'ActiveCampaign' },
                    { label: 'Adobe After Effects', value: 'Adobe After Effects' },
                    { label: 'Adobe Analytics', value: 'Adobe Analytics' },
                    { label: 'Adobe Audition', value: 'Adobe Audition' },
                    { label: 'Adobe Color', value: 'Adobe Color' },
                    { label: 'Adobe Creative Cloud', value: 'Adobe Creative Cloud' },
                    { label: 'Adobe Illustrator', value: 'Adobe Illustrator' },
                    { label: 'Adobe InDesign', value: 'Adobe InDesign' },
                    { label: 'Adobe Photoshop', value: 'Adobe Photoshop' },
                    { label: 'Adobe Premiere Pro', value: 'Adobe Premiere Pro' },
                    { label: 'Adobe Spark', value: 'Adobe Spark' },
                    { label: 'Adobe Target', value: 'Adobe Target' },
                    { label: 'Affinity Designer', value: 'Affinity Designer' },
                    { label: 'Affinity Publisher', value: 'Affinity Publisher' },
                    { label: 'Ahrefs', value: 'Ahrefs' },
                    { label: 'Airfocus', value: 'Airfocus' },
                    { label: 'Airtable', value: 'Airtable' },
                    { label: 'Animaker', value: 'Animaker' },
                    { label: 'Animoto', value: 'Animoto' },
                    { label: 'AnswerThePublic', value: 'AnswerThePublic' },
                    { label: 'Apache Subversion', value: 'Apache Subversion' },
                    { label: 'Aputure Lighting', value: 'Aputure Lighting' },
                    { label: 'ARRI Cameras', value: 'ARRI Cameras' },
                    { label: 'Asana', value: 'Asana' },
                    { label: 'AspireIQ', value: 'AspireIQ' },
                    { label: 'Atom', value: 'Atom' },
                    { label: 'Audacity', value: 'Audacity' },
                    { label: 'Audiense', value: 'Audiense' },
                    { label: 'Avid Media Composer', value: 'Avid Media Composer' },
                    { label: 'Avid Pro Tools', value: 'Avid Pro Tools' },
                    { label: 'Axure RP', value: 'Axure RP' },
                    { label: 'Azure DevOps', value: 'Azure DevOps' },
                    { label: 'Bamboo', value: 'Bamboo' },
                    { label: 'BannerSnack', value: 'BannerSnack' },
                    { label: 'Basecamp', value: 'Basecamp' },
                    { label: 'BigCommerce', value: 'BigCommerce' },
                    { label: 'BizForecast', value: 'BizForecast' },
                    { label: 'Blackmagic Design', value: 'Blackmagic Design' },
                    { label: 'Blackmagic Design ATEM Mini', value: 'Blackmagic Design ATEM Mini' },
                    { label: 'Blackmagic DaVinci Resolve', value: 'Blackmagic DaVinci Resolve' },
                    { label: 'Blender', value: 'Blender' },
                    { label: 'Boords', value: 'Boords' },
                    { label: 'Brand24', value: 'Brand24' },
                    { label: 'Brandfolder', value: 'Brandfolder' },
                    { label: 'Brandwatch', value: 'Brandwatch' },
                    { label: 'BrowserStack', value: 'BrowserStack' },
                    { label: 'Buffer', value: 'Buffer' },
                    { label: 'Buddy', value: 'Buddy' },
                    { label: 'BuzzStream', value: 'BuzzStream' },
                    { label: 'BuzzSumo', value: 'BuzzSumo' },
                    { label: 'Canva', value: 'Canva' },
                    { label: 'CartStack', value: 'CartStack' },
                    { label: 'Celtx', value: 'Celtx' },
                    { label: 'Ceros', value: 'Ceros' },
                    { label: 'CircleCI', value: 'CircleCI' },
                    { label: 'Circle.so', value: 'Circle.so' },
                    { label: 'Cisco WebEx', value: 'Cisco WebEx' },
                    { label: 'CJ Affiliate', value: 'CJ Affiliate' },
                    { label: 'ClickFunnels', value: 'ClickFunnels' },
                    { label: 'ClickUp', value: 'ClickUp' },
                    { label: 'Clicktale', value: 'Clicktale' },
                    { label: 'Cloudflare', value: 'Cloudflare' },
                    { label: 'Coggle', value: 'Coggle' },
                    { label: 'CognitiveSEO', value: 'CognitiveSEO' },
                    { label: 'Color Finale', value: 'Color Finale' },
                    { label: 'Color Hunt', value: 'Color Hunt' },
                    { label: 'Colormind', value: 'Colormind' },
                    { label: 'Conceptboard', value: 'Conceptboard' },
                    { label: 'Convert', value: 'Convert' },
                    { label: 'CorelDRAW', value: 'CorelDRAW' },
                    { label: 'CoSchedule', value: 'CoSchedule' },
                    { label: 'Copy.ai', value: 'Copy.ai' },
                    { label: 'Crazy Egg', value: 'Crazy Egg' },
                    { label: 'Crisp', value: 'Crisp' },
                    { label: 'Criteo', value: 'Criteo' },
                    { label: 'Cubase', value: 'Cubase' },
                    { label: 'Custify', value: 'Custify' },
                    { label: 'DaVinci Resolve', value: 'DaVinci Resolve' },
                    { label: 'Domo', value: 'Domo' },
                    { label: 'Donut', value: 'Donut' },
                    { label: 'Drip', value: 'Drip' },
                    { label: 'Drupal', value: 'Drupal' },
                    { label: 'EZGif', value: 'EZGif' },
                    { label: 'Facebook Ads Manager', value: 'Facebook Ads Manager' },
                    { label: 'Fade In', value: 'Fade In' },
                    { label: 'Final Cut Pro', value: 'Final Cut Pro' },
                    { label: 'Final Draft', value: 'Final Draft' },
                    { label: 'Figma', value: 'Figma' },
                    { label: 'Filmora', value: 'Filmora' },
                    { label: 'FL Studio', value: 'FL Studio' },
                    { label: 'Flixel', value: 'Flixel' },
                    { label: 'FlowMapp', value: 'FlowMapp' },
                    { label: 'Flutter', value: 'Flutter' },
                    { label: 'FontBase', value: 'FontBase' },
                    { label: 'FreshBooks', value: 'FreshBooks' },
                    { label: 'Freshdesk', value: 'Freshdesk' },
                    { label: 'Freshmarketer', value: 'Freshmarketer' },
                    { label: 'FullStory', value: 'FullStory' },
                    { label: 'Fusion Studio', value: 'Fusion Studio' },
                    { label: 'Giphy', value: 'Giphy' },
                    { label: 'GitHub', value: 'GitHub' },
                    { label: 'GitLab', value: 'GitLab' },
                    { label: 'Gleam', value: 'Gleam' },
                    { label: 'GlobalEdit', value: 'GlobalEdit' },
                    { label: 'GoPro Quik', value: 'GoPro Quik' },
                    { label: 'Google Ads', value: 'Google Ads' },
                    { label: 'Google Alerts', value: 'Google Alerts' },
                    { label: 'Google Analytics', value: 'Google Analytics' },
                    { label: 'Google Calendar', value: 'Google Calendar' },
                    { label: 'Google Data Studio', value: 'Google Data Studio' },
                    { label: 'Google Docs', value: 'Google Docs' },
                    { label: 'Google Keyword Planner', value: 'Google Keyword Planner' },
                    { label: 'Google Meet', value: 'Google Meet' },
                    { label: 'Google Mobile-Friendly Test', value: 'Google Mobile-Friendly Test' },
                    { label: 'Google Optimize', value: 'Google Optimize' },
                    { label: 'Google PageSpeed Insights', value: 'Google PageSpeed Insights' },
                    { label: 'Google Search Console', value: 'Google Search Console' },
                    { label: 'Google Sheets', value: 'Google Sheets' },
                    { label: 'Google Slides', value: 'Google Slides' },
                    { label: 'Google Surveys', value: 'Google Surveys' },
                    { label: 'Google Tag Manager', value: 'Google Tag Manager' },
                    { label: 'Google Trends', value: 'Google Trends' },
                    { label: 'Grammarly', value: 'Grammarly' },
                    { label: 'Heap Analytics', value: 'Heap Analytics' },
                    { label: 'Hemingway Editor', value: 'Hemingway Editor' },
                    { label: 'Heepsy', value: 'Heepsy' },
                    { label: 'HelpScout', value: 'HelpScout' },
                    { label: 'Hootsuite', value: 'Hootsuite' },
                    { label: 'Hopin', value: 'Hopin' },
                    { label: 'Hoppscotch', value: 'Hoppscotch' },
                    { label: 'Hotjar', value: 'Hotjar' },
                    { label: 'HubSpot', value: 'HubSpot' },
                    { label: 'IBM SPSS', value: 'IBM SPSS' },
                    { label: 'Impact', value: 'Impact' },
                    { label: 'Instagram Ads', value: 'Instagram Ads' },
                    { label: 'InVision', value: 'InVision' },
                    { label: 'Ionic', value: 'Ionic' },
                    { label: 'iMovie', value: 'iMovie' },
                    { label: 'Inspectlet', value: 'Inspectlet' },
                    { label: 'Interact', value: 'Interact' },
                    { label: 'Intercom', value: 'Intercom' },
                    { label: 'iOS (Xcode)', value: 'iOS (Xcode)' },
                    { label: 'Jenkins', value: 'Jenkins' },
                    { label: 'Jira', value: 'Jira' },
                    { label: 'Joomla', value: 'Joomla' },
                    { label: 'Kahoot', value: 'Kahoot' },
                    { label: 'Kameleoon', value: 'Kameleoon' },
                    { label: 'Kantar Media', value: 'Kantar Media' },
                    { label: 'Klaviyo', value: 'Klaviyo' },
                    { label: 'Kissmetrics', value: 'Kissmetrics' },
                    { label: 'Klear', value: 'Klear' },
                    { label: 'Klipfolio', value: 'Klipfolio' },
                    { label: 'Krita', value: 'Krita' },
                    { label: 'Lattice', value: 'Lattice' },
                    { label: 'LinkedIn Ads', value: 'LinkedIn Ads' },
                    { label: 'LinkedIn Campaign Manager', value: 'LinkedIn Campaign Manager' },
                    { label: 'LinkedIn Insight Tag', value: 'LinkedIn Insight Tag' },
                    { label: 'Linkody', value: 'Linkody' },
                    { label: 'Looka', value: 'Looka' },
                    { label: 'Lookback', value: 'Lookback' },
                    { label: 'Looker', value: 'Looker' },
                    { label: 'Lucky Orange', value: 'Lucky Orange' },
                    { label: 'Lucidchart', value: 'Lucidchart' },
                    { label: 'Lucidpress', value: 'Lucidpress' },
                    { label: 'Lume Cube', value: 'Lume Cube' },
                    { label: 'Magento', value: 'Magento' },
                    { label: 'Mailchimp', value: 'Mailchimp' },
                    { label: 'Marketo', value: 'Marketo' },
                    { label: 'Medium', value: 'Medium' },
                    { label: 'Microsoft Excel', value: 'Microsoft Excel' },
                    { label: 'Microsoft Outlook', value: 'Microsoft Outlook' },
                    { label: 'Microsoft Power BI', value: 'Microsoft Power BI' },
                    { label: 'Microsoft Teams', value: 'Microsoft Teams' },
                    { label: 'Microsoft Visio', value: 'Microsoft Visio' },
                    { label: 'Milanote', value: 'Milanote' },
                    { label: 'MindMeister', value: 'MindMeister' },
                    { label: 'Mixpanel', value: 'Mixpanel' },
                    { label: 'Miro', value: 'Miro' },
                    { label: 'Monday.com', value: 'Monday.com' },
                    { label: 'Moosend', value: 'Moosend' },
                    { label: 'Mouseflow', value: 'Mouseflow' },
                    { label: 'Moz', value: 'Moz' },
                    { label: 'Muck Rack', value: 'Muck Rack' },
                    { label: 'MySQL', value: 'MySQL' },
                    { label: 'Neewer LED Lights', value: 'Neewer LED Lights' },
                    { label: 'Next.js', value: 'Next.js' },
                    { label: 'Notion', value: 'Notion' },
                    { label: 'Nuke', value: 'Nuke' },
                    { label: 'OBS Studio', value: 'OBS Studio' },
                    { label: 'OpenCart', value: 'OpenCart' },
                    { label: 'Optimizely', value: 'Optimizely' },
                    { label: 'Outbrain', value: 'Outbrain' },
                    { label: 'Outgrow', value: 'Outgrow' },
                    { label: 'Padlet', value: 'Padlet' },
                    { label: 'Pardot', value: 'Pardot' },
                    { label: 'Perforce', value: 'Perforce' },
                    { label: 'Picasion', value: 'Picasion' },
                    { label: 'Piktochart', value: 'Piktochart' },
                    { label: 'Pinterest', value: 'Pinterest' },
                    { label: 'Pix4D', value: 'Pix4D' },
                    { label: 'Pixlee', value: 'Pixlee' },
                    { label: 'Piwik Pro', value: 'Piwik Pro' },
                    { label: 'PlanGuru', value: 'PlanGuru' },
                    { label: 'Power BI', value: 'Power BI' },
                    { label: 'Prowly', value: 'Prowly' },
                    { label: 'Proto.io', value: 'Proto.io' },
                    { label: 'Procreate', value: 'Procreate' },
                    { label: 'QuickBooks', value: 'QuickBooks' },
                    { label: 'Quora Ads', value: 'Quora Ads' },
                    { label: 'Rakuten Marketing', value: 'Rakuten Marketing' },
                    { label: 'Rank Ranger', value: 'Rank Ranger' },
                    { label: 'Refersion', value: 'Refersion' },
                    { label: 'Red Cameras', value: 'Red Cameras' },
                    { label: 'Rejoiner', value: 'Rejoiner' },
                    { label: 'Restream', value: 'Restream' },
                    { label: 'Riverside.fm', value: 'Riverside.fm' },
                    { label: 'Salesforce', value: 'Salesforce' },
                    { label: 'Screaming Frog', value: 'Screaming Frog' },
                    { label: 'Scrivener', value: 'Scrivener' },
                    { label: 'Segment', value: 'Segment' },
                    { label: 'SEMrush', value: 'SEMrush' },
                    { label: 'Sendinblue', value: 'Sendinblue' },
                    { label: 'ShareASale', value: 'ShareASale' },
                    { label: 'Shopify', value: 'Shopify' },
                    { label: 'Shorthand', value: 'Shorthand' },
                    { label: 'Sketch', value: 'Sketch' },
                    { label: 'Skype', value: 'Skype' },
                    { label: 'Slack', value: 'Slack' },
                    { label: 'Slickplan', value: 'Slickplan' },
                    { label: 'Smartsheet', value: 'Smartsheet' },
                    { label: 'Smile.io', value: 'Smile.io' },
                    { label: 'Smaply', value: 'Smaply' },
                    { label: 'Snapchat Ads', value: 'Snapchat Ads' },
                    { label: 'Sony Alpha Cameras', value: 'Sony Alpha Cameras' },
                    { label: 'Sony FS Series', value: 'Sony FS Series' },
                    { label: 'Squarespace', value: 'Squarespace' },
                    { label: 'Sprout Social', value: 'Sprout Social' },
                    { label: 'StoryBoard Pro', value: 'StoryBoard Pro' },
                    { label: 'StoryChief', value: 'StoryChief' },
                    { label: 'StreamYard', value: 'StreamYard' },
                    { label: 'SurveyMonkey', value: 'SurveyMonkey' },
                    { label: 'Taboola', value: 'Taboola' },
                    { label: 'Tableau', value: 'Tableau' },
                    { label: 'Taggbox', value: 'Taggbox' },
                    { label: 'Templafy', value: 'Templafy' },
                    { label: 'TINT', value: 'TINT' },
                    { label: 'TikTok Ads', value: 'TikTok Ads' },
                    { label: 'Tota11y', value: 'Tota11y' },
                    { label: 'Totango', value: 'Totango' },
                    { label: 'Tribe', value: 'Tribe' },
                    { label: 'Trello', value: 'Trello' },
                    { label: 'Typeform', value: 'Typeform' },
                    { label: 'UberSuggest', value: 'UberSuggest' },
                    { label: 'Unbounce', value: 'Unbounce' },
                    { label: 'UserTesting', value: 'UserTesting' },
                    { label: 'UXPressia', value: 'UXPressia' },
                    { label: 'Vendavo', value: 'Vendavo' },
                    { label: 'Vimeo', value: 'Vimeo' },
                    { label: 'Viral Loops', value: 'Viral Loops' },
                    { label: 'Visme', value: 'Visme' },
                    { label: 'Visual Studio Code', value: 'Visual Studio Code' },
                    { label: 'Vivaldi', value: 'Vivaldi' },
                    { label: 'vMix', value: 'vMix' },
                    { label: 'VWO (Visual Website Optimizer)', value: 'VWO (Visual Website Optimizer)' },
                    { label: 'Wave', value: 'Wave' },
                    { label: 'WavePad', value: 'WavePad' },
                    { label: 'Webflow', value: 'Webflow' },
                    { label: 'WeVideo', value: 'WeVideo' },
                    { label: 'Wix', value: 'Wix' },
                    { label: 'Woobox', value: 'Woobox' },
                    { label: 'WooCommerce', value: 'WooCommerce' },
                    { label: 'WordPress', value: 'WordPress' },
                    { label: 'WriterDuet', value: 'WriterDuet' },
                    { label: 'Wrike', value: 'Wrike' },
                    { label: 'Xero', value: 'Xero' },
                    { label: 'Yext', value: 'Yext' },
                    { label: 'Yoast SEO', value: 'Yoast SEO' },
                    { label: 'YouTube Live', value: 'YouTube Live' },
                    { label: 'Zendesk', value: 'Zendesk' },
                    { label: 'Zoho CRM', value: 'Zoho CRM' }
                ]
            },
            {
                id: 'previous-industries-select',
                maxValues: null,
                allowNewOption: true,
                options: [
                    { label: 'Advertising and Marketing', value: 'Advertising and Marketing' },
                    { label: 'Agriculture and Farming', value: 'Agriculture and Farming' },
                    { label: 'Alcohol', value: 'Alcohol' },
                    { label: 'Animation', value: 'Animation' },
                    { label: 'Architecture & Planning', value: 'Architecture & Planning' },
                    { label: 'Artificial Intelligence', value: 'Artificial Intelligence' },
                    { label: 'Arts and Crafts', value: 'Arts and Crafts' },
                    { label: 'Aerospace', value: 'Aerospace' },
                    { label: 'Automotive', value: 'Automotive' },
                    { label: 'Banking', value: 'Banking' },
                    { label: 'Biotechnology', value: 'Biotechnology' },
                    { label: 'Blockchain', value: 'Blockchain' },
                    { label: 'Broadcast Media', value: 'Broadcast Media' },
                    { label: 'Charity', value: 'Charity' },
                    { label: 'Computer Technology', value: 'Computer Technology' },
                    { label: 'Construction', value: 'Construction' },
                    { label: 'Consumer Electronics', value: 'Consumer Electronics' },
                    { label: 'Consumer Goods', value: 'Consumer Goods' },
                    { label: 'Consumer Services', value: 'Consumer Services' },
                    { label: 'Cosmetics', value: 'Cosmetics' },
                    { label: 'Cybersecurity', value: 'Cybersecurity' },
                    { label: 'Defence & Space', value: 'Defence & Space' },
                    { label: 'Design', value: 'Design' },
                    { label: 'Ecommerce', value: 'Ecommerce' },
                    { label: 'Education', value: 'Education' },
                    { label: 'Entertainment', value: 'Entertainment' },
                    { label: 'Environmental Services', value: 'Environmental Services' },
                    { label: 'Esports & Gaming', value: 'Esports & Gaming' },
                    { label: 'Events', value: 'Events' },
                    { label: 'Facilities Services', value: 'Facilities Services' },
                    { label: 'Fashion', value: 'Fashion' },
                    { label: 'Financial Services', value: 'Financial Services' },
                    { label: 'Food and Beverages', value: 'Food and Beverages' },
                    { label: 'Furniture', value: 'Furniture' },
                    { label: 'Gambling & Casinos', value: 'Gambling & Casinos' },
                    { label: 'Government', value: 'Government' },
                    { label: 'Health, Fitness and Wellness', value: 'Health, Fitness and Wellness' },
                    { label: 'Homeware', value: 'Homeware' },
                    { label: 'Hospital & Health Care', value: 'Hospital & Health Care' },
                    { label: 'Hospitality', value: 'Hospitality' },
                    { label: 'Human Resources', value: 'Human Resources' },
                    { label: 'Information Technology & Services', value: 'Information Technology & Services' },
                    { label: 'Insurance', value: 'Insurance' },
                    { label: 'Investment Management', value: 'Investment Management' },
                    { label: 'Journalism', value: 'Journalism' },
                    { label: 'Legal Services', value: 'Legal Services' },
                    { label: 'Leisure, Travel & Tourism', value: 'Leisure, Travel & Tourism' },
                    { label: 'Logistics & Supply Chain', value: 'Logistics & Supply Chain' },
                    { label: 'Luxury Goods & Jewelry', value: 'Luxury Goods & Jewelry' },
                    { label: 'Manufacturing', value: 'Manufacturing' },
                    { label: 'Media Production', value: 'Media Production' },
                    { label: 'Military', value: 'Military' },
                    { label: 'Mining', value: 'Mining' },
                    { label: 'Motion Pictures & Film', value: 'Motion Pictures & Film' },
                    { label: 'Music', value: 'Music' },
                    { label: 'Non-Profit', value: 'Non-Profit' },
                    { label: 'Oil and Energy', value: 'Oil and Energy' },
                    { label: 'Online Media', value: 'Online Media' },
                    { label: 'Pets and Veterinary', value: 'Pets and Veterinary' },
                    { label: 'Pharmaceuticals', value: 'Pharmaceuticals' },
                    { label: 'Philanthropy', value: 'Philanthropy' },
                    { label: 'Politics', value: 'Politics' },
                    { label: 'Professional Training & Coaching', value: 'Professional Training & Coaching' },
                    { label: 'Public Relations and Communications', value: 'Public Relations and Communications' },
                    { label: 'Public Services', value: 'Public Services' },
                    { label: 'Real Estate', value: 'Real Estate' },
                    { label: 'Recreational Facilities and Services', value: 'Recreational Facilities and Services' },
                    { label: 'Renewables & Environment', value: 'Renewables & Environment' },
                    { label: 'Restaurants', value: 'Restaurants' },
                    { label: 'Retail', value: 'Retail' },
                    { label: 'Robotics', value: 'Robotics' },
                    { label: 'SaaS', value: 'SaaS' },
                    { label: 'Security', value: 'Security' },
                    { label: 'Sporting Goods', value: 'Sporting Goods' },
                    { label: 'Sports', value: 'Sports' },
                    { label: 'Technology', value: 'Technology' },
                    { label: 'Telecommunications', value: 'Telecommunications' },
                    { label: 'Transportation', value: 'Transportation' },
                    { label: 'Utilities', value: 'Utilities' },
                    { label: 'Venture Capital & Private Equity', value: 'Venture Capital & Private Equity' },
                    { label: 'Wholesale', value: 'Wholesale' }
                ]
            },
            {
                id: 'D2C-select',
                maxValues: null,
                allowNewOption: false,
                options: [
                    { label: 'B2B', value: 'B2B' },
                    { label: 'B2C', value: 'B2C' },
                    { label: 'D2C', value: 'D2C' }
                ]
            },
            {
                id: 'reason-select',
                maxValues: 3,
                allowNewOption: true,
                options: [
                    { label: 'New challenge', value: 'new challenge' },
                    { label: 'Improved salary', value: 'salary' },
                    { label: 'Family flexibility', value: 'flexibility' },
                    { label: 'Career growth', value: 'career growth' },
                    { label: 'Better work-life balance', value: 'work-life balance' }
                ]
            },
            {
                id: 'important-select',
                maxValues: 3,
                allowNewOption: true,
                options: [
                    { label: 'Salary', value: 'Salary' },
                    { label: 'Work-life balance', value: 'Work-life balance' },
                    { label: 'Career growth', value: 'Career growth' },
                    { label: 'Company culture', value: 'Company culture' },
                    { label: 'Job security', value: 'Job security' },
                    { label: 'Learning opportunities', value: 'Learning opportunities' },
                    { label: 'Remote work options', value: 'Remote work options' }
                ]
            },
            {
                id: 'industries-select',
                maxValues: 3,
                allowNewOption: true,
                options: [
                    { label: 'Any', value: 'Any' },
                    { label: 'Advertising and Marketing', value: 'Advertising and Marketing' },
                    { label: 'Agriculture and Farming', value: 'Agriculture and Farming' },
                    { label: 'Alcohol', value: 'Alcohol' },
                    { label: 'Animation', value: 'Animation' },
                    { label: 'Architecture & Planning', value: 'Architecture & Planning' },
                    { label: 'Artificial Intelligence', value: 'Artificial Intelligence' },
                    { label: 'Arts and Crafts', value: 'Arts and Crafts' },
                    { label: 'Aerospace', value: 'Aerospace' },
                    { label: 'Automotive', value: 'Automotive' },
                    { label: 'Banking', value: 'Banking' },
                    { label: 'Biotechnology', value: 'Biotechnology' },
                    { label: 'Blockchain', value: 'Blockchain' },
                    { label: 'Broadcast Media', value: 'Broadcast Media' },
                    { label: 'Charity', value: 'Charity' },
                    { label: 'Computer Technology', value: 'Computer Technology' },
                    { label: 'Construction', value: 'Construction' },
                    { label: 'Consumer Electronics', value: 'Consumer Electronics' },
                    { label: 'Consumer Goods', value: 'Consumer Goods' },
                    { label: 'Consumer Services', value: 'Consumer Services' },
                    { label: 'Cosmetics', value: 'Cosmetics' },
                    { label: 'Cybersecurity', value: 'Cybersecurity' },
                    { label: 'Defence & Space', value: 'Defence & Space' },
                    { label: 'Design', value: 'Design' },
                    { label: 'Ecommerce', value: 'Ecommerce' },
                    { label: 'Education', value: 'Education' },
                    { label: 'Entertainment', value: 'Entertainment' },
                    { label: 'Environmental Services', value: 'Environmental Services' },
                    { label: 'Esports & Gaming', value: 'Esports & Gaming' },
                    { label: 'Events', value: 'Events' },
                    { label: 'Facilities Services', value: 'Facilities Services' },
                    { label: 'Fashion', value: 'Fashion' },
                    { label: 'Financial Services', value: 'Financial Services' },
                    { label: 'Food and Beverages', value: 'Food and Beverages' },
                    { label: 'Furniture', value: 'Furniture' },
                    { label: 'Gambling & Casinos', value: 'Gambling & Casinos' },
                    { label: 'Government', value: 'Government' },
                    { label: 'Health, Fitness and Wellness', value: 'Health, Fitness and Wellness' },
                    { label: 'Homeware', value: 'Homeware' },
                    { label: 'Hospital & Health Care', value: 'Hospital & Health Care' },
                    { label: 'Hospitality', value: 'Hospitality' },
                    { label: 'Human Resources', value: 'Human Resources' },
                    { label: 'Information Technology & Services', value: 'Information Technology & Services' },
                    { label: 'Insurance', value: 'Insurance' },
                    { label: 'Investment Management', value: 'Investment Management' },
                    { label: 'Journalism', value: 'Journalism' },
                    { label: 'Legal Services', value: 'Legal Services' },
                    { label: 'Leisure, Travel & Tourism', value: 'Leisure, Travel & Tourism' },
                    { label: 'Logistics & Supply Chain', value: 'Logistics & Supply Chain' },
                    { label: 'Luxury Goods & Jewelry', value: 'Luxury Goods & Jewelry' },
                    { label: 'Manufacturing', value: 'Manufacturing' },
                    { label: 'Media Production', value: 'Media Production' },
                    { label: 'Military', value: 'Military' },
                    { label: 'Mining', value: 'Mining' },
                    { label: 'Motion Pictures & Film', value: 'Motion Pictures & Film' },
                    { label: 'Music', value: 'Music' },
                    { label: 'Non-Profit', value: 'Non-Profit' },
                    { label: 'Oil and Energy', value: 'Oil and Energy' },
                    { label: 'Online Media', value: 'Online Media' },
                    { label: 'Pets and Veterinary', value: 'Pets and Veterinary' },
                    { label: 'Pharmaceuticals', value: 'Pharmaceuticals' },
                    { label: 'Philanthropy', value: 'Philanthropy' },
                    { label: 'Politics', value: 'Politics' },
                    { label: 'Professional Training & Coaching', value: 'Professional Training & Coaching' },
                    { label: 'Public Relations and Communications', value: 'Public Relations and Communications' },
                    { label: 'Public Services', value: 'Public Services' },
                    { label: 'Real Estate', value: 'Real Estate' },
                    { label: 'Recreational Facilities and Services', value: 'Recreational Facilities and Services' },
                    { label: 'Renewables & Environment', value: 'Renewables & Environment' },
                    { label: 'Restaurants', value: 'Restaurants' },
                    { label: 'Retail', value: 'Retail' },
                    { label: 'Robotics', value: 'Robotics' },
                    { label: 'SaaS', value: 'SaaS' },
                    { label: 'Security', value: 'Security' },
                    { label: 'Sporting Goods', value: 'Sporting Goods' },
                    { label: 'Sports', value: 'Sports' },
                    { label: 'Technology', value: 'Technology' },
                    { label: 'Telecommunications', value: 'Telecommunications' },
                    { label: 'Transportation', value: 'Transportation' },
                    { label: 'Utilities', value: 'Utilities' },
                    { label: 'Venture Capital & Private Equity', value: 'Venture Capital & Private Equity' },
                    { label: 'Wholesale', value: 'Wholesale' }
                ]
            },
            {
                id: 'job-titles-select',
                maxValues: 5,
                allowNewOption: true,
                options: [
                    { label: 'Acquisition Marketing Manager', value: 'Acquisition Marketing Manager' },
                    { label: 'Affiliate Marketing Manager', value: 'Affiliate Marketing Manager' },
                    { label: 'Animator', value: 'Animator' },
                    { label: 'Art Director', value: 'Art Director' },
                    { label: 'Back-End Developer', value: 'Back-End Developer' },
                    { label: 'Brand Ambassador', value: 'Brand Ambassador' },
                    { label: 'Brand Communication Manager', value: 'Brand Communication Manager' },
                    { label: 'Brand Consultant', value: 'Brand Consultant' },
                    { label: 'Brand Director', value: 'Brand Director' },
                    { label: 'Brand Manager', value: 'Brand Manager' },
                    { label: 'Brand Marketing Director', value: 'Brand Marketing Director' },
                    { label: 'Brand Marketing Manager', value: 'Brand Marketing Manager' },
                    { label: 'Brand Specialist', value: 'Brand Specialist' },
                    { label: 'Brand Strategist', value: 'Brand Strategist' },
                    { label: 'Chief Marketing Officer (CMO)', value: 'Chief Marketing Officer (CMO)' },
                    { label: 'Cinematographer', value: 'Cinematographer' },
                    { label: 'Community Engagement Specialist', value: 'Community Engagement Specialist' },
                    { label: 'Community Manager', value: 'Community Manager' },
                    { label: 'Content Creator', value: 'Content Creator' },
                    { label: 'Content Director', value: 'Content Director' },
                    { label: 'Content Editor', value: 'Content Editor' },
                    { label: 'Content Manager', value: 'Content Manager' },
                    { label: 'Content Marketing Lead', value: 'Content Marketing Lead' },
                    { label: 'Content Marketing Manager', value: 'Content Marketing Manager' },
                    { label: 'Content Marketing Specialist', value: 'Content Marketing Specialist' },
                    { label: 'Content Producer', value: 'Content Producer' },
                    { label: 'Content Strategist', value: 'Content Strategist' },
                    { label: 'Content Writer', value: 'Content Writer' },
                    { label: 'Conversion Rate Optimization (CRO) Specialist', value: 'Conversion Rate Optimization (CRO) Specialist' },
                    { label: 'Copy Director', value: 'Copy Director' },
                    { label: 'Copywriter', value: 'Copywriter' },
                    { label: 'Creative Copywriter', value: 'Creative Copywriter' },
                    { label: 'Creative Designer', value: 'Creative Designer' },
                    { label: 'Creative Director', value: 'Creative Director' },
                    { label: 'Creative Writer', value: 'Creative Writer' },
                    { label: 'CRM Assistant', value: 'CRM Assistant' },
                    { label: 'CRM Coordinator', value: 'CRM Coordinator' },
                    { label: 'CRM Data Analyst', value: 'CRM Data Analyst' },
                    { label: 'CRM Manager', value: 'CRM Manager' },
                    { label: 'CRM Operations Manager', value: 'CRM Operations Manager' },
                    { label: 'CRM Specialist', value: 'CRM Specialist' },
                    { label: 'Customer Engagement Manager', value: 'Customer Engagement Manager' },
                    { label: 'Customer Lifecycle Manager', value: 'Customer Lifecycle Manager' },
                    { label: 'Customer Retention Manager', value: 'Customer Retention Manager' },
                    { label: 'Customer Retention Specialist', value: 'Customer Retention Specialist' },
                    { label: 'Design Director', value: 'Design Director' },
                    { label: 'Design Systems Manager', value: 'Design Systems Manager' },
                    { label: 'Digital Designer', value: 'Digital Designer' },
                    { label: 'Digital Marketing Coordinator', value: 'Digital Marketing Coordinator' },
                    { label: 'Digital Marketing Executive', value: 'Digital Marketing Executive' },
                    { label: 'Digital Marketing Manager', value: 'Digital Marketing Manager' },
                    { label: 'Digital Marketing Specialist', value: 'Digital Marketing Specialist' },
                    { label: 'Digital Media Buyer', value: 'Digital Media Buyer' },
                    { label: 'Digital Merchandiser', value: 'Digital Merchandiser' },
                    { label: 'Digital Product Designer', value: 'Digital Product Designer' },
                    { label: 'Digital Solutions Architect', value: 'Digital Solutions Architect' },
                    { label: 'Digital Strategy Manager', value: 'Digital Strategy Manager' },
                    { label: 'eCommerce Analyst', value: 'eCommerce Analyst' },
                    { label: 'eCommerce Content Manager', value: 'eCommerce Content Manager' },
                    { label: 'eCommerce Conversion Manager', value: 'eCommerce Conversion Manager' },
                    { label: 'eCommerce Coordinator', value: 'eCommerce Coordinator' },
                    { label: 'eCommerce Manager', value: 'eCommerce Manager' },
                    { label: 'eCommerce Marketing Manager', value: 'eCommerce Marketing Manager' },
                    { label: 'eCommerce Operations Manager', value: 'eCommerce Operations Manager' },
                    { label: 'eCommerce Product Manager', value: 'eCommerce Product Manager' },
                    { label: 'eCommerce Specialist', value: 'eCommerce Specialist' },
                    { label: 'Experience Designer', value: 'Experience Designer' },
                    { label: 'Front-End Developer', value: 'Front-End Developer' },
                    { label: 'Full-Stack Developer', value: 'Full-Stack Developer' },
                    { label: 'Graphic Designer', value: 'Graphic Designer' },
                    { label: 'Growth Hacker', value: 'Growth Hacker' },
                    { label: 'Growth Marketing Manager', value: 'Growth Marketing Manager' },
                    { label: 'Growth Marketing Specialist', value: 'Growth Marketing Specialist' },
                    { label: 'Head of Creative', value: 'Head of Creative' },
                    { label: 'Head of CRM', value: 'Head of CRM' },
                    { label: 'Head of Design', value: 'Head of Design' },
                    { label: 'Head of eCommerce', value: 'Head of eCommerce' },
                    { label: 'Head of Growth', value: 'Head of Growth' },
                    { label: 'Head of Marketing', value: 'Head of Marketing' },
                    { label: 'Head of Product Design', value: 'Head of Product Design' },
                    { label: 'Head of Social Media', value: 'Head of Social Media' },
                    { label: 'Industrial Designer', value: 'Industrial Designer' },
                    { label: 'Influencer Campaign Manager', value: 'Influencer Campaign Manager' },
                    { label: 'Influencer Marketing Coordinator', value: 'Influencer Marketing Coordinator' },
                    { label: 'Influencer Marketing Manager', value: 'Influencer Marketing Manager' },
                    { label: 'Influencer Marketing Specialist', value: 'Influencer Marketing Specialist' },
                    { label: 'Influencer Partnerships Manager', value: 'Influencer Partnerships Manager' },
                    { label: 'Influencer Relations Manager', value: 'Influencer Relations Manager' },
                    { label: 'Interaction Designer', value: 'Interaction Designer' },
                    { label: 'Interactive Art Director', value: 'Interactive Art Director' },
                    { label: 'Interactive Designer', value: 'Interactive Designer' },
                    { label: 'Lead Copywriter', value: 'Lead Copywriter' },
                    { label: 'Lead Graphic Designer', value: 'Lead Graphic Designer' },
                    { label: 'Lead Product Designer', value: 'Lead Product Designer' },
                    { label: 'Lead UX/UI Designer', value: 'Lead UX/UI Designer' },
                    { label: 'Lead Web Developer', value: 'Lead Web Developer' },
                    { label: 'Lifecycle Marketing Specialist', value: 'Lifecycle Marketing Specialist' },
                    { label: 'Loyalty Program Manager', value: 'Loyalty Program Manager' },
                    { label: 'Marketing Assistant', value: 'Marketing Assistant' },
                    { label: 'Marketing Coordinator', value: 'Marketing Coordinator' },
                    { label: 'Marketing Director', value: 'Marketing Director' },
                    { label: 'Marketing Executive', value: 'Marketing Executive' },
                    { label: 'Marketing Manager', value: 'Marketing Manager' },
                    { label: 'Marketing Specialist', value: 'Marketing Specialist' },
                    { label: 'Motion Graphics Designer', value: 'Motion Graphics Designer' },
                    { label: 'PPC Manager', value: 'PPC Manager' },
                    { label: 'PPC Specialist', value: 'PPC Specialist' },
                    { label: 'Performance Marketing Manager', value: 'Performance Marketing Manager' },
                    { label: 'Physical Product Designer', value: 'Physical Product Designer' },
                    { label: 'Product Designer', value: 'Product Designer' },
                    { label: 'Product Design Director', value: 'Product Design Director' },
                    { label: 'Product Design Engineer', value: 'Product Design Engineer' },
                    { label: 'Product Design Lead', value: 'Product Design Lead' },
                    { label: 'Product Design Manager', value: 'Product Design Manager' },
                    { label: 'Product Marketing Director', value: 'Product Marketing Director' },
                    { label: 'Product Marketing Manager', value: 'Product Marketing Manager' },
                    { label: 'Product Marketing Specialist', value: 'Product Marketing Specialist' },
                    { label: 'Scriptwriter', value: 'Scriptwriter' },
                    { label: 'SEO Copywriter', value: 'SEO Copywriter' },
                    { label: 'SEO Manager', value: 'SEO Manager' },
                    { label: 'SEO Specialist', value: 'SEO Specialist' },
                    { label: 'Senior Art Director', value: 'Senior Art Director' },
                    { label: 'Senior Brand Manager', value: 'Senior Brand Manager' },
                    { label: 'Senior Copywriter', value: 'Senior Copywriter' },
                    { label: 'Senior Creative Director', value: 'Senior Creative Director' },
                    { label: 'Senior CRM Manager', value: 'Senior CRM Manager' },
                    { label: 'Senior Digital Marketing Manager', value: 'Senior Digital Marketing Manager' },
                    { label: 'Senior eCommerce Manager', value: 'Senior eCommerce Manager' },
                    { label: 'Senior Graphic Designer', value: 'Senior Graphic Designer' },
                    { label: 'Senior Influencer Marketing Manager', value: 'Senior Influencer Marketing Manager' },
                    { label: 'Senior Motion Graphics Designer', value: 'Senior Motion Graphics Designer' },
                    { label: 'Senior Product Designer', value: 'Senior Product Designer' },
                    { label: 'Senior Social Media Manager', value: 'Senior Social Media Manager' },
                    { label: 'Senior UX/UI Designer', value: 'Senior UX/UI Designer' },
                    { label: 'Social Media Analyst', value: 'Social Media Analyst' },
                    { label: 'Social Media Consultant', value: 'Social Media Consultant' },
                    { label: 'Social Media Content Creator', value: 'Social Media Content Creator' },
                    { label: 'Social Media Content Manager', value: 'Social Media Content Manager' },
                    { label: 'Social Media Content Strategist', value: 'Social Media Content Strategist' },
                    { label: 'Social Media Coordinator', value: 'Social Media Coordinator' },
                    { label: 'Social Media Copywriter', value: 'Social Media Copywriter' },
                    { label: 'Social Media Director', value: 'Social Media Director' },
                    { label: 'Social Media Manager', value: 'Social Media Manager' },
                    { label: 'Social Media Specialist', value: 'Social Media Specialist' },
                    { label: 'Storyteller', value: 'Storyteller' },
                    { label: 'UX Copywriter', value: 'UX Copywriter' },
                    { label: 'UX Designer', value: 'UX Designer' },
                    { label: 'UX Developer', value: 'UX Developer' },
                    { label: 'UX Product Designer', value: 'UX Product Designer' },
                    { label: 'UX/UI Designer', value: 'UX/UI Designer' },
                    { label: 'UI Designer', value: 'UI Designer' },
                    { label: 'UI Developer', value: 'UI Developer' },
                    { label: 'Video Content Producer', value: 'Video Content Producer' },
                    { label: 'Video Director', value: 'Video Director' },
                    { label: 'Video Editor', value: 'Video Editor' },
                    { label: 'Video Production Manager', value: 'Video Production Manager' },
                    { label: 'Videographer', value: 'Videographer' },
                    { label: 'Visual Designer', value: 'Visual Designer' },
                    { label: 'Web Application Developer', value: 'Web Application Developer' },
                    { label: 'Web Designer', value: 'Web Designer' },
                    { label: 'Web Developer', value: 'Web Developer' },
                    { label: 'Web Development Director', value: 'Web Development Director' },
                    { label: 'Web Development Manager', value: 'Web Development Manager' },
                    { label: 'Web Engineer', value: 'Web Engineer' },
                    { label: 'WordPress Developer', value: 'WordPress Developer' }
                ]
            },
            {
                id: 'new-skills-select',
                maxValues: 3,
                allowNewOption: true,
                options: [
                    { label: '2D Animation', value: '2D Animation' },
                    { label: '3D Animation', value: '3D Animation' },
                    { label: 'A/B Testing', value: 'A/B Testing' },
                    { label: 'Accessibility Design', value: 'Accessibility Design' },
                    { label: 'Account Management', value: 'Account Management' },
                    { label: 'Affiliate Marketing', value: 'Affiliate Marketing' },
                    { label: 'Algorithm Optimisation', value: 'Algorithm Optimisation' },
                    { label: 'App Development', value: 'App Development' },
                    { label: 'Analytics', value: 'Analytics' },
                    { label: 'Art Direction', value: 'Art Direction' },
                    { label: 'Articulating Ideas', value: 'Articulating Ideas' },
                    { label: 'Audience Research & Personas', value: 'Audience Research & Personas' },
                    { label: 'Audience Targeting', value: 'Audience Targeting' },
                    { label: 'Audio Editing', value: 'Audio Editing' },
                    { label: 'Audio Mixing', value: 'Audio Mixing' },
                    { label: 'Automated Email Campaigns', value: 'Automated Email Campaigns' },
                    { label: 'Back-End Development', value: 'Back-End Development' },
                    { label: 'Banner Ads', value: 'Banner Ads' },
                    { label: 'Blog Writing', value: 'Blog Writing' },
                    { label: 'Bounce Rate Analysis', value: 'Bounce Rate Analysis' },
                    { label: 'Brainstorming Solutions', value: 'Brainstorming Solutions' },
                    { label: 'Branding', value: 'Branding' },
                    { label: 'Brand Guidelines', value: 'Brand Guidelines' },
                    { label: 'Brand Identity Development', value: 'Brand Identity Development' },
                    { label: 'Brand Positioning', value: 'Brand Positioning' },
                    { label: 'Brand Storytelling', value: 'Brand Storytelling' },
                    { label: 'Brand Strategy & Development', value: 'Brand Strategy & Development' },
                    { label: 'Branding & Identity Design', value: 'Branding & Identity Design' },
                    { label: 'Budget Management', value: 'Budget Management' },
                    { label: 'Camera Operation', value: 'Camera Operation' },
                    { label: 'Campaign Budgeting & Forecasting', value: 'Campaign Budgeting & Forecasting' },
                    { label: 'Campaign Planning & Execution', value: 'Campaign Planning & Execution' },
                    { label: 'Campaign Strategy', value: 'Campaign Strategy' },
                    { label: 'Cart Abandonment Recovery', value: 'Cart Abandonment Recovery' },
                    { label: 'Case Studies & Reports', value: 'Case Studies & Reports' },
                    { label: 'Churn Analysis', value: 'Churn Analysis' },
                    { label: 'Cinematography', value: 'Cinematography' },
                    { label: 'Click-Through Rate (CTR)', value: 'Click-Through Rate (CTR)' },
                    { label: 'Client Communication', value: 'Client Communication' },
                    { label: 'Client Relationships', value: 'Client Relationships' },
                    { label: 'Client Retention Strategies', value: 'Client Retention Strategies' },
                    { label: 'CMS', value: 'CMS' },
                    { label: 'Collaboration', value: 'Collaboration' },
                    { label: 'Colour Grading', value: 'Colour Grading' },
                    { label: 'Colour Theory', value: 'Colour Theory' },
                    { label: 'Community Building & Management', value: 'Community Building & Management' },
                    { label: 'Compassion', value: 'Compassion' },
                    { label: 'Compromising', value: 'Compromising' },
                    { label: 'Composition & Layout', value: 'Composition & Layout' },
                    { label: 'Concept Development', value: 'Concept Development' },
                    { label: 'Conflict Prevention & Resolution', value: 'Conflict Prevention & Resolution' },
                    { label: 'Continuous Integration/Continuous Deployment (CI/CD)', value: 'Continuous Integration/Continuous Deployment (CI/CD)' },
                    { label: 'Conversion Rate Optimisation (CRO)', value: 'Conversion Rate Optimisation (CRO)' },
                    { label: 'Conversion Tracking', value: 'Conversion Tracking' },
                    { label: 'Copywriting', value: 'Copywriting' },
                    { label: 'Creativity & Innovation', value: 'Creativity & Innovation' },
                    { label: 'Cross-Channel Content Strategy', value: 'Cross-Channel Content Strategy' },
                    { label: 'Cross-Channel Marketing', value: 'Cross-Channel Marketing' },
                    { label: 'Cross-Sell & Up-Sell Strategies', value: 'Cross-Sell & Up-Sell Strategies' },
                    { label: 'Crisis Communication', value: 'Crisis Communication' },
                    { label: 'Critical Thinking & Analysis', value: 'Critical Thinking & Analysis' },
                    { label: 'Customer Acquisition & Retention', value: 'Customer Acquisition & Retention' },
                    { label: 'Customer Acquisition Cost (CAC)', value: 'Customer Acquisition Cost (CAC)' },
                    { label: 'Customer Journey Mapping', value: 'Customer Journey Mapping' },
                    { label: 'Customer Lifetime Value (CLV) Analysis', value: 'Customer Lifetime Value (CLV) Analysis' },
                    { label: 'Customer Relationship Management (CRM)', value: 'Customer Relationship Management (CRM)' },
                    { label: 'Customer Retention Strategies', value: 'Customer Retention Strategies' },
                    { label: 'Customer Service & Client Relations', value: 'Customer Service & Client Relations' },
                    { label: 'Data Analysis & Interpretation', value: 'Data Analysis & Interpretation' },
                    { label: 'Data-Driven Campaigns', value: 'Data-Driven Campaigns' },
                    { label: 'Data-Driven Decision Making', value: 'Data-Driven Decision Making' },
                    { label: 'Data Segmentation & Personalisation', value: 'Data Segmentation & Personalisation' },
                    { label: 'Data Visualisation', value: 'Data Visualisation' },
                    { label: 'Database Management', value: 'Database Management' },
                    { label: 'Decision-Making', value: 'Decision-Making' },
                    { label: 'Delegation of Tasks', value: 'Delegation of Tasks' },
                    { label: 'Design Thinking Process', value: 'Design Thinking Process' },
                    { label: 'Digital Asset Creation', value: 'Digital Asset Creation' },
                    { label: 'Digital Marketing', value: 'Digital Marketing' },
                    { label: 'Digital Marketing Analysis', value: 'Digital Marketing Analysis' },
                    { label: 'Display Advertising', value: 'Display Advertising' },
                    { label: 'Drip Campaigns', value: 'Drip Campaigns' },
                    { label: 'Drone Videography', value: 'Drone Videography' },
                    { label: 'E-commerce Development', value: 'E-commerce Development' },
                    { label: 'Ecommerce Strategy', value: 'Ecommerce Strategy' },
                    { label: 'Email Marketing', value: 'Email Marketing' },
                    { label: 'Email Newsletter Design', value: 'Email Newsletter Design' },
                    { label: 'Email Performance Metrics', value: 'Email Performance Metrics' },
                    { label: 'Emotional Intelligence', value: 'Emotional Intelligence' },
                    { label: 'Engagement Metrics Analysis', value: 'Engagement Metrics Analysis' },
                    { label: 'Event Marketing', value: 'Event Marketing' },
                    { label: 'Front-End Development', value: 'Front-End Development' },
                    { label: 'Full-Stack Development', value: 'Full-Stack Development' },
                    { label: 'Funnel Optimisation', value: 'Funnel Optimisation' },
                    { label: 'GIF Creation', value: 'GIF Creation' },
                    { label: 'Green Screen', value: 'Green Screen' },
                    { label: 'Growth Hacking Strategies', value: 'Growth Hacking Strategies' },
                    { label: 'Growth Marketing', value: 'Growth Marketing' },
                    { label: 'Headline & Tagline Writing', value: 'Headline & Tagline Writing' },
                    { label: 'Heatmap Analysis', value: 'Heatmap Analysis' },
                    { label: 'Identifying Issues', value: 'Identifying Issues' },
                    { label: 'Influencer Campaign Management', value: 'Influencer Campaign Management' },
                    { label: 'Influencer Collaboration & Partnership Deals', value: 'Influencer Collaboration & Partnership Deals' },
                    { label: 'Influencer Identification & Outreach', value: 'Influencer Identification & Outreach' },
                    { label: 'Influencer Marketing', value: 'Influencer Marketing' },
                    { label: 'Influencer Relations', value: 'Influencer Relations' },
                    { label: 'Information Architecture', value: 'Information Architecture' },
                    { label: 'Integrated Marketing Campaigns', value: 'Integrated Marketing Campaigns' },
                    { label: 'Interaction Design', value: 'Interaction Design' },
                    { label: 'Interactive Content', value: 'Interactive Content' },
                    { label: 'Interactive Prototyping', value: 'Interactive Prototyping' },
                    { label: 'Interview Filming', value: 'Interview Filming' },
                    { label: 'Iterative Thinking', value: 'Iterative Thinking' },
                    { label: 'Keyword Research', value: 'Keyword Research' },
                    { label: 'KPI Setting & Measurement', value: 'KPI Setting & Measurement' },
                    { label: 'Lead Scoring', value: 'Lead Scoring' },
                    { label: 'Leadership & Management', value: 'Leadership & Management' },
                    { label: 'Learning & Self-Improvement', value: 'Learning & Self-Improvement' },
                    { label: 'Lifecycle Marketing', value: 'Lifecycle Marketing' },
                    { label: 'Lighting Setup', value: 'Lighting Setup' },
                    { label: 'Link Building Strategy', value: 'Link Building Strategy' },
                    { label: 'Live Streaming', value: 'Live Streaming' },
                    { label: 'Local SEO', value: 'Local SEO' },
                    { label: 'Long-Form Content', value: 'Long-Form Content' },
                    { label: 'Loyalty Programmes', value: 'Loyalty Programmes' },
                    { label: 'Managing Difficult Conversations', value: 'Managing Difficult Conversations' },
                    { label: 'Market Research & Analysis', value: 'Market Research & Analysis' },
                    { label: 'Market Segmentation', value: 'Market Segmentation' },
                    { label: 'Marketing Automation', value: 'Marketing Automation' },
                    { label: 'Marketing Communications', value: 'Marketing Communications' },
                    { label: 'Marketing Metrics (CPC, CTR, ROI)', value: 'Marketing Metrics (CPC, CTR, ROI)' },
                    { label: 'Marketing Project Management', value: 'Marketing Project Management' },
                    { label: 'Media Relations', value: 'Media Relations' },
                    { label: 'Meeting Deadlines', value: 'Meeting Deadlines' },
                    { label: 'Mentorship & Coaching', value: 'Mentorship & Coaching' },
                    { label: 'Mobile Development', value: 'Mobile Development' },
                    { label: 'Mobile Optimisation for Web', value: 'Mobile Optimisation for Web' },
                    { label: 'Moodboard Creation', value: 'Moodboard Creation' },
                    { label: 'Motion Graphics', value: 'Motion Graphics' },
                    { label: 'Multi-Camera Setup', value: 'Multi-Camera Setup' },
                    { label: 'Multitasking', value: 'Multitasking' },
                    { label: 'Native Mobile Development', value: 'Native Mobile Development' },
                    { label: 'Negotiation & Persuasion', value: 'Negotiation & Persuasion' },
                    { label: 'On-Page SEO', value: 'On-Page SEO' },
                    { label: 'Online Reputation Management', value: 'Online Reputation Management' },
                    { label: 'Paid Social Advertising', value: 'Paid Social Advertising' },
                    { label: 'Pay-Per-Click (PPC) Campaigns', value: 'Pay-Per-Click (PPC) Campaigns' },
                    { label: 'Performance Benchmarking', value: 'Performance Benchmarking' },
                    { label: 'Performance Management', value: 'Performance Management' },
                    { label: 'Persuasive Writing', value: 'Persuasive Writing' },
                    { label: 'Pitching Ideas', value: 'Pitching Ideas' },
                    { label: 'Planning & Scheduling', value: 'Planning & Scheduling' },
                    { label: 'Press Releases', value: 'Press Releases' },
                    { label: 'Problem-Solving & Critical Thinking', value: 'Problem-Solving & Critical Thinking' },
                    { label: 'Product Design', value: 'Product Design' },
                    { label: 'Product Pricing Strategies', value: 'Product Pricing Strategies' },
                    { label: 'Product Roadmapping', value: 'Product Roadmapping' },
                    { label: 'Programmatic Advertising', value: 'Programmatic Advertising' },
                    { label: 'Project Management', value: 'Project Management' },
                    { label: 'Prototyping', value: 'Prototyping' },
                    { label: 'Public Relations', value: 'Public Relations' },
                    { label: 'Rapid Iteration & Feedback Loops', value: 'Rapid Iteration & Feedback Loops' },
                    { label: 'Re-Engagement Campaigns', value: 'Re-Engagement Campaigns' },
                    { label: 'Rebranding Strategy', value: 'Rebranding Strategy' },
                    { label: 'Reporting & Dashboard Creation', value: 'Reporting & Dashboard Creation' },
                    { label: 'RESTful APIs', value: 'RESTful APIs' },
                    { label: 'Retargeting', value: 'Retargeting' },
                    { label: 'Root Cause Analysis', value: 'Root Cause Analysis' },
                    { label: 'Sales Copywriting', value: 'Sales Copywriting' },
                    { label: 'Script Writing', value: 'Script Writing' },
                    { label: 'Search Engine Marketing (SEM)', value: 'Search Engine Marketing (SEM)' },
                    { label: 'Search Engine Optimisation (SEO)', value: 'Search Engine Optimisation (SEO)' },
                    { label: 'SEO Content Writing', value: 'SEO Content Writing' },
                    { label: 'Social Media Advertising', value: 'Social Media Advertising' },
                    { label: 'Social Media Calendars', value: 'Social Media Calendars' },
                    { label: 'Social Media Strategy', value: 'Social Media Strategy' },
                    { label: 'Social Media Trends Tracking', value: 'Social Media Trends Tracking' },
                    { label: 'Sound Design', value: 'Sound Design' },
                    { label: 'Stakeholder Communication', value: 'Stakeholder Communication' },
                    { label: 'Strategic Partnerships', value: 'Strategic Partnerships' },
                    { label: 'Strategic Thinking', value: 'Strategic Thinking' },
                    { label: 'Storyboarding', value: 'Storyboarding' },
                    { label: 'Storytelling', value: 'Storytelling' },
                    { label: 'SWOT Analysis', value: 'SWOT Analysis' },
                    { label: 'Team-Building', value: 'Team-Building' },
                    { label: 'Team Leadership & Collaboration', value: 'Team Leadership & Collaboration' },
                    { label: 'Time Management & Organisation', value: 'Time Management & Organisation' },
                    { label: 'Tone of Voice', value: 'Tone of Voice' },
                    { label: 'Trend Spotting', value: 'Trend Spotting' },
                    { label: 'Typography', value: 'Typography' },
                    { label: 'UI/UX Design Principles', value: 'UI/UX Design Principles' },
                    { label: 'UI/UX Development', value: 'UI/UX Development' },
                    { label: 'Upselling & Cross-Selling', value: 'Upselling & Cross-Selling' },
                    { label: 'Usability Testing', value: 'Usability Testing' },
                    { label: 'User-Centred Design (UCD)', value: 'User-Centred Design (UCD)' },
                    { label: 'User Experience (UX) in Ecommerce', value: 'User Experience (UX) in Ecommerce' },
                    { label: 'User-Generated Content', value: 'User-Generated Content' },
                    { label: 'UX Copywriting', value: 'UX Copywriting' },
                    { label: 'Version Control', value: 'Version Control' },
                    { label: 'Video Content Creation', value: 'Video Content Creation' },
                    { label: 'Video Editing', value: 'Video Editing' },
                    { label: 'Video Production', value: 'Video Production' },
                    { label: 'Viral Loops', value: 'Viral Loops' },
                    { label: 'Visual Effects (VFX)', value: 'Visual Effects (VFX)' },
                    { label: 'Visual Storytelling', value: 'Visual Storytelling' },
                    { label: 'Web Design', value: 'Web Design' },
                    { label: 'Web Development', value: 'Web Development' },
                    { label: 'Wireframing', value: 'Wireframing' }
                ]
            },
            {
                id: 'salary-select',
                maxValues: 1,
                multiple: false,
                allowNewOption: false,
                options: [
                    { label: '£20-25k', value: '£20-25k' },
                    { label: '£25-30k', value: '£25-30k' },
                    { label: '£30-35k', value: '£30-35k' },
                    { label: '£35-40k', value: '£35-40k' },
                    { label: '£40-45k', value: '£40-45k' },
                    { label: '£45-50k', value: '£45-50k' },
                    { label: '£50-55k', value: '£50-55k' },
                    { label: '£55-60k', value: '£55-60k' },
                    { label: '£60-65k', value: '£60-65k' },
                    { label: '£65-70k', value: '£65-70k' },
                    { label: '£70-80k', value: '£70-80k' },
                    { label: '£80-90k', value: '£80-90k' },
                    { label: '£90-100k', value: '£90-100k' },
                    { label: 'Over £100k', value: 'Over £100k' }
                ]
            },
            {
                id: 'experience',
                maxValues: 1,
                multiple: false,
                allowNewOption: false,
                options: [
                    { label: '1', value: '1' },
                    { label: '2', value: '2' },
                    { label: '3', value: '3' },
                    { label: '4', value: '4' },
                    { label: '5', value: '5' },
                    { label: '6', value: '6' },
                    { label: '7', value: '7' },
                    { label: '8', value: '8' },
                    { label: '9', value: '9' },
                    { label: '10', value: '10' },
                    { label: '10+', value: '10+' }
                ]
            },
            {
                id: 'team-management',
                maxValues: 1,
                multiple: false,
                allowNewOption: false,
                options: [
                    { label: 'None', value: 'None' },
                    { label: 'Supervisor', value: 'Supervisor' },
                    { label: 'Manager', value: 'Manager' },
                    { label: 'Senior Manager', value: 'Senior Manager' },
                    { label: 'Director', value: 'Director' },
                ]
            },
            {
                id: 'office-days',
                maxValues: 1,
                multiple: false,
                allowNewOption: false,
                options: [
                    { label: '0 days (Fully remote)', value: '0 days' },
                    { label: '1 day', value: '1 day' },
                    { label: '2 days', value: '2 days' },
                    { label: '3 days', value: '3 days' },
                    { label: '4 days', value: '4 days' },
                    { label: '5 days (Full-time in the office)', value: '5 days' },
                ]
            },
            {
                id: 'commute',
                maxValues: 1,
                multiple: false,
                allowNewOption: false,
                options: [
                    { label: 'Up to 30 mins', value: 'Up to 30 mins' },
                    { label: '30-60 mins', value: '30-60 mins' },
                    { label: 'Over 60 mins', value: 'Over 60 mins' },
                ]
            },
            {
                id: 'notice',
                maxValues: 1,
                multiple: false,
                allowNewOption: false,
                options: [
                    { label: 'Immediately', value: 'Immediately' },
                    { label: 'Under 1 month', value: 'Under 1 month' },
                    { label: '1 month', value: '1 month' },
                    { label: '6 weeks', value: '6 weeks' },
                    { label: '2 months', value: '2 months' },
                    { label: '3 months', value: '3 months' },
                    { label: 'Over 3 months', value: 'Over 3 months' },
                ]
            },
            {
                id: 'work-type',
                maxValues: null,
                allowNewOption: false,
                options: [
                    { label: 'Full-time', value: 'Full-time' },
                    { label: 'Part-time', value: 'Part-time' },
                    { label: 'Contract', value: 'Contract' },
                    { label: 'Freelance', value: 'Freelance' },
                ]
            },
            {
                id: 'spec',
                maxValues: 1,
                multiple: false,
                allowNewOption: false,
                options: [
                    { label: 'Yes', value: 'Yes' },
                    { label: 'No', value: 'No' },
                    { label: 'Learn more', value: 'Learn more' },
                ]
            }
        ];

        selectElements.forEach(({ id, maxValues, multiple, allowNewOption, options }) => {
            VirtualSelect.init({
                ele: `#${id}`,
                options: options,
                multiple: multiple !== undefined ? multiple : true,
                search: false,
                maxValues: maxValues,
                placeholder: 'Select option(s)',
                noOptionsText: 'No options found',
                noSearchResultsText: 'No results found',
                selectAllText: 'Select All',
                optionsSelectedText: 'options selected',
                allOptionsSelectedText: 'All selected',
                optionSelectedText: 'option selected',
                clearButtonText: 'Clear',
                allowNewOption: allowNewOption,
                showValueAsTags: true,
                onDropboxPositioned: (dropboxWrapper) => {
                    const toggleButton = dropboxWrapper.previousElementSibling;
                    const dropboxContainer = dropboxWrapper.querySelector('.vscomp-dropbox-container');
                    
                    if (dropboxContainer) {
                        const toggleButtonRect = toggleButton.getBoundingClientRect();
                        const dropboxContainerRect = dropboxContainer.getBoundingClientRect();
                        
                        const newTop = toggleButtonRect.bottom + window.pageYOffset;
                        dropboxContainer.style.top = `${newTop}px`;
                        dropboxContainer.style.transform = 'none';
                    }
                }
            });
        });

        // Airtable
        const airtableAccessToken = 'pathgRD5q0JM4llYM.08be1253e622d90992aeb25f4a526ec65d42a11570ba49e8af611faa58e29b73';
        const airtableBaseID = 'YappibI7BCCGzypimr';
        const airtableTableName = 'Jack-Barden';

        function sendToAirtable(formData) {
        const url = `https://api.airtable.com/v0/${appibI7BCCGzypimr}/${Jack-Barden}`;
        
        const data = {
            fields: formData
        };

        fetch(url, {
            method: 'POST',
            headers: {
            Authorization: `Bearer ${'pathgRD5q0JM4llYM.08be1253e622d90992aeb25f4a526ec65d42a11570ba49e8af611faa58e29b73'}`,
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(data), 
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            alert('Form submitted successfully!');
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('There was an error submitting the form.');
        });
        }

        // Form submit button
        document.querySelector('#typeform-questionnaire').addEventListener('submit', function(e) {
        e.preventDefault();

        // Collect form data from input fields
        const formData = {};
        document.querySelectorAll('input, textarea, select').forEach(input => {
            formData[input.name] = input.value;
        });

        // Send form data to Airtable
        sendToAirtable(formData);
        });
    }
});
