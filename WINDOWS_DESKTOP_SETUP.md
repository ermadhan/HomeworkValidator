# Standalone Windows & Cross-Platform Runner for Homework AI

This project can be run directly inside **Google AI Studio Build** in your web browser, OR as a **Standalone Desktop Application on Windows** (and Mac/Linux) or a standalone Python script!

---

## Option 1: Standalone Python CLI / Script (Your Original Script Enhanced)

You can run the evaluation script locally on Windows with Python 3.10+:

1. **Install dependencies:**
   ```bash
   pip install google-genai pillow pydantic
   ```

2. **Set your Gemini API key in Command Prompt (CMD) or PowerShell:**
   - **Command Prompt:**
     ```cmd
     set GEMINI_API_KEY=YOUR_GEMINI_API_KEY
     ```
   - **PowerShell:**
     ```powershell
     $env:GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
     ```

3. **Run the script with your 3 documents:**
   ```bash
   python evaluate_homework.py --student "C:\Users\You\Documents\son_answers.jpg" --key "C:\Users\You\Documents\answer_key.jpg" --paper "C:\Users\You\Documents\school_worksheet.jpg"
   ```

*(See `evaluate_homework.py` included in the root directory).*

---

## Option 2: Run as a Standalone Windows Desktop App with Native Window (Electron)

If you'd like an installable `.exe` or desktop window on Windows:

1. **Prerequisites on Windows:**
   - Install [Node.js (LTS version)](https://nodejs.org/)
   - Clone or extract this repository folder to your Windows PC.

2. **Configure API Key:**
   - Copy `.env.example` to `.env` and paste your `GEMINI_API_KEY`:
     ```env
     GEMINI_API_KEY="your-gemini-api-key-here"
     ```

3. **Install & Run in Dev mode:**
   ```bash
   npm install
   npm run start
   ```
   Then open `http://localhost:3000` or run it packaged inside Electron.

4. **Package as a Windows Desktop Executable (`.exe`):**
   ```bash
   npx electron-builder --windows
   ```
   This generates an installable Windows Setup `.exe` in the `dist_electron` folder.

---

## Option 3: Use directly in Google AI Studio Web Preview (No Installation Required)

1. Open the preview URL in your browser on your Windows PC.
2. In the 3-panel upload section:
   - **Slot 1 (School Worksheet with Questions):** Upload the question worksheet or test paper sent by the school.
   - **Slot 2 (Answer Key & Rubric):** Upload the teacher's official solutions or scoring key.
   - **Slot 3 (Son's Handwritten Answer Sheet):** Upload the photo of your son's handwritten work, or use the interactive pen drawing canvas.
3. Click **"Validate & Grade Homework"**.
4. The system will:
   - Read all questions from the school worksheet.
   - Correlate each problem with the teacher's answer key.
   - Decipher your son's handwritten arithmetic and steps.
   - Highlight mistakes, award points with explanations, and generate tailored practice problems!
