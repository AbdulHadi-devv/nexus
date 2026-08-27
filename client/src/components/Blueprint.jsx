function Blueprint({ blueprint, loading }) {
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
    )
  }

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

          <h3>{blueprint.productName}</h3>

          <p>{blueprint.description}</p>
        </div>

        <div className="blueprint-status">
          MVP READY
        </div>

      </div>

      <div className="blueprint-block">

        <div className="blueprint-block-header">
          <span className="card-label">01</span>

          <h3>Core Features</h3>
        </div>

        <div className="feature-grid">

          {blueprint.coreFeatures.map((feature, index) => (
            <div className="feature-item" key={index}>

              <span>
                {String(index + 1).padStart(2, '0')}
              </span>

              <p>{feature}</p>

            </div>
          ))}

        </div>

      </div>

      <div className="blueprint-block">

        <div className="blueprint-block-header">
          <span className="card-label">02</span>

          <h3>Pages</h3>
        </div>

        <div className="pages-list">

          {blueprint.pages.map((page, index) => (
            <div className="page-item" key={index}>

              <span className="page-number">
                {String(index + 1).padStart(2, '0')}
              </span>

              <div>
                <strong>{page.name}</strong>
                <p>{page.purpose}</p>
              </div>

            </div>
          ))}

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
              <strong>{blueprint.techStack.frontend}</strong>
            </div>

            <div>
              <span>BACKEND</span>
              <strong>{blueprint.techStack.backend}</strong>
            </div>

            <div>
              <span>DATABASE</span>
              <strong>{blueprint.techStack.database}</strong>
            </div>

            <div>
              <span>OTHER</span>

              {blueprint.techStack.other.map((item, index) => (
                <strong key={index}>{item}</strong>
              ))}

            </div>

          </div>

        </div>

        <div className="blueprint-block">

          <div className="blueprint-block-header">
            <span className="card-label">04</span>

            <h3>Database</h3>
          </div>

          <div className="database-list">

            {blueprint.database.map((item, index) => (
              <div key={index}>

                <strong>{item.name}</strong>

                <p>{item.purpose}</p>

              </div>
            ))}

          </div>

        </div>

      </div>

      <div className="blueprint-block">

        <div className="blueprint-block-header">
          <span className="card-label">05</span>

          <h3>Development Tasks</h3>
        </div>

        <div className="task-list">

          {blueprint.developmentTasks.map((task, index) => (
            <div className="task-item" key={index}>

              <span className="task-number">
                {String(index + 1).padStart(2, '0')}
              </span>

              <span>{task}</span>

            </div>
          ))}

        </div>

      </div>

      <div className="blueprint-block build-order">

        <div className="blueprint-block-header">
          <span className="card-label">06</span>

          <h3>Recommended Build Order</h3>
        </div>

        <ol>

          {blueprint.buildOrder.map((step, index) => (
            <li key={index}>

              <span>
                {String(index + 1).padStart(2, '0')}
              </span>

              {step}

            </li>
          ))}

        </ol>

      </div>

    </section>
  )
}

export default Blueprint