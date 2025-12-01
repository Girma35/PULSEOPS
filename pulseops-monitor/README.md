# PulseOps Monitor

PulseOps is a monitoring platform built with Node.js, designed to track the uptime of your services and alert you when things go wrong.

## Core Functionality

*   **Uptime Monitoring**: Periodically checks if specified URLs are up (return 200 OK).
*   **Scheduling**: Uses a custom scheduler to run checks at defined intervals (default 60s).
*   **Alerting**: Sends notifications to **Slack** when a monitor fails (requires `SLACK_WEBHOOK_URL`).
*   **Dashboard**: Provides a web interface at `/dashboard` to view monitor status.
*   **API**: Exposes a REST API at `/api/monitors` to manage monitors.

## Tech Stack

*   **Backend**: Node.js with Express
*   **Database**: SQLite (`better-sqlite3`)
*   **Background Jobs**: `bullmq` & `ioredis` (available for advanced scheduling)

## Project Structure

*   `src/index.js`: Main entry point.
*   `src/monitors/uptime`: Uptime check logic and scheduler.
*   `src/api`: API route definitions.
*   `src/alerts`: Notification handlers (Slack).
*   `public/dashboard`: Frontend dashboard.

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the server:
    ```bash
    npm start
    ```
3.  Visit the dashboard at `http://localhost:3000/dashboard`.
