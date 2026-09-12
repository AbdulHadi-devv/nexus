import React from 'react';
import SolutionCard from './SolutionCard';

function cleanText(text) {
  if (!text) return '';
  return String(text)
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/`/g, '')
    .replace(/^\s*```[a-z]*\s*/gim, '')
    .replace(/\s*```\s*$/gim, '')
    .trim();
}

function SolutionList({ solutions, onSelect }) {
  const safeSolutions = Array.isArray(solutions) ? solutions : [];

  if (safeSolutions.length === 0) {
    return (
      <section className="solutions-section">
        <div className="section-heading">
          <span className="step-label">03</span>
          <h2>Solutions</h2>
          <p>No solutions are available right now.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="solutions-section">
      <div className="section-heading">
        <div>
          <span className="step-label">03</span>
          <h2>Possible Solutions</h2>
          <p>
            Nexus generated {safeSolutions.length} practical approaches to
            solving this problem.
          </p>
        </div>
      </div>

      <div className="solutions-grid">
        {safeSolutions.map((solution, index) => (
          <SolutionCard
            key={index}
            solution={solution}
            index={index}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}

export default SolutionList;