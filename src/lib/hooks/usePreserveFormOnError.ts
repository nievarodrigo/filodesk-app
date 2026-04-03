'use client'

import { useCallback, useEffect, useRef } from 'react'

type FormLikeState = {
  errors?: unknown
  error?: unknown
  message?: unknown
  success?: boolean
} | undefined

interface UsePreserveFormOnErrorOptions<TState> {
  shouldRestore?: (state: TState) => boolean
}

function defaultShouldRestore(state: FormLikeState): boolean {
  if (!state) return false
  if (state.success) return false
  return Boolean(state.errors || state.error || state.message)
}

function escapeName(name: string): string {
  if (typeof globalThis.CSS !== 'undefined' && typeof globalThis.CSS.escape === 'function') {
    return globalThis.CSS.escape(name)
  }
  return name.replace(/"/g, '\\"')
}

function applyValue(control: Element, value: string, allValues: string[]) {
  if (control instanceof HTMLInputElement) {
    if (control.type === 'checkbox' || control.type === 'radio') {
      control.checked = allValues.includes(control.value || 'on')
      control.dispatchEvent(new Event('change', { bubbles: true }))
      return
    }
    control.value = value
    control.dispatchEvent(new Event('input', { bubbles: true }))
    control.dispatchEvent(new Event('change', { bubbles: true }))
    return
  }

  if (control instanceof HTMLTextAreaElement) {
    control.value = value
    control.dispatchEvent(new Event('input', { bubbles: true }))
    control.dispatchEvent(new Event('change', { bubbles: true }))
    return
  }

  if (control instanceof HTMLSelectElement) {
    if (control.multiple) {
      const values = new Set(allValues)
      Array.from(control.options).forEach((option) => {
        option.selected = values.has(option.value)
      })
    } else {
      control.value = value
    }
    control.dispatchEvent(new Event('change', { bubbles: true }))
  }
}

export function usePreserveFormOnError<TState = FormLikeState>(
  state: TState,
  options?: UsePreserveFormOnErrorOptions<TState>
) {
  const formRef = useRef<HTMLFormElement>(null)
  const lastSubmissionRef = useRef<Map<string, string[]>>(new Map())

  const handleSubmitCapture = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    const data = new FormData(event.currentTarget)
    const snapshot = new Map<string, string[]>()
    for (const [key, rawValue] of data.entries()) {
      if (typeof rawValue !== 'string') continue
      const prev = snapshot.get(key)
      if (prev) prev.push(rawValue)
      else snapshot.set(key, [rawValue])
    }
    lastSubmissionRef.current = snapshot
  }, [])

  useEffect(() => {
    const shouldRestore = options?.shouldRestore ?? ((s: TState) => defaultShouldRestore(s as FormLikeState))
    if (!shouldRestore(state)) return
    const form = formRef.current
    if (!form) return
    if (lastSubmissionRef.current.size === 0) return

    for (const [name, values] of lastSubmissionRef.current.entries()) {
      const controls = form.querySelectorAll(`[name="${escapeName(name)}"]`)
      if (!controls.length) continue
      controls.forEach((control, index) => {
        const value = values[Math.min(index, values.length - 1)] ?? ''
        applyValue(control, value, values)
      })
    }
  }, [state, options?.shouldRestore])

  return { formRef, handleSubmitCapture }
}
