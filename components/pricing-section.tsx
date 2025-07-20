import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Star, ArrowRight, Zap } from "lucide-react"
import Link from "next/link"

const plans = [
  {
    name: "Starter",
    price: "KSh 30,000",
    period: "/month",
    description: "Perfect for small schools with up to 300 students",
    features: [
      "Up to 300 students",
      "Basic student management",
      "Attendance tracking",
      "Grade management",
      "Parent communication",
      "Email support",
      "Basic reporting",
    ],
    popular: false,
    gradient: "from-gray-500 to-gray-700",
    bgGradient: "from-gray-50 to-gray-100",
    icon: "🎓",
  },
  {
    name: "Professional",
    price: "KSh 45,000",
    period: "/month",
    description: "Ideal for medium schools with advanced features",
    features: [
      "Up to 1,500 students",
      "All Starter features",
      "Fee management & invoicing",
      "Advanced timetable generation",
      "SMS notifications",
      "Financial reports & analytics",
      "Mobile app access",
      "Library management",
      "Priority support",
    ],
    popular: true,
    gradient: "from-blue-500 via-purple-500 to-indigo-600",
    bgGradient: "from-blue-50 via-purple-50 to-indigo-50",
    icon: "⭐",
    badge: "Most Popular",
    badgeColor: "from-blue-500 to-purple-500",
  },
  {
    name: "Enterprise",
    price: "KSh 60,000",
    period: "/month",
    description: "For large institutions with premium features",
    features: [
      "Unlimited students",
      "All Professional features",
      "Multi-campus support",
      "Custom integrations",
      "Advanced analytics & AI insights",
      "White-label solution",
      "Transport management",
      "Hostel management",
      "Dedicated support manager",
      "On-premise deployment option",
    ],
    popular: false,
    gradient: "from-purple-500 to-pink-600",
    bgGradient: "from-purple-50 to-pink-50",
    icon: "🚀",
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-16 md:py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-200/20 to-purple-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-blue-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium border border-green-200/50 mb-6">
            <Zap className="w-4 h-4" />
            Transparent Pricing
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Simple, Transparent
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Pricing Plans
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Choose the perfect plan for your school. All plans include a 30-day free trial with no setup fees.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`group relative flex flex-col h-full overflow-hidden border-0 bg-white/70 backdrop-blur-sm hover:bg-white/90 transition-all duration-500 ${
                plan.popular 
                  ? "shadow-2xl shadow-blue-500/20 scale-105 border-2 border-blue-200/50 ring-4 ring-blue-500/20" 
                  : "hover:shadow-xl hover:shadow-gray-500/10 hover:-translate-y-2"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                  <div className={`bg-gradient-to-r ${plan.badgeColor} text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2 animate-pulse`}>
                    <Star className="w-4 h-4 fill-current" />
                    {plan.badge}
                  </div>
                </div>
              )}

              {/* Enhanced Gradient Background for Professional */}
              <div className={`absolute inset-0 bg-gradient-to-br ${plan.bgGradient} ${plan.popular ? 'opacity-70' : 'opacity-50'}`}></div>

              {/* Special Glow Effect for Professional */}
              {plan.popular && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-indigo-400/20 animate-pulse"></div>
              )}

              <CardHeader className="relative z-10 text-center pb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${plan.gradient} rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 ${plan.popular ? 'ring-4 ring-blue-500/30' : ''}`}>
                    {plan.icon}
                  </div>
                </div>
                <CardTitle className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-blue-900' : 'text-gray-900'}`}>
                  {plan.name}
                </CardTitle>
                <div className="mb-4">
                  <span className={`text-4xl font-bold ${plan.popular ? 'text-blue-900' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  <span className="text-gray-600 ml-1">{plan.period}</span>
                </div>
                <CardDescription className={`text-gray-600 h-12 leading-relaxed ${plan.popular ? 'text-blue-700' : ''}`}>
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="relative z-10 flex-grow flex flex-col space-y-6">
                <ul className="space-y-4 flex-grow">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start group/item">
                      <div className={`w-6 h-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mr-3 mt-0.5 group-hover/item:scale-110 transition-transform duration-200 ${plan.popular ? 'ring-2 ring-green-200' : ''}`}>
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                      <span className={`leading-relaxed ${plan.popular ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={`w-full mt-auto group/btn ${
                    plan.popular
                      ? "bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 ring-4 ring-blue-500/20"
                      : "bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white shadow-md hover:shadow-lg"
                  } transition-all duration-300 py-6 text-lg font-semibold`}
                >
                  <Link href="/demo" className="flex items-center justify-center">
                    {plan.name === "Enterprise" ? "Contact Sales" : "Start Free Trial"}
                    <ArrowRight className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>

              {/* Enhanced Hover Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-lg ${plan.popular ? 'opacity-5' : ''}`}></div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="inline-flex flex-col items-center gap-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200/50 max-w-2xl">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Need a custom solution?</h3>
              <p className="text-gray-600 mb-4">
                We offer tailored packages for unique requirements and special integrations.
              </p>
              <Button variant="outline" asChild className="border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50">
                <Link href="#contact" className="flex items-center">
                  Contact Our Sales Team
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
