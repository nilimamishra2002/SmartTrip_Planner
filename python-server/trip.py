from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser


import streamlit as st
from dotenv import load_dotenv
import json
import os
import random
load_dotenv()

from fastapi import HTTPException
import json


def safe_json_parse(text: str):
    try:
        return json.loads(text)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"LLM returned invalid JSON: {e}"
        )


## Prompt Template
trip_plan_prompt = ChatPromptTemplate.from_messages(
[
(
"system",
"""
You are a STRICT Indian travel plan generator API.

CRITICAL RULES:
# - Output ONLY valid JSON
- Return valid JSON.
- Strings OR numbers allowed.
- No markdown, no explanations
- Do NOT omit any fields
- All numeric values must be numbers
- Budget.total MUST equal sum of breakdown
- All places MUST be in Odisha, India (prefer Puri, Konark, Chilika, Koraput)

OUTPUT SCHEMA (MUST MATCH EXACTLY):

{
#   "trip_name": string,
  "origin": string,
  "destination": string,
  "days": number,
  "people": number,
  "journeyDate": string,

  "itinerary": [
    {
      "day": number,
      "activities": string[]
    }
  ],

  "food": [
    {
      "day": number,
      "breakfast": string,
      "lunch": string,
      "dinner": string,
      "estimated_cost": number
    }
  ],

  "accommodation": [
    {
      "name": string,
      "location": string,
      "rating": number,
      "estimated_cost_per_night": number
    }
  ],

  "budget": {
    "transportation": number,
    "food": number,
    "accommodation": number,
    "miscellaneous": number,
    "total": number
  }
}
"""
),
(
"user",
"""
Create an Indian trip plan from {origin} to {destination}
for {days} days with {people} people.

Budget: {budget} INR
Preferences: {preferences}
Trip Type: {tripType}
Journey Date: {journeyDate}
Travel Class: {travelClass}

Ensure:
- Every day has breakfast, lunch, and dinner
- Budget total must match sum of breakdown
- Locations should be Odisha, India focused if applicable
"""
)

]
)


# groq LLm 
llm_gpt= ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.7,
    groq_api_key=os.getenv("GROQ_API_KEY")
)

output_parser=StrOutputParser()
chain = trip_plan_prompt | llm_gpt | output_parser



## streamlit framework

st.title('Easy Trip Planner')
origin=st.text_input("Origin")
destination=st.text_input("Destination")
days=st.number_input("Days",min_value=1)
max_budget=st.number_input("Max Budget",min_value=1000)
people=st.number_input("People",min_value=1)
preferences=st.text_input("Preferences")
submit=st.button("Submit")

if origin and destination and days and max_budget and people and preferences and submit:
    # Ensure the trips directory exists
    os.makedirs('trips', exist_ok=True)

    # Generate the story
    trip_plan = chain.invoke({'origin':origin,'destination':destination,'days':days,'max budget':max_budget,'people':people,'preferences':preferences})
    # cover_image_url = generate_image(input_text)

    # Save the story to a JSON file
    trip_data = trip_plan
    try:
        trip_name = trip_data['trip_name']
    except:
        trip_name = f"{origin} to {destination} {days} days trip with {people} people to enjoy the {preferences}"
    trip_name = trip_name.replace(' ', '_')

    random_number = random.randint(1, 1000)
    file_path = os.path.join('trips', f"{trip_name}_{random_number}.json")
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(trip_data, f, ensure_ascii=False, indent=4)

    # show the cover image
    # if cover_image_url:
    #     st.image(cover_image_url, use_column_width=True)
    # Display the story
    st.write(trip_plan)


# in the sidebar load all the stories
with st.sidebar:
    st.title('Recent Trips')
    trips = os.listdir('trips')
    for trip_file in trips:
        trip_file_path = os.path.join('trips', trip_file)
        with open(trip_file_path, 'r', encoding='utf-8') as f:
            trip_data = json.load(f)
            with st.expander(f"{trip_file.replace('_', ' ').replace('.json', '').capitalize()}"):
                st.write(trip_data)
