# 🚀 Tutorial: Como Hospedar o ComexFlow no GitHub Pages Gratuitamente

Este guia ensina a colocar o **ComexFlow** no ar em menos de **2 minutos**, de forma **100% gratuita** e **sem precisar instalar Git ou linhas de comando**.

Como o ComexFlow foi desenvolvido em tecnologia Web Nativa (HTML5 + JavaScript moderno + CDN), ele roda direto na infraestrutura do GitHub Pages com **zero custo de servidor e zero configuração de build**.

---

## Método Mais Rápido: Pelo Navegador (Sem Instalar Nada)

### Passo 1: Criar o Repositório no GitHub
1. Acesse [github.com](https://github.com) e faça login na sua conta (se não tiver, crie uma gratuitamente).
2. No canto superior direito, clique no botão **`+`** e selecione **`New repository`**.
3. Preencha os campos:
   - **Repository name:** `comexflow` (ou o nome que preferir).
   - **Visibility:** Escolha **`Public`** (o GitHub Pages gratuito exige que seja público).
   - Não precisa marcar "Add a README file" agora.
4. Clique no botão verde **`Create repository`**.

---

### Passo 2: Fazer o Upload dos Arquivos
1. Na tela do repositório recém-criado, clique no link azul que diz:  
   👉 **`uploading an existing file`**
2. Abra a pasta do seu computador onde o ComexFlow foi gerado:  
   📂 `C:\Users\joaoz\.gemini\antigravity\scratch\comexflow-saas\`
3. **Selecione e arraste** para dentro da janela do GitHub:
   - `index.html`
   - A pasta `css` (com `main.css`)
   - A pasta `js` (com todos os arquivos `.js`)
   - `README.md`
4. Na parte de baixo da página, no campo **Commit changes**, clique no botão verde **`Commit changes`**.
5. Aguarde alguns segundos enquanto o GitHub processa os arquivos.

---

### Passo 3: Ativar o GitHub Pages
1. No menu superior do seu repositório, clique na aba **`Settings`** (ícone de engrenagem).
2. Na barra lateral esquerda, clique em **`Pages`** (sob a seção *Code and automation*).
3. Na seção **Build and deployment**:
   - Em **Source**, deixe selecionado **`Deploy from a branch`**.
   - Em **Branch**, clique onde diz `None`, escolha **`main`** (ou `master`) e deixe a pasta como **`/(root)`**.
   - Clique no botão **`Save`**.

---

### Passo 4: Pronto! Seu Site Está no Ar 🎉
- Aguarde cerca de **30 a 60 segundos**.
- Atualize a página do *Settings > Pages*. No topo aparecerá uma caixa colorida com o link oficial do seu sistema:
  👉 **`https://SEU_USUARIO.github.io/comexflow/`**
- Você e sua irmã já podem abrir esse link em qualquer navegador (computador, celular ou tablet).

---

## Como Testar Agora no seu Computador (Antes de subir no GitHub)

Você não precisa esperar subir no GitHub para testar:
1. Abra o Explorador de Arquivos do Windows e vá até:  
   `C:\Users\joaoz\.gemini\antigravity\scratch\comexflow-saas\`
2. Dê **dois cliques** no arquivo `index.html`.
3. Ele vai abrir instantaneamente no seu Google Chrome ou Microsoft Edge, funcionando com todas as funcionalidades ativas!

---

## Como Funciona o Salvamento de Dados?
- Tudo o que for digitado, importado ou alterado é **salvo automaticamente no LocalStorage** do próprio navegador.
- Se você ou sua irmã fecharem o navegador, reiniciarem o computador ou derem F5, **nada é perdido**.
- Se precisarem transferir os dados para outro computador, basta clicar no ícone de engrenagem no canto superior direito e escolher **"Exportar Backup (JSON)"**. No outro computador, use **"Restaurar Backup"**.
