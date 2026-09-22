package com.finance.report;

import com.finance.transaction.Transaction;
import com.finance.transaction.TransactionRepository;
import com.finance.transaction.TransactionType;
import com.finance.user.User;
import com.finance.user.UserRepository;

import com.itextpdf.text.BaseColor;
import com.itextpdf.text.Document;
import com.itextpdf.text.Font;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.Phrase;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;

import lombok.RequiredArgsConstructor;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    public byte[] exportPdf(LocalDate from, LocalDate to) throws Exception {

        User user = currentUser();

        List<Transaction> txns =
                transactionRepository.findByUserAndDateBetweenOrderByDateDesc(user, from, to);

        Document doc = new Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        PdfWriter.getInstance(doc, out);

        doc.open();

        Font titleFont = new Font(Font.FontFamily.HELVETICA, 16, Font.BOLD);
        Font headerFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD);
        Font cellFont = new Font(Font.FontFamily.HELVETICA, 9);

        doc.add(new Paragraph("Finance Report: " + from + " to " + to, titleFont));
        doc.add(new Paragraph(" "));

        BigDecimal income = txns.stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal expense = txns.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        doc.add(new Paragraph("Total Income: " + income, headerFont));
        doc.add(new Paragraph("Total Expense: " + expense, headerFont));
        doc.add(new Paragraph("Net Balance: " + income.subtract(expense), headerFont));
        doc.add(new Paragraph(" "));

        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);

        String[] headers = {
                "Date",
                "Type",
                "Category",
                "Description",
                "Amount"
        };

        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
            cell.setBackgroundColor(BaseColor.LIGHT_GRAY);
            table.addCell(cell);
        }

        for (Transaction t : txns) {
            table.addCell(new Phrase(t.getDate().toString(), cellFont));
            table.addCell(new Phrase(t.getType().name(), cellFont));
            table.addCell(new Phrase(
                    t.getCategory() != null ? t.getCategory().getName() : "-",
                    cellFont));
            table.addCell(new Phrase(
                    t.getDescription() != null ? t.getDescription() : "-",
                    cellFont));
            table.addCell(new Phrase(
                    t.getAmount().toString(),
                    cellFont));
        }

        doc.add(table);
        doc.close();

        return out.toByteArray();
    }

    public byte[] exportExcel(LocalDate from, LocalDate to) throws Exception {

        User user = currentUser();

        List<Transaction> txns =
                transactionRepository.findByUserAndDateBetweenOrderByDateDesc(user, from, to);

        Workbook workbook = new XSSFWorkbook();

        Sheet sheet = workbook.createSheet("Transactions");

        Row header = sheet.createRow(0);

        String[] columns = {
                "Date",
                "Type",
                "Category",
                "Description",
                "Amount",
                "Tags"
        };

        for (int i = 0; i < columns.length; i++) {
            header.createCell(i).setCellValue(columns[i]);
        }

        int rowNum = 1;

        for (Transaction t : txns) {

            Row row = sheet.createRow(rowNum++);

            row.createCell(0).setCellValue(t.getDate().toString());
            row.createCell(1).setCellValue(t.getType().name());
            row.createCell(2).setCellValue(
                    t.getCategory() != null ? t.getCategory().getName() : "");
            row.createCell(3).setCellValue(
                    t.getDescription() != null ? t.getDescription() : "");
            row.createCell(4).setCellValue(t.getAmount().doubleValue());
            row.createCell(5).setCellValue(
                    String.join(", ", t.getTags()));
        }

        Sheet yoySheet = workbook.createSheet("Year-over-Year");

        Row yoyHeader = yoySheet.createRow(0);

        yoyHeader.createCell(0).setCellValue("Year");
        yoyHeader.createCell(1).setCellValue("Total Income");
        yoyHeader.createCell(2).setCellValue("Total Expense");
        yoyHeader.createCell(3).setCellValue("Net");

        Map<Integer, List<Transaction>> byYear =
                txns.stream()
                        .collect(Collectors.groupingBy(
                                t -> t.getDate().getYear()));

        int yoyRow = 1;

        for (Map.Entry<Integer, List<Transaction>> entry : byYear.entrySet()) {

            BigDecimal inc = entry.getValue().stream()
                    .filter(t -> t.getType() == TransactionType.INCOME)
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal exp = entry.getValue().stream()
                    .filter(t -> t.getType() == TransactionType.EXPENSE)
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Row row = yoySheet.createRow(yoyRow++);

            row.createCell(0).setCellValue(entry.getKey());
            row.createCell(1).setCellValue(inc.doubleValue());
            row.createCell(2).setCellValue(exp.doubleValue());
            row.createCell(3).setCellValue(
                    inc.subtract(exp).doubleValue());
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();

        workbook.write(out);
        workbook.close();

        return out.toByteArray();
    }
}