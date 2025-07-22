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
  ArrowRight,
} from "lucide-react"

const features = [
  {
    icon: Users,
    title: "Student Management",
    description: "Complete student profiles, enrollment, attendance tracking, and academic records management.",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50",
  },
  {
    icon: BookOpen,
    title: "Academic Management",
    description: "Curriculum planning, subject allocation, grading system, and report card generation.",
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-50 to-pink-50",
  },
  {
    icon: Calendar,
    title: "Timetable Management",
    description: "Automated timetable generation, class scheduling, and resource allocation.",
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-50 to-emerald-50",
  },
  {
    icon: CreditCard,
    title: "Fee Management",
    description: "Fee structure setup, invoice generation, payment tracking, and financial reporting.",
    gradient: "from-orange-500 to-red-500",
    bgGradient: "from-orange-50 to-red-50",
  },
  {
    icon: MessageSquare,
    title: "Communication Hub",
    description: "SMS/Email notifications, parent-teacher communication, and announcement system.",
    gradient: "from-indigo-500 to-blue-500",
    bgGradient: "from-indigo-50 to-blue-50",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Performance analytics, attendance reports, financial insights, and custom dashboards.",
    gradient: "from-teal-500 to-cyan-500",
    bgGradient: "from-teal-50 to-cyan-50",
  },
  {
    icon: Shield,
    title: "Multi-Tenant Security",
    description: "School-specific data isolation, role-based access control, and secure authentication.",
    gradient: "from-gray-600 to-gray-800",
    bgGradient: "from-gray-50 to-gray-100",
  },
  {
    icon: Smartphone,
    title: "Mobile Application",
    description: "Native mobile apps for students, parents, and teachers with offline capabilities.",
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-50 to-purple-50",
  },
  {
    icon: Cloud,
    title: "Cloud-Based Platform",
    description: "Secure cloud hosting, automatic backups, and 99.9% uptime guarantee.",
    gradient: "from-sky-500 to-blue-500",
    bgGradient: "from-sky-50 to-blue-50",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-gradient-to-tr from-indigo-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium border border-blue-200/50 mb-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Comprehensive Features
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Everything You Need to
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Manage Your School
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            From student enrollment to financial management, our comprehensive platform provides all the tools
            you need to run your educational institution efficiently and effectively.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 transform hover:-translate-y-2"
            >
              {/* Gradient Border Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <CardHeader className="relative z-10 pb-6">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.bgGradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <div className={`w-10 h-10 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="relative z-10">
                <CardDescription className="text-gray-600 leading-relaxed mb-4">
                  {feature.description}
                </CardDescription>
                
                {/* Hover Arrow */}
                <div className="flex items-center text-blue-600 font-medium group-hover:translate-x-2 transition-transform duration-300">
                  <span className="text-sm">Learn more</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>

              {/* Hover Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-lg`}></div>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200/50">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Ready to get started?</h3>
              <p className="text-gray-600 text-sm">Join 50+ schools already using our platform</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
