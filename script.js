// Aguarda o DOM carregar completamente
document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    // Formulários
    const transactionForm = document.getElementById('finance-form');
    const settingsForm = document.getElementById('settings-form');
    const goalForm = document.getElementById('goal-form');
    const taskForm = document.getElementById('task-form');

    // Inputs de Transação
    const descInput = document.getElementById('desc');
    const amountInput = document.getElementById('amount');
    const typeInput = document.getElementById('type');
    const categoryInput = document.getElementById('category');
    const editIndexInput = document.getElementById('edit-index');
    const submitBtn = document.getElementById('submit-btn');
    
    // Inputs de Configuração e Metas
    const salaryInput = document.getElementById('salary');
    const goalNameInput = document.getElementById('goal-name');
    const goalTargetInput = document.getElementById('goal-target');

    // Inputs de Categoria (Config)
    const newCatNameInput = document.getElementById('new-cat-name');
    const newCatColorInput = document.getElementById('new-cat-color');
    const exportJsonBtn = document.getElementById('export-json-btn');
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const importFileInput = document.getElementById('import-file');
    
    // Inputs de Tarefa
    const taskDescInput = document.getElementById('task-desc');

    // Áreas de Exibição
    const tableBody = document.querySelector('#transaction-table tbody');
    const incomeDisplay = document.getElementById('entradas');
    const expenseDisplay = document.getElementById('saidas');
    const balanceDisplay = document.getElementById('saldo');
    
    // Modais
    const transactionModal = document.getElementById('transaction-modal');
    const goalModal = document.getElementById('goal-modal');
    const settingsModal = document.getElementById('settings-modal');
    const goalsManagerModal = document.getElementById('goals-manager-modal');
    const taskModal = document.getElementById('task-modal');
    
    let myChart = null;
    let aiChartInstance = null; // Instância do gráfico da IA

    const API_URL = 'http://localhost:8000';
    const AI_API_URL = 'http://localhost:8001'; // Porta do ai_analyzer.py

    // --- Gestão de Estado (IA Ready) ---
    let state = {
        transactions: JSON.parse(localStorage.getItem('transactions')) || [],
        goals: JSON.parse(localStorage.getItem('goals')) || [],
        salary: parseFloat(localStorage.getItem('salary')) || 0,
        pinnedGoalId: localStorage.getItem('pinnedGoalId') || null,
        tasks: JSON.parse(localStorage.getItem('tasks')) || [],
        categories: JSON.parse(localStorage.getItem('categories')) || [
            { id: 1, name: 'Alimento', color: '#e17055' },
            { id: 2, name: 'Transporte', color: '#0984e3' },
            { id: 3, name: 'Lazer', color: '#fdcb6e' },
            { id: 4, name: 'Carro', color: '#6c5ce7' },
            { id: 5, name: 'Outros', color: '#636e72' }
        ]
    };

    const categoryIcons = {
        'Alimento': 'utensils',
        'Transporte': 'car',
        'Lazer': 'palmtree',
        'Carro': 'gauge',
        'Outros': 'package'
    };

    // --- Funções Auxiliares ---

    const formatCurrency = (valor) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    };

    const saveData = () => {
        localStorage.setItem('transactions', JSON.stringify(state.transactions));
        localStorage.setItem('goals', JSON.stringify(state.goals));
        localStorage.setItem('salary', state.salary.toString());
        localStorage.setItem('pinnedGoalId', state.pinnedGoalId);
        localStorage.setItem('tasks', JSON.stringify(state.tasks));
        localStorage.setItem('categories', JSON.stringify(state.categories));
        updateDashboard();
    };

    // --- Lógica Principal (Cálculos Bancários) ---

    const calculateTotals = () => {
        // Soma de transações
        const expenseTransactions = state.transactions
            .filter(item => item.type === 'saida')
            .reduce((acc, item) => acc + item.amount, 0);
            
        const incomeTransactions = state.transactions
            .filter(item => item.type === 'entrada')
            .reduce((acc, item) => acc + item.amount, 0);

        

        // Total reservado em metas
        const totalSavedInGoals = state.goals.reduce((acc, g) => acc + g.current, 0);

        // Renda Total = Salário Base + Entradas Extras
        const totalIncome = state.salary + incomeTransactions;

        // Saldo Disponível = Renda - Gastos - Reservas
        const availableBalance = totalIncome - expenseTransactions - totalSavedInGoals;

        // Patrimônio = Renda - Gastos (Inclui o que está nas metas)
        const netWorth = totalIncome - expenseTransactions;

        return { totalIncome, expenseTransactions, availableBalance, netWorth, totalSavedInGoals };
    };

    const updateDashboard = () => {
        const totals = calculateTotals();

        incomeDisplay.innerText = formatCurrency(totals.totalIncome);
        expenseDisplay.innerText = formatCurrency(totals.expenseTransactions);
        balanceDisplay.innerText = formatCurrency(totals.availableBalance);

        // Atualiza título do saldo para refletir liquidez
        const balanceTitle = document.querySelector('.card-total .card-title');
        if(balanceTitle) balanceTitle.innerText = "Saldo Disponível";

        renderTable();
        renderPinnedGoal();
        renderCategoryOptions();
        renderTasks();
        updateChart(totals);

        // Log para IA
        console.log('Relatório para IA:', JSON.stringify({
            timestamp: new Date().toISOString(),
            resumo: totals,
            transacoes: state.transactions,
            metas: state.goals,
            tarefas: state.tasks
        }, null, 2));
    };

    // --- Gráfico Inteligente (Gastos vs. Economia) ---

    const updateChart = (totals) => {
        const ctx = document.getElementById('myChart').getContext('2d');
        
        // Agrupa gastos por categoria
        const expensesByCategory = {};
        state.transactions.filter(t => t.type === 'saida').forEach(t => {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        });

        const labels = Object.keys(expensesByCategory);
        const data = Object.values(expensesByCategory);

        // Adiciona fatia de "Economia/Metas" se houver saldo investido
        if (totals.totalSavedInGoals > 0) {
            labels.push('Economia (Metas)');
            data.push(totals.totalSavedInGoals);
        }

        const backgroundColors = labels.map(label => {
            if (label === 'Economia (Metas)') return '#00b894';
            return state.categories.find(c => c.name === label)?.color || '#636e72';
        });

        // Cria labels com os valores formatados para exibição
        const displayLabels = labels.map((label, index) => {
            return `${label} - ${formatCurrency(data[index])}`;
        });

        if (myChart) myChart.destroy();

        myChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: displayLabels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#b2bec3' }
                    },
                    title: {
                        display: true,
                        text: 'Distribuição do Patrimônio',
                        color: '#b2bec3'
                    }
                }
            }
        });
    };

    // --- Integração com IA (Consultoria) ---

    const btnAnalyze = document.getElementById('btn-analyze');

    async function askAiAnalysis() {
        if (!btnAnalyze) return;

        // 1. Estado de Loading
        const originalContent = btnAnalyze.innerHTML;
        btnAnalyze.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> Analisando...';
        btnAnalyze.disabled = true;
        lucide.createIcons();

        try {
            // 2. Envia dados para o Python (ai_analyzer.py)
            const response = await fetch(`${AI_API_URL}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    salary: state.salary,
                    transactions: state.transactions,
                    goals: state.goals
                })
            });

            if (!response.ok) throw new Error('Falha na comunicação com a IA');

            const data = await response.json();

            // 3. Preenche o Relatório de Texto
            const reportContainer = document.getElementById('ai-report-content');
            
            // Tenta mapear chaves comuns que a IA pode retornar
            const summary = data.resumo || data.summary || data.a || "Resumo não disponível.";
            const recommendation = data.recomendacao || data.recommendation || data.b || "Sem recomendação.";
            
            reportContainer.innerHTML = `
                <h4 style="color: #fdcb6e; margin-bottom: 8px; display:flex; align-items:center; gap:6px;"><i data-lucide="activity" style="width:16px;"></i> Resumo Financeiro</h4>
                <p style="margin-bottom: 15px; color: #dfe6e9;">${summary}</p>
                
                <h4 style="color: #00b894; margin-bottom: 8px; display:flex; align-items:center; gap:6px;"><i data-lucide="piggy-bank" style="width:16px;"></i> Recomendação Estratégica</h4>
                <p style="color: #dfe6e9;">${recommendation}</p>
            `;
            lucide.createIcons();

            // 4. Renderiza o Gráfico da IA
            const chartData = data.grafico || data.chart_data || data.c || [];
            renderAiChart(chartData);

        } catch (error) {
            console.error(error);
            document.getElementById('ai-report-content').innerHTML = `<p style="color: var(--danger);">Erro ao conectar com a IA.</p>`;
        } finally {
            // 5. Restaura o botão
            btnAnalyze.innerHTML = originalContent;
            btnAnalyze.disabled = false;
            lucide.createIcons();
        }
    }

    function renderAiChart(dataPoints) {
        const ctx = document.getElementById('aiChart').getContext('2d');
        
        if (aiChartInstance) {
            aiChartInstance.destroy();
        }

        // Cria labels genéricas (Mês 1, Mês 2...) baseadas na quantidade de dados
        const labels = dataPoints.map((_, i) => `Mês ${i + 1}`);

        aiChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Projeção de Saldo (IA)',
                    data: dataPoints,
                    borderColor: '#6c5ce7',
                    backgroundColor: 'rgba(108, 92, 231, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4, // Curva suave
                    pointBackgroundColor: '#00b894'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#b2bec3' }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    y: {
                        grid: { color: '#2d3436' },
                        ticks: { color: '#b2bec3' }
                    },
                    x: {
                        grid: { color: '#2d3436' },
                        ticks: { color: '#b2bec3' }
                    }
                }
            }
        });
    }

    // --- Renderização de Metas (Modal e Barra Fixa) ---
    
    window.openGoalsManager = () => {
        renderGoalsManager();
        goalsManagerModal.showModal();
    };

    const renderGoalsManager = () => {
        const container = document.getElementById('goals-list-container');
        container.innerHTML = '';
        
        state.goals.forEach(goal => {
            const percentage = Math.min(100, (goal.current / goal.target) * 100).toFixed(1);
            const isPinned = state.pinnedGoalId == goal.id;
            const statusColor = percentage >= 100 ? 'var(--success)' : '#636e72';

            const card = document.createElement('div');
            card.className = 'goal-item animate-entry';
            card.innerHTML = `
                <div class="goal-item-header">
                    <div>
                        <h4 style="margin-bottom: 4px;">${goal.name}</h4>
                        <small style="color: #b2bec3;">${formatCurrency(goal.current)} de ${formatCurrency(goal.target)}</small>
                    </div>
                    <div class="goal-actions-btn">
                        <button onclick="togglePin(${goal.id})" class="btn-pin ${isPinned ? 'active' : ''}" title="${isPinned ? 'Desafixar' : 'Fixar no topo'}">
                            <i data-lucide="pin"></i>
                        </button>
                        <button onclick="depositToGoal(${goal.id})" class="btn-edit" title="Investir"><i data-lucide="trending-up"></i></button>
                        <button onclick="deleteGoal(${goal.id})" class="btn-delete" title="Excluir"><i data-lucide="trash-2"></i></button>
                    </div>
                </div>
                <progress value="${goal.current}" max="${goal.target}"></progress>
                <div style="display: flex; justify-content: flex-end;">
                    <span class="goal-tag" style="color: ${statusColor}; border: 1px solid ${statusColor}40;">${percentage}% Concluído</span>
                </div>
            `;
            container.appendChild(card);
        });
        lucide.createIcons();
    };

    const renderPinnedGoal = () => {
        const bar = document.getElementById('pinned-goal-bar');
        
        // Verifica se existe meta fixada e se ela ainda existe na lista
        const goal = state.goals.find(g => g.id == state.pinnedGoalId);
        
        if (!state.pinnedGoalId || !goal) {
            bar.style.display = 'none';
            return;
        }
        
        const percentage = Math.min(100, (goal.current / goal.target) * 100).toFixed(1);
        bar.style.display = 'flex';
        bar.innerHTML = `
            <span class="pinned-label">Meta: <strong style="color: var(--primary);">${goal.name}</strong></span>
            <div class="pinned-progress-wrapper"><div class="pinned-progress-bar" style="width: ${percentage}%"></div></div>
            <span style="font-weight: 600; color: var(--success);">${percentage}%</span>
        `;
    };

    // --- Renderização da Tabela ---
    const renderTable = () => {
        tableBody.innerHTML = '';
        state.transactions.forEach((item, index) => {
            const tr = document.createElement('tr');
            const amountClass = item.type === 'saida' ? 'color: var(--danger);' : 'color: var(--success);';
            const amountSign = item.type === 'saida' ? '-' : '';
            
            const catObj = state.categories.find(c => c.name === item.category);
            const catColor = catObj ? catObj.color : '#636e72';
            
            const iconName = categoryIcons[item.category] || 'circle';

            tr.innerHTML = `
                <td><i data-lucide="${iconName}" style="width: 16px; height: 16px; margin-right: 8px; vertical-align: middle; color: ${catColor}"></i>${item.description}</td>
                <td><span class="badge" style="background-color: ${catColor}26; color: ${catColor}; border: 1px solid ${catColor}4D;">${item.category}</span></td>
                <td style="${amountClass}">${amountSign} ${formatCurrency(item.amount)}</td>
                <td>${item.type === 'entrada' ? 'Entrada' : 'Saída'}</td>
                <td>
                    <button onclick="editTransaction(${index})" class="btn-edit" title="Editar"><i data-lucide="pencil"></i></button>
                    <button onclick="deleteTransaction(${index})" class="btn-delete" title="Excluir"><i data-lucide="trash-2"></i></button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
        lucide.createIcons();
    };

    // --- Renderização de Tarefas ---
    const renderTasks = () => {
        const taskList = document.getElementById('task-list');
        if (!taskList) return;
        taskList.innerHTML = '';

        state.tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.done ? 'task-done' : ''}`;
            li.innerHTML = `
                <div style="display: flex; align-items: center; flex: 1;">
                    <input type="checkbox" class="task-check" ${task.done ? 'checked' : ''} onchange="toggleTask(${task.id})">
                    <span class="task-text">${task.desc}</span>
                </div>
                <button onclick="deleteTask(${task.id})" class="btn-delete" style="padding: 4px 8px;" title="Excluir">
                    <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                </button>
            `;
            taskList.appendChild(li);
        });
        lucide.createIcons();
    };

    // --- Gerenciamento de Categorias (Settings) ---
    const renderCategorySettings = () => {
        const list = document.getElementById('settings-category-list');
        list.innerHTML = '';
        state.categories.forEach(cat => {
            const li = document.createElement('li');
            li.className = 'settings-category-item';
            li.innerHTML = `
                <div>
                    <span class="color-preview" style="background-color: ${cat.color}"></span>
                    <span>${cat.name}</span>
                </div>
                <button type="button" onclick="deleteCategory(${cat.id})" class="btn-delete" style="padding: 4px 8px;">
                    <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                </button>
            `;
            list.appendChild(li);
        });
        lucide.createIcons();
    };

    const renderCategoryOptions = () => {
        categoryInput.innerHTML = '';
        state.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.name;
            option.innerText = cat.name;
            categoryInput.appendChild(option);
        });
    };

    window.addNewCategory = () => {
        const name = newCatNameInput.value;
        const color = newCatColorInput.value;
        if (name) {
            state.categories.push({ id: Date.now(), name, color });
            saveData();
            newCatNameInput.value = '';
            renderCategorySettings();
            renderCategoryOptions();
        }
    };

    window.deleteCategory = (id) => {
        state.categories = state.categories.filter(c => c.id !== id);
        saveData();
        renderCategorySettings();
        renderCategoryOptions();
    };

    // --- Event Listeners e Handlers ---

    // 1. Salvar Configurações (Salário)
    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const salary = parseFloat(salaryInput.value);
        if (!isNaN(salary)) {
            state.salary = salary;
            saveData();
            settingsModal.close();
        }
    });

    // 2. Criar Nova Meta
    goalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = goalNameInput.value;
        const target = parseFloat(goalTargetInput.value);

        if (name && target > 0) {
            state.goals.push({
                id: Date.now(),
                name,
                target,
                current: 0
            });
            saveData();
            goalForm.reset();
            renderGoalsManager();
            goalModal.close();
        }
    });

    // 3. Transações (Adicionar/Editar)
    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const description = descInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const type = typeInput.value;
        const category = categoryInput.value;
        const index = editIndexInput.value;

        if (!description || isNaN(amount) || amount <= 0) { 
            return;
        }

        const transactionData = { description, amount, type, category, date: new Date().toISOString() };

        if (index === '') {
            state.transactions.push(transactionData);
        } else {
            state.transactions[index] = { ...state.transactions[index], ...transactionData };
            editIndexInput.value = '';
            submitBtn.innerText = 'Adicionar';
            submitBtn.style.backgroundColor = 'var(--success)';
        }
        
        saveData();
        transactionForm.reset();
        transactionModal.close();
    });

    // 4. Criar Tarefa
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const desc = taskDescInput.value;
        if (desc) {
            state.tasks.push({
                id: Date.now(),
                desc,
                done: false
            });
            saveData();
            taskForm.reset();
            taskModal.close();
        }
    });

    // 5. Exportar JSON (Backup)
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', () => {
            const totals = calculateTotals();
            const report = {
                instrucoes_ia: "CONTEXTO: Este arquivo JSON é um backup do meu Dashboard Financeiro. " +
                    "COMO USAR: 1. Analise 'transacoes' e 'metas' para me dar insights. " +
                    "2. GERAÇÃO DE DADOS: Se eu pedir algo como 'Incluir gasolina e faculdade no valor', " +
                    "gere um JSON de resposta contendo apenas as novas entradas na chave 'transacoes' (com id, description, amount, type='saida', category='Outros' ou a mais adequada, e date), " +
                    "para que eu possa importar esse trecho no meu sistema." + 
                    "Sempre gere o arquivo JSON para download.",
                timestamp: new Date().toISOString(),
                resumo: totals,
                transacoes: state.transactions,
                metas: state.goals,
                tarefas: state.tasks,
                categorias: state.categories
            };
            
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard-financeiro-${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // 6. Importar Backup (JSON)
    if (importFileInput) {
        importFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    // Restaura o estado
                    if (data.transacoes) state.transactions = data.transacoes;
                    if (data.metas) state.goals = data.metas;
                    if (data.tarefas) state.tasks = data.tarefas;
                    if (data.categorias) state.categories = data.categorias;
                    
                    // Salva e atualiza
                    saveData();
                    alert('Backup restaurado com sucesso!');
                    settingsModal.close();
                } catch (error) {
                    console.error('Erro ao importar JSON:', error);
                    alert('Erro ao ler o arquivo de backup.');
                }
            };
            reader.readAsText(file);
            // Limpa o input para permitir selecionar o mesmo arquivo novamente
            e.target.value = '';
        });
    }

    // 7. Gerar Planilha Excel (Python)
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', async () => {
            const reportData = {
                transactions: state.transactions,
                goals: state.goals,
                tasks: state.tasks,
                salary: state.salary
            };

            try {
                const response = await fetch(`${API_URL}/generate_excel`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reportData)
                });
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `relatorio_financeiro_avancado.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } catch (error) {
                console.error('Erro ao gerar Excel:', error);
                alert('Erro ao conectar com o servidor Python para gerar o Excel.');
            }
        });
    }

    // Resetar formulário ao fechar modal
    transactionModal.addEventListener('close', () => {
        transactionForm.reset();
        editIndexInput.value = '';
        submitBtn.innerText = 'Adicionar';
        submitBtn.style.backgroundColor = 'var(--success)';
    });

    // --- Funções Globais (Window) ---

    // Investir na Meta
    window.depositToGoal = (id) => {
        const goal = state.goals.find(g => g.id === id);
        if (!goal) return;

        const amountStr = window.prompt(`Quanto deseja investir em "${goal.name}"?`);
        if (!amountStr) return;

        const amount = parseFloat(amountStr.replace(',', '.'));
        if (isNaN(amount) || amount <= 0) return;

        const totals = calculateTotals();
        if (amount > totals.availableBalance) return;

        goal.current += amount;
        saveData();
        renderGoalsManager(); // Atualiza a lista no modal
    };

    window.deleteGoal = (id) => {
        state.goals = state.goals.filter(g => g.id !== id);
        if (state.pinnedGoalId == id) state.pinnedGoalId = null;
        saveData();
        renderGoalsManager();
    };

    window.togglePin = (id) => {
        state.pinnedGoalId = (state.pinnedGoalId == id) ? null : id;
        saveData();
        renderGoalsManager(); // Atualiza ícones no modal
        // renderPinnedGoal já é chamado no saveData -> updateDashboard
    };

    window.editTransaction = (index) => {
        const item = state.transactions[index];
        descInput.value = item.description;
        amountInput.value = item.amount;
        typeInput.value = item.type;
        categoryInput.value = item.category;
        editIndexInput.value = index;
        
        submitBtn.innerText = 'Atualizar';
        submitBtn.style.backgroundColor = '#fdcb6e';
        transactionModal.showModal();
    };

    window.deleteTransaction = (index) => {
        state.transactions.splice(index, 1);
        saveData();
    };

    window.toggleTask = (id) => {
        const task = state.tasks.find(t => t.id === id);
        if (task) {
            task.done = !task.done;
            saveData();
        }
    };

    window.deleteTask = (id) => {
        state.tasks = state.tasks.filter(t => t.id !== id);
        saveData();
    };

    // Atualiza a lista de categorias ao abrir o modal de settings
    const settingsBtn = document.querySelector('.navbar-actions button');
    if(settingsBtn) {
        settingsBtn.onclick = () => {
            renderCategorySettings();
            settingsModal.showModal();
        }
    }

    // Event Listener para o botão da IA
    if (btnAnalyze) btnAnalyze.addEventListener('click', askAiAnalysis);

    // --- Navegação Suave (JS) ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            if (targetId === '#') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // --- Inicialização ---
    salaryInput.value = state.salary || '';
    updateDashboard(); // Carrega do localStorage
});