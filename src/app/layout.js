// File: src/app/layout.js
export const metadata = {
  title: 'SmartShopper',
  description: 'Your personal shopping assistant',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}