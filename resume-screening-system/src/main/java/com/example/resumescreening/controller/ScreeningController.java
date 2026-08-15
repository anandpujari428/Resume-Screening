package com.example.resumescreening.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import com.example.resumescreening.model.ScreeningResult;
import com.example.resumescreening.service.ResumeParserService;
import com.example.resumescreening.service.ScreeningEngineService;

@Controller
public class ScreeningController {

    private final ResumeParserService resumeParserService;
    private final ScreeningEngineService screeningEngineService;

    public ScreeningController(ResumeParserService resumeParserService, ScreeningEngineService screeningEngineService) {
        this.resumeParserService = resumeParserService;
        this.screeningEngineService = screeningEngineService;
    }

    @GetMapping("/")
    public String home() {
        return "index";
    }

    @PostMapping("/screen")
    public String screen(
        @RequestParam(value = "jobDescription", required = false) String jobDescription,
        @RequestParam(value = "jobDescriptionFile", required = false) MultipartFile jobDescriptionFile,
        @RequestParam(value = "customSkills", required = false) String customSkills,
        @RequestParam("resumes") MultipartFile[] resumes,
        Model model
    ) {
        try {
            String effectiveJobDescription = resolveJobDescription(jobDescription, jobDescriptionFile);
            if (effectiveJobDescription == null || effectiveJobDescription.isBlank()) {
                model.addAttribute("errorMessage", "Please provide a job description or upload one.");
                return "index";
            }

            Map<String, String> resumeTexts = new LinkedHashMap<>();
            for (MultipartFile resume : resumes) {
                if (resume == null || resume.isEmpty()) {
                    continue;
                }
                String extractedText = resumeParserService.extractText(resume);
                resumeTexts.put(resume.getOriginalFilename(), extractedText);
            }

            if (resumeTexts.isEmpty()) {
                model.addAttribute("errorMessage", "Please upload at least one resume in PDF, DOCX or TXT format.");
                return "index";
            }

            List<String> requiredSkills = parseSkills(customSkills);
            List<ScreeningResult> results = screeningEngineService.rankResumes(
                effectiveJobDescription,
                resumeTexts,
                requiredSkills
            );

            model.addAttribute("results", results);
            model.addAttribute("chartLabels", results.stream().map(ScreeningResult::name).toList());
            model.addAttribute("chartScores", results.stream().map(result -> result.score()).toList());
            return "results";
        } catch (IllegalArgumentException e) {
            model.addAttribute("errorMessage", e.getMessage());
            return "index";
        } catch (Exception e) {
            model.addAttribute("errorMessage", "An unexpected error occurred during screening: " + e.getMessage());
            return "index";
        }
    }

    private String resolveJobDescription(String text, MultipartFile uploadedFile) {
        if (text != null && !text.isBlank()) {
            return text;
        }

        if (uploadedFile != null && !uploadedFile.isEmpty()) {
            return resumeParserService.extractText(uploadedFile);
        }

        return null;
    }

    private List<String> parseSkills(String customSkills) {
        if (customSkills == null || customSkills.isBlank()) {
            return new ArrayList<>();
        }

        return Arrays.stream(customSkills.split(","))
            .map(String::trim)
            .filter(skill -> !skill.isEmpty())
            .toList();
    }
}
