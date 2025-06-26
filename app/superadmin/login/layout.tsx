export default function LoginLayout({ children }: { children: React.ReactNode }) {
  // This layout completely isolates the login page from parent layouts
  // No useUser or any other hooks should be called here
  return <>{children}</>;
} 