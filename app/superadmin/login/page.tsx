import { SuperAdminLogin } from "@/components/superadmin/login"

export default function SuperAdminLoginPage() {
  // This should only run on the login page, not in any parent layout
  console.log('Login page rendering - no parent layout should be active')
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Background image only */}
      <img
        src="/library-bg.jpg"
        alt="Library background"
        className="absolute inset-0 w-full h-full object-cover object-center"
        draggable={false}
      />
      {/* Login card, centered */}
      <div className="relative z-10 flex items-center justify-center w-full min-h-screen">
        <SuperAdminLogin />
      </div>
    </div>
  )
}
