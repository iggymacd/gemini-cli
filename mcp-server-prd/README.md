# MCP Server PRD

This is an MCP server built based on the PRD.

## Authentication

This server now integrates with an external authentication microservice to handle user logins and session management. Instead of a hardcoded username and password, the `login` tool now sends credentials to an external `/api/v1/auth/login` endpoint. Upon successful authentication, a JSON Web Token (JWT) and a user fingerprint are received and stored internally.

Subsequent authenticated requests, such as retrieving a secret message, will utilize this JWT and fingerprint for authorization. The `Authorization` header for these requests will be in the format `Bearer {token}:{fingerprint}`. This provides a more secure and scalable authentication mechanism for production environments.