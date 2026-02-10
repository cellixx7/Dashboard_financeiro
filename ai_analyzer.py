from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import google.generativeai as genai

# --- Configuração da IA ---
# Defina sua API KEY aqui ou, preferencialmente, nas variáveis de ambiente do sistema
# Ex: set GEMINI_API_KEY=sua_chave_aqui (Windows) ou export GEMINI_API_KEY=sua_chave_aqui (Linux/Mac)
API_KEY = "AIzaSyCqmPzYjvDhSRdbh6Ubsc5LcamHeMACEwU"

if API_KEY:
    genai.configure(api_key=API_KEY)

app = FastAPI(title="AI Financial Analyzer")

# --- Configuração de CORS ---
# Permite que o front-end (Live Server) acesse este backend
origins = [
    "http://localhost",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Modelos de Dados (Espelhados do Front-end) ---

class Transaction(BaseModel):
    description: str
    amount: float
    type: str
    category: str
    date: Optional[str] = None

class Goal(BaseModel):
    id: int
    name: str
    target: float
    current: float

class AnalysisRequest(BaseModel):
    salary: float
    transactions: List[Transaction]
    goals: List[Goal]

# --- Endpoint ---

@app.post("/analyze")
async def analyze_finances(data: AnalysisRequest):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="API Key da IA não configurada. Defina a variável de ambiente GEMINI_API_KEY.")

    try:
        # Prepara os dados para enviar à IA
        input_data = {
            "salary": data.salary,
            "transactions": [t.dict() for t in data.transactions],
            "goals": [g.dict() for g in data.goals]
        }

        # Prompt conforme solicitado
        prompt = (
            "Atue como um analista financeiro. Analise estes dados e retorne um JSON com: "
            "a) Um resumo da saúde financeira, "
            "b) Uma recomendação de economia para as metas, "
            "c) Um array de dados para um novo gráfico (ex: Projeção de saldo para 6 meses). "
            "\n\n"
            f"Dados para análise: {json.dumps(input_data, ensure_ascii=False)}\n\n"
            "Responda APENAS com o JSON válido, sem formatação Markdown (```json) e sem texto adicional."
        )

        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        # Limpa a resposta para garantir que seja apenas JSON
        cleaned_text = response.text.replace("```json", "").replace("```", "").strip()
        
        return json.loads(cleaned_text)

    except Exception as e:
        print(f"Erro na análise: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar com a IA: {str(e)}")

# Para rodar este script em uma porta diferente do main.py:
# uvicorn ai_analyzer:app --reload --port 8001

if __name__ == "__main__":
    import uvicorn
    # Permite rodar diretamente com: python ai_analyzer.py
    uvicorn.run("ai_analyzer:app", host="127.0.0.1", port=8001, reload=True)
