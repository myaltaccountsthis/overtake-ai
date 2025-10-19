# from elevenlabs.client import ElevenLabs
# elevenLabs = ElevenLabs(api_key='sk_22ec0ec93084c727bcaad9e44dfdcc80b1a64a01f3bc5a15')

# print("Successful")

# from elevenlabs import stream
# from elevenlabs.client import ElevenLabs
# elevenlabs = ElevenLabs(api_key='sk_22ec0ec93084c727bcaad9e44dfdcc80b1a64a01f3bc5a15')
# audio_stream = elevenlabs.text_to_speech.stream(
#     text="This is a test",
#     voice_id="JBFqnCBsd6RMkjVDRZzb",
#     model_id="eleven_flash_v2_5"
# )
# # option 1: play the streamed audio locally
# stream(audio_stream)

# for chunk in audio_stream:
#     if isinstance(chunk, bytes):
#         print(chunk)

import json
import numpy as np
import faiss
from pathlib import Path
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)

# Simple document class to store text and metadata
class Document:
    def __init__(self, text, metadata=None):
        self.text = text
        self.metadata = metadata or {}

def compute_embedding(text):
    """Convert text to a simple vector using character frequencies.
    This is a basic embedding method that doesn't require external models.
    It creates a 256-dimensional vector based on character frequencies."""
    # Create a fixed-size vector (256 dims) from character frequencies
    vec = np.zeros(256, dtype=np.float32)
    if not text:
        return vec
    # Count character frequencies, normalize, and hash into the vector
    for char in text:
        idx = hash(char) % 256
        vec[idx] += 1.0
    # Normalize the vector
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec /= norm
    return vec

# 1. Load and process the data
try:
    data_path = Path(__file__).parent / "data" / "car_data.json"
    if not data_path.exists():
        data_path = Path(__file__).parent / "data" / "car_data.csv"
    
    if data_path.suffix == '.json':
        raw_data = json.loads(data_path.read_text(encoding='utf-8'))
        if isinstance(raw_data, list):
            documents = [Document(json.dumps(item)) for item in raw_data]
        else:
            documents = [Document(json.dumps(raw_data))]
    else:  # CSV
        import csv
        documents = []
        with open(data_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                documents.append(Document(json.dumps(row)))
except:
    pass
# 2. Build FAISS index from documents
dimension = 256  # matches compute_embedding output dimension
index = faiss.IndexFlatL2(dimension)

# Compute embeddings for all documents
doc_embeddings = []
for doc in documents:
    vec = compute_embedding(doc.text)
    doc_embeddings.append(vec)

# Add vectors to FAISS index
index.add(np.array(doc_embeddings))

def find_similar_documents(query_text, k=1):
    """Find k most similar documents to the query text."""
    # Convert query to vector (same dimension as document vectors)
    query_vector = compute_embedding(query_text)
    # Reshape for faiss search
    query_vector = query_vector.reshape(1, -1)
    
    # Search the index
    distances, indices = index.search(query_vector, k)
    
    # Return the matching documents and their distances
    results = []
    for idx, dist in zip(indices[0], distances[0]):
        if idx < len(documents):  # ensure valid index
            doc = documents[idx]
            results.append({
                'text': doc.text,
                'distance': float(dist),
                'metadata': doc.metadata
            })
    return results


def communicate (query):
    matches = find_similar_documents(query)
    print(f"\nFound {len(matches)} similar items:")
    for i, match in enumerate(matches, 1):
        print(f"\n{i}. Distance: {match['distance']:.3f}")
        print(f"   Content: {match['text'][:200]}...")