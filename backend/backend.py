import os
import json
import threading
from flask import Flask, jsonify, abort
from keras.models import load_model
from datetime import datetime

BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "model", "model.keras")
SAMPLE_JSON_PATH = os.path.join(BASE_DIR, "data", "sample.json")

app = Flask(__name__)

# Load Keras model (if available)
model = None
try:
    model = load_model(MODEL_PATH)
    print(f"Loaded model from {MODEL_PATH}")
except Exception as e:
    print(f"Failed to load model from {MODEL_PATH}: {e}")

# Load sample.json (expecting a list of dictionaries)
general_info = {}
samples = []
if os.path.exists(SAMPLE_JSON_PATH):
    try:
        with open(SAMPLE_JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            general_info = data.get("info", {})
            samples = data.get("data", [])
    except Exception as e:
        print(f"Error reading {SAMPLE_JSON_PATH}: {e}")
else:
    print(f"sample.json not found at {SAMPLE_JSON_PATH}. Starting with empty samples list.")

# Thread-safe index for sequentially returning cars
_lock = threading.Lock()
_next_idx = 0
_next_time = datetime.now()

@app.route("/next_data", methods=["GET"])
def get_next_data():
    global _next_idx
    with _lock:
        if _next_idx >= len(samples):
            # No more data
            return jsonify({"error": "no more data"}), 404

        data = samples[_next_idx]
        _next_idx += 1
        while datetime.now() < _next_time:
            pass  # Busy-wait until the next time slot
    
    data["info"] = general_info

    # Optionally, you could run the model here on the data if the model input format is known.
    # For now we simply return the data dictionary as-is.
    return jsonify(data)

if __name__ == "__main__":
    # Run dev server. In production use a proper WSGI server.
    app.run(host="0.0.0.0", port=5000, debug=True)