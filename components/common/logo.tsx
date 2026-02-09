import Image from "next/image";
import logoWithName from "@/public/logo-with-name.svg";
import logoIcon from "@/public/logo-icon.svg";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

const Logo = ({ className, showText = true, size = "md" }: LogoProps) => {
  const sizes = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12",
  };

  return (
    <div className={`${className || ""} ${sizes[size]}`}>
      <Image
        src={showText ? logoWithName : logoIcon}
        alt="FindMyStuff"
        className={`h-full w-auto dark:invert`}
      />
    </div>
  );
};

export default Logo;
