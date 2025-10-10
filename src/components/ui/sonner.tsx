"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--Neutral-20)",
          "--normal-text": "var(--Neutral-80)",
          "--normal-border": "var(--Neutral-30)",
          "--success-bg": "var(--Green-700)",
          "--success-text": "var(--Green-500)",
          "--success-border": "var(--Green-500)",
          "--error-bg": "var(--Red-700)",
          "--error-text": "var(--Red-400)",
          "--error-border": "var(--Red-500)",
          "--warning-bg": "var(--Blue-800)",
          "--warning-text": "var(--Blue-400)",
          "--warning-border": "var(--Blue-500)",
        } as React.CSSProperties
      }
      position="bottom-right"
      expand={true}
      richColors={true}
      closeButton={true}
      {...props}
    />
  )
}

export { Toaster }
