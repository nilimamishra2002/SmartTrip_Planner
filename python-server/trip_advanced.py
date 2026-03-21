from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv
from datetime import date

import json
import os
import random
import streamlit as st

load_dotenv()

today = date.today().isoformat()

# =====================================================
# LLM CONFIGURATION
# =====================================================

llm_gpt = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.5,
    groq_api_key=os.getenv("GROQ_API_KEY"),
)

output_parser = StrOutputParser()

# =====================================================
# PROMPT TEMPLATE (ADVANCED STRICT)
# =====================================================

trip_plan_prompt = ChatPromptTemplate.from_messages([
(
"system",
"""
You are SmartTripPlanner Advanced Generator.

RULES:

- Return ONLY valid JSON.
- No markdown.
- No explanation.
- All required fields must exist.
- Numeric fields must be numbers.
- Budget.total must equal sum of breakdown.
- Generate dynamic day keys: day1, day2, day3 based on input "days".
- Each day must include breakfast, lunch, and dinner.
- Each day must include accommodation.
- Each day must include at least 2 activities.
- Ratings must be realistic (3.0 to 5.0).
- Avoid empty arrays and empty strings.
- Ensure geographic coherence.

Return ONLY the JSON object.
"""
),
(
"user",
"""
Generate a trip plan with:

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

chain = trip_plan_prompt | llm_gpt | output_parser

# =====================================================
# SAFE JSON PARSER
# =====================================================

def safe_json_parse(text: str):
    try:
        return json.loads(text)
    except Exception as e:
        st.error("❌ LLM returned invalid JSON.")
        st.subheader("Raw LLM Output")
        st.code(text)
        raise e

# =====================================================
# STREAMLIT UI
# =====================================================

st.title("🚀 Smart Trip Planner (Advanced)")

origin = st.text_input("Origin")
destination = st.text_input("Destination")
days = st.number_input("Days", min_value=1, value=3)
budget = st.number_input("Budget (INR)", min_value=1000, value=6000)
people = st.number_input("People", min_value=1, value=2)
preferences = st.text_input("Preferences (beach, temple, nature, etc)")
submit = st.button("Generate Trip")

if submit:

    if not all([origin, destination, preferences]):
        st.warning("Please fill all required fields.")
        st.stop()

    payload = {
        "origin": origin,
        "destination": destination,
        "days": int(days),
        "people": int(people),
        "budget": int(budget),
        "preferences": preferences,
        "journeyDate": today,
    }

    try:
        raw_output = chain.invoke(payload)

        st.subheader("🔍 Raw LLM Output (Debug)")
        st.code(raw_output)

        trip_data = safe_json_parse(raw_output)

    except Exception:
        st.stop()

    # =====================================================
    # SAFE NORMALIZATION
    # =====================================================

    breakdown = trip_data.get("budget", {}).get("breakdown", {})

    trip_data["budget"] = {
        "total": int(trip_data.get("budget", {}).get("total", 0)),
        "breakdown": {
            "transportation": int(breakdown.get("transportation", 0)),
            "food": int(breakdown.get("food", 0)),
            "accommodation": int(breakdown.get("accommodation", 0)),
            "miscellaneous": int(breakdown.get("miscellaneous", 0)),
        },
    }

    for hotel in trip_data.get("accommodation", {}).values():
        hotel["rating"] = float(hotel.get("rating", 0))

    for meals in trip_data.get("food", {}).values():
        for meal in meals.values():
            meal["rating"] = float(meal.get("rating", 0))

    for cp in trip_data.get("checkpoints", []):
        cp["origin"]["lat"] = float(cp["origin"].get("lat", 0))
        cp["origin"]["lng"] = float(cp["origin"].get("lng", 0))
        cp["destination"]["lat"] = float(cp["destination"].get("lat", 0))
        cp["destination"]["lng"] = float(cp["destination"].get("lng", 0))

    # =====================================================
    # SAVE GENERATED TRIP
    # =====================================================

    os.makedirs("trips", exist_ok=True)

    filename = f"trip_advanced_{random.randint(100,999)}.json"
    filepath = os.path.join("trips", filename)

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(trip_data, f, indent=4)

    st.success("✅ Trip Generated Successfully!")
    st.json(trip_data)

# =====================================================
# SIDEBAR: RECENT TRIPS
# =====================================================

with st.sidebar:
    st.title("📁 Saved Trips")

    os.makedirs("trips", exist_ok=True)
    trips = os.listdir("trips")

    for trip_file in trips:
        path = os.path.join("trips", trip_file)

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        with st.expander(trip_file.replace("_", " ").replace(".json", "")):
            st.json(data)