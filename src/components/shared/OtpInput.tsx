import { useEffect, useRef } from 'react'
import Input from '@/components/ui/Input'
import classNames from '@/utils/classNames'
import type { ChangeEvent, KeyboardEvent, ClipboardEvent, FocusEvent, MouseEvent } from 'react'

interface OTPInputProps {
    length?: number
    value?: string
    onChange?: (value: string) => void
    disabled?: boolean
    className?: string
    inputClass?: string
    autoFocus?: boolean
    placeholder?: string
    invalid?: boolean
    shake?: boolean
}

const OTPInput = ({
    length = 6,
    value = '',
    onChange,
    disabled = false,
    className = '',
    inputClass,
    autoFocus = false,
    placeholder,
    invalid = false,
    shake = false,
}: OTPInputProps) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const valueRef = useRef<string>(value || '')

    useEffect(() => {
        valueRef.current = value || ''
        if (!value && autoFocus && !disabled) {
            inputRefs.current[0]?.focus()
        }
    }, [value, autoFocus, disabled])

    useEffect(() => {
        inputRefs.current = Array(length)
            .fill(null)
            .map((_, i) => inputRefs.current[i] || null)
    }, [length])

    // Auto focus on mount if enabled
    useEffect(() => {
        if (autoFocus && !disabled) {
            const firstEmpty = Math.min((value || '').length, length - 1)
            inputRefs.current[firstEmpty]?.focus()
        }
    }, [])

    const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
        e.target.select()
    }

    const handleMouseDown = (
        e: MouseEvent<HTMLInputElement>,
        index: number,
    ) => {
        const currentLen = (valueRef.current || '').length
        if (index > currentLen) {
            e.preventDefault()
            const target = Math.min(currentLen, length - 1)
            inputRefs.current[target]?.focus()
            inputRefs.current[target]?.select()
        }
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
        const rawVal = e.target.value
        const digitsOnly = rawVal.replace(/\D/g, '')

        if (!digitsOnly) {
            // Cleared character
            const currentVal = valueRef.current || ''
            if (currentVal[index]) {
                const newVal =
                    currentVal.slice(0, index) + currentVal.slice(index + 1)
                valueRef.current = newVal
                onChange?.(newVal)
            }
            return
        }

        // Multi-digit input (e.g. autofill or rapid paste)
        if (digitsOnly.length > 1 && digitsOnly.length !== 2) {
            const pasted = digitsOnly.slice(0, length)
            valueRef.current = pasted
            onChange?.(pasted)
            const nextIndex = Math.min(pasted.length, length - 1)
            setTimeout(() => {
                inputRefs.current[nextIndex]?.focus()
                inputRefs.current[nextIndex]?.select()
            }, 0)
            return
        }

        // Single digit or replaced digit
        const digit = digitsOnly.slice(-1)
        const currentVal = valueRef.current || ''

        let newVal = ''
        if (index < currentVal.length) {
            // Replace digit at index
            newVal =
                currentVal.slice(0, index) + digit + currentVal.slice(index + 1)
        } else {
            // Append digit
            newVal = (currentVal + digit).slice(0, length)
        }

        valueRef.current = newVal
        onChange?.(newVal)

        // Automatically move to the next input box
        if (index < length - 1) {
            setTimeout(() => {
                inputRefs.current[index + 1]?.focus()
                inputRefs.current[index + 1]?.select()
            }, 0)
        }
    }

    const handleKeyDown = (
        e: KeyboardEvent<HTMLInputElement>,
        index: number,
    ) => {
        const currentVal = valueRef.current || ''

        if (e.key === 'Backspace') {
            e.preventDefault()
            if (currentVal[index]) {
                // Delete digit at current slot and move focus back
                const newVal =
                    currentVal.slice(0, index) + currentVal.slice(index + 1)
                valueRef.current = newVal
                onChange?.(newVal)
                if (index > 0) {
                    setTimeout(() => {
                        inputRefs.current[index - 1]?.focus()
                        inputRefs.current[index - 1]?.select()
                    }, 0)
                }
            } else if (index > 0) {
                // Current slot is empty, delete previous digit and move focus back
                const newVal =
                    currentVal.slice(0, index - 1) + currentVal.slice(index)
                valueRef.current = newVal
                onChange?.(newVal)
                setTimeout(() => {
                    inputRefs.current[index - 1]?.focus()
                    inputRefs.current[index - 1]?.select()
                }, 0)
            }
        } else if (e.key === 'Delete') {
            e.preventDefault()
            if (currentVal[index]) {
                const newVal =
                    currentVal.slice(0, index) + currentVal.slice(index + 1)
                valueRef.current = newVal
                onChange?.(newVal)
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault()
            inputRefs.current[index - 1]?.focus()
            inputRefs.current[index - 1]?.select()
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            e.preventDefault()
            const maxAllowedIndex = Math.min(currentVal.length, length - 1)
            const targetIndex = Math.min(index + 1, maxAllowedIndex)
            inputRefs.current[targetIndex]?.focus()
            inputRefs.current[targetIndex]?.select()
        }
    }

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        const pastedData = e.clipboardData
            .getData('text/plain')
            .replace(/\D/g, '')
            .slice(0, length)
        if (pastedData) {
            valueRef.current = pastedData
            onChange?.(pastedData)
            const nextIndex = Math.min(pastedData.length, length - 1)
            setTimeout(() => {
                inputRefs.current[nextIndex]?.focus()
                inputRefs.current[nextIndex]?.select()
            }, 0)
        }
    }

    const setRef = (index: number) => (ref: HTMLInputElement | null) => {
        inputRefs.current[index] = ref
    }

    return (
        <div
            dir="ltr"
            className={classNames(
                'flex gap-2 transition-transform duration-200 dir-ltr',
                shake && 'animate-[shake_0.4s_ease-in-out]',
                className,
            )}
            style={
                shake
                    ? {
                          animation: 'shake 0.4s ease-in-out',
                      }
                    : undefined
            }
        >
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20%, 60% { transform: translateX(-6px); }
                    40%, 80% { transform: translateX(6px); }
                }
            `}</style>
            {Array(length)
                .fill(null)
                .map((_, index) => (
                    <Input
                        key={index}
                        ref={setRef(index)}
                        className={classNames(
                            'text-center text-lg h-[58px] w-[58px] select-none',
                            inputClass,
                        )}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete={index === 0 ? 'one-time-code' : 'off'}
                        value={value[index] || ''}
                        disabled={disabled}
                        autoFocus={autoFocus && index === 0}
                        placeholder={placeholder}
                        aria-label={`Digit ${index + 1} of ${length}`}
                        invalid={invalid}
                        onMouseDown={(e) => handleMouseDown(e as MouseEvent<HTMLInputElement>, index)}
                        onFocus={(e) => handleFocus(e as FocusEvent<HTMLInputElement>)}
                        onChange={(e) =>
                            handleChange(
                                e as ChangeEvent<HTMLInputElement>,
                                index,
                            )
                        }
                        onKeyDown={(e) =>
                            handleKeyDown(
                                e as KeyboardEvent<HTMLInputElement>,
                                index,
                            )
                        }
                        onPaste={handlePaste}
                    />
                ))}
        </div>
    )
}

export default OTPInput
