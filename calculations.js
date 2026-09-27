/**
 * ComexFlow - Motor de Cálculos Aduaneiros e Comércio Exterior
 * Fórmulas 100% determinísticas em código puro (Zero alucinação, precisão contábil).
 */

const ComexCalculations = {
  /**
   * Calcula o volume de uma chapa em metros cúbicos (m³)
   * Dimensões fornecidas em milímetros (mm)
   */
  calculateSheetVolumeM3(lengthMm, widthMm, thicknessMm) {
    const l = parseFloat(lengthMm) || 0;
    const w = parseFloat(widthMm) || 0;
    const t = parseFloat(thicknessMm) || 0;

    if (l <= 0 || w <= 0 || t <= 0) return 0;
    // (mm / 1000) => metros
    return (l / 1000) * (w / 1000) * (t / 1000);
  },

  /**
   * Calcula todos os valores e métricas de um único container
   * @param {Object} container 
   */
  calculateContainer(container) {
    const pallets = parseInt(container.palletsCount, 10) || 0;
    const sheetsPerPallet = parseInt(container.sheetsPerPallet, 10) || 0;
    const totalSheets = pallets * sheetsPerPallet;

    const sheetVolM3 = this.calculateSheetVolumeM3(
      container.lengthMm,
      container.widthMm,
      container.thicknessMm
    );

    const totalVolumeM3 = totalSheets * sheetVolM3;

    // Valor da mercadoria em USD
    const unitPrice = parseFloat(container.unitPriceUsd) || 0;
    // O preço geralmente é cotado por m³ (ou por chapa)
    const totalValueUsd = totalVolumeM3 * unitPrice;

    // Pesos
    const netWeight = parseFloat(container.netWeightKg) || 0;
    const grossWeight = parseFloat(container.grossWeightKg) || (netWeight > 0 ? netWeight * 1.03 : 0); // fallback estimativa se não preenchido
    const tare = parseFloat(container.tareWeight) || 3800; // Padrão 40' HC

    // VGM (Verified Gross Mass) = Peso Bruto da Carga + Tara do Container
    const vgm = grossWeight + tare;

    // Limite de Payload (padrão informado no áudio: 32.500 kg)
    const maxPayload = parseFloat(container.maxPayload) || 32500;
    const isOverweight = vgm > maxPayload;
    const overweightKg = isOverweight ? vgm - maxPayload : 0;
    const payloadUsagePercent = maxPayload > 0 ? Math.min(100, (vgm / maxPayload) * 100) : 0;

    return {
      totalSheets,
      sheetVolM3: Number(sheetVolM3.toFixed(6)),
      totalVolumeM3: Number(totalVolumeM3.toFixed(3)),
      totalValueUsd: Number(totalValueUsd.toFixed(2)),
      netWeightKg: Number(netWeight.toFixed(2)),
      grossWeightKg: Number(grossWeight.toFixed(2)),
      tareWeightKg: Number(tare.toFixed(2)),
      vgmKg: Number(vgm.toFixed(2)),
      maxPayloadKg: maxPayload,
      isOverweight,
      overweightKg: Number(overweightKg.toFixed(2)),
      payloadUsagePercent: Number(payloadUsagePercent.toFixed(1))
    };
  },

  /**
   * Totaliza todo o embarque somando todos os containers
   * @param {Array} containers 
   */
  calculateShipmentTotals(containers = []) {
    const totals = {
      containerCount: containers.length,
      totalPallets: 0,
      totalSheets: 0,
      totalVolumeM3: 0,
      totalValueUsd: 0,
      totalNetWeightKg: 0,
      totalGrossWeightKg: 0,
      totalTareKg: 0,
      totalVgmKg: 0,
      hasOverweightContainer: false,
      overweightContainers: []
    };

    containers.forEach((cnt, idx) => {
      const calc = this.calculateContainer(cnt);
      totals.totalPallets += parseInt(cnt.palletsCount, 10) || 0;
      totals.totalSheets += calc.totalSheets;
      totals.totalVolumeM3 += calc.totalVolumeM3;
      totals.totalValueUsd += calc.totalValueUsd;
      totals.totalNetWeightKg += calc.netWeightKg;
      totals.totalGrossWeightKg += calc.grossWeightKg;
      totals.totalTareKg += calc.tareWeightKg;
      totals.totalVgmKg += calc.vgmKg;

      if (calc.isOverweight) {
        totals.hasOverweightContainer = true;
        totals.overweightContainers.push({
          index: idx + 1,
          containerNumber: cnt.containerNumber || `Container #${idx + 1}`,
          vgm: calc.vgmKg,
          limit: calc.maxPayloadKg,
          excess: calc.overweightKg
        });
      }
    });

    totals.totalVolumeM3 = Number(totals.totalVolumeM3.toFixed(3));
    totals.totalValueUsd = Number(totals.totalValueUsd.toFixed(2));
    totals.totalNetWeightKg = Number(totals.totalNetWeightKg.toFixed(2));
    totals.totalGrossWeightKg = Number(totals.totalGrossWeightKg.toFixed(2));
    totals.totalTareKg = Number(totals.totalTareKg.toFixed(2));
    totals.totalVgmKg = Number(totals.totalVgmKg.toFixed(2));

    return totals;
  },

  /**
   * Avalia a urgência de um Deadline (Draft ou Carga)
   * Retorna { status: 'safe'|'warning'|'danger'|'expired', hoursLeft, text }
   */
  evaluateDeadline(deadlineIsoString) {
    if (!deadlineIsoString) {
      return { status: 'none', hoursLeft: null, text: 'Sem data definida' };
    }

    const target = new Date(deadlineIsoString).getTime();
    const now = Date.now();
    const diffMs = target - now;

    if (isNaN(target)) {
      return { status: 'none', hoursLeft: null, text: 'Data inválida' };
    }

    if (diffMs <= 0) {
      const hoursAgo = Math.abs(Math.round(diffMs / (1000 * 60 * 60)));
      return {
        status: 'expired',
        hoursLeft: 0,
        text: `VENCIDO há ${hoursAgo}h`
      };
    }

    const hoursLeft = diffMs / (1000 * 60 * 60);

    if (hoursLeft <= 6) {
      return {
        status: 'danger',
        hoursLeft: Number(hoursLeft.toFixed(1)),
        text: `CRÍTICO: ${Math.floor(hoursLeft)}h ${Math.round((hoursLeft % 1) * 60)}m restantes!`
      };
    } else if (hoursLeft <= 24) {
      return {
        status: 'warning',
        hoursLeft: Number(hoursLeft.toFixed(1)),
        text: `Atenção: ${Math.floor(hoursLeft)}h restantes (menos de 24h)`
      };
    } else {
      const days = Math.floor(hoursLeft / 24);
      const remainingHours = Math.round(hoursLeft % 24);
      return {
        status: 'safe',
        hoursLeft: Number(hoursLeft.toFixed(1)),
        text: `${days}d ${remainingHours}h restantes`
      };
    }
  }
};

window.ComexCalculations = ComexCalculations;
