type Props = {
  name: string;
  logoUrl?: string;
  className?: string;
  imgClassName?: string;
};

const initials = (n: string) =>
  n
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

const SponsorLogo = ({
  name,
  logoUrl,
  className = "",
  imgClassName = "",
}: Props) => {
  if (logoUrl) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <img
          src={logoUrl}
          alt={`${name} logo`}
          loading="lazy"
          className={`max-h-full max-w-full object-contain ${imgClassName}`}
        />
      </div>
    );
  }
  return (
    <div
      className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold ${className}`}
    >
      <span className="text-2xl tracking-wider">{initials(name)}</span>
    </div>
  );
};

export default SponsorLogo;
