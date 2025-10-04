class PDFMerger {
    constructor() {
        this.files = [];
        this.mergedPdfBytes = null;
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.uploadView = document.getElementById('upload-view');
        this.filesView = document.getElementById('files-view');
        this.loadingView = document.getElementById('loading-view');
        this.downloadView = document.getElementById('download-view');
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.filesGrid = document.getElementById('filesGrid');
        this.selectBtn = document.getElementById('selectBtn');
        this.addMoreBtn = document.getElementById('addMoreBtn');
        this.mergeBtn = document.getElementById('mergeBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.startOverBtn = document.getElementById('startOverBtn');
    }

    bindEvents() {
        this.selectBtn.addEventListener('click', () => this.fileInput.click());
        this.addMoreBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        this.mergeBtn.addEventListener('click', () => this.mergePDFs());
        this.downloadBtn.addEventListener('click', () => this.downloadMergedPDF());
        this.startOverBtn.addEventListener('click', () => this.reset());
        
        document.getElementById('sortAZ').addEventListener('click', () => this.sortFiles('az'));
        document.getElementById('sortZA').addEventListener('click', () => this.sortFiles('za'));
        document.getElementById('sortDate').addEventListener('click', () => this.sortFiles('date'));

        // Drag and drop
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('drag-over');
        });
        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('drag-over');
        });
        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });
    }

    handleFiles(fileList) {
        const pdfFiles = Array.from(fileList).filter(file => file.type === 'application/pdf');
        if (pdfFiles.length === 0) {
            alert('Please select PDF files only.');
            return;
        }

        pdfFiles.forEach(file => {
            if (!this.files.some(f => f.name === file.name && f.size === file.size)) {
                this.files.push(file);
            }
        });

        this.renderFiles();
        this.showFilesView();
    }

    renderFiles() {
        this.filesGrid.innerHTML = '';
        this.files.forEach((file, index) => {
            const card = document.createElement('div');
            card.className = 'file-card';
            card.draggable = true;
            card.dataset.index = index;

            card.innerHTML = `
                <div class="file-preview">📄</div>
                <div class="file-name">${file.name}</div>
                <button class="remove-btn" onclick="pdfMerger.removeFile(${index})">×</button>
            `;

            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', index);
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
            });

            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                card.classList.add('drag-over');
            });
            
            card.addEventListener('dragleave', () => {
                card.classList.remove('drag-over');
            });
            
            card.addEventListener('drop', (e) => {
                e.preventDefault();
                card.classList.remove('drag-over');
                const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const dropIndex = parseInt(card.dataset.index);
                if (dragIndex !== dropIndex) {
                    this.reorderFiles(dragIndex, dropIndex);
                }
            });

            this.filesGrid.appendChild(card);
        });

        this.mergeBtn.disabled = this.files.length < 2;
    }

    removeFile(index) {
        this.files.splice(index, 1);
        if (this.files.length === 0) {
            this.showUploadView();
        } else {
            this.renderFiles();
        }
    }

    reorderFiles(fromIndex, toIndex) {
        const [movedFile] = this.files.splice(fromIndex, 1);
        this.files.splice(toIndex, 0, movedFile);
        this.renderFiles();
    }

    sortFiles(type) {
        switch(type) {
            case 'az':
                this.files.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'za':
                this.files.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'date':
                this.files.sort((a, b) => b.lastModified - a.lastModified);
                break;
        }
        this.renderFiles();
    }

    async mergePDFs() {
        this.showLoadingView();
        
        try {
            const mergedPdf = await PDFLib.PDFDocument.create();
            
            for (const file of this.files) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                pages.forEach(page => mergedPdf.addPage(page));
            }
            
            this.mergedPdfBytes = await mergedPdf.save();
            this.showDownloadView();
        } catch (error) {
            alert('Error merging PDFs: ' + error.message);
            this.showFilesView();
        }
    }

    downloadMergedPDF() {
        const blob = new Blob([this.mergedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'merged.pdf';
        a.click();
        URL.revokeObjectURL(url);
    }

    reset() {
        this.files = [];
        this.mergedPdfBytes = null;
        this.fileInput.value = '';
        this.showUploadView();
    }

    showUploadView() {
        this.uploadView.classList.remove('hidden');
        this.filesView.classList.add('hidden');
        this.loadingView.classList.add('hidden');
        this.downloadView.classList.add('hidden');
    }

    showFilesView() {
        this.uploadView.classList.add('hidden');
        this.filesView.classList.remove('hidden');
        this.loadingView.classList.add('hidden');
        this.downloadView.classList.add('hidden');
    }

    showLoadingView() {
        this.uploadView.classList.add('hidden');
        this.filesView.classList.add('hidden');
        this.loadingView.classList.remove('hidden');
        this.downloadView.classList.add('hidden');
    }

    showDownloadView() {
        this.uploadView.classList.add('hidden');
        this.filesView.classList.add('hidden');
        this.loadingView.classList.add('hidden');
        this.downloadView.classList.remove('hidden');
    }
}

const pdfMerger = new PDFMerger();