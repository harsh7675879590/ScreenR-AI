import os
import json
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

def get_llm():
    if "GOOGLE_API_KEY" in os.environ:
        return ChatGoogleGenerativeAI(model="gemini-1.5-flash")
    elif "OPENAI_API_KEY" in os.environ:
        return ChatOpenAI(model="gpt-4o-mini", temperature=0)
    else:
        raise ValueError("No GOOGLE_API_KEY or OPENAI_API_KEY found.")

def parse_resume(resume_text: str, role: str) -> str:
    """
    Parses a resume and returns a JSON string containing extracted skills and relevant info.
    """
    try:
        llm = get_llm()
    except ValueError:
        # Graceful fallback for demo when no API keys are present
        skills_map = {
            "Backend Engineer": ["Python", "FastAPI", "SQLAlchemy", "PostgreSQL", "Docker", "Git", "REST APIs"],
            "AI/ML Engineer": ["Python", "PyTorch", "TensorFlow", "Scikit-Learn", "NumPy", "Pandas", "Scipy"],
            "Data Scientist": ["Python", "SQL", "Pandas", "NumPy", "Matplotlib", "Seaborn", "A/B Testing"]
        }
        skills = skills_map.get(role, ["Python", "Git"])
        mock_data = {
            "skills": skills,
            "tools": ["Redis", "Celery", "Postman", "AWS", "GitHub Actions"],
            "domain_experience": f"Strong developer with solid experience in building and deploying solutions for {role} roles.",
            "years_of_experience": 3
        }
        return json.dumps(mock_data)

    template = """
    You are an expert technical recruiter. Analyze the following candidate's resume for the role of {role}.
    Extract the key skills, technologies, and domain exposure relevant to the role.
    
    Output the result EXACTLY as a JSON object with the following keys:
    - "skills": A list of technical skills and programming languages.
    - "tools": A list of frameworks, databases, and tools.
    - "domain_experience": A short summary of their relevant domain experience.
    - "years_of_experience": Estimated years of experience (integer, or null if unknown).
    
    Resume Text:
    {resume_text}
    
    JSON Output:
    """
    
    prompt = PromptTemplate(template=template, input_variables=["role", "resume_text"])
    
    chain = prompt | llm
    result = chain.invoke({"role": role, "resume_text": resume_text})
    
    # Clean up output in case the LLM wrapped it in markdown code blocks
    content = result.content.strip()
    if content.startswith("```json"):
        content = content[7:]
    if content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
        
    content = content.strip()
    
    # Validate JSON
    try:
        json.loads(content)
        return content
    except json.JSONDecodeError:
        # Fallback empty structure
        return json.dumps({
            "skills": [],
            "tools": [],
            "domain_experience": "Failed to parse",
            "years_of_experience": None
        })

