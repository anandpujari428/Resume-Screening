package com.example.resumescreening.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.example.resumescreening.model.ScreeningResult;

@Service
public class ScreeningEngineService {

    public static final List<String> DEFAULT_SKILLS = List.of(
        "Java",
        "Python",
        "C",
        "C++",
        "R",
        "SQL",
        "Spring Boot",
        "Machine Learning",
        "Data Structures",
        "Git",
        "Communication",
        "HTML",
        "CSS",
        "JavaScript"
    );

    private static final Set<String> STOP_WORDS = new HashSet<>(List.of(
        "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
        "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but",
        "by", "can", "cannot", "could", "did", "do", "does", "doing", "down", "during", "each", "few",
        "for", "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself",
        "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just",
        "me", "more", "most", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only",
        "or", "other", "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should",
        "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then",
        "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", "up",
        "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why",
        "with", "you", "your", "yours", "yourself", "yourselves", "also", "experience", "working",
        "skills", "strong", "ideal", "candidate", "required", "using", "work", "team", "role",
        "position", "looking", "developer", "develop", "responsibilities"
    ));

    public List<ScreeningResult> rankResumes(
        String jobDescription,
        Map<String, String> resumes,
        List<String> requiredSkills
    ) {
        if (jobDescription == null || jobDescription.isBlank()) {
            throw new IllegalArgumentException("Job description is required.");
        }
        if (resumes == null || resumes.isEmpty()) {
            throw new IllegalArgumentException("At least one resume must be provided.");
        }

        List<String> selectedSkills = normalizeSkillList(requiredSkills);
        if (selectedSkills.isEmpty()) {
            selectedSkills = new ArrayList<>(DEFAULT_SKILLS);
        }

        Map<String, String> processedResumes = new LinkedHashMap<>();
        for (Map.Entry<String, String> entry : resumes.entrySet()) {
            if (entry.getKey() == null || entry.getKey().isBlank()) {
                continue;
            }
            if (entry.getValue() == null || entry.getValue().isBlank()) {
                continue;
            }
            processedResumes.put(entry.getKey(), preprocessText(entry.getValue()));
        }

        if (processedResumes.isEmpty()) {
            throw new IllegalArgumentException("No valid resume content was found in the uploaded files.");
        }

        String processedJobDescription = preprocessText(jobDescription);
        Map<String, Double> idfValues = computeIdf(processedJobDescription, processedResumes);
        Set<String> vocabulary = idfValues.keySet();

        Map<String, Map<String, Double>> vectors = new HashMap<>();
        vectors.put("job", buildTfIdfVector(processedJobDescription, vocabulary, idfValues));

        List<ScreeningResult> results = new ArrayList<>();
        for (Map.Entry<String, String> entry : processedResumes.entrySet()) {
            Map<String, Double> resumeVector = buildTfIdfVector(entry.getValue(), vocabulary, idfValues);
            double cosineSimilarity = calculateCosineSimilarity(vectors.get("job"), resumeVector);
            double score = cosineSimilarity * 100.0;
            double roundedScore = roundToTwoDecimals(score);

            SkillEvaluation evaluation = evaluateSkills(entry.getValue(), selectedSkills);
            results.add(new ScreeningResult(
                entry.getKey(),
                roundedScore,
                evaluation.matchedSkills(),
                evaluation.missingSkills(),
                evaluation.skillMatchPercent()
            ));
        }

        results.sort(Comparator.comparingDouble(ScreeningResult::score).reversed());
        return results;
    }

    public String preprocessText(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }

        String normalized = text.toLowerCase(Locale.ROOT);
        normalized = normalized.replaceAll("[0-9]", " ");
        normalized = normalized.replaceAll("[\\p{Punct}]", " ");
        normalized = normalized.replaceAll("\\s+", " ").trim();

        List<String> tokens = Arrays.stream(normalized.split(" "))
            .filter(token -> !token.isBlank())
            .filter(token -> !STOP_WORDS.contains(token))
            .toList();

        return String.join(" ", tokens);
    }

    private List<String> normalizeSkillList(List<String> requiredSkills) {
        if (requiredSkills == null || requiredSkills.isEmpty()) {
            return new ArrayList<>();
        }

        List<String> selectedSkills = new ArrayList<>();
        for (String skill : requiredSkills) {
            if (skill == null) {
                continue;
            }
            String cleaned = skill.trim();
            if (!cleaned.isEmpty()) {
                selectedSkills.add(cleaned);
            }
        }
        return selectedSkills;
    }

    private Map<String, Double> computeIdf(String jobDescription, Map<String, String> resumes) {
        Map<String, Integer> documentFrequency = new HashMap<>();
        List<String> allDocuments = new ArrayList<>();
        allDocuments.add(jobDescription);
        allDocuments.addAll(resumes.values());

        Set<String> vocabulary = new HashSet<>();
        for (String document : allDocuments) {
            Set<String> terms = new HashSet<>(tokenize(document));
            vocabulary.addAll(terms);
            for (String term : terms) {
                documentFrequency.merge(term, 1, Integer::sum);
            }
        }

        int totalDocuments = allDocuments.size();
        Map<String, Double> idfMap = new HashMap<>();
        for (String term : vocabulary) {
            int df = documentFrequency.getOrDefault(term, 0);
            double idf = Math.log((totalDocuments + 1.0) / (df + 1.0)) + 1.0;
            idfMap.put(term, idf);
        }
        return idfMap;
    }

    private Map<String, Double> buildTfIdfVector(String document, Set<String> vocabulary, Map<String, Double> idfValues) {
        Map<String, Double> vector = new HashMap<>();
        List<String> tokens = tokenize(document);
        if (tokens.isEmpty()) {
            for (String term : vocabulary) {
                vector.put(term, 0.0);
            }
            return vector;
        }

        Map<String, Integer> termCounts = new HashMap<>();
        for (String token : tokens) {
            termCounts.merge(token, 1, Integer::sum);
        }

        int totalTerms = tokens.size();
        for (String term : vocabulary) {
            double tf = termCounts.getOrDefault(term, 0) / (double) totalTerms;
            double idf = idfValues.getOrDefault(term, 0.0);
            vector.put(term, tf * idf);
        }
        return vector;
    }

    private double calculateCosineSimilarity(Map<String, Double> vectorA, Map<String, Double> vectorB) {
        double dotProduct = 0.0;
        double magnitudeA = 0.0;
        double magnitudeB = 0.0;

        Set<String> allTerms = new HashSet<>();
        allTerms.addAll(vectorA.keySet());
        allTerms.addAll(vectorB.keySet());

        for (String term : allTerms) {
            double valueA = vectorA.getOrDefault(term, 0.0);
            double valueB = vectorB.getOrDefault(term, 0.0);
            dotProduct += valueA * valueB;
            magnitudeA += valueA * valueA;
            magnitudeB += valueB * valueB;
        }

        if (magnitudeA == 0.0 || magnitudeB == 0.0) {
            return 0.0;
        }

        return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
    }

    private double roundToTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private SkillEvaluation evaluateSkills(String text, List<String> requiredSkills) {
        List<String> matchedSkills = new ArrayList<>();
        List<String> missingSkills = new ArrayList<>();

        for (String skill : requiredSkills) {
            if (matchesSkill(text, skill)) {
                matchedSkills.add(skill);
            } else {
                missingSkills.add(skill);
            }
        }

        double percentage = 100.0;
        if (!requiredSkills.isEmpty()) {
            percentage = (matchedSkills.size() * 100.0) / requiredSkills.size();
        }

        return new SkillEvaluation(matchedSkills, missingSkills, roundToTwoDecimals(percentage));
    }

    private boolean matchesSkill(String text, String skill) {
        if (text == null || skill == null || skill.isBlank()) {
            return false;
        }

        String normalizedText = text.toLowerCase(Locale.ROOT);
        String escapedSkill = Pattern.quote(skill.toLowerCase(Locale.ROOT));
        String regex = "(?i)(?<![A-Za-z0-9])" + escapedSkill + "(?![A-Za-z0-9])";
        Matcher matcher = Pattern.compile(regex).matcher(normalizedText);
        return matcher.find();
    }

    private List<String> tokenize(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        return Arrays.stream(text.split("\\s+"))
            .map(token -> token.trim())
            .filter(token -> !token.isEmpty())
            .toList();
    }

    private record SkillEvaluation(List<String> matchedSkills, List<String> missingSkills, double skillMatchPercent) {
    }
}
