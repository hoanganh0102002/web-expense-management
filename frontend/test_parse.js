const XLSX = require('xlsx');
const fs = require('fs');

try {
    const fileBuf = fs.readFileSync('c:/Users/BAO TRAN/Downloads/Giao_Dich_2026-07-01_2026-07-31 (2).xls');
    const workbook = XLSX.read(fileBuf, { type: 'buffer', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    let rows = XLSX.utils.sheet_to_json(worksheet, {header: 1, raw: true});
    
    fs.writeFileSync('c:/Users/BAO TRAN/Desktop/DoAN/web-expense-management/frontend/output.json', JSON.stringify({
        rowsLength: rows.length,
        firstFewRows: rows.slice(0, 10)
    }, null, 2));

} catch (e) {
    fs.writeFileSync('c:/Users/BAO TRAN/Desktop/DoAN/web-expense-management/frontend/output.json', JSON.stringify({error: e.message}));
}
