import React from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Chip, Box } from '@mui/material';
import { responsiveTableSx } from '../common/tableResponsive';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete'; // <-- YANGI IKONKA
import type { User, UserStatus } from '../../types';

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void; // <-- YANGI PROP
}

const getStatusColor = (status: UserStatus) => {
    if (status === 'ACTIVE') return 'success';
    if (status === 'INACTIVE') return 'default';
    if (status === 'SUSPENDED') return 'error';
}

const UsersTable: React.FC<UsersTableProps> = ({ users, onEdit, onDelete }) => {
  return (
    <TableContainer component={Paper}>
      <Table sx={responsiveTableSx}>
        <TableHead>
          <TableRow>
            <TableCell>Ism Familiya</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Roli</TableCell>
            <TableCell>Statusi</TableCell>
            <TableCell align="right">Harakatlar</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell data-label="Ism Familiya">{user.firstName} {user.lastName}</TableCell>
              <TableCell data-label="Email">{user.email}</TableCell>
              <TableCell data-label="Roli">{user.role}</TableCell>
              <TableCell data-label="Statusi">
                <Chip label={user.status} color={getStatusColor(user.status)} size="small" />
              </TableCell>
              <TableCell data-label="Harakatlar" align="right">
                <Box>
                  <IconButton onClick={() => onEdit(user)} color="primary">
                    <EditIcon />
                  </IconButton>
                  {/* --- YANGI QO'SHIMCHA --- */}
                  <IconButton onClick={() => onDelete(user)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UsersTable;
