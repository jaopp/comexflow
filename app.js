/**
 * ComexFlow - Controlador Principal da Aplicação (App.js)
 * Orquestra interface, eventos, reatividade em tempo real, cálculos e persistência.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Inicializa ícones Lucide
  if (window.lucide) {
    lucide.createIcons();
  }

  // Estado da aplicação
  let currentDocType = 'invoice';
  let autoSaveTimeout = null;

  // Obtém o embarque ativo atual (se houver no LocalStorage)
  let currentShipment = comexStorage.getCurrentShipment();

  // Elementos do DOM
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');
  const docSubTabs = document.querySelectorAll('.doc-subtab');

  // ==========================================
  // NAVEGAÇÃO ENTRE ABAS
  // ==========================================
  function switchTab(targetTabId) {
    navTabs.forEach(tab => {
      const isTarget = tab.dataset.tab === targetTabId;
      tab.classList.toggle('active', isTarget);
      tab.classList.toggle('text-blue-400', isTarget);
      tab.classList.toggle('border-b-2', isTarget);
      tab.classList.toggle('border-blue-500', isTarget);
      tab.classList.toggle('bg-slate-900', isTarget);
      tab.classList.toggle('text-slate-400', !isTarget);
    });

    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === targetTabId);
    });

    if (targetTabId === 'tab-documents') {
      renderCurrentDocument();
    } else if (targetTabId === 'tab-dashboard') {
      renderDashboardList();
    } else if (targetTabId === 'tab-history') {
      renderHistoryList();
    }

    if (window.lucide) lucide.createIcons();
  }

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // ==========================================
  // RENDERIZAÇÃO E FORMULÁRIOS
  // ==========================================
  function clearForm() {
    const inputIds = [
      'inp-booking-num', 'inp-carrier', 'inp-contract-num', 'inp-vessel', 'inp-voyage',
      'inp-pol', 'inp-pod', 'inp-deadline-draft', 'inp-deadline-cargo',
      'inp-shipper-name', 'inp-shipper-address', 'inp-shipper-taxid',
      'inp-consignee-name', 'inp-consignee-address', 'inp-consignee-taxid',
      'inp-notify-name', 'inp-notify-address', 'inp-notify-taxid',
      'inp-ncm', 'inp-due', 'inp-ruc'
    ];
    inputIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const freight = document.getElementById('inp-freight-term');
    if (freight) freight.value = 'Prepaid';

    updateDraftButtonUI(false);
    updateCargoButtonUI(false);

    renderContainersList();
    renderNfeItemsTable();
    renderCurrentDocument();
    updateStickySummary();
    updateDeadlineCards();
  }

  function populateForm(shipment) {
    if (!shipment) {
      clearForm();
      return;
    }
    const b = shipment.booking || {};

    // Booking & Embarque
    document.getElementById('inp-booking-num').value = b.bookingNumber || '';
    document.getElementById('inp-carrier').value = b.carrier || '';
    document.getElementById('inp-contract-num').value = b.contractNumber || '';
    document.getElementById('inp-vessel').value = b.vessel || '';
    document.getElementById('inp-voyage').value = b.voyage || '';
    document.getElementById('inp-pol').value = b.pol || '';
    document.getElementById('inp-pod').value = b.pod || '';
    document.getElementById('inp-deadline-draft').value = b.draftDeadline || '';
    document.getElementById('inp-deadline-cargo').value = b.cargoDeadline || '';

    // Partes
    document.getElementById('inp-shipper-name').value = b.shipper?.name || '';
    document.getElementById('inp-shipper-address').value = b.shipper?.address || '';
    document.getElementById('inp-shipper-taxid').value = b.shipper?.taxId || '';

    document.getElementById('inp-consignee-name').value = b.consignee?.name || '';
    document.getElementById('inp-consignee-address').value = b.consignee?.address || '';
    document.getElementById('inp-consignee-taxid').value = b.consignee?.taxId || '';

    document.getElementById('inp-notify-name').value = b.notify?.name || '';
    document.getElementById('inp-notify-address').value = b.notify?.address || '';
    document.getElementById('inp-notify-taxid').value = b.notify?.taxId || '';

    // Aduaneiro
    document.getElementById('inp-ncm').value = b.ncm || '';
    document.getElementById('inp-due').value = b.dueNumber || '';
    document.getElementById('inp-ruc').value = b.rucNumber || '';
    document.getElementById('inp-freight-term').value = b.freightTerm || 'Prepaid';

    // Status dos botões de checklist
    updateDraftButtonUI(b.draftSent);
    updateCargoButtonUI(b.cargoDelivered);

    // Containers e NFs
    renderContainersList();
    renderNfeItemsTable();
    updateStickySummary();
    updateDeadlineCards();
  }

  // Captura alterações em campos de texto e salva com debounce
  function bindInputAutoSave() {
    const inputIds = [
      'inp-booking-num', 'inp-carrier', 'inp-contract-num', 'inp-vessel', 'inp-voyage',
      'inp-pol', 'inp-pod', 'inp-deadline-draft', 'inp-deadline-cargo',
      'inp-shipper-name', 'inp-shipper-address', 'inp-shipper-taxid',
      'inp-consignee-name', 'inp-consignee-address', 'inp-consignee-taxid',
      'inp-notify-name', 'inp-notify-address', 'inp-notify-taxid',
      'inp-ncm', 'inp-due', 'inp-ruc', 'inp-freight-term'
    ];

    inputIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', triggerAutoSave);
      }
    });
  }

  function triggerAutoSave() {
    const indicator = document.getElementById('autosave-indicator');
    if (indicator) indicator.textContent = 'Salvando...';

    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      saveFormDataToCurrentShipment();
      if (indicator) indicator.textContent = 'Salvo localmente';
      updateStickySummary();
      updateDeadlineCards();
    }, 400);
  }

  function saveFormDataToCurrentShipment() {
    if (!currentShipment) return;

    // Se o embarque atual foi excluído do storage, não o recria
    if (!comexStorage.getShipmentById(currentShipment.id)) {
      return;
    }

    currentShipment.booking = currentShipment.booking || {};
    const b = currentShipment.booking;

    b.bookingNumber = document.getElementById('inp-booking-num').value.trim();
    b.carrier = document.getElementById('inp-carrier').value.trim();
    b.contractNumber = document.getElementById('inp-contract-num').value.trim();
    b.vessel = document.getElementById('inp-vessel').value.trim();
    b.voyage = document.getElementById('inp-voyage').value.trim();
    b.pol = document.getElementById('inp-pol').value.trim();
    b.pod = document.getElementById('inp-pod').value.trim();
    b.draftDeadline = document.getElementById('inp-deadline-draft').value;
    b.cargoDeadline = document.getElementById('inp-deadline-cargo').value;

    b.shipper = {
      name: document.getElementById('inp-shipper-name').value.trim(),
      address: document.getElementById('inp-shipper-address').value.trim(),
      taxId: document.getElementById('inp-shipper-taxid').value.trim()
    };

    b.consignee = {
      name: document.getElementById('inp-consignee-name').value.trim(),
      address: document.getElementById('inp-consignee-address').value.trim(),
      taxId: document.getElementById('inp-consignee-taxid').value.trim()
    };

    b.notify = {
      name: document.getElementById('inp-notify-name').value.trim(),
      address: document.getElementById('inp-notify-address').value.trim(),
      taxId: document.getElementById('inp-notify-taxid').value.trim()
    };

    b.ncm = document.getElementById('inp-ncm').value.trim();
    b.dueNumber = document.getElementById('inp-due').value.trim();
    b.rucNumber = document.getElementById('inp-ruc').value.trim();
    b.freightTerm = document.getElementById('inp-freight-term').value;

    if (b.bookingNumber) {
      currentShipment.title = `Embarque ${b.bookingNumber} (${b.carrier || 'Navio'})`;
    }

    comexStorage.saveShipment(currentShipment);
  }

  // ==========================================
  // RENDERIZAÇÃO DE CONTAINERS & VGM
  // ==========================================
  function renderContainersList() {
    const listEl = document.getElementById('containers-list');
    if (!listEl) return;

    if (!currentShipment) {
      listEl.innerHTML = `
        <div class="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
          Nenhum embarque ativo. Clique em "Novo Embarque" ou "Carregar Teste".
        </div>
      `;
      const badge = document.getElementById('badge-container-count');
      if (badge) badge.textContent = '0';
      return;
    }

    const containers = currentShipment.containers || [];
    document.getElementById('badge-container-count').textContent = containers.length;

    if (containers.length === 0) {
      listEl.innerHTML = `
        <div class="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
          Nenhum container adicionado ainda. Clique em "Adicionar Container" acima.
        </div>
      `;
      return;
    }

    listEl.innerHTML = containers.map((cnt, idx) => {
      const calc = ComexCalculations.calculateContainer(cnt);
      const isOver = calc.isOverweight;

      return `
        <div class="bg-white rounded-xl border ${isOver ? 'border-rose-400 shadow-rose-100' : 'border-slate-200'} p-5 shadow-sm space-y-4" data-index="${idx}">
          
          <!-- Cabeçalho do Container -->
          <div class="flex flex-wrap items-center justify-between pb-3 border-b border-slate-200 gap-2">
            <div class="flex items-center space-x-3">
              <span class="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                ${idx + 1}
              </span>
              <div>
                <h4 class="font-bold text-sm text-slate-800 font-mono">
                  ${cnt.containerNumber || `Container #${idx + 1} (Número Pendente)`}
                </h4>
                <span class="text-xs text-slate-500">Lacre: ${cnt.sealNumber || 'TBA'} • Tipo: ${cnt.containerType || "40' HC"}</span>
              </div>
            </div>

            <!-- Status do VGM / Payload -->
            <div class="flex items-center space-x-2">
              ${isOver 
                ? `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300 animate-pulse">
                     ⚠️ EXCESSO: +${calc.overweightKg.toLocaleString()} kg além do Payload!
                   </span>`
                : `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                     ✅ VGM: ${calc.vgmKg.toLocaleString()} kg (${calc.payloadUsagePercent}% do limite)
                   </span>`
              }
              <button class="btn-duplicate-cnt p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition" data-index="${idx}" title="Duplicar este container">
                <i data-lucide="copy" class="w-4 h-4"></i>
              </button>
              <button class="btn-delete-cnt p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition" data-index="${idx}" title="Remover container">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <!-- Campos de Entrada do Container -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Identificação / Nº Container</label>
              <input type="text" class="w-full p-2 border border-slate-300 rounded font-mono cnt-input" data-index="${idx}" data-field="containerNumber" value="${cnt.containerNumber || ''}" placeholder="Ex: MSKU 928374-1">
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Número do Lacre (Seal)</label>
              <input type="text" class="w-full p-2 border border-slate-300 rounded font-mono cnt-input" data-index="${idx}" data-field="sealNumber" value="${cnt.sealNumber || ''}" placeholder="Ex: ML-BR99812">
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Tipo de Container</label>
              <select class="w-full p-2 border border-slate-300 rounded bg-white cnt-input" data-index="${idx}" data-field="containerType">
                <option value="40' HC" ${cnt.containerType === "40' HC" ? 'selected' : ''}>40' High Cube (Padrão Madeira)</option>
                <option value="20' DC" ${cnt.containerType === "20' DC" ? 'selected' : ''}>20' Dry Container</option>
                <option value="40' DC" ${cnt.containerType === "40' DC" ? 'selected' : ''}>40' Dry Container</option>
                <option value="40' Open Top" ${cnt.containerType === "40' Open Top" ? 'selected' : ''}>40' Open Top</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-600 mb-1">Tara do Container (kg)</label>
              <input type="number" class="w-full p-2 border border-slate-300 rounded font-mono cnt-input" data-index="${idx}" data-field="tareWeight" value="${cnt.tareWeight || 3800}">
            </div>
          </div>

          <!-- Grade de Medidas, Peças e Cubagem -->
          <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Qtd. Pallets</label>
              <input type="number" class="w-full p-2 border border-slate-300 rounded font-mono bg-white cnt-input" data-index="${idx}" data-field="palletsCount" value="${cnt.palletsCount || 20}">
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Chapas / Pallet</label>
              <input type="number" class="w-full p-2 border border-slate-300 rounded font-mono bg-white cnt-input" data-index="${idx}" data-field="sheetsPerPallet" value="${cnt.sheetsPerPallet || 40}">
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Comprimento (mm)</label>
              <input type="number" class="w-full p-2 border border-slate-300 rounded font-mono bg-white cnt-input" data-index="${idx}" data-field="lengthMm" value="${cnt.lengthMm || 2440}">
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Largura (mm)</label>
              <input type="number" class="w-full p-2 border border-slate-300 rounded font-mono bg-white cnt-input" data-index="${idx}" data-field="widthMm" value="${cnt.widthMm || 1220}">
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Espessura (mm)</label>
              <input type="number" class="w-full p-2 border border-slate-300 rounded font-mono bg-white cnt-input" data-index="${idx}" data-field="thicknessMm" value="${cnt.thicknessMm || 15}">
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Preço/m³ (USD)</label>
              <input type="number" step="0.01" class="w-full p-2 border border-slate-300 rounded font-mono bg-white cnt-input" data-index="${idx}" data-field="unitPriceUsd" value="${cnt.unitPriceUsd || 300}">
            </div>
          </div>

          <!-- Pesos e Resultado de Cálculos -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-100/70 p-3 rounded-lg border border-slate-200">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Peso Líquido Carga (kg)</label>
              <input type="number" step="0.01" class="w-full p-2 border border-slate-300 rounded font-mono bg-white cnt-input" data-index="${idx}" data-field="netWeightKg" value="${cnt.netWeightKg || 25000}">
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Peso Bruto Carga (kg)</label>
              <input type="number" step="0.01" class="w-full p-2 border border-slate-300 rounded font-mono bg-white cnt-input" data-index="${idx}" data-field="grossWeightKg" value="${cnt.grossWeightKg || 25800}">
            </div>
            <div class="flex flex-col justify-center">
              <span class="text-slate-500 text-[10px] uppercase font-semibold">Volume Calculado:</span>
              <span class="text-sm font-bold font-mono text-slate-800">${calc.totalVolumeM3.toFixed(3)} m³ (${calc.totalSheets} peças)</span>
            </div>
            <div class="flex flex-col justify-center">
              <span class="text-slate-500 text-[10px] uppercase font-semibold">Valor em USD:</span>
              <span class="text-sm font-bold font-mono text-blue-700">$${calc.totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <!-- Barra de Progresso de Payload -->
          <div>
            <div class="flex justify-between text-[11px] text-slate-500 mb-1">
              <span>Uso do Payload (Máx ${calc.maxPayloadKg.toLocaleString()} kg):</span>
              <span class="font-mono font-semibold ${isOver ? 'text-rose-600 font-bold' : 'text-slate-700'}">${calc.vgmKg.toLocaleString()} kg (${calc.payloadUsagePercent}%)</span>
            </div>
            <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-300 ${isOver ? 'bg-rose-500' : 'bg-blue-600'}" style="width: ${Math.min(100, calc.payloadUsagePercent)}%"></div>
            </div>
          </div>

        </div>
      `;
    }).join('');

    // Adiciona ouvintes para inputs de containers
    document.querySelectorAll('.cnt-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const index = parseInt(e.target.dataset.index, 10);
        const field = e.target.dataset.field;
        let value = e.target.value;

        if (['palletsCount', 'sheetsPerPallet', 'lengthMm', 'widthMm', 'thicknessMm'].includes(field)) {
          value = parseInt(value, 10) || 0;
        } else if (['tareWeight', 'maxPayload', 'unitPriceUsd', 'netWeightKg', 'grossWeightKg'].includes(field)) {
          value = parseFloat(value) || 0;
        }

        currentShipment.containers[index][field] = value;
        triggerAutoSave();
        renderContainersList();
      });
    });

    // Ouvintes para duplicar / deletar container
    document.querySelectorAll('.btn-duplicate-cnt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(btn.dataset.index, 10);
        const copy = JSON.parse(JSON.stringify(currentShipment.containers[index]));
        copy.id = 'cnt_' + Date.now();
        copy.containerNumber = '';
        copy.sealNumber = '';
        currentShipment.containers.splice(index + 1, 0, copy);
        comexStorage.saveShipment(currentShipment);
        renderContainersList();
        updateStickySummary();
      });
    });

    document.querySelectorAll('.btn-delete-cnt').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(btn.dataset.index, 10);
        if (confirm('Deseja realmente remover este container?')) {
          currentShipment.containers.splice(index, 1);
          comexStorage.saveShipment(currentShipment);
          renderContainersList();
          updateStickySummary();
        }
      });
    });

    if (window.lucide) lucide.createIcons();
  }

  // Adicionar novo container
  document.getElementById('btn-add-container')?.addEventListener('click', () => {
    if (!currentShipment) {
      currentShipment = comexStorage.createNewShipment('Novo Embarque');
      populateForm(currentShipment);
    }
    currentShipment.containers = currentShipment.containers || [];
    currentShipment.containers.push({
      id: 'cnt_' + Date.now(),
      containerNumber: '',
      sealNumber: '',
      containerType: "40' HC",
      tareWeight: 3800,
      maxPayload: 32500,
      palletsCount: 20,
      sheetsPerPallet: 40,
      lengthMm: 2440,
      widthMm: 1220,
      thicknessMm: 15,
      unitPriceUsd: 300,
      netWeightKg: 25000,
      grossWeightKg: 25800,
      woodTreatedHT: true
    });
    comexStorage.saveShipment(currentShipment);
    renderContainersList();
    updateStickySummary();
  });

  // ==========================================
  // NOTAS FISCAIS (XML) & DRAG-AND-DROP
  // ==========================================
  const dropZoneXml = document.getElementById('drop-zone-xml');
  const inputFileXml = document.getElementById('input-file-xml');

  if (dropZoneXml && inputFileXml) {
    dropZoneXml.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZoneXml.classList.add('border-blue-500', 'bg-blue-50/50');
    });

    dropZoneXml.addEventListener('dragleave', () => {
      dropZoneXml.classList.remove('border-blue-500', 'bg-blue-50/50');
    });

    dropZoneXml.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropZoneXml.classList.remove('border-blue-500', 'bg-blue-50/50');
      if (e.dataTransfer.files?.length) {
        await processUploadedXmls(e.dataTransfer.files);
      }
    });

    inputFileXml.addEventListener('change', async (e) => {
      if (e.target.files?.length) {
        await processUploadedXmls(e.target.files);
      }
    });
  }

  async function processUploadedXmls(fileList) {
    const parsedList = await ComexXmlParser.readMultipleXmlFiles(fileList);
    if (parsedList.length === 0) {
      alert('Nenhum arquivo XML válido encontrado.');
      return;
    }

    if (!currentShipment) {
      currentShipment = comexStorage.createNewShipment('Embarque Importado NF-e');
    }

    currentShipment.nfeItems = currentShipment.nfeItems || [];

    parsedList.forEach(xmlData => {
      if (!xmlData.success) return;

      // Se o exportador estiver em branco no booking, preenche automaticamente do XML
      if (!currentShipment.booking.shipper?.name && xmlData.emit?.name) {
        currentShipment.booking.shipper = {
          name: xmlData.emit.name,
          address: xmlData.emit.address,
          taxId: xmlData.emit.cnpj
        };
      }

      // Se NCM em branco, preenche do XML
      if (!currentShipment.booking.ncm && xmlData.dominantNcm) {
        currentShipment.booking.ncm = xmlData.dominantNcm;
      }

      // Adiciona itens
      xmlData.items.forEach(it => {
        currentShipment.nfeItems.push({
          nfeNumber: xmlData.nNF,
          ...it
        });
      });
    });

    comexStorage.saveShipment(currentShipment);
    populateForm(currentShipment);
    alert(`${parsedList.length} Nota(s) Fiscal(is) importada(s) com sucesso!`);
  }

  function renderNfeItemsTable() {
    const tbody = document.getElementById('tbody-nfe-items');
    const summaryText = document.getElementById('nfe-summary-text');
    const badgeCount = document.getElementById('badge-nfe-count');
    const items = currentShipment ? (currentShipment.nfeItems || []) : [];

    if (badgeCount) {
      badgeCount.textContent = items.length;
      badgeCount.classList.toggle('hidden', items.length === 0);
    }

    if (summaryText) {
      summaryText.textContent = `${items.length} item(ns) importado(s)`;
    }

    if (!tbody) return;

    if (items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="p-8 text-center text-slate-400 italic">
            Nenhuma nota fiscal importada ainda. Arraste os XMLs acima ou use o botão "Carregar Teste".
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = items.map(item => `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-3 font-mono font-bold text-blue-600">${item.nfeNumber || 'NF-e'}</td>
        <td class="p-3 font-mono text-slate-600">${item.cProd || '--'}</td>
        <td class="p-3 font-medium text-slate-800">${item.xProd || 'Produto sem descrição'}</td>
        <td class="p-3 font-mono text-slate-700">${item.ncm || '--'}</td>
        <td class="p-3 text-right font-mono font-semibold">${item.qCom?.toLocaleString() || 0}</td>
        <td class="p-3 text-right text-slate-500">${item.uCom || 'UN'}</td>
        <td class="p-3 text-right font-mono">R$ ${(item.vUnCom || 0).toFixed(2)}</td>
        <td class="p-3 text-right font-mono font-bold text-slate-900">R$ ${(item.vProd || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('');
  }

  // ==========================================
  // DEADLINES & CONTAGEM REGRESSIVA (TEMPO REAL)
  // ==========================================
  function updateDeadlineCards() {
    const badgeDraft = document.getElementById('badge-status-draft');
    const textDateDraft = document.getElementById('text-date-draft');
    const countdownDraft = document.getElementById('countdown-draft');
    const cardDraft = document.getElementById('card-deadline-draft');

    const badgeCargo = document.getElementById('badge-status-cargo');
    const textDateCargo = document.getElementById('text-date-cargo');
    const countdownCargo = document.getElementById('countdown-cargo');
    const cardCargo = document.getElementById('card-deadline-cargo');

    if (!currentShipment) {
      if (badgeDraft) {
        badgeDraft.textContent = 'Sem Embarque';
        badgeDraft.className = 'px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-500';
      }
      if (textDateDraft) textDateDraft.textContent = 'Nenhum embarque ativo';
      if (countdownDraft) countdownDraft.textContent = '--:--:--';
      if (cardDraft) cardDraft.classList.remove('deadline-danger-pulse');

      if (badgeCargo) {
        badgeCargo.textContent = 'Sem Embarque';
        badgeCargo.className = 'px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-500';
      }
      if (textDateCargo) textDateCargo.textContent = 'Nenhum embarque ativo';
      if (countdownCargo) countdownCargo.textContent = '--:--:--';
      if (cardCargo) cardCargo.classList.remove('deadline-danger-pulse');
      return;
    }

    const b = currentShipment.booking || {};

    // 1. Draft Deadline
    const draftEval = ComexCalculations.evaluateDeadline(b.draftDeadline);

    if (textDateDraft) {
      textDateDraft.textContent = b.draftDeadline ? new Date(b.draftDeadline).toLocaleString('pt-BR') : 'Não configurada';
    }

    if (b.draftSent) {
      badgeDraft.textContent = 'Enviado ao Armador';
      badgeDraft.className = 'px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800';
      countdownDraft.textContent = 'Concluído';
      cardDraft.classList.remove('deadline-danger-pulse');
    } else {
      applyDeadlineBadge(badgeDraft, countdownDraft, cardDraft, draftEval);
    }

    // 2. Cargo Deadline
    const cargoEval = ComexCalculations.evaluateDeadline(b.cargoDeadline);
    const badgeCargo = document.getElementById('badge-status-cargo');
    const textDateCargo = document.getElementById('text-date-cargo');
    const countdownCargo = document.getElementById('countdown-cargo');
    const cardCargo = document.getElementById('card-deadline-cargo');

    if (textDateCargo) {
      textDateCargo.textContent = b.cargoDeadline ? new Date(b.cargoDeadline).toLocaleString('pt-BR') : 'Não configurada';
    }

    if (b.cargoDelivered) {
      badgeCargo.textContent = 'Entregue no Porto';
      badgeCargo.className = 'px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800';
      countdownCargo.textContent = 'Concluído';
      cardCargo.classList.remove('deadline-danger-pulse');
    } else {
      applyDeadlineBadge(badgeCargo, countdownCargo, cardCargo, cargoEval);
    }
  }

  function applyDeadlineBadge(badgeEl, countEl, cardEl, evalResult) {
    if (!badgeEl || !countEl || !cardEl) return;

    cardEl.classList.remove('deadline-danger-pulse');

    switch (evalResult.status) {
      case 'danger':
        badgeEl.textContent = 'Crítico (< 6h)';
        badgeEl.className = 'px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-300';
        countEl.textContent = evalResult.text;
        countEl.className = 'text-base font-black font-mono text-rose-600';
        cardEl.classList.add('deadline-danger-pulse');
        break;
      case 'warning':
        badgeEl.textContent = 'Atenção (< 24h)';
        badgeEl.className = 'px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300';
        countEl.textContent = evalResult.text;
        countEl.className = 'text-base font-black font-mono text-amber-700';
        break;
      case 'safe':
        badgeEl.textContent = 'Dentro do Prazo';
        badgeEl.className = 'px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800';
        countEl.textContent = evalResult.text;
        countEl.className = 'text-base font-black font-mono text-emerald-700';
        break;
      case 'expired':
        badgeEl.textContent = 'Vencido!';
        badgeEl.className = 'px-2.5 py-1 text-xs font-bold rounded-full bg-rose-200 text-rose-900 border border-rose-400';
        countEl.textContent = evalResult.text;
        countEl.className = 'text-base font-black font-mono text-rose-700';
        break;
      default:
        badgeEl.textContent = 'Aguardando Data';
        badgeEl.className = 'px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700';
        countEl.textContent = '--:--:--';
        countEl.className = 'text-base font-black font-mono text-slate-800';
    }
  }

  // Atualização dos botões de checklist
  function updateDraftButtonUI(isSent) {
    const btn = document.getElementById('btn-toggle-draft-sent');
    const label = document.getElementById('label-draft-sent');
    if (!btn || !label) return;

    if (isSent) {
      btn.className = 'px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center space-x-1.5';
      label.textContent = '✓ Draft Enviado ao Armador';
    } else {
      btn.className = 'px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition flex items-center space-x-1.5';
      label.textContent = 'Marcar como Enviado ao Armador';
    }
  }

  function updateCargoButtonUI(isDelivered) {
    const btn = document.getElementById('btn-toggle-cargo-delivered');
    const label = document.getElementById('label-cargo-delivered');
    if (!btn || !label) return;

    if (isDelivered) {
      btn.className = 'px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center space-x-1.5';
      label.textContent = '✓ Carga Entregue no Porto';
    } else {
      btn.className = 'px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition flex items-center space-x-1.5';
      label.textContent = 'Marcar como Entregue no Porto';
    }
  }

  document.getElementById('btn-toggle-draft-sent')?.addEventListener('click', () => {
    if (!currentShipment) return;
    currentShipment.booking.draftSent = !currentShipment.booking.draftSent;
    comexStorage.saveShipment(currentShipment);
    updateDraftButtonUI(currentShipment.booking.draftSent);
    updateDeadlineCards();
  });

  document.getElementById('btn-toggle-cargo-delivered')?.addEventListener('click', () => {
    if (!currentShipment) return;
    currentShipment.booking.cargoDelivered = !currentShipment.booking.cargoDelivered;
    comexStorage.saveShipment(currentShipment);
    updateCargoButtonUI(currentShipment.booking.cargoDelivered);
    updateDeadlineCards();
  });

  // Ticker de contagem a cada segundo
  setInterval(() => {
    updateDeadlineCards();
  }, 1000);

  // ==========================================
  // BARRA FIXA DE RESUMO (STICKY BAR)
  // ==========================================
  function updateStickySummary() {
    if (!currentShipment) {
      document.getElementById('bar-booking-ref').textContent = 'Booking: --';
      document.getElementById('bar-vessel-ref').textContent = 'Navio: --';
      document.getElementById('bar-pol-pod-ref').textContent = 'Nenhum embarque selecionado';
      document.getElementById('bar-cnt-count').textContent = '0';
      document.getElementById('bar-pallets-count').textContent = '0';
      document.getElementById('bar-volume-m3').textContent = '0.000 m³';
      document.getElementById('bar-total-vgm').textContent = '0 kg';
      document.getElementById('bar-total-usd').textContent = '$0.00';
      const payloadBadge = document.getElementById('bar-payload-badge');
      if (payloadBadge) {
        payloadBadge.textContent = 'Sem Embarque';
        payloadBadge.className = 'px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-500';
      }
      return;
    }

    const b = currentShipment.booking || {};
    const cnts = currentShipment.containers || [];
    const totals = ComexCalculations.calculateShipmentTotals(cnts);

    document.getElementById('bar-booking-ref').textContent = `Booking: ${b.bookingNumber || 'TBA'}`;
    document.getElementById('bar-vessel-ref').textContent = `Navio: ${b.vessel || 'TBA'} / ${b.voyage || '01'}`;
    document.getElementById('bar-pol-pod-ref').textContent = `${b.pol || 'POL'} -> ${b.pod || 'POD'}`;

    document.getElementById('bar-cnt-count').textContent = totals.containerCount;
    document.getElementById('bar-pallets-count').textContent = totals.totalPallets;
    document.getElementById('bar-volume-m3').textContent = `${totals.totalVolumeM3.toFixed(3)} m³`;
    document.getElementById('bar-total-vgm').textContent = `${totals.totalVgmKg.toLocaleString()} kg`;
    document.getElementById('bar-total-usd').textContent = `$${totals.totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    const payloadBadge = document.getElementById('bar-payload-badge');
    if (totals.hasOverweightContainer) {
      payloadBadge.textContent = '⚠️ EXCESSO DE PESO';
      payloadBadge.className = 'px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 animate-pulse';
    } else {
      payloadBadge.textContent = 'VGM OK';
      payloadBadge.className = 'px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800';
    }
  }

  // ==========================================
  // GERAÇÃO E VISUALIZAÇÃO DE DOCUMENTOS
  // ==========================================
  function renderCurrentDocument() {
    const container = document.getElementById('document-preview-container');
    if (!container) return;

    if (!currentShipment) {
      container.innerHTML = `
        <div class="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 max-w-xl mx-auto shadow-sm">
          <p class="font-bold text-slate-700 text-base mb-1">Nenhum embarque selecionado</p>
          <p class="text-xs text-slate-500">Crie um novo embarque ou selecione um embarque existente no Dashboard para visualizar e emitir documentos.</p>
        </div>
      `;
      return;
    }

    switch (currentDocType) {
      case 'invoice':
        container.innerHTML = ComexDocGenerators.generateInvoiceHtml(currentShipment);
        break;
      case 'packing':
        container.innerHTML = ComexDocGenerators.generatePackingListHtml(currentShipment);
        break;
      case 'draft':
        container.innerHTML = ComexDocGenerators.generateDraftBlHtml(currentShipment);
        break;
      case 'vgm':
        container.innerHTML = ComexDocGenerators.generateVgmHtml(currentShipment);
        break;
    }
  }

  docSubTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      docSubTabs.forEach(t => {
        const isTarget = t === tab;
        t.classList.toggle('active', isTarget);
        t.classList.toggle('text-blue-700', isTarget);
        t.classList.toggle('bg-white', isTarget);
        t.classList.toggle('shadow-sm', isTarget);
        t.classList.toggle('text-slate-600', !isTarget);
      });
      currentDocType = tab.dataset.doc;
      renderCurrentDocument();
    });
  });

  // Ações de Documentos
  document.getElementById('btn-print-doc')?.addEventListener('click', () => {
    if (!currentShipment) {
      alert('Nenhum embarque ativo selecionado para impressão.');
      return;
    }
    window.print();
  });

  document.getElementById('btn-export-excel')?.addEventListener('click', () => {
    if (!currentShipment) {
      alert('Nenhum embarque ativo selecionado para exportação.');
      return;
    }
    ComexDocGenerators.exportToExcel(currentShipment);
  });

  document.getElementById('btn-copy-doc-text')?.addEventListener('click', () => {
    const docContainer = document.querySelector('.comex-document');
    if (!docContainer) {
      alert('Nenhum documento gerado para copiar.');
      return;
    }
    const textToCopy = docContainer.innerText;
    navigator.clipboard.writeText(textToCopy).then(() => {
      alert('Texto do documento copiado para a área de transferência!');
    });
  });

  document.getElementById('btn-mark-completed')?.addEventListener('click', () => {
    if (!currentShipment) {
      alert('Nenhum embarque ativo selecionado.');
      return;
    }
    if (confirm('Deseja marcar este embarque como Concluído e arquivá-lo no Histórico?')) {
      comexStorage.markAsCompleted(currentShipment.id);
      const actives = comexStorage.getActiveShipments();
      currentShipment = actives.length > 0 ? actives[0] : null;
      comexStorage.setCurrentShipmentId(currentShipment ? currentShipment.id : null);
      populateForm(currentShipment);
      switchTab('tab-history');
    }
  });

  // ==========================================
  // LISTA DE EMBARQUES (DASHBOARD & HISTÓRICO)
  // ==========================================
  function renderDashboardList() {
    const listEl = document.getElementById('shipments-active-list');
    if (!listEl) return;

    const actives = comexStorage.getActiveShipments();
    if (actives.length === 0) {
      listEl.innerHTML = `
        <div class="p-8 text-center text-slate-400 italic">
          Nenhum embarque ativo. Clique em "Novo Embarque" ou "Carregar Teste".
        </div>
      `;
      return;
    }

    listEl.innerHTML = actives.map(s => {
      const isCurrent = s.id === currentShipment.id;
      const b = s.booking || {};
      const totals = ComexCalculations.calculateShipmentTotals(s.containers || []);
      const draftEval = ComexCalculations.evaluateDeadline(b.draftDeadline);

      return `
        <div class="p-4 flex flex-wrap items-center justify-between hover:bg-slate-50 transition cursor-pointer ${isCurrent ? 'bg-blue-50/50 border-l-4 border-blue-600' : ''}" data-shipment-id="${s.id}">
          <div class="space-y-1">
            <div class="flex items-center space-x-2">
              <span class="font-bold text-sm text-slate-900">${s.title || 'Embarque'}</span>
              ${isCurrent ? '<span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">Em edição</span>' : ''}
            </div>
            <p class="text-xs text-slate-500">
              Booking: <strong class="font-mono text-slate-700">${b.bookingNumber || 'TBA'}</strong> • Armador: ${b.carrier || 'Maersk'} • Navio: ${b.vessel || 'TBA'}
            </p>
            <div class="flex items-center space-x-3 text-[11px] text-slate-600 font-mono">
              <span>${totals.containerCount} container(s)</span>
              <span>•</span>
              <span>${totals.totalVolumeM3.toFixed(3)} m³</span>
              <span>•</span>
              <span>VGM: ${totals.totalVgmKg.toLocaleString()} kg</span>
            </div>
          </div>

          <div class="flex items-center space-x-3 mt-2 sm:mt-0">
            <div class="text-right">
              <span class="text-[10px] text-slate-400 block uppercase">Draft Deadline:</span>
              <span class="text-xs font-bold font-mono ${draftEval.status === 'danger' ? 'text-rose-600' : 'text-slate-700'}">
                ${b.draftSent ? '✓ Enviado' : (b.draftDeadline ? new Date(b.draftDeadline).toLocaleDateString('pt-BR') : 'Sem data')}
              </span>
            </div>
            <button class="btn-select-shipment px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded hover:bg-slate-100" data-id="${s.id}">
              Abrir
            </button>
            <button class="btn-delete-shipment p-1.5 text-slate-400 hover:text-rose-600 rounded" data-id="${s.id}" title="Excluir">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    bindShipmentListEvents(listEl);
    if (window.lucide) lucide.createIcons();
  }

  function renderHistoryList() {
    const listEl = document.getElementById('shipments-completed-list');
    const badgeCompleted = document.getElementById('badge-completed-count');
    const completed = comexStorage.getCompletedShipments();

    if (badgeCompleted) badgeCompleted.textContent = completed.length;
    if (!listEl) return;

    if (completed.length === 0) {
      listEl.innerHTML = `
        <div class="p-8 text-center text-slate-400 italic">
          Nenhum embarque concluído ainda. Quando terminar um processo, clique em "Concluir Embarque" para arquivá-lo aqui.
        </div>
      `;
      return;
    }

    listEl.innerHTML = completed.map(s => {
      const b = s.booking || {};
      const totals = ComexCalculations.calculateShipmentTotals(s.containers || []);
      const completedDate = s.completedAt ? new Date(s.completedAt).toLocaleDateString('pt-BR') : 'Data não registrada';

      return `
        <div class="p-4 flex flex-wrap items-center justify-between hover:bg-slate-50 transition">
          <div class="space-y-1">
            <div class="flex items-center space-x-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span class="font-bold text-sm text-slate-900">${s.title || 'Embarque Concluído'}</span>
              <span class="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Concluído em ${completedDate}</span>
            </div>
            <p class="text-xs text-slate-500">
              Booking: <strong class="font-mono text-slate-700">${b.bookingNumber || 'TBA'}</strong> • Navio: ${b.vessel || 'TBA'} • POL: ${b.pol} -> POD: ${b.pod}
            </p>
            <p class="text-[11px] text-slate-600 font-mono">
              ${totals.containerCount} container(s) • ${totals.totalVolumeM3.toFixed(3)} m³ • Valor: $${totals.totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div class="flex items-center space-x-2 mt-2 sm:mt-0">
            <button class="btn-reopen-shipment px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded hover:bg-slate-100" data-id="${s.id}">
              Reabrir Processo
            </button>
            <button class="btn-view-doc-history px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded hover:bg-blue-500" data-id="${s.id}">
              Ver Documentos
            </button>
            <button class="btn-delete-shipment p-1.5 text-slate-400 hover:text-rose-600 rounded" data-id="${s.id}" title="Excluir">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    bindHistoryListEvents(listEl);
    if (window.lucide) lucide.createIcons();
  }

  function deleteShipmentWithConfirmation(id) {
    if (!id) return;
    const shipment = comexStorage.getShipmentById(id);
    const title = shipment?.title || 'este embarque';
    
    if (!confirm(`Deseja realmente excluir permanentemente "${title}"?`)) {
      return;
    }

    // Cancela imediatamente qualquer salvamento pendente
    clearTimeout(autoSaveTimeout);

    comexStorage.deleteShipment(id);

    // Se o embarque excluído era o que estava aberto em edição
    if (currentShipment && currentShipment.id === id) {
      const activeList = comexStorage.getActiveShipments();
      if (activeList.length > 0) {
        currentShipment = activeList[0];
        comexStorage.setCurrentShipmentId(currentShipment.id);
      } else {
        currentShipment = null;
        comexStorage.setCurrentShipmentId(null);
      }
      populateForm(currentShipment);
    }

    renderDashboardList();
    renderHistoryList();
    updateStickySummary();
    if (window.lucide) lucide.createIcons();
  }

  function bindShipmentListEvents(container) {
    container.querySelectorAll('.btn-select-shipment').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        comexStorage.setCurrentShipmentId(id);
        currentShipment = comexStorage.getShipmentById(id);
        populateForm(currentShipment);
        switchTab('tab-booking');
      });
    });

    container.querySelectorAll('.btn-delete-shipment').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const id = btn.dataset.id;
        deleteShipmentWithConfirmation(id);
      });
    });
  }

  function bindHistoryListEvents(container) {
    container.querySelectorAll('.btn-reopen-shipment').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        comexStorage.reopenShipment(id);
        comexStorage.setCurrentShipmentId(id);
        currentShipment = comexStorage.getShipmentById(id);
        populateForm(currentShipment);
        switchTab('tab-dashboard');
      });
    });

    container.querySelectorAll('.btn-view-doc-history').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        comexStorage.setCurrentShipmentId(id);
        currentShipment = comexStorage.getShipmentById(id);
        populateForm(currentShipment);
        switchTab('tab-documents');
      });
    });

    container.querySelectorAll('.btn-delete-shipment').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const id = btn.dataset.id;
        deleteShipmentWithConfirmation(id);
      });
    });
  }

  // Botão de Excluir Embarque Atual na aba Booking
  document.getElementById('btn-delete-current-shipment')?.addEventListener('click', () => {
    if (currentShipment) {
      deleteShipmentWithConfirmation(currentShipment.id);
    }
  });

  // ==========================================
  // AÇÕES GLOBAIS DE TOPO (HEADER)
  // ==========================================
  document.getElementById('btn-load-sample')?.addEventListener('click', () => {
    if (confirm('Carregar dados de exemplo com 5 containers de madeira e prazos para teste?')) {
      const sample = ComexMockData.getSampleShipment();
      comexStorage.saveShipment(sample);
      comexStorage.setCurrentShipmentId(sample.id);
      currentShipment = sample;
      populateForm(currentShipment);
      switchTab('tab-dashboard');
      alert('Exemplo carregado com sucesso!');
    }
  });

  document.getElementById('btn-new-shipment')?.addEventListener('click', () => {
    const title = prompt('Nome ou Referência do Novo Embarque (Ex: Booking MSC 123):', '');
    if (title !== null) {
      const newShipment = comexStorage.createNewShipment(title);
      currentShipment = newShipment;
      populateForm(currentShipment);
      switchTab('tab-booking');
    }
  });

  document.getElementById('btn-quick-new')?.addEventListener('click', () => {
    document.getElementById('btn-new-shipment')?.click();
  });

  document.getElementById('btn-export-backup')?.addEventListener('click', () => {
    comexStorage.exportBackupJson();
  });

  document.getElementById('input-restore-backup')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      const text = await file.text();
      if (comexStorage.importBackupJson(text)) {
        currentShipment = comexStorage.getCurrentShipment();
        populateForm(currentShipment);
        renderDashboardList();
        alert('Backup restaurado com sucesso!');
      } else {
        alert('Arquivo de backup inválido.');
      }
    }
  });

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================
  bindInputAutoSave();
  populateForm(currentShipment);
  renderDashboardList();
  renderHistoryList();
});
