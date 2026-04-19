import { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";

// 👇 IMPORTANT LINE
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const ResumeChecker = () => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const fileInputRef = useRef(null);

  const extractTextFromFile = async (file) => {
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join(" ");
        fullText += pageText + "\n";
      }
      return fullText;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error("File read failed"));
      reader.readAsText(file);
    });
  };

  const analyzeWithGroq = async (resumeText) => {
    const hasJD = jobDescription.trim().length > 0;

    const prompt = `You are an expert ATS (Applicant Tracking System) analyzer and career coach.

Analyze the following resume and provide a detailed ATS compatibility score and feedback.

${hasJD ? `Job Description to match against:\n${jobDescription}\n\n` : ""}

Resume Content:
${resumeText}

Respond ONLY in this exact JSON format with no extra text or markdown:
{
  "ats_score": <number 0-100>,
  "grade": "<A/B/C/D/F>",
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "keywords_found": ["<keyword1>", "<keyword2>", "<keyword3>"],
  "keywords_missing": ["<keyword1>", "<keyword2>", "<keyword3>"],
  "sections": {
    "contact_info": <score 0-100>,
    "work_experience": <score 0-100>,
    "education": <score 0-100>,
    "skills": <score 0-100>,
    "formatting": <score 0-100>
  },
  "quick_wins": ["<actionable tip 1>", "<actionable tip 2>", "<actionable tip 3>"]${
    hasJD
      ? `,
  "jd_match": {
    "match_score": <number 0-100>,
    "role_title": "<job title from JD>",
    "changes": [
      {
        "section": "<which resume section to change, e.g. Summary, Skills, Work Experience>",
        "current": "<what is currently written or missing in the resume>",
        "suggested": "<exactly what to write or add to match the JD>",
        "reason": "<why this change will help with this specific JD>"
      }
    ],
    "phrases_to_add": ["<exact phrase from JD to add>", "<phrase 2>", "<phrase 3>"],
    "skills_gap": ["<skill required in JD but missing from resume>", "<skill 2>", "<skill 3>"]
  }`
      : ""
  }
}`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      },
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Groq API error");
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    const clean = content.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  };

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;
    const allowed = [
      "text/plain",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (
      !allowed.includes(selectedFile.type) &&
      !selectedFile.name.endsWith(".txt")
    ) {
      setError("Please upload a .txt, .pdf, or .docx file.");
      return;
    }
    setFile(selectedFile);
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const text = await extractTextFromFile(file);
      if (!text || text.trim().length < 100) {
        throw new Error(
          "Resume content seems too short or unreadable. Please check your file.",
        );
      }
      const analysis = await analyzeWithGroq(text);
      setResult(analysis);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#60a5fa";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  };

  const getGradeBg = (grade) => {
    const map = {
      A: "#22c55e",
      B: "#60a5fa",
      C: "#f59e0b",
      D: "#f97316",
      F: "#ef4444",
    };
    return map[grade] || "#6b7280";
  };

  const card = {
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "1rem",
  };

  const CircularScore = ({ score }) => {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = getScoreColor(score);
    return (
      <div
        className="relative flex items-center justify-center"
        style={{ width: 140, height: 140 }}
      >
        <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="10"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color }}>
            {score}
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            ATS Score
          </span>
        </div>
      </div>
    );
  };

  const SectionBar = ({ label, score }) => (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1.5">
        <span
          style={{ color: "rgba(255,255,255,0.7)" }}
          className="font-medium"
        >
          {label}
        </span>
        <span className="font-bold" style={{ color: getScoreColor(score) }}>
          {score}%
        </span>
      </div>
      <div
        className="w-full rounded-full h-2"
        style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
      >
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: getScoreColor(score) }}
        />
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen py-10 px-4"
      style={{
        background:
          "linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 50%, #0a0f1e 100%)",
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full mb-4"
            style={{
              backgroundColor: "rgba(96,165,250,0.15)",
              color: "#60a5fa",
              border: "1px solid rgba(96,165,250,0.3)",
            }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            AI-Powered ATS Analyzer
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3">
            Resume ATS Score Checker
          </h1>
          <p
            className="text-lg max-w-xl mx-auto"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Upload your resume and get an instant ATS compatibility score with
            detailed feedback powered by Groq AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Upload Box */}
          <div
            style={{
              ...card,
              border: isDragging
                ? "2px dashed #60a5fa"
                : "2px dashed rgba(255,255,255,0.15)",
              backgroundColor: isDragging
                ? "rgba(96,165,250,0.08)"
                : "rgba(255,255,255,0.04)",
              cursor: "pointer",
              padding: "2rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileChange(e.dataTransfer.files[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files[0])}
            />
            <div
              className="w-16 h-16 flex items-center justify-center mb-4 rounded-2xl"
              style={{ backgroundColor: "rgba(96,165,250,0.15)" }}
            >
              <svg
                className="w-8 h-8"
                style={{ color: "#60a5fa" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            {file ? (
              <div className="text-center">
                <p className="font-semibold text-white">{file.name}</p>
                <p
                  className="text-sm mt-1"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <button
                  className="mt-3 text-xs hover:underline"
                  style={{ color: "#60a5fa" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setResult(null);
                  }}
                >
                  Change file
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="font-semibold text-white">
                  Drop your resume here
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  or click to browse
                </p>
                <p
                  className="text-xs mt-2"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                >
                  .txt, .pdf, .doc, .docx
                </p>
              </div>
            )}
          </div>

          {/* Job Description */}
          <div style={{ ...card, padding: "1.5rem" }}>
            <label className="block text-sm font-semibold text-white mb-2">
              Job Description{" "}
              <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>
                (optional but recommended)
              </span>
            </label>
            <textarea
              className="w-full h-40 text-sm resize-none focus:outline-none rounded-xl p-3"
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.85)",
                caretColor: "#60a5fa",
              }}
              placeholder="Paste the job description here to get a tailored ATS score and keyword match analysis..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Analyze Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleAnalyze}
            disabled={!file || loading}
            className="px-10 py-4 font-bold text-lg rounded-full transition-all flex items-center gap-3 text-white"
            style={{
              background:
                !file || loading
                  ? "rgba(255,255,255,0.1)"
                  : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              cursor: !file || loading ? "not-allowed" : "pointer",
              boxShadow:
                !file || loading ? "none" : "0 0 30px rgba(59,130,246,0.4)",
            }}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Analyzing Resume...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Analyze Resume
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            className="rounded-2xl p-5 mb-6 flex items-start gap-3"
            style={{
              backgroundColor: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
            }}
          >
            <svg
              className="w-5 h-5 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              style={{ color: "#ef4444" }}
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm font-medium" style={{ color: "#fca5a5" }}>
              {error}
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Score Overview */}
            <div style={{ ...card, padding: "2rem" }}>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <CircularScore score={result.ats_score} />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="text-white text-2xl font-extrabold w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: getGradeBg(result.grade) }}
                    >
                      {result.grade}
                    </span>
                    <div>
                      <p className="text-xl font-bold text-white">
                        {result.ats_score >= 80
                          ? "Excellent Resume!"
                          : result.ats_score >= 60
                            ? "Good, Needs Minor Fixes"
                            : result.ats_score >= 40
                              ? "Average, Needs Work"
                              : "Needs Major Improvement"}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        ATS Compatibility Grade
                      </p>
                    </div>
                  </div>
                  <p
                    style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}
                  >
                    {result.summary}
                  </p>
                </div>
              </div>
            </div>

            {/* ✅ NEW: JD Match Section */}
            {result.jd_match && (
              <div
                style={{
                  ...card,
                  padding: "1.5rem",
                  borderColor: "rgba(167,139,250,0.3)",
                  backgroundColor: "rgba(167,139,250,0.05)",
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <h3
                    className="text-lg font-bold flex items-center gap-2"
                    style={{ color: "#a78bfa" }}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z"
                        clipRule="evenodd"
                      />
                    </svg>
                    JD Match Analysis
                    {result.jd_match.role_title && (
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full ml-1"
                        style={{
                          backgroundColor: "rgba(167,139,250,0.15)",
                          color: "#c4b5fd",
                          border: "1px solid rgba(167,139,250,0.3)",
                        }}
                      >
                        {result.jd_match.role_title}
                      </span>
                    )}
                  </h3>
                  {/* Match Score Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-medium"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      Match
                    </span>
                    <span
                      className="text-lg font-extrabold px-3 py-1 rounded-lg"
                      style={{
                        backgroundColor: "rgba(167,139,250,0.15)",
                        color: getScoreColor(result.jd_match.match_score),
                        border: "1px solid rgba(167,139,250,0.2)",
                      }}
                    >
                      {result.jd_match.match_score}%
                    </span>
                  </div>
                </div>

                {/* Match Score Bar */}
                <div className="mb-6">
                  <div
                    className="w-full rounded-full h-2"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                  >
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${result.jd_match.match_score}%`,
                        backgroundColor: getScoreColor(
                          result.jd_match.match_score,
                        ),
                      }}
                    />
                  </div>
                </div>

                {/* Specific Changes */}
                {result.jd_match.changes &&
                  result.jd_match.changes.length > 0 && (
                    <div className="mb-6">
                      <p
                        className="text-sm font-bold mb-3"
                        style={{ color: "#c4b5fd" }}
                      >
                        ✏️ Specific Changes to Make
                      </p>
                      <div className="space-y-3">
                        {result.jd_match.changes.map((change, i) => (
                          <div
                            key={i}
                            className="rounded-xl p-4"
                            style={{
                              backgroundColor: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(167,139,250,0.15)",
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: "rgba(167,139,250,0.2)",
                                  color: "#a78bfa",
                                }}
                              >
                                {change.section}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                              <div
                                className="rounded-lg p-3"
                                style={{
                                  backgroundColor: "rgba(239,68,68,0.08)",
                                  border: "1px solid rgba(239,68,68,0.2)",
                                }}
                              >
                                <p
                                  className="text-xs font-semibold mb-1"
                                  style={{ color: "#f87171" }}
                                >
                                  ❌ Current
                                </p>
                                <p
                                  className="text-xs"
                                  style={{ color: "rgba(255,255,255,0.6)" }}
                                >
                                  {change.current}
                                </p>
                              </div>
                              <div
                                className="rounded-lg p-3"
                                style={{
                                  backgroundColor: "rgba(34,197,94,0.08)",
                                  border: "1px solid rgba(34,197,94,0.2)",
                                }}
                              >
                                <p
                                  className="text-xs font-semibold mb-1"
                                  style={{ color: "#4ade80" }}
                                >
                                  ✅ Suggested
                                </p>
                                <p
                                  className="text-xs"
                                  style={{ color: "rgba(255,255,255,0.6)" }}
                                >
                                  {change.suggested}
                                </p>
                              </div>
                            </div>
                            <p
                              className="text-xs italic"
                              style={{ color: "rgba(196,181,253,0.6)" }}
                            >
                              💡 {change.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Phrases to Add & Skills Gap */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.jd_match.phrases_to_add &&
                    result.jd_match.phrases_to_add.length > 0 && (
                      <div>
                        <p
                          className="text-xs font-bold mb-2"
                          style={{ color: "#c4b5fd" }}
                        >
                          💬 Phrases to Add
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {result.jd_match.phrases_to_add.map((phrase, i) => (
                            <span
                              key={i}
                              className="text-xs font-medium px-3 py-1 rounded-full"
                              style={{
                                backgroundColor: "rgba(167,139,250,0.12)",
                                color: "#c4b5fd",
                                border: "1px solid rgba(167,139,250,0.25)",
                              }}
                            >
                              {phrase}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {result.jd_match.skills_gap &&
                    result.jd_match.skills_gap.length > 0 && (
                      <div>
                        <p
                          className="text-xs font-bold mb-2"
                          style={{ color: "#f87171" }}
                        >
                          🚨 Skills Gap
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {result.jd_match.skills_gap.map((skill, i) => (
                            <span
                              key={i}
                              className="text-xs font-medium px-3 py-1 rounded-full"
                              style={{
                                backgroundColor: "rgba(239,68,68,0.1)",
                                color: "#f87171",
                                border: "1px solid rgba(239,68,68,0.25)",
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Section Scores */}
            <div style={{ ...card, padding: "1.5rem" }}>
              <h3 className="text-lg font-bold text-white mb-5">
                Section Breakdown
              </h3>
              <SectionBar
                label="Contact Information"
                score={result.sections.contact_info}
              />
              <SectionBar
                label="Work Experience"
                score={result.sections.work_experience}
              />
              <SectionBar label="Education" score={result.sections.education} />
              <SectionBar label="Skills" score={result.sections.skills} />
              <SectionBar
                label="Formatting"
                score={result.sections.formatting}
              />
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                style={{
                  ...card,
                  padding: "1.5rem",
                  borderColor: "rgba(34,197,94,0.2)",
                  backgroundColor: "rgba(34,197,94,0.05)",
                }}
              >
                <h3
                  className="text-base font-bold mb-4 flex items-center gap-2"
                  style={{ color: "#4ade80" }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {result.strengths.map((s, i) => (
                    <li
                      key={i}
                      className="text-sm flex items-start gap-2"
                      style={{ color: "rgba(134,239,172,0.9)" }}
                    >
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: "#4ade80" }}
                      />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div
                style={{
                  ...card,
                  padding: "1.5rem",
                  borderColor: "rgba(251,191,36,0.2)",
                  backgroundColor: "rgba(251,191,36,0.05)",
                }}
              >
                <h3
                  className="text-base font-bold mb-4 flex items-center gap-2"
                  style={{ color: "#fbbf24" }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Improvements
                </h3>
                <ul className="space-y-2">
                  {result.improvements.map((s, i) => (
                    <li
                      key={i}
                      className="text-sm flex items-start gap-2"
                      style={{ color: "rgba(253,230,138,0.9)" }}
                    >
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: "#fbbf24" }}
                      />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Keywords */}
            <div style={{ ...card, padding: "1.5rem" }}>
              <h3 className="text-lg font-bold text-white mb-4">
                Keyword Analysis
              </h3>
              <div className="mb-5">
                <p
                  className="text-sm font-semibold mb-2"
                  style={{ color: "#4ade80" }}
                >
                  ✅ Found in Resume
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.keywords_found.map((kw, i) => (
                    <span
                      key={i}
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: "rgba(34,197,94,0.15)",
                        color: "#4ade80",
                        border: "1px solid rgba(34,197,94,0.3)",
                      }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p
                  className="text-sm font-semibold mb-2"
                  style={{ color: "#f87171" }}
                >
                  ❌ Missing Keywords
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.keywords_missing.map((kw, i) => (
                    <span
                      key={i}
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: "rgba(239,68,68,0.1)",
                        color: "#f87171",
                        border: "1px solid rgba(239,68,68,0.3)",
                      }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Wins */}
            <div
              style={{
                ...card,
                padding: "1.5rem",
                borderColor: "rgba(96,165,250,0.2)",
                backgroundColor: "rgba(96,165,250,0.05)",
              }}
            >
              <h3
                className="text-lg font-bold mb-4 flex items-center gap-2"
                style={{ color: "#60a5fa" }}
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                </svg>
                Quick Wins — Do These First
              </h3>
              <ol className="space-y-3">
                {result.quick_wins.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#3b82f6" }}
                    >
                      {i + 1}
                    </span>
                    <p
                      className="text-sm"
                      style={{ color: "rgba(147,197,253,0.9)" }}
                    >
                      {tip}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeChecker;
