"use client";

import { parsePhoneNumberFromString } from "libphonenumber-js";
import { useEffect, useRef, useState } from "react";
import { inputCls } from "./ui";

const COUNTRIES = [
  { code: "IN", label: "India", dial: "+91" },
  { code: "US", label: "United States", dial: "+1" },
  { code: "GB", label: "United Kingdom", dial: "+44" },
  { code: "CA", label: "Canada", dial: "+1" },
  { code: "AU", label: "Australia", dial: "+61" },
  { code: "AE", label: "United Arab Emirates", dial: "+971" },
] as const;

type CountryCode = (typeof COUNTRIES)[number]["code"];

function fromStoredValue(value: string, fallbackCountry: CountryCode) {
  if (!value) return { country: fallbackCountry, national: "" };
  const international = value.startsWith("+");
  const parsed = international
    ? parsePhoneNumberFromString(value)
    : parsePhoneNumberFromString(value, fallbackCountry);
  const country = international
    ? COUNTRIES.find((item) => item.code === parsed?.country)?.code || fallbackCountry
    : fallbackCountry;
  return { country, national: parsed?.nationalNumber || value };
}

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
  const [initial] = useState(() => fromStoredValue(value, "IN"));
  const [country, setCountry] = useState<CountryCode>(initial.country);
  const [national, setNational] = useState(initial.national);
  const lastEmittedValue = useRef(value);

  useEffect(() => {
    if (value === lastEmittedValue.current) return;
    const next = fromStoredValue(value, country);
    setCountry(next.country);
    setNational(next.national);
    lastEmittedValue.current = value;
  }, [value, country]);

  const selected = COUNTRIES.find((item) => item.code === country)!;
  const controlClassName = className.split(/\s+/).filter((name) => name !== "w-full").join(" ");
  const update = (raw: string, region = country) => {
    setNational(raw);
    const parsed = parsePhoneNumberFromString(raw, region);
    const nextValue = parsed?.isValid() ? parsed.number : raw;
    lastEmittedValue.current = nextValue;
    onChange(nextValue);
  };

  return (
    <div className="flex min-w-0 gap-2">
      <select
        aria-label="Phone country code"
        className={`${controlClassName} w-28 shrink-0 px-2`}
        value={country}
        onChange={(e) => {
          const next = e.target.value as CountryCode;
          setCountry(next);
          update(national, next);
        }}
      >
        {COUNTRIES.map((item) => (
          <option key={item.code} value={item.code}>{item.dial} {item.code}</option>
        ))}
      </select>
      <input
        className={`${controlClassName} w-0 min-w-0 flex-1`}
        value={national}
        onChange={(e) => update(e.target.value)}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-label={`Phone number (${selected.label})`}
        maxLength={25}
      />
    </div>
  );
}
