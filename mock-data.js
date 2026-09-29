/**
 * ComexFlow - Dados de Exemplo Baseados no Modelo Real da Exportadora
 * Modelo fiel ao processo real de exportação de madeira (Compensado Taeda WBP).
 * Exportador: BRASNILE INDUSTRIAL LTDA | Importador: PLAUT INTERNATIONAL LIMITED (UK)
 */

const ComexMockData = {
  getSampleShipment() {
    const now = new Date();
    
    // Prazos realistas para demonstração
    const draftDate = new Date(now.getTime() + 14 * 60 * 60 * 1000); // 14h (alerta amarelo)
    const cargoDate = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 3 dias (seguro verde)

    const pad = (n) => String(n).padStart(2, '0');
    const formatInputDateTime = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    return {
      id: 'ship_brasnile_bra001_2026',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      status: 'active',
      title: 'Embarque 5x40\' HC - Compensado Taeda WBP (Tilbury UK - BRA 001/2026)',
      booking: {
        invoiceNumber: 'BRA 001/2026',
        invoiceDate: 'JANUARY 31TH, 2026',
        purchaseOrder: 'PO# 7309-1',
        contractNumber: 'PO# 7309-1',
        blNumber: 'SAFE01049577',
        marks: 'PO# 7309-1',
        bookingNumber: 'S328771289',
        carrier: 'Safmarine / Maersk',
        vessel: 'GRANDE BUENOS AIRES',
        voyage: 'GBA0126',
        pol: 'PARANAGUA, BRAZIL',
        pod: 'TILBURY, UK',
        deliveryTo: 'TILBURY, UK',
        countryOfOrigin: 'BRAZIL',
        draftDeadline: formatInputDateTime(draftDate),
        cargoDeadline: formatInputDateTime(cargoDate),
        draftSent: false,
        cargoDelivered: false,
        freightTerm: 'Prepaid',
        blType: 'Express Release',
        ncm: '44123900',
        taric: '89XV',
        rascunhoNumber: '26RA0000003865',
        dueNumber: '26BR000114682-1',
        rucNumber: '6BR785496152000000000000000BRA00126',
        debitNoteNumber: 'DN 109936',
        debitNoteAmount: 951.04,
        paymentTerms: 'WIRE TRANSFER FAX DOCUMENTS',
        goodsDescription: "05 X 40' HC CONTAINER SAID TO CONTAIN: 95 PACKAGES OF BRAZILIAN PINE PLYWOOD TAEDA WBP GLUE, QUALITY C+/C - EN314 - 2 CLASS 3 - (CE2+) - (FSC 100% CU-COC-865377)",
        packingMaterial: {
          plasticKg: 103.55,
          metalKg: 85.88,
          timberKg: 537.50
        },
        bankingDetails: {
          intermediaryBank: '56a BANCO DO BRASIL S.A. _ NEW YORK _ U.S.A.\nSWIFT CODE: BRASUS33',
          finalCredit: 'BANCO DO BRASIL S.A. _ Curitiba _ PR _ BRASIL\n57 A SWIFT CODE: BRASBRRJCTA',
          iban: 'BR1700000000003430000030333C1',
          beneficiaryName: 'BRASNILE INDUSTRIAL LTDA'
        },
        shipper: {
          name: 'BRASNILE INDUSTRIAL LTDA',
          address: 'RODOVIA SC 303 - KM 05 S/N\nPARQUE INDUSTRIAL - TRES BARRAS - SC - BRAZIL',
          taxId: '78.549.615/0001-69'
        },
        consignee: {
          name: 'PLAUT INTERNATIONAL LIMITED',
          taxId: 'GB740079545',
          eori: 'GB740079545000',
          address: '8C BOURNE COURT, SOUTHEND ROAD\nWOODFORD GREEN, UK - ZIP IG8 8HD',
          email: 'SHIPPING@PLAUTINT.CO.UK',
          tel: '+44 20 8553-3471'
        },
        notify: {
          name: 'PLAUT INTERNATIONAL LIMITED',
          taxId: 'GB740079545',
          eori: 'GB740079545000',
          address: '8C BOURNE COURT, SOUTHEND ROAD\nWOODFORD GREEN, UK - ZIP IG8 8HD',
          email: 'SHIPPING@PLAUTINT.CO.UK',
          tel: '+44 20 8553-3471'
        }
      },
      nfeItems: [
        { cProd: 'PLY-18MM', xProd: 'BRAZILIAN PINE PLYWOOD TAEDA WBP GLUE C+/C 18MM (7 PLY)', ncm: '44123900', qCom: 4750, uCom: 'PC', vUnCom: 14.199, vProd: 67446.47 }
      ],
      containers: [
        {
          id: 'cnt_1',
          containerNumber: 'GCNU4786570',
          sealNumber: 'SA508260',
          containerType: "40' HC",
          tareWeight: 3790,
          maxPayload: 32500,
          palletsCount: 19,
          sheetsPerPallet: 50,
          lengthMm: 2440,
          widthMm: 1220,
          thicknessMm: 18,
          unitPriceUsd: 265,
          netWeightKg: 26400,
          grossWeightKg: 26500,
          specTitle: 'SIZE: 2.440 X 1.220 X 18MM (7 PLY)',
          contractNumber: 'PO# 7309-1'
        },
        {
          id: 'cnt_2',
          containerNumber: 'ACLU9757205',
          sealNumber: 'SA508275',
          containerType: "40' HC",
          tareWeight: 3790,
          maxPayload: 32500,
          palletsCount: 19,
          sheetsPerPallet: 50,
          lengthMm: 2440,
          widthMm: 1220,
          thicknessMm: 18,
          unitPriceUsd: 265,
          netWeightKg: 26400,
          grossWeightKg: 26500,
          specTitle: 'SIZE: 2.440 X 1.220 X 18MM (7 PLY)',
          contractNumber: 'PO# 7309-1'
        },
        {
          id: 'cnt_3',
          containerNumber: 'FSCU8506099',
          sealNumber: 'SA508268',
          containerType: "40' HC",
          tareWeight: 3830,
          maxPayload: 32500,
          palletsCount: 19,
          sheetsPerPallet: 50,
          lengthMm: 2440,
          widthMm: 1220,
          thicknessMm: 18,
          unitPriceUsd: 265,
          netWeightKg: 26400,
          grossWeightKg: 26500,
          specTitle: 'SIZE: 2.440 X 1.220 X 18MM (7 PLY)',
          contractNumber: 'PO# 7309-1'
        },
        {
          id: 'cnt_4',
          containerNumber: 'ACLU9777120',
          sealNumber: 'SA508293',
          containerType: "40' HC",
          tareWeight: 3790,
          maxPayload: 32500,
          palletsCount: 19,
          sheetsPerPallet: 50,
          lengthMm: 2440,
          widthMm: 1220,
          thicknessMm: 18,
          unitPriceUsd: 265,
          netWeightKg: 26400,
          grossWeightKg: 26500,
          specTitle: 'SIZE: 2.440 X 1.220 X 18MM (7 PLY)',
          contractNumber: 'PO# 7309-1'
        },
        {
          id: 'cnt_5',
          containerNumber: 'GCNU4870927',
          sealNumber: 'SA508291',
          containerType: "40' HC",
          tareWeight: 3790,
          maxPayload: 32500,
          palletsCount: 19,
          sheetsPerPallet: 50,
          lengthMm: 2440,
          widthMm: 1220,
          thicknessMm: 18,
          unitPriceUsd: 265,
          netWeightKg: 26400,
          grossWeightKg: 26500,
          specTitle: 'SIZE: 2.440 X 1.220 X 18MM (7 PLY)',
          contractNumber: 'PO# 7309-1'
        }
      ]
    };
  }
};

window.ComexMockData = ComexMockData;
