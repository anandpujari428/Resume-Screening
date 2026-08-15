package com.example.resumescreening.model;

import java.util.List;

public record ScreeningResult(
    String name,
    double score,
    List<String> matchedSkills,
    List<String> missingSkills,
    double skillMatchPercent
) {
}
