import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { User, Mail, Lock, Bell, Palette, Moon, Sun, X } from 'lucide-react';

export default function SettingsView() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  const handleSaveChanges = () => {
    // Mock save logic
    setShowSaveConfirmation(true);
    setTimeout(() => setShowSaveConfirmation(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Settings</h2>

      <div className="space-y-6">
        {/* Account Settings */}
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
          <CardHeader>
            <CardTitle className="text-lg text-[var(--color-text-primary)] flex items-center gap-2">
              <User size={20} /> Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[var(--color-text-secondary)]">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-[var(--color-text-secondary)]" />
                  <Input id="name" defaultValue={user?.name} className="pl-10 bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-primary)]" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[var(--color-text-secondary)]">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-[var(--color-text-secondary)]" />
                  <Input id="email" defaultValue={user?.email} className="pl-10 bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-primary)]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
          <CardHeader>
            <CardTitle className="text-lg text-[var(--color-text-primary)] flex items-center gap-2">
              <Lock size={20} /> Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[var(--color-text-secondary)]">Password</Label>
              <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]">
                <span className="text-[var(--color-text-primary)] font-mono">********</span>
              </div>
              <Button 
                variant="outline" 
                className="mt-2 border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-highlight)]"
                onClick={() => setIsPasswordModalOpen(true)}
              >
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferences (Theme only - Notification Preferences removed) */}
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
          <CardHeader>
            <CardTitle className="text-lg text-[var(--color-text-primary)] flex items-center gap-2">
              <Palette size={20} /> Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-[var(--color-surface-highlight)]">
                  {theme === 'dark' ? <Moon size={16} className="text-[var(--color-primary)]" /> : <Sun size={16} className="text-[var(--color-primary)]" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">Theme</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">Customize interface appearance</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[var(--color-primary)] hover:bg-[var(--color-surface-highlight)]"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end items-center gap-4">
          {showSaveConfirmation && (
            <span className="text-green-500 text-sm animate-in fade-in slide-in-from-right-5">
              Settings saved successfully
            </span>
          )}
          <Button 
            className="bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary-hover)]"
            onClick={handleSaveChanges}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md bg-[var(--color-surface)] border-[var(--color-border)] shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-[var(--color-text-primary)]">Change Password</CardTitle>
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                <X size={20} />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="old-password" className="text-[var(--color-text-secondary)]">Old Password</Label>
                <Input id="old-password" type="password" className="bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-primary)]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-[var(--color-text-secondary)]">New Password</Label>
                <Input id="new-password" type="password" className="bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-primary)]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-[var(--color-text-secondary)]">Confirm Password</Label>
                <Input id="confirm-password" type="password" className="bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-primary)]" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-highlight)]"
                  onClick={() => setIsPasswordModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary-hover)]"
                  onClick={() => setIsPasswordModalOpen(false)}
                >
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
