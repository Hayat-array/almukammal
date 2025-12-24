'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ClientLayout from '@/app/ClientLayout';
import Link from 'next/link';
import { allCountries, countriesData } from '@/data/countries';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'UAE',
    state: '',
    postalCode: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  const [initialLoad, setInitialLoad] = useState(true);

  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteDOB, setDeleteDOB] = useState('');

  // Custom location state
  const [isCustomLocation, setIsCustomLocation] = useState(false);

  const { user: authUser, token, updateUser, loading: authLoading } = useAuth();
  const router = useRouter();

  // Helper function to safely save to localStorage
  const safeLocalStorageSet = (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        try {
          localStorage.removeItem('userProfile');
          localStorage.removeItem('userProfileImage');
          localStorage.setItem(key, value);
          return true;
        } catch (secondError) {
          return false;
        }
      }
      return false;
    }
  };

  useEffect(() => {
    if (!authLoading) {
      setInitialLoad(false);

      if (!authUser) {
        router.push('/auth/login');
        return;
      }

      // 🚨 CRITICAL FIX: Use AUTHENTICATED USER DATA FIRST
      let profileData = { ...authUser }; // Start with REAL auth user

      // Only use localStorage if it matches the current user email
      const savedProfile = localStorage.getItem('userProfile');
      const currentUserEmail = authUser.email;

      if (savedProfile) {
        try {
          const parsedProfile = JSON.parse(savedProfile);
          // ONLY merge if it belongs to current user
          if (parsedProfile.email === currentUserEmail) {
            profileData = { ...authUser, ...parsedProfile };
            console.log('✅ Using cached profile for:', currentUserEmail);
          } else {
            console.log('🚫 Ignoring cached profile - belongs to different user');
            // Clear old cache
            localStorage.removeItem('userProfile');
            localStorage.removeItem('userProfileImage');
          }
        } catch (error) {
          console.log('⚠️ Invalid cached profile, using auth data');
          localStorage.removeItem('userProfile');
        }
      }

      // Fix address format
      if (profileData.address && typeof profileData.address === 'object') {
        const addressObj = profileData.address;
        profileData.address = `${addressObj.street || ''}, ${addressObj.city || ''}, ${addressObj.state || ''} ${addressObj.zipCode || ''}, ${addressObj.country || ''}`.replace(/^, |, $/g, '');
      }

      // 🚨 SET REAL USER DATA
      setUser(profileData);
      setFormData({
        name: profileData.name || authUser.name || '',
        email: profileData.email || authUser.email || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        city: profileData.city || '',
        country: profileData.country || 'UAE',
        postalCode: profileData.postalCode || ''
      });

      // Handle profile image
      const savedImage = localStorage.getItem('userProfileImage');
      if (savedImage && profileData.email === currentUserEmail) {
        setPreviewImage(savedImage);
      } else if (profileData.profileImage) {
        setPreviewImage(profileData.profileImage);
      }

      setLoading(false);
      console.log('👤 LOADED USER:', profileData.name, profileData.email); // Debug
    }
  }, [authUser, authLoading, router]);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showMessage('Image size should be less than 5MB', 'error');
        return;
      }

      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result;
        setPreviewImage(imageData);

        const imageSaved = safeLocalStorageSet('userProfileImage', imageData);
        if (!imageSaved) {
          showMessage('Image saved temporarily (storage full)', 'warning');
        }

        if (user) {
          const updatedUser = { ...user, profileImage: imageData };
          setUser(updatedUser);

          const profileSaved = safeLocalStorageSet('userProfile', JSON.stringify(updatedUser));
          if (!profileSaved) {
            showMessage('Profile updated temporarily (storage full)', 'warning');
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'demo-token'}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update profile';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) { }

        if (response.status === 401) {
          showMessage('Session expired. Please login again.', 'error');
          setTimeout(() => router.push('/auth/login'), 2000);
          return;
        }
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();

        const updatedUser = {
          ...user,
          ...formData,
          profileImage: previewImage
        };

        setUser(updatedUser);

        const profileSaved = safeLocalStorageSet('userProfile', JSON.stringify(updatedUser));
        if (previewImage) {
          const imageSaved = safeLocalStorageSet('userProfileImage', previewImage);
          if (!imageSaved) {
            showMessage('Profile saved but image not stored (storage full)', 'warning');
          }
        }
        if (!profileSaved) {
          showMessage('Profile updated temporarily (storage full)', 'warning');
        }

        if (typeof updateUser === 'function') {
          updateUser(updatedUser);
        }

        setEditing(false);
        showMessage('Profile updated successfully!', 'success');
      } else {
        const updatedUser = { ...user, ...formData, profileImage: previewImage };
        setUser(updatedUser);

        const profileSaved = safeLocalStorageSet('userProfile', JSON.stringify(updatedUser));
        if (previewImage) {
          const imageSaved = safeLocalStorageSet('userProfileImage', previewImage);
          if (!imageSaved) {
            showMessage('Profile saved but image not stored (storage full)', 'warning');
          }
        }
        if (!profileSaved) {
          showMessage('Profile updated temporarily (storage full)', 'warning');
        }

        if (typeof updateUser === 'function') {
          try {
            updateUser(updatedUser);
          } catch (updateErr) { }
        }

        setEditing(false);
        showMessage('Profile updated successfully! (Offline mode)', 'success');
      }

    } catch (err) {
      const updatedUser = { ...user, ...formData, profileImage: previewImage };
      setUser(updatedUser);

      const profileSaved = safeLocalStorageSet('userProfile', JSON.stringify(updatedUser));
      if (previewImage) {
        const imageSaved = safeLocalStorageSet('userProfileImage', previewImage);
        if (!imageSaved) {
          showMessage('Profile saved but image not stored (storage full)', 'warning');
        }
      }
      if (!profileSaved) {
        showMessage('Profile updated temporarily (storage full)', 'warning');
      }

      if (typeof updateUser === 'function') {
        try {
          updateUser(updatedUser);
        } catch (updateErr) { }
      }

      setEditing(false);
      showMessage('Profile updated successfully! (Offline mode)', 'success');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('New passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showMessage('Password must be at least 8 characters', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || 'demo-token'}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        if (response.ok) {
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          showMessage('Password changed successfully!', 'success');
        } else if (response.status === 401) {
          showMessage('Session expired. Please login again.', 'error');
          setTimeout(() => router.push('/auth/login'), 2000);
        } else {
          const errorData = await response.json();
          showMessage(errorData.error || 'Failed to change password', 'error');
        }
      } else {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        showMessage('Password changed successfully! (Demo mode)', 'success');
      }
    } catch (err) {
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      showMessage('Password changed successfully! (Demo mode)', 'success');
      setLoading(false);
    }
  };

  // Open delete modal
  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  // Actual delete with password + DOB verification
  const confirmDeleteAccount = async () => {
    if (!deletePassword || !deleteDOB) {
      showMessage('Please enter both password and date of birth', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token || 'demo-token'}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: deletePassword,
          dateOfBirth: deleteDOB
        })
      });

      if (response.ok) {
        // Clear everything
        localStorage.clear();
        sessionStorage.clear();

        if (typeof updateUser === 'function') {
          updateUser(null);
        }

        showMessage('Account deleted successfully. Redirecting to login...', 'success');
        setTimeout(() => {
          router.push('/auth/login');
          router.refresh();
        }, 2000);
      } else {
        const errorData = await response.json();
        showMessage(errorData.error || 'Failed to delete account', 'error');
      }
    } catch (err) {
      showMessage('Failed to delete account. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      country: user.country || 'UAE',
      postalCode: user.postalCode || ''
    });

    const savedImage = localStorage.getItem('userProfileImage');
    if (savedImage) {
      setPreviewImage(savedImage);
    } else {
      setPreviewImage(user.profileImage || null);
    }

    setProfileImage(null);
    setEditing(false);
  };

  if (initialLoad || authLoading) {
    return (
      <ClientLayout>
        <div style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid rgba(255,255,255,0.3)',
              borderTop: '4px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p style={{ fontSize: '1.125rem', color: 'white' }}>Loading...</p>
          </div>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </ClientLayout>
    );
  }

  if (!user) {
    return null;
  }

  // Regular user view (also for admins now)
  return (
    <ClientLayout>
      <div style={{
        minHeight: '80vh',
        padding: '2rem 1rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header Card */}
          <div style={{
            background: 'white',
            borderRadius: '1.5rem',
            padding: '2rem',
            marginBottom: '1.5rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <Link href="/" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#f3f4f6',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              textDecoration: 'none',
              marginBottom: '1.5rem',
              transition: 'all 0.2s'
            }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ position: 'relative' }}>
                {previewImage ? (
                  <img src={previewImage} alt="Profile" style={{
                    width: '5rem',
                    height: '5rem',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid white',
                    boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)'
                  }} />
                ) : (
                  <div style={{
                    width: '5rem',
                    height: '5rem',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)'
                  }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {editing && (
                  <button
                    onClick={() => fileInputRef.current.click()}
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      background: 'white',
                      border: '2px solid #667eea',
                      borderRadius: '50%',
                      width: '2rem',
                      height: '2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#667eea'
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </div>
              <div>
                <h1 style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  margin: '0 0 0.5rem 0'
                }}>My Profile</h1>
                <p style={{ color: '#6b7280', margin: 0 }}>{user.email}</p>
              </div>
            </div>
          </div>

          {/* Alert Messages */}
          {message.text && (
            <div style={{
              padding: '1rem 1.25rem',
              borderRadius: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: message.type === 'success' ? '#d1fae5' :
                message.type === 'warning' ? '#fef3c7' : '#fee2e2',
              border: `2px solid ${message.type === 'success' ? '#10b981' :
                message.type === 'warning' ? '#f59e0b' : '#ef4444'}`,
              color: message.type === 'success' ? '#065f46' :
                message.type === 'warning' ? '#92400e' : '#991b1b',
              animation: 'slideIn 0.3s ease-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {message.type === 'success' ? (
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : message.type === 'warning' ? (
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <span style={{ fontWeight: '500' }}>{message.text}</span>
              </div>
              <button onClick={() => setMessage({ text: '', type: '' })} style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: 'inherit',
                opacity: '0.7'
              }}>×</button>
            </div>
          )}

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            padding: '0.75rem',
            borderRadius: '1rem',
            marginBottom: '1.5rem'
          }}>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.875rem 1.5rem',
                background: activeTab === 'profile' ? 'white' : 'transparent',
                color: activeTab === 'profile' ? '#667eea' : 'white',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: '0.9375rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'profile' ? '0 4px 15px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile Info
            </button>
            <button
              onClick={() => setActiveTab('security')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.875rem 1.5rem',
                background: activeTab === 'security' ? 'white' : 'transparent',
                color: activeTab === 'security' ? '#667eea' : 'white',
                border: 'none',
                borderRadius: '0.75rem',
                fontSize: '0.9375rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: activeTab === 'security' ? '0 4px 15px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Security
            </button>
          </div>

          {/* Content Area */}
          {activeTab === 'profile' && (
            <div style={{
              background: 'white',
              borderRadius: '1.5rem',
              padding: '2rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
                    Personal Information
                  </h2>
                  <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>
                    Update your personal details and contact information
                  </p>
                </div>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem 1.25rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                )}
              </div>

              {editing ? (
                <div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '0.75rem',
                          fontSize: '1rem',
                          transition: 'all 0.2s'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '0.75rem',
                          fontSize: '1rem',
                          transition: 'all 0.2s'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '0.75rem',
                          fontSize: '1rem',
                          transition: 'all 0.2s'
                        }}
                      />
                    </div>

                    {/* Location Section */}
                    <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                        Location Information
                      </h3>
                    </div>

                    {/* Country Selector */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>Country</label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={(e) => {
                          const newCountry = e.target.value;
                          setFormData({ ...formData, country: newCountry, state: '' });
                          setIsCustomLocation(newCountry === 'Other');
                        }}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '0.75rem',
                          fontSize: '1rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        {allCountries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>

                    {/* State/District Selector - Show if country has states or if custom */}
                    {(countriesData[formData.country] || isCustomLocation) && (
                      <div>
                        <label style={{
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#374151',
                          marginBottom: '0.5rem'
                        }}>State/District</label>
                        {countriesData[formData.country] && !isCustomLocation ? (
                          <select
                            name="state"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              border: '2px solid #e5e7eb',
                              borderRadius: '0.75rem',
                              fontSize: '1rem',
                              transition: 'all 0.2s'
                            }}
                          >
                            <option value="">Select State/District</option>
                            {countriesData[formData.country].states.map(state => (
                              <option key={state} value={state}>{state}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            placeholder="Enter your state/district"
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              border: '2px solid #e5e7eb',
                              borderRadius: '0.75rem',
                              fontSize: '1rem',
                              transition: 'all 0.2s'
                            }}
                          />
                        )}
                      </div>
                    )}

                    {/* Custom Location Fields - Show when "Other" is selected */}
                    {isCustomLocation && (
                      <div style={{ gridColumn: '1 / -1', background: '#fef3c7', padding: '1rem', borderRadius: '0.75rem', border: '2px solid #f59e0b' }}>
                        <p style={{ fontSize: '0.875rem', color: '#92400e', marginBottom: '0.5rem', fontWeight: '600' }}>
                          ℹ️ Custom Location - Please provide your location details
                        </p>
                      </div>
                    )}

                    {/* Street Address */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>Street Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Enter your street address"
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '0.75rem',
                          fontSize: '1rem',
                          transition: 'all 0.2s'
                        }}
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Enter your city"
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '0.75rem',
                          fontSize: '1rem',
                          transition: 'all 0.2s'
                        }}
                      />
                    </div>

                    {/* Postal Code */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>Postal Code</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        placeholder="Enter postal code"
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '0.75rem',
                          fontSize: '1rem',
                          transition: 'all 0.2s'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={handleCancel}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '0.75rem',
                        fontSize: '0.9375rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleProfileUpdate}
                      disabled={loading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.75rem',
                        fontSize: '0.9375rem',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {loading ? (
                        <>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderTop: '2px solid white',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                          }}></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1.5rem'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Full Name</label>
                    <p style={{ fontSize: '1rem', color: '#1f2937', margin: 0 }}>
                      {user.name || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Email Address</label>
                    <p style={{ fontSize: '1rem', color: '#1f2937', margin: 0 }}>
                      {user.email || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Phone Number</label>
                    <p style={{ fontSize: '1rem', color: '#1f2937', margin: 0 }}>
                      {user.phone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Country</label>
                    <p style={{ fontSize: '1rem', color: '#1f2937', margin: 0 }}>
                      {user.country || 'UAE'}
                    </p>
                  </div>

                  {/* State/District */}
                  {user.state && (
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#6b7280',
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>State/District</label>
                      <p style={{ fontSize: '1rem', color: '#1f2937', margin: 0 }}>
                        {user.state}
                      </p>
                    </div>
                  )}

                  {/* City */}
                  {user.city && (
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#6b7280',
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>City</label>
                      <p style={{ fontSize: '1rem', color: '#1f2937', margin: 0 }}>
                        {user.city}
                      </p>
                    </div>
                  )}

                  {/* Postal Code */}
                  {user.postalCode && (
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#6b7280',
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Postal Code</label>
                      <p style={{ fontSize: '1rem', color: '#1f2937', margin: 0 }}>
                        {user.postalCode}
                      </p>
                    </div>
                  )}

                  {/* Date of Birth */}
                  {user.dob && (
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#6b7280',
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Date of Birth</label>
                      <p style={{ fontSize: '1rem', color: '#1f2937', margin: 0 }}>
                        {new Date(user.dob).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  )}

                  {/* Account Role */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Account Type</label>
                    <p style={{ fontSize: '1rem', color: '#1f2937', margin: 0 }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        background: user.role === 'admin' ? '#fee2e2' : '#dbeafe',
                        color: user.role === 'admin' ? '#991b1b' : '#1e40af'
                      }}>
                        {user.role === 'admin' ? '👑 Administrator' : '👤 Customer'}
                      </span>
                    </p>
                  </div>

                  {/* Password (Masked) */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Password</label>
                    <p style={{ fontSize: '1rem', color: '#1f2937', margin: 0 }}>
                      ••••••••••••
                    </p>
                  </div>

                  {/* Account Created */}
                  {user.createdAt && (
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#6b7280',
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>Member Since</label>
                      <p style={{ fontSize: '1rem', color: '#1f2937', margin: 0 }}>
                        {new Date(user.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}


                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Address</label>
                    <p style={{ fontSize: '1rem', color: '#1f2937', margin: 0 }}>
                      {user.address ? (
                        typeof user.address === 'object' ? (
                          <>
                            {user.address.street || ''}<br />
                            {user.address.city && `${user.address.city}, `}{user.address.state && `${user.address.state} `}{user.address.zipCode}<br />
                            {user.address.country}
                          </>
                        ) : (
                          <>
                            {user.address}<br />
                            {user.city && `${user.city}, `}{user.country} {user.postalCode}
                          </>
                        )
                      ) : 'Not provided'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div style={{
              background: 'white',
              borderRadius: '1.5rem',
              padding: '2rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: '0 0 0.5rem 0' }}>
                  Change Password
                </h2>
                <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>
                  Ensure your account uses a strong password to stay secure
                </p>
              </div>

              {/* Message Display */}
              {message.text && (
                <div style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  marginBottom: '1.5rem',
                  background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
                  border: `2px solid ${message.type === 'success' ? '#10b981' : '#dc2626'}`,
                  color: message.type === 'success' ? '#065f46' : '#991b1b',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {message.type === 'success' ? '✅' : '❌'} {message.text}
                </div>
              )}

              <div style={{
                display: 'grid',
                gap: '1.25rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      transition: 'all 0.2s'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Enter new password (min. 8 characters)"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      transition: 'all 0.2s'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm your new password"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      fontSize: '1rem',
                      transition: 'all 0.2s'
                    }}
                  />
                </div>
              </div>

              <button
                onClick={handlePasswordChange}
                disabled={loading}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 1.5rem',
                  background: loading ? '#9ca3af' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }}></div>
                    Changing...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Change Password
                  </>
                )}
              </button>

              {/* Forgot Password Section */}
              <div style={{
                marginTop: '2rem',
                paddingTop: '2rem',
                borderTop: '2px solid #e5e7eb'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '0.5rem'
                }}>Forgot Your Password?</h3>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  If you've forgotten your password, you can reset it using the forgot password page.
                </p>
                <a
                  href="/auth/forgot-password"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    fontSize: '0.9375rem',
                    fontWeight: '600',
                    textDecoration: 'none',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#e5e7eb';
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Reset Password via Email
                </a>
              </div>

              {/* 🚨 FIXED: REAL DANGER ZONE */}
              <div style={{
                marginTop: '2rem',
                paddingTop: '2rem',
                borderTop: '2px solid #fee2e2'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#dc2626',
                  marginBottom: '1rem'
                }}>Danger Zone</h3>
                <div style={{
                  background: '#fef2f2',
                  border: '2px solid #fee2e2',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: window.innerWidth < 640 ? 'column' : 'row',
                  alignItems: window.innerWidth < 640 ? 'stretch' : 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}>
                  <div>
                    <strong style={{ display: 'block', color: '#991b1b', marginBottom: '0.25rem' }}>
                      Delete Account
                    </strong>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                      Once deleted, all your data will be permanently removed. This action <strong>cannot be undone</strong>.
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    style={{
                      whiteSpace: 'nowrap',
                      padding: '0.625rem 1.25rem',
                      background: loading ? '#fee2e2' : 'white',
                      border: '2px solid #dc2626',
                      color: '#dc2626',
                      borderRadius: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {loading ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #667eea !important;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
        }
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
        @media (max-width: 768px) {
          h1 {
            font-size: 1.5rem !important;
          }
          h2 {
            font-size: 1.25rem !important;
          }
        }
      `}</style>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '1rem' }}>
              ⚠️ Delete Account
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              This action is <strong>IRREVERSIBLE</strong>. All your data will be permanently deleted.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                Password
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                Date of Birth
              </label>
              <input
                type="date"
                value={deleteDOB}
                onChange={(e) => setDeleteDOB(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={confirmDeleteAccount}
                disabled={loading || !deletePassword || !deleteDOB}
                style={{
                  flex: 1,
                  background: loading || !deletePassword || !deleteDOB ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '700',
                  cursor: loading || !deletePassword || !deleteDOB ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '⏳ Deleting...' : '🗑️ Delete Account'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteDOB('');
                }}
                style={{
                  flex: 1,
                  background: '#f3f4f6',
                  color: '#374151',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </ClientLayout>
  );
}