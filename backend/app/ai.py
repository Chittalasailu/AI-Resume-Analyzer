import logging
import os
from typing import Optional

from google import genai
from google.genai import types
from google.genai.errors import APIError
from pydantic import BaseModel, Field, ValidationError

logger = logging.getLogger("resume_analyzer")

MODEL_NAME = "gemini-3.6-flash"
MAX_RESUME_CHARS = 12000


class AnalysisError(Exception):
    """Raised when the resume analysis request cannot be completed."""


class EmptyResumeTextError(AnalysisError):
    """Raised when the uploaded file has no extractable text to analyze."""


class ResumeAnalysis(BaseModel):
    ats_score: int = Field(ge=0, le=100)
    skills: list[str]
    strengths: list[str]
    improvements: list[str]
    summary: str


_client: Optional[genai.Client] = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise AnalysisError("GEMINI_API_KEY is not configured on the server.")
        _client = genai.Client(api_key=api_key)
    return _client


PROMPT_TEMPLATE = """You are an expert technical recruiter and ATS (Applicant Tracking System) reviewer.

Analyze the resume text below and return a structured, personalized assessment based
strictly on its actual content. Do not invent skills, experience, or details that are
not present in the text. If the resume is short, generic, or unclear, reflect that
honestly with a lower ats_score and specific improvements, rather than inventing detail.

Resume text:
---
{resume_text}
---

Return:
- ats_score: integer 0-100 estimating how well this resume would pass an automated ATS
  keyword/format screen for a role matching its content.
- skills: up to 10 concrete technical skills, tools, or languages actually mentioned.
- strengths: 2-4 genuine strengths evident from this specific resume.
- improvements: 2-4 specific, actionable suggestions to improve this exact resume.
- summary: a 1-2 sentence summary of this candidate's profile based on the resume.
"""


def analyze_resume(resume_text: str) -> dict:
    text = (resume_text or "").strip()
    if not text:
        raise EmptyResumeTextError("The uploaded file contained no readable text to analyze.")

    client = _get_client()
    prompt = PROMPT_TEMPLATE.format(resume_text=text[:MAX_RESUME_CHARS])

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ResumeAnalysis,
                temperature=0.4,
            ),
        )
    except APIError as exc:
        logger.exception("Gemini API error during resume analysis")
        raise AnalysisError(
            "The AI analysis service is temporarily unavailable. Please try again shortly."
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error calling Gemini")
        raise AnalysisError(
            "The AI analysis service is temporarily unavailable. Please try again shortly."
        ) from exc

    parsed = response.parsed
    if parsed is None:
        try:
            parsed = ResumeAnalysis.model_validate_json(response.text)
        except (ValidationError, ValueError, TypeError) as exc:
            logger.exception("Gemini returned an unparseable response: %r", getattr(response, "text", None))
            raise AnalysisError(
                "The AI analysis service returned an unexpected response. Please try again."
            ) from exc

    return {
        "ats_score": max(0, min(100, parsed.ats_score)),
        "skills": parsed.skills[:10],
        "strengths": parsed.strengths[:5],
        "improvements": parsed.improvements[:5],
        "summary": parsed.summary.strip(),
    }
