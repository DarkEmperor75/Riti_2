// ==========================================
// SIGNUP DOCUMENTATION
// ==========================================
export const AUTH_SIGNUP_DESCRIPTION = `
**Create New User Account**

Register a new unified user account for the Riti platform. All users start with a unified account that can act as ATTENDEE, HOST, or VENDOR based on their actions.

**Account Features:**
- Unified identity across all roles (Attendee, Host, Vendor)
- Email verification required before certain actions
- Secure password hashing (bcrypt, 12 rounds)
- Automatic session creation on signup
- JWT-based authentication (access + refresh tokens)

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*)

**Terms & Conditions:**
- User must accept terms to complete signup
- \`termsAccepted\` must be \`true\`

**Default Settings:**
- \`userType\`: ATTENDEE (can be upgraded based on actions)
- \`status\`: ACTIVE
- \`country\`: User-specified (NO, SE, DK)

**Response:**
Returns authentication tokens and user profile. Store these securely:
- \`accessToken\`: Use for API requests (Authorization: Bearer {token})
- \`refreshToken\`: Use to get new access tokens when expired
`;

export const AUTH_SIGNUP_400_RESPONSE = `
**Validation Errors:**
- Email already exists (409 Conflict)
- Passwords don't match
- Password doesn't meet requirements
- Terms not accepted
- Invalid email format
- Missing required fields
`;

// ==========================================
// LOGIN DOCUMENTATION
// ==========================================
export const AUTH_LOGIN_DESCRIPTION = `
**Login with Email & Password**

Authenticate an existing user and receive JWT tokens for API access.

**Login Process:**
1. Validates email and password
2. Checks account status (must be ACTIVE)
3. Generates new access token (30min) + refresh token (7 days)
4. Creates new session record with device info
5. Returns tokens and user profile

**Session Tracking:**
Each login creates a new session record with:
- Device/browser info (User-Agent)
- IP address
- Login timestamp
- Session expiry

**Account Status Checks:**
- ✅ ACTIVE: Login succeeds
- ❌ SUSPENDED: Login blocked with message
- ❌ INACTIVE: Login blocked with message

**OAuth Users:**
If user signed up with Google OAuth and never set a password, they must use Google login or reset their password first.

**Rate Limiting:**
Failed login attempts may trigger rate limiting (implementation pending).
`;

export const AUTH_LOGIN_401_RESPONSE = `
**Authentication Failures:**
- Invalid email or password
- Account suspended or inactive
- OAuth account without password (use Google login)
- Email not found
`;

// ==========================================
// LOGOUT DOCUMENTATION
// ==========================================
export const AUTH_LOGOUT_DESCRIPTION = `
**Logout from Current Session**

Revokes the current access token session. The user will need to login again or use a refresh token to get a new access token.

**What Gets Revoked:**
- Current session (identified by access token)
- Session marked as \`isRevoked: true\` in database

**What Stays Active:**
- Refresh token (still valid for other devices)
- Other sessions on different devices

**Use Case:**
User clicks "Logout" button in the app on their current device.

**Security Note:**
Access token remains technically valid until expiry (30min), but session is marked as revoked. Implement token blacklisting for immediate revocation if needed.
`;

export const AUTH_LOGOUT_ALL_DESCRIPTION = `
**Logout from All Devices**

Revokes all refresh tokens for the user across all devices and browsers. This forces logout everywhere.

**What Gets Revoked:**
- All refresh tokens for this user
- User must login again on ALL devices

**What Stays Active:**
- Current access tokens remain valid until expiry (max 30min)
- Sessions are not immediately terminated

**Use Cases:**
- User suspects account compromise
- Lost device
- Security precaution after password change
- "Logout everywhere" feature

**Recommendation:**
After logout-all, recommend user to change their password if security is a concern.
`;

// ==========================================
// REFRESH TOKEN DOCUMENTATION
// ==========================================
export const AUTH_REFRESH_DESCRIPTION = `
**Refresh Access Token**

Exchange a valid refresh token for a new access token + refresh token pair. This extends the user's session without requiring re-login.

**How It Works:**
1. Client sends refresh token in request body
2. Server validates refresh token:
   - Checks JWT signature and claims
   - Verifies token exists in database
   - Checks \`isRevoked: false\`
   - Checks \`expiresAt\` not passed
3. Generates new token pair
4. **Revokes old refresh token** (one-time use)
5. Stores new refresh token in database
6. Returns new tokens

**Token Rotation:**
Each refresh generates a NEW refresh token and invalidates the old one. This is a security best practice called "refresh token rotation."

**Why Token Rotation?**
- Limits impact of stolen refresh tokens
- Detects token reuse (possible attack)
- Forces periodic re-authentication

**Frontend Implementation:**
\`\`\`typescript
// Detect 401 Unauthorized
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response.status === 401) {
      // Try to refresh
      const newTokens = await refreshTokens();
      // Retry original request with new token
      return axios.request(originalRequest);
    }
  }
);
\`\`\`

**Security:**
- Refresh tokens are single-use only
- Old token is immediately revoked
- Reusing old token will fail (possible attack indicator)
`;

export const AUTH_REFRESH_401_RESPONSE = `
**Refresh Token Failures:**
- Token expired (user must login again)
- Token already used (revoked)
- Token not found in database
- Invalid token signature
- Token belongs to different user
- Token missing required claims (type: 'refresh')
`;

// ==========================================
// GOOGLE OAUTH DOCUMENTATION
// ==========================================
export const AUTH_GOOGLE_DESCRIPTION = `
**OAuth Flow Step 1: Redirect to Google**

Redirects the user to Google's OAuth 2.0 consent screen for authentication.

**How it works:**
1. User clicks "Login with Google" button in frontend
2. Frontend redirects browser to this endpoint: \`GET /api/auth/google\`
3. Backend redirects to Google's OAuth consent page
4. User authorizes the application on Google
5. Google redirects back to \`/api/auth/google/callback\` with auth code

**No request body or headers needed** - just visit this URL in the browser.

**Example Usage:**
\`\`\`html
<a href="http://localhost:3000/api/auth/google">
  Login with Google
</a>
\`\`\`

**Scopes Requested:**
- \`email\` - User's email address
- \`profile\` - User's basic profile info (name, photo)

**Note:** This endpoint cannot be tested in Swagger UI as it requires browser redirect handling.
`;

export const AUTH_GOOGLE_CALLBACK_DESCRIPTION = `
**OAuth Flow Step 2: Handle Google Callback**

Google redirects to this endpoint after user authorizes the application.

**Automatic Processing:**
1. Receives authorization code from Google (in query params)
2. Exchanges code for user profile via GoogleStrategy
3. Finds existing user by email OR creates new user with:
   - \`googleId\`: Google's unique user ID
   - \`email\`: User's Google email
   - \`fullName\`: User's display name
   - \`userType\`: \`ATTENDEE\` (default)
   - \`termsAccepted\`: \`true\` (assumed for OAuth)
4. Links Google account to existing user if email matches
5. Generates JWT tokens:
   - **Access Token**: Valid for 30 minutes (configurable)
   - **Refresh Token**: Valid for 7 days (configurable)
6. Stores refresh token in database
7. Redirects to frontend with tokens

**Frontend receives:**
\`\`\`
http://localhost:3000/auth/callback?accessToken=eyJhbGc...&refreshToken=eyJhbGc...
\`\`\`

**Frontend should:**
1. Extract tokens from URL query params
2. Store in localStorage/cookies
3. Decode accessToken to get user info
4. Redirect to dashboard

**Security Features:**
- Tokens include \`iss\` (issuer) and \`aud\` (audience) claims
- Refresh tokens stored with expiry tracking
- Email auto-verified for Google OAuth users
- Duplicate email handling (links to existing account)

**Error Scenarios:**
- Google returns no email: 500 Internal Server Error
- Database error: 500 Internal Server Error
- Invalid OAuth state: 401 Unauthorized

**Note:** This endpoint is called by Google, not directly by your frontend.
`;

export const AUTH_GOOGLE_CALLBACK_RESPONSE = `
Redirects to frontend with authentication tokens in URL query parameters.

**Redirect URL Format:**
\`\`\`
{FRONTEND_URL}/auth/callback?accessToken={jwt}&refreshToken={jwt}
\`\`\`

**Access Token Payload:**
\`\`\`json
{
  "sub": "user_id",
  "email": "user@example.com",
  "iss": "RITI-SERVER",
  "aud": "RITI-FRONTEND",
  "iat": 1738171763,
  "exp": 1738173563
}
\`\`\`

**Refresh Token Payload:**
\`\`\`json
{
  "sub": "user_id",
  "type": "refresh",
  "iss": "RITI-SERVER",
  "aud": "RITI-FRONTEND",
  "iat": 1738171763,
  "exp": 1738776563
}
\`\`\`
`;
