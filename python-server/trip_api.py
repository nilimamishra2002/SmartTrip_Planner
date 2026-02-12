from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
from datetime import date
from langchain_core.output_parsers import JsonOutputParser

import json
import os

load_dotenv()

app = FastAPI(
    title="SmartTrip API Server",
    version="1.0",
    description="API Server of Smart Trip Planner",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

json_parser = JsonOutputParser()


# -------------------- Utils --------------------

def safe_json_parse(text: str):
    try:
        return json.loads(text)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"LLM returned invalid JSON: {e}"
        )

# -------------------- Prompt --------------------

trip_plan_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """
You are a STRICT JSON API.

Rules:
- Output ONLY valid JSON
- NO markdown
- NO explanation
- ALL fields MUST exist

JSON FORMAT (EXACT):

{{
  "origin": "string",
  "destination": "string",
  "days": number,
  "people": number,
  "journeyDate": "string",

  "itinerary": [
    {{
      "day": number,
      "activities": ["string"]
    }}
  ],

  "food": {{
    "day1": {{
      "breakfast": {{ "title": "string" }},
      "lunch": {{ "title": "string" }},
      "dinner": {{ "title": "string" }}
    }}
  }},

  "accommodation": {{
    "day1": {{
      "title": "string",
      "location": "string",
      "rating": number
    }}
  }},

  "budget": {{
    "total": number,
    "breakdown": {{
      "transportation": number,
      "food": number,
      "accommodation": number,
      "miscellaneous": number
    }}
  }},

  "checkpoints": []
}}
"""
    ),
    (
        "user",
        """
Origin: {origin}
Destination: {destination}
Days: {days}
People: {people}
Budget: {budget}
Preferences: {preferences}
Journey Date: {journeyDate}
"""
    )
])



# -------------------- LLM --------------------

llm_gpt = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.3,
    groq_api_key=os.getenv("GROQ_API_KEY"),
)

# -------------------- API --------------------

@app.post("/trip_plan/invoke")
async def generate_trip_plan(payload: dict):
    raw = None  # 🔒 critical fix

    try:
        input_data = payload.get("input", {})

        # 🔒 HARD DEFAULTS
        safe_input = {
            "origin": input_data.get("origin", "Bhubaneswar"),
            "destination": input_data.get("destination", "Puri"),
            "days": int(input_data.get("days", 3)),
            "people": int(input_data.get("people", 1)),
            "budget": int(input_data.get("budget", 5000)),
            "preferences": input_data.get("preferences", "beach"),
            "journeyDate": input_data.get(
                "journeyDate",
                date.today().isoformat()
            ),
        }

        chain = trip_plan_prompt | llm_gpt | json_parser
        data = chain.invoke(safe_input)


        # 🔒 Budget normalization
        budget = data.get("budget", {}).get("breakdown", {})
        data["budget"] = {
            "total": int(data.get("budget", {}).get("total", 0)),
            "breakdown": {
                "transportation": int(budget.get("transportation", 0)),
                "food": int(budget.get("food", 0)),
                "accommodation": int(budget.get("accommodation", 0)),
                "miscellaneous": int(budget.get("miscellaneous", 0)),
            },
        }

        return data

    except Exception as e:
        if raw:
            print("RAW LLM OUTPUT:\n", raw.content)
        raise HTTPException(status_code=500, detail=str(e))
