package com.example.resumescreening.service;

import static org.junit.jupiter.api.Assertions.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.example.resumescreening.model.ScreeningResult;

class ScreeningEngineServiceTest {

    private ScreeningEngineService screeningEngineService;
    private String jobDescription;
    private String strongResume;
    private String weakResume;

    @BeforeEach
    void setUp() throws IOException {
        screeningEngineService = new ScreeningEngineService();

        jobDescription = Files.readString(Path.of("src/main/resources/sample-data/job_description.txt"), StandardCharsets.UTF_8);
        strongResume = Files.readString(Path.of("src/main/resources/sample-data/resume_strong_match.txt"), StandardCharsets.UTF_8);
        weakResume = Files.readString(Path.of("src/main/resources/sample-data/resume_weak_match.txt"), StandardCharsets.UTF_8);
    }

    @Test
    void completeScreeningPipelineProducesExpectedRanking() {
        List<String> requiredSkills = List.of(
            "Java", "Python", "C", "C++", "R", "SQL", "Spring Boot",
            "Machine Learning", "Data Structures", "Git", "Communication",
            "HTML", "CSS", "JavaScript"
        );

        Map<String, String> resumes = Map.of(
            "resume_strong_match.txt", strongResume,
            "resume_weak_match.txt", weakResume
        );

        List<ScreeningResult> results = screeningEngineService.rankResumes(jobDescription, resumes, requiredSkills);

        assertEquals(2, results.size());
        assertTrue(results.get(0).score() > results.get(1).score(), "Strong match should rank above weak match");

        ScreeningResult strongMatch = results.get(0);
        ScreeningResult weakMatch = results.get(1);

        assertTrue(strongMatch.matchedSkills().contains("Java"));
        assertTrue(strongMatch.matchedSkills().contains("Spring Boot"));
        assertTrue(strongMatch.matchedSkills().contains("SQL"));
        assertTrue(strongMatch.matchedSkills().contains("Git"));

        assertFalse(weakMatch.matchedSkills().contains("C"), "C should not match inside 'Communication'");
        assertFalse(weakMatch.matchedSkills().contains("R"), "R should not match because of unrelated words");

        assertTrue(weakMatch.missingSkills().contains("Java"));
        assertTrue(weakMatch.missingSkills().contains("Spring Boot"));
        assertTrue(weakMatch.missingSkills().contains("Git"));

        assertTrue(results.get(0).score() >= results.get(1).score(), "Results should be sorted best-first");
    }

    @Test
    void shortSkillBoundaryHandlingShouldNotMatchInsideWords() {
        List<String> requiredSkills = List.of("C", "R");
        Map<String, String> resumes = Map.of(
            "communication_only.txt", "Communication and writing skills are strong, with graphic design experience.",
            "r_only.txt", "The project includes graphics, programming, and design work."
        );

        List<ScreeningResult> results = screeningEngineService.rankResumes(
            "We are looking for developers with communication and technical skills.",
            resumes,
            requiredSkills
        );

        ScreeningResult communicationResult = results.stream()
            .filter(result -> result.name().equals("communication_only.txt"))
            .findFirst()
            .orElseThrow();

        ScreeningResult rResult = results.stream()
            .filter(result -> result.name().equals("r_only.txt"))
            .findFirst()
            .orElseThrow();

        assertFalse(communicationResult.matchedSkills().contains("C"));
        assertFalse(rResult.matchedSkills().contains("R"));
        assertTrue(communicationResult.missingSkills().contains("C"));
        assertTrue(rResult.missingSkills().contains("R"));
    }
}
