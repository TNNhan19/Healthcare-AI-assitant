import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Search, ShoppingCart, User, Menu, X, Package, Calendar, LogOut, BarChart3, Home, Info, Phone, Bot, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Bell } from 'lucide-react';
import { useEffect } from 'react';
const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { cart, getTotalItems } = useCart();
    const [notifications, setNotifications] = React.useState<any[]>([]);
    const [isNotifOpen, setIsNotifOpen] = React.useState(false);
    const handleLogout = () => {
        logout();
        navigate('/');
    };

        // Helper to get token from common keys
        const getToken = () => {
            return localStorage.getItem('pharmacist_token') || localStorage.getItem('user_token') || localStorage.getItem('admin_token') || localStorage.getItem('token');
        };

        useEffect(() => {
            let ws: WebSocket | null = null;
            let reconnectTimeout: NodeJS.Timeout;
            let mounted = true;

            const connectWebSocket = () => {
                const token = getToken();
                if (!token || !mounted) return;

                const WS_PORT = (import.meta as any).env?.VITE_WS_PORT || 8002;
                ws = new WebSocket(`ws://localhost:${WS_PORT}/?token=${token}`);

                ws.onopen = () => {
                    console.log('Header WS connected');
                    // Fetch initial notifications only when WS connects
                    fetchNotifications();
                };

                ws.onmessage = (ev) => {
                    if (!mounted) return;
                    try {
                        const msg = JSON.parse(ev.data);
                        if (msg && msg.type) {
                            const notif = msg.notification || {};
                            const headerNotif = {
                                id: notif._id || notif.id || `${msg.type}-${Date.now()}`,
                                type: notif.type || msg.type,
                                data: notif.data || msg.data || {},
                                read: !!notif.read,
                                createdAt: notif.createdAt || new Date().toISOString(),
                            };
                            setNotifications(prev => {
                                // Prevent duplicate notifications
                                const exists = prev.some(n => n.id === headerNotif.id);
                                if (exists) return prev;
                                return [headerNotif, ...prev];
                            });
                        }
                    } catch (e) {
                        console.error('Header WS parse error', e);
                    }
                };

                ws.onclose = () => {
                    console.log('Header WS disconnected');
                    if (mounted) {
                        // Try to reconnect after 5 seconds
                        reconnectTimeout = setTimeout(connectWebSocket, 5000);
                    }
                };

                ws.onerror = (e) => {
                    console.error('Header WS error', e);
                };
            };

            const fetchNotifications = async () => {
                if (!mounted) return;
                const token = getToken();
                if (!token) return;

                try {
                    const res = await fetch('/api/v1/notifications', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const json = await res.json();
                    if (json?.success && Array.isArray(json.data) && mounted) {
                        const arr = json.data;
                        setNotifications(arr.map(n => ({
                            id: n._id,
                            type: n.type,
                            data: n.data,
                            read: n.read,
                            createdAt: n.createdAt
                        })));
                    }
                } catch (e) {
                    console.error('Fetch notifications error', e);
                }
            };

            connectWebSocket();

            return () => {
                mounted = false;
                if (reconnectTimeout) {
                    clearTimeout(reconnectTimeout);
                }
                if (ws) {
                    ws.close();
                }
            };
        }, [user]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const navLinks = [
        { to: "/", icon: <Home />, title: "Trang chủ" },
        { to: "/products", icon: <Package />, title: "Sản phẩm" },
        { to: "/health-news", icon: <Info />, title: "Tin tức sức khỏe" }, // Add Health News link
        { to: "/about", icon: <Info />, title: "Giới thiệu" },
        { to: "/contact", icon: <Phone />, title: "Liên hệ" }
    ];

    const userLinks = [
        { to: "/account", icon: <User />, title: "Tài khoản" },
        { to: "/account?tab=orders", icon: <Package />, title: "Đơn hàng" },
        { to: "/account?tab=appointments", icon: <Calendar />, title: "Lịch hẹn" }
    ];

    let roleLinks: { to: string; icon: JSX.Element; title: string }[] = [];

    if (user?.userType === 'admin') {
    roleLinks = [{ to: "/admin", icon: <BarChart3 />, title: "Admin Dashboard" }];
    }
    if (user?.userType === 'pharmacist') {
    roleLinks = [{ to: "/pharmacist", icon: <Bot />, title: "Pharmacist Dashboard" }];
    }

    return (
        <StyledHeader>
            <div className="header-container">
                <Link to="/" className="logo">
                    <div className="logo-icon">HC</div>
                    <span className="logo-text">HealthCare</span>
                </Link>

                <div className="search-wrapper">
                    <form onSubmit={handleSearch} className="search-form">
                        <Search className="search-icon" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </form>
                </div>
                
                <div className="menu">
                    {navLinks.map(link => (
                        <Link to={link.to} key={link.to} className="link">
                            <span className="link-icon">{link.icon}</span>
                            <span className="link-title">{link.title}</span>
                        </Link>
                    ))}
                </div>


                <div className="user-actions">
                    {/* Notifications bell */}
                    <div className="relative mr-4">
                        <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="p-2 rounded hover:bg-gray-100">
                            <Bell />
                            {notifications.length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1">{notifications.filter(n=>!n.read).length}</span>}
                        </button>
                        {isNotifOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg p-2 z-50">
                                <div className="flex items-center justify-between px-2 py-1">
                                    <h4 className="font-semibold">Thông báo</h4>
                                    <button onClick={async () => {
                                        try {
                                            const token = getToken();
                                            if (!token) return;
                                            const res = await fetch('/api/v1/notifications/clear', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
                                            const j = await res.json();
                                            if (j?.success) {
                                                // mark all local as read
                                                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                                            }
                                        } catch (e) { console.error('Clear notifications error', e); }
                                    }} className="text-sm text-blue-600 hover:underline">Clear all</button>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.length === 0 && <div className="text-sm text-gray-500 p-2">Không có thông báo</div>}
                                    {notifications.map((n) => (
                                        <div key={n.id} className={`p-2 border-b last:border-b-0 ${n.read ? 'opacity-70' : 'bg-white'}`}>
                                            <div className="text-sm">{n.type === 'new_order' ? `Đơn mới: ${n.data?.orderNumber || String(n.data?.orderId).slice(-6)}` : `Đơn ${String(n.data?.orderId).slice(-6)}: ${n.data?.orderStatus || ''}`}</div>
                                            <div className="text-xs text-gray-500">{new Date(n.data?.createdAt || Date.now()).toLocaleString('vi-VN')}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="relative group">
                        <Link to="/cart" className="link cart-link">
                            <span className="link-icon"><ShoppingCart /></span>
                            <span className="link-title">Giỏ hàng</span>
                            {getTotalItems() > 0 && <span className="cart-badge">{getTotalItems()}</span>}
                        </Link>

                        {/* Mini cart dropdown */}
                        {cart.length > 0 && (
                            <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg p-4 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all z-50">
                            <h4 className="font-semibold mb-2">Sản phẩm trong giỏ</h4>
                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {cart.map((item) => (
                                <div key={item.id} className="flex items-center space-x-3">
                                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                                    <div className="flex-1">
                                    <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                                    <p className="text-xs text-gray-500">SL: {item.quantity}</p>
                                    </div>
                                    <span className="text-sm font-semibold text-blue-600">
                                    {(item.price * item.quantity).toLocaleString()} đ
                                    </span>
                                </div>
                                ))}
                            </div>
                            <div className="mt-3 text-right">
                                <Link
                                to="/cart"
                                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                Xem giỏ hàng
                                </Link>
                            </div>
                            </div>
                        )}
                        </div>

                    {user ? (
                        <div className="user-menu">
                            <div className="link" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                 <span className="link-icon">
                                    {user?.profile ? (
                                    <img
                                        src={user.profile}
                                        alt="User Avatar"
                                        className="w-6 h-6 rounded-full object-cover"
                                    />
                                    ) : (
                                    <User />
                                    )}
                                </span>
                                <span className="link-title">{user.userName || user.email}</span>
                            </div>
                            {isMenuOpen && (
                                <div className="dropdown-menu">
                                    {[...roleLinks, ...userLinks].map(link => (
                                    <Link key={link.to} to={link.to} className="dropdown-link" onClick={() => setIsMenuOpen(false)}>
                                        {link.icon}<span>{link.title}</span>
                                    </Link>
                                    ))}
                                    <button onClick={handleLogout} className="dropdown-link logout">
                                        <LogOut /><span>Đăng xuất</span>
                                    </button>
                                </div>
                            )}
                        </div>

                    ) : (
                        <>
                            <Link to="/login" className="link">
                                <span className="link-icon"><User /></span>
                                <span className="link-title">Đăng nhập</span>
                            </Link>
                            <Link to="/register" className="link">
                                <span className="link-icon"><UserPlus /></span>
                                <span className="link-title">Đăng ký</span>
                            </Link>
                        </>
                    )}
                </div>

                <div className="mobile-menu-toggle">
                     <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X/> : <Menu/>}
                    </button>
                </div>
            </div>

            {isMenuOpen && (
                <div className="mobile-menu">
                     <form onSubmit={handleSearch} className="search-form">
                        <Search className="search-icon" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </form>
                     {navLinks.map(link => (
                        <Link to={link.to} key={link.to} className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                           {link.icon}<span>{link.title}</span>
                        </Link>
                    ))}
                    <div className="divider" />
                    {user ? userLinks.map(link => (
                        <Link to={link.to} key={link.to} className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                           {link.icon}<span>{link.title}</span>
                        </Link>
                    )) :
                    (<>
                        <Link to="/login" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                            <User /><span>Đăng nhập</span>
                        </Link>
                        <Link to="/register" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                            <UserPlus /><span>Đăng ký</span>
                        </Link>
                    </>)}
                     {user && <button onClick={handleLogout} className="mobile-link logout">
                                <LogOut /><span>Đăng xuất</span>
                             </button>}
                </div>
            )}

        </StyledHeader>
    );
};

const StyledHeader = styled.header`
  background-color: #fff;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 50;

  .header-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 4.5rem;
  }

  .logo {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: inherit;
  }

  .logo-icon {
    width: 2.5rem;
    height: 2.5rem;
    background: linear-gradient(to right, #3b82f6, #16a34a);
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 1rem;
  }

  .logo-text {
    font-size: 1.5rem;
    font-weight: bold;
    margin-left: 0.5rem;
    background: linear-gradient(to right, #3b82f6, #16a34a);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .search-wrapper {
      flex: 1;
      margin: 0 2rem;
      max-width: 600px;
  }

  .search-form {
      position: relative;
  }

  .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
      width: 1rem;
      height: 1rem;
  }

  .search-input {
      width: 100%;
      padding: 0.5rem 2.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      transition: all 0.2s;
      &:focus {
          ring: 2px solid #3b82f6;
          border-color: transparent;
          outline: none;
      }
  }

  .menu {
    padding: 0.5rem;
    background-color: #fff;
    position: relative;
    display: none;
    justify-content: center;
    border-radius: 15px;
    box-shadow: 0 10px 25px 0 rgba(0,0,0, 0.075);

    @media (min-width: 1024px) {
        display: flex;
    }
  }

  .link {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 60px;
    height: 45px;
    border-radius: 8px;
    position: relative;
    z-index: 1;
    overflow: hidden;
    transform-origin: center left;
    transition: width 0.2s ease-in;
    text-decoration: none;
    color: #374151;
    &:before {
      position: absolute;
      z-index: -1;
      content: "";
      display: block;
      border-radius: 8px;
      width: 100%;
      height: 100%;
      top: 0;
      transform: translateX(100%);
      transition: transform 0.2s ease-in;
      transform-origin: center right;
      background-color: #f3f4f6;
    }

    &:hover,
    &:focus {
      outline: 0;
      width: 130px;

      &:before,
      .link-title {
        transform: translateX(0);
        opacity: 1;
      }
    }
  }

  .link-icon {
    width: 24px;
    height: 24px;
    display: block;
    flex-shrink: 0;
    left: 18px;
    position: absolute;
    svg {
      width: 24px;
      height: 24px;
    }
  }

  .link-title {
    transform: translateX(100%);
    transition: transform 0.2s ease-in;
    transform-origin: center right;
    display: block;
    text-align: center;
    text-indent: 20px;
    width: 100%;
    font-size: 0.875rem;
  }
  
  .user-actions {
      display: none;
      align-items: center;
      gap: 0.5rem;
      @media (min-width: 1024px) {
        display: flex;
    }
  }

  .cart-link {
      position: relative;
  }

  .cart-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background-color: #ef4444;
      color: white;
      font-size: 0.75rem;
      width: 1.25rem;
      height: 1.25rem;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: center;
  }

  .user-menu {
      position: relative;
  }
  
  .dropdown-menu {
      position: absolute;
      right: 0;
      margin-top: 0.5rem;
      width: 200px;
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
      border: 1px solid #e5e7eb;
      padding: 0.5rem 0;
      display: flex;
      flex-direction: column;
  }

  .dropdown-link {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      text-decoration: none;
      color: #374151;
      transition: background-color 0.2s;
      
      svg {
          width: 1rem;
          height: 1rem;
          margin-right: 0.75rem;
      }

      &:hover {
          background-color: #f3f4f6;
      }
  }
   .logout {
       color: #ef4444;
       &:hover {
           background-color: #fee2e2;
       }
   }
   
   .mobile-menu-toggle {
       display: block;
       @media (min-width: 1024px) {
           display: none;
       }
       button {
           background: none;
           border: none;
           cursor: pointer;
           padding: 0.5rem;
           svg {
               width: 1.5rem;
               height: 1.5rem;
           }
       }
   }
    
   .mobile-menu {
       padding: 1rem 0;
       border-top: 1px solid #e5e7eb;
       display: flex;
       flex-direction: column;
       gap: 0.5rem;

       @media (min-width: 1024px) {
           display: none;
       }
        
       .search-form {
           margin-bottom: 1rem;
       }

       .mobile-link {
           display: flex;
           align-items: center;
           padding: 0.75rem 1rem;
           text-decoration: none;
           color: #374151;
            border-radius: 0.5rem;
           transition: background-color 0.2s;
            &:hover {
                background-color: #f3f4f6;
            }
            svg {
                width: 1rem;
                height: 1rem;
                margin-right: 0.75rem;
            }
       }

       .divider {
           height: 1px;
           background: #e5e7eb;
           margin: 0.5rem 0;
       }
   }

`;

export default Header;