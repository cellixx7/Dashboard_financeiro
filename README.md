# Dashboard Financeiro

Um painel de controle financeiro pessoal moderno e responsivo, desenvolvido para auxiliar no gerenciamento de receitas, despesas e metas financeiras.

## 🎨 Visão Geral

O projeto apresenta uma interface em **Dark Mode** (modo escuro) focada na usabilidade e visualização clara dos dados. O design utiliza uma paleta de cores contrastante com destaque para verde (sucesso/entradas), vermelho (perigo/saídas) e roxo (destaque/metas).

## ✨ Funcionalidades

Com base na estrutura de estilos do projeto, as principais funcionalidades incluem:

- **Resumo Financeiro**: Cards informativos exibindo Entradas, Saídas e Saldo Total.
- **Gestão de Transações**: Tabela completa para listagem de movimentações financeiras com opções de edição e exclusão.
- **Metas Financeiras (Goals)**:
  - Criação e acompanhamento de metas com barras de progresso.
  - **Meta Fixada**: Barra de progresso destacada no topo da navegação para foco na meta principal.
- **Gráficos**: Área dedicada (`.chart-container`) para visualização analítica de dados.
- **Lista de Tarefas**: Widget de tarefas (To-do list) integrado para controle de pendências.
- **Categorias e Tags**:
  - Sistema de gerenciamento de categorias com seletor de ícones e cores.
  - Sistema de tags para organização granular das transações.
- **Interface Interativa**:
  - Modais para adição e edição de registros.
  - Tooltips informativos.
  - Animações suaves de entrada e transição.

## 🛠️ Tecnologias e Estilização

- **HTML5 & CSS3**: Estrutura e design.
- **Design System**:
  - Fonte: 'Poppins', sans-serif.
  - Layout: Utilização de **CSS Grid** e **Flexbox**.
  - Responsividade: Adaptação para dispositivos móveis.

## 🎨 Personalização (CSS)

As cores e temas são gerenciados através de variáveis CSS na raiz do arquivo `styles.css`, facilitando a manutenção:

```css
:root {
    --primary: #ffffff;      /* Texto Principal */
    --success: #00b894;      /* Indicadores de Receita/Sucesso */
    --danger: #d63031;       /* Indicadores de Despesa/Erro */
    --bg: #151818;           /* Fundo da Página */
    --card-bg: #1e2222;      /* Fundo dos Cards/Módulos */
    --border-color: #2d3436; /* Bordas sutis */
}
```

## 🚀 Como Executar

1. Clone este repositório.
2. Abra o arquivo `index.html` (arquivo principal da aplicação) em seu navegador.

## 📂 Estrutura de Arquivos

- `styles.css`: Contém todas as regras de estilo, incluindo reset, componentes (navbar, cards, tabelas), animações e utilitários.
- `index.html`: Estrutura do dashboard (presumido).
- `script.js`: Lógica da aplicação (presumido).
