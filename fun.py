from google import genai
from dotenv import load_dotenv
import os

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def my_chatbot_response(user_input):
    if "hello" in user_input.lower():
        return "Hello! How can I assist you today?"
    elif "how are you" in user_input.lower():
        return "I'm just a chatbot, but I'm here to help you!"
    elif "your name" in user_input.lower():
        return "I'm a chatbot, nice to meet you!"
    elif "bye" in user_input.lower():
        return "Goodbye! Have a great day!"
    elif "time" in user_input.lower():
        from datetime import datetime
        return f"The current time is {datetime.now().strftime('%H:%M:%S')}."
    elif "date" in user_input.lower():
        from datetime import datetime
        return f"Today's date is {datetime.now().strftime('%Y-%m-%d')}."
    elif "joke" in user_input.lower():
        return "Why don't scientists trust atoms? Because they make up everything!"
    else:
        return "I'm sorry, I don't understand that. Can you please rephrase?"
    


def gemini_chatbot_response(user_input):

    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=user_input
    )
    return response.text
    