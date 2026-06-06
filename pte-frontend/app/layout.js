import "./globals.css";

export const metadata = {
  title: "Evee PTE Hub",
  description: "PTE Practice Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}