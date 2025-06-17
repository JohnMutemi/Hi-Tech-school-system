import { Card, CardContent } from "@/components/ui/card"
import { Award, Users, Clock, Shield, Zap, Globe } from "lucide-react"

const achievements = [
  {
    icon: Users,
    number: "50+",
    label: "Schools Served",
    description: "Trusted by educational institutions across Kenya",
  },
  {
    icon: Clock,
    number: "5+",
    label: "Years Experience",
    description: "Proven track record in educational technology",
  },
  {
    icon: Award,
    number: "99.9%",
    label: "Uptime Guarantee",
    description: "Reliable service you can count on",
  },
  {
    icon: Shield,
    number: "100%",
    label: "Data Security",
    description: "Bank-level security for your information",
  },
]

const values = [
  {
    icon: Zap,
    title: "Innovation First",
    description: "We leverage cutting-edge technology to provide the most advanced school management solutions.",
  },
  {
    icon: Users,
    title: "Customer Focused",
    description: "Every feature is designed with educators, students, and parents in mind.",
  },
  {
    icon: Globe,
    title: "Accessibility",
    description: "Making quality education management tools accessible to schools of all sizes.",
  },
]

export function AboutSection() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            About Hi-Tech School Management Software
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            We are Kenya's leading provider of comprehensive school management solutions, empowering educational
            institutions with technology that transforms how they operate.
          </p>
        </div>

        {/* Story */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">Our Story</h3>
            <p className="text-gray-600">
              Founded with a vision to revolutionize education management in Kenya, Hi-Tech School Management Software
              was born from the understanding that schools needed more than just basic administrative tools.
            </p>
            <p className="text-gray-600">
              Our team of experienced educators and technology experts came together to create a platform that not only
              manages school operations but enhances the entire educational experience for students, teachers, and
              parents.
            </p>
            <p className="text-gray-600">
              Today, we serve over 50 schools across Kenya, from small primary schools to large secondary institutions,
              helping them streamline operations, improve communication, and focus on what matters most - quality
              education.
            </p>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-6">
                {achievements.map((achievement, index) => (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <achievement.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{achievement.number}</div>
                    <div className="text-sm font-medium text-gray-700">{achievement.label}</div>
                    <div className="text-xs text-gray-600 mt-1">{achievement.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Core Values</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              These principles guide everything we do and shape how we serve the education community.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-gray-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h4>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
