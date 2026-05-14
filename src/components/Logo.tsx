export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-2xl tracking-tight ${className}`}>
      <span className="italic">alta</span>
      <span className="text-primary">.</span>
    </span>
  );
}
