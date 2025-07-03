document.addEventListener('DOMContentLoaded', function() {
    // Set initial theme based on user's system preference
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    // --- THEME TOGGLE LOGIC ---
    const themeToggle = document.getElementById('theme-toggle');
    const lightIcon = document.getElementById('theme-icon-light');
    const darkIcon = document.getElementById('theme-icon-dark');

    // Function to set theme
    const setTheme = (isDark) => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
            lightIcon.classList.remove('hidden');
            darkIcon.classList.add('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
            lightIcon.classList.add('hidden');
            darkIcon.classList.remove('hidden');
        }
    };

    // Initialize icons based on current theme
    if (document.documentElement.classList.contains('dark')) {
        lightIcon.classList.remove('hidden');
    } else {
        darkIcon.classList.remove('hidden');
    }

    themeToggle.addEventListener('click', () => {
        setTheme(!document.documentElement.classList.contains('dark'));
    });

    // --- TABS ---
    const tabsContainer = document.getElementById('tabs');
    tabsContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && e.target.dataset.tab) {
            const targetPanelId = `panel-${e.target.dataset.tab}`;
            
            tabsContainer.querySelectorAll('button').forEach(btn => btn.classList.remove('tab-active'));
            e.target.classList.add('tab-active');

            document.querySelectorAll('.tab-panel').forEach(panel => {
                panel.id === targetPanelId ? panel.classList.remove('hidden') : panel.classList.add('hidden');
            });
        }
    });
    
    // --- PDF.js Worker Setup ---
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
    }

    // --- PDF MERGER LOGIC ---
    const { PDFDocument } = PDFLib;
    const mergeFileInput = document.getElementById('merge-file-input');
    const mergeFileListContainer = document.getElementById('merge-file-list-container');
    const mergeFileList = document.getElementById('merge-file-list');
    const mergeBtn = document.getElementById('merge-btn');
    const mergeClearBtn = document.getElementById('merge-clear-btn');
    const mergeStatusContainer = document.getElementById('merge-status-container');
    const mergeLoadingIndicator = document.getElementById('merge-loading-indicator');
    const mergeStatusText = document.getElementById('merge-status-text');
    const mergeDownloadBtn = document.getElementById('merge-download-btn');
    let selectedPDFFiles = [];

    mergeFileInput.addEventListener('change', (e) => handlePDFFiles(e.target.files));
    
    const mergeDropArea = document.querySelector('#panel-merger .file-input-label');
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => mergeDropArea.addEventListener(eventName, e => {e.preventDefault(); e.stopPropagation();}, false));
    ['dragenter', 'dragover'].forEach(eventName => mergeDropArea.addEventListener(eventName, () => mergeDropArea.classList.add('drag-over'), false));
    ['dragleave', 'drop'].forEach(eventName => mergeDropArea.addEventListener(eventName, () => mergeDropArea.classList.remove('drag-over'), false));
    mergeDropArea.addEventListener('drop', (e) => handlePDFFiles(e.dataTransfer.files), false);

    function handlePDFFiles(files) {
        const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
        if (pdfFiles.length > 0) {
            selectedPDFFiles = [...selectedPDFFiles, ...pdfFiles];
            updatePDFFileList();
        }
    }

    function updatePDFFileList() {
        mergeFileList.innerHTML = '';
        if (selectedPDFFiles.length > 0) {
            mergeFileListContainer.classList.remove('hidden');
            selectedPDFFiles.forEach((file, index) => {
                const listItem = document.createElement('li');
                listItem.className = 'flex items-center justify-between bg-slate-100 dark:bg-slate-700 p-3 rounded-lg animate-fade-in';
                listItem.innerHTML = `<span class="flex items-center min-w-0"><svg class="w-6 h-6 text-red-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path></svg><span class="font-medium truncate">${file.name}</span></span><button class="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600" onclick="removePDFFile(${index})"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg></button>`;
                mergeFileList.appendChild(listItem);
            });
        } else {
            mergeFileListContainer.classList.add('hidden');
        }
        mergeBtn.disabled = selectedPDFFiles.length < 2;
    }

    window.removePDFFile = (index) => {
        selectedPDFFiles.splice(index, 1);
        updatePDFFileList();
    };

    mergeClearBtn.addEventListener('click', () => {
        selectedPDFFiles = [];
        mergeFileInput.value = '';
        updatePDFFileList();
        mergeStatusContainer.classList.add('hidden');
        mergeDownloadBtn.classList.add('hidden');
        mergeLoadingIndicator.classList.add('hidden');
    });

    mergeBtn.addEventListener('click', async () => {
        if (selectedPDFFiles.length < 2) return;
        mergeStatusContainer.classList.remove('hidden');
        mergeLoadingIndicator.classList.remove('hidden');
        mergeStatusText.textContent = 'Merging PDFs...';
        mergeDownloadBtn.classList.add('hidden');
        mergeBtn.disabled = true;
        mergeClearBtn.disabled = true;
        try {
            const mergedPdf = await PDFDocument.create();
            for (const file of selectedPDFFiles) {
                const fileBytes = await file.arrayBuffer();
                const pdf = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }
            const mergedPdfBytes = await mergedPdf.save();
            const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            mergeDownloadBtn.href = url;
            mergeDownloadBtn.classList.remove('hidden');
            mergeStatusText.textContent = 'Merge successful! Your file is ready.';
            mergeLoadingIndicator.classList.add('hidden');
        } catch (error) {
            console.error('Error merging PDFs:', error);
            mergeStatusText.textContent = 'An error occurred. Please check console.';
            mergeLoadingIndicator.classList.add('hidden');
        } finally {
            mergeBtn.disabled = false;
            mergeClearBtn.disabled = false;
        }
    });

    // --- DOCX CONVERTER LOGIC ---
    const convertFileInput = document.getElementById('convert-file-input');
    const convertBtn = document.getElementById('convert-btn');
    const convertClearBtn = document.getElementById('convert-clear-btn');
    const docxRenderTarget = document.getElementById('docx-render-target');
    const convertFileInfo = document.getElementById('convert-file-info');
    const convertFileName = document.getElementById('convert-file-name');
    const convertStatusContainer = document.getElementById('convert-status-container');
    const convertStatusText = document.getElementById('convert-status-text');
    const convertSpinner = document.getElementById('convert-spinner');
    let selectedDocxFile = null;

    convertFileInput.addEventListener('change', (e) => {
         if (e.target.files.length > 0) {
            handleDocxFile(e.target.files[0]);
        }
    });
    
    const docxDropArea = document.querySelector('#panel-docx-converter .file-input-label');
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => docxDropArea.addEventListener(eventName, e => {e.preventDefault(); e.stopPropagation();}, false));
    ['dragenter', 'dragover'].forEach(eventName => docxDropArea.addEventListener(eventName, () => docxDropArea.classList.add('drag-over'), false));
    ['dragleave', 'drop'].forEach(eventName => docxDropArea.addEventListener(eventName, () => docxDropArea.classList.remove('drag-over'), false));
    docxDropArea.addEventListener('drop', (e) => handleDocxFile(e.dataTransfer.files[0]), false);


    function handleDocxFile(file) {
        const isValid = file && (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        if (isValid) {
            selectedDocxFile = file;
            convertFileInfo.classList.remove('hidden');
            convertFileName.textContent = file.name;
            convertBtn.disabled = false;
            convertStatusContainer.classList.add('hidden');
        } else {
            convertStatusContainer.classList.remove('hidden');
            convertStatusText.textContent = 'Please select a valid .docx file.';
            clearConverter();
        }
    }

    function clearConverter() {
        selectedDocxFile = null;
        convertFileInput.value = '';
        convertFileInfo.classList.add('hidden');
        convertFileName.textContent = '';
        convertBtn.disabled = true;
        docxRenderTarget.innerHTML = '';
    }
    
    convertClearBtn.addEventListener('click', () => {
        clearConverter();
        convertStatusContainer.classList.add('hidden');
    });

    convertBtn.addEventListener('click', async () => {
        if (!selectedDocxFile) return;
        if (typeof docx === 'undefined' || typeof JSZip === 'undefined') {
            console.error("Required libraries (docx-preview, JSZip) are not loaded.");
            convertStatusText.textContent = 'Error: A required library failed to load.';
            convertStatusContainer.classList.remove('hidden');
            return;
        }
        convertStatusContainer.classList.remove('hidden');
        convertStatusText.textContent = 'Rendering DOCX file...';
        convertSpinner.classList.remove('hidden');
        convertBtn.disabled = true;
        convertClearBtn.disabled = true;
        try {
            await docx.renderAsync(selectedDocxFile, docxRenderTarget);
            convertStatusText.textContent = 'Converting to PDF...';
            const filename = selectedDocxFile.name.replace(/\.docx$/, '.pdf');
            const opt = { margin: 0.5, filename: filename, image: { type: 'jpeg', quality: 0.98 }, html2canvas:  { scale: 2, useCORS: true, letterRendering: true }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } };
            await html2pdf().from(docxRenderTarget).set(opt).save();
            convertStatusText.textContent = 'Conversion successful! Check your downloads.';
        } catch (error) {
            console.error('Error converting DOCX to PDF:', error);
            convertStatusText.textContent = 'An error occurred during conversion.';
        } finally {
            convertSpinner.classList.add('hidden');
            convertBtn.disabled = false;
            convertClearBtn.disabled = false;
            docxRenderTarget.innerHTML = '';
        }
    });

    // --- IMAGE TO PDF CONVERTER LOGIC ---
    const imageFileInput = document.getElementById('image-file-input');
    const imageFileListContainer = document.getElementById('image-file-list-container');
    const imagePreviewList = document.getElementById('image-preview-list');
    const imageConvertBtn = document.getElementById('image-convert-btn');
    const imageClearBtn = document.getElementById('image-clear-btn');
    const imageStatusContainer = document.getElementById('image-status-container');
    const imageSpinner = document.getElementById('image-spinner');
    const imageStatusText = document.getElementById('image-status-text');
    let selectedImageFiles = [];

    imageFileInput.addEventListener('change', (e) => handleImageFiles(e.target.files));
    
    const imageDropArea = document.querySelector('#panel-image-converter .file-input-label');
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => imageDropArea.addEventListener(eventName, e => {e.preventDefault(); e.stopPropagation();}, false));
    ['dragenter', 'dragover'].forEach(eventName => imageDropArea.addEventListener(eventName, () => imageDropArea.classList.add('drag-over'), false));
    ['dragleave', 'drop'].forEach(eventName => imageDropArea.addEventListener(eventName, () => imageDropArea.classList.remove('drag-over'), false));
    imageDropArea.addEventListener('drop', (e) => handleImageFiles(e.dataTransfer.files), false);


    function handleImageFiles(files) {
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (imageFiles.length > 0) {
            selectedImageFiles = [...selectedImageFiles, ...imageFiles];
            updateImageFileList();
        }
    }
    
    function updateImageFileList() {
        imagePreviewList.innerHTML = '';
        if (selectedImageFiles.length > 0) {
            imageFileListContainer.classList.remove('hidden');
            selectedImageFiles.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const previewWrapper = document.createElement('div');
                    previewWrapper.className = 'relative group aspect-w-1 aspect-h-1';
                    previewWrapper.innerHTML = `
                        <img src="${e.target.result}" alt="${file.name}" class="w-full h-full object-cover rounded-lg shadow-md">
                        <div class="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                            <button class="text-white p-2 rounded-full hover:bg-white/20" onclick="removeImageFile(${index})">
                                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    `;
                    imagePreviewList.appendChild(previewWrapper);
                }
                reader.readAsDataURL(file);
            });
        } else {
            imageFileListContainer.classList.add('hidden');
        }
        imageConvertBtn.disabled = selectedImageFiles.length === 0;
    }
    
    window.removeImageFile = (index) => {
        selectedImageFiles.splice(index, 1);
        updateImageFileList();
    }

    imageClearBtn.addEventListener('click', () => {
        selectedImageFiles = [];
        imageFileInput.value = '';
        updateImageFileList();
        imageStatusContainer.classList.add('hidden');
    });

    imageConvertBtn.addEventListener('click', async () => {
        if (selectedImageFiles.length === 0) return;

        imageStatusContainer.classList.remove('hidden');
        imageStatusText.textContent = 'Converting images to PDF...';
        imageSpinner.classList.remove('hidden');
        imageConvertBtn.disabled = true;
        imageClearBtn.disabled = true;

        try {
            const pdfDoc = await PDFDocument.create();
            
            for (const file of selectedImageFiles) {
                const page = pdfDoc.addPage();
                const { width, height } = page.getSize();
                
                const imageBytes = await file.arrayBuffer();
                let image;
                if (file.type === 'image/jpeg') {
                    image = await pdfDoc.embedJpg(imageBytes);
                } else if (file.type === 'image/png') {
                    image = await pdfDoc.embedPng(imageBytes);
                } else {
                    continue;
                }
                
                const imageDims = image.scaleToFit(width - 50, height - 50);

                page.drawImage(image, {
                    x: (width - imageDims.width) / 2,
                    y: (height - imageDims.height) / 2,
                    width: imageDims.width,
                    height: imageDims.height,
                });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'converted-images.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            imageStatusText.textContent = 'Conversion successful! Check your downloads.';

        } catch (error) {
            console.error('Error converting images to PDF:', error);
            imageStatusText.textContent = 'An error occurred during conversion.';
        } finally {
            imageSpinner.classList.add('hidden');
            imageConvertBtn.disabled = false;
            imageClearBtn.disabled = false;
        }
    });

    // --- PDF TO IMAGE EXTRACTOR LOGIC ---
    const extractorFileInput = document.getElementById('extractor-file-input');
    const extractorPreviewContainer = document.getElementById('extractor-preview-container');
    const extractorPreviewList = document.getElementById('extractor-preview-list');
    const extractorBtn = document.getElementById('extractor-btn');
    const extractorDownloadBtn = document.getElementById('extractor-download-btn');
    const extractorClearBtn = document.getElementById('extractor-clear-btn');
    const extractorStatusContainer = document.getElementById('extractor-status-container');
    const extractorSpinner = document.getElementById('extractor-spinner');
    const extractorStatusText = document.getElementById('extractor-status-text');
    let selectedExtractorFile = null;
    let extractedImages = [];

    extractorFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleExtractorFile(e.target.files[0]);
        }
    });
    
    const extractorDropArea = document.querySelector('#panel-pdf-extractor .file-input-label');
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => extractorDropArea.addEventListener(eventName, e => {e.preventDefault(); e.stopPropagation();}, false));
    ['dragenter', 'dragover'].forEach(eventName => extractorDropArea.addEventListener(eventName, () => extractorDropArea.classList.add('drag-over'), false));
    ['dragleave', 'drop'].forEach(eventName => extractorDropArea.addEventListener(eventName, () => extractorDropArea.classList.remove('drag-over'), false));
    extractorDropArea.addEventListener('drop', (e) => handleExtractorFile(e.dataTransfer.files[0]), false);

    function handleExtractorFile(file) {
        if (file && file.type === 'application/pdf') {
            selectedExtractorFile = file;
            extractorBtn.disabled = false;
            extractorStatusText.textContent = `File selected: ${selectedExtractorFile.name}`;
            extractorStatusContainer.classList.remove('hidden');
            extractorSpinner.classList.add('hidden');
            clearExtractorPreviews();
        }
    }
    
    function clearExtractorPreviews() {
        extractedImages = [];
        extractorPreviewList.innerHTML = '';
        extractorPreviewContainer.classList.add('hidden');
        extractorDownloadBtn.disabled = true;
    }

    function clearExtractor() {
        selectedExtractorFile = null;
        extractorFileInput.value = '';
        extractorBtn.disabled = true;
        extractorStatusContainer.classList.add('hidden');
        clearExtractorPreviews();
    }

    extractorClearBtn.addEventListener('click', clearExtractor);

    extractorBtn.addEventListener('click', async () => {
        if (!selectedExtractorFile || typeof pdfjsLib === 'undefined') {
            console.error("PDF.js library is not loaded.");
            extractorStatusText.textContent = 'Error: A required library failed to load.';
            extractorStatusContainer.classList.remove('hidden');
            return;
        }

        clearExtractorPreviews();
        extractorStatusContainer.classList.remove('hidden');
        extractorStatusText.textContent = 'Loading PDF...';
        extractorSpinner.classList.remove('hidden');
        extractorBtn.disabled = true;
        extractorClearBtn.disabled = true;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const typedarray = new Uint8Array(e.target.result);
                const loadingTask = pdfjsLib.getDocument({data: typedarray});
                const pdf = await loadingTask.promise;
                
                extractorStatusText.textContent = `Rendering 1 of ${pdf.numPages} pages...`;
                extractorPreviewContainer.classList.remove('hidden');

                const promises = [];
                for (let i = 1; i <= pdf.numPages; i++) {
                    // Update status while rendering
                    const promise = renderPage(pdf, i).then(() => {
                       if(i < pdf.numPages) {
                           extractorStatusText.textContent = `Rendering ${i + 1} of ${pdf.numPages} pages...`;
                       }
                    });
                    promises.push(promise);
                }
                
                await Promise.all(promises);

                extractorStatusText.textContent = `Extraction complete. ${pdf.numPages} images ready.`;
                extractorDownloadBtn.disabled = false;

            } catch (error) {
                console.error("Error extracting PDF:", error);
                extractorStatusText.textContent = 'Failed to extract images from PDF.';
            } finally {
                extractorSpinner.classList.add('hidden');
                extractorBtn.disabled = false;
                extractorClearBtn.disabled = false;
            }
        };
        reader.readAsArrayBuffer(selectedExtractorFile);
    });

    async function renderPage(pdf, pageNumber) {
        const page = await pdf.getPage(pageNumber);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;
        
        const dataUrl = canvas.toDataURL('image/png');
        extractedImages.push({ name: `page_${pageNumber}.png`, data: dataUrl });

        const imgElement = document.createElement('img');
        imgElement.src = dataUrl;
        imgElement.className = 'w-full h-auto object-contain rounded-lg shadow-md border border-slate-200 dark:border-slate-700';
        extractorPreviewList.appendChild(imgElement);
    }

    extractorDownloadBtn.addEventListener('click', async () => {
        if (extractedImages.length === 0 || typeof JSZip === 'undefined') return;
        
        extractorStatusText.textContent = 'Zipping files...';
        extractorSpinner.classList.remove('hidden');

        try {
            const zip = new JSZip();
            extractedImages.forEach(img => {
                const base64Data = img.data.split(',')[1];
                zip.file(img.name, base64Data, { base64: true });
            });

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedExtractorFile.name.replace('.pdf', '')}_images.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            
            extractorStatusText.textContent = 'Download started!';

        } catch (error) {
            console.error("Error creating ZIP file:", error);
            extractorStatusText.textContent = 'Could not create ZIP file.';
        } finally {
            extractorSpinner.classList.add('hidden');
        }
    });

});
