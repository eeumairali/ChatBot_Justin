import fun
from dotenv import load_dotenv

def main():
    while True:
        x = input("You: ")
        if x.lower() == "exit":
            print("Exiting the chatbot. Goodbye!")
            return
        response = fun.gemini_chatbot_response(x)
        print("bot: " + response)
if __name__ == "__main__":    
    load_dotenv()  # Load environment variables from .env file
    main()