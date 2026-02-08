import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({ open, onClose, children, maxWidth = 'max-w-xl' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Panel */}
      <div className={`relative w-full ${maxWidth} max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in`}>
        {children}
      </div>
    </div>,
    document.body
  )
}

export function ModalHeader({ children, onClose }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
      <h2 className="text-lg font-bold text-surface-800">{children}</h2>
      {onClose && (
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

export function ModalBody({ children, className = '' }) {
  return (
    <div className={`flex-1 overflow-y-auto px-6 py-4 ${className}`}>
      {children}
    </div>
  )
}

export function ModalFooter({ children }) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 border-t border-surface-100 bg-surface-50/50">
      {children}
    </div>
  )
}
