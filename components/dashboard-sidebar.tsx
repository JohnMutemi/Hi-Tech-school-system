"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Home, 
  CreditCard, 
  FileText, 
  Receipt, 
  User, 
  LogOut,
  Menu,
  X,
  Baby
} from "lucide-react"

interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface DashboardSidebarProps {
  userType: 'student' | 'parent'
  user: {
    name: string
    email?: string
    avatar?: string
    admissionNumber?: string
  }
  schoolName: string
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout: () => void
}

const studentNavItems: SidebarItem[] = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'fees', label: 'Fees', icon: CreditCard },
  { id: 'payments', label: 'Payments', icon: Receipt },
  { id: 'receipts', label: 'Receipts', icon: FileText },
  { id: 'profile', label: 'Profile', icon: User },
]

const parentNavItems: SidebarItem[] = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'fees', label: 'Fees', icon: CreditCard },
  { id: 'payments', label: 'Payments', icon: Receipt },
  { id: 'receipts', label: 'Receipts', icon: FileText },
  { id: 'children', label: 'Children', icon: Baby },
  { id: 'profile', label: 'Profile', icon: User },
]

export function DashboardSidebar({ 
  userType, 
  user, 
  schoolName, 
  activeTab, 
  onTabChange, 
  onLogout 
}: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navItems = userType === 'student' ? studentNavItems : parentNavItems

  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') {
      return 'U'
    }
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h2 className="font-semibold text-gray-900 truncate">{schoolName}</h2>
              <p className="text-sm text-gray-500">{userType === 'student' ? 'Student Portal' : 'Parent Portal'}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {userType === 'student' ? user.admissionNumber : user.email}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.id}>
                <Button
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    isCollapsed ? "px-2" : "px-3"
                  }`}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {!isCollapsed && item.label}
                </Button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="absolute bottom-4 left-4 right-4">
        <Button
          variant="outline"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {!isCollapsed && "Logout"}
        </Button>
      </div>
    </div>
  )
} 