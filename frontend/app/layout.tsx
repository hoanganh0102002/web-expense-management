import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from './context/AppContext'
import { LanguageProvider } from './lib/translations'
import { ThemeProvider } from './context/ThemeContext'
import { AIChatProvider } from './context/AIChatContext'
import { ToastProvider } from './context/ToastContext'
import AIChatPanel from './components/AIChatPanel'

export const metadata: Metadata = {
  title: 'EM',
  description: 'Quản lý chi tiêu cá nhân',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body>
        <ToastProvider>
          <AppProvider>
            <ThemeProvider>
              <LanguageProvider>
                <AIChatProvider>
                  {children}
                  <AIChatPanel />
                </AIChatProvider>
              </LanguageProvider>
            </ThemeProvider>
          </AppProvider>
        </ToastProvider>
      </body>
    </html>
  )
}


