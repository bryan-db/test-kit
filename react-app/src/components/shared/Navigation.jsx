/**
 * Navigation Component - Main navigation for Analytics Dashboards
 * Feature: 004-data-exploration-frontend
 * Task: T038
 *
 * Provides navigation to all 5 dashboard views:
 * - Campaign Performance
 * - Audience Insights
 * - Content Engagement
 * - Attribution Analysis
 * - Data Overview
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Campaign as CampaignIcon,
  People as PeopleIcon,
  Article as ArticleIcon,
  Analytics as AnalyticsIcon,
  Assessment as AssessmentIcon,
  Menu as MenuIcon
} from '@mui/icons-material';

const navigationItems = [
  {
    path: '/dashboards/overview',
    label: 'Data Overview',
    icon: <DashboardIcon />
  },
  {
    path: '/dashboards/campaigns',
    label: 'Campaign Performance',
    icon: <CampaignIcon />
  },
  {
    path: '/dashboards/audience',
    label: 'Audience Insights',
    icon: <PeopleIcon />
  },
  {
    path: '/dashboards/content',
    label: 'Content Engagement',
    icon: <ArticleIcon />
  },
  {
    path: '/dashboards/attribution',
    label: 'Attribution Analysis',
    icon: <AnalyticsIcon />
  }
];

export default function Navigation() {
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo/Title */}
          <AssessmentIcon sx={{ mr: 1, display: { xs: 'none', md: 'flex' } }} />
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/dashboards/overview"
            sx={{
              mr: 4,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none'
            }}
          >
            Marketing Analytics
          </Typography>

          {/* Mobile Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="navigation menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {navigationItems.map((item) => (
                <MenuItem
                  key={item.path}
                  onClick={handleMenuClose}
                  component={Link}
                  to={item.path}
                  selected={isActive(item.path)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {item.icon}
                    <Typography>{item.label}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Mobile Logo */}
          <AssessmentIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/dashboards/overview"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none'
            }}
          >
            Analytics
          </Typography>

          {/* Desktop Navigation */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                startIcon={item.icon}
                sx={{
                  color: 'white',
                  display: 'block',
                  backgroundColor: isActive(item.path) ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* User Menu (placeholder for future user profile) */}
          <Box sx={{ flexGrow: 0 }}>
            {/* Add user profile dropdown here if needed */}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
