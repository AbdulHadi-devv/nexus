import React from "react";

// Helper function to clean text by removing markdown code fences
function cleanText(text) {
  if (!text) return "Not available";
  
  // Convert to string if needed
  let cleaned = String(text);
  
  // Remove markdown code fences (```) and backticks
  cleaned = cleaned
    .replace(/```/g, "")
    .replace(/`/g, "")
    .replace(/^\s*```[a-z]*\s*/gim, "")  // Remove opening fences with language
    .replace(/\s*```\s*$/gim, "")         // Remove closing fences
    .trim();
  
  return cleaned || "Not available";
}

function SolutionCard({ solution, index, onSelect }) {
  const features = Array.isArray(solution?.features)
    ? solution.features.map(f => cleanText(f))
    : [];

  const pros = Array.isArray(solution?.pros)
    ? solution.pros.map(p => cleanText(p))
    : [];

  const cons = Array.isArray(solution?.cons)
    ? solution.cons.map(c => cleanText(c))
    : [];

  return (
    <article className="solution-card">
      <div className="solution-card-top">
        <span className="solution-number">
          {String(index + 1).padStart(2, "0")}
        </span>

        <span className="difficulty-badge">
          {cleanText(solution?.difficulty) || "Not Available"}
        </span>
      </div>

      <h3>{cleanText(solution?.name) || "Untitled Solution"}</h3>

      <p className="solution-description">
        {cleanText(solution?.description) || "No description available."}
      </p>

      <div className="solution-section">
        <span className="card-label">KEY FEATURES</span>

        {features.length > 0 ? (
          <ul>
            {features.map((feature, featureIndex) => (
              <li key={featureIndex}>{feature}</li>
            ))}
          </ul>
        ) : (
          <p>No features available.</p>
        )}
      </div>

      <div className="solution-section pros-cons">
        <div>
          <span className="card-label">PROS</span>

          {pros.length > 0 ? (
            <ul>
              {pros.map((pro, proIndex) => (
                <li key={proIndex}>{pro}</li>
              ))}
            </ul>
          ) : (
            <p>No pros available.</p>
          )}
        </div>

        <div>
          <span className="card-label">CONS</span>

          {cons.length > 0 ? (
            <ul>
              {cons.map((con, conIndex) => (
                <li key={conIndex}>{con}</li>
              ))}
            </ul>
          ) : (
            <p>No cons available.</p>
          )}
        </div>
      </div>

      <button
        className="solution-button"
        onClick={() => onSelect(solution)}
      >
        Choose This Solution →
      </button>
    </article>
  );
}

export default SolutionCard;