import os
import json # Used for loading and dumping JSON
import glob # Used for finding your .json files
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# --- Configuration ---
load_dotenv()
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# --- 1. Load All JSON Files on Startup ---
def load_json_data(data_directory="data"):
    """
    Finds all .json files in the specified directory,
    loads them, and returns them as a single JSON string.
    """
    all_data = []
    # Use glob to find all files ending in .json in the /data/ folder
    json_files = glob.glob(os.path.join(data_directory, "*.json"))
    
    if not json_files:
        print(f"Warning: No .json files found in '{data_directory}' directory.")
        return "{}" # Return empty JSON object as a string
        
    print(f"Loading files: {json_files}")
    
    for file_path in json_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                all_data.append(data)
        except Exception as e:
            print(f"Error loading {file_path}: {e}")
            
    # Convert the combined list of Python objects into a single JSON string
    # 'indent=2' makes it nicely formatted, which can help the model read it.
    return json.dumps(all_data, indent=2)

# Load the data when the server starts and store it in a variable
YOUR_PROJECT_DATA = load_json_data()

# --- Initialize Gemini ---
try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel('gemini-2.5-flash')
except Exception as e:
    print(f"Error configuring Gemini: {e}")
    model = None

# --- API Endpoint ---
@app.route('/api/ask', methods=['POST'])
def ask_gemini():
    if model is None:
        return jsonify({"error": "Gemini model not initialized"}), 500

    try:
        data = request.get_json()
        question = data.get('question')

        if not question:
            return jsonify({"error": "Question is required"}), 400

        # --- 2. Updated & Stricter RAG Prompt ---
        prompt = f"""
        You are a helpful assistant. Your knowledge is strictly limited 
        to the following JSON data. You must answer the user's question 
        based *only* on this data. 
        
        If the answer is not contained within this JSON, you MUST 
        say "I do not have that information." 
        
        Do not use any external knowledge.

        JSON Data:
        ---
        {YOUR_PROJECT_DATA}
        ---

        Question: {question}
        """

        # --- Send to Gemini ---
        response = model.generate_content(prompt)
        
        return jsonify({"answer": response.text})

    except Exception as e:
        print(f"Error during API call: {e}")
        return jsonify({"error": "Failed to get answer from Gemini"}), 500

# --- Start the Server ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)