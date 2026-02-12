from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
from datetime import date
from langchain_core.output_parsers import JsonOutputParser

import json
import os
import random
import streamlit as st

def safe_json_parse(text: str):
    try:
        return json.loads(text)
    except Exception as e:
        st.error("LLM returned invalid JSON")
        st.subheader("Raw LLM output")
        st.code(text)
        raise e


load_dotenv()

json_parser = JsonOutputParser()


today = date.today().isoformat()

# -------------------- LLM --------------------

llm_gpt = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.3,
    groq_api_key=os.getenv("GROQ_API_KEY"),
)

# -------------------- Prompts --------------------

trip_plan_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """
You are a STRICT Indian travel plan generator API.

Rules:
- Output ONLY valid JSON
- JSON MUST be parsable by Python json.loads()
- Arrays MUST be standard JSON arrays (no numeric keys like 0:, 1:)
- Every object field MUST be separated by commas
- No markdown, no explanation
- All fields must exist
- Budget.total must equal sum of breakdown
- Locations must be in Odisha, India

JSON FORMAT:

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

  "food": [
    {{
      "day": number,
      "breakfast": "string",
      "lunch": "string",
      "dinner": "string",
      "estimated_cost": number
    }}
  ],

  "accommodation": [
    {{
      "name": "string",
      "location": "string",
      "rating": number,
      "estimated_cost_per_night": number
    }}
  ],

  "budget": {{
    "transportation": number,
    "food": number,
    "accommodation": number,
    "miscellaneous": number,
    "total": number
  }}
}}

"""
    ),
    (
        "user",
        """
Create a trip from {origin} to {destination}
for {days} days with {people} people.

Budget: {budget}
Preferences: {preferences}
Trip Type: {tripType}
Journey Date: {journeyDate}
Travel Class: {travelClass}
"""
    )
])


# -------------------- Streamlit UI --------------------

st.title("Smart Trip Planner")

query = st.text_input("Enter trip details (example: Bhubaneswar to Puri 3 days beach)")
submit = st.button("Generate Trip")

if submit and query:
    # Simple extraction (kept intentionally minimal)
    payload = {
        "origin": "Bhubaneswar",
        "destination": "Puri",
        "days": 3,
        "people": 2,
        "budget": 5000,
        "preferences": "beach",
        "tripType": "oneWay",
        "journeyDate": today,
        "travelClass": "economy",
    }

    chain = trip_plan_prompt | llm_gpt | json_parser
    trip_data = chain.invoke(payload)


    os.makedirs("trips", exist_ok=True)
    filename = f"trip_{random.randint(100,999)}.json"

    with open(f"trips/{filename}", "w", encoding="utf-8") as f:
        json.dump(trip_data, f, indent=2)

    st.success("Trip generated!")
    st.json(trip_data)
