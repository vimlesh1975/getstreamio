"use client";

import "@stream-io/video-react-sdk/dist/css/styles.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
