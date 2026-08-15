package com.example.resumescreening.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ResumeParserService {

    public String extractText(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty. Please select a valid resume file.");
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            throw new IllegalArgumentException("File name is missing. Please upload a valid file.");
        }

        String lowerFileName = originalName.toLowerCase(Locale.ROOT);

        try {
            if (lowerFileName.endsWith(".pdf")) {
                return extractTextFromPdf(file);
            }
            if (lowerFileName.endsWith(".docx")) {
                return extractTextFromDocx(file);
            }
            if (lowerFileName.endsWith(".txt")) {
                return extractTextFromTxt(file);
            }

            throw new IllegalArgumentException(
                "Unsupported file type: " + originalName + ". Supported formats are PDF, DOCX and TXT."
            );
        } catch (IOException | InvalidFormatException e) {
            throw new IllegalArgumentException("Unable to read file: " + originalName + ". Please check the file format and contents.", e);
        }
    }

    private String extractTextFromPdf(MultipartFile file) throws IOException {
        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            if (document.isEncrypted()) {
                throw new IllegalArgumentException("The PDF is encrypted and cannot be parsed.");
            }

            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document).trim();
        }
    }

    private String extractTextFromDocx(MultipartFile file) throws IOException, InvalidFormatException {
        try (XWPFDocument document = new XWPFDocument(file.getInputStream())) {
            StringBuilder builder = new StringBuilder();
            document.getParagraphs().forEach(paragraph -> {
                String text = paragraph.getText();
                if (text != null && !text.isBlank()) {
                    builder.append(text).append(System.lineSeparator());
                }
            });
            return builder.toString().trim();
        }
    }

    private String extractTextFromTxt(MultipartFile file) throws IOException {
        return new String(file.getBytes(), StandardCharsets.UTF_8);
    }
}
