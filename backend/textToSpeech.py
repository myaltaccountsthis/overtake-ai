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

from langchain_community.document_loaders.csv_loader import CSVLoader
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain_classic.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_classic.chains import LLMChain
# from dotenv import load_dotenv
from langchain_classic.memory import ConversationBufferMemory
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
memory = ConversationBufferMemory()

# load_dotenv()
exit()

# 1. Vectorise the sales response csv data
loader = CSVLoader(file_path="C:\Users\mvel2\OneDrive\Documents\GitHub\hacktx-2025\backend\data\car_data.json")
documents = loader.load()

embeddings = OpenAIEmbeddings()
db = FAISS.from_documents(documents, embeddings)

# 2. Function for similarity search


def retrieve_info(query):
    similar_response = db.similarity_search(query, k=1)

    page_contents_array = [doc.page_content for doc in similar_response]

    return page_contents_array


# 3. Setup LLMChain & prompts
llm = ChatOpenAI(temperature=0.7, model="gpt-3.5-turbo-16k-0613")

name = "Jeff"

template = """
reply with a hello
"""

prompt = PromptTemplate(
    input_variables=["message", "best_practice"],
    template=template
)

chain = LLMChain(llm=llm, prompt=prompt)


# 4. Retrieval augmented generation
def  generate_response(message):
    best_practice = retrieve_info(message)
    response = chain.run(message=message, best_practice=best_practice)
    return response


while (True):
    userInput = input("Enter your message: ")
    memory.chat_memory.add_user_message(userInput)

    response = generate_response(userInput)
    memory.chat_memory.add_ai_message(response)
    print(response + "\n")