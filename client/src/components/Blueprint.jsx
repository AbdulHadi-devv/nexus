function Blueprint({ blueprint, loading }) {
  console.log("Blueprint component received:", blueprint);

  if (loading) {
    return (
      <section className="blueprint-section">
        <div className="section-heading">
          <span className="step-label">04</span>
          <h2>MVP Blueprint</h2>
          <p>
            Nexus is turning your selected solution into
            an actionable product plan.
          </p>
        </div>

        <div className="loading-card">
          <div className="loading-spinner"></div>
          <strong>Building your MVP blueprint</strong>
          <p>
            Nexus is organizing the features, pages,
            database, technology and development plan.
          </p>
        </div>
      </section>
    );
  }

  if (!blueprint) {
    return (
      <section className="blueprint-section">
        <div className="section-heading">
          <span className="step-label">04</span>
          <h2>MVP Blueprint</h2>
          <p>No blueprint data available. Please generate a blueprint first.</p>
        </div>
      </section>
    );
  }

  // Extract data with fallbacks
  const features = Array.isArray(blueprint.features) ? blueprint.features : [];
  const pages = Array.isArray(blueprint.pages) ? blueprint.pages : [];
  const database = Array.isArray(blueprint.database) ? blueprint.database : [];
  const tasks = Array.isArray(blueprint.tasks) ? blueprint.tasks : [];
  const buildOrder = Array.isArray(blueprint.buildOrder) ? blueprint.buildOrder : [];
  
  const techStack = blueprint.techStack || {};

  return (
    <section className="blueprint-section">
      <div className="section-heading">
        <span className="step-label">04</span>
        <h2>MVP Blueprint</h2>
        <p>
          Your selected solution, turned into an actionable
          product plan.
        </p>
      </div>

      <div className="blueprint-hero">
        <div>
          <span className="card-label">PRODUCT</span>
          <h3>{blueprint.title || 'Untitled Product'}</h3>
          <p>{blueprint.summary || 'No description available.'}</p>
        </div>
        <div className="blueprint-status">MVP READY</div>
      </div>

      <div className="blueprint-block">
        <div className="blueprint-block-header">
          <span className="card-label">01</span>
          <h3>Core Features</h3>
        </div>
        <div className="feature-grid">
          {features.length > 0 ? (
            features.map((feature, index) => (
              <div className="feature-item" key={index}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{typeof feature === 'string' ? feature : feature.name || feature.description || 'Feature'}</p>
              </div>
            ))
          ) : (
            <p>No core features available.</p>
          )}
        </div>
      </div>

      <div className="blueprint-block">
        <div className="blueprint-block-header">
          <span className="card-label">02</span>
          <h3>Pages</h3>
        </div>
        <div className="pages-list">
          {pages.length > 0 ? (
            pages.map((page, index) => (
              <div className="page-item" key={index}>
                <span className="page-number">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <strong>{page.name || 'Page'}</strong>
                  <p>{page.description || page.purpose || 'No purpose described'}</p>
                </div>
              </div>
            ))
          ) : (
            <p>No pages described.</p>
          )}
        </div>
      </div>

      <div className="blueprint-two-column">
        <div className="blueprint-block">
          <div className="blueprint-block-header">
            <span className="card-label">03</span>
            <h3>Tech Stack</h3>
          </div>
          <div className="tech-stack">
            <div>
              <span>FRONTEND</span>
              <strong>{techStack.frontend || 'Not specified'}</strong>
            </div>
            <div>
              <span>BACKEND</span>
              <strong>{techStack.backend || 'Not specified'}</strong>
            </div>
            <div>
              <span>DATABASE</span>
              <strong>{techStack.database || 'Not specified'}</strong>
            </div>
            {techStack.ai && (
              <div>
                <span>AI</span>
                <strong>{techStack.ai}</strong>
              </div>
            )}
          </div>
        </div>

        <div className="blueprint-block">
          <div className="blueprint-block-header">
            <span className="card-label">04</span>
            <h3>Database</h3>
          </div>
          <div className="database-list">
            {database.length > 0 ? (
              database.map((item, index) => (
                <div key={index}>
                  <strong>{item.name || 'Table'}</strong>
                  <p>{item.description || item.purpose || 'No description'}</p>
                </div>
              ))
            ) : (
              <p>No database tables described.</p>
            )}
          </div>
        </div>
      </div>

      <div className="blueprint-block">
        <div className="blueprint-block-header">
          <span className="card-label">05</span>
          <h3>Development Tasks</h3>
        </div>
        <div className="task-list">
          {tasks.length > 0 ? (
            tasks.map((task, index) => (
              <div className="task-item" key={index}>
                <span className="task-number">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{task}</span>
              </div>
            ))
          ) : (
            <p>No development tasks listed.</p>
          )}
        </div>
      </div>

      <div className="blueprint-block build-order">
        <div className="blueprint-block-header">
          <span className="card-label">06</span>
          <h3>Recommended Build Order</h3>
        </div>
        <ol>
          {buildOrder.length > 0 ? (
            buildOrder.map((step, index) => (
              <li key={index}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                {step}
              </li>
            ))
          ) : (
            <li>No build order available.</li>
          )}
        </ol>
      </div>
    </section>
  );
}

export default Blueprint;