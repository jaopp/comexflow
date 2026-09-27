/**
 * ComexFlow - Gerenciador de Persistência Local (LocalStorage)
 * Garante que NENHUM dado seja perdido ao atualizar ou fechar a página.
 * Suporta múltiplos embarques, separação entre 'Ativos' e 'Concluídos', e Backup JSON.
 */

const STORAGE_KEY_SHIPMENTS = 'comexflow_shipments';
const STORAGE_KEY_CURRENT_ID = 'comexflow_current_shipment_id';

class ComexStorage {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEY_SHIPMENTS)) {
      localStorage.setItem(STORAGE_KEY_SHIPMENTS, JSON.stringify([]));
    }
  }

  /**
   * Retorna todos os embarques salvos
   * @returns {Array}
   */
  getAllShipments() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SHIPMENTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Erro ao ler embarques do LocalStorage:', e);
      return [];
    }
  }

  /**
   * Salva a lista completa de embarques
   * @param {Array} shipments 
   */
  saveAllShipments(shipments) {
    try {
      localStorage.setItem(STORAGE_KEY_SHIPMENTS, JSON.stringify(shipments));
      window.dispatchEvent(new CustomEvent('comexflow:data-saved'));
    } catch (e) {
      console.error('Erro ao salvar no LocalStorage:', e);
    }
  }

  /**
   * Obtém um embarque específico pelo ID
   * @param {string} id 
   */
  getShipmentById(id) {
    const list = this.getAllShipments();
    return list.find(s => s.id === id) || null;
  }

  /**
   * Obtém o ID do embarque atualmente selecionado
   */
  getCurrentShipmentId() {
    return localStorage.getItem(STORAGE_KEY_CURRENT_ID) || null;
  }

  /**
   * Define o embarque ativo atual
   * @param {string} id 
   */
  setCurrentShipmentId(id) {
    localStorage.setItem(STORAGE_KEY_CURRENT_ID, id);
    window.dispatchEvent(new CustomEvent('comexflow:current-changed', { detail: { id } }));
  }

  /**
   * Retorna os dados do embarque atual (ou cria um novo se não houver)
   */
  getCurrentShipment() {
    const currentId = this.getCurrentShipmentId();
    let current = null;
    if (currentId) {
      current = this.getShipmentById(currentId);
    }

    if (!current) {
      const activeList = this.getActiveShipments();
      if (activeList.length > 0) {
        current = activeList[0];
        this.setCurrentShipmentId(current.id);
      }
    }
    return current;
  }

  /**
   * Filtra embarques ativos
   */
  getActiveShipments() {
    return this.getAllShipments().filter(s => s.status !== 'completed');
  }

  /**
   * Filtra embarques concluídos
   */
  getCompletedShipments() {
    return this.getAllShipments().filter(s => s.status === 'completed');
  }

  /**
   * Salva ou atualiza um embarque
   * @param {Object} shipmentData 
   */
  saveShipment(shipmentData) {
    const list = this.getAllShipments();
    const index = list.findIndex(s => s.id === shipmentData.id);
    
    shipmentData.updatedAt = new Date().toISOString();

    if (index >= 0) {
      list[index] = { ...list[index], ...shipmentData };
    } else {
      shipmentData.createdAt = shipmentData.createdAt || new Date().toISOString();
      shipmentData.status = shipmentData.status || 'active';
      list.unshift(shipmentData);
    }

    this.saveAllShipments(list);
    return shipmentData;
  }

  /**
   * Cria um novo embarque em branco
   */
  createNewShipment(title = '') {
    const newId = 'ship_' + Date.now();
    const newShipment = {
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      title: title || `Embarque #${new Date().toLocaleDateString('pt-BR')}`,
      booking: {
        bookingNumber: '',
        carrier: 'Maersk',
        vessel: '',
        voyage: '',
        pol: 'Paranaguá (BR)',
        pod: '',
        draftDeadline: '',
        cargoDeadline: '',
        draftSent: false,
        cargoDelivered: false,
        contractNumber: '',
        freightTerm: 'Prepaid', // Prepaid / Collect
        blType: 'Express Release',
        ncm: '4412.39.00',
        dueNumber: '',
        rucNumber: '',
        shipper: {
          name: '',
          address: '',
          taxId: ''
        },
        consignee: {
          name: '',
          address: '',
          taxId: ''
        },
        notify: {
          name: 'SAME AS CONSIGNEE',
          address: '',
          taxId: ''
        }
      },
      nfeItems: [],
      containers: [
        {
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
          netWeightKg: 0,
          grossWeightKg: 0,
          woodTreatedHT: true
        }
      ]
    };

    this.saveShipment(newShipment);
    this.setCurrentShipmentId(newId);
    return newShipment;
  }

  /**
   * Marca o embarque como Concluído / Enviado
   * @param {string} id 
   */
  markAsCompleted(id) {
    const shipment = this.getShipmentById(id);
    if (shipment) {
      shipment.status = 'completed';
      shipment.completedAt = new Date().toISOString();
      shipment.booking.draftSent = true;
      shipment.booking.cargoDelivered = true;
      this.saveShipment(shipment);
    }
  }

  /**
   * Reabre um embarque concluído de volta para Ativo
   * @param {string} id 
   */
  reopenShipment(id) {
    const shipment = this.getShipmentById(id);
    if (shipment) {
      shipment.status = 'active';
      shipment.completedAt = null;
      this.saveShipment(shipment);
    }
  }

  /**
   * Exclui um embarque
   * @param {string} id 
   */
  deleteShipment(id) {
    let list = this.getAllShipments();
    list = list.filter(s => s.id !== id);
    this.saveAllShipments(list);

    if (this.getCurrentShipmentId() === id) {
      const next = list.length > 0 ? list[0].id : null;
      if (next) {
        this.setCurrentShipmentId(next);
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT_ID);
      }
    }
  }

  /**
   * Exporta todo o banco de dados em arquivo JSON de backup
   */
  exportBackupJson() {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      shipments: this.getAllShipments()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comexflow_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Importa backup JSON
   * @param {string} jsonText 
   */
  importBackupJson(jsonText) {
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed.shipments)) {
        this.saveAllShipments(parsed.shipments);
        if (parsed.shipments.length > 0) {
          this.setCurrentShipmentId(parsed.shipments[0].id);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error('Falha ao importar backup:', e);
      return false;
    }
  }
}

// Exporta instância global
window.comexStorage = new ComexStorage();
