import React from 'react';

type Props = {
  text: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  titleAttr?: string;
};

export default function GameTitle({ text, as: Tag = 'span', className, titleAttr }: Props) {
  const parts = String(text ?? '').split(':');
  if (parts.length === 1) {
    return <Tag className={className} title={titleAttr}>{text}</Tag>;
  }
  const nodes: React.ReactNode[] = [];
  parts.forEach((p, idx) => {
    if (idx > 0) {
      nodes.push(<span key={`colon-${idx}`}>:</span>);
      nodes.push(<br key={`br-${idx}`} />);
    }
    nodes.push(<React.Fragment key={`seg-${idx}`}>{p}</React.Fragment>);
  });
  return <Tag className={className} title={titleAttr}>{nodes}</Tag>;
}

