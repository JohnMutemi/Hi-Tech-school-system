import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './dialog';
import { Input } from './input';
import { Button } from './button';
import { toast } from './use-toast';

interface PasswordResetStepperModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'first-login' | 'forgot';
  userType: 'parent' | 'student' | 'teacher' | 'school-admin';
  schoolCode: string;
  userId?: string; // for first-login
  emailOrPhone?: string; // for forgot
}

export function PasswordResetStepperModal({
  open,
  onClose,
  mode,
  userType,
  schoolCode,
  userId,
  emailOrPhone,
}: PasswordResetStepperModalProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fields for both flows
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Forgot password fields
  const [identifier, setIdentifier] = useState(emailOrPhone || '');
  const [resetToken, setResetToken] = useState('');

  // Stepper logic
  const isFirstLogin = mode === 'first-login';
  const isForgot = mode === 'forgot';

  // API endpoints
  const base = `/api/schools/${schoolCode}/${userType}s`;

  // Step 1: First login password change
  const handleFirstLoginChange = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${base}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: userId, // for parent, adjust for other types
          oldPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Password changed successfully! Please log in again.');
        toast({ title: 'Password Changed', description: 'Please log in again with your new password.', variant: 'success' });
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 2000);
      } else {
        setError(data.error || 'Failed to change password.');
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Forgot password - request token
  const handleForgotRequest = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${base}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: identifier }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Reset token sent! Check your email or phone.');
        setStep(1);
      } else {
        setError(data.error || 'Failed to send reset token.');
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Forgot password - reset with token
  const handleForgotReset = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${base}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Password reset! You can now log in.');
        toast({ title: 'Password Reset', description: 'You can now log in with your new password.', variant: 'success' });
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 2000);
      } else {
        setError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Validation
  const canSubmitFirstLogin = oldPassword && newPassword && newPassword === confirmPassword;
  const canSubmitForgotRequest = identifier.length > 0;
  const canSubmitForgotReset = resetToken && newPassword && newPassword === confirmPassword;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isFirstLogin && 'Change Password (First Login)'}
            {isForgot && (step === 0 ? 'Forgot Password' : 'Reset Password')}
          </DialogTitle>
          <DialogDescription>
            {isFirstLogin && 'For your security, please set a new password before accessing your dashboard.'}
            {isForgot && step === 0 && 'Enter your email or phone to receive a reset token.'}
            {isForgot && step === 1 && 'Enter the reset token sent to your email/phone and your new password.'}
          </DialogDescription>
        </DialogHeader>
        {/* Stepper indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {isFirstLogin ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              <div className="h-1 w-8 bg-blue-200 rounded" />
              <div className="w-3 h-3 rounded-full bg-gray-300" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${step === 0 ? 'bg-blue-600' : 'bg-blue-200'}`} />
              <div className="h-1 w-8 bg-blue-200 rounded" />
              <div className={`w-3 h-3 rounded-full ${step === 1 ? 'bg-blue-600' : 'bg-blue-200'}`} />
            </div>
          )}
        </div>
        {/* Step content */}
        {isFirstLogin && (
          <form
            onSubmit={e => {
              e.preventDefault();
              if (canSubmitFirstLogin) handleFirstLoginChange();
            }}
            className="space-y-4"
          >
            <Input
              type="password"
              placeholder="Old Password"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            {success && <div className="text-green-600 text-sm text-center">{success}</div>}
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={!canSubmitFirstLogin || loading}>
                {loading ? 'Changing...' : 'Change Password'}
              </Button>
            </DialogFooter>
          </form>
        )}
        {isForgot && step === 0 && (
          <form
            onSubmit={e => {
              e.preventDefault();
              if (canSubmitForgotRequest) handleForgotRequest();
            }}
            className="space-y-4"
          >
            <Input
              type="text"
              placeholder="Email or Phone"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              required
            />
            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            {success && <div className="text-green-600 text-sm text-center">{success}</div>}
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={!canSubmitForgotRequest || loading}>
                {loading ? 'Sending...' : 'Send Reset Token'}
              </Button>
            </DialogFooter>
          </form>
        )}
        {isForgot && step === 1 && (
          <form
            onSubmit={e => {
              e.preventDefault();
              if (canSubmitForgotReset) handleForgotReset();
            }}
            className="space-y-4"
          >
            <Input
              type="text"
              placeholder="Reset Token"
              value={resetToken}
              onChange={e => setResetToken(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            {success && <div className="text-green-600 text-sm text-center">{success}</div>}
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={!canSubmitForgotReset || loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
} 