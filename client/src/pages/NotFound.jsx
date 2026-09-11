import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="not-found-code">404</div>
        <h1 className="not-found-title">Page not found</h1>
        <p className="not-found-message">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>
        <div className="not-found-actions">
          <Link to="/ai-builder" className="primary-button">
            🤖 AI Builder
          </Link>
          <Link to="/knowledge" className="cancel-button">
            📚 Knowledge Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}