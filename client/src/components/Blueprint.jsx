function Blueprint({ blueprint }) {
  return (
    <div>
      <h2>MVP Blueprint</h2>

      <h3>{blueprint.productName}</h3>

      <p>{blueprint.description}</p>

      <h3>Core Features</h3>

      <ul>
        {blueprint.coreFeatures.map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>

      <h3>Pages</h3>

      <ul>
        {blueprint.pages.map((page, index) => (
          <li key={index}>
            <strong>{page.name}</strong>: {page.purpose}
          </li>
        ))}
      </ul>

      <h3>Tech Stack</h3>

      <p>
        <strong>Frontend:</strong>{' '}
        {blueprint.techStack.frontend}
      </p>

      <p>
        <strong>Backend:</strong>{' '}
        {blueprint.techStack.backend}
      </p>

      <p>
        <strong>Database:</strong>{' '}
        {blueprint.techStack.database}
      </p>

      <h4>Other</h4>

      <ul>
        {blueprint.techStack.other.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      <h3>Database</h3>

      <ul>
        {blueprint.database.map((item, index) => (
          <li key={index}>
            <strong>{item.name}</strong>: {item.purpose}
          </li>
        ))}
      </ul>

      <h3>Development Tasks</h3>

      <ul>
        {blueprint.developmentTasks.map((task, index) => (
          <li key={index}>{task}</li>
        ))}
      </ul>

      <h3>Build Order</h3>

      <ol>
        {blueprint.buildOrder.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </div>
  )
}

export default Blueprint