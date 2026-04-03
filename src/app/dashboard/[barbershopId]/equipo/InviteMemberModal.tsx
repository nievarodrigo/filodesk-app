'use client'

import { useActionState, useEffect, useState } from 'react'
import { inviteMember, type InviteMemberState } from '@/app/actions/member'
import { usePreserveFormOnError } from '@/lib/hooks/usePreserveFormOnError'
import styles from './equipo.module.css'

interface Props {
  barbershopId: string
}

export default function InviteMemberModal({ barbershopId }: Props) {
  const action = inviteMember.bind(null, barbershopId)
  const [state, formAction, pending] = useActionState<InviteMemberState, FormData>(action, undefined)
  const { formRef, handleSubmitCapture } = usePreserveFormOnError(state)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (state?.success && !pending) {
      const timer = setTimeout(() => setOpen(false), 700)
      return () => clearTimeout(timer)
    }
  }, [state?.success, pending])

  return (
    <>
      <button type="button" className={styles.inviteButton} onClick={() => setOpen(true)}>
        Invitar miembro
      </button>

      {open && (
        <div className={styles.modalOverlay} onClick={() => setOpen(false)}>
          <div className={styles.modalBox} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>Gestión premium</p>
                <h2 className={styles.modalTitle}>Invitar miembro</h2>
              </div>
              <button type="button" className={styles.modalClose} onClick={() => setOpen(false)} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <form ref={formRef} onSubmitCapture={handleSubmitCapture} action={formAction} className={styles.modalForm}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="member-email">Email</label>
                <input
                  id="member-email"
                  name="email"
                  type="email"
                  className={styles.input}
                  placeholder="persona@filodesk.app"
                  required
                />
                {state?.errors?.email && <p className={styles.fieldError}>{state.errors.email[0]}</p>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="member-role">Rol</label>
                <select id="member-role" name="role" className={styles.select} defaultValue="manager" required>
                  <option value="manager">Encargado</option>
                  <option value="barber">Barbero</option>
                </select>
                {state?.errors?.role && <p className={styles.fieldError}>{state.errors.role[0]}</p>}
              </div>

              <p className={styles.helperText}>
                El email debe existir previamente como usuario registrado en FiloDesk.
              </p>

              {state?.message && (
                <p className={state.success ? styles.successMessage : styles.errorMessage}>
                  {state.message}
                </p>
              )}

              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryButton} onClick={() => setOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.primaryButton} disabled={pending}>
                  {pending ? 'Invitando...' : 'Agregar al equipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
