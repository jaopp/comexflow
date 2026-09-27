/**
 * ComexFlow - Dados de Exemplo Realistas (Baseados nos Áudios da Exportadora)
 * Permite ao usuário testar instantaneamente todas as telas, cálculos e geração de documentos com 1 clique!
 */

const ComexMockData = {
  getSampleShipment() {
    // Calcula datas relativas para demonstrar os alertas de deadline dinamicamente
    const now = new Date();
    
    // Deadline de Draft: daqui a 14 horas (entra no badge AMARELO de atenção)
    const draftDate = new Date(now.getTime() + 14 * 60 * 60 * 1000);
    // Deadline de Carga no Porto: daqui a 3 dias (badge VERDE seguro)
    const cargoDate = new Date(now.getTime() + 72 * 60 * 60 * 1000);

    const pad = (n) => String(n).padStart(2, '0');
    const formatInputDateTime = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    return {
      id: 'ship_sample_madeira_5cnt',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      status: 'active',
      title: 'Embarque 5x40\' HC - Chapas Compensado Pinus (Rotterdam)',
      booking: {
        bookingNumber: 'MAE-9843210-BR',
        carrier: 'Maersk Line',
        vessel: 'CAP SAN ARTEMISIO',
        voyage: '428W',
        pol: 'Paranaguá, PR (BR)',
        pod: 'Rotterdam, Netherlands (NL)',
        draftDeadline: formatInputDateTime(draftDate),
        cargoDeadline: formatInputDateTime(cargoDate),
        draftSent: false,
        cargoDelivered: false,
        contractNumber: 'CTR-2026-NL-042',
        freightTerm: 'Prepaid',
        blType: 'Express Release',
        ncm: '4412.39.00',
        dueNumber: '26BR000984120-4',
        rucNumber: '6BR000984120400000000000000000001',
        shipper: {
          name: 'BRASIL WOOD EXPORTADORA DE COMPENSADOS S.A.',
          address: 'Rodovia do Compensado, Km 42 - Distrito Industrial\nGuarapuava - PR, Brasil - CEP: 85000-000',
          taxId: '12.345.678/0001-90'
        },
        consignee: {
          name: 'EUROPEAN TIMBER IMPORTERS & LOGISTICS B.V.',
          address: 'Maasvlakte Boulevard 120, Port of Rotterdam\n3000 AB Rotterdam, The Netherlands',
          taxId: 'NL847293810B01'
        },
        notify: {
          name: 'DUTCH CUSTOMS BROKER SERVICES B.V.',
          address: 'Waalhaven Oostzijde 45, Rotterdam, Netherlands',
          taxId: 'NL998877665B02'
        }
      },
      nfeItems: [
        { cProd: 'CP-15MM', xProd: 'CHAPA COMPENSADO PINUS FENOLICO 15MM HT', ncm: '4412.39.00', qCom: 4000, uCom: 'PC', vUnCom: 53.58, vProd: 214320.00 }
      ],
      containers: [
        {
          id: 'cnt_1',
          containerNumber: 'MSKU 928374-1',
          sealNumber: 'ML-BR99812',
          containerType: "40' HC",
          tareWeight: 3820,
          maxPayload: 32500,
          palletsCount: 20,
          sheetsPerPallet: 40,
          lengthMm: 2440,
          widthMm: 1220,
          thicknessMm: 15,
          unitPriceUsd: 300,
          netWeightKg: 25100,
          grossWeightKg: 25850,
          woodTreatedHT: true
        },
        {
          id: 'cnt_2',
          containerNumber: 'MRSU 481920-5',
          sealNumber: 'ML-BR99813',
          containerType: "40' HC",
          tareWeight: 3800,
          maxPayload: 32500,
          palletsCount: 20,
          sheetsPerPallet: 40,
          lengthMm: 2440,
          widthMm: 1220,
          thicknessMm: 15,
          unitPriceUsd: 300,
          netWeightKg: 25100,
          grossWeightKg: 25850,
          woodTreatedHT: true
        },
        {
          id: 'cnt_3',
          containerNumber: 'TGHU 773129-0',
          sealNumber: 'ML-BR99814',
          containerType: "40' HC",
          tareWeight: 3850,
          maxPayload: 32500,
          palletsCount: 20,
          sheetsPerPallet: 40,
          lengthMm: 2440,
          widthMm: 1220,
          thicknessMm: 15,
          unitPriceUsd: 300,
          netWeightKg: 25100,
          grossWeightKg: 25850,
          woodTreatedHT: true
        },
        {
          id: 'cnt_4',
          containerNumber: 'SEGU 552019-3',
          sealNumber: 'ML-BR99815',
          containerType: "40' HC",
          tareWeight: 3790,
          maxPayload: 32500,
          palletsCount: 20,
          sheetsPerPallet: 40,
          lengthMm: 2440,
          widthMm: 1220,
          thicknessMm: 15,
          unitPriceUsd: 300,
          netWeightKg: 25100,
          grossWeightKg: 25850,
          woodTreatedHT: true
        },
        {
          id: 'cnt_5',
          containerNumber: 'MAEU 102938-7',
          sealNumber: 'ML-BR99816',
          containerType: "40' HC",
          tareWeight: 3810,
          maxPayload: 32500,
          palletsCount: 20,
          sheetsPerPallet: 40,
          lengthMm: 2440,
          widthMm: 1220,
          thicknessMm: 15,
          unitPriceUsd: 300,
          netWeightKg: 25100,
          grossWeightKg: 25850,
          woodTreatedHT: true
        }
      ]
    };
  }
};

window.ComexMockData = ComexMockData;
