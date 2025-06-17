import { DemoForm } from "@/components/demo-form"

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Try EduManage Free for 30 Days</h1>
          <p className="text-lg text-gray-600">
            Experience the power of comprehensive school management. No credit card required.
          </p>
        </div>
        <DemoForm />
      </div>
    </div>
  )
}
