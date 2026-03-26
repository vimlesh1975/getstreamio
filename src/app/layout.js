
import "@stream-io/video-react-sdk/dist/css/styles.css";

import "./globals.css"; // 👈 This applies the CSS to every single page

export const metadata = {
  title: "Broadcast Studio",
  description: "Real-time Guest Portal",
};

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
