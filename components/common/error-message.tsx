"use client";

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export const ErrorMessage = ({ message, className = "" }: ErrorMessageProps) => {
  if (!message) return null;

  return (
    <div className={`rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive ${className}`}>
      {message}
    </div>
  );
};
