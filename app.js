document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const inputText = document.getElementById('inputText');
  const generateBtn = document.getElementById('generateBtn');
  const previewContent = document.getElementById('previewContent');
  const loader = document.getElementById('loader');
  const downloadBtn = document.getElementById('downloadBtn');
  const errorMessage = document.getElementById('errorMessage');
  const pdfFileName = document.getElementById('pdfFileName');
  const pdfFileNameCopy = document.getElementById('pdfFileNameCopy');

  // Sync filename fields
  pdfFileName.addEventListener('input', (e) => pdfFileNameCopy.value = e.target.value);
  pdfFileNameCopy.addEventListener('input', (e) => pdfFileName.value = e.target.value);

  // API Configuration  
  const GEMINI_API_KEY = "AIzaSyBX_vKVRLmKUn1MLJmlD0HmqMAXLmQ3kTU"; // Replace with your API key
  const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

  // Generate study material
  async function generateStudyMaterial() {
    // Show loading state
    errorMessage.style.display = 'none';
    previewContent.style.display = 'none';
    loader.style.display = 'flex';
    generateBtn.disabled = true;

    try {
      const options = {
        formatHeadings: document.getElementById('formatHeadings').checked,
        highlightKeywords: document.getElementById('highlightKeywords').checked,
        createMindMap: document.getElementById('createMindMap').checked,
        createInfoBoxes: document.getElementById('createInfoBoxes').checked,
        createSummary: document.getElementById('createSummary').checked
      };

      const text = document.getElementById('subjectInput').value.trim() + ' ' + 
                   document.getElementById('topicInput').value.trim() + ' ' + 
                   document.getElementById('subtopicInput').value.trim();
                   
      const processedContent = await processWithGeminiAPI(text, options);
      previewContent.innerHTML = processedContent;
      previewContent.style.display = 'block';

    } catch (error) {
      console.error("Error:", error);
      showError("Ocorreu um erro ao processar o texto. " + error.message);
      previewContent.innerHTML = '<p class="placeholder-text">Não foi possível gerar o material.</p>';
      previewContent.style.display = 'block';
    } finally {
      loader.style.display = 'none';
      generateBtn.disabled = false;
    }
  }

  // Process text with Gemini API
  async function processWithGeminiAPI(text, options) {
    const prompt = buildPrompt(text, options);
    
    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.3, // Reduced for more focused, exam-oriented content
        maxOutputTokens: 8192,
      }
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro na API Gemini: ${errorData.error.message}`);
    }

    const data = await response.json();
    return extractHtmlFromResponse(data);
  }

  // Build Gemini API prompt
  function buildPrompt(text, options) {
    let prompt = `Transforme o seguinte texto em um material de estudo otimizado para concursos públicos (INSS, Correios, Banco do Brasil, e similares), utilizando a seguinte estrutura HTML e classes CSS:

    1. Use <div class="document-page"> como container principal
    2. Para títulos principais: <h1 class="document-title">
    3. Para seções: <h2 class="section-title">
    4. Para conceitos-chave: <span class="key-concept">
    5. Para dicas de prova: <div class="exam-tip">
    6. Para erros comuns: <div class="common-mistake">
    7. Para memorização: <div class="memorization-box">
    8. Para padrões de questões: <div class="question-pattern">
    9. Para tópicos importantes: <div class="important-topic">
    10. Para quadros informativos: <div class="info-box">
    11. Para mapas mentais: 
        <div class="mind-map">
          <div class="mind-map-title">
          <div class="mind-map-content">
            <div class="mind-map-node">
    12. Para resumos: <div class="summary-section">
    13. Para parágrafos regulares: <p class="paragraph">
    14. Para questões comentadas: <div class="commented-question">
      - Para o texto da questão: <div class="question-text">
      - Para as alternativas: <div class="alternative">
      - Para a alternativa correta: <div class="alternative correct-alternative">
      - Para a explicação: <div class="explanation">
  
    Diretrizes de conteúdo:
    - Organize o conteúdo usando técnicas comprovadas de preparação para concursos
    - Destaque pontos frequentemente cobrados em provas objetivas
    - Identifique padrões de questões e armadilhas comuns
    - Inclua dicas de resolução e memorização
    - Organize os conceitos do mais básico ao mais complexo
    - Enfatize diferenças entre conceitos similares que geram confusão
    - Inclua "Fique Atento!" para pontos cruciais
    - Ao final de cada conceito, inclua APENAS questões reais de concursos anteriores que já foram aplicadas em provas oficiais, indicando o ano e o órgão/banca. NÃO INVENTE questões nem utilize questões que não tenham fonte verificável.
    - Para cada questão, cite a fonte completa (Concurso, Órgão, Ano e Banca)
    - Busque sempre as informações mais recentes e atualizadas sobre o tema, de forma a evitar informações desatualizadas.
  
    O material deve incluir:`;
    
    if (options.formatHeadings) {
      prompt += `\n- Títulos e subtítulos hierarquizados para facilitar a revisão`;
    }
    if (options.highlightKeywords) {
      prompt += `\n- Palavras-chave e termos técnicos destacados com a classe key-concept`;
    }
    if (options.createMindMap) {
      prompt += `\n- Mapa mental estruturado usando as classes mind-map definidas`;
    }
    if (options.createInfoBoxes) {
      prompt += `\n- Quadros destacando pontos estatisticamente mais cobrados usando as classes info-box`;
    }
    if (options.createSummary) {
      prompt += `\n- Resumo estratégico na classe summary-section`;
    }

    prompt += `\n\nTEXTO PARA FORMATAR:\n${text}

    IMPORTANTE: Mantenha rigorosamente a estrutura HTML e as classes CSS fornecidas para garantir a formatação correta.`;
    
    return prompt;
  }

  // Extract HTML from Gemini API response
  function extractHtmlFromResponse(data) {
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      let html = data.candidates[0].content.parts[0].text;
      html = html.replace(/```html/g, '').replace(/```/g, '');
      return `<div class="document-page">${html}</div>`;
    }
    throw new Error("Formato de resposta inesperado da API Gemini");
  }

  // Download as PDF
  async function downloadAsPDF() {
    let fileName = (pdfFileNameCopy.value.trim() || "material-de-estudo") + '.pdf';
    const { jsPDF } = window.jspdf;

    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px;"></div> Gerando...';

    try {
      // Clone the preview content
      const contentToCapture = previewContent.querySelector('.document-page').cloneNode(true);
      
      // Create temporary container with exact styling
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        position: absolute;
        left: -9999px;
        width: 794px; /* A4 width in pixels at 96 DPI */
        background: white;
        padding: 0;
        margin: 0;
      `;
      tempContainer.appendChild(contentToCapture);
      document.body.appendChild(tempContainer);

      // Configure html2canvas with better settings
      const canvas = await html2canvas(contentToCapture, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: contentToCapture.offsetHeight,
        backgroundColor: '#ffffff',
      });

      // Create PDF with proper dimensions
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate scaling
      const ratio = pdfWidth / imgWidth;
      const scaled_height = imgHeight * ratio;
      
      // Add image to PDF, handling multiple pages if needed
      let heightLeft = scaled_height;
      let position = 0;
      let page = 1;

      while (heightLeft > 0) {
        if (page > 1) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, scaled_height);
        heightLeft -= pdfHeight;
        position -= pdfHeight;
        page++;
      }

      // Save the PDF
      pdf.save(fileName);
      
      // Cleanup
      document.body.removeChild(tempContainer);

    } catch (error) {
      console.error("Error generating PDF:", error);
      showError("Não foi possível gerar o PDF. " + error.message);
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Baixar PDF
      `;
    }
  }

  // Generate quick summary
  async function generateQuickSummary() {
    const subject = document.getElementById('subjectInput').value.trim();
    const topic = document.getElementById('topicInput').value.trim();
    const subtopic = document.getElementById('subtopicInput').value.trim();
    
    if (!subject || !topic) {
      showError("Por favor, preencha a matéria e o assunto para gerar o resumo rápido.");
      return;
    }

    let prompt = `Crie um material de estudo completo`;

    if (subtopic) {
      prompt += ` sobre o sub-tópico: ${subtopic}, dentro do tópico maior: ${topic}`;
    } else {
      prompt += ` sobre o tópico: ${topic}`;
    }
    
    prompt += ` na matéria de ${subject}, otimizado para concursos públicos. 
  
    Inclua:
    - Conceitos fundamentais e definições exatas cobradas em provas
    - Pontos estatisticamente mais cobrados em concursos recentes
    - Questões típicas e padrões de cobrança
    - Diferenciação entre conceitos similares
    - Dicas de resolução e memorização
    - Armadilhas comuns em questões objetivas
    - Correlações com outros temas frequentemente associados
    - APENAS questões reais de concursos anteriores que já foram aplicadas em provas oficiais, indicando o ano e o órgão/banca responsável
    - Para cada questão, cite a fonte completa (Concurso, Órgão, Ano e Banca)
    
    O material deve ser estruturado para máxima eficiência na preparação para provas objetivas.
    
    Busque sempre as informações mais recentes e atualizadas sobre o tema, de forma a evitar informações desatualizadas.`;

    try {
      document.getElementById('quickSummaryBtn').disabled = true;
      const response = await processWithGeminiAPI(prompt, {
        formatHeadings: true,
        highlightKeywords: true,
        createMindMap: true,
        createInfoBoxes: true,
        createSummary: true
      });
      
      previewContent.innerHTML = response;
      previewContent.style.display = 'block';
    } catch (error) {
      showError("Erro ao gerar resumo rápido: " + error.message);
    } finally {
      document.getElementById('quickSummaryBtn').disabled = false;
    }
  }

  // Add event listener for quick summary
  document.getElementById('quickSummaryBtn').addEventListener('click', generateQuickSummary);

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }

  // Event listeners
  generateBtn.addEventListener('click', generateStudyMaterial);
  downloadBtn.addEventListener('click', downloadAsPDF);
});
