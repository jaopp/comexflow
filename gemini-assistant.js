/**
 * ComexFlow - Assistente de Áudio com Inteligência Artificial (Gemini)
 * Permite que a operadora de Comex grave ou anexe áudios (ex: WhatsApp)
 * para preenchimento automático inteligente de bookings, containers e prazos.
 */

const ComexGemini = {
  STORAGE_KEY: 'comexflow_gemini_api_key',

  // ----------------------------------------------------
  // GESTÃO DA CHAVE DE API (100% LOCAL NO NAVEGADOR)
  // ----------------------------------------------------
  getApiKey() {
    return localStorage.getItem(this.STORAGE_KEY) || '';
  },

  setApiKey(key) {
    if (key && typeof key === 'string') {
      localStorage.setItem(this.STORAGE_KEY, key.trim());
      return true;
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
      return false;
    }
  },

  hasApiKey() {
    const key = this.getApiKey();
    return Boolean(key && key.length > 10);
  },

  // ----------------------------------------------------
  // GRAVADOR DE ÁUDIO NATIVO (MediaRecorder API)
  // ----------------------------------------------------
  mediaRecorder: null,
  audioChunks: [],
  recordingStream: null,
  recordingInterval: null,
  recordingSeconds: 0,

  async startRecording(onTick) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Seu navegador não suporta gravação de áudio direta. Por favor, utilize a opção "Anexar Áudio".');
    }

    this.audioChunks = [];
    this.recordingSeconds = 0;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.recordingStream = stream;

    // Determina MIME type suportado pelo navegador
    let mimeType = 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
      mimeType = 'audio/ogg;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4';
    }

    this.mediaRecorder = new MediaRecorder(stream, { mimeType });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.audioChunks.push(e.data);
      }
    };

    this.mediaRecorder.start(250); // Coleta a cada 250ms

    if (onTick) {
      this.recordingInterval = setInterval(() => {
        this.recordingSeconds++;
        const mins = String(Math.floor(this.recordingSeconds / 60)).padStart(2, '0');
        const secs = String(this.recordingSeconds % 60).padStart(2, '0');
        onTick(`${mins}:${secs}`, this.recordingSeconds);
      }, 1000);
    }
  },

  stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error('Nenhuma gravação em andamento.'));
        return;
      }

      if (this.recordingInterval) {
        clearInterval(this.recordingInterval);
        this.recordingInterval = null;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });

        // Libera microfone
        if (this.recordingStream) {
          this.recordingStream.getTracks().forEach(track => track.stop());
          this.recordingStream = null;
        }

        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  },

  isRecording() {
    return this.mediaRecorder && this.mediaRecorder.state === 'recording';
  },

  // ----------------------------------------------------
  // CONVERSÃO DE ARQUIVO/BLOB PARA BASE64
  // ----------------------------------------------------
  async fileToBase64(fileOrBlob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        // Formato esperado: data:[mime];base64,[data]
        const commaIndex = result.indexOf(',');
        if (commaIndex !== -1) {
          const base64Data = result.substring(commaIndex + 1);
          let mimeType = fileOrBlob.type || 'audio/ogg';
          if (!mimeType || mimeType === 'application/octet-stream') {
            // Tenta adivinhar por extensão caso seja arquivo
            const name = (fileOrBlob.name || '').toLowerCase();
            if (name.endsWith('.ogg')) mimeType = 'audio/ogg';
            else if (name.endsWith('.mp3')) mimeType = 'audio/mp3';
            else if (name.endsWith('.wav')) mimeType = 'audio/wav';
            else if (name.endsWith('.m4a')) mimeType = 'audio/m4a';
            else mimeType = 'audio/ogg';
          }
          // Normalização para o Gemini
          if (mimeType.includes('audio/webm')) mimeType = 'audio/webm';
          if (mimeType.includes('audio/ogg')) mimeType = 'audio/ogg';

          resolve({ base64Data, mimeType });
        } else {
          reject(new Error('Falha ao codificar áudio em base64.'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBlob);
    });
  },

  // ----------------------------------------------------
  // INTEGRAÇÃO COM GEMINI API
  // ----------------------------------------------------
  async processAudioWithGemini(fileOrBlob, onProgress) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('CHAVE_NAO_CONFIGURADA');
    }

    if (onProgress) onProgress('Preparando e codificando arquivo de áudio...');
    const { base64Data, mimeType } = await this.fileToBase64(fileOrBlob);

    const promptInstructions = `
Você é o assistente inteligente do ComexFlow, especializado em Comércio Exterior e Despacho Aduaneiro de Exportação marítima (foco em madeira e compensados no Brasil).
Você está ouvindo o áudio de uma operadora de Comex instruindo o preenchimento de um embarque de exportação ou repassando dados de booking, carregamento, navio e prazos.

Analise o áudio cuidadosamente e extraia todos os dados operacionais possíveis, mapeando-os no formato JSON estruturado abaixo.

DATA E HORA ATUAL PARA REFERÊNCIA: ${new Date().toISOString()} (Ano atual: ${new Date().getFullYear()}).
Se ela disser "deadline amanhã às 17h", calcule a data e hora correspondente no formato YYYY-MM-DDTHH:mm.

Retorne ESTRITAMENTE o JSON abaixo com os dados encontrados (deixe strings vazias "" ou números zerados 0 caso não sejam mencionados no áudio):

{
  "booking": {
    "bookingNumber": "",
    "carrier": "",
    "vessel": "",
    "voyage": "",
    "pol": "",
    "pod": "",
    "deliveryTo": "",
    "invoiceNumber": "",
    "purchaseOrder": "",
    "contractNumber": "",
    "blNumber": "",
    "marks": "",
    "draftDeadline": "",
    "cargoDeadline": "",
    "freightTerm": "Prepaid",
    "paymentTerms": "",
    "debitNoteNumber": "",
    "debitNoteAmount": 0,
    "ncm": "",
    "taric": "",
    "rascunhoNumber": "",
    "dueNumber": "",
    "rucNumber": "",
    "goodsDescription": "",
    "packingMaterial": {
      "plasticKg": 0,
      "metalKg": 0,
      "timberKg": 0
    },
    "shipper": {
      "name": "",
      "address": "",
      "taxId": ""
    },
    "consignee": {
      "name": "",
      "taxId": "",
      "eori": "",
      "address": "",
      "email": "",
      "tel": ""
    },
    "notify": {
      "name": "",
      "taxId": "",
      "eori": "",
      "address": "",
      "email": "",
      "tel": ""
    }
  },
  "containers": [
    {
      "containerNumber": "",
      "sealNumber": "",
      "containerType": "40' HC",
      "tareWeight": 3800,
      "maxPayload": 32500,
      "palletsCount": 20,
      "sheetsPerPallet": 40,
      "lengthMm": 2440,
      "widthMm": 1220,
      "thicknessMm": 15,
      "unitPriceUsd": 0,
      "grossWeightKg": 0,
      "netWeightKg": 0
    }
  ],
  "summary": "Resumo em 1 a 2 frases em português do que foi compreendido e extraído do áudio"
}
`;

    if (onProgress) onProgress('Enviando para o Gemini Flash (escutando e extraindo dados)...');

    // Modelos a testar (gemini-2.5-flash com fallback)
    const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    let lastError = null;

    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              },
              {
                text: promptInstructions
              }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.1
        }
      };

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.status === 400 || response.status === 403) {
          const errBody = await response.text();
          if (errBody.includes('API_KEY_INVALID') || errBody.includes('not valid')) {
            throw new Error('CHAVE_INVALIDA');
          }
        }

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Erro na API do Gemini (${model}): HTTP ${response.status} - ${errText}`);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        const textResponse = candidate?.content?.parts?.[0]?.text;

        if (!textResponse) {
          throw new Error('O modelo não retornou conteúdo estruturado.');
        }

        // Faz o parse do JSON limpo retornado
        const parsed = JSON.parse(textResponse);
        return parsed;

      } catch (err) {
        lastError = err;
        if (err.message === 'CHAVE_INVALIDA') {
          throw err;
        }
        console.warn(`Tentativa com ${model} falhou, tentando próximo modelo...`, err);
      }
    }

    throw lastError || new Error('Não foi possível processar o áudio no Gemini.');
  },

  // ----------------------------------------------------
  // APLICAÇÃO DOS DADOS EXTRAÍDOS NO EMBARQUE
  // ----------------------------------------------------
  applyExtractedDataToShipment(extracted, currentShipment) {
    if (!extracted || !currentShipment) return { changedFieldsCount: 0, summary: '' };

    let changedCount = 0;
    currentShipment.booking = currentShipment.booking || {};
    const b = currentShipment.booking;
    const eb = extracted.booking || {};

    const mergeField = (targetObj, key, sourceVal) => {
      if (sourceVal !== undefined && sourceVal !== null && sourceVal !== '' && sourceVal !== 0) {
        targetObj[key] = sourceVal;
        changedCount++;
      }
    };

    // Dados gerais de booking
    [
      'bookingNumber', 'carrier', 'vessel', 'voyage', 'pol', 'pod', 'deliveryTo',
      'invoiceNumber', 'purchaseOrder', 'contractNumber', 'blNumber', 'marks',
      'draftDeadline', 'cargoDeadline', 'freightTerm', 'paymentTerms',
      'debitNoteNumber', 'debitNoteAmount', 'ncm', 'taric',
      'rascunhoNumber', 'dueNumber', 'rucNumber', 'goodsDescription'
    ].forEach(k => {
      mergeField(b, k, eb[k]);
    });

    // Material de embalagem
    if (eb.packingMaterial) {
      b.packingMaterial = b.packingMaterial || {};
      ['plasticKg', 'metalKg', 'timberKg'].forEach(k => {
        mergeField(b.packingMaterial, k, eb.packingMaterial[k]);
      });
    }

    // Shipper
    if (eb.shipper) {
      b.shipper = b.shipper || {};
      ['name', 'address', 'taxId'].forEach(k => mergeField(b.shipper, k, eb.shipper[k]));
    }

    // Consignee
    if (eb.consignee) {
      b.consignee = b.consignee || {};
      ['name', 'taxId', 'eori', 'address', 'email', 'tel'].forEach(k => mergeField(b.consignee, k, eb.consignee[k]));
    }

    // Notify
    if (eb.notify) {
      b.notify = b.notify || {};
      ['name', 'taxId', 'eori', 'address', 'email', 'tel'].forEach(k => mergeField(b.notify, k, eb.notify[k]));
    }

    // Containers (se o áudio mencionou containers com dados reais)
    if (Array.isArray(extracted.containers) && extracted.containers.length > 0) {
      // Verifica se os containers extraídos têm ao menos containerNumber, palletsCount ou dimensões
      const validContainers = extracted.containers.filter(c => c.containerNumber || c.palletsCount || c.unitPriceUsd);
      if (validContainers.length > 0) {
        currentShipment.containers = validContainers.map((c, i) => ({
          id: `cnt_gemini_${Date.now()}_${i + 1}`,
          containerNumber: c.containerNumber || `CONT-${i + 1}`,
          sealNumber: c.sealNumber || '',
          containerType: c.containerType || "40' HC",
          tareWeight: c.tareWeight || 3800,
          maxPayload: c.maxPayload || 32500,
          palletsCount: c.palletsCount || 20,
          sheetsPerPallet: c.sheetsPerPallet || 40,
          lengthMm: c.lengthMm || 2440,
          widthMm: c.widthMm || 1220,
          thicknessMm: c.thicknessMm || 15,
          unitPriceUsd: c.unitPriceUsd || 300,
          grossWeightKg: c.grossWeightKg || 25800,
          netWeightKg: c.netWeightKg || 25000,
          goodsDescription: c.goodsDescription || b.goodsDescription || ''
        }));
        changedCount += validContainers.length;
      }
    }

    currentShipment.updatedAt = new Date().toISOString();

    return {
      changedFieldsCount: changedCount,
      summary: extracted.summary || 'Dados extraídos do áudio com sucesso!'
    };
  }
};
