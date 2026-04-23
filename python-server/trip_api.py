import re

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from dotenv import load_dotenv
from datetime import date
import json
import os

load_dotenv()

# =====================================================
# FastAPI App
# =====================================================

app = FastAPI(
    title="SmartTrip API Server",
    version="3.0",
    description="Production API for Smart Trip Planner",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import requests

def get_coordinates(place):
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": f"{place}, Odisha, India",  # 🔥 bias to India
            "format": "json",
            "limit": 1
        }

        headers = {
            "User-Agent": "smart-trip-planner"
        }

        res = requests.get(url, params=params, headers=headers, timeout=5)
        data = res.json()

        if data:
            lat = float(data[0]["lat"])
            lon = float(data[0]["lon"])

            # 🚨 Validate coordinates (avoid Africa bug)
            if lat == 0 or lon == 0:
                return None, None

            return lat, lon

    except Exception as e:
        print("Geocoding error:", e)

    return None, None  # ✅ IMPORTANT CHANGE

# =====================================================
# LLM Configuration
# =====================================================

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.4,
    groq_api_key=os.getenv("GROQ_API_KEY"),
)

json_parser = JsonOutputParser()

# =====================================================
# STRICT PRODUCTION PROMPT (ESCAPED BRACES)
# =====================================================

trip_plan_prompt = ChatPromptTemplate.from_messages([
(
"system",
"""
You are SmartTripPlanner Production Engine.

Return ONLY valid JSON.

========================
HARD CONSTRAINTS (STRICT)
========================

1. Origin is ONLY the starting point. Do NOT generate activities there.

2. Day 1 MUST be:
   - Travel from origin to destination
   - Hotel check-in
   - At most ONE light nearby activity

3. After reaching destination:
   - ALL remaining days MUST be within the SAME destination city

4. STRICT: Do NOT switch cities after arrival.

5. STRICT: Use ONLY ONE accommodation for the entire trip.

6. STRICT: Do NOT repeat any activity across days.

7. STRICT: Do NOT use generic names like:
   "Local Restaurant", "Hotel Food", "City Temple"

========================
EXPERIENCE DESIGN
========================

8. Day structure:
   - Day 1 → travel + light
   - Day 2 → major attractions
   - Day 3 → cultural / local
   - Day 4+ → relaxed / optional

9. Each day (except Day 1) must include:
   - 3 realistic unique activities
   - Ordered logically

========================
REALISM
========================

10. Activities must be:
   - famous
   - geographically accurate
   - non-repetitive

11. Restaurants must:
   - be unique per day
   - reflect local cuisine
   - be realistic

========================
STAY + BUDGET
========================

12. Hotel must match travelClass:
   - economy → budget
   - business → 3–4 star
   - first → premium

13. Budget must scale realistically.

========================
FINAL RULE
========================

If ANY rule is violated, regenerate internally before responding.

CRITICAL VALIDATION:

Before returning the final JSON, verify:

1. Day 1 contains ONLY travel + at most 1 activity
2. All activities after Day 1 are ONLY in destination city
3. STRICT- No activity is repeated across days
4. All activity names are real and specific (no generic names)
5. Restaurants are not repeated across days

If ANY of the above conditions fail:
→ Regenerate the entire itinerary internally
→ Do NOT return invalid output

PUBLIC AMENITIES REQUIREMENTS:

For each destination city, implicitly consider:
- Nearby police station
- Nearby hospital
- Nearby bus stand or railway station
- Tourist help center
- Fuel station
These must influence logistics tips (but do NOT add new JSON keys).

DISTANCE & TRAVEL TIME:

- Estimate approximate road distance between origin and destination.
- Estimate travel time realistically (in hours).
- Include travel time inside checkpoints.logistics.tips.

BUDGET RULES:

- Budget.total MUST equal sum of breakdown.
- Transportation cost should reflect km distance.
- Accommodation cost should reflect hotel category.
- Food cost should reflect number of people × days.
- Miscellaneous should cover entry tickets + parking + local transport.

JSON STRUCTURE MUST MATCH EXACTLY:

{{
  "origin": string,
  "destination": string,
  "days": number,
  "people": number,
  "journeyDate": string,

  "budget": {{
    "total": number,
    "breakdown": {{
      "transportation": number,
      "food": number,
      "accommodation": number,
      "miscellaneous": number
    }}
  }},

  "food": {{
    "day1": {{
      "breakfast": {{
        "title": string,
        "address": string,
        "rating": number,
        "category": string,
        "phoneNumber": string,
        "website": string
      }},
      "lunch": {{
        "title": string,
        "address": string,
        "rating": number,
        "category": string,
        "phoneNumber": string,
        "website": string
      }},
      "dinner": {{
        "title": string,
        "address": string,
        "rating": number,
        "category": string,
        "phoneNumber": string,
        "website": string
      }}
    }}
  }},

  "accommodation": {{
    "day1": {{
      "title": string,
      "address": string,
      "rating": number,
      "category": string,
      "phoneNumber": string,
      "website": string,
      "amenities": string
    }}
  }},

  "itinerary": [
    {{
      "day": number,
      "activities": [string, string, string]
    }}
  ],

  "checkpoints": [
    {{
      "origin": {{
        "location": string,
        "lat": number,
        "lng": number
      }},
      "destination": {{
        "location": string,
        "lat": number,
        "lng": number
      }},
      "logistics": {{
        "departure_time": string,
        "arrival_time": string,
        "tips": string
      }}
    }}
  ]
}}

Generate dynamic day keys (day1, day2, day3...) based on number of days.
Budget.total MUST equal sum of breakdown.
"""
),
(
"user",
"""
Generate a trip plan for:

Origin: {origin}
Destination: {destination}
Days: {days}
People: {people}
Budget: {budget}
Preferences: {preferences}
Trip Type: {tripType}
Journey Date: {journeyDate}
Travel Class: {travelClass}
"""
)
])

# =====================================================
# API ENDPOINT
# =====================================================

@app.post("/trip_plan/invoke")
async def generate_trip_plan(payload: dict):

    try:
        input_data = payload.get("input", {})
        

        # Safe Inputs (frontend aligned)
        raw_budget = input_data.get("budget", 5000)

        if isinstance(raw_budget, dict):
           safe_budget = int(raw_budget.get("total", 5000))
        else:
           safe_budget = int(raw_budget)

        safe_input = {
    "origin": input_data.get("origin") or "Bhubaneswar",
    "destination": input_data.get("destination") or "Puri",
    "days": int(input_data.get("days", 3)),
    "people": int(input_data.get("people", 1)),
    "budget": safe_budget,
    "preferences": input_data.get("preferences", "beach"),
    "journeyDate": input_data.get("journeyDate") or date.today().isoformat(),
    "tripType": input_data.get("tripType", "oneWay"),
    "travelClass": input_data.get("travelClass", "economy"),
}

        chain = trip_plan_prompt | llm | json_parser
        data = chain.invoke(safe_input)

        origin_lat, origin_lng = get_coordinates(safe_input["origin"])
        dest_lat, dest_lng = get_coordinates(safe_input["destination"])

        # Override checkpoints with REAL data
        data["checkpoints"] = [
       {
        "origin": {
            "location": safe_input["origin"],
            "lat": origin_lat,
            "lng": origin_lng
        },
        "destination": {
            "location": safe_input["destination"],
            "lat": dest_lat,
            "lng": dest_lng
        },
        "logistics": {
            "departure_time": "08:00 AM",
            "arrival_time": "02:00 PM",
            "tips": "Route optimized based on real location data"
        }
    }
]

        # =====================================================
        # HARD SAFETY VALIDATION
        # =====================================================

        if not isinstance(data.get("budget"), dict):
            raise HTTPException(status_code=500, detail="Invalid budget structure")

        breakdown = data["budget"].get("breakdown", {})

        data["budget"] = {
            "total": int(data["budget"].get("total", 0)),
            "breakdown": {
                "transportation": int(breakdown.get("transportation", 0)),
                "food": int(breakdown.get("food", 0)),
                "accommodation": int(breakdown.get("accommodation", 0)),
                "miscellaneous": int(breakdown.get("miscellaneous", 0)),
            },
        }

        # Normalize ratings
        for hotel in data.get("accommodation", {}).values():
            hotel["rating"] = float(hotel.get("rating", 0))

        for meals in data.get("food", {}).values():
            for meal in meals.values():
                meal["rating"] = float(meal.get("rating", 0))

        # Normalize coordinates
        for cp in data.get("checkpoints", []):
            cp["origin"]["lat"] = float(cp["origin"].get("lat", 0))
            cp["origin"]["lng"] = float(cp["origin"].get("lng", 0))
            cp["destination"]["lat"] = float(cp["destination"].get("lat", 0))
            cp["destination"]["lng"] = float(cp["destination"].get("lng", 0))

        return data

    except Exception as e:
        print("🚨 API ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
    


@app.post("/blog/invoke")
async def generate_blog(payload: dict):
    try:
        input_data = payload.get("input", {})

        name = input_data.get("name", "Traveler")
        query = input_data.get("query", "")
        trip_data = input_data.get("tripData", {})
        members = input_data.get("members", [])

        # ===============================
        # CLEAN & REDUCE INPUT
        # ===============================

        origin = trip_data.get("origin", "Unknown")
        destination = trip_data.get("destination", "Unknown")
        days = trip_data.get("days", "")
        people = trip_data.get("people", "")

        member_names = [m.get("email", "Friend") for m in members]

        # ===============================
        # CINEMATIC PROMPT
        # ===============================

        blog_prompt = f"""
You are an elite travel storyteller.

Write a cinematic travel blog.

FOCUS STRICTLY ON:
{query}

Trip:
From {origin} to {destination}
Duration: {days} days
People: {people}

RULES:
- Do NOT write anything before or after JSON
- Do NOT add headings outside JSON
- Do NOT explain anything
- Output MUST start with {{ and end with }}

OUTPUT FORMAT:
{{
  "title": "string",
  "content": "string"
}}
"""

        # ===============================
        # LLM CALL
        # ===============================

        response = llm.invoke(blog_prompt)
        raw_content = response.content.strip()

        print("🔍 RAW:", raw_content)

        # ===============================
        # SAFE JSON EXTRACTION
        # ===============================

        match = re.search(r"\{.*\}", raw_content, re.DOTALL)

        if match:
            raw_content = match.group(0)
        else:
            raise HTTPException(status_code=500, detail="No JSON found")

        # ===============================
        # CLEAN INVALID CHARACTERS
        # ===============================

        clean_json = raw_content.replace("\n", " ").replace("\r", " ").replace("\t", " ")
        clean_json = re.sub(r"\s+", " ", clean_json)

        # ===============================
        # PARSE JSON SAFELY
        # ===============================

        try:
            result = json.loads(clean_json)
        except Exception as e:
            print("🚨 JSON PARSE ERROR:", str(e))

            # 🔥 FALLBACK BLOG (VERY IMPORTANT)
            return {
                "title": "My Travel Experience",
                "content": "It was a wonderful journey filled with memorable experiences and beautiful moments."
            }

        # ===============================
        # VALIDATION
        # ===============================

        if not isinstance(result.get("content"), str):
            raise HTTPException(
                status_code=500,
                detail="Invalid blog content format",
            )

        if len(result["content"]) < 50:
            raise HTTPException(
                status_code=500,
                detail="Blog too short or invalid",
            )

        # ===============================
        # FINAL SAFE OUTPUT
        # ===============================

        safe_content = re.sub(r"[\n\r\t]+", " ", result.get("content", ""))

        return {
            "title": result.get("title", "Travel Story"),
            "content": safe_content
        }

    except Exception as e:
        print("🚨 BLOG ERROR:", str(e))

        # 🔥 FINAL FALLBACK (never crash frontend)
        return {
            "title": "Travel Story",
            "content": "An amazing journey filled with unforgettable memories."
        }


@app.post("/vlog/invoke")
async def generate_vlog(payload: dict):
    try:
        input_data = payload.get("input", {})

        query = input_data.get("query", "")
        trip_data = input_data.get("tripData", {})
        members = input_data.get("members", [])
        images = input_data.get("images", [])

        # 🔥 SAFETY: no images
        if not images:
            return {
                "success": True,
                "title": "Travel Vlog",
                "scenes": []
            }

        member_names = ", ".join([m.get("name", "") for m in members])

        vlog_prompt = f"""
You are an expert cinematic travel vlogger.

Return ONLY valid JSON.

Format:
{{
  "title": string,
  "scenes": [
    {{
      "image_index": number,
      "voiceover": string
    }}
  ]
}}

STRICT:
- Exactly {len(images)} scenes
- Each voiceover < 40 words
- Natural storytelling, first-person
- No markdown, no explanation

IMPORTANT:
Images may be random or unrelated.

- Do NOT assume location accuracy
- Use neutral storytelling if unsure
- Focus on emotion and vibe, not facts
- Adapt narration to image mood

Trip:
{json.dumps(trip_data)}

Members:
{member_names}

Intent:
{query if query else "Travel experience"}
"""

        # 🔥 CALL LLM
        response = llm.invoke(vlog_prompt)
        raw = response.content.strip()

        print("🧠 RAW LLM OUTPUT:", raw)  # ✅ DEBUG

        # 🔥 CLEAN RESPONSE
        if raw.startswith("```"):
            raw = raw.replace("```json", "").replace("```", "").strip()

        # 🔥 SAFE JSON PARSE
        try:
            result = json.loads(raw)
        except Exception as parse_error:
            print("❌ JSON PARSE ERROR:", parse_error)

            # 🔥 FALLBACK if parsing fails
            scenes = [
                {
                    "image": img,
                    "voiceover": f"A beautiful moment from our journey."
                }
                for img in images
            ]

            return {
                "success": True,
                "title": "Travel Vlog",
                "scenes": scenes
            }

        # 🔥 BUILD FINAL SCENES
        scenes = []
        for i, scene in enumerate(result.get("scenes", [])):
            img = images[i] if i < len(images) else None
            scenes.append({
                "image": img,
                "voiceover": scene.get("voiceover", "A travel moment")
            })

        return {
            "success": True,
            "title": result.get("title", "Travel Vlog"),
            "scenes": scenes
        }

    except Exception as e:
        print("🚨 VLOG ERROR:", str(e))  # ✅ VERY IMPORTANT
        raise HTTPException(status_code=500, detail=str(e))