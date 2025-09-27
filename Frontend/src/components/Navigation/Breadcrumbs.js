import React from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography,
  Box,
} from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Breadcrumbs = () => {
  const location = useLocation();
  const { user } = useAuth();

  const getBreadcrumbItems = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    const breadcrumbItems = [];

    // Always start with Home
    breadcrumbItems.push({
      label: 'Home',
      path: '/',
    });

    // Handle app routes
    if (pathnames[0] === 'app') {
      breadcrumbItems.push({
        label: 'App',
        path: '/app',
      });

      if (pathnames[1]) {
        const role = pathnames[1];
        const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
        
        breadcrumbItems.push({
          label: roleLabel,
          path: `/app/${role}`,
        });

        if (pathnames[2]) {
          const section = pathnames[2];
          const sectionLabel = section.charAt(0).toUpperCase() + section.slice(1);
          
          breadcrumbItems.push({
            label: sectionLabel,
            path: `/app/${role}/${section}`,
          });

          // Handle detail pages
          if (pathnames[3] && pathnames[3] !== 'dashboard') {
            if (pathnames[3] === 'details' && pathnames[4]) {
              breadcrumbItems.push({
                label: 'Details',
                path: `/app/${role}/${section}/details/${pathnames[4]}`,
              });
            } else if (pathnames[3] !== 'dashboard') {
              const detailLabel = pathnames[3].charAt(0).toUpperCase() + pathnames[3].slice(1);
              breadcrumbItems.push({
                label: detailLabel,
                path: `/app/${role}/${section}/${pathnames[3]}`,
              });
            }
          }
        }
      }
    } else {
      // Handle public routes
      pathnames.forEach((pathname, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const label = pathname.charAt(0).toUpperCase() + pathname.slice(1);
        
        breadcrumbItems.push({
          label: label,
          path: routeTo,
        });
      });
    }

    return breadcrumbItems;
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <Box>
      <MuiBreadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
      >
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          if (isLast) {
            return (
              <Typography key={item.path} color="text.primary" variant="body2">
                {item.label}
              </Typography>
            );
          }
          
          return (
            <Link
              key={item.path}
              component={RouterLink}
              to={item.path}
              underline="hover"
              color="inherit"
              variant="body2"
            >
              {item.label}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};

export default Breadcrumbs;
