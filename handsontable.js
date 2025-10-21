// handsontable.js

let hot; // will hold the Handsontable instance
const container = document.getElementById('sheet');

// Create empty Handsontable grid initially
hot = new Handsontable(container, {
  data: [],
  colHeaders: true,
  rowHeaders: true,
  licenseKey: 'non-commercial-and-evaluation',
  stretchH: 'all',
  contextMenu: true,
  manualColumnResize: true,
  manualRowResize: true,
  width: '100%',
  height: 400,
  formulas: {
    engine: HyperFormula
  }
});

// ✅ Handle Excel file upload
document.getElementById('excelFile').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });

    // Take first sheet
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }); // array of arrays

    // Load into Handsontable
    hot.loadData(jsonData);
  };
  reader.readAsArrayBuffer(file);
});

// ✅ Get Data button
document.getElementById('getDataBtn').addEventListener('click', () => {
  const sheetData = hot.getData();
  alert(JSON.stringify(sheetData));
  console.log(sheetData);
});

// ✅ Clear Sheet button
document.getElementById('clearBtn').addEventListener('click', () => {
  if (confirm('Clear all data?')) {
    hot.loadData([]);
  }
});
