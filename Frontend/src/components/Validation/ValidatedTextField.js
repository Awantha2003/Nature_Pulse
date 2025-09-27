import React from 'react';
import { TextField, Typography } from '@mui/material';

const ValidatedTextField = ({ 
  error, 
  helperText, 
  showErrorBelow = true,
  ...props 
}) => {
  return (
    <>
      <TextField
        {...props}
        error={!!error}
        helperText={error ? '' : helperText}
      />
      {error && showErrorBelow && (
        <Typography 
          variant="caption" 
          color="error" 
          sx={{ 
            mt: 0.5, 
            ml: 2, 
            display: 'block',
            fontSize: '0.75rem'
          }}
        >
          {error}
        </Typography>
      )}
    </>
  );
};

export default ValidatedTextField;
