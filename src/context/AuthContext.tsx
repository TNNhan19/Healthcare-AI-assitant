import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  _id: string;
  userName: string;
  email: string;
  phone: string;
  address?: string[];
  nickname?: string;
  dob?: string;
  gender?: string;
  defaultAddress?: string;
  paymentMethods?: string[];
  userType?: string;
  profile?: string;
  answer?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  loginWithToken: (token: string, userData?: Partial<User>) => void;
  updateUser: (userData: Partial<User>) => void;
}

interface RegisterData {
  userName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  answer: string;
  nickname?: string;
  dob?: string;
  gender?: string;
  defaultAddress?: string;
  paymentMethods?: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    const userData = localStorage.getItem('user');
    let token = null;
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        if (parsed.usertype === 'client') token = localStorage.getItem('user_token');
        else if (parsed.usertype === 'admin') token = localStorage.getItem('admin_token');
        else if (parsed.usertype === 'pharmacist') token = localStorage.getItem('pharmacist_token');
        setUser(parsed);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user_token');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('pharmacist_token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.success) {
        // Extract usertype from response or JWT, đồng bộ hóa tên trường
        let usertype = data.user.usertype || data.user.userType;
        if (!usertype && data.token) {
          try {
            const payload = JSON.parse(atob(data.token.split('.')[1]));
            usertype = payload.usertype || payload.userType || 'client';
          } catch { usertype = 'client'; }
        }
        if (usertype === 'client') localStorage.setItem('user_token', data.token);
        else if (usertype === 'admin') localStorage.setItem('admin_token', data.token);
        else if (usertype === 'pharmacist') localStorage.setItem('pharmacist_token', data.token);
        // Ghi lại user với usertype đúng, luôn lưu thành 'usertype' để frontend đồng bộ
        const userWithType = { ...data.user, usertype };
        localStorage.setItem('user', JSON.stringify(userWithType));
        setUser(userWithType);
        return true;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  const loginWithToken = (token: string, userData?: Partial<User>) => {
    if (userData && userData.usertype) {
      if (userData.usertype === 'client') localStorage.setItem('user_token', token);
      else if (userData.usertype === 'admin') localStorage.setItem('admin_token', token);
      else if (userData.usertype === 'pharmacist') localStorage.setItem('pharmacist_token', token);
      setUser(userData as User);
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      // Nếu backend trả token JWT chuẩn, bạn có thể decode để lấy ID và usertype:
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.usertype === 'client') localStorage.setItem('user_token', token);
        else if (payload.usertype === 'admin') localStorage.setItem('admin_token', token);
        else if (payload.usertype === 'pharmacist') localStorage.setItem('pharmacist_token', token);
        const minimalUser = { _id: payload.id, usertype: payload.usertype } as User;
        setUser(minimalUser);
        localStorage.setItem('user', JSON.stringify(minimalUser));
      } catch (err) {
        console.error('Failed to parse JWT payload', err);
      }
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      if (data.success) {
        // For registration, we need to login the user after successful registration
        // since the backend doesn't return a token on registration
        const loginSuccess = await login(userData.email, userData.password);
        return loginSuccess;
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        if (parsed.usertype === 'client') localStorage.removeItem('user_token');
        else if (parsed.usertype === 'admin') localStorage.removeItem('admin_token');
        else if (parsed.usertype === 'pharmacist') localStorage.removeItem('pharmacist_token');
      } catch {}
    }
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    loginWithToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 