# Resume Screening System

A production-quality Java final-year project for automated resume screening using Spring Boot, Maven, Thymeleaf, Apache PDFBox, Apache POI, and a custom TF-IDF based ranking engine.

## Project Description

The Resume Screening System helps recruiters or academic evaluators compare candidate resumes against a job description. It extracts text from uploaded resumes, preprocesses the content, ranks resumes using TF-IDF and cosine similarity, and evaluates required skill coverage.

This project is designed to be easy to understand and demonstrate in a college viva, while still being practical enough to run as a full web application.

## Features

- Upload job description as plain text or file
- Upload multiple resume files in PDF, DOCX, or TXT format
- Extract text using PDFBox and Apache POI
- Clean and normalize text using preprocessing and stopword removal
- Compute TF-IDF vectors manually
- Rank resumes using cosine similarity
- Evaluate matched and missing skills with safe regex boundaries
- Display ranked results in a Thymeleaf table
- Visualize resume scores with Chart.js
- Complete JUnit 5 test coverage for the ranking pipeline

## Technology Stack

- Java 17
- Spring Boot 3.x
- Maven
- Spring Web
- Thymeleaf
- Apache PDFBox
- Apache POI (XWPFDocument)
- JUnit 5
- Chart.js via CDN

## Project Structure

```text
resume-screening-system/
├── pom.xml
├── README.md
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/resumescreening/
│   │   │       ├── ResumeScreeningApplication.java
│   │   │       ├── controller/
│   │   │       │   └── ScreeningController.java
│   │   │       ├── model/
│   │   │       │   └── ScreeningResult.java
│   │   │       └── service/
│   │   │           ├── ResumeParserService.java
│   │   │           └── ScreeningEngineService.java
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── templates/
│   │       │   ├── index.html
│   │       │   └── results.html
│   │       └── sample-data/
│   │           ├── job_description.txt
│   │           ├── resume_strong_match.txt
│   │           └── resume_weak_match.txt
│   └── test/
│       └── java/
│           └── com/example/resumescreening/service/
│               └── ScreeningEngineServiceTest.java
└── target/
```

## Requirements

- Java 17 or newer
- Maven 3.8+
- Internet connection for Maven dependency download

## Installation

1. Clone or extract the project.
2. Open the folder in IntelliJ IDEA, Eclipse, or VS Code.
3. Ensure Java 17 is installed and configured.
4. Run Maven commands from the project root.

## How to Run

### Run tests

```bash
mvn clean test
```

### Start the application

```bash
mvn spring-boot:run
```

### Open in browser

```text
http://localhost:8080
```

## How the System Works

### Resume Parsing

The project accepts PDF, DOCX, and TXT resumes. The `ResumeParserService` checks the uploaded file extension and calls the proper extraction logic.

- PDF: Extracted with Apache PDFBox using `PDFTextStripper`
- DOCX: Extracted with Apache POI `XWPFDocument`
- TXT: Read directly using UTF-8

Unsupported extensions trigger a clear `IllegalArgumentException`.

### PDFBox

PDFBox is used to read and interpret PDF documents. It allows the application to extract raw text from resume files without manual copy-paste.

### Apache POI

Apache POI is used for DOCX files. The application uses `XWPFDocument` and reads paragraph text from Word resumes.

### Text Preprocessing

Before comparing resumes, the text is normalized to improve matching quality.

The preprocessing includes:

- Lowercase conversion
- Punctuation removal
- Number removal
- Whitespace normalization
- Word tokenization
- Stopword removal

Example:

```text
"Java Developer with Spring Boot experience!"
```

becomes approximately:

```text
java developer spring boot experience
```

### Stopwords

Stopwords are very common words such as "the", "is", "and", "of" that add little value to similarity scoring. Removing them helps the model focus on meaningful terms.

### TF-IDF

TF-IDF is a statistical weighting method used to measure the importance of words in a document relative to a collection.

TF is:

```text
TF(term) = term frequency / total number of terms
```

IDF is:

```text
IDF(term) = log((N + 1) / (DF + 1)) + 1
```

where:

- N = total number of documents
- DF = document frequency of the term

Then:

```text
TF-IDF = TF * IDF
```

The system creates a TF-IDF vector for the job description and each resume using the same vocabulary and IDF values.

### Cosine Similarity

Cosine similarity measures how close two vectors are in direction.

```text
cosine(A, B) = (A dot B) / (||A|| * ||B||)
```

The similarity is converted into a percentage score between 0 and 100.

```text
score = cosineSimilarity * 100
```

### Skill Extraction

The app supports a default skill list and a custom skill list entered through the UI.

Example skills:

- Java
- Python
- C
- C++
- R
- SQL
- Spring Boot
- Machine Learning
- Data Structures
- Git
- Communication
- HTML
- CSS
- JavaScript

Skills are matched with regex boundaries to avoid false positives, especially for short skills like "C" and "R".

### Regex Word Boundaries

The application uses boundary-safe matching to prevent false detection such as:

- "Communication" matching "C"
- "Programming" or "Graphic" triggering "R"

The pattern is designed so that skill detection only occurs when the skill appears as a standalone term.

### Ranking

The ranking process does the following:

1. Preprocess job description and resumes
2. Build TF-IDF vectors
3. Compute cosine similarity between job description and each resume
4. Evaluate required skills
5. Sort the results from highest score to lowest score
6. Send ranked results to the Thymeleaf UI

## Architecture Diagram

```text
+-------------------+       +-----------------------+
| User / Browser    | ----> | Spring Boot App       |
| (UI: index.html)  |       | ScreeningController   |
+-------------------+       +-----------+-----------+
                                           |
                                           v
                               +-----------------------+
                               | ResumeParserService    |
                               | - PDFBox              |
                               | - POI                 |
                               +-----------+-----------+
                                           |
                                           v
                               +-----------------------+
                               | ScreeningEngineService|
                               | - Preprocessing       |
                               | - TF-IDF              |
                               | - Cosine Similarity   |
                               | - Skill Matching      |
                               +-----------+-----------+
                                           |
                                           v
                              +------------------------+
                              | Thymeleaf Results Page |
                              +------------------------+
```

## Viva Questions / Explanation

### 1. Why TF-IDF?

TF-IDF helps distinguish between common and important terms. A word that appears often in a resume but rarely in the overall collection gets a higher weight, which makes ranking more meaningful.

### 2. Why cosine similarity?

Cosine similarity compares the angle between two vectors instead of their absolute length. It is effective for document similarity because it captures relative similarity between the job description and resume content.

### 3. What is preprocessing?

Preprocessing is the process of cleaning and standardizing text before analysis. It includes lowercasing, removing punctuation, removing numbers, and stopword filtering.

### 4. What are stopwords?

Stopwords are common words that do not carry much semantic meaning. They are removed to reduce noise and improve the quality of the similarity score.

### 5. Why regex boundaries for C and R?

Short skill names can accidentally match inside unrelated words, such as "Communication" containing "C" or "graphic" containing "R". Regex boundaries ensure the match occurs only when a skill appears as a full word or valid token.

### 6. How is the final score calculated?

The final score is based on cosine similarity between the job description vector and resume vector. Skill match percentage is also considered in the ranking output, and the resulting score is presented as a percentage between 0 and 100.

### 7. What are the limitations?

The system is simplified and does not include advanced semantic understanding. It may not fully capture context, deep domain meaning, or nuanced experience. Future improvements can include embeddings, NER, and weighted scoring.

## Future Enhancement Ideas

1. Named Entity Recognition (NER)
   - Apache OpenNLP
   - Stanford NLP
   - Extract company names, job titles, dates, skills, and organizations

2. Word Embeddings
   - Word2Vec
   - GloVe
   - Transformer embeddings
   - Semantic similarity for deeper matching

3. Weighted Composite Scoring
   - Final Score = 60% Text Similarity + 30% Skill Match + 10% Experience/Education Match

4. Database Persistence
   - MySQL or PostgreSQL
   - Spring Data JPA
   - Store jobs, resumes, candidates, and scores

5. REST API
   - Create endpoints for automatic screening from external systems

6. Spring Security
   - Authentication and role-based access to recruiter/admin panels

7. Explainable AI / Scoring
   - Show why a candidate scored highly or lowly
   - Highlight matched and unmatched keywords

## Notes

This project is meant to be educational, demonstrative, and practical. It is suitable for a final-year computer science or information technology project and can be extended into a real recruitment platform.
