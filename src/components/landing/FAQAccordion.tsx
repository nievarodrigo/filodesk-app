'use client'

import { useState } from 'react'
import styles from './inner-page.module.css'

interface FAQItem {
  q: string
  a: string
}

export default function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className={styles.faqList}>
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={i} className={styles.faqItem}>
            <button
              className={styles.faqQ}
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span className={styles.faqQText}>{item.q}</span>
              <span className={`${styles.faqIcon} ${isOpen ? styles.faqIconOpen : ''}`}>+</span>
            </button>
            {isOpen && (
              <p className={styles.faqA}>{item.a}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
