#!/usr/bin/env python3
"""
Homework AI - Handwritten Homework Validator & Grader (Standalone Windows/CLI Tool)
Evaluates student's handwritten homework scans/PDFs against the school worksheet and answer key using Gemini Vision.
Supports multiple files/pages, PDF documents, and evaluation annotations (Subject, Chapter, Description, Date).
Updated for gemini-3.8-flash and CBSE Class 4.
"""

import os
import json
import argparse
from datetime import date as dt_date
from typing import List, Optional
from PIL import Image
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

# Structured Output Schemas matching web and Python interface
class QuestionEvaluation(BaseModel):
    question_number: str = Field(description="Question number or identifier, e.g., '1', '2a', 'Q3'")
    question_text: str = Field(description="The statement or math problem from the worksheet")
    reference_answer: str = Field(description="Correct answer from the answer key")
    student_answer: str = Field(description="Transcribed answer from student's handwritten sheet")
    is_correct: bool = Field(description="True if student answer is correct/semantically equivalent")
    points_awarded: float = Field(description="Points granted for this response")
    max_points: float = Field(description="Maximum possible points for this question")
    feedback: str = Field(description="Brief explanation of correctness or hints on mistakes and step-by-step guidance")
    student_work_analysis: Optional[str] = Field(default=None, description="Pedagogical insight into the student handwritten steps or method used")

class HomeworkEvaluationReport(BaseModel):
    subject: Optional[str] = Field(default=None, description="Subject of the homework evaluation")
    chapter: Optional[str] = Field(default=None, description="Chapter or unit being evaluated")
    description: Optional[str] = Field(default=None, description="Description or assignment note")
    date: Optional[str] = Field(default=None, description="Date of evaluation")
    total_score: float = Field(description="Total points scored by the student")
    max_total_score: float = Field(description="Total possible points")
    percentage: float = Field(description="Overall percentage grade")
    summary_notes: str = Field(description="High-level feedback for parents highlighting areas to review")
    strengths: Optional[List[str]] = Field(default=[], description="Key skills or topics the student executed well")
    areas_for_growth: Optional[List[str]] = Field(default=[], description="Specific topics or concepts needing revision")
    handwriting_legibility: Optional[str] = Field(default="Clear and readable", description="Assessment of student's handwriting clarity")
    evaluations: List[QuestionEvaluation] = Field(description="Itemized breakdown of each question")

def load_file_content(client: genai.Client, file_path: str):
    """Loads an image or uploads a PDF using the Files API."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        # Upload PDF via genai client files API
        return client.files.upload(file=file_path)
    else:
        return Image.open(file_path)

def evaluate_homework(
    student_sheet_paths: List[str],
    answer_key_paths: List[str],
    question_paper_paths: Optional[List[str]] = None,
    subject: str = "Mathematics (Math-Magic)",
    chapter: str = "",
    description: str = "",
    eval_date: str = "",
    api_key: Optional[str] = None,
    model_name: str = "gemini-3.1-flash-lite"
) -> HomeworkEvaluationReport:
    """Evaluates student's handwritten homework scans/PDFs against answer key and worksheet using Gemini Vision."""
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        raise ValueError("GEMINI_API_KEY environment variable is not set. Please set it or pass --api-key.")

    client = genai.Client(api_key=key)

    contents: list = [
        "You are an expert primary school tutor in India evaluating a Grade 4 (Class 4) student's handwritten homework following the CBSE (NCERT) curriculum.",
        f"Worksheet Subject: {subject}.",
        f"Chapter / Unit: {chapter}." if chapter else "",
        f"Assignment Description: {description}." if description else "",
        f"Evaluation Date: {eval_date}." if eval_date else "",
        "Follow these CBSE primary education evaluation principles with meticulous care:",
        "1. Read all questions from the school question worksheet(s) or answer key(s).",
        "2. Carefully decipher the handwritten responses and calculations from the student's completed sheet(s) across all pages.",
        "3. CBSE Class 4 Step Marking:",
        "   - Recognize Indian currency symbols (₹ or Rs.) and numbering systems (thousands/lakhs).",
        "   - Award step marks: statement step + working calculation + final answer with units (₹, cm, m, km, kg, g, l, ml).",
        "   - In EVS and English, reward conceptual understanding; be gentle with minor spelling slips.",
        "4. Calculate total score and provide helpful, encouraging feedback for each question in a warm, motivating tone suitable for a 9-year-old child.",
        "5. Provide actionable summary notes for the parents highlighting what CBSE Class 4 concepts need practice at home.",
    ]
    # Filter empty lines
    contents = [c for c in contents if c]

    if question_paper_paths:
        contents.append("DOCUMENT SET 1: SCHOOL WORKSHEET (Question Statements & Diagrams):")
        for p in question_paper_paths:
            contents.append(load_file_content(client, p))

    contents.append("DOCUMENT SET 2: TEACHER ANSWER KEY & RUBRIC:")
    for p in answer_key_paths:
        contents.append(load_file_content(client, p))

    contents.append("DOCUMENT SET 3: STUDENT COMPLETED HANDWRITTEN ANSWER SHEETS (Pages):")
    for p in student_sheet_paths:
        contents.append(load_file_content(client, p))

    candidate_models = [
        model_name,
        "gemini-3.1-flash-lite",
        "gemini-flash-latest",
        "gemini-3.8-flash"
    ]
    # deduplicate while preserving order
    candidate_models = list(dict.fromkeys(candidate_models))

    response = None
    last_err = None
    for target_model in candidate_models:
        try:
            response = client.models.generate_content(
                model=target_model,
                contents=contents,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=HomeworkEvaluationReport,
                    temperature=0.1
                )
            )
            if response and response.text:
                break
        except Exception as e:
            last_err = e
            print(f"[!] Model {target_model} failed or exceeded quota: {e}. Trying fallback model...")

    if not response or not response.text:
        raise last_err or RuntimeError("All model candidates failed.")

    report_dict = json.loads(response.text)
    report_dict["subject"] = subject or report_dict.get("subject")
    report_dict["chapter"] = chapter or report_dict.get("chapter")
    report_dict["description"] = description or report_dict.get("description")
    report_dict["date"] = eval_date or report_dict.get("date") or str(dt_date.today())

    return HomeworkEvaluationReport(**report_dict)

def print_summary(report: HomeworkEvaluationReport):
    print("\n" + "="*60)
    print("           HOMEWORK VALIDATION & GRADING REPORT           ")
    print("="*60)
    print(f"Subject       : {report.subject or 'Not specified'}")
    if report.chapter:
        print(f"Chapter / Unit: {report.chapter}")
    if report.description:
        print(f"Description   : {report.description}")
    print(f"Date          : {report.date or str(dt_date.today())}")
    print("-" * 60)
    print(f"Overall Score : {report.total_score} / {report.max_total_score} ({report.percentage:.1f}%)")
    print(f"Legibility    : {report.handwriting_legibility or 'Clear'}")
    print(f"\nParent Summary: {report.summary_notes}")
    
    if report.strengths:
        print("\n[+] Strengths: " + ", ".join(report.strengths))
    if report.areas_for_growth:
        print("[-] Needs Review: " + ", ".join(report.areas_for_growth))

    print("\n" + "-"*60)
    print("ITEMIZED QUESTION BREAKDOWN:")
    print("-"*60)
    
    for item in report.evaluations:
        status = "✅ CORRECT" if item.is_correct else "❌ INCORRECT"
        print(f"[{item.question_number}] {status} ({item.points_awarded}/{item.max_points} pts)")
        print(f"    Worksheet Question: {item.question_text}")
        print(f"    Expected Answer   : {item.reference_answer}")
        print(f"    Son's Handwriting : {item.student_answer}")
        if item.feedback:
            print(f"    Tutor Guidance    : {item.feedback}")
        if item.student_work_analysis:
            print(f"    Working Analysis  : {item.student_work_analysis}")
        print("-" * 60)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate handwritten student homework against school worksheet and answer key.")
    parser.add_argument("--student", nargs="+", required=True, help="One or more paths to scanned student answer sheets or PDF (e.g. your son's handwritten answers)")
    parser.add_argument("--key", nargs="+", required=True, help="One or more paths to answer key image(s) or PDF with expected solutions")
    parser.add_argument("--paper", nargs="*", required=False, help="Optional path(s) to blank school question worksheet image(s) or PDF")
    parser.add_argument("--subject", default="Mathematics (Math-Magic)", help="Subject annotation (e.g. 'Mathematics (Math-Magic)', 'EVS')")
    parser.add_argument("--chapter", default="", help="Chapter or topic annotation (e.g. 'Chapter 4: The Junk Seller')")
    parser.add_argument("--description", default="", help="Description or notes of the worksheet")
    parser.add_argument("--date", default="", help="Evaluation date (YYYY-MM-DD), defaults to today")
    parser.add_argument("--api-key", required=False, help="Gemini API Key (optional, defaults to GEMINI_API_KEY env var)")
    parser.add_argument("--model", default="gemini-3.1-flash-lite", help="Gemini model to use (default: gemini-3.1-flash-lite, lower quota usage)")
    parser.add_argument("--json-out", required=False, help="Optional path to save report JSON")

    args = parser.parse_args()
    try:
        report = evaluate_homework(
            args.student,
            args.key,
            args.paper,
            args.subject,
            args.chapter,
            args.description,
            args.date,
            args.api_key,
            args.model
        )
        print_summary(report)
        if args.json_out:
            with open(args.json_out, "w", encoding="utf-8") as f:
                f.write(report.model_dump_json(indent=2))
            print(f"\n[✓] Saved complete JSON report to: {args.json_out}")
    except Exception as e:
        print(f"\n[!] Error during evaluation: {e}")
