"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Camera, Upload, X, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProfileAvatarProps {
  currentAvatar?: string
  userName: string
  onAvatarChange: (avatarUrl: string) => void
  size?: "sm" | "md" | "lg"
}

export function ProfileAvatar({ 
  currentAvatar, 
  userName, 
  onAvatarChange, 
  size = "md" 
}: ProfileAvatarProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24", 
    lg: "h-32 w-32"
  }

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPEG, PNG, etc.)",
          variant: "destructive"
        })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive"
        })
        return
      }

      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setShowUploadDialog(true)
    }
  }

  const handleUpload = () => {
    if (selectedFile && previewUrl) {
      // In a real app, you would upload to a server here
      // For now, we'll use the preview URL as the avatar
      onAvatarChange(previewUrl)
      setShowUploadDialog(false)
      setSelectedFile(null)
      setPreviewUrl("")
      
      toast({
        title: "Profile picture updated!",
        description: "Your new profile picture has been saved."
      })
    }
  }

  const handleCancel = () => {
    setShowUploadDialog(false)
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl("")
    }
  }

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Profile Picture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className={`${sizeClasses[size]} border-4 border-gray-200`}>
                <AvatarImage src={currentAvatar} alt={userName} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              
              {/* Upload overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Upload a profile picture to personalize your account
              </p>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Photo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Preview Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Preview Profile Picture</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <Avatar className="h-32 w-32 border-4 border-gray-200">
                <AvatarImage src={previewUrl} alt="Preview" />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl font-semibold">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="text-center text-sm text-gray-600">
              <p>This will be your new profile picture</p>
              <p className="text-xs mt-1">
                {selectedFile?.name} ({(selectedFile?.size || 0 / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleUpload}>
                <Check className="h-4 w-4 mr-2" />
                Save Picture
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 