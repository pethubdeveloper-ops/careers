export interface IconProps {
  d: string;
  size?: number;
  color?: string;
  stroke?: boolean;
}

export function Icon({
  d,
  size = 16,
  color = "currentColor",
  stroke = false,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={stroke ? "none" : color}
      stroke={stroke ? color : "none"}
      strokeWidth={stroke ? 2 : 0}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}
