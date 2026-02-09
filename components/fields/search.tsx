"use client";

import { Search } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

interface SearchFieldProps {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export function SearchField({
  placeholder,
  value,
  onChange,
  className,
}: SearchFieldProps) {
  return (
    <InputGroup className={className}>
      <InputGroupInput
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
    </InputGroup>
  );
}
