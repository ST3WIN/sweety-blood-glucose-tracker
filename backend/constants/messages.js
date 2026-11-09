const AUTH_MESSAGES = Object.freeze({
    PROVIDE_CREDENTIALS: "Please provide email and password",
    EMAIL_EXISTS: "User already exists",
    REGISTRATION_SUCCESS: "User registered successfully",
    INVALID_CREDENTIALS: "Invalid email or password",
    LOGIN_SUCCESS: "Login successful",
    NOT_AUTHORIZED: "You are not authorized to access this resource",
})

const COMMON_MESSAGES = Object.freeze({
    INTERNAL_SERVER_ERROR: "Internal server error",
})

module.exports = {
    AUTH_MESSAGES,
    COMMON_MESSAGES,
}