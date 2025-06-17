import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"
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
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Choose the perfect plan for your school. All plans include a 30-day free trial with no setup fees.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative ${plan.popular ? "border-red-500 shadow-lg scale-105" : "border-gray-200"}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-red-500 text-white px-4 py-1 rounded-full text-sm font-medium">Most Popular</span>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-gray-900">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                <CardDescription className="mt-4 text-gray-600">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={`w-full ${plan.popular ? "bg-red-500 hover:bg-red-600" : "bg-gray-900 hover:bg-gray-800"}`}
                >
                  <Link href="/demo">{plan.name === "Enterprise" ? "Contact Sales" : "Start Free Trial"}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Need a custom solution? We offer tailored packages for unique requirements.
          </p>
          <Button variant="outline" asChild>
            <Link href="#contact">Contact Our Sales Team</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
