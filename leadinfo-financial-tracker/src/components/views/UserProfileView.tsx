import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Lock, LogOut, Key } from 'lucide-react';
import { motion } from 'motion/react';

export default function UserProfileView() {
  const { user, logout } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white">User Profile</h2>

      <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
        <CardContent className="pt-8 space-y-8">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-[var(--color-surface-highlight)] border-2 border-[var(--color-primary)] flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(163,255,63,0.15)]">
              <User size={48} className="text-[var(--color-primary)]" />
            </div>
            <h3 className="text-2xl font-bold text-white">{user?.name || 'User'}</h3>
            <span className="px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium border border-[var(--color-primary)]/20 mt-2">
              Admin
            </span>
          </div>

          {/* User Details */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">Full Name</Label>
              <div className="flex items-center p-4 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-white">
                <User size={18} className="mr-3 text-[var(--color-text-secondary)]" />
                {user?.name || 'User'}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">Email Address</Label>
              <div className="flex items-center p-4 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-white">
                <Mail size={18} className="mr-3 text-[var(--color-text-secondary)]" />
                {user?.email || 'user@example.com'}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[var(--color-text-secondary)] uppercase tracking-wider text-xs">Password</Label>
              <div className="flex items-center p-4 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-white font-mono tracking-widest">
                <Lock size={18} className="mr-3 text-[var(--color-text-secondary)]" />
                ••••••••••••
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 space-y-4">
            {!isChangingPassword ? (
              <div className="grid gap-4">
                <Button 
                  onClick={() => setIsChangingPassword(true)}
                  className="w-full bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary-hover)] h-11"
                >
                  <Key size={18} className="mr-2" />
                  Change Password
                </Button>
                
                <Button 
                  variant="destructive" 
                  onClick={logout}
                  className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 h-11"
                >
                  <LogOut size={18} className="mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 bg-[var(--color-background)] p-6 rounded-lg border border-[var(--color-border)]"
              >
                <h4 className="text-lg font-semibold text-white mb-4">Update Password</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input type="password" placeholder="Enter current password" />
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input type="password" placeholder="Enter new password" />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <Input type="password" placeholder="Confirm new password" />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="secondary" 
                    onClick={() => setIsChangingPassword(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button className="flex-1 bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary-hover)]">
                    Update Password
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
