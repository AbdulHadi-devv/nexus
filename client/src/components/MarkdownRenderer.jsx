import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => <h1 className="markdown-h1" {...props} />,
          h2: ({ node, ...props }) => <h2 className="markdown-h2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="markdown-h3" {...props} />,
          h4: ({ node, ...props }) => <h4 className="markdown-h4" {...props} />,
          p: ({ node, ...props }) => <p className="markdown-p" {...props} />,
          ul: ({ node, ...props }) => <ul className="markdown-ul" {...props} />,
          ol: ({ node, ...props }) => <ol className="markdown-ol" {...props} />,
          li: ({ node, ...props }) => <li className="markdown-li" {...props} />,
          a: ({ node, ...props }) => <a className="markdown-a" target="_blank" rel="noopener noreferrer" {...props} />,
          code: ({ node, inline, ...props }) => 
            inline ? <code className="markdown-code-inline" {...props} /> : <code className="markdown-code-block" {...props} />,
          pre: ({ node, ...props }) => <pre className="markdown-pre" {...props} />,
          blockquote: ({ node, ...props }) => <blockquote className="markdown-blockquote" {...props} />,
          table: ({ node, ...props }) => <table className="markdown-table" {...props} />,
          th: ({ node, ...props }) => <th className="markdown-th" {...props} />,
          td: ({ node, ...props }) => <td className="markdown-td" {...props} />,
          img: ({ node, ...props }) => <img className="markdown-img" {...props} />,
          hr: ({ node, ...props }) => <hr className="markdown-hr" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}