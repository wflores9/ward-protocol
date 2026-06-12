'use client';

import { useEffect, useId, useState } from 'react';

type MermaidDiagramProps = {
  chart: string;
  title?: string;
};

export default function MermaidDiagram({ chart, title }: MermaidDiagramProps) {
  const reactId = useId();
  const id = `ward-mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'dark',
          themeVariables: {
            background: '#07131f',
            primaryColor: '#0f2439',
            primaryTextColor: '#f7fbff',
            primaryBorderColor: '#34506b',
            lineColor: '#8fb4d8',
            secondaryColor: '#122b43',
            tertiaryColor: '#0a1826',
            fontFamily: 'DM Sans, sans-serif',
          },
        });
        const result = await mermaid.render(id, chart);
        if (!cancelled) setSvg(result.svg);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to render diagram');
      }
    }

    renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  return (
    <div className="premium-diagram" aria-label={title || 'Ward architecture diagram'}>
      {svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : null}
      {!svg && !error ? <div className="premium-diagram-loading">Rendering architecture graph...</div> : null}
      {error ? <pre className="premium-diagram-fallback">{chart}</pre> : null}
    </div>
  );
}
