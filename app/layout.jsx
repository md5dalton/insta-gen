import "./globals.css"

export const metadata = {
  title: "Insta generator",
  description: "Insta Generator",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
