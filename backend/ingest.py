import os
import glob
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
import warnings

# Use Gemini embeddings if API key is provided, else use OpenAI.
# For simplicity, we'll try Google first.
from langchain_google_genai import GoogleGenerativeAIEmbeddings

def ingest_documents(data_dir: str = "./data", persist_dir: str = "./chroma_db"):
    if not os.path.exists(data_dir):
        print(f"Data directory {data_dir} does not exist. Creating it.")
        os.makedirs(data_dir)
        print("Please place textbook PDFs in the data directory and run again.")
        return

    pdf_files = glob.glob(os.path.join(data_dir, "*.pdf"))
    if not pdf_files:
        print(f"No PDF files found in {data_dir}.")
        return

    print(f"Found {len(pdf_files)} PDF(s). Loading...")
    docs = []
    for file in pdf_files:
        try:
            loader = PyPDFLoader(file)
            docs.extend(loader.load())
            print(f"Loaded {file}")
        except Exception as e:
            print(f"Error loading {file}: {e}")

    print(f"Total document pages loaded: {len(docs)}")

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(docs)
    print(f"Split into {len(splits)} chunks.")

    # Check for API keys
    if "GOOGLE_API_KEY" in os.environ:
        print("Using Google Generative AI Embeddings")
        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    elif "OPENAI_API_KEY" in os.environ:
        print("Using OpenAI Embeddings")
        from langchain_openai import OpenAIEmbeddings
        embeddings = OpenAIEmbeddings()
    else:
        print("WARNING: No GOOGLE_API_KEY or OPENAI_API_KEY found in environment variables.")
        print("Cannot generate embeddings without an API key.")
        return

    print("Creating vector store and generating embeddings... This may take a while.")
    vectorstore = Chroma.from_documents(documents=splits, embedding=embeddings, persist_directory=persist_dir)
    # vectorstore.persist() is automatic in newer versions of Chroma, but persist_directory specifies where it goes.
    print(f"Ingestion complete. Vector store saved to {persist_dir}")

if __name__ == "__main__":
    # You can set environment variables here or in your shell before running
    # os.environ["GOOGLE_API_KEY"] = "your-api-key"
    ingest_documents()
