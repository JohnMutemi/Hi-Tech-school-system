import { Card, CardContent } from "@/components/ui/card"
import { Award, Users, Clock, Shield, Zap, Globe, ArrowRight, Star } from "lucide-react"

const achievements = [
  {
    icon: Users,
    number: "50+",
    label: "Schools Served",
    description: "Trusted by educational institutions across Kenya",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Clock,
    number: "5+",
    label: "Years Experience",
    description: "Proven track record in educational technology",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Award,
    number: "99.9%",
    label: "Uptime Guarantee",
    description: "Reliable service you can count on",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Shield,
    number: "100%",
    label: "Data Security",
    description: "Bank-level security for your information",
    gradient: "from-orange-500 to-red-500",
  },
]

const values = [
  {
    icon: Zap,
    title: "Innovation First",
    description: "We leverage cutting-edge technology to provide the most advanced school management solutions.",
    gradient: "from-yellow-500 to-orange-500",
    bgGradient: "from-yellow-50 to-orange-50",
  },
  {
    icon: Users,
    title: "Customer Focused",
    description: "Every feature is designed with educators, students, and parents in mind.",
    gradient: "from-blue-500 to-purple-500",
    bgGradient: "from-blue-50 to-purple-50",
  },
  {
    icon: Globe,
    title: "Accessibility",
    description: "Making quality education management tools accessible to schools of all sizes.",
    gradient: "from-green-500 to-teal-500",
    bgGradient: "from-green-50 to-teal-50",
  },
]

export function AboutSection() {
  return (
    <section id="about" className="py-16 md:py-20 bg-gradient-to-br from-white via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-indigo-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium border border-blue-200/50 mb-6">
            <Star className="w-4 h-4" />
            About Hi-Tech SMS
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Kenya's Leading Provider of
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              School Management Solutions
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We are Kenya's leading provider of comprehensive school management solutions, empowering educational
            institutions with technology that transforms how they operate.
          </p>
        </div>

        {/* Story */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6 text-center lg:text-left">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Our Story</h3>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                Founded with a vision to revolutionize education management in Kenya, Hi-Tech School Management Software
                was born from the understanding that schools needed more than just basic administrative tools.
              </p>
              <p>
                Our team of experienced educators and technology experts came together to create a platform that not only
                manages school operations but enhances the entire educational experience for students, teachers, and
                parents.
              </p>
              <p>
                Today, we serve over 50 schools across Kenya, from small primary schools to large secondary institutions,
                helping them streamline operations, improve communication, and focus on what matters most - quality
                education.
              </p>
            </div>
          </div>
          <div className="relative mt-12 lg:mt-0">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
              <div className="grid grid-cols-2 gap-6">
                {achievements.map((achievement, index) => (
                  <div key={index} className="text-center group">
                    <div className={`w-16 h-16 bg-gradient-to-br ${achievement.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <achievement.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{achievement.number}</div>
                    <div className="text-sm font-semibold text-gray-700 mb-2">{achievement.label}</div>
                    <p className="text-xs text-gray-600 leading-relaxed hidden sm:block">{achievement.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="space-y-12">
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Our Core Values</h3>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
              These principles guide everything we do and shape how we serve the education community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card 
                key={index} 
                className="group relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 transform hover:-translate-y-2"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${value.bgGradient} opacity-50`}></div>
                
                <CardContent className="relative z-10 p-8 text-center">
                  <div className={`w-20 h-20 bg-gradient-to-br ${value.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <value.icon className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h4>
                  <p className="text-gray-600 leading-relaxed mb-4">{value.description}</p>
                  
                  {/* Hover Arrow */}
                  <div className="flex items-center justify-center text-blue-600 font-medium group-hover:translate-x-2 transition-transform duration-300">
                    <span className="text-sm">Learn more</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>

                {/* Hover Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${value.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-lg`}></div>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200/50">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Join the Revolution</h3>
              <p className="text-gray-600 mb-4">Be part of the digital transformation in education</p>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white"></div>
                  <div className="w-8 h-8 bg-purple-500 rounded-full border-2 border-white"></div>
                  <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white"></div>
                  <div className="w-8 h-8 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                    50+
                  </div>
                </div>
                <span className="text-sm text-gray-600">Schools already trust us</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
