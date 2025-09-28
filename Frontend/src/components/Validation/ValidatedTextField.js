import React from 'react';
import { TextField, Typography } from '@mui/material';

const ValidatedTextField = ({ 
  error, 
  helperText, 
  showErrorBelow = true,
  inputProps,
  slotProps,
  ...props 
}) => {
  const hasError = !!error;
  const errorMessage = typeof error === 'string' ? error : '';
  
  return (
    <>
      <TextField
        {...props}
        error={hasError}
        helperText={hasError ? '' : helperText}
        inputProps={inputProps}
        slotProps={slotProps}
      />
      {hasError && showErrorBelow && errorMessage && (
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
          {errorMessage}
        </Typography>
      )}
    </>
  );
};

export default ValidatedTextField;
