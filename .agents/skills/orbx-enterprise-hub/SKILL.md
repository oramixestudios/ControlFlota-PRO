---
name: Orbx Enterprise AI Hub
description: Framework for a floating, voice-enabled, role-based AI assistant with OCR, PDF reporting, and automated WhatsApp/Email integration.
---

# Orbx Enterprise AI Hub Master Skill

This skill documents the "Golden Architecture" for integrating advanced AI capabilities into PWAs and web applications.

## Core Pillars

### 1. Floating UI (The Orbx)
A glassmorphism-based floating action button (FAB) that expands into a central intelligence hub.
- **Component**: `.ai-hub-container`, `.orbx-btn`, `.ai-hub-panel`.
- **Logic**: Dynamic rendering based on `CURRENT_USER.role`.

### 2. Multi-Provider Voice (TTS)
Seamless switching between professional APIs and browser fallback.
- **Supported**: OpenAI (Alloy, Nova, etc.), Google Cloud TTS (Neural2), Web Speech API.
- **Resilience**: Automatic fallback to browser voice if API keys are missing or fail.

### 3. Visual Intelligence (OCR)
Direct extraction of data from images (odometers, invoices, IDs).
- **Engine**: Tesseract.js for local processing, GPT-4o-mini for high-precision vision.
- **Trigger**: `startOCR(targetId)` helper.

### 4. Communication Engine
Automatic and manual report sharing.
- **WhatsApp**: Click-to-Chat (`wa.me`) with dynamic bold formatting and Google Maps links.
- **Email**: EmailJS for serverless SMTP delivery.

### 5. Role-Based Access Control (RBAC)
- **Admin**: Full settings access, executive reports, management tools.
- **Standard User**: Support-focused assistant, technical guides, limited UI.

## File Structure Pattern
- `index.html`: Container markup and SDK injections (EmailJS, jsPDF, Tesseract).
- `app.js`: Master `AI` object and logic handlers.
- `localStorage`: Persistence for API keys and communication preferences.

## Application to `bot_contable`
- **OCR**: Scan invoices/CFDI instead of odometers.
- **Reports**: Generate Monthly Tax Summaries instead of Fleet Status.
- **WA**: Send payment reminders to clients.

---
*Created during Control Flota PRO evolution - February 2026*
