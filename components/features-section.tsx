import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users,
  BookOpen,
  Calendar,
  CreditCard,
  MessageSquare,
  BarChart3,
  Shield,
  Smartphone,
  Cloud,
} from "lucide-react"

const features = [
  {
    icon: Users,
    title: "Student Management",
    description: "Complete student profiles, enrollment, attendance tracking, and academic records management.",
  },
  {
    icon: BookOpen,
    title: "Academic Management",
    description: "Curriculum planning, subject allocation, grading system, and report card generation.",
  },
  {
    icon: Calendar,
    title: "Timetable Management",
    description: "Automated timetable generation, class scheduling, and resource allocation.",
  },
  {
    icon: CreditCard,
    title: "Fee Management",
    description: "Fee structure setup, invoice generation, payment tracking, and financial reporting.",
  },
  {
    icon: MessageSquare,
    title: "Communication Hub",
    description: "SMS/Email notifications, parent-teacher communication, and announcement system.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Performance analytics, attendance reports, financial insights, and custom dashboards.",
  },
  {
    icon: Shield,
    title: "Multi-Tenant Security",
    description: "School-specific data isolation, role-based access control, and secure authentication.",
  },
  {
    icon: Smartphone,
    title: "Mobile Application",
    description: "Native mobile apps for students, parents, and teachers with offline capabilities.",
  },
  {
    icon: Cloud,
    title: "Cloud-Based Platform",
    description: "Secure cloud hosting, automatic backups, and 99.9% uptime guarantee.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Comprehensive School Management Features
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Everything you need to run your educational institution efficiently, from student enrollment to financial
            management.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-red-500" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
