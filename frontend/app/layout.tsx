import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from './context/AppContext'
import { LanguageProvider } from './lib/translations'
import { ThemeProvider } from './context/ThemeContext'

export const metadata: Metadata = {
  title: 'SpendWise',
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
        <AppProvider>
          <ThemeProvider>
            <LanguageProvider>
              {children}
            </LanguageProvider>
          </ThemeProvider>
        </AppProvider>
      </body>
    </html>
  )
}

