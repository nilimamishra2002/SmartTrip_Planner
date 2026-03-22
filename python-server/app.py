import os
import json
import streamlit as st
from dotenv import load_dotenv

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from text2image import generate_image


# =========================
# ENV LOAD
# =========================

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    st.error("GROQ_API_KEY not found in environment variables.")
    st.stop()


# =========================
# LLM SETUP (GROQ)
# =========================

llm = ChatGroq(
    model="llama-3.3-70b-versatile",  # Recommended Groq model
    groq_api_key=GROQ_API_KEY,
    temperature=0.7,
)


prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a master Odia folk storyteller. "
            "Write rich, emotional, culturally immersive Odia folk-style stories "
            "with moral lessons and vivid imagery."
        ),
        ("user", "Story topic: {topic}"),
    ]
)

output_parser = StrOutputParser()

chain = prompt | llm | output_parser


# =========================
# STREAMLIT UI
# =========================

st.set_page_config(page_title="Groq Storytelling App", layout="wide")

st.title("📖 Groq Odia  Storytelling App")

input_text = st.text_input("Enter Story Topic")


if input_text:
    os.makedirs("stories", exist_ok=True)

    with st.spinner("Generating story..."):
        story = chain.invoke({"topic": input_text})
        cover_image_url = generate_image(input_text)

    # Save story
    story_data = {
        "topic": input_text,
        "story": story,
        "cover_image_url": cover_image_url,
    }

    safe_filename = "".join(filter(str.isalnum, input_text)).lower()
    file_path = os.path.join("stories", f"{safe_filename}.json")

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(story_data, f, ensure_ascii=False, indent=4)

    # Display
    if cover_image_url:
        st.image(cover_image_url, use_container_width=True)

    st.markdown(story)


# =========================
# SIDEBAR - RECENT STORIES
# =========================

with st.sidebar:
    st.title("📚 Recent Stories")

    os.makedirs("stories", exist_ok=True)
    stories = os.listdir("stories")

    if not stories:
        st.info("No stories generated yet.")
    else:
        for story_file in reversed(stories):
            story_file_path = os.path.join("stories", story_file)

            try:
                with open(story_file_path, "r", encoding="utf-8") as f:
                    story_data = json.load(f)

                with st.expander(story_data["topic"].capitalize()):
                    if story_data.get("cover_image_url"):
                        st.image(
                            story_data["cover_image_url"],
                            use_container_width=True,
                        )
                    st.markdown(story_data["story"])

            except Exception:
                continue