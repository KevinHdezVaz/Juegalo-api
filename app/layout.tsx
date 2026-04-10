import "./globals.css";

export const metadata = {
  title: "JUEGALO — Gana dinero real desde tu celular",
  description: "Completa encuestas, ve videos y realiza ofertas. Acumula monedas y retira por PayPal cuando quieras.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
