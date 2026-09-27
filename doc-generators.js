/**
 * ComexFlow - Gerador de Documentos de Exportação
 * Gera: Commercial Invoice, Packing List, Draft de BL e Declaração de VGM.
 * Suporta visualização em tela, cópia de texto, impressão A4 limpa e exportação Excel (.xlsx).
 */

const ComexDocGenerators = {
  /**
   * Gera o HTML da Commercial Invoice (Fatura Comercial)
   * @param {Object} shipment 
   */
  generateInvoiceHtml(shipment) {
    const booking = shipment.booking || {};
    const containers = shipment.containers || [];
    const totals = ComexCalculations.calculateShipmentTotals(containers);
    const invoiceNum = shipment.invoiceNumber || `INV-${shipment.booking?.bookingNumber || 'EXP'}-${new Date().getFullYear()}`;
    const invoiceDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    let containerRowsHtml = '';
    containers.forEach((cnt, idx) => {
      const calc = ComexCalculations.calculateContainer(cnt);
      containerRowsHtml += `
        <tr class="border-b border-slate-200 text-xs">
          <td class="py-2 font-mono font-medium">${cnt.containerNumber || 'TBA'} / ${cnt.sealNumber || 'TBA'}</td>
          <td class="py-2">${cnt.palletsCount} Pallets (${calc.totalSheets} pcs)<br><span class="text-slate-500 font-mono text-[11px]">${cnt.lengthMm}x${cnt.widthMm}x${cnt.thicknessMm}mm</span></td>
          <td class="py-2 text-right font-mono">${calc.totalVolumeM3.toFixed(3)} m³</td>
          <td class="py-2 text-right font-mono">${calc.netWeightKg.toLocaleString()} kg</td>
          <td class="py-2 text-right font-mono">${calc.grossWeightKg.toLocaleString()} kg</td>
          <td class="py-2 text-right font-mono">$${(parseFloat(cnt.unitPriceUsd) || 0).toFixed(2)}</td>
          <td class="py-2 text-right font-mono font-semibold">$${calc.totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `;
    });

    return `
      <div class="comex-document p-8 bg-white max-w-4xl mx-auto shadow-sm text-slate-800 font-sans border border-slate-200 rounded-lg">
        <!-- Cabeçalho -->
        <div class="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900">COMMERCIAL INVOICE</h1>
            <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Export Documentation</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-bold text-slate-900 font-mono">INVOICE Nº: ${invoiceNum}</p>
            <p class="text-xs text-slate-600 font-mono">Date: ${invoiceDate}</p>
            <p class="text-xs text-slate-600 font-mono font-semibold text-blue-600">Booking: ${booking.bookingNumber || 'PENDING'}</p>
          </div>
        </div>

        <!-- Partes Envolvidas -->
        <div class="grid grid-cols-2 gap-6 text-xs mb-6 bg-slate-50 p-4 rounded-md border border-slate-200">
          <div>
            <p class="font-bold text-slate-700 uppercase tracking-wider mb-1">1. SHIPPER / EXPORTER:</p>
            <p class="font-semibold text-slate-900">${booking.shipper?.name || 'EMPRESA EXPORTADORA LTDA'}</p>
            <p class="text-slate-600 whitespace-pre-line">${booking.shipper?.address || 'Endereço da Fábrica / Brasil'}</p>
            <p class="text-slate-600 font-mono mt-1">CNPJ: ${booking.shipper?.taxId || '00.000.000/0001-00'}</p>
          </div>
          <div>
            <p class="font-bold text-slate-700 uppercase tracking-wider mb-1">2. CONSIGNEE (IMPORTER):</p>
            <p class="font-semibold text-slate-900">${booking.consignee?.name || 'INTERNATIONAL BUYER CORP'}</p>
            <p class="text-slate-600 whitespace-pre-line">${booking.consignee?.address || 'Buyer Port Address / Destination'}</p>
            <p class="font-bold text-slate-700 uppercase tracking-wider mt-3 mb-1">3. NOTIFY PARTY:</p>
            <p class="text-slate-700">${booking.notify?.name || 'SAME AS CONSIGNEE'}</p>
          </div>
        </div>

        <!-- Dados do Embarque e Transporte -->
        <div class="grid grid-cols-4 gap-4 text-xs mb-6 border-y border-slate-200 py-3 bg-white">
          <div>
            <span class="text-slate-500 block uppercase font-medium text-[10px]">Carrier / Armador</span>
            <span class="font-semibold text-slate-800">${booking.carrier || 'Maersk'}</span>
          </div>
          <div>
            <span class="text-slate-500 block uppercase font-medium text-[10px]">Vessel & Voyage</span>
            <span class="font-semibold text-slate-800">${booking.vessel || 'Vessel TBA'} / ${booking.voyage || '001'}</span>
          </div>
          <div>
            <span class="text-slate-500 block uppercase font-medium text-[10px]">Port of Loading (POL)</span>
            <span class="font-semibold text-slate-800">${booking.pol || 'Paranaguá, Brazil'}</span>
          </div>
          <div>
            <span class="text-slate-500 block uppercase font-medium text-[10px]">Port of Discharge (POD)</span>
            <span class="font-semibold text-slate-800">${booking.pod || 'Destination Port'}</span>
          </div>
          <div>
            <span class="text-slate-500 block uppercase font-medium text-[10px]">Incoterm & Freight</span>
            <span class="font-semibold text-slate-800">FOB (${booking.freightTerm || 'Prepaid'})</span>
          </div>
          <div>
            <span class="text-slate-500 block uppercase font-medium text-[10px]">Contract Nº</span>
            <span class="font-semibold text-slate-800">${booking.contractNumber || 'CTR-' + (booking.bookingNumber || '01')}</span>
          </div>
          <div>
            <span class="text-slate-500 block uppercase font-medium text-[10px]">NCM / HS Code</span>
            <span class="font-semibold text-slate-800 font-mono">${booking.ncm || '4412.39.00'}</span>
          </div>
          <div>
            <span class="text-slate-500 block uppercase font-medium text-[10px]">DU-E / RUC</span>
            <span class="font-semibold text-slate-800 font-mono">${booking.dueNumber || 'TBA'}</span>
          </div>
        </div>

        <!-- Tabela de Itens e Containers -->
        <div class="mb-6">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b-2 border-slate-800 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <th class="py-2">Container / Seal</th>
                <th class="py-2">Description & Quantity</th>
                <th class="py-2 text-right">Volume (m³)</th>
                <th class="py-2 text-right">Net Weight</th>
                <th class="py-2 text-right">Gross Weight</th>
                <th class="py-2 text-right">Unit Price</th>
                <th class="py-2 text-right">Total (USD)</th>
              </tr>
            </thead>
            <tbody>
              ${containerRowsHtml}
            </tbody>
            <tfoot>
              <tr class="border-t-2 border-slate-800 font-bold text-xs bg-slate-50">
                <td class="py-3 font-semibold">TOTAL (${totals.containerCount} Containers)</td>
                <td class="py-3">${totals.totalPallets} Pallets (${totals.totalSheets} pcs)</td>
                <td class="py-3 text-right font-mono">${totals.totalVolumeM3.toFixed(3)} m³</td>
                <td class="py-3 text-right font-mono">${totals.totalNetWeightKg.toLocaleString()} kg</td>
                <td class="py-3 text-right font-mono">${totals.totalGrossWeightKg.toLocaleString()} kg</td>
                <td class="py-3 text-right"></td>
                <td class="py-3 text-right font-mono text-sm text-blue-700 font-bold">$${totals.totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Declarações Oficiais e Assinatura -->
        <div class="mt-8 pt-4 border-t border-slate-200 text-[11px] text-slate-600 flex justify-between items-end">
          <div class="max-w-md">
            <p class="font-bold text-slate-700 uppercase mb-1">Declaration:</p>
            <p>We certify that this invoice is true and correct, and that the contents of this shipment are as stated above. Wood packaging materials compliant with ISPM 15 / HT treated.</p>
          </div>
          <div class="text-center w-56">
            <div class="border-b border-slate-400 mb-1 h-12"></div>
            <p class="font-semibold text-slate-800 text-xs">Authorized Signature</p>
            <p class="text-[10px] text-slate-500">${booking.shipper?.name || 'Shipper / Exporter'}</p>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Gera o HTML do Packing List (Romaneio de Carga)
   * @param {Object} shipment 
   */
  generatePackingListHtml(shipment) {
    const booking = shipment.booking || {};
    const containers = shipment.containers || [];
    const totals = ComexCalculations.calculateShipmentTotals(containers);
    const plNum = `PL-${booking.bookingNumber || 'EXP'}-${new Date().getFullYear()}`;
    const plDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    let containerRowsHtml = '';
    containers.forEach((cnt, idx) => {
      const calc = ComexCalculations.calculateContainer(cnt);
      containerRowsHtml += `
        <tr class="border-b border-slate-200 text-xs">
          <td class="py-2.5 font-mono font-medium">${cnt.containerNumber || 'TBA'}</td>
          <td class="py-2.5 font-mono text-slate-600">${cnt.sealNumber || 'TBA'}</td>
          <td class="py-2.5">${cnt.containerType || "40' HC"}</td>
          <td class="py-2.5 text-center font-bold">${cnt.palletsCount}</td>
          <td class="py-2.5 text-center">${calc.totalSheets}</td>
          <td class="py-2.5 font-mono text-[11px]">${cnt.lengthMm} x ${cnt.widthMm} x ${cnt.thicknessMm} mm</td>
          <td class="py-2.5 text-right font-mono">${calc.totalVolumeM3.toFixed(3)} m³</td>
          <td class="py-2.5 text-right font-mono">${calc.netWeightKg.toLocaleString()} kg</td>
          <td class="py-2.5 text-right font-mono font-semibold">${calc.grossWeightKg.toLocaleString()} kg</td>
        </tr>
      `;
    });

    return `
      <div class="comex-document p-8 bg-white max-w-4xl mx-auto shadow-sm text-slate-800 font-sans border border-slate-200 rounded-lg">
        <!-- Cabeçalho -->
        <div class="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-slate-900">PACKING LIST</h1>
            <p class="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Cargo Specifications & Volume Breakdown</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-bold text-slate-900 font-mono">PACKING LIST Nº: ${plNum}</p>
            <p class="text-xs text-slate-600 font-mono">Date: ${plDate}</p>
            <p class="text-xs text-slate-600 font-mono font-semibold text-blue-600">Booking: ${booking.bookingNumber || 'PENDING'}</p>
          </div>
        </div>

        <!-- Partes Envolvidas -->
        <div class="grid grid-cols-2 gap-6 text-xs mb-6 bg-slate-50 p-4 rounded-md border border-slate-200">
          <div>
            <p class="font-bold text-slate-700 uppercase tracking-wider mb-1">SHIPPER / EXPORTER:</p>
            <p class="font-semibold text-slate-900">${booking.shipper?.name || 'EMPRESA EXPORTADORA LTDA'}</p>
            <p class="text-slate-600 whitespace-pre-line">${booking.shipper?.address || 'Brasil'}</p>
          </div>
          <div>
            <p class="font-bold text-slate-700 uppercase tracking-wider mb-1">CONSIGNEE:</p>
            <p class="font-semibold text-slate-900">${booking.consignee?.name || 'INTERNATIONAL BUYER CORP'}</p>
            <p class="text-slate-600 whitespace-pre-line">${booking.consignee?.address || 'Destination'}</p>
          </div>
        </div>

        <!-- Resumo de Transporte -->
        <div class="grid grid-cols-4 gap-4 text-xs mb-6 border-y border-slate-200 py-3">
          <div>
            <span class="text-slate-500 block uppercase font-medium text-[10px]">Vessel / Voyage</span>
            <span class="font-semibold text-slate-800">${booking.vessel || 'Vessel TBA'} / ${booking.voyage || '001'}</span>
          </div>
          <div>
            <span class="text-slate-500 block uppercase font-medium text-[10px]">Port of Loading</span>
            <span class="font-semibold text-slate-800">${booking.pol || 'Paranaguá, Brazil'}</span>
          </div>
          <div>
            <span class="text-slate-500 block uppercase font-medium text-[10px]">Port of Discharge</span>
            <span class="font-semibold text-slate-800">${booking.pod || 'Destination Port'}</span>
          </div>
          <div>
            <span class="text-slate-500 block uppercase font-medium text-[10px]">Wood Treatment</span>
            <span class="font-semibold text-emerald-600">HT / NIMF 15 Certified</span>
          </div>
        </div>

        <!-- Tabela Fisiográfica -->
        <div class="mb-6">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b-2 border-slate-800 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <th class="py-2">Container</th>
                <th class="py-2">Seal Nº</th>
                <th class="py-2">Type</th>
                <th class="py-2 text-center">Pallets</th>
                <th class="py-2 text-center">Pieces</th>
                <th class="py-2">Dimensions (LxWxE)</th>
                <th class="py-2 text-right">m³</th>
                <th class="py-2 text-right">Net Wt. (kg)</th>
                <th class="py-2 text-right">Gross Wt. (kg)</th>
              </tr>
            </thead>
            <tbody>
              ${containerRowsHtml}
            </tbody>
            <tfoot>
              <tr class="border-t-2 border-slate-800 font-bold text-xs bg-slate-50">
                <td colspan="3" class="py-3 font-semibold">TOTAL (${totals.containerCount} Containers)</td>
                <td class="py-3 text-center">${totals.totalPallets}</td>
                <td class="py-3 text-center">${totals.totalSheets}</td>
                <td class="py-3"></td>
                <td class="py-3 text-right font-mono">${totals.totalVolumeM3.toFixed(3)} m³</td>
                <td class="py-3 text-right font-mono">${totals.totalNetWeightKg.toLocaleString()} kg</td>
                <td class="py-3 text-right font-mono text-slate-900">${totals.totalGrossWeightKg.toLocaleString()} kg</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="mt-8 pt-4 border-t border-slate-200 text-[11px] text-slate-600 flex justify-between items-end">
          <div class="max-w-md">
            <p class="font-bold text-slate-700 uppercase mb-1">Wood Packaging / Phytosanitary Note:</p>
            <p>All solid wood packaging material used in this consignment has been treated according to ISPM 15 standards (Heat Treatment - HT) and is properly marked with official stamp.</p>
          </div>
          <div class="text-center w-56">
            <div class="border-b border-slate-400 mb-1 h-12"></div>
            <p class="font-semibold text-slate-800 text-xs">Warehouse / Logistics Manager</p>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Gera o Draft do BL (Shipping Instruction)
   * Como a irmã comentou: "coloca tudo que foi na Invoice e Packing, mas NÃO coloca o valor da mercadoria".
   * @param {Object} shipment 
   */
  generateDraftBlHtml(shipment) {
    const booking = shipment.booking || {};
    const containers = shipment.containers || [];
    const totals = ComexCalculations.calculateShipmentTotals(containers);

    let containerSummaryText = '';
    containers.forEach((cnt, idx) => {
      const calc = ComexCalculations.calculateContainer(cnt);
      containerSummaryText += `CONTAINER: ${cnt.containerNumber || 'TBA'} / SEAL: ${cnt.sealNumber || 'TBA'} / TYPE: ${cnt.containerType || "40' HC"}\n`;
      containerSummaryText += `  SAID TO CONTAIN: ${cnt.palletsCount} PALLETS WITH ${calc.totalSheets} PCS OF PLYWOOD (${cnt.lengthMm}x${cnt.widthMm}x${cnt.thicknessMm}MM)\n`;
      containerSummaryText += `  NET WEIGHT: ${calc.netWeightKg.toLocaleString()} KG | GROSS WEIGHT: ${calc.grossWeightKg.toLocaleString()} KG | MEASUREMENT: ${calc.totalVolumeM3.toFixed(3)} M3\n\n`;
    });

    return `
      <div class="comex-document p-8 bg-white max-w-4xl mx-auto shadow-sm text-slate-800 font-sans border border-slate-200 rounded-lg">
        <div class="flex justify-between items-center border-b-2 border-blue-900 pb-3 mb-6">
          <div>
            <h1 class="text-xl font-black tracking-tight text-blue-900">SHIPPING INSTRUCTION / DRAFT B/L</h1>
            <p class="text-xs text-slate-500 font-medium">Instrução de Embarque Marítimo para Armador / Agente de Carga</p>
          </div>
          <div class="text-right">
            <span class="inline-block px-3 py-1 bg-amber-100 text-amber-900 font-bold text-xs rounded border border-amber-300">
              DRAFT / NÃO NEGOCIÁVEL
            </span>
            <p class="text-xs text-slate-700 font-mono mt-1 font-bold">Booking: ${booking.bookingNumber || 'TBA'}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 text-xs mb-6">
          <div class="border border-slate-300 p-3 rounded">
            <p class="font-bold text-slate-700 text-[10px] uppercase">SHIPPER / EXPORTER:</p>
            <p class="font-bold text-slate-900">${booking.shipper?.name || 'EMPRESA EXPORTADORA'}</p>
            <p class="text-slate-600">${booking.shipper?.address || 'Brasil'}</p>
            <p class="text-slate-600 font-mono">TAX ID / CNPJ: ${booking.shipper?.taxId || 'N/A'}</p>
          </div>
          <div class="border border-slate-300 p-3 rounded">
            <p class="font-bold text-slate-700 text-[10px] uppercase">CONSIGNEE:</p>
            <p class="font-bold text-slate-900">${booking.consignee?.name || 'CONSIGNEE CORP'}</p>
            <p class="text-slate-600">${booking.consignee?.address || 'Port of Destination'}</p>
          </div>
          <div class="border border-slate-300 p-3 rounded">
            <p class="font-bold text-slate-700 text-[10px] uppercase">NOTIFY PARTY:</p>
            <p class="text-slate-800">${booking.notify?.name || 'SAME AS CONSIGNEE'}</p>
            <p class="text-slate-600">${booking.notify?.address || ''}</p>
          </div>
          <div class="border border-slate-300 p-3 rounded bg-slate-50">
            <p class="font-bold text-slate-700 text-[10px] uppercase">FREIGHT & RELEASE TERMS:</p>
            <p class="text-slate-900 font-semibold">FREIGHT: <span class="text-blue-700 font-bold uppercase">${booking.freightTerm || 'FREIGHT PREPAID'}</span></p>
            <p class="text-slate-900 font-semibold">BL TYPE: <span class="text-slate-800 uppercase">${booking.blType || 'EXPRESS RELEASE / WAYBILL'}</span></p>
            <p class="text-slate-700">CARRIER: ${booking.carrier || 'Maersk'}</p>
          </div>
        </div>

        <div class="grid grid-cols-4 gap-3 text-xs mb-6 bg-slate-100 p-3 rounded font-mono">
          <div><span class="text-[10px] text-slate-500 block uppercase">VESSEL / VOYAGE</span>${booking.vessel || 'TBA'} / ${booking.voyage || '01'}</div>
          <div><span class="text-[10px] text-slate-500 block uppercase">PORT OF LOADING</span>${booking.pol || 'Paranaguá'}</div>
          <div><span class="text-[10px] text-slate-500 block uppercase">PORT OF DISCHARGE</span>${booking.pod || 'TBA'}</div>
          <div><span class="text-[10px] text-slate-500 block uppercase">CONTRACT Nº</span>${booking.contractNumber || 'CTR-01'}</div>
        </div>

        <div class="border border-slate-300 rounded p-4 mb-6">
          <p class="font-bold text-xs text-slate-700 uppercase mb-2">DESCRIPTION OF GOODS & CARGO DETAILS:</p>
          <div class="bg-slate-50 p-3 rounded font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed border border-slate-200">
TOTAL: ${totals.containerCount} X 40' HIGH CUBE CONTAINER(S)
SAID TO CONTAIN A TOTAL OF ${totals.totalPallets} PALLETS / ${totals.totalSheets} PIECES OF WOOD PRODUCTS.

HS / NCM CODE: ${booking.ncm || '4412.39.00'}
DU-E Nº: ${booking.dueNumber || 'TBA'}
RUC Nº: ${booking.rucNumber || 'TBA'}

TOTAL NET WEIGHT: ${totals.totalNetWeightKg.toLocaleString()} KG
TOTAL GROSS WEIGHT: ${totals.totalGrossWeightKg.toLocaleString()} KG
TOTAL MEASUREMENT: ${totals.totalVolumeM3.toFixed(3)} CBM (M3)

WOOD PACKAGING MATERIAL: TREATED AND CERTIFIED ACCORDING TO ISPM 15 (HEAT TREATMENT - HT).

--- CONTAINER BREAKDOWN ---
${containerSummaryText}
          </div>
        </div>

        <div class="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800 flex items-center justify-between">
          <span>⚠️ <strong>Nota Operacional:</strong> Enviar ao armador antes do <strong>Deadline de Draft</strong> para evitar multas de retificação de BL ou atraso na emissão.</span>
        </div>
      </div>
    `;
  },

  /**
   * Gera a Declaração de VGM (Verified Gross Mass)
   * Regra SOLAS: Peso da Carga + Tara do Container <= Payload (32.500 kg)
   * @param {Object} shipment 
   */
  generateVgmHtml(shipment) {
    const booking = shipment.booking || {};
    const containers = shipment.containers || [];
    const totals = ComexCalculations.calculateShipmentTotals(containers);

    let rowsHtml = '';
    containers.forEach((cnt, idx) => {
      const calc = ComexCalculations.calculateContainer(cnt);
      const isOver = calc.isOverweight;

      rowsHtml += `
        <tr class="border-b border-slate-200 text-xs ${isOver ? 'bg-rose-50 text-rose-900 font-semibold' : ''}">
          <td class="py-2.5 font-mono">${cnt.containerNumber || `Container #${idx + 1}`}</td>
          <td class="py-2.5 font-mono">${cnt.sealNumber || 'TBA'}</td>
          <td class="py-2.5">${cnt.containerType || "40' HC"}</td>
          <td class="py-2.5 text-right font-mono">${calc.grossWeightKg.toLocaleString()} kg</td>
          <td class="py-2.5 text-right font-mono">${calc.tareWeightKg.toLocaleString()} kg</td>
          <td class="py-2.5 text-right font-mono font-bold ${isOver ? 'text-rose-600' : 'text-slate-900'}">${calc.vgmKg.toLocaleString()} kg</td>
          <td class="py-2.5 text-right font-mono text-slate-500">${calc.maxPayloadKg.toLocaleString()} kg</td>
          <td class="py-2.5 text-center font-bold">
            ${isOver 
              ? `<span class="px-2 py-0.5 bg-rose-200 text-rose-800 rounded text-[10px]">EXCESSO (+${calc.overweightKg.toLocaleString()} kg)</span>` 
              : `<span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px]">APROVADO (${calc.payloadUsagePercent}%)</span>`}
          </td>
        </tr>
      `;
    });

    return `
      <div class="comex-document p-8 bg-white max-w-4xl mx-auto shadow-sm text-slate-800 font-sans border border-slate-200 rounded-lg">
        <div class="flex justify-between items-center border-b-2 border-slate-900 pb-3 mb-6">
          <div>
            <h1 class="text-xl font-bold tracking-tight text-slate-900">VERIFIED GROSS MASS (VGM) DECLARATION</h1>
            <p class="text-xs text-slate-500">SOLAS Convention (Safety of Life at Sea) - Container Weight Verification</p>
          </div>
          <div class="text-right font-mono text-xs">
            <p class="font-bold text-slate-800">Booking: ${booking.bookingNumber || 'TBA'}</p>
            <p class="text-slate-500">Date: ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4 text-xs mb-6 bg-slate-50 p-3 rounded border border-slate-200">
          <div><strong>Shipper:</strong> ${booking.shipper?.name || 'Exportador'}</div>
          <div><strong>Vessel:</strong> ${booking.vessel || 'Vessel TBA'}</div>
          <div><strong>Port of Loading:</strong> ${booking.pol || 'Paranaguá'}</div>
          <div><strong>Weighing Method:</strong> Method 2 (Calculated)</div>
          <div><strong>Carrier:</strong> ${booking.carrier || 'Maersk'}</div>
          <div><strong>Total Containers:</strong> ${totals.containerCount}</div>
        </div>

        <table class="w-full text-left mb-6">
          <thead>
            <tr class="border-b-2 border-slate-800 text-[11px] font-bold text-slate-700 uppercase">
              <th class="py-2">Container</th>
              <th class="py-2">Seal Nº</th>
              <th class="py-2">Size/Type</th>
              <th class="py-2 text-right">Cargo Wt. (kg)</th>
              <th class="py-2 text-right">Tare Wt. (kg)</th>
              <th class="py-2 text-right">VGM (Total kg)</th>
              <th class="py-2 text-right">Max Payload</th>
              <th class="py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr class="border-t-2 border-slate-800 font-bold text-xs bg-slate-50">
              <td colspan="3" class="py-3">TOTAL GERAL DE PESOS:</td>
              <td class="py-3 text-right font-mono">${totals.totalGrossWeightKg.toLocaleString()} kg</td>
              <td class="py-3 text-right font-mono">${totals.totalTareKg.toLocaleString()} kg</td>
              <td class="py-3 text-right font-mono text-blue-700">${totals.totalVgmKg.toLocaleString()} kg</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>

        ${totals.hasOverweightContainer ? `
          <div class="p-3 bg-rose-100 border border-rose-300 rounded text-rose-800 text-xs mb-6">
            ⚠️ <strong>ATENÇÃO:</strong> Há container(s) com peso total superior ao Payload máximo de segurança! Risco de recusa na entrada do porto ou necessidade de transbordo/desova parcial.
          </div>
        ` : `
          <div class="p-3 bg-emerald-50 border border-emerald-300 rounded text-emerald-800 text-xs mb-6">
            ✅ <strong>Todos os containers estão dentro do Payload de segurança (limite de 32.500 kg).</strong> Prontos para liberação portuária e despacho.
          </div>
        `}

        <div class="mt-8 pt-6 border-t border-slate-200 flex justify-between items-end text-xs">
          <div>
            <p class="font-bold">Declaração do Responsável:</p>
            <p class="text-slate-600 text-[11px]">Declaro sob as penas da lei que o peso bruto dos containers acima foi devidamente verificado de acordo com as normas da Convenção SOLAS.</p>
          </div>
          <div class="text-center w-60">
            <div class="border-b border-slate-400 mb-1 h-12"></div>
            <p class="font-semibold text-slate-800">Assinatura do Despachante / Shipper</p>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Exporta a tabela de containers e cálculos para arquivo Excel (.xlsx) usando SheetJS
   */
  exportToExcel(shipment) {
    if (typeof XLSX === 'undefined') {
      alert('A biblioteca SheetJS ainda está carregando. Tente novamente em instantes.');
      return;
    }

    const booking = shipment.booking || {};
    const containers = shipment.containers || [];
    const totals = ComexCalculations.calculateShipmentTotals(containers);

    const sheetData = [
      ['COMEXFLOW - RELATÓRIO DO EMBARQUE', ''],
      ['Booking:', booking.bookingNumber || 'TBA', 'Armador:', booking.carrier || 'Maersk'],
      ['Navio:', booking.vessel || 'TBA', 'Viagem:', booking.voyage || '01'],
      ['Porto de Embarque:', booking.pol || 'Paranaguá', 'Porto de Destino:', booking.pod || ''],
      ['Shipper / Exportador:', booking.shipper?.name || ''],
      ['Consignee / Importador:', booking.consignee?.name || ''],
      ['DU-E:', booking.dueNumber || '', 'RUC:', booking.rucNumber || ''],
      ['NCM:', booking.ncm || ''],
      [],
      [
        'Container', 'Lacre', 'Tipo', 'Pallets', 'Chapas/Pallet', 'Total Chapas',
        'Compr (mm)', 'Larg (mm)', 'Esp (mm)', 'Volume (m³)', 'Preço/m³ (USD)',
        'Total USD', 'Peso Líq (kg)', 'Peso Bruto (kg)', 'Tara (kg)', 'VGM (kg)', 'Status Payload'
      ]
    ];

    containers.forEach((cnt, idx) => {
      const calc = ComexCalculations.calculateContainer(cnt);
      sheetData.push([
        cnt.containerNumber || `CNT #${idx + 1}`,
        cnt.sealNumber || '',
        cnt.containerType || "40' HC",
        cnt.palletsCount,
        cnt.sheetsPerPallet,
        calc.totalSheets,
        cnt.lengthMm,
        cnt.widthMm,
        cnt.thicknessMm,
        calc.totalVolumeM3,
        cnt.unitPriceUsd,
        calc.totalValueUsd,
        calc.netWeightKg,
        calc.grossWeightKg,
        calc.tareWeightKg,
        calc.vgmKg,
        calc.isOverweight ? `EXCESSO (+${calc.overweightKg}kg)` : 'OK'
      ]);
    });

    sheetData.push([]);
    sheetData.push([
      'TOTAL GERAL', '', `${totals.containerCount} cont.`, totals.totalPallets, '', totals.totalSheets,
      '', '', '', totals.totalVolumeM3, '', totals.totalValueUsd,
      totals.totalNetWeightKg, totals.totalGrossWeightKg, totals.totalTareKg, totals.totalVgmKg,
      totals.hasOverweightContainer ? 'ALERTA DE EXCESSO' : 'TODOS DENTRO DO LIMITE'
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, 'Embarque');

    const fileName = `Embarque_${booking.bookingNumber || 'ComexFlow'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }
};

window.ComexDocGenerators = ComexDocGenerators;
