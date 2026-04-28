import { Label } from '@/components/ui/label'

interface FieldWrapperProps {
  label: string
  helper?: string
  required?: boolean
  error?: string
  children: React.ReactNode
}

export function FieldWrapper({
  label,
  helper,
  required,
  error,
  children,
}: FieldWrapperProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium leading-none">
        {label}
        {required && <span className="ml-1 text-destructive" aria-hidden>*</span>}
      </Label>
      {helper && (
        <p className="text-xs text-muted-foreground">{helper}</p>
      )}
      {children}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
