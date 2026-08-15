/**
 * Resume Screening System - Client-side NLP Engine & UI Controller
 * Features:
 * - PDF parsing via PDF.js
 * - DOCX parsing via Mammoth.js
 * - TXT parsing
 * - TF-IDF Vectorization & Cosine Similarity Ranking (matching Spring Boot service)
 * - Regex Word-Boundary Safe Skill Gap Analysis
 * - Dynamic Chart.js Visualizations & Leaderboard
 * - Sample Data Preloading & Export Utilities
 */

// Initialize PDF.js worker
if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const DEFAULT_SKILLS = [
  'Java',
  'Python',
  'C',
  'C++',
  'R',
  'SQL',
  'Spring Boot',
  'Machine Learning',
  'Data Structures',
  'Git',
  'Communication',
  'HTML',
  'CSS',
  'JavaScript',
  'REST API',
  'AWS',
  'Docker',
  'Kubernetes'
];

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but',
  'by', 'can', 'cannot', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few',
  'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself',
  'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just',
  'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only',
  'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should',
  'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then',
  'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
  'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why',
  'with', 'you', 'your', 'yours', 'yourself', 'yourselves', 'also', 'experience', 'working',
  'skills', 'strong', 'ideal', 'candidate', 'required', 'using', 'work', 'team', 'role',
  'position', 'looking', 'developer', 'develop', 'responsibilities'
]);

const SAMPLE_PRESETS = {
  java: `We are looking for a Senior Java Developer with strong backend experience in Spring Boot, REST APIs, SQL, and microservices architecture. The ideal candidate will have hands-on experience with Java, Python, Git, Data Structures, and cloud deployments on AWS. Experience in building scalable enterprise applications, database query optimization, and collaborative team communication is required.`,
  python: `Looking for a Python / Machine Learning Engineer with solid knowledge of data structures, algorithms, SQL, model training, and REST APIs. Experience with Python, Machine Learning, Git, and cloud infrastructure (AWS/Docker) is essential. Strong communication skills and experience with big data processing is a plus.`,
  frontend: `Seeking a Frontend / Full Stack Developer proficient in HTML, CSS, JavaScript, React, REST APIs, Git, and responsive UI design. Knowledge of backend integration with Node.js or Java, database design with SQL, and modern CSS frameworks is required.`,
  devops: `We are hiring a DevOps / Cloud Engineer with extensive experience in AWS, Docker, Kubernetes, Git, Linux, and CI/CD pipelines. Proficiency in Python scripting, SQL, and secure cloud infrastructure automation is required.`
};

const SAMPLE_RESUMES = [
  {
    name: 'Alex_Rivera_Java_Lead.txt',
    text: `Alex Rivera - Senior Java Engineer
Summary:
Seasoned Java Developer with 4+ years of hands-on expertise building enterprise backend microservices with Spring Boot, SQL, PostgreSQL, and REST APIs. Deep knowledge of Data Structures, algorithms, software design patterns, and Git workflows.

Technical Skills:
Java, Spring Boot, SQL, PostgreSQL, Git, Python, Data Structures, REST APIs, AWS, Docker, Linux

Projects:
- Architected and delivered high-performance Spring Boot payment gateway handling 15,000+ daily transactions with SQL query optimization.
- Engineered automated data ingestion pipeline using Python and REST APIs.
- Mentored junior engineers, managed code reviews with Git, and configured AWS cloud deployments.

Communication:
Strong leadership and communication skills with track record of presenting architecture designs to stakeholders.`
  },
  {
    name: 'Devon_Smith_Data_Science.txt',
    text: `Devon Smith - Data Scientist & Python Developer
Summary:
Data scientist with 3 years of experience in Machine Learning, predictive modeling, Python development, SQL analytics, and data pipeline automation.

Technical Skills:
Python, Machine Learning, SQL, Data Structures, Git, REST APIs, Pandas, Scikit-Learn, Docker

Projects:
- Built customer churn prediction model using Machine Learning algorithms with 89% accuracy.
- Created automated reporting microservices with Python and SQL database integration.
- Collaborated across engineering teams using Git for version control.

Communication:
Clear written communication and experience creating technical documentation and data visualizations.`
  },
  {
    name: 'Taylor_Chen_UI_Designer.txt',
    text: `Taylor Chen - Graphic Designer & Creative Content Specialist
Summary:
Creative visual designer and frontend specialist with experience in HTML, CSS, UI/UX design, Adobe Creative Suite, and content writing.

Technical Skills:
HTML, CSS, JavaScript, Adobe Photoshop, Illustrator, Figma, Social Media Marketing, Graphic Design, Content Strategy

Projects:
- Designed responsive promotional landing pages using HTML and CSS.
- Produced digital brand assets, corporate brochures, and social media campaigns.
- Developed interactive web graphics and content writing samples for product launches.

Communication:
Excellent interpersonal communication, visual storytelling, and collaborative design abilities.`
  }
];

// State
let selectedUploadedFiles = [];
let sampleFilesLoaded = [];
let lastScreeningResults = [];
let chartInstance = null;

// DOM Elements
const jobTextArea = document.getElementById('job-text');
const jobFileInput = document.getElementById('job-file');
const jobFileNameBadge = document.getElementById('job-file-name');
const customSkillsInput = document.getElementById('custom-skills');
const resumeFilesInput = document.getElementById('resume-files');
const resumeDropzone = document.getElementById('resume-dropzone');
const fileListContainer = document.getElementById('file-list');
const screenBtn = document.getElementById('screen-btn');
const clearBtn = document.getElementById('clear-btn');
const loadSampleBtn = document.getElementById('load-sample-btn');
const jdPresetSelect = document.getElementById('jd-preset-select');
const statusBanner = document.getElementById('status-banner');
const statusIcon = document.getElementById('status-icon');
const statusText = document.getElementById('status-text');
const resultsSection = document.getElementById('results-section');
const resultsBody = document.getElementById('results-body');
const rankingChartCanvas = document.getElementById('ranking-chart');
const exportCsvBtn = document.getElementById('export-csv-btn');
const exportJsonBtn = document.getElementById('export-json-btn');

// Metric Elements
const topCandidateNameEl = document.getElementById('top-candidate-name');
const topCandidateScoreEl = document.getElementById('top-candidate-score');
const avgScoreEl = document.getElementById('avg-score');
const totalResumesCountEl = document.getElementById('total-resumes-count');

// Modal Elements
const previewModal = document.getElementById('preview-modal');
const modalCandidateName = document.getElementById('modal-candidate-name');
const modalResumeText = document.getElementById('modal-resume-text');
const modalCloseBtn = document.getElementById('modal-close-btn');

// ==================== Text Extraction Services ====================

/**
 * Extract text from a File object (.pdf, .docx, .txt)
 */
async function extractTextFromFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();

  if (extension === 'txt') {
    return await readTxtFile(file);
  } else if (extension === 'pdf') {
    return await readPdfFile(file);
  } else if (extension === 'docx') {
    return await readDocxFile(file);
  } else if (extension === 'doc') {
    throw new Error(`Legacy .doc format is not supported. Please convert "${file.name}" to .docx or .pdf.`);
  } else {
    throw new Error(`Unsupported file type: .${extension} for "${file.name}". Please upload .txt, .pdf, or .docx.`);
  }
}

function readTxtFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsText(file, 'UTF-8');
  });
}

async function readPdfFile(file) {
  if (!window.pdfjsLib) {
    throw new Error('PDF.js library is not loaded. Please check your internet connection.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageStrings = content.items.map((item) => item.str);
    fullText += pageStrings.join(' ') + '\n';
  }

  return fullText.trim();
}

async function readDocxFile(file) {
  if (!window.mammoth) {
    throw new Error('Mammoth.js DOCX library is not loaded. Please check your internet connection.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

// ==================== NLP & TF-IDF Ranking Engine ====================

/**
 * Preprocess raw text: lowercase, remove punctuation, digits, and stopwords
 */
function preprocessText(text) {
  if (!text || typeof text !== 'string') return '';

  let normalized = text.toLowerCase();
  // Strip digits
  normalized = normalized.replace(/[0-9]/g, ' ');
  // Strip punctuation but preserve plus for c++ or c#
  normalized = normalized.replace(/[!"#$%&'()*,\-./:;<=>?@[\\\]^_`{|}~]/g, ' ');
  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  const tokens = normalized
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t));

  return tokens.join(' ');
}

function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

/**
 * Compute Document Frequency and IDF for the corpus
 */
function computeIdf(jobDescriptionClean, resumesCleanMap) {
  const documentFrequency = new Map();
  const allDocuments = [jobDescriptionClean, ...Object.values(resumesCleanMap)];
  const vocabulary = new Set();

  for (const doc of allDocuments) {
    const docTerms = new Set(tokenize(doc));
    for (const term of docTerms) {
      vocabulary.add(term);
      documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
    }
  }

  const totalDocs = allDocuments.length;
  const idfMap = new Map();

  for (const term of vocabulary) {
    const df = documentFrequency.get(term) || 0;
    const idf = Math.log((totalDocs + 1.0) / (df + 1.0)) + 1.0;
    idfMap.set(term, idf);
  }

  return { idfMap, vocabulary };
}

/**
 * Build a TF-IDF vector for a document
 */
function buildTfIdfVector(documentClean, vocabulary, idfMap) {
  const tokens = tokenize(documentClean);
  const vector = new Map();

  if (tokens.length === 0) {
    for (const term of vocabulary) {
      vector.set(term, 0.0);
    }
    return vector;
  }

  const termCounts = new Map();
  for (const token of tokens) {
    termCounts.set(token, (termCounts.get(token) || 0) + 1);
  }

  const totalTerms = tokens.length;
  for (const term of vocabulary) {
    const count = termCounts.get(term) || 0;
    const tf = count / totalTerms;
    const idf = idfMap.get(term) || 0.0;
    vector.set(term, tf * idf);
  }

  return vector;
}

/**
 * Compute Cosine Similarity between two TF-IDF vectors
 */
function calculateCosineSimilarity(vectorA, vectorB) {
  let dotProduct = 0.0;
  let magnitudeA = 0.0;
  let magnitudeB = 0.0;

  const allTerms = new Set([...vectorA.keys(), ...vectorB.keys()]);

  for (const term of allTerms) {
    const valA = vectorA.get(term) || 0.0;
    const valB = vectorB.get(term) || 0.0;
    dotProduct += valA * valB;
    magnitudeA += valA * valA;
    magnitudeB += valB * valB;
  }

  if (magnitudeA === 0.0 || magnitudeB === 0.0) {
    return 0.0;
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

/**
 * Boundary-safe skill matching (prevents false matches like "Communication" matching "C")
 */
function matchesSkill(rawText, skill) {
  if (!rawText || !skill) return false;
  const normalizedText = rawText.toLowerCase();
  const cleanedSkill = skill.trim().toLowerCase();

  // Escape special regex characters except plus
  const escaped = cleanedSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Safe boundaries: not preceded/followed by alphanumeric char
  const regex = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i');
  return regex.test(normalizedText);
}

function evaluateSkills(rawText, skillList) {
  const matchedSkills = [];
  const missingSkills = [];

  for (const skill of skillList) {
    if (matchesSkill(rawText, skill)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  let skillMatchPercent = 100.0;
  if (skillList.length > 0) {
    skillMatchPercent = (matchedSkills.length * 100.0) / skillList.length;
  }

  return {
    matchedSkills,
    missingSkills,
    skillMatchPercent: Math.round(skillMatchPercent * 100) / 100
  };
}

/**
 * Full Pipeline: Rank Resumes against Job Description
 */
function rankResumesPipeline(jobDescriptionRaw, resumesRawMap, requiredSkills) {
  if (!jobDescriptionRaw || !jobDescriptionRaw.trim()) {
    throw new Error('Job description is required.');
  }

  const resumeKeys = Object.keys(resumesRawMap);
  if (resumeKeys.length === 0) {
    throw new Error('Please upload at least one valid resume.');
  }

  const selectedSkills = requiredSkills.length > 0 ? requiredSkills : DEFAULT_SKILLS;

  // Clean text
  const cleanJob = preprocessText(jobDescriptionRaw);
  const cleanResumes = {};

  for (const [name, rawContent] of Object.entries(resumesRawMap)) {
    if (rawContent && rawContent.trim()) {
      cleanResumes[name] = preprocessText(rawContent);
    }
  }

  if (Object.keys(cleanResumes).length === 0) {
    throw new Error('No readable text content found in uploaded resumes.');
  }

  // Compute IDF
  const { idfMap, vocabulary } = computeIdf(cleanJob, cleanResumes);

  // Build Vectors
  const jobVector = buildTfIdfVector(cleanJob, vocabulary, idfMap);

  const results = [];
  for (const [name, cleanContent] of Object.entries(cleanResumes)) {
    const resumeVector = buildTfIdfVector(cleanContent, vocabulary, idfMap);
    const cosine = calculateCosineSimilarity(jobVector, resumeVector);
    const score = Math.round(cosine * 100.0 * 100) / 100;

    const rawContent = resumesRawMap[name] || '';
    const skillEval = evaluateSkills(rawContent, selectedSkills);

    results.push({
      name,
      score,
      skillMatchPercent: skillEval.skillMatchPercent,
      matchedSkills: skillEval.matchedSkills,
      missingSkills: skillEval.missingSkills,
      rawText: rawContent
    });
  }

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);
  return results;
}

// ==================== UI & Event Handlers ====================

function showStatus(message, type = 'info') {
  statusBanner.style.display = 'flex';
  statusBanner.className = `status-banner ${type}`;
  statusIcon.textContent = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  statusText.textContent = message;

  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      if (statusBanner.style.display !== 'none') {
        statusBanner.style.display = 'none';
      }
    }, 6000);
  }
}

function hideStatus() {
  statusBanner.style.display = 'none';
}

function renderFileList() {
  fileListContainer.innerHTML = '';
  const allItems = [...sampleFilesLoaded, ...selectedUploadedFiles];

  if (allItems.length === 0) {
    fileListContainer.style.display = 'none';
    return;
  }

  fileListContainer.style.display = 'flex';
  allItems.forEach((fileItem, index) => {
    const div = document.createElement('div');
    div.className = 'file-item';

    const isSample = Boolean(fileItem.isSample);
    const sizeText = isSample ? 'Sample Data' : formatBytes(fileItem.size);

    div.innerHTML = `
      <div class="file-info">
        <span>📄</span>
        <span class="file-name" title="${fileItem.name}">${fileItem.name}</span>
        <span class="file-size">(${sizeText})</span>
      </div>
      <button type="button" class="file-remove-btn" data-index="${index}" title="Remove file">&times;</button>
    `;

    div.querySelector('.file-remove-btn').addEventListener('click', () => {
      if (isSample) {
        sampleFilesLoaded = sampleFilesLoaded.filter((s) => s.name !== fileItem.name);
      } else {
        selectedUploadedFiles = selectedUploadedFiles.filter((f) => f.name !== fileItem.name);
      }
      renderFileList();
    });

    fileListContainer.appendChild(div);
  });
}

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Handle Preset Select
jdPresetSelect.addEventListener('change', (e) => {
  const val = e.target.value;
  if (val && SAMPLE_PRESETS[val]) {
    jobTextArea.value = SAMPLE_PRESETS[val];
    showStatus(`Loaded job description for "${jdPresetSelect.options[jdPresetSelect.selectedIndex].text}".`, 'info');
  }
});

// Handle Skills Preset Click
document.querySelectorAll('.preset-tag').forEach((tag) => {
  tag.addEventListener('click', () => {
    const skill = tag.getAttribute('data-skill');
    let current = customSkillsInput.value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const existsIndex = current.findIndex((s) => s.toLowerCase() === skill.toLowerCase());
    if (existsIndex >= 0) {
      current.splice(existsIndex, 1);
      tag.classList.remove('active');
    } else {
      current.push(skill);
      tag.classList.add('active');
    }
    customSkillsInput.value = current.join(', ');
  });
});

// Handle Job File Upload
jobFileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    jobFileNameBadge.style.display = 'inline-block';
    jobFileNameBadge.textContent = `Attached: ${file.name} (${formatBytes(file.size)})`;
    try {
      showStatus(`Reading job description file: ${file.name}...`, 'info');
      const text = await extractTextFromFile(file);
      jobTextArea.value = text;
      showStatus(`Job description loaded from "${file.name}".`, 'success');
    } catch (err) {
      showStatus(err.message, 'error');
    }
  }
});

// Handle Resume File Uploads
resumeFilesInput.addEventListener('change', (e) => {
  const newFiles = Array.from(e.target.files);
  newFiles.forEach((newFile) => {
    if (!selectedUploadedFiles.some((f) => f.name === newFile.name)) {
      selectedUploadedFiles.push(newFile);
    }
  });
  renderFileList();
  e.target.value = '';
});

// Drag and drop support for resumes
['dragenter', 'dragover'].forEach((eventName) => {
  resumeDropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    resumeDropzone.classList.add('dragover');
  });
});

['dragleave', 'drop'].forEach((eventName) => {
  resumeDropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    resumeDropzone.classList.remove('dragover');
  });
});

resumeDropzone.addEventListener('drop', (e) => {
  const droppedFiles = Array.from(e.dataTransfer.files);
  droppedFiles.forEach((file) => {
    if (!selectedUploadedFiles.some((f) => f.name === file.name)) {
      selectedUploadedFiles.push(file);
    }
  });
  renderFileList();
});

// Load Sample Data Demo
loadSampleBtn.addEventListener('click', () => {
  jobTextArea.value = SAMPLE_PRESETS.java;
  jdPresetSelect.value = 'java';
  customSkillsInput.value = 'Java, Spring Boot, SQL, Python, Git, Machine Learning, Communication';

  // Mark tags active
  document.querySelectorAll('.preset-tag').forEach((tag) => {
    const skill = tag.getAttribute('data-skill');
    if (['Java', 'Spring Boot', 'SQL', 'Python', 'Git', 'Machine Learning'].includes(skill)) {
      tag.classList.add('active');
    } else {
      tag.classList.remove('active');
    }
  });

  sampleFilesLoaded = SAMPLE_RESUMES.map((r) => ({
    name: r.name,
    text: r.text,
    size: r.text.length,
    isSample: true
  }));

  selectedUploadedFiles = [];
  renderFileList();
  showStatus('Sample Demo data loaded! Click "Screen & Rank Resumes" below to run the ranking engine.', 'success');
});

// Clear All
clearBtn.addEventListener('click', () => {
  jobTextArea.value = '';
  jobFileInput.value = '';
  jobFileNameBadge.style.display = 'none';
  customSkillsInput.value = '';
  selectedUploadedFiles = [];
  sampleFilesLoaded = [];
  jdPresetSelect.value = '';
  document.querySelectorAll('.preset-tag').forEach((t) => t.classList.remove('active'));
  renderFileList();
  resultsSection.style.display = 'none';
  lastScreeningResults = [];
  hideStatus();
});

// ==================== Execute Screening ====================

screenBtn.addEventListener('click', async () => {
  try {
    hideStatus();
    const jobText = jobTextArea.value.trim();

    if (!jobText) {
      showStatus('Please enter a Job Description or upload a job description file.', 'error');
      jobTextArea.focus();
      return;
    }

    const allCandidateFiles = [...sampleFilesLoaded, ...selectedUploadedFiles];
    if (allCandidateFiles.length === 0) {
      showStatus('Please upload at least one resume or click "Load Sample Demo" to test.', 'error');
      return;
    }

    // Set UI loading state
    screenBtn.disabled = true;
    screenBtn.querySelector('.btn-spinner').style.display = 'inline-block';
    showStatus('Extracting resume texts and running NLP TF-IDF vectorization...', 'info');

    // Extract raw text for all resumes
    const resumesRawMap = {};

    for (const item of allCandidateFiles) {
      if (item.isSample) {
        resumesRawMap[item.name] = item.text;
      } else {
        const extracted = await extractTextFromFile(item);
        resumesRawMap[item.name] = extracted;
      }
    }

    // Parse custom skills
    const customSkills = customSkillsInput.value
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Run ranking pipeline
    const results = rankResumesPipeline(jobText, resumesRawMap, customSkills);
    lastScreeningResults = results;

    // Render results
    renderResults(results);
    showStatus(`Successfully screened and ranked ${results.length} candidate resumes!`, 'success');

    // Scroll smoothly to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    showStatus(err.message || 'An error occurred during screening.', 'error');
  } finally {
    screenBtn.disabled = false;
    screenBtn.querySelector('.btn-spinner').style.display = 'none';
  }
});

// ==================== Render Results ====================

function renderResults(results) {
  resultsSection.style.display = 'block';

  // Update Metrics
  if (results.length > 0) {
    const top = results[0];
    topCandidateNameEl.textContent = top.name;
    topCandidateScoreEl.textContent = `${top.score}%`;

    const avg = results.reduce((acc, r) => acc + r.score, 0) / results.length;
    avgScoreEl.textContent = `${Math.round(avg * 10) / 10}%`;
    totalResumesCountEl.textContent = results.length;
  }

  // Populate Table
  resultsBody.innerHTML = '';
  results.forEach((res, index) => {
    const tr = document.createElement('tr');

    const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-other';
    const scorePillClass = res.score >= 60 ? 'score-pill-high' : res.score >= 30 ? 'score-pill-mid' : 'score-pill-low';

    const matchedChips = res.matchedSkills.length
      ? res.matchedSkills.map((s) => `<span class="chip chip-success">${s}</span>`).join('')
      : '<span class="text-light">None</span>';

    const missingChips = res.missingSkills.length
      ? res.missingSkills.map((s) => `<span class="chip chip-missing">${s}</span>`).join('')
      : '<span class="text-light">None</span>';

    tr.innerHTML = `
      <td><span class="rank-badge ${rankClass}">${index + 1}</span></td>
      <td><strong>${escapeHtml(res.name)}</strong></td>
      <td><span class="score-pill ${scorePillClass}">${res.score}%</span></td>
      <td><strong>${res.skillMatchPercent}%</strong></td>
      <td><div class="chips-wrap">${matchedChips}</div></td>
      <td><div class="chips-wrap">${missingChips}</div></td>
      <td><button class="btn btn-outline btn-sm view-text-btn" data-index="${index}">👁️ Preview</button></td>
    `;

    tr.querySelector('.view-text-btn').addEventListener('click', () => {
      openPreviewModal(res.name, res.rawText);
    });

    resultsBody.appendChild(tr);
  });

  // Render Chart
  renderChart(results);
}

function renderChart(results) {
  if (chartInstance) {
    chartInstance.destroy();
  }

  const labels = results.map((r) => r.name);
  const tfidfScores = results.map((r) => r.score);
  const skillMatchScores = results.map((r) => r.skillMatchPercent);

  const ctx = rankingChartCanvas.getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'TF-IDF Similarity Score (%)',
          data: tfidfScores,
          backgroundColor: '#3b82f6',
          borderRadius: 8,
          borderSkipped: false
        },
        {
          label: 'Skill Match Coverage (%)',
          data: skillMatchScores,
          backgroundColor: '#10b981',
          borderRadius: 8,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: { family: 'Plus Jakarta Sans', weight: '600' }
          }
        },
        tooltip: {
          padding: 12,
          cornerRadius: 8
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (val) => val + '%'
          },
          grid: {
            color: '#e2e8f0'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

function openPreviewModal(name, rawText) {
  modalCandidateName.textContent = `Resume Preview: ${name}`;
  modalResumeText.textContent = rawText || 'No text extracted.';
  previewModal.style.display = 'flex';
}

modalCloseBtn.addEventListener('click', () => {
  previewModal.style.display = 'none';
});

previewModal.addEventListener('click', (e) => {
  if (e.target === previewModal) {
    previewModal.style.display = 'none';
  }
});

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, (tag) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

// ==================== CSV / JSON Exports ====================

exportCsvBtn.addEventListener('click', () => {
  if (!lastScreeningResults || lastScreeningResults.length === 0) return;

  const headers = ['Rank', 'Candidate File', 'TF-IDF Score (%)', 'Skill Match (%)', 'Matched Skills', 'Missing Skills'];
  const rows = lastScreeningResults.map((r, i) => [
    i + 1,
    `"${r.name.replace(/"/g, '""')}"`,
    r.score,
    r.skillMatchPercent,
    `"${r.matchedSkills.join(', ').replace(/"/g, '""')}"`,
    `"${r.missingSkills.join(', ').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  downloadBlob(csvContent, 'resume_screening_results.csv', 'text/csv;charset=utf-8;');
});

exportJsonBtn.addEventListener('click', () => {
  if (!lastScreeningResults || lastScreeningResults.length === 0) return;

  const exportData = lastScreeningResults.map((r, i) => ({
    rank: i + 1,
    candidate: r.name,
    score: r.score,
    skillMatchPercent: r.skillMatchPercent,
    matchedSkills: r.matchedSkills,
    missingSkills: r.missingSkills
  }));

  const jsonContent = JSON.stringify(exportData, null, 2);
  downloadBlob(jsonContent, 'resume_screening_results.json', 'application/json');
});

function downloadBlob(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
