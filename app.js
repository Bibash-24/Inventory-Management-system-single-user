
// =====================================
// INVENTORY MANAGEMENT SYSTEM
// SINGLE USER AUTHENTICATION
// =====================================

const USER_KEY = "ims_single_user";
const SESSION_KEY = "ims_current_user";

// =====================================
// MODAL FUNCTIONS
// =====================================

function openModal(id) {
    document.getElementById(id).style.display = "flex";
}

function closeModal(id) {
    document.getElementById(id).style.display = "none";
}

// Close modal when clicking outside
window.addEventListener("click", function(event) {

    const signup = document.getElementById("signup");
    const login = document.getElementById("login");

    if (event.target === signup) {
        closeModal("signup");
    }

    if (event.target === login) {
        closeModal("login");
    }

});

// =====================================
// SHOW / HIDE PASSWORD
// =====================================

function togglePassword(passId, confirmId = null) {

    const password = document.getElementById(passId);

    password.type =
        password.type === "password" ? "text" : "password";

    if (confirmId) {

        const confirmPassword =
            document.getElementById(confirmId);

        confirmPassword.type =
            confirmPassword.type === "password"
                ? "text"
                : "password";
    }
}

// =====================================
// PASSWORD HASHING
// =====================================

async function hashPassword(password) {

    if (!window.crypto || !window.crypto.subtle) {
        throw new Error(
            "Secure password hashing requires HTTPS. Open the website through GitHub Pages."
        );
    }

    const encodedPassword =
        new TextEncoder().encode(password);

    const hash = await crypto.subtle.digest(
        "SHA-256",
        encodedPassword
    );

    return Array.from(new Uint8Array(hash))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

// =====================================
// SIGNUP
// =====================================

document.getElementById("signupForm")
.addEventListener("submit", async function(event) {

    event.preventDefault();

    const name =
        document.getElementById("signupName").value.trim();

    const email =
        document.getElementById("signupEmail").value.trim().toLowerCase();

    const phone =
        document.getElementById("signupPhone").value.trim();

    const password =
        document.getElementById("signupPassword").value;

    const confirmPassword =
        document.getElementById("signupCPassword").value;

    const error =
        document.getElementById("signupError");

    const success =
        document.getElementById("signupSuccess");

    error.textContent = "";
    success.textContent = "";

    // Check password
    if (password !== confirmPassword) {
        error.textContent = "Passwords do not match!";
        return;
    }

    if (password.length < 6) {
        error.textContent =
            "Password must contain at least 6 characters!";
        return;
    }

    // Single-user restriction
    if (localStorage.getItem(USER_KEY)) {
        error.textContent =
            "An account already exists on this browser!";
        return;
    }

    try {

        const hashedPassword = await hashPassword(password);

        const user = {
            name: name,
            email: email,
            phone: phone,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        localStorage.setItem(
            USER_KEY,
            JSON.stringify(user)
        );

        success.textContent =
            "Account created successfully! You can now login.";

        document.getElementById("signupForm").reset();

    } catch (err) {

        error.textContent = err.message;

    }

});

// =====================================
// LOGIN
// =====================================

document.getElementById("loginForm")
.addEventListener("submit", async function(event) {

    event.preventDefault();

    const email =
        document.getElementById("loginEmail").value.trim().toLowerCase();

    const password =
        document.getElementById("loginPassword").value;

    const error =
        document.getElementById("loginError");

    const success =
        document.getElementById("loginSuccess");

    error.textContent = "";
    success.textContent = "";

    const savedUser = localStorage.getItem(USER_KEY);

    if (!savedUser) {
        error.textContent =
            "No account found! Please sign up first.";
        return;
    }

    const user = JSON.parse(savedUser);

    if (email !== user.email) {
        error.textContent = "User not found!";
        return;
    }

    try {

        const hashedPassword = await hashPassword(password);

        if (hashedPassword !== user.password) {
            error.textContent = "Wrong password!";
            return;
        }

        // Save current login session
        localStorage.setItem(
            SESSION_KEY,
            JSON.stringify({
                name: user.name,
                email: user.email,
                loginTime: new Date().toISOString()
            })
        );

        success.textContent = "Login successful!";

        document.getElementById("loginForm").reset();

        // Open dashboard after successful login
        setTimeout(function() {
            window.location.href = "dashboard.html";
        }, 700);

    } catch (err) {

        error.textContent = err.message;

    }

});

// =====================================
// CHECK EXISTING SESSION
// =====================================

const currentUser = localStorage.getItem(SESSION_KEY);

if (currentUser) {
    window.location.href = "dashboard.html";
}
