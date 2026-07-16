const XLSX = require('xlsx');
const fs = require('fs');

const testCases = [
  "70.000",
  "70000",
  "70,000",
  "70.000,00",
  70000,
  70
];

console.log("Testing new logic:");
testCases.forEach(rawAmt => {
    let cleanNum = String(rawAmt).trim();
    if (cleanNum.includes('.') && cleanNum.includes(',')) {
        const lastDot = cleanNum.lastIndexOf('.');
        const lastComma = cleanNum.lastIndexOf(',');
        if (lastComma > lastDot) {
            cleanNum = cleanNum.replace(/\./g, '').replace(',', '.');
        } else {
            cleanNum = cleanNum.replace(/,/g, '');
        }
    } else if (cleanNum.includes(',')) {
        if (/,([0-9]{3})+$/.test(cleanNum)) {
            cleanNum = cleanNum.replace(/,/g, '');
        } else {
            cleanNum = cleanNum.replace(',', '.');
        }
    } else if (cleanNum.includes('.')) {
        if (/\.([0-9]{3})+$/.test(cleanNum)) {
            cleanNum = cleanNum.replace(/\./g, '');
        }
    }
    cleanNum = cleanNum.replace(/[^0-9.-]/g, '');
    let amountVal = cleanNum || '0';
    console.log(`Input: ${rawAmt} (${typeof rawAmt}) -> cleanNum: ${cleanNum} -> amountVal: ${amountVal}`);
});
