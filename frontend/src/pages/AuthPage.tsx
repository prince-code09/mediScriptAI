import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../services/supabaseClient';
import { apiClient } from '../services/apiClient';
import { 
  Stethoscope, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  ArrowRight, 
  CheckCircle2,
  KeyRound,
  Loader2,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { setUser, setCurrentPage, showToast, isPasswordRecovery, setIsPasswordRecovery } = useApp();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string>('');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [confirmNotice, setConfirmNotice] = useState(false);

  // Password Reset / Recovery state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'verify' | 'success'>('request');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Automatically activate recovery mode if redirected via email reset link
  useEffect(() => {
    if (isPasswordRecovery) {
      setShowResetModal(true);
      setResetStep('verify');
    }
  }, [isPasswordRecovery]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Field validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!email.trim() || !email.includes('@')) {
      errs.email = 'Valid email address is required';
    }
    if (!password || password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    if (!isLogin && !doctorName.trim()) {
      errs.doctorName = 'Full doctor name is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Email / Password Submit via Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setConfirmNotice(false);
    if (!validate()) return;

    setLoading(true);

    try {
      if (isLogin) {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (error) {
          setAuthError(error.message);
          showToast(error.message, 'error');
          setLoading(false);
          return;
        }

        if (data.session) {
          apiClient.setAuthToken(data.session.access_token);
          const docName = data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Doctor';
          setUser({
            email: data.user.email || email,
            name: docName,
            isLoggedIn: true
          });
          showToast(`Welcome back, ${docName}!`, 'success');
          setCurrentPage('home');
        }
      } else {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: doctorName.trim()
            }
          }
        });

        if (error) {
          setAuthError(error.message);
          showToast(error.message, 'error');
          setLoading(false);
          return;
        }

        if (data.session) {
          apiClient.setAuthToken(data.session.access_token);
          setUser({
            email: data.user?.email || email,
            name: doctorName.trim(),
            isLoggedIn: true
          });
          showToast('Practitioner account created and logged in!', 'success');
          setCurrentPage('home');
        } else if (data.user) {
          setConfirmNotice(true);
          showToast('Account created! Please check your email to confirm registration.', 'info');
        }
      }
    } catch (err: any) {
      console.error('Supabase Auth error:', err);
      setAuthError(err.message || 'Authentication failed. Please verify credentials or connection.');
    } finally {
      setLoading(false);
    }
  };

  // Continue with Google via Supabase OAuth
  const handleGoogleSignIn = async () => {
    setAuthError('');
    setGoogleLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        console.warn('Google OAuth error from Supabase:', error);
        setAuthError(error.message);
        showToast(error.message, 'error');
        setGoogleLoading(false);
      }
    } catch (err: any) {
      console.error('Google OAuth exception:', err);
      setAuthError(err.message || 'Google sign-in failed. Please verify connection.');
      setGoogleLoading(false);
    }
  };

  // Dispatch password reset email with magic link & OTP
  const handleSendReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setResetError('');
    const targetEmail = (resetEmail || email).trim();
    if (!targetEmail.includes('@') || !targetEmail.includes('.')) {
      setResetError('Please enter a valid clinical email address.');
      showToast('Valid email required for password reset', 'error');
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: `${window.location.origin}/`
      });

      if (error) {
        setResetError(error.message);
        showToast(error.message, 'error');
      } else {
        setResetEmail(targetEmail);
        setResetStep('verify');
        setResendCooldown(30);
        showToast(`Reset link & 6-digit OTP sent to ${targetEmail}`, 'info');
      }
    } catch (err: any) {
      setResetError(err.message || 'Password reset request failed.');
      showToast('Password reset request failed', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  // Verify OTP and update password in Supabase
  const handleVerifyAndResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (!newPassword || newPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setResetError('Passwords do not match. Please re-enter.');
      return;
    }

    // If not a direct email-link recovery session, require OTP token
    if (!isPasswordRecovery && (!resetOtp.trim() || resetOtp.trim().length < 6)) {
      setResetError('Please enter the 6-digit OTP code sent to your email.');
      return;
    }

    setResetLoading(true);
    try {
      // Step 1: If OTP flow, verify the OTP with Supabase
      if (!isPasswordRecovery) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          email: resetEmail.trim(),
          token: resetOtp.trim(),
          type: 'recovery'
        });

        if (otpError) {
          setResetError(`OTP verification failed: ${otpError.message}. Please check your 6-digit code or click Resend.`);
          showToast(otpError.message, 'error');
          setResetLoading(false);
          return;
        }
      }

      // Step 2: Now that session is authenticated via recovery, update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        setResetError(`Failed to save new password: ${updateError.message}`);
        showToast(updateError.message, 'error');
      } else {
        setResetStep('success');
        setIsPasswordRecovery(false);
        showToast('Password successfully reset! You can now sign in.', 'success');
        if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    } catch (err: any) {
      setResetError(err.message || 'Failed to update password.');
      showToast('Password update failed', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  const handleCloseResetModal = () => {
    if (resetLoading) return;
    setShowResetModal(false);
    setResetStep('request');
    setResetOtp('');
    setNewPassword('');
    setConfirmNewPassword('');
    setResetError('');
    setIsPasswordRecovery(false);
  };

  return (
    <div 
      style={{
        minHeight: '100vh',
        background: 'var(--bg-main)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}
    >
      <div 
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.25rem',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div 
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--ai-violet) 0%, var(--primary-navy) 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              marginBottom: '0.75rem',
              boxShadow: '0 4px 14px rgba(118, 103, 248, 0.35)'
            }}
          >
            <Stethoscope size={28} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
            MediScript
          </h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
            {isLogin ? 'Clinical Portal Doctor Login' : 'Register New Practitioner Account'}
          </p>
        </div>

        {/* Auth Error Banner */}
        {authError && (
          <div 
            style={{
              padding: '10px 12px',
              marginBottom: '1.25rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#DC2626',
              fontSize: '0.82rem',
              lineHeight: 1.45
            }}
          >
            {authError}
          </div>
        )}

        {/* Email confirmation notice */}
        {confirmNotice && (
          <div 
            style={{
              padding: '10px 12px',
              marginBottom: '1.25rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#059669',
              fontSize: '0.84rem'
            }}
          >
            Confirmation email sent to <strong>{email}</strong>. Please check your inbox and click the verification link to complete registration.
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          style={{
            width: '100%',
            padding: '0.7rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-card-subtle)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '1.25rem'
          }}
        >
          {googleLoading ? (
            <Loader2 size={18} className="spin-icon" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '1.25rem',
            color: 'var(--text-muted)',
            fontSize: '0.78rem'
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span>or sign in with email</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Doctor Full Name & Degree *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Enter doctor's full name & degree"
                  autoComplete="name"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  style={{ width: '100%', paddingLeft: '34px' }}
                />
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              {errors.doctorName && <span style={{ fontSize: '0.75rem', color: '#DC2626' }}>{errors.doctorName}</span>}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Clinical Email Address *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', paddingLeft: '34px' }}
              />
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            {errors.email && <span style={{ fontSize: '0.75rem', color: '#DC2626' }}>{errors.email}</span>}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Password *
              </label>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email.trim());
                    setResetStep('request');
                    setResetError('');
                    setResetOtp('');
                    setShowResetModal(true);
                  }}
                  style={{ fontSize: '0.76rem', color: 'var(--ai-violet)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: '34px', paddingRight: '36px' }}
              />
              <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span style={{ fontSize: '0.75rem', color: '#DC2626' }}>{errors.password}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '0.75rem', marginTop: '0.5rem', width: '100%' }}
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={16} className="spin-icon" />
            ) : (
              <>
                <span>{isLogin ? 'Sign In to Clinic' : 'Create Doctor Account'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Toggle between login and signup */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {isLogin ? "Don't have an account yet? " : "Already registered? "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrors({});
              setAuthError('');
            }}
            style={{ fontWeight: 700, color: 'var(--primary-navy)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {isLogin ? 'Sign up here' : 'Sign in here'}
          </button>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000
          }}
          onClick={handleCloseResetModal}
        >
          <div 
            className="card"
            style={{ width: '100%', maxWidth: '440px', padding: '1.75rem', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(118, 103, 248, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ai-violet)'
                }}
              >
                <KeyRound size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {resetStep === 'request' && 'Reset Doctor Password'}
                  {resetStep === 'verify' && (isPasswordRecovery ? 'Set New Account Password' : 'Enter OTP & Set Password')}
                  {resetStep === 'success' && 'Password Updated!'}
                </h3>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Secure Supabase Clinical Auth Recovery
                </span>
              </div>
            </div>

            {/* Error Notification */}
            {resetError && (
              <div 
                style={{
                  padding: '8px 12px',
                  marginBottom: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#DC2626',
                  fontSize: '0.8rem',
                  lineHeight: 1.45
                }}
              >
                {resetError}
              </div>
            )}

            {/* STEP 1: Request Email */}
            {resetStep === 'request' && (
              <form onSubmit={handleSendReset}>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  Enter your registered clinical email. We will immediately dispatch a password recovery link and a 6-digit OTP code to your inbox.
                </p>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                    Doctor Clinical Email *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      placeholder="e.g. dr.verma@mediscript.in"
                      autoComplete="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      style={{ width: '100%', paddingLeft: '34px' }}
                      required
                      autoFocus
                    />
                    <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', fontSize: '0.78rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!resetEmail) setResetEmail(email.trim());
                      setResetStep('verify');
                    }}
                    style={{ color: 'var(--ai-violet)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Already have a 6-digit OTP? Enter Code →
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" onClick={handleCloseResetModal} className="btn btn-secondary btn-sm" disabled={resetLoading}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={resetLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {resetLoading ? (
                      <>
                        <Loader2 size={14} className="spin-icon" />
                        <span>Sending Link & OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Reset Link & OTP</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Verify OTP & Enter New Password */}
            {resetStep === 'verify' && (
              <form onSubmit={handleVerifyAndResetPassword}>
                <div 
                  style={{
                    padding: '8px 12px',
                    marginBottom: '1.15rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    fontSize: '0.8rem',
                    color: 'var(--text-primary)',
                    lineHeight: 1.45
                  }}
                >
                  {isPasswordRecovery ? (
                    <span>Email recovery link confirmed. Please enter your new password below.</span>
                  ) : (
                    <span>
                      Reset link & OTP dispatched to <strong>{resetEmail}</strong>. Please check your inbox (and spam/junk folder).
                    </span>
                  )}
                </div>

                {/* 6-Digit OTP Field (Skipped if came via recovery link) */}
                {!isPasswordRecovery && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        6-Digit Email OTP Code *
                      </label>
                      <button
                        type="button"
                        onClick={() => handleSendReset()}
                        disabled={resendCooldown > 0 || resetLoading}
                        style={{
                          fontSize: '0.74rem',
                          color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--ai-violet)',
                          fontWeight: 600,
                          background: 'none',
                          border: 'none',
                          cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <RotateCcw size={11} className={resetLoading ? 'spin-icon' : undefined} />
                        <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Link / OTP'}</span>
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="123456"
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value)}
                        maxLength={8}
                        style={{ width: '100%', paddingLeft: '34px', letterSpacing: '3px', fontWeight: 700 }}
                        required
                        autoFocus
                      />
                      <KeyRound size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                  </div>
                )}

                {/* New Password */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                    New Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{ width: '100%', paddingLeft: '34px', paddingRight: '36px' }}
                      required
                    />
                    <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                    Confirm New Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      style={{ width: '100%', paddingLeft: '34px' }}
                      required
                    />
                    <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {!isPasswordRecovery && (
                    <button
                      type="button"
                      onClick={() => setResetStep('request')}
                      className="btn btn-secondary btn-sm"
                      disabled={resetLoading}
                    >
                      Back
                    </button>
                  )}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={handleCloseResetModal} className="btn btn-secondary btn-sm" disabled={resetLoading}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={resetLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {resetLoading ? (
                        <>
                          <Loader2 size={14} className="spin-icon" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <span>{isPasswordRecovery ? 'Save New Password' : 'Verify OTP & Reset'}</span>
                          <CheckCircle2 size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* STEP 3: Success Screen */}
            {resetStep === 'success' && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.12)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10B981',
                    marginBottom: '1rem'
                  }}
                >
                  <CheckCircle2 size={32} />
                </div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  Password Reset Successfully!
                </h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
                  Your practitioner password has been saved in Supabase. You can now sign into your clinic portal with your new password.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleCloseResetModal();
                    setIsLogin(true);
                    if (resetEmail) setEmail(resetEmail);
                    setPassword('');
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.7rem' }}
                >
                  Sign In to Clinic
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
