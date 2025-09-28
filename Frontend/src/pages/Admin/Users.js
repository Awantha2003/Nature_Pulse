import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  IconButton,
  Divider,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Fade,
  Zoom,
  Slide,
  Autocomplete,
  Badge,
  Tooltip,
  Menu,
  MenuList,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Delete,
  Add,
  Search,
  FilterList,
  MoreVert,
  Person,
  Email,
  Phone,
  LocationOn,
  CalendarToday,
  Security,
  CheckCircle,
  Warning,
  Info,
  Block,
  LockOpen as Unblock,
  AdminPanelSettings,
  MedicalServices,
  People,
  Visibility,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  LockOpen as UnblockIcon,
  Assessment,
  GetApp,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const AdminUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, userId: null, userName: '' });
  const [editDialog, setEditDialog] = useState({ open: false, user: null });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reportDialog, setReportDialog] = useState({ open: false });
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(response.data.data.users);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to fetch users',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.isActive : !user.isActive
      );
    }

    setFilteredUsers(filtered);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleRoleFilterChange = (event) => {
    setRoleFilter(event.target.value);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleEditUser = (user) => {
    setEditDialog({ open: true, user: { ...user } });
    handleMenuClose();
  };

  const handleDeleteUser = (user) => {
    setDeleteDialog({ 
      open: true, 
      userId: user._id, 
      userName: `${user.firstName} ${user.lastName}` 
    });
    handleMenuClose();
  };

  const handleToggleUserStatus = async (user) => {
    try {
      setSaving(true);
      const response = await api.put(`/admin/users/${user._id}/status`, {
        isActive: !user.isActive
      });

      if (response.data.status === 'success') {
        setUsers(prev => prev.map(u => 
          u._id === user._id ? { ...u, isActive: !u.isActive } : u
        ));
        setSnackbar({
          open: true,
          message: `User ${!user.isActive ? 'activated' : 'deactivated'} successfully`,
          severity: 'success',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update user status',
        severity: 'error',
      });
    } finally {
      setSaving(false);
      handleMenuClose();
    }
  };

  const handleSaveUser = async () => {
    try {
      setSaving(true);
      const response = await api.put(`/admin/users/${editDialog.user._id}`, editDialog.user);

      if (response.data.status === 'success') {
        setUsers(prev => prev.map(u => 
          u._id === editDialog.user._id ? editDialog.user : u
        ));
        setEditDialog({ open: false, user: null });
        setSnackbar({
          open: true,
          message: 'User updated successfully',
          severity: 'success',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update user',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setSaving(true);
      await api.delete(`/admin/users/${deleteDialog.userId}`);

      setUsers(prev => prev.filter(u => u._id !== deleteDialog.userId));
      setDeleteDialog({ open: false, userId: null, userName: '' });
      setSnackbar({
        open: true,
        message: 'User deleted successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to delete user',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <AdminPanelSettings color="error" />;
      case 'doctor':
        return <MedicalServices color="info" />;
      case 'patient':
        return <People color="primary" />;
      default:
        return <Person color="default" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'doctor':
        return 'info';
      case 'patient':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'success' : 'error';
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Active' : 'Inactive';
  };

  // Report Generation Functions
  const generateCSVReport = () => {
    try {
      setReportLoading(true);
      
      // Prepare CSV headers
      const headers = ['Name', 'Email', 'Role', 'Status', 'Phone', 'Joined Date', 'Last Login'];
      
      // Prepare CSV data
      const csvData = filteredUsers.map(user => [
        `${user.firstName} ${user.lastName}`,
        user.email,
        user.role,
        user.isActive ? 'Active' : 'Inactive',
        user.phone || 'N/A',
        new Date(user.createdAt).toLocaleDateString(),
        user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'
      ]);
      
      // Combine headers and data
      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSnackbar({
        open: true,
        message: 'CSV report generated successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to generate CSV report',
        severity: 'error',
      });
    } finally {
      setReportLoading(false);
    }
  };

  const generatePDFReport = () => {
    try {
      setReportLoading(true);
      
      // Create a simple HTML table for PDF
      const tableRows = filteredUsers.map(user => `
        <tr>
          <td>${user.firstName} ${user.lastName}</td>
          <td>${user.email}</td>
          <td>${user.role}</td>
          <td>${user.isActive ? 'Active' : 'Inactive'}</td>
          <td>${user.phone || 'N/A'}</td>
          <td>${new Date(user.createdAt).toLocaleDateString()}</td>
          <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
        </tr>
      `).join('');
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Users Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2E7D32; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .summary { margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>Users Report</h1>
          <div class="summary">
            <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total Users:</strong> ${filteredUsers.length}</p>
            <p><strong>Active Users:</strong> ${filteredUsers.filter(u => u.isActive).length}</p>
            <p><strong>Inactive Users:</strong> ${filteredUsers.filter(u => !u.isActive).length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Phone</th>
                <th>Joined Date</th>
                <th>Last Login</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
        </html>
      `;
      
      // Open in new window for printing
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
      
      setSnackbar({
        open: true,
        message: 'PDF report opened for printing',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to generate PDF report',
        severity: 'error',
      });
    } finally {
      setReportLoading(false);
    }
  };

  const openReportDialog = () => {
    setReportDialog({ open: true });
  };

  return (
    <Container maxWidth="xl">
      <Fade in timeout={800}>
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(45deg, #2E7D32 30%, #1976D2 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            User Management 👥
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage all users, roles, and permissions across the platform
          </Typography>
        </Box>
      </Fade>

      {/* Filters and Search */}
      <Card sx={{ borderRadius: '20px', overflow: 'hidden', mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Search Users"
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ borderRadius: '15px' }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Role"
                  onChange={handleRoleFilterChange}
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  <MenuItem value="patient">Patients</MenuItem>
                  <MenuItem value="doctor">Doctors</MenuItem>
                  <MenuItem value="admin">Admins</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Assessment />}
                onClick={openReportDialog}
                sx={{ borderRadius: '15px', py: 1.5 }}
              >
                Reports
              </Button>
            </Grid>
            <Grid size={{ xs: 12, md: 1 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/app/admin/users/create')}
                sx={{ borderRadius: '15px', py: 1.5 }}
              >
                Add User
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card sx={{ borderRadius: '20px', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Joined</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Last Login</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          src={user.profileImage ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${user.profileImage}` : ''}
                          sx={{ mr: 2, width: 40, height: 40 }}
                        >
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ID: {user._id.slice(-8)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getRoleIcon(user.role)}
                        label={user.role}
                        color={getRoleColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(user.isActive)}
                        color={getStatusColor(user.isActive)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {user.lastLogin 
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, user)}
                        size="small"
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuList>
          <MenuItem onClick={() => handleEditUser(selectedUser)}>
            <EditIcon sx={{ mr: 1 }} />
            Edit User
          </MenuItem>
          <MenuItem onClick={() => handleToggleUserStatus(selectedUser)}>
            {selectedUser?.isActive ? (
              <>
                <BlockIcon sx={{ mr: 1 }} />
                Deactivate
              </>
            ) : (
              <>
                <UnblockIcon sx={{ mr: 1 }} />
                Activate
              </>
            )}
          </MenuItem>
          <MenuItem onClick={() => handleDeleteUser(selectedUser)}>
            <DeleteIcon sx={{ mr: 1 }} />
            Delete User
          </MenuItem>
        </MenuList>
      </Menu>

      {/* Edit User Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, user: null })} maxWidth="md" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="First Name"
                value={editDialog.user?.firstName || ''}
                onChange={(e) => setEditDialog({
                  ...editDialog,
                  user: { ...editDialog.user, firstName: e.target.value }
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Last Name"
                value={editDialog.user?.lastName || ''}
                onChange={(e) => setEditDialog({
                  ...editDialog,
                  user: { ...editDialog.user, lastName: e.target.value }
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editDialog.user?.email || ''}
                onChange={(e) => setEditDialog({
                  ...editDialog,
                  user: { ...editDialog.user, email: e.target.value }
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Phone"
                value={editDialog.user?.phone || ''}
                onChange={(e) => setEditDialog({
                  ...editDialog,
                  user: { ...editDialog.user, phone: e.target.value }
                })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={editDialog.user?.role || ''}
                  label="Role"
                  onChange={(e) => setEditDialog({
                    ...editDialog,
                    user: { ...editDialog.user, role: e.target.value }
                  })}
                >
                  <MenuItem value="patient">Patient</MenuItem>
                  <MenuItem value="doctor">Doctor</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editDialog.user?.isActive || false}
                    onChange={(e) => setEditDialog({
                      ...editDialog,
                      user: { ...editDialog.user, isActive: e.target.checked }
                    })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, user: null })}>
            Cancel
          </Button>
          <Button onClick={handleSaveUser} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, userId: null, userName: '' })}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{deleteDialog.userName}"? 
            This action cannot be undone and will permanently remove all user data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, userId: null, userName: '' })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Generation Dialog */}
      <Dialog 
        open={reportDialog.open} 
        onClose={() => setReportDialog({ open: false })}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Assessment sx={{ mr: 1, color: 'primary.main' }} />
            Generate Report
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Choose the format for your users report. The report will include all currently filtered users.
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Report Summary
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip 
                label={`Total: ${filteredUsers.length}`} 
                color="primary" 
                variant="outlined" 
              />
              <Chip 
                label={`Active: ${filteredUsers.filter(u => u.isActive).length}`} 
                color="success" 
                variant="outlined" 
              />
              <Chip 
                label={`Inactive: ${filteredUsers.filter(u => !u.isActive).length}`} 
                color="error" 
                variant="outlined" 
              />
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            The report will include: Name, Email, Role, Status, Phone, Joined Date, and Last Login.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setReportDialog({ open: false })}
            disabled={reportLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={generateCSVReport}
            variant="outlined"
            startIcon={<GetApp />}
            disabled={reportLoading}
            sx={{ mr: 1 }}
          >
            {reportLoading ? <CircularProgress size={20} /> : 'Download CSV'}
          </Button>
          <Button
            onClick={generatePDFReport}
            variant="contained"
            startIcon={<Assessment />}
            disabled={reportLoading}
          >
            {reportLoading ? <CircularProgress size={20} /> : 'Generate PDF'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminUsers;