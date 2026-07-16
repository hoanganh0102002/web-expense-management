const XLSX = require('xlsx');
const fs = require('fs');

const fileBuf = fs.readFileSync('c:/Users/BAO TRAN/Desktop/DoAN/web-expense-management/frontend/public/template_import.xls');
const workbook = XLSX.read(fileBuf, { type: 'buffer', cellDates: true });
const firstSheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[firstSheetName];
let rows = XLSX.utils.sheet_to_json(worksheet, {header: 1, raw: false, dateNF: 'yyyy-mm-dd'});

console.log("ROWS:", rows);

if (rows.length > 0) {
    let header = rows[0];
    let dateIdx = header.findIndex(h => typeof h === 'string' && ['ngày', 'ngày giao dịch', 'date'].includes(h.trim().toLowerCase()));
    let timeIdx = header.findIndex(h => typeof h === 'string' && ['giờ', 'thời gian', 'time'].includes(h.trim().toLowerCase()));
    let categoryIdx = header.findIndex(h => typeof h === 'string' && ['danh mục', 'category'].includes(h.trim().toLowerCase()));
    let titleIdx = header.findIndex(h => typeof h === 'string' && ['tiêu đề', 'tên', 'title'].includes(h.trim().toLowerCase()));
    let amountIdx = header.findIndex(h => typeof h === 'string' && ['số tiền', 'tiền', 'amount'].includes(h.trim().toLowerCase()));
    let typeIdx = header.findIndex(h => typeof h === 'string' && ['loại', 'loại giao dịch', 'type'].includes(h.trim().toLowerCase()));
    let walletIdx = header.findIndex(h => typeof h === 'string' && ['ví', 'wallet', 'wallet_id'].includes(h.trim().toLowerCase()));
    let notesIdx = header.findIndex(h => typeof h === 'string' && ['ghi chú', 'notes', 'note'].includes(h.trim().toLowerCase()));

    console.log("INDEXES:", {dateIdx, timeIdx, categoryIdx, titleIdx, amountIdx, typeIdx, walletIdx, notesIdx});

    for (let i = 1; i < rows.length; i++) {
        if (!rows[i] || rows[i].length === 0) continue;
        let r = rows[i];
        
        let dateVal = dateIdx !== -1 && r[dateIdx] ? String(r[dateIdx]) : '';
        if (dateVal.includes('/')) {
            let parts = dateVal.split('/');
            if (parts.length === 3 && parts[0].length <= 2 && parts[2].length === 4) {
                dateVal = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }
        let timeVal = timeIdx !== -1 && r[timeIdx] ? String(r[timeIdx]) : '00:00:00';
        let finalDate = dateVal ? `${dateVal} ${timeVal}` : '';
        
        let rawType = typeIdx !== -1 && r[typeIdx] ? String(r[typeIdx]).trim().toLowerCase() : '';
        let finalType = 'expense';
        if (['thu nhập', 'income', 'thu'].includes(rawType)) finalType = 'income';
        
        let amountVal = amountIdx !== -1 && r[amountIdx] ? String(r[amountIdx]).replace(/[^0-9-]/g, '') : '0';
        let walletVal = walletIdx !== -1 && r[walletIdx] ? String(r[walletIdx]) : '';
        let categoryVal = categoryIdx !== -1 && r[categoryIdx] ? String(r[categoryIdx]) : '';
        let titleVal = titleIdx !== -1 && r[titleIdx] ? String(r[titleIdx]) : (categoryVal || 'Giao dịch import');
        let notesVal = notesIdx !== -1 && r[notesIdx] ? String(r[notesIdx]) : '';

        console.log(`Row ${i}: date=${finalDate} type=${finalType} amt=${amountVal} wallet=${walletVal} title=${titleVal} cat=${categoryVal}`);
    }
}
