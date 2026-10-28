"use client";

import { parsePhoneNumberFromString } from "libphonenumber-js";
import { useEffect, useState } from "react";
import { inputCls } from "./ui";

const COUNTRIES = [
  { code: "IN", label: "India", dial: "+91" },
  { code: "US", label: "United States", dial: "+1" },
  { code: "GB", label: "United Kingdom", dial: "+44" },
  { code: "CA", label: "Canada", dial: "+1" },
  { code: "AU", label: "Australia", dial: "+61" },
  { code: "AE", label: "United Arab Emirates", dial: "+971" },
] as const;

export function PhoneInput({
  value,
  onChange,
  className = inputCls,
  autoComplete = "tel",
  placeholder = "98200 12345",
}: {
  value: string;
  onChange: (e164OrInput: string) => void;
  className?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [country, setCountry] = useState<(typeof COUNTRIES)[number]["code"]>("IN");
  const [national, setNational] = useState("");

  useEffect(() => {
    if (!value) {
      setNational("");
      return;
    }
    const international = value.startsWith("+");
    const parsed = international
      ? parsePhoneNumberFromString(value)
      : parsePhoneNumberFromString(value, country);
    if (parsed) {
      if (international) {
        const match = COUNTRIES.find((item) => item.code === parsed.country);
        if (match) setCountry(match.code);
      }
      setNational(parsed.nationalNumber);
    } else {
      setNational(value);
    }
  }, [value, country]);

  const selected = COUNTRIES.find((item) => item.code === country)!;
  const update = (raw: string, region = country) => {
    setNational(raw);
    const parsed = parsePhoneNumberFromString(raw, region);
    onChange(parsed?.isValid() ? parsed.number : raw);
  };

  return (
    <div className="flex gap-2">
      <select
        aria-label="Phone country code"
        className={`${className} w-[7.5rem] shrink-0 px-2`}
        value={country}
        onChange={(e) => {
          const next = e.target.value as (typeof COUNTRIES)[number]["code"];
          setCountry(next);
          update(national, next);
        }}
      >
        {COUNTRIES.map((item) => (
          <option key={item.code} value={item.code}>{item.dial} {item.code}</option>
        ))}
      </select>
      <input
        className={className}
        value={national}
        onChange={(e) => update(e.target.value)}
        inputMode="tel"
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-label={`Phone number (${selected.label})`}
      />
    </div>
  );
}
