from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import io
from datetime import datetime

# --- Modelos de Dados (Recebidos do Front-end) ---

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

class Task(BaseModel):
    id: int
    desc: str
    done: bool

class ReportRequest(BaseModel):
    transactions: List[Transaction]
    goals: List[Goal]
    tasks: List[Task]
    salary: float

# --- Inicialização do App ---

app = FastAPI(title="Dashboard Financeiro - Gerador de Relatórios")

# Configuração de CORS
origins = [
    "http://localhost",
    "http://localhost:5500", # Porta comum do Live Server
    "http://127.0.0.1:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Permite as origens listadas acima
    allow_credentials=True,
    allow_methods=["*"],   # Permite todos os métodos (GET, POST, etc.)
    allow_headers=["*"],   # Permite todos os headers
)

# --- Endpoints ---

@app.post("/generate_excel")
def generate_excel(data: ReportRequest):
    # Cria DataFrames do Pandas
    df_trans = pd.DataFrame([t.dict() for t in data.transactions])
    df_goals = pd.DataFrame([g.dict() for g in data.goals])
    df_tasks = pd.DataFrame([t.dict() for t in data.tasks])
    
    # Buffer em memória para o arquivo Excel
    output = io.BytesIO()
    
    # Cria o arquivo Excel com múltiplas abas
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        if not df_trans.empty:
            df_trans.to_excel(writer, sheet_name='Transações', index=False)
        if not df_goals.empty:
            df_goals.to_excel(writer, sheet_name='Metas', index=False)
        if not df_tasks.empty:
            df_tasks.to_excel(writer, sheet_name='Tarefas', index=False)
            
        # Aba de Resumo
        summary_data = {'Salário Base': [data.salary], 'Data Relatório': [datetime.now().strftime("%d/%m/%Y %H:%M")]}
        pd.DataFrame(summary_data).to_excel(writer, sheet_name='Resumo', index=False)

    output.seek(0)
    
    headers = {
        'Content-Disposition': 'attachment; filename="relatorio_financeiro_avancado.xlsx"'
    }
    return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

# Para rodar: uvicorn main:app --reload
