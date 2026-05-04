# News Aggregator API

A robust Node.js backend application that provides personalized news feeds using the GDELT Project API. This project implements secure user authentication, preference management, and a high-resilience news fetching service designed to operate within strict API rate limits.

## Core Features
*   **User Authentication**: Secure Registration and Login using JWT (JSON Web Tokens) and Bcrypt password hashing.
*   **Preference Management**: Users can set, update, and append their news interests (categories and languages).
*   **Resilient News Service**: Advanced integration with GDELT featuring:
    *   **Scarcity Strategy**: Minimized external requests to stay below IP-based firewall thresholds.
    *   **Aggressive Caching**: 4-hour local cache to ensure performance and prevent redundant API hits.
    *   **Fail-Safe Logic**: Returns cached "stale" data in the event of an external API 429 (Too Many Requests) or 500 error.
*   **Search Functionality**: Dedicated endpoint to search for news using specific keywords with built-in sanitization.

## Tech Stack
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: SQLite (via Sequelize ORM)
*   **Security**: JWT, Bcrypt
*   **Utilities**: Axios (HTTP), Node-Cache, Express-Validator

## API Connectivity & Rate Limiting Note
This project integrates with the **GDELT Project API**, which employs aggressive IP-based rate limiting. To ensure maximum stability during evaluation:
1.  **Request Scarcity**: The application is optimized to hit the API only when a fresh cache is required.
2.  **Background Sync**: Periodic background updates have been intentionally minimized to prioritize the stability of manual user requests.
3.  **Graceful Degradation**: If the external API reaches its limit, the application will serve the latest cached results or a friendly empty state rather than crashing.

## Installation & Setup
1.  **Clone the repository**:
    ```bash
    git clone <your-repository-url>
    cd news-aggregator-api
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Variables**:
    Create a `.env` file in the root directory:
    ```text
    PORT=3000
    JWT_SECRET=your_secure_secret_here
    ```
4.  **Start the Server**:
    ```bash
    npm start
    ```

API Endpoints
POST /register: Create a new user account (Authentication not required).

POST /login: Authenticate and receive a JWT (Authentication not required).

GET /preferences: View user news interests (Authentication required).

PUT /preferences: Update or append news interests (Authentication required).

GET /news: Fetch a personalized news feed (Authentication required).

GET /news/search/:kw: Search for news by a specific keyword (Authentication required).