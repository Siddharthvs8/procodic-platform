export function SectionHeading({ label, title, description, action }: { label: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="section-head"><div><span className="eyebrow">{label}</span><h2>{title}</h2></div>{description && <p>{description}</p>}{action}</div>;
}
