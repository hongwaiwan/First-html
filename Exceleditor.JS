// Global variables
let hot;
let workbook = {
    sheets: [{ name: 'Sheet1', data: [] }],
    currentSheet: 0
};
let currentFileHandle = null; // Store file handle for Save function
let currentFileName = null; // Store current filename

/**
 * Initialize Handsontable with data
 */
function initHandsontable(data = []) {
    const container = document.getElementById('spreadsheet');
    
    // Destroy existing instance
    if (hot) {
        hot.destroy();
    }

    // Create empty data if none provided
    if (!data.length) {
        data = Array(20).fill().map(() => Array(10).fill(''));
    }

    // Initialize Handsontable
    hot = new Handsontable(container, {
        data: data,
        rowHeaders: true,
        colHeaders: true,
        contextMenu: true,
        manualColumnResize: true,
        manualRowResize: true,
        filters: true,
        dropdownMenu: true,
        columnSorting: true,
        autoWrapRow: true,
        autoWrapCol: true,
        licenseKey: 'non-commercial-and-evaluation',
        width: '100%',
        height: 600,
        stretchH: 'all',
        className: 'htCenter htMiddle'
    });

    // Save data to workbook
    workbook.sheets[workbook.currentSheet].data = data;
    renderSheetTabs();
}

/**
 * Render sheet tabs at the bottom
 */
function renderSheetTabs() {
    const tabsContainer = document.getElementById('sheetTabs');
    tabsContainer.innerHTML = '';
    
    // Create tabs for each sheet
    workbook.sheets.forEach((sheet, index) => {
        const tab = document.createElement('div');
        tab.className = 'sheet-tab' + (index === workbook.currentSheet ? ' active' : '');
        
        const tabName = document.createElement('span');
        tabName.textContent = sheet.name;
        tab.appendChild(tabName);
        
        // Add delete button (only show if more than 1 sheet)
        if (workbook.sheets.length > 1) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteSheet(index);
            };
            tab.appendChild(deleteBtn);
        }
        
        tab.onclick = () => switchSheet(index);
        tabsContainer.appendChild(tab);
    });
    
    // Add "+" button to add new sheet
    const addBtn = document.createElement('button');
    addBtn.className = 'add-sheet-btn';
    addBtn.innerHTML = '+';
    addBtn.onclick = addNewSheet;
    tabsContainer.appendChild(addBtn);
}

/**
 * Switch to a different sheet
 */
function switchSheet(index) {
    if (hot) {
        // Save current sheet data
        workbook.sheets[workbook.currentSheet].data = hot.getData();
    }
    
    // Switch to new sheet
    workbook.currentSheet = index;
    initHandsontable(workbook.sheets[index].data);
}

/**
 * Create a completely new Excel file
 */
function newExcelFile() {
    if (hot && hot.getData().some(row => row.some(cell => cell !== '' && cell !== null))) {
        if (!confirm('Create a new Excel file? Any unsaved changes will be lost.')) {
            return;
        }
    }
    
    // Reset workbook and file references
    workbook = {
        sheets: [{ name: 'Sheet1', data: [] }],
        currentSheet: 0
    };
    currentFileHandle = null;
    currentFileName = null;
    
    initHandsontable();
    console.log('New Excel file created');
}

/**
 * Add a new sheet to the workbook
 */
function addNewSheet() {
    if (hot) {
        // Save current sheet data
        workbook.sheets[workbook.currentSheet].data = hot.getData();
    }
    
    // Create new sheet with unique name
    const sheetNumber = workbook.sheets.length + 1;
    const newSheetName = 'Sheet' + sheetNumber;
    
    workbook.sheets.push({
        name: newSheetName,
        data: []
    });
    
    // Switch to the new sheet
    workbook.currentSheet = workbook.sheets.length - 1;
    initHandsontable();
    
    console.log('New sheet added:', newSheetName);
}

/**
 * Delete a sheet from the workbook
 */
function deleteSheet(index) {
    // Don't allow deleting if it's the only sheet
    if (workbook.sheets.length <= 1) {
        alert('Cannot delete the last sheet. At least one sheet is required.');
        return;
    }
    
    const sheetName = workbook.sheets[index].name;
    
    if (!confirm(`Delete sheet "${sheetName}"? This action cannot be undone.`)) {
        return;
    }
    
    // Remove the sheet
    workbook.sheets.splice(index, 1);
    
    // Adjust current sheet index if necessary
    if (workbook.currentSheet >= workbook.sheets.length) {
        workbook.currentSheet = workbook.sheets.length - 1;
    } else if (workbook.currentSheet >= index) {
        workbook.currentSheet = Math.max(0, workbook.currentSheet - 1);
    }
    
    // Reinitialize with the current sheet
    initHandsontable(workbook.sheets[workbook.currentSheet].data);
    
    console.log('Sheet deleted:', sheetName);
}

/**
 * Add a new row to the current sheet
 */
function addRow() {
    if (hot) {
        hot.alter('insert_row', hot.countRows());
    }
}

/**
 * Add a new column to the current sheet
 */
function addColumn() {
    if (hot) {
        hot.alter('insert_col', hot.countCols());
    }
}

/**
 * Clear all data in the current sheet
 */
function clearAll() {
    if (!confirm('Are you sure you want to clear all data in this sheet?')) {
        return;
    }
    
    const emptyData = Array(20).fill().map(() => Array(10).fill(''));
    
    if (hot) {
        hot.loadData(emptyData);
        workbook.sheets[workbook.currentSheet].data = emptyData;
    }
    
    console.log('Sheet cleared');
}

/**
 * Handle file upload
 */
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Store the filename
    currentFileName = file.name;
    currentFileHandle = null; // Reset file handle as we're reading, not writing

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const wb = XLSX.read(data, { type: 'array' });
            
            // Clear existing workbook
            workbook.sheets = [];
            
            // Load all sheets from the Excel file
            wb.SheetNames.forEach((sheetName) => {
                const worksheet = wb.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    defval: ''
                });
                
                workbook.sheets.push({
                    name: sheetName,
                    data: jsonData
                });
            });

            // Switch to first sheet
            workbook.currentSheet = 0;
            initHandsontable(workbook.sheets[0].data);
            
            console.log('Excel file loaded successfully:', currentFileName);
        } catch (error) {
            alert('Error reading Excel file: ' + error.message);
            console.error('Error:', error);
        }
    };
    
    reader.readAsArrayBuffer(file);
    
    // Reset file input so the same file can be loaded again
    e.target.value = '';
});

/**
 * Save to the current file (same filename and location)
 */
async function saveExcel() {
    if (!hot) {
        alert('No data to save');
        return;
    }

    try {
        // Save current sheet data
        workbook.sheets[workbook.currentSheet].data = hot.getData();

        // Create new workbook
        const wb = XLSX.utils.book_new();
        
        // Add all sheets to the workbook
        workbook.sheets.forEach(sheet => {
            const ws = XLSX.utils.aoa_to_sheet(sheet.data);
            XLSX.utils.book_append_sheet(wb, ws, sheet.name);
        });

        // Generate file buffer
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        // Check if File System Access API is supported
        if ('showSaveFilePicker' in window) {
            // If we have a file handle, save directly to it
            if (currentFileHandle) {
                try {
                    const writable = await currentFileHandle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    
                    console.log('File saved successfully to:', currentFileName);
                    alert('File saved successfully!');
                    return;
                } catch (err) {
                    console.error('Error saving to existing file:', err);
                    // Fall through to Save As dialog
                }
            }
            
            // No file handle, use Save As dialog
            await saveAsExcel(wb, blob);
        } else {
            // Fallback for browsers that don't support File System Access API
            const filename = currentFileName || 'spreadsheet_' + new Date().getTime() + '.xlsx';
            XLSX.writeFile(wb, filename);
            console.log('Excel file downloaded:', filename);
        }
    } catch (error) {
        alert('Error saving Excel file: ' + error.message);
        console.error('Error:', error);
    }
}

/**
 * Save As - Open save dialog to choose location and filename
 */
async function saveAsExcel(wb, blob) {
    try {
        // Show save file picker dialog
        const options = {
            suggestedName: currentFileName || 'spreadsheet_' + new Date().getTime() + '.xlsx',
            types: [{
                description: 'Excel Files',
                accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
            }]
        };
        
        const handle = await window.showSaveFilePicker(options);
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        
        // Store file handle and name for future saves
        currentFileHandle = handle;
        currentFileName = handle.name;
        
        console.log('Excel file saved successfully as:', currentFileName);
        alert('File saved successfully!');
    } catch (err) {
        // User cancelled the save dialog
        if (err.name !== 'AbortError') {
            console.error('Error saving file:', err);
            throw err;
        }
    }
}

/**
 * Download current workbook as Excel file (Save As dialog)
 */
async function downloadExcel() {
    if (!hot) {
        alert('No data to save');
        return;
    }

    try {
        // Save current sheet data
        workbook.sheets[workbook.currentSheet].data = hot.getData();

        // Create new workbook
        const wb = XLSX.utils.book_new();
        
        // Add all sheets to the workbook
        workbook.sheets.forEach(sheet => {
            const ws = XLSX.utils.aoa_to_sheet(sheet.data);
            XLSX.utils.book_append_sheet(wb, ws, sheet.name);
        });

        // Generate file buffer
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        // Check if File System Access API is supported
        if ('showSaveFilePicker' in window) {
            await saveAsExcel(wb, blob);
        } else {
            // Fallback for browsers that don't support File System Access API
            const filename = currentFileName || 'spreadsheet_' + new Date().getTime() + '.xlsx';
            XLSX.writeFile(wb, filename);
            console.log('Excel file downloaded:', filename);
        }
    } catch (error) {
        alert('Error saving Excel file: ' + error.message);
        console.error('Error:', error);
    }
}

/**
 * Initialize the application on page load
 */
window.addEventListener('DOMContentLoaded', function() {
    initHandsontable();
    console.log('Excel Editor initialized');
});