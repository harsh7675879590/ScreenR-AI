import os
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_openai import OpenAIEmbeddings

# Use the same embeddings logic as ingest.py
def get_embeddings():
    if "GOOGLE_API_KEY" in os.environ:
        return GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    elif "OPENAI_API_KEY" in os.environ:
        return OpenAIEmbeddings()
    else:
        raise ValueError("No API key found for embeddings.")


def get_retriever(persist_dir: str = "./chroma_db"):
    if not os.path.exists(persist_dir):
        print(f"Vector store not found at {persist_dir}. Returning None.")
        return None
        
    embeddings = get_embeddings()
    vectorstore = Chroma(persist_directory=persist_dir, embedding_function=embeddings)
    return vectorstore.as_retriever(search_kwargs={"k": 3})

def retrieve_context(query: str, role: str) -> str:
    """
    Retrieves context from the vector database based on the query.
    If no DB exists, returns a fallback context.
    """
    retriever = get_retriever()
    if not retriever:
        return "No textbook context available. Rely on general knowledge."
        
    # Append the role to the query to guide the retrieval
    search_query = f"[{role}] {query}"
    docs = retriever.invoke(search_query)
    
    if not docs:
        return "No relevant context found."
        
    context = "\n\n".join([doc.page_content for doc in docs])
    return context
