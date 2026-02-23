"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

interface ExportButtonsProps {
    transactions: any[];
    title?: string;
}

export default function ExportButtons({ transactions, title = "Transaction Report" }: ExportButtonsProps) {

    const exportPDF = async () => {
        const doc = new jsPDF();

        // Prepare Data
        const tableColumn = ["Date", "Description", "Category", "Type", "Amount", "Tags"];
        const tableRows: any[] = [];

        transactions.forEach((t) => {
            const dateStr = t.date?.toDate ? format(t.date.toDate(), "dd-MM-yyyy") : format(new Date(t.date), "dd-MM-yyyy");
            const timeStr = t.time ? ` ${t.time}` : "";

            const transactionData = [
                dateStr + timeStr,
                t.description,
                t.category,
                t.type,
                `${t.type === 'income' ? '+' : '-'} Rs. ${Number(t.amount).toFixed(2)}`,
                t.tags ? t.tags.join(", ") : ""
            ];
            tableRows.push(transactionData);
        });

        // Add Logo
        try {
            const img = new Image();
            img.src = '/logo-updated.png';
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const imgWidth = 30;
            const imgHeight = (img.height * imgWidth) / img.width;
            const pageWidth = doc.internal.pageSize.getWidth();
            const logoX = pageWidth - 14 - imgWidth;
            const logoY = 10;
            doc.addImage(img, 'PNG', logoX, logoY, imgWidth, imgHeight);

            doc.setFontSize(18);
            doc.text(title, 14, 20);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Date: ${format(new Date(), "PP")}`, 14, 26);

            doc.setFontSize(9);
            doc.setTextColor(59, 130, 246);
            doc.textWithLink("https://web.mypocketbook.in/", 14, 32, { url: "https://web.mypocketbook.in/" });
            doc.setTextColor(0);

            const startY = Math.max(10 + imgHeight, 32) + 10;

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: startY,
                theme: "grid",
                styles: { fontSize: 8 },
                headStyles: { fillColor: [59, 130, 246] },
            });
        } catch (error) {
            console.error("Error adding logo to PDF", error);
            // Fallback
            doc.setFontSize(18);
            doc.text(title, 14, 22);
            doc.setFontSize(11);
            doc.text(`Date: ${format(new Date(), "PP")}`, 14, 30);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 40,
                theme: "grid",
                styles: { fontSize: 8 },
                headStyles: { fillColor: [59, 130, 246] },
            });
        }

        // SAVE LOGIC
        const fileName = `${title.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`;

        if (Capacitor.isNativePlatform()) {
            try {
                // Get Base64 without prefix
                // alert("Generating PDF..."); // Debug
                const base64Data = doc.output('datauristring').split(',')[1];

                // alert("Writing file..."); // Debug
                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: base64Data,
                    directory: Directory.Cache
                });

                // alert(`File saved to: ${result.uri}`); // Debug

                await Share.share({
                    title: 'Export Report',
                    text: `Here is your ${title}.`,
                    url: result.uri,
                    dialogTitle: 'Share Report'
                });
            } catch (e: any) {
                console.error("Native Export Failed", e);
                const msg = e.message || JSON.stringify(e);
                alert(`PDF Export Error: ${msg}`);
            }
        } else {
            doc.save(fileName);
        }
    };

    const exportExcel = async () => {
        const worksheet = XLSX.utils.json_to_sheet(
            transactions.map((t) => {
                const dateStr = t.date?.toDate ? format(t.date.toDate(), "dd-MM-yyyy") : format(new Date(t.date), "dd-MM-yyyy");
                const timeStr = t.time ? ` ${t.time}` : "";

                return {
                    Date: dateStr + timeStr,
                    Description: t.description,
                    Category: t.category,
                    Type: t.type,
                    Amount: Number(t.amount),
                    Tags: t.tags ? t.tags.join(", ") : ""
                };
            })
        );

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
        const fileName = `${title.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.xlsx`;

        if (Capacitor.isNativePlatform()) {
            try {
                const base64Data = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });

                const result = await Filesystem.writeFile({
                    path: fileName,
                    data: base64Data,
                    directory: Directory.Cache
                });

                await Share.share({
                    title: 'Export Excel',
                    text: `Here is your ${title} (Excel).`,
                    url: result.uri,
                    dialogTitle: 'Share Excel'
                });
            } catch (e: any) {
                console.error("Native Excel Export Failed", e);
                alert(`Export Failed: ${e.message}`);
            }
        } else {
            XLSX.writeFile(workbook, fileName);
        }
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={exportExcel}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                title="Export to Excel"
            >
                <FileSpreadsheet size={16} /> <span>Excel</span>
            </button>
            <button
                onClick={exportPDF}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                title="Export to PDF"
            >
                <FileText size={16} /> <span>PDF</span>
            </button>
        </div>
    );
}
