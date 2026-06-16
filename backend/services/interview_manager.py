import json
from langchain_core.prompts import PromptTemplate
from .resume_parser import get_llm
from .rag_pipeline import retrieve_context

def evaluate_and_generate_next(
    role: str,
    extracted_skills: str,
    past_qa: list[dict],
    latest_answer: str = None
) -> dict:
    """
    Evaluates the previous answer (if any) and generates the next question.
    Returns a dict with 'evaluation' (str), 'next_question' (str), and 'is_finished' (bool).
    """
    try:
        llm = get_llm()
        has_llm = True
    except ValueError:
        has_llm = False

    if not has_llm:
        # Mock Interview Database for the three roles
        mock_questions = {
            "Backend Engineer": [
                "Could you explain the difference between horizontal and vertical scaling, and how you would design a backend to support horizontal scaling using a database like PostgreSQL?",
                "Great. How do you handle database migrations in a production environment with minimal downtime, especially when renaming a column?",
                "Let's talk about asynchronous processing. How would you design a background task queue to process image uploads, and what tools would you use?",
                "How do you secure a REST API against common vulnerabilities like SQL injection, CSRF, and rate-limiting?",
                "Finally, how do you approach caching in a web application? When would you use Redis, and what is your strategy for cache invalidation?"
            ],
            "AI/ML Engineer": [
                "Can you explain the difference between bagging and boosting, and give an example of an algorithm that uses each?",
                "How do you handle class imbalance in a dataset, both at the data level and at the algorithmic level?",
                "What is the vanishing gradient problem in deep neural networks, and how do modern architectures or activation functions mitigate it?",
                "How do you evaluate the performance of a recommendation system? What metrics would you use?",
                "When deploying a machine learning model to production, how do you monitor for model drift and concept drift over time?"
            ],
            "Data Scientist": [
                "What is the difference between A/B testing and multivariate testing? How do you calculate the sample size needed for an A/B test?",
                "Could you explain the difference between L1 (Lasso) and L2 (Ridge) regularization? When would you choose one over the other?",
                "What is the Central Limit Theorem, and why is it important in statistical inference?",
                "How do you handle missing data in a dataset before modeling, and what are the trade-offs of different imputation techniques?",
                "Can you explain the bias-variance trade-off and how it relates to underfitting and overfitting?"
            ]
        }
        
        # Get questions list for the role
        questions = mock_questions.get(role, mock_questions["Backend Engineer"])
        
        # Determine current index
        q_idx = len(past_qa)
        
        # 1. Evaluate previous answer (if any)
        evaluation_json = '{"score": 8, "feedback": "Good response. The candidate demonstrates a solid grasp of the core concepts."}'
        if latest_answer and q_idx > 0:
            score = 8
            if len(latest_answer) < 30:
                score = 6
                feedback = "Response is a bit brief. The candidate could elaborate more on practical trade-offs."
            elif len(latest_answer) > 150:
                score = 9
                feedback = "Highly detailed response showing excellent depth of knowledge and practical experience."
            else:
                feedback = f"Good explanation. Demonstrates solid familiarity with the topic."
            evaluation_json = json.dumps({"score": score, "feedback": feedback})
            
        # 2. Check if finished
        if q_idx >= 5 and latest_answer is not None:
            return {
                "evaluation": evaluation_json,
                "next_question": "Thank you for your time. The interview is now complete.",
                "is_finished": True
            }
            
        # 3. Get next question
        next_q = questions[q_idx] if q_idx < len(questions) else "Thank you for your time. The interview is now complete."
        is_fin = q_idx >= 5
        
        return {
            "evaluation": evaluation_json,
            "next_question": next_q,
            "is_finished": is_fin
        }

    llm = get_llm()
    
    # 1. Evaluate the latest answer if it exists
    evaluation_json = '{"score": 0, "feedback": "No previous answer to evaluate."}'
    if latest_answer and len(past_qa) > 0:
        last_q = past_qa[-1]["question"]
        eval_template = """
        You are an expert technical interviewer evaluating a candidate for a {role} role.
        Question asked: {question}
        Candidate's answer: {answer}
        
        Evaluate the answer for correctness, depth, and clarity.
        Output EXACTLY as a JSON object:
        - "score": integer from 0 to 10.
        - "feedback": a short string explaining the score.
        """
        eval_prompt = PromptTemplate(template=eval_template, input_variables=["role", "question", "answer"])
        eval_chain = eval_prompt | llm
        eval_res = eval_chain.invoke({"role": role, "question": last_q, "answer": latest_answer})
        
        eval_content = eval_res.content.strip()
        if eval_content.startswith("```json"): eval_content = eval_content[7:]
        if eval_content.startswith("```"): eval_content = eval_content[3:]
        if eval_content.endswith("```"): eval_content = eval_content[:-3]
        evaluation_json = eval_content.strip()
        
    # Check if we should end the interview (e.g., after 5 questions)
    if len(past_qa) >= 5 and latest_answer is not None:
        return {
            "evaluation": evaluation_json,
            "next_question": "Thank you for your time. The interview is now complete.",
            "is_finished": True
        }

    # 2. Figure out the next topic and get context
    # We use a simple prompt to decide the next topic based on skills and past questions
    topic_template = """
    Candidate Role: {role}
    Candidate Skills: {skills}
    Past Questions asked: {past_q_list}
    
    Based on the candidate's skills and what has already been asked, output ONLY a concise topic or concept 
    that should be asked next to test their depth of knowledge. Do not output a full question, just the topic.
    """
    topic_prompt = PromptTemplate(template=topic_template, input_variables=["role", "skills", "past_q_list"])
    past_q_list = [qa["question"] for qa in past_qa]
    topic_res = (topic_prompt | llm).invoke({"role": role, "skills": extracted_skills, "past_q_list": str(past_q_list)})
    next_topic = topic_res.content.strip()

    # Retrieve context from RAG
    context = retrieve_context(next_topic, role)
    
    # 3. Generate the next question
    q_template = """
    You are an expert technical interviewer for a {role} role.
    You need to ask a question about: {next_topic}
    
    Here is some textbook context to base your question on:
    {context}
    
    Candidate's known skills: {skills}
    
    Formulate a challenging, practical interview question. Do not make it a multiple choice question.
    Make it sound like a natural conversation.
    If the candidate's last answer was very good, make this question harder.
    
    Output ONLY the question text.
    """
    q_prompt = PromptTemplate(template=q_template, input_variables=["role", "next_topic", "context", "skills"])
    q_res = (q_prompt | llm).invoke({
        "role": role,
        "next_topic": next_topic,
        "context": context,
        "skills": extracted_skills
    })
    
    next_question = q_res.content.strip()
    
    return {
        "evaluation": evaluation_json,
        "next_question": next_question,
        "is_finished": False
    }

def generate_final_report(role: str, extracted_skills: str, past_qa: list[dict]) -> str:
    """
    Generates a final summary report of the interview.
    """
    try:
        llm = get_llm()
        has_llm = True
    except ValueError:
        has_llm = False

    if not has_llm:
        scores = []
        for qa in past_qa:
            try:
                eval_data = json.loads(qa["evaluation"]) if isinstance(qa["evaluation"], str) else qa["evaluation"]
                scores.append(eval_data.get("score", 8))
            except:
                scores.append(8)
        avg_score = sum(scores) / len(scores) if scores else 8
        hireability_score = int(avg_score * 10)
        
        report = f"""# Candidate Evaluation Report: {role}

## 1. Overall Impression
The candidate demonstrated solid competence during the role-based technical screening. Their responses showed active experience with core concepts and practical application, aligning well with the expectations for a {role}.

## 2. Key Strengths
- Decent coverage of core principles and technologies listed in the skills profile.
- Practical problem-solving mindset when explaining system scenarios.
- Clear communication and ability to explain complex terms.

## 3. Areas for Improvement
- Could provide deeper insight into edge cases or system constraints under high stress.
- Some responses would benefit from more concrete real-world project examples.

## 4. Final Hireability Score
**{hireability_score} / 100** ({'Strong Hire' if hireability_score >= 80 else 'Passable Hire'})
"""
        return report

    llm = get_llm()
    transcript = ""
    for idx, qa in enumerate(past_qa):
        transcript += f"Q{idx+1}: {qa['question']}\nA{idx+1}: {qa['answer']}\nEval: {qa['evaluation']}\n\n"
        
    template = """
    You are an expert hiring manager. Review the following interview transcript for a {role} position.
    Candidate Skills: {skills}
    
    Transcript:
    {transcript}
    
    Write a concise evaluation report. Include:
    1. Overall Impression
    2. Key Strengths
    3. Areas for Improvement
    4. Final Hireability Score (Out of 100)
    
    Format the output in Markdown.
    """
    prompt = PromptTemplate(template=template, input_variables=["role", "skills", "transcript"])
    res = (prompt | llm).invoke({"role": role, "skills": extracted_skills, "transcript": transcript})
    return res.content.strip()

