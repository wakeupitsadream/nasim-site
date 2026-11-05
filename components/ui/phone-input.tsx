"use client"

import * as React from "react"
import type { CountryCode } from "libphonenumber-js/min"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  DEFAULT_PHONE_COUNTRY,
  formatAsYouType,
  formatPhoneForDisplay,
} from "@/lib/validation/phone"

// Controlled: the parent holds E.164 ('' when empty) and validates it with isValidPhone.
// Any country is accepted; without a country code the number is read as UAE. Always LTR.
type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "type"
> & {
  value: string
  onChange: (e164: string) => void
  defaultCountry?: CountryCode
}

function PhoneInput({
  value,
  onChange,
  defaultCountry = DEFAULT_PHONE_COUNTRY,
  name,
  className,
  ...props
}: PhoneInputProps) {
  const [text, setText] = React.useState(() =>
    value ? formatPhoneForDisplay(value) : ""
  )
  const [emitted, setEmitted] = React.useState(value)

  // The parent reset or replaced the value: re-derive the visible text.
  if (value !== emitted) {
    setEmitted(value)
    setText(value ? formatPhoneForDisplay(value) : "")
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value
    const deleting = (event.nativeEvent as InputEvent).inputType?.startsWith(
      "delete"
    )
    const atEnd = event.target.selectionStart === raw.length
    const { text: formatted, e164 } = formatAsYouType(raw, defaultCountry)
    // Never fight the caret mid-edit or on backspace.
    setText(deleting || !atEnd ? raw : formatted)
    setEmitted(e164)
    onChange(e164)
  }

  return (
    <>
      <Input
        {...props}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        dir="ltr"
        value={text}
        onChange={handleChange}
        className={cn("rtl:text-end", className)}
      />
      {name ? <input type="hidden" name={name} value={value} /> : null}
    </>
  )
}

export { PhoneInput }
