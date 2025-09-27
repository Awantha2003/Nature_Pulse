import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Badge,
  TextField,
  InputAdornment,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search,
  Notifications,
  Person,
  Logout,
  Dashboard,
  CalendarToday,
  HealthAndSafety,
  People,
  ShoppingCart,
  LocalHospital,
  TrendingUp,
  Security,
  Settings,
  Inventory,
  Assessment,
  Assignment,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import Breadcrumbs from '../Navigation/Breadcrumbs';
import NotificationCenter from '../Notifications/NotificationCenter';

const drawerWidth = 280;

const AuthenticatedShell = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasRole } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleProfileMenuClose();
  };

  const getNavigationItems = () => {
    if (hasRole('patient')) {
      return [
        {
          text: 'Dashboard',
          icon: <Dashboard />,
          path: '/app/patient/dashboard',
          badge: null,
        },
        {
          text: 'Appointments',
          icon: <CalendarToday />,
          path: '/app/patient/appointments',
          badge: null,
        },
        {
          text: 'Health',
          icon: <HealthAndSafety />,
          path: '/app/patient/health',
          badge: null,
        },
        {
          text: 'EDRC',
          icon: <People />,
          path: '/app/patient/edrc',
          badge: null,
        },
        {
          text: 'Shop',
          icon: <ShoppingCart />,
          path: '/app/patient/shop',
          badge: null,
        },
        {
          text: 'Profile',
          icon: <Person />,
          path: '/app/patient/profile',
          badge: null,
        },
      ];
    } else if (hasRole('doctor')) {
      return [
        {
          text: 'Dashboard',
          icon: <Dashboard />,
          path: '/app/doctor/dashboard',
          badge: null,
        },
        {
          text: 'Appointments',
          icon: <CalendarToday />,
          path: '/app/doctor/appointments',
          badge: '3', // Pending requests
        },
        {
          text: 'Patients',
          icon: <People />,
          path: '/app/doctor/patients',
          badge: null,
        },
        {
          text: 'EDRC',
          icon: <TrendingUp />,
          path: '/app/doctor/edrc',
          badge: null,
        },
        {
          text: 'Products',
          icon: <LocalHospital />,
          path: '/app/doctor/products',
          badge: null,
        },
        {
          text: 'Availability',
          icon: <CalendarToday />,
          path: '/app/doctor/availability',
          badge: null,
        },
        {
          text: 'Profile',
          icon: <Person />,
          path: '/app/doctor/profile',
          badge: null,
        },
      ];
    } else if (hasRole('admin')) {
      return [
        {
          text: 'Overview',
          icon: <Dashboard />,
          path: '/app/admin/overview',
          badge: null,
        },
        {
          text: 'Users',
          icon: <People />,
          path: '/app/admin/users',
          badge: '5', // New registrations
        },
        {
          text: 'Moderation',
          icon: <Security />,
          path: '/app/admin/moderation',
          badge: '2', // Flagged content
        },
        {
          text: 'Appointments',
          icon: <CalendarToday />,
          path: '/app/admin/appointments',
          badge: null,
        },
        {
          text: 'Catalog',
          icon: <Inventory />,
          path: '/app/admin/catalog',
          badge: null,
        },
        {
          text: 'Orders',
          icon: <Assignment />,
          path: '/app/admin/orders',
          badge: null,
        },
        {
          text: 'Analytics',
          icon: <Assessment />,
          path: '/app/admin/analytics',
          badge: null,
        },
        {
          text: 'Settings',
          icon: <Settings />,
          path: '/app/admin/settings',
          badge: null,
        },
        {
          text: 'Profile',
          icon: <Person />,
          path: '/app/admin/profile',
          badge: null,
        },
      ];
    }
    return [];
  };

  const navigationItems = getNavigationItems();

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
          Nature Pulse
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) {
                  setMobileOpen(false);
                }
              }}
            >
              <ListItemIcon>
                {item.badge ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'white',
          color: 'text.primary',
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Global Search */}
          <TextField
            size="small"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ 
              minWidth: 300,
              mr: 2,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'grey.50',
              },
            }}
          />
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Notifications */}
          <NotificationCenter />
          
          {/* Role Badge */}
          <Chip
            label={user?.role?.toUpperCase()}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ mr: 2, textTransform: 'uppercase' }}
          />
          
          {/* Profile Menu */}
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="profile-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {user?.firstName?.charAt(0)}
            </Avatar>
          </IconButton>
          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem onClick={() => { 
              navigate(`/app/${user?.role}/profile`); 
              handleProfileMenuClose(); 
            }}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => { 
              navigate(`/app/${user?.role}/profile`); 
              handleProfileMenuClose(); 
            }}>
              <ListItemIcon>
                <Security fontSize="small" />
              </ListItemIcon>
              Security
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        
        {/* Breadcrumbs */}
        <Box sx={{ px: 3, py: 1, bgcolor: 'grey.50' }}>
          <Breadcrumbs />
        </Box>
        
        {/* Main Content */}
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AuthenticatedShell;
