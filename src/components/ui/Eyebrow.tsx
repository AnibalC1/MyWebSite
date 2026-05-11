type Props = {
  children: React.ReactNode;
  index?: string;
  className?: string;
  plain?: boolean;
};

export default function Eyebrow({ children, index, className = '', plain = false }: Props) {
  return (
    <span className={`eyebrow ${plain ? 'eyebrow--plain' : ''} ${className}`}>
      {index && <span style={{ opacity: 0.55, marginRight: '0.4rem' }}>{index}</span>}
      {children}
    </span>
  );
}
