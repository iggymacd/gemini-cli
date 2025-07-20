# Authentication PRD: Integrating with External Auth Service

## 1. Introduction

This document outlines the proposed changes to the `mcp-server-prd` to integrate with an external authentication microservice. The goal is to replace the current dummy authentication mechanism with a more robust, production-ready solution that leverages JWTs (JSON Web Tokens) and user fingerprints for secure session management.

## 2. Current Authentication Mechanism (Brief Overview)

Currently, the `mcp-server-prd` uses a simple, in-memory authentication system where a hardcoded username and password (`admin`/`password`) grant access and set a `sessionToken` directly within the server instance. This is not suitable for production environments due to security and scalability concerns.

## 3. Proposed Authentication Flow

The new authentication flow will involve the following steps:

1.  **User Initiates Login:** When a user attempts to log in via the `login` tool, the `mcp-server-prd` will forward the provided username and password to the external `auth` microservice's `/login` endpoint.
2.  **Auth Service Authentication:** The `auth` microservice will authenticate the user.
3.  **Token and Fingerprint Issuance:** Upon successful authentication, the `auth` microservice will return a JWT (JSON Web Token) and a user fingerprint.
4.  **Server-Side Storage:** The `mcp-server-prd` will store the received JWT and fingerprint securely. For the initial implementation, this will be stored in memory within the `PrdMcpServer` instance. In future iterations, this could be extended to a more persistent and scalable session store.
5.  **Authenticated Requests:** For subsequent requests requiring authentication (e.g., `get_secret_message`), the `mcp-server-prd` will include the JWT in the `Authorization` header (as a Bearer token) and potentially the fingerprint in a custom header or cookie, as required by other microservices.

## 4. External Auth Service Details

### Endpoint:
`https://localhost/api/v1/auth/login`

### Request Example:

```
fetch("https://localhost/api/v1/auth/login", {
  "headers": {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json",
    "sec-ch-ua": "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Google Chrome\";v=\"138\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"macOS\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "cookie": "ajs_anonymous_id=\"7eec3b80-da79-4de0-9fbf-1de24f05f264\"; __next_hmr_refresh_hash__=44; next-auth.csrf-token=cbeae860d132ab1aba7a5e9e6337cc91df4c08a8a4afba464764cadbb567c109%7Cc18e774524d52225f5e9010a9030a7024a39c6f3a40994dd490ebd80d79e9213; next-auth.callback-url=http%3A%2F%2Flangfuse-server%3A3001%2F; next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..YmBD9Pi531sUay3D.3S_pFBhpdkOr1XHb4KNjb6nd_MjNhgc6Y8us2APZH6C1CsHAVjcepnoQgkR90qs7tMplflTwf0tl0qd4PvGkj4-QZVMGzngbXMratCjhkY6GidCkidwkfgG-ougkDA-ImfZLLEypIQD7o2k6_cxtDYedhBW7Sdb_GFQrOsh456PKmr3_BX2TegHqKgpVp4QY7kzaReud_PNQUnB4AiMZvr_mX4F-qbXXAxRY50FXoi8dUA.KPBrmfS9i2oo2zrslLS8bA",
    "Referer": "https://localhost:5173/login"
  },
  "body": "{\"email\":\"iggymacd@gmail.com\",\"password\":\"password01\",\"token_2fa\":\"\"}",
  "method": "POST"
});
```

### Response Example:

```json
{
  "status": true,
  "message": "OK",
  "errors": null,
  "data": {
    "fgp": "8a6b052164aabe546f40cd2caf90eacc99a2873fa87365cee82dbb68110bc47f945505391ee790b674e9f576194bff10a9cf",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNmJjMmExNTctOWE4NC00MjE0LTkzN2UtNGQ0ODc2ZGZkOTEyIiwiYXBwbGljYXRpb25faWQiOiI4MmZlZTg3OC00MGUwLTQ2OTMtYTZjMC1kY2Y2MjUxNWUwNzIiLCJvcmdhbml6YXRpb25faWQiOiI1M2NjMmJhNC0zODlmLTQ1NzEtYWFkNy01ZTczMDdiOTA3MzMiLCJlbWFpbCI6ImlnZ3ltYWNkQGdtYWlsLmNvbSIsInJvbGVzIjpbIm9yZyBhZG1pbiIsImNyZWF0b3IiLCJ2aWV3ZXIiXSwicm9sZUlkcyI6WyJhZWU0OGM3YS1hNDA3LTRiN2UtOWVlMi01NzNlOTE4ZWQ1MjAiLCI5OTljNTg2ZC02YmU2LTQ0Y2EtYmU1NC0zY2M0ZjI3YTQxNGYiLCJlYjQwYzAzMC1lYmY3LTRmZmUtYWU4OC1jNjU4NzQ1MTFhNTkiXSwic2NlbmFyaW9faWQiOiIiLCJ1c2VyX2ZpbmdlcnByaW50IjoiOTcxZDgwY2YxODEwYTM5NDUwODcxYzYwYzZjMDlkNTlkMzI2MWY2OTljNjMxYjkyMTFhMzNmNmVjZTVmZmQxYSIsImlzcyI6ImNncyIsImV4cCI6MTc1MzA1NjI0NiwiaWF0IjoxNzUyOTY5ODQ2fQ.6bia9M1jmA_vp0bdG_I6M7ud3_kSa8eWVPpazSEwJu1"
  }
}
```

## 5. Changes to `mcp-server-prd`

### 5.1. Dependencies

*   Add `node-fetch` as a dependency to `package.json`.

### 5.2. `PrdMcpServer` Class Modifications

*   **`sessionToken` and `userFingerprint` Storage:** The `PrdMcpServer` class will be updated to store both the JWT (`token`) and the `fgp` (fingerprint) returned by the `auth` service.

    ```typescript
    class PrdMcpServer extends McpServer {
      private jwtToken: string | null = null;
      private userFingerprint: string | null = null;
      // ... rest of the class
    }
    ```

*   **`login` Tool Update:**
    *   The `login` tool will make a `POST` request to the `auth` service's `/login` endpoint.
    *   The request body will contain the `username` (mapped to `email`), `password`, and an empty `token_2fa` field.
    *   Upon a successful response (status `true`), the `jwtToken` and `userFingerprint` will be extracted from the `data` field and stored.
    *   Error handling will be implemented for network issues or invalid credentials from the `auth` service.

*   **`get_secret_message` Tool Update:**
    *   This tool will be modified to include the `jwtToken` and `userFingerprint` in the `Authorization` header in the format `Bearer {token}:{fingerprint}` when making its internal request to retrieve the secret message.
    *   It will check for the presence of both `jwtToken` and `userFingerprint` before attempting to retrieve the secret message.

## 6. Security Considerations

*   **HTTPS:** All communication with the `auth` microservice should occur over HTTPS to protect credentials and tokens in transit.
*   **Token Storage:** For this initial implementation, tokens will be stored in memory. For persistent sessions, consider secure storage mechanisms (e.g., HTTP-only cookies, encrypted local storage, or a dedicated session store).
*   **Token Validation:** The `mcp-server-prd` will rely on the `auth` service for initial token validation. If the `mcp-server-prd` were to directly consume or validate JWTs, it would need to implement proper JWT validation (signature verification, expiry, audience, etc.).
*   **Error Handling:** Implement robust error handling to prevent information leakage in case of authentication failures or issues with the `auth` service.

## 7. Future Enhancements

*   Implement token refresh mechanisms to handle JWT expiry gracefully.
*   Integrate with a centralized session store for more scalable session management.
*   Add logging for authentication events.
*   Implement proper logout functionality to invalidate sessions.
