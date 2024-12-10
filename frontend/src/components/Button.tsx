import { ButtonHTMLAttributes, FC } from "react";

type ButtonProps = {
  variant: "primary" | "outlined" | "contained"; // Allowed variants
} & ButtonHTMLAttributes<HTMLButtonElement>; // Extend native button attributes

const Button: FC<ButtonProps> = ({
  variant = "primary",
  children,
  className,
  ...rest
}) => {
  // Define styles for each variant
  const variantStyles: Record<ButtonProps["variant"], string> = {
    primary:
      "cursor-pointer text-sm sm:text-lg px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 font-semibold rounded-full shadow-md hover:opacity-90",
    outlined:
      "border text-sm sm:text-lg border-white text-white py-2 px-6 rounded-full hover:bg-white hover:text-purple-700 transition",
    contained: "text-white text-sm bg-zinc-800 py-1 px-3 rounded-md",
  };

  return (
    <button
      className={`${variantStyles[variant]} ${className || ""}`} // Allow custom className overrides
      {...rest}>
      {children}
    </button>
  );
};

export default Button;
