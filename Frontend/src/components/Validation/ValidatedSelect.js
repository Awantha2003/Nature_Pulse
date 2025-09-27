import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';

const ValidatedSelect = ({ 
  error, 
  helperText, 
  showErrorBelow = true,
  children,
  ...props 
}) => {
  return (
    <>
      <FormControl 
        {...props} 
        error={!!error}
        fullWidth
      >
        <InputLabel id={`${props.id}-label`}>{props.label}</InputLabel>
        <Select
          {...props}
          labelId={`${props.id}-label`}
          label={props.label}
        >
          {children}
        </Select>
        {!error && helperText && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, ml: 2 }}>
            {helperText}
          </Typography>
        )}
      </FormControl>
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

export default ValidatedSelect;
