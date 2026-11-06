"use client"

import { Toaster as Sonner, ToasterProps } from "sonner"

// ALLIOME is dark-only by design; lock the toaster to the dark theme.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      className="toaster group"
      style={
        {
          "--normal-bg": "#FCFAF4",
          "--normal-text": "#2C3431",
          "--normal-border": "rgba(44, 52, 49, 0.14)",
          "--success-bg": "#EAF3EC",
          "--success-text": "#1F6B45",
          "--success-border": "rgba(47, 133, 90, 0.35)",
          "--error-bg": "#F7ECEA",
          "--error-text": "#9C3F36",
          "--error-border": "rgba(176, 73, 63, 0.35)",
          "--warning-bg": "#F7F0E4",
          "--warning-text": "#8A5F1E",
          "--warning-border": "rgba(194, 112, 61, 0.35)",
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          backdropFilter: "blur(12px)",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
