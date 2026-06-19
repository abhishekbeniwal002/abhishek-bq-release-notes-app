# BigQuery Release Notes App

A simple Python Flask web application that fetches the latest Google BigQuery Release notes and displays them with a clean, modern aesthetic.

## Features
- Real-time fetching of BigQuery Release notes from the official RSS/Atom feed.
- Dark mode interface with a modern layout.
- One-click Share to X (Twitter) integration for specific release notes.
- Refresh functionality with dynamic loading states.

## Setup

1. Create a virtual environment and activate it:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the application:
   ```bash
   python3 app.py
   ```

The application will be available at `http://127.0.0.1:5000`.
