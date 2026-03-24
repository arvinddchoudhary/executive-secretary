from groq import Groq
from dotenv import load_dotenv
from bs4 import BeautifulSoup
import os
import json

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def strip_html(html_text: str) -> str:
    soup = BeautifulSoup(html_text, "html.parser")
    return soup.get_text(separator=" ").strip()

def process_email(sender: str, subject: str, body: str) -> dict:
    clean_body = strip_html(body)

    prompt = f"""
You are an AI assistant for an executive. Analyze the following email and return a JSON object only.

Email:
Sender: {sender}
Subject: {subject}
Body: {clean_body}

Return this exact JSON structure with no extra text:
{{
  "summary": "2-3 sentence summary of the email",
  "tasks": [
    {{
      "title": "short task title",
      "description": "what needs to be done",
      "priority": "high or medium or low",
      "estimated_minutes": 30
    }}
  ]
}}

Rules:
- priority must be exactly: high, medium, or low
- estimated_minutes must be an integer
- If no tasks exist, return an empty tasks array
- Return JSON only, no markdown, no explanation
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=1000
    )

    raw = response.choices[0].message.content.strip()

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        result = json.loads(raw[start:end])

    return result