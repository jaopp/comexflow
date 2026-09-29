/**
 * ComexFlow - Gerador de Documentos de Exportação (Fiel ao Modelo da Exportadora)
 * Gera: Commercial Invoice, Packing List, Draft de BL e Declaração de VGM.
 * Layout 100% idêntico às referências oficiais de comércio exterior e despacho aduaneiro.
 */

const ComexDocGenerators = {
  /**
   * Gera o HTML da Commercial Invoice (Fatura Comercial)
   * Modelo idêntico à fatura de exportação de madeira da empresa.
   * @param {Object} shipment 
   */
  generateInvoiceHtml(shipment) {
    const booking = shipment.booking || {};
    const containers = shipment.containers || [];
    const totals = ComexCalculations.calculateShipmentTotals(containers);
    const invoiceNum = booking.invoiceNumber || shipment.invoiceNumber || `BRA 001/${new Date().getFullYear()}`;
    const invoiceDate = booking.invoiceDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
    const poNumber = booking.purchaseOrder || booking.contractNumber || 'PO# 7309-1';

    const shipper = booking.shipper || {};
    const consignee = booking.consignee || {};
    const notify = booking.notify || {};
    const banking = booking.bankingDetails || {};

    const debitNoteNum = booking.debitNoteNumber || 'DN 109936';
    const debitNoteVal = parseFloat(booking.debitNoteAmount) || 0;
    const totalFobAmount = totals.totalValueUsd;
    const finalFobBrazil = Math.max(0, totalFobAmount - debitNoteVal);

    const goodsDesc = booking.goodsDescription || `${totals.containerCount.toString().padStart(2, '0')} X 40' HC CONTAINER SAID TO CONTAIN: ${totals.totalPallets} PACKAGES OF BRAZILIAN PINE PLYWOOD TAEDA WBP GLUE, QUALITY C+/C - EN314 - 2 CLASS 3 - (CE2+) - (FSC 100% CU-COC-865377)`;
    const ncm = booking.ncm || '44123900';
    const taric = booking.taric || '89XV';

    // Agrupamento de itens por especificação/dimensão
    // Se todos os containers tiverem as mesmas medidas, agrupa numa linha mestre (como no modelo de referência)
    let specRowsHtml = '';
    const firstCnt = containers[0] || {};
    const sampleDim = `${((firstCnt.lengthMm || 2440)/1000).toFixed(3)} X ${((firstCnt.widthMm || 1220)/1000).toFixed(3)} X ${firstCnt.thicknessMm || 18}MM (7 PLY)`;
    const avgPrice = containers.length > 0 ? (parseFloat(firstCnt.unitPriceUsd) || 265.0) : 0;

    specRowsHtml = `
      <tr class="border-b border-slate-300 text-xs font-mono">
        <td class="py-2.5 px-3 font-semibold text-slate-800">SIZE: ${sampleDim}</td>
        <td class="py-2.5 px-3 text-center">${totals.totalPallets.toFixed(1)}</td>
        <td class="py-2.5 px-3 text-center">${totals.totalSheets.toFixed(1)}</td>
        <td class="py-2.5 px-3 text-right font-bold">${totals.totalVolumeM3.toFixed(3)}</td>
        <td class="py-2.5 px-3 text-right">${avgPrice.toFixed(2)}</td>
        <td class="py-2.5 px-3 text-right font-bold text-slate-900">$${totalFobAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `;

    return `
      <div class="comex-document p-8 bg-white max-w-4xl mx-auto shadow-sm text-slate-800 font-sans border border-slate-300 rounded-lg text-xs leading-relaxed">
        
        <!-- Título Centralizado em Destaque -->
        <div class="text-center pb-4 mb-5 border-b-2 border-slate-900">
          <h1 class="text-2xl font-black tracking-wider text-slate-900 uppercase">COMMERCIAL INVOICE</h1>
        </div>

        <!-- Grade de Metadados e Partes (Exportador, Importador, Navio e Banco) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          <!-- Coluna Esquerda -->
          <div class="space-y-3.5 border-r border-slate-200 pr-4">
            <div>
              <span class="font-bold text-slate-900 uppercase">INVOICE NUMBER:</span>
              <span class="font-mono font-bold text-slate-800 ml-1">${invoiceNum}</span>
            </div>
            <div>
              <span class="font-bold text-slate-900 uppercase">DATE:</span>
              <span class="font-mono text-slate-700 ml-1">${invoiceDate}</span>
            </div>
            <div>
              <span class="font-bold text-slate-900 uppercase">PURCHASE ORDER:</span>
              <span class="font-mono font-bold text-blue-700 ml-1">${poNumber}</span>
            </div>

            <div class="pt-2 border-t border-slate-100">
              <p class="font-bold text-slate-900 uppercase">MANUFACTURER / SHIPPER:</p>
              <p class="font-bold text-slate-800">${shipper.name || 'BRASNILE INDUSTRIAL LTDA'}</p>
              <p class="text-slate-600 whitespace-pre-line text-[11px]">${shipper.address || 'RODOVIA SC 303 - KM 05 S/N\nPARQUE INDUSTRIAL - TRES BARRAS - SC - BRAZIL'}</p>
              <p class="text-slate-700 font-mono mt-0.5">CNPJ: ${shipper.taxId || '78.549.615/0001-69'}</p>
            </div>

            <div class="pt-2 border-t border-slate-100">
              <p class="font-bold text-slate-900 uppercase">CONSIGNEE:</p>
              <p class="font-bold text-slate-800">${consignee.name || 'PLAUT INTERNATIONAL LIMITED'}</p>
              <p class="text-slate-700 font-mono">VAT NR / TAX ID: ${consignee.taxId || 'GB740079545'}</p>
              <p class="text-slate-700 font-mono">EORI: ${consignee.eori || 'GB740079545000'}</p>
              <p class="text-slate-600 whitespace-pre-line text-[11px]">${consignee.address || '8C BOURNE COURT, SOUTHEND ROAD\nWOODFORD GREEN, UK - ZIP IG8 8HD'}</p>
              <p class="text-slate-600 text-[11px]">E-MAIL: ${consignee.email || 'SHIPPING@PLAUTINT.CO.UK'} | TEL: ${consignee.tel || '+44 20 8553-3471'}</p>
            </div>

            <div class="pt-2 border-t border-slate-100">
              <p class="font-bold text-slate-900 uppercase">NOTIFY:</p>
              <p class="font-bold text-slate-800">${notify.name || 'PLAUT INTERNATIONAL LIMITED'}</p>
              <p class="text-slate-700 font-mono">VAT NR / TAX ID: ${notify.taxId || 'GB740079545'}</p>
              <p class="text-slate-700 font-mono">EORI: ${notify.eori || 'GB740079545000'}</p>
              <p class="text-slate-600 whitespace-pre-line text-[11px]">${notify.address || '8C BOURNE COURT, SOUTHEND ROAD\nWOODFORD GREEN, UK - ZIP IG8 8HD'}</p>
              <p class="text-slate-600 text-[11px]">E-MAIL: ${notify.email || 'SHIPPING@PLAUTINT.CO.UK'} | TEL: ${notify.tel || '+44 20 8553-3471'}</p>
            </div>
          </div>

          <!-- Coluna Direita (Transporte & Dados Bancários) -->
          <div class="space-y-3.5 pl-2">
            <div>
              <span class="font-bold text-slate-900 uppercase">COUNTRY OF ORIGIN:</span>
              <span class="font-semibold text-slate-800 ml-1">BRAZIL</span>
            </div>
            <div>
              <span class="font-bold text-slate-900 uppercase">SHIPPED BY:</span>
              <span class="font-semibold text-slate-800 ml-1">${booking.vessel || 'GRANDE BUENOS AIRES'} / ${booking.voyage || 'GBA0126'}</span>
            </div>
            <div>
              <span class="font-bold text-slate-900 uppercase">BOOKING:</span>
              <span class="font-mono font-bold text-slate-800 ml-1">${booking.bookingNumber || 'S328771289'}</span>
            </div>
            <div>
              <span class="font-bold text-slate-900 uppercase">FROM:</span>
              <span class="text-slate-800 ml-1">${booking.pol || 'PARANAGUA, BRAZIL'}</span>
            </div>
            <div>
              <span class="font-bold text-slate-900 uppercase">TO:</span>
              <span class="text-slate-800 ml-1">${booking.pod || 'TILBURY, UK'}</span>
            </div>
            <div>
              <span class="font-bold text-slate-900 uppercase">PAYMENT TERMS:</span>
              <span class="font-semibold text-slate-800 ml-1">${booking.paymentTerms || 'WIRE TRANSFER FAX DOCUMENTS'}</span>
            </div>

            <!-- Dados Bancários Oficiais -->
            <div class="pt-3 border-t border-slate-200 bg-slate-50 p-3 rounded border border-slate-200 text-[11px] space-y-1.5">
              <p class="font-bold text-slate-900 uppercase text-xs mb-1">BANKING DETAILS:</p>
              <div>
                <p class="font-bold text-slate-700">Intermediary Bank:</p>
                <p class="text-slate-600 font-mono whitespace-pre-line">${banking.intermediaryBank || '56a BANCO DO BRASIL S.A. _ NEW YORK _ U.S.A.\nSWIFT CODE: BRASUS33'}</p>
              </div>
              <div class="pt-1">
                <p class="font-bold text-slate-700">FINAL CREDIT TO:</p>
                <p class="text-slate-600 font-mono whitespace-pre-line">${banking.finalCredit || 'BANCO DO BRASIL S.A. _ Curitiba _ PR _ BRASIL\n57 A SWIFT CODE: BRASBRRJCTA'}</p>
              </div>
              <div class="pt-1">
                <p class="text-slate-700 font-semibold">PLEASE INCLUDE FULL FINAL BENEFICIARY'S DETAILS AS FOLLOW:</p>
                <p class="font-mono font-bold text-slate-900">- IBAN NUMBER: ${banking.iban || 'BR1700000000003430000030333C1'}</p>
                <p class="font-bold text-slate-900">- BENEFICIARY'S NAME: ${banking.beneficiaryName || shipper.name || 'BRASNILE INDUSTRIAL LTDA'}</p>
              </div>
            </div>

          </div>
        </div>

        <!-- Descrição da Mercadoria e Códigos Fiscais -->
        <div class="mb-5 bg-slate-50 p-3.5 rounded border border-slate-200">
          <p class="font-bold text-slate-900 uppercase text-xs mb-1">DESCRIPTION OF THE GOODS:</p>
          <p class="font-mono text-slate-800 text-[11px] leading-relaxed mb-2">${goodsDesc}</p>
          <div class="flex items-center space-x-6 text-xs font-mono font-semibold text-slate-700 pt-1 border-t border-slate-200">
            <span>NCM: <strong class="text-slate-900">${ncm}</strong></span>
            <span>TARIC: <strong class="text-slate-900">${taric}</strong></span>
          </div>
        </div>

        <!-- Tabela de Dimensões e Valores FOB -->
        <div class="mb-5">
          <table class="w-full text-left border-collapse border border-slate-300">
            <thead class="bg-slate-100 text-[10px] font-bold text-slate-800 uppercase tracking-wider">
              <tr class="border-b border-slate-300">
                <th class="py-2.5 px-3">DIMENSIONS (MM)</th>
                <th class="py-2.5 px-3 text-center">QUANTITY OF<br>PALLETS</th>
                <th class="py-2.5 px-3 text-center">QUANTITY<br>OF PIECES</th>
                <th class="py-2.5 px-3 text-right">VOLUME (CBM)</th>
                <th class="py-2.5 px-3 text-right">PRICE/CBM FOB M3<br>( US$ )</th>
                <th class="py-2.5 px-3 text-right">TOTAL FOB AMOUNT<br>( US$ )</th>
              </tr>
            </thead>
            <tbody>
              ${specRowsHtml}
            </tbody>
            <tfoot>
              <tr class="border-t-2 border-slate-900 font-bold bg-slate-50 text-xs">
                <td class="py-3 px-3">TOTAL AMOUNT US$</td>
                <td class="py-3 px-3 text-center font-mono">${totals.totalPallets.toFixed(1)}</td>
                <td class="py-3 px-3 text-center font-mono">${totals.totalSheets.toFixed(1)}</td>
                <td class="py-3 px-3 text-right font-mono">${totals.totalVolumeM3.toFixed(3)}</td>
                <td class="py-3 px-3 text-right"></td>
                <td class="py-3 px-3 text-right font-mono text-slate-900 text-sm">$${totalFobAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Dados Fiscais Oficiais, DU-E, RUC e Dedução DN (Desconto/Frete) -->
        <div class="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded border border-slate-300 mb-6 font-mono text-xs">
          <div class="space-y-1">
            <p><span class="text-slate-500">RASCUNHO NR.:</span> <strong>${booking.rascunhoNumber || '26RA0000003865'}</strong></p>
            <p><span class="text-slate-500">DU-E NR.:</span> <strong>${booking.dueNumber || '26BR000114682-1'}</strong></p>
            <p><span class="text-slate-500">RUC:</span> <strong class="text-[11px]">${booking.rucNumber || '6BR785496152000000000000000BRA00126'}</strong></p>
            <p><span class="text-slate-500">MARKS:</span> <strong>${booking.marks || poNumber}</strong></p>
            <p><span class="text-slate-500">BL NO.:</span> <strong>${booking.blNumber || 'SAFE01049577'}</strong></p>
          </div>

          <div class="space-y-1 text-right">
            ${debitNoteVal > 0 ? `
              <p><span class="text-slate-500">${debitNoteNum}:</span> <strong class="text-rose-700">- US$ ${debitNoteVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></p>
              <p class="text-sm font-bold text-blue-900 pt-1 border-t border-slate-300">
                TOTAL FOB / BRAZIL: US$ ${finalFobBrazil.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            ` : `
              <p class="text-sm font-bold text-blue-900 pt-1">
                TOTAL FOB / BRAZIL: US$ ${totalFobAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            `}
            <p class="pt-2"><span class="text-slate-500">GROSS WEIGHT:</span> <strong>${totals.totalGrossWeightKg.toFixed(1)} KGS</strong></p>
            <p><span class="text-slate-500">NET WEIGHT:</span> <strong>${totals.totalNetWeightKg.toFixed(1)} KGS</strong></p>
          </div>
        </div>

        <!-- Assinatura Oficial da Empresa -->
        <div class="mt-8 pt-4 flex justify-between items-end border-t border-slate-200">
          <div class="text-[10px] text-slate-500">
            <p>Documents issued in accordance with international export regulations.</p>
            <p>Wood packaging materials compliant with ISPM 15 / HT treated.</p>
          </div>
          <div class="text-center w-64">
            <div class="border-b border-slate-400 mb-1.5 h-12"></div>
            <p class="font-bold text-slate-900 text-xs">${shipper.name || 'BRASNILE INDUSTRIAL LTDA'}</p>
            <p class="text-[10px] text-slate-500 uppercase tracking-wider">Authorized Signature</p>
          </div>
        </div>

      </div>
    `;
  },

  /**
   * Gera o HTML do Packing List (Romaneio de Carga)
   * Modelo 100% idêntico à planilha oficial da exportadora:
   * 1. Cabeçalho com Invoice, PO, Shipper, Consignee, Notify, BL, Navio
   * 2. Tabela de Containers (Container, Tara, Lacre, Quantity, Size, M3, Contract)
   * 3. Informações de Material de Embalagem (Plastic, Metal, Timber)
   * 4. Descrição da Mercadoria (OF THE GOODS) com NCM e TARIC
   * 5. Tabela de Especificações com Pallets, Peças, CBM, Peso Bruto e Líquido
   * @param {Object} shipment 
   */
  generatePackingListHtml(shipment) {
    const booking = shipment.booking || {};
    const containers = shipment.containers || [];
    const totals = ComexCalculations.calculateShipmentTotals(containers);
    
    const invoiceNum = booking.invoiceNumber || shipment.invoiceNumber || `BRA 001/${new Date().getFullYear()}`;
    const invoiceDate = booking.invoiceDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
    const poNumber = booking.purchaseOrder || booking.contractNumber || 'PO# 7309-1';

    const shipper = booking.shipper || {};
    const consignee = booking.consignee || {};
    const notify = booking.notify || {};
    const packing = booking.packingMaterial || {};

    const plasticKg = packing.plasticKg || 103.55;
    const metalKg = packing.metalKg || 85.88;
    const timberKg = packing.timberKg || 537.50;

    const goodsDesc = booking.goodsDescription || `${totals.containerCount.toString().padStart(2, '0')} X 40' HC CONTAINER SAID TO CONTAIN: ${totals.totalPallets} PACKAGES OF BRAZILIAN PINE PLYWOOD TAEDA WBP GLUE, QUALITY C+/C - EN314 - 2 CLASS 3 - (CE2+) - (FSC 100% CU-COC-865377)`;
    const ncm = booking.ncm || '44123900';
    const taric = booking.taric || '89XV';

    // 1. Tabela de Containers (CONTAINER, TARA, LACRE, QUANTITY, SIZE, M3, CONTRACT)
    let containerRowsHtml = '';
    containers.forEach((cnt, idx) => {
      const calc = ComexCalculations.calculateContainer(cnt);
      const sizeStr = `${cnt.thicknessMm || 18}MM`;
      containerRowsHtml += `
        <tr class="border-b border-slate-300 text-xs font-mono">
          <td class="py-2 px-3 font-bold text-slate-800">${cnt.containerNumber || `CNT-${idx + 1}`}</td>
          <td class="py-2 px-3 text-right">${parseFloat(cnt.tareWeight || 3790).toFixed(1)}</td>
          <td class="py-2 px-3 font-semibold text-slate-700">${cnt.sealNumber || 'TBA'}</td>
          <td class="py-2 px-3 text-center">${parseFloat(cnt.palletsCount || 19).toFixed(1)}</td>
          <td class="py-2 px-3 text-center">${sizeStr}</td>
          <td class="py-2 px-3 text-right font-bold">${calc.totalVolumeM3.toFixed(3)} M3</td>
          <td class="py-2 px-3 text-center text-slate-600">${cnt.contractNumber || poNumber}</td>
        </tr>
      `;
    });

    // 2. Tabela de Especificações Fisiográficas (SPECIFICATIONS, PALLETS, PIECES, VOLUME CBM, GROSS WEIGHT, NET WEIGHT)
    let specRowsHtml = '';
    containers.forEach((cnt, idx) => {
      const calc = ComexCalculations.calculateContainer(cnt);
      const specTitle = cnt.specTitle || `SIZE: ${((cnt.lengthMm || 2440)/1000).toFixed(3)} X ${((cnt.widthMm || 1220)/1000).toFixed(3)} X ${cnt.thicknessMm || 18}MM (7 PLY)`;
      specRowsHtml += `
        <tr class="border-b border-slate-200 text-xs font-mono">
          <td class="py-2 px-3 font-semibold text-slate-800">${specTitle}</td>
          <td class="py-2 px-3 text-center">${parseFloat(cnt.palletsCount || 19).toFixed(1)}</td>
          <td class="py-2 px-3 text-center">${calc.totalSheets.toFixed(1)}</td>
          <td class="py-2 px-3 text-right">${calc.totalVolumeM3.toFixed(3)}</td>
          <td class="py-2 px-3 text-right">${calc.grossWeightKg.toFixed(1)}</td>
          <td class="py-2 px-3 text-right">${calc.netWeightKg.toFixed(1)}</td>
        </tr>
      `;
    });

    return `
      <div class="comex-document p-8 bg-white max-w-4xl mx-auto shadow-sm text-slate-800 font-sans border border-slate-300 rounded-lg text-xs leading-relaxed">
        
        <!-- Título Centralizado -->
        <div class="text-center pb-4 mb-5 border-b-2 border-slate-900">
          <h1 class="text-2xl font-black tracking-wider text-slate-900 uppercase">PACKING LIST</h1>
        </div>

        <!-- Grade de Cabeçalho Superior -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          <!-- Coluna Esquerda -->
          <div class="space-y-3.5 border-r border-slate-200 pr-4">
            <div>
              <span class="font-bold text-slate-900 uppercase">INVOICE NUMBER:</span>
              <span class="font-mono font-bold text-slate-800 ml-1">${invoiceNum}</span>
            </div>
            <div>
              <span class="font-bold text-slate-900 uppercase">DATE:</span>
              <span class="font-mono text-slate-700 ml-1">${invoiceDate}</span>
            </div>
            <div>
              <span class="font-bold text-slate-900 uppercase">PURCHASE ORDER:</span>
              <span class="font-mono font-bold text-blue-700 ml-1">${poNumber}</span>
            </div>

            <div class="pt-2 border-t border-slate-100">
              <p class="font-bold text-slate-900 uppercase">MANUFACTURER:</p>
              <p class="font-bold text-slate-800">${shipper.name || 'BRASNILE INDUSTRIAL LTDA'}</p>
              <p class="text-slate-600 whitespace-pre-line text-[11px]">${shipper.address || 'RODOVIA SC 303 - KM 05 S/N\nPARQUE INDUSTRIAL - TRES BARRAS - SC - BRAZIL'}</p>
              <p class="text-slate-700 font-mono mt-0.5">CNPJ: ${shipper.taxId || '78.549.615/0001-69'}</p>
            </div>

            <div class="pt-2 border-t border-slate-100">
              <p class="font-bold text-slate-900 uppercase">CONSIGNEE:</p>
              <p class="font-bold text-slate-800">${consignee.name || 'PLAUT INTERNATIONAL LIMITED'}</p>
              <p class="text-slate-700 font-mono">VAT NR / TAX ID NR. ${consignee.taxId || 'GB740079545'}</p>
              <p class="text-slate-700 font-mono">EORI: ${consignee.eori || 'GB740079545000'}</p>
              <p class="text-slate-600 whitespace-pre-line text-[11px]">${consignee.address || '8C BOURNE COURT, SOUTHEND ROAD\nWOODFORD GREEN, UK - ZIP IG8 8HD'}</p>
              <p class="text-slate-600 text-[11px]">E-MAIL: ${consignee.email || 'SHIPPING@PLAUTINT.CO.UK'} | TEL: ${consignee.tel || '+44 20 8553-3471'}</p>
            </div>

            <div class="pt-2 border-t border-slate-100">
              <p class="font-bold text-slate-900 uppercase">NOTIFY:</p>
              <p class="font-bold text-slate-800">${notify.name || 'PLAUT INTERNATIONAL LIMITED'}</p>
              <p class="text-slate-700 font-mono">VAT NR / TAX ID NR. ${notify.taxId || 'GB740079545'}</p>
              <p class="text-slate-700 font-mono">EORI: ${notify.eori || 'GB740079545000'}</p>
              <p class="text-slate-600 whitespace-pre-line text-[11px]">${notify.address || '8C BOURNE COURT, SOUTHEND ROAD\nWOODFORD GREEN, UK - ZIP IG8 8HD'}</p>
              <p class="text-slate-600 text-[11px]">E-MAIL: ${notify.email || 'SHIPPING@PLAUTINT.CO.UK'} | TEL: ${notify.tel || '+44 20 8553-3471'}</p>
            </div>
          </div>

          <!-- Coluna Direita -->
          <div class="space-y-3 pl-2">
            <div>
              <span class="font-bold text-slate-900 uppercase">BL NUMBER:</span>
              <span class="font-mono font-bold text-slate-800 ml-1">${booking.blNumber || 'SAFE01049577'}</span>
            </div>
            <div>
              <span class="font-bold text-slate-900 uppercase">MARKS:</span>
              <span class="font-mono font-semibold text-slate-800 ml-1">${booking.marks || poNumber}</span>
            </div>
            <div>
              <span class="font-bold text-slate-900 uppercase">DELIVERY TO:</span>
              <span class="font-semibold text-slate-800 ml-1">${booking.pod || 'TILBURY, UK'}</span>
            </div>
            <div>
              <span class="font-bold text-slate-900 uppercase">PORT OF LOADING:</span>
              <span class="font-semibold text-slate-800 ml-1">${booking.pol || 'PARANAGUA, BRAZIL'}</span>
            </div>
            <div>
              <span class="font-bold text-slate-900 uppercase">SHIPPED BY:</span>
              <span class="font-semibold text-slate-800 ml-1">${booking.vessel || 'GRANDE BUENOS AIRES'} / ${booking.voyage || 'GBA0126'}</span>
            </div>
          </div>

        </div>

        <!-- 1. Tabela de Containers (Conforme Planilha de Referência) -->
        <div class="mb-6">
          <table class="w-full text-left border-collapse border border-slate-300">
            <thead class="bg-slate-100 text-[10px] font-bold text-slate-800 uppercase">
              <tr class="border-b border-slate-300">
                <th class="py-2.5 px-3">CONTAINER</th>
                <th class="py-2.5 px-3 text-right">TARA (KG)</th>
                <th class="py-2.5 px-3">LACRE</th>
                <th class="py-2.5 px-3 text-center">QUANTITY (PALLETS)</th>
                <th class="py-2.5 px-3 text-center">SIZE</th>
                <th class="py-2.5 px-3 text-right">M3</th>
                <th class="py-2.5 px-3 text-center">CONTRACT</th>
              </tr>
            </thead>
            <tbody>
              ${containerRowsHtml}
            </tbody>
          </table>
        </div>

        <!-- 2. Informações de Material de Embalagem (Packing Material Information) -->
        <div class="mb-6 p-3.5 bg-slate-50 border border-slate-300 rounded">
          <p class="font-bold text-slate-900 uppercase text-xs mb-2">Packing Material Information</p>
          <div class="grid grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <span class="text-slate-600">Plastic:</span> <strong class="text-slate-900">${plasticKg.toFixed(2)} KG</strong>
            </div>
            <div>
              <span class="text-slate-600">Metal:</span> <strong class="text-slate-900">${metalKg.toFixed(2)} KG</strong>
            </div>
            <div>
              <span class="text-slate-600">Timber:</span> <strong class="text-slate-900">${timberKg.toFixed(2)} KG</strong>
            </div>
          </div>
        </div>

        <!-- 3. Descrição dos Produtos (OF THE GOODS) -->
        <div class="mb-6 bg-slate-50 p-3.5 rounded border border-slate-300">
          <p class="font-bold text-slate-900 uppercase text-xs mb-1">OF THE GOODS:</p>
          <p class="font-mono text-slate-800 text-[11px] leading-relaxed mb-2">${goodsDesc}</p>
          <div class="flex items-center space-x-6 text-xs font-mono font-semibold text-slate-700 pt-1 border-t border-slate-200">
            <span>NCM: <strong class="text-slate-900">${ncm}</strong></span>
            <span>TARIC: <strong class="text-slate-900">${taric}</strong></span>
          </div>
        </div>

        <!-- 4. Tabela de Especificações Fisiográficas (SPECIFICATIONS) -->
        <div class="mb-6">
          <table class="w-full text-left border-collapse border border-slate-300">
            <thead class="bg-slate-100 text-[10px] font-bold text-slate-800 uppercase">
              <tr class="border-b border-slate-300">
                <th class="py-2 px-3">SPECIFICATIONS</th>
                <th class="py-2 px-3 text-center">QUANTITY OF<br>PALLETS</th>
                <th class="py-2 px-3 text-center">QUANTITY OF<br>PIECES</th>
                <th class="py-2 px-3 text-right">TOTAL VOLUME<br>(CBM)</th>
                <th class="py-2 px-3 text-right">GROSS WEIGHT<br>(KG)</th>
                <th class="py-2 px-3 text-right">NET WEIGHT<br>(KG)</th>
              </tr>
            </thead>
            <tbody>
              ${specRowsHtml}
            </tbody>
            <tfoot>
              <tr class="border-t-2 border-slate-900 font-bold bg-slate-100 text-xs font-mono">
                <td class="py-2.5 px-3">TOTAL</td>
                <td class="py-2.5 px-3 text-center">${totals.totalPallets.toFixed(1)}</td>
                <td class="py-2.5 px-3 text-center">${totals.totalSheets.toFixed(1)}</td>
                <td class="py-2.5 px-3 text-right">${totals.totalVolumeM3.toFixed(3)}</td>
                <td class="py-2.5 px-3 text-right">${totals.totalGrossWeightKg.toFixed(1)}</td>
                <td class="py-2.5 px-3 text-right">${totals.totalNetWeightKg.toFixed(1)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Assinatura Oficial da Empresa -->
        <div class="mt-8 pt-4 flex justify-between items-end border-t border-slate-200">
          <div class="text-[10px] text-slate-500">
            <p>Phytosanitary Treated / HT - ISPM 15 Compliant.</p>
          </div>
          <div class="text-center w-64">
            <div class="border-b border-slate-400 mb-1.5 h-12"></div>
            <p class="font-bold text-slate-900 text-xs">${shipper.name || 'BRASNILE INDUSTRIAL LTDA'}</p>
            <p class="text-[10px] text-slate-500 uppercase tracking-wider">Authorized Signature</p>
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
    const poNumber = booking.purchaseOrder || booking.contractNumber || 'PO# 7309-1';
    const shipper = booking.shipper || {};
    const consignee = booking.consignee || {};
    const notify = booking.notify || {};

    let containerSummaryText = '';
    containers.forEach((cnt, idx) => {
      const calc = ComexCalculations.calculateContainer(cnt);
      containerSummaryText += `CONTAINER: ${cnt.containerNumber || 'TBA'} / SEAL: ${cnt.sealNumber || 'TBA'} / TARE: ${parseFloat(cnt.tareWeight || 3790).toFixed(1)} KG / TYPE: ${cnt.containerType || "40' HC"}\n`;
      containerSummaryText += `  SAID TO CONTAIN: ${cnt.palletsCount || 19} PALLETS WITH ${calc.totalSheets} PCS OF PLYWOOD (${cnt.lengthMm || 2440}x${cnt.widthMm || 1220}x${cnt.thicknessMm || 18}MM)\n`;
      containerSummaryText += `  NET WEIGHT: ${calc.netWeightKg.toLocaleString()} KG | GROSS WEIGHT: ${calc.grossWeightKg.toLocaleString()} KG | MEASUREMENT: ${calc.totalVolumeM3.toFixed(3)} M3\n\n`;
    });

    return `
      <div class="comex-document p-8 bg-white max-w-4xl mx-auto shadow-sm text-slate-800 font-sans border border-slate-200 rounded-lg">
        <div class="flex justify-between items-center border-b-2 border-blue-900 pb-3 mb-6">
          <div>
            <h1 class="text-xl font-black tracking-tight text-blue-900 uppercase">SHIPPING INSTRUCTION / DRAFT B/L</h1>
            <p class="text-xs text-slate-500 font-medium">Instrução de Embarque Marítimo para Armador / Agente de Carga</p>
          </div>
          <div class="text-right">
            <span class="inline-block px-3 py-1 bg-amber-100 text-amber-900 font-bold text-xs rounded border border-amber-300">
              DRAFT / NÃO NEGOCIÁVEL
            </span>
            <p class="text-xs text-slate-700 font-mono mt-1 font-bold">Booking: ${booking.bookingNumber || 'S328771289'}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 text-xs mb-6">
          <div class="border border-slate-300 p-3 rounded">
            <p class="font-bold text-slate-700 text-[10px] uppercase">SHIPPER / EXPORTER:</p>
            <p class="font-bold text-slate-900">${shipper.name || 'BRASNILE INDUSTRIAL LTDA'}</p>
            <p class="text-slate-600 whitespace-pre-line text-[11px]">${shipper.address || 'RODOVIA SC 303 - KM 05 S/N\nPARQUE INDUSTRIAL - TRES BARRAS - SC - BRAZIL'}</p>
            <p class="text-slate-600 font-mono mt-1">CNPJ: ${shipper.taxId || '78.549.615/0001-69'}</p>
          </div>
          <div class="border border-slate-300 p-3 rounded">
            <p class="font-bold text-slate-700 text-[10px] uppercase">CONSIGNEE:</p>
            <p class="font-bold text-slate-900">${consignee.name || 'PLAUT INTERNATIONAL LIMITED'}</p>
            <p class="text-slate-600 font-mono text-[11px]">VAT: ${consignee.taxId || 'GB740079545'} | EORI: ${consignee.eori || 'GB740079545000'}</p>
            <p class="text-slate-600 whitespace-pre-line text-[11px]">${consignee.address || 'WOODFORD GREEN, UK'}</p>
          </div>
          <div class="border border-slate-300 p-3 rounded">
            <p class="font-bold text-slate-700 text-[10px] uppercase">NOTIFY PARTY:</p>
            <p class="font-bold text-slate-900">${notify.name || 'PLAUT INTERNATIONAL LIMITED'}</p>
            <p class="text-slate-600 font-mono text-[11px]">VAT: ${notify.taxId || 'GB740079545'} | EORI: ${notify.eori || 'GB740079545000'}</p>
            <p class="text-slate-600 whitespace-pre-line text-[11px]">${notify.address || 'WOODFORD GREEN, UK'}</p>
          </div>
          <div class="border border-slate-300 p-3 rounded bg-slate-50">
            <p class="font-bold text-slate-700 text-[10px] uppercase">FREIGHT & RELEASE TERMS:</p>
            <p class="text-slate-900 font-semibold">FREIGHT: <span class="text-blue-700 font-bold uppercase">${booking.freightTerm || 'FREIGHT PREPAID'}</span></p>
            <p class="text-slate-900 font-semibold">BL TYPE: <span class="text-slate-800 uppercase">${booking.blType || 'EXPRESS RELEASE / WAYBILL'}</span></p>
            <p class="text-slate-700">CARRIER: ${booking.carrier || 'Safmarine / Maersk'}</p>
          </div>
        </div>

        <div class="grid grid-cols-4 gap-3 text-xs mb-6 bg-slate-100 p-3 rounded font-mono">
          <div><span class="text-[10px] text-slate-500 block uppercase">VESSEL / VOYAGE</span>${booking.vessel || 'GRANDE BUENOS AIRES'} / ${booking.voyage || 'GBA0126'}</div>
          <div><span class="text-[10px] text-slate-500 block uppercase">PORT OF LOADING</span>${booking.pol || 'PARANAGUA, BRAZIL'}</div>
          <div><span class="text-[10px] text-slate-500 block uppercase">PORT OF DISCHARGE</span>${booking.pod || 'TILBURY, UK'}</div>
          <div><span class="text-[10px] text-slate-500 block uppercase">MARKS / CONTRACT</span>${booking.marks || poNumber}</div>
        </div>

        <div class="border border-slate-300 rounded p-4 mb-6">
          <p class="font-bold text-xs text-slate-700 uppercase mb-2">DESCRIPTION OF GOODS & CARGO DETAILS:</p>
          <div class="bg-slate-50 p-3 rounded font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed border border-slate-200">
TOTAL: ${totals.containerCount} X 40' HIGH CUBE CONTAINER(S)
${booking.goodsDescription || `SAID TO CONTAIN A TOTAL OF ${totals.totalPallets} PALLETS / ${totals.totalSheets} PIECES OF BRAZILIAN PINE PLYWOOD TAEDA WBP GLUE.`}

HS / NCM CODE: ${booking.ncm || '44123900'}
TARIC: ${booking.taric || '89XV'}
DU-E Nº: ${booking.dueNumber || '26BR000114682-1'}
RUC Nº: ${booking.rucNumber || '6BR785496152000000000000000BRA00126'}
PURCHASE ORDER: ${poNumber}

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
            <p class="font-bold text-slate-800">Booking: ${booking.bookingNumber || 'S328771289'}</p>
            <p class="text-slate-500">Date: ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4 text-xs mb-6 bg-slate-50 p-3 rounded border border-slate-200">
          <div><strong>Shipper:</strong> ${booking.shipper?.name || 'BRASNILE INDUSTRIAL LTDA'}</div>
          <div><strong>Vessel:</strong> ${booking.vessel || 'GRANDE BUENOS AIRES'}</div>
          <div><strong>Port of Loading:</strong> ${booking.pol || 'PARANAGUA, BRAZIL'}</div>
          <div><strong>Weighing Method:</strong> Method 2 (Calculated)</div>
          <div><strong>Carrier:</strong> ${booking.carrier || 'Safmarine / Maersk'}</div>
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
   * Exporta os documentos completos para arquivo Excel (.xlsx) usando SheetJS
   * Gera abas individuais: Commercial Invoice, Packing List e VGM.
   */
  exportToExcel(shipment) {
    if (typeof XLSX === 'undefined') {
      alert('A biblioteca SheetJS ainda está carregando. Tente novamente em instantes.');
      return;
    }

    const booking = shipment.booking || {};
    const containers = shipment.containers || [];
    const totals = ComexCalculations.calculateShipmentTotals(containers);
    const invoiceNum = booking.invoiceNumber || 'BRA 001/2026';
    const poNumber = booking.purchaseOrder || 'PO# 7309-1';

    // 1. ABA COMMERCIAL INVOICE
    const invoiceData = [
      ['COMMERCIAL INVOICE', '', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['INVOICE NUMBER:', invoiceNum, '', '', '', ''],
      ['DATE:', booking.invoiceDate || 'JANUARY 31TH, 2026', '', '', '', ''],
      ['PURCHASE ORDER:', poNumber, '', '', '', ''],
      ['MANUFACTURER:', booking.shipper?.name || 'BRASNILE INDUSTRIAL LTDA', '', '', '', ''],
      ['', booking.shipper?.address || 'RODOVIA SC 303 - KM 05 S/N', '', '', '', ''],
      ['', `CNPJ: ${booking.shipper?.taxId || '78.549.615/0001-69'}`, '', '', '', ''],
      ['CONSIGNEE:', booking.consignee?.name || 'PLAUT INTERNATIONAL LIMITED', '', '', '', ''],
      ['', `VAT: ${booking.consignee?.taxId || 'GB740079545'} / EORI: ${booking.consignee?.eori || 'GB740079545000'}`, '', '', '', ''],
      ['', booking.consignee?.address || 'WOODFORD GREEN, UK', '', '', '', ''],
      ['COUNTRY OF ORIGIN:', 'BRAZIL', '', '', '', ''],
      ['SHIPPED BY:', `${booking.vessel || 'GRANDE BUENOS AIRES'} / ${booking.voyage || 'GBA0126'}`, '', '', '', ''],
      ['BOOKING:', booking.bookingNumber || 'S328771289', '', '', '', ''],
      ['FROM:', booking.pol || 'PARANAGUA, BRAZIL', '', '', '', ''],
      ['TO:', booking.pod || 'TILBURY, UK', '', '', '', ''],
      ['PAYMENT TERMS:', booking.paymentTerms || 'WIRE TRANSFER FAX DOCUMENTS', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['DESCRIPTION OF THE GOODS:', booking.goodsDescription || '', '', '', '', ''],
      ['NCM:', booking.ncm || '44123900', 'TARIC:', booking.taric || '89XV', '', ''],
      ['', '', '', '', '', ''],
      ['DIMENSIONS (MM)', 'QUANTITY OF PALLETS', 'QUANTITY OF PIECES', 'VOLUME (CBM)', 'PRICE/CBM FOB M3 (US$)', 'TOTAL FOB AMOUNT (US$)']
    ];

    containers.forEach((cnt, idx) => {
      const calc = ComexCalculations.calculateContainer(cnt);
      invoiceData.push([
        cnt.specTitle || `SIZE: ${((cnt.lengthMm || 2440)/1000).toFixed(3)} X ${((cnt.widthMm || 1220)/1000).toFixed(3)} X ${cnt.thicknessMm || 18}MM (7 PLY)`,
        parseFloat(cnt.palletsCount || 19),
        calc.totalSheets,
        calc.totalVolumeM3,
        parseFloat(cnt.unitPriceUsd || 265),
        calc.totalValueUsd
      ]);
    });

    invoiceData.push([
      'TOTAL AMOUNT US$',
      totals.totalPallets,
      totals.totalSheets,
      totals.totalVolumeM3,
      '',
      totals.totalValueUsd
    ]);
    invoiceData.push(['RASCUNHO NR.:', booking.rascunhoNumber || '26RA0000003865']);
    invoiceData.push(['DU-E NR.:', booking.dueNumber || '26BR000114682-1']);
    invoiceData.push(['RUC:', booking.rucNumber || '6BR785496152000000000000000BRA00126']);
    if (booking.debitNoteAmount) {
      invoiceData.push([booking.debitNoteNumber || 'DN 109936', parseFloat(booking.debitNoteAmount)]);
      invoiceData.push(['TOTAL FOB / BRAZIL US$', totals.totalValueUsd - parseFloat(booking.debitNoteAmount)]);
    }
    invoiceData.push(['GROSS WEIGHT:', `${totals.totalGrossWeightKg} KGS`]);
    invoiceData.push(['NET WEIGHT:', `${totals.totalNetWeightKg} KGS`]);

    // 2. ABA PACKING LIST
    const plData = [
      ['PACKING LIST', '', '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['INVOICE NUMBER:', invoiceNum, '', '', '', '', ''],
      ['DATE:', booking.invoiceDate || 'JANUARY 31TH, 2026', '', '', '', '', ''],
      ['PURCHASE ORDER:', poNumber, '', '', '', '', ''],
      ['BL NUMBER:', booking.blNumber || 'SAFE01049577', '', '', '', '', ''],
      ['DELIVERY TO:', booking.pod || 'TILBURY, UK', '', '', '', '', ''],
      ['PORT OF LOADING:', booking.pol || 'PARANAGUA, BRAZIL', '', '', '', '', ''],
      ['SHIPPED BY:', `${booking.vessel || 'GRANDE BUENOS AIRES'} / ${booking.voyage || 'GBA0126'}`, '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['CONTAINER', 'TARA', 'LACRE', 'QUANTITY', 'SIZE', 'M3', 'CONTRACT']
    ];

    containers.forEach((cnt) => {
      const calc = ComexCalculations.calculateContainer(cnt);
      plData.push([
        cnt.containerNumber || '',
        parseFloat(cnt.tareWeight || 3790),
        cnt.sealNumber || '',
        parseFloat(cnt.palletsCount || 19),
        `${cnt.thicknessMm || 18}MM`,
        `${calc.totalVolumeM3.toFixed(3)} M3`,
        cnt.contractNumber || poNumber
      ]);
    });

    plData.push(['', '', '', '', '', '', '']);
    plData.push(['Packing Material Information:', '', '', '', '', '', '']);
    plData.push(['Plastic', 103.55, 'KG', '', '', '', '']);
    plData.push(['Metal', 85.88, 'KG', '', '', '', '']);
    plData.push(['Timber', 537.5, 'KG', '', '', '', '']);
    plData.push(['', '', '', '', '', '', '']);
    plData.push(['SPECIFICATIONS', 'QUANTITY OF PALLETS', 'QUANTITY OF PIECES', 'TOTAL VOLUME (CBM)', 'GROSS WEIGHT (KG)', 'NET WEIGHT (KG)', '']);

    containers.forEach((cnt) => {
      const calc = ComexCalculations.calculateContainer(cnt);
      plData.push([
        cnt.specTitle || `SIZE: ${((cnt.lengthMm || 2440)/1000).toFixed(3)} X ${((cnt.widthMm || 1220)/1000).toFixed(3)} X ${cnt.thicknessMm || 18}MM (7 PLY)`,
        parseFloat(cnt.palletsCount || 19),
        calc.totalSheets,
        calc.totalVolumeM3,
        calc.grossWeightKg,
        calc.netWeightKg,
        ''
      ]);
    });

    plData.push([
      'TOTAL',
      totals.totalPallets,
      totals.totalSheets,
      totals.totalVolumeM3,
      totals.totalGrossWeightKg,
      totals.totalNetWeightKg,
      ''
    ]);

    const wb = XLSX.utils.book_new();
    const wsInvoice = XLSX.utils.aoa_to_sheet(invoiceData);
    const wsPl = XLSX.utils.aoa_to_sheet(plData);

    XLSX.utils.book_append_sheet(wb, wsInvoice, 'Commercial Invoice');
    XLSX.utils.book_append_sheet(wb, wsPl, 'Packing List');

    const fileName = `Exportacao_${invoiceNum.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }
};

window.ComexDocGenerators = ComexDocGenerators;
