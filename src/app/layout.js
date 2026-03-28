
import "@stream-io/video-react-sdk/dist/css/styles.css";

import "./globals.css"; // 👈 This applies the CSS to every single page

export const metadata = {
  title: "Getstream",
  description: "Video Calling Application built with Stream Video SDK",
};

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
