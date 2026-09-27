# 🚢 ComexFlow - Plataforma de Despacho Aduaneiro & Exportação

O **ComexFlow** é um software desenhado para automatizar todo o fluxo operacional de exportação marítima (Despacho Aduaneiro), eliminando cálculos manuais em planilhas e a digitação repetitiva de documentos.

---

## ✨ Principais Funcionalidades

1. **Painel de Prazos Críticos (Deadlines em Tempo Real):**
   - Contagem regressiva em tempo real para **Deadline de Draft** e **Deadline de Carga no Porto**.
   - Alertas visuais inteligentes:
     - 🟢 **Verde:** Prazo seguro (> 24h)
     - 🟡 **Amarelo:** Atenção iminente (< 24h)
     - 🔴 **Vermelho:** Crítico (< 6h) ou Vencido com efeito pulsante.
   - Checklist de "Enviado ao Armador" e "Entregue no Porto".

2. **Leitor de Notas Fiscais (NF-e XML):**
   - Arraste e solte múltiplos arquivos XML de uma vez.
   - Extrai automaticamente Shipper/Exportador, NCM, produtos, valores, pesos e quantidades.

3. **Calculadora Automática de Cubagem & Carga:**
   - Cálculo instantâneo de peças por pallet e volume em metros cúbicos ($m^3$) a partir das dimensões em milímetros.
   - Cálculo do valor da mercadoria em USD por $m^3$ ou por unidade.
   - Totalizadores gerais em tempo real (containers, pallets, chapas, $m^3$, pesos e USD).

4. **Validador de VGM (Verified Gross Mass - Convenção SOLAS):**
   - Soma automática: $\text{Peso Bruto da Carga} + \text{Tara do Container}$.
   - Validação contra o limite de **Payload** (padrão 32.500 kg).
   - Alerta visual imediato caso o container exceda o limite de segurança, prevenindo multas e rolagem de carga no porto.

5. **Geração de Documentos Oficiais em 1 Clique:**
   - **Commercial Invoice:** Com layout internacional, valores, pesos e NCM.
   - **Packing List (Romaneio):** Com especificação física completa e declaração de tratamento de madeira HT / NIMF 15.
   - **Draft do BL (Shipping Instruction):** Pronto para envio ao armador, sem valores comerciais, com RUC, DU-E e cláusula de frete.
   - **Declaração de VGM:** Relatório oficial de pesagem para o terminal portuário.
   - **Ações:** Imprimir / Salvar em PDF (A4 perfeito), Copiar Texto ou Exportar para Excel (`.xlsx`).

6. **Persistência Total Local (Zero Perda de Dados):**
   - Utiliza `localStorage` nativo do navegador. Fechar a página ou reiniciar o computador não apaga nada.
   - Separação entre embarques **Em Andamento** e **Concluídos/Histórico**.
   - Ferramenta de **Exportar/Importar Backup em JSON** para sincronizar entre máquinas.

---

## 🚀 Como Executar

- **Localmente:** Basta abrir o arquivo `index.html` em qualquer navegador moderno.
- **Na Nuvem (GitHub Pages):** Siga o guia em [TUTORIAL_GITHUB_PAGES.md](TUTORIAL_GITHUB_PAGES.md).
