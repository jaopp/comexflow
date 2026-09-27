/**
 * ComexFlow - Leitor e Extrator de XML de NF-e (Nota Fiscal Eletrônica)
 * Processamento 100% nativo no navegador via DOMParser (Rápido, seguro e privado).
 */

const ComexXmlParser = {
  /**
   * Faz o parse de um arquivo XML de NF-e e extrai os dados estruturados
   * @param {string} xmlString Conteúdo do arquivo XML
   * @returns {Object} Dados extraídos da NF-e
   */
  parseNfeXml(xmlString) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

      // Verifica se houve erro de parse
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('Arquivo XML inválido ou corrompido.');
      }

      // Função auxiliar para obter texto de tag
      const getText = (selector, parent = xmlDoc) => {
        const el = parent.querySelector(selector);
        return el ? el.textContent.trim() : '';
      };

      // 1. Identificação da Nota
      const nNF = getText('ide > nNF');
      const serie = getText('ide > serie');
      const dhEmi = getText('ide > dhEmi');
      const chNFe = getText('protNFe > infProt > chNFe') || xmlDoc.querySelector('infNFe')?.getAttribute('Id')?.replace('NFe', '') || '';

      // 2. Emitente (Exportador / Shipper)
      const emit = {
        name: getText('emit > xNome'),
        fantasyName: getText('emit > xFant'),
        cnpj: getText('emit > CNPJ'),
        address: `${getText('emit > enderEmit > xLgr')}, ${getText('emit > enderEmit > nro')} - ${getText('emit > enderEmit > xBairro')}, ${getText('emit > enderEmit > xMun')}/${getText('emit > enderEmit > UF')} - CEP: ${getText('emit > enderEmit > CEP')}`,
        phone: getText('emit > enderEmit > fone')
      };

      // 3. Destinatário (Consignee)
      const dest = {
        name: getText('dest > xNome'),
        idForeign: getText('dest > idEstrangeiro') || getText('dest > CNPJ'),
        address: `${getText('dest > enderDest > xLgr')}, ${getText('dest > enderDest > nro')} - ${getText('dest > enderDest > xMun')}/${getText('dest > enderDest > UF')}`
      };

      // 4. Totais e Pesos
      const vNF = parseFloat(getText('ICMSTot > vNF')) || 0;
      const vProd = parseFloat(getText('ICMSTot > vProd')) || 0;
      const pesoL = parseFloat(getText('vol > pesoL')) || 0;
      const pesoB = parseFloat(getText('vol > pesoB')) || 0;
      const qVol = parseInt(getText('vol > qVol'), 10) || 0;
      const espVol = getText('vol > esp') || 'PALETES';

      // 5. Itens da NF-e
      const detList = xmlDoc.querySelectorAll('det');
      const items = [];
      let dominantNcm = '';

      detList.forEach((det, idx) => {
        const ncm = getText('prod > NCM', det);
        if (!dominantNcm && ncm) dominantNcm = ncm;

        items.push({
          itemIndex: idx + 1,
          cProd: getText('prod > cProd', det),
          xProd: getText('prod > xProd', det),
          ncm: ncm,
          cfop: getText('prod > CFOP', det),
          uCom: getText('prod > uCom', det),
          qCom: parseFloat(getText('prod > qCom', det)) || 0,
          vUnCom: parseFloat(getText('prod > vUnCom', det)) || 0,
          vProd: parseFloat(getText('prod > vProd', det)) || 0
        });
      });

      return {
        success: true,
        chNFe,
        nNF,
        serie,
        dhEmi: dhEmi ? dhEmi.slice(0, 10) : '',
        emit,
        dest,
        vNF,
        vProd,
        pesoL,
        pesoB,
        qVol,
        espVol,
        dominantNcm,
        items
      };
    } catch (err) {
      console.error('Erro ao ler XML de NF-e:', err);
      return {
        success: false,
        error: err.message
      };
    }
  },

  /**
   * Lê múltiplos arquivos XML (Array de File do input file ou drag&drop)
   * @param {FileList|Array} files 
   * @returns {Promise<Array>}
   */
  async readMultipleXmlFiles(files) {
    const results = [];
    for (const file of files) {
      if (file.name.endsWith('.xml') || file.type.includes('xml')) {
        const text = await file.text();
        const parsed = this.parseNfeXml(text);
        results.push({
          fileName: file.name,
          ...parsed
        });
      }
    }
    return results;
  }
};

window.ComexXmlParser = ComexXmlParser;
