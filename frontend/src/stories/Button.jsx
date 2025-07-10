import PropTypes from 'prop-types';

/** Primary UI component for user interaction */
export const Button = ({
  primary = false,
  backgroundColor = null,
  size = 'medium',
  label,
  ...props
}) => {
  const mode = primary ? 'storybook-button--primary' : 'storybook-button--secondary';
  
  const buttonStyles = {
    display: 'inline-block',
    cursor: 'pointer',
    border: 0,
    borderRadius: '3em',
    fontWeight: 700,
    lineHeight: 1,
    fontFamily: "'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    ...(primary ? {
      backgroundColor: '#555ab9',
      color: 'white',
    } : {
      boxShadow: 'rgba(0, 0, 0, 0.15) 0px 0px 0px 1px inset',
      backgroundColor: 'transparent',
      color: '#333',
    }),
    ...(size === 'small' && {
      padding: '10px 16px',
      fontSize: '12px',
    }),
    ...(size === 'medium' && {
      padding: '11px 20px',
      fontSize: '14px',
    }),
    ...(size === 'large' && {
      padding: '12px 24px',
      fontSize: '16px',
    }),
    ...(backgroundColor && { backgroundColor }),
  };

  return (
    <button
      type="button"
      style={buttonStyles}
      {...props}
    >
      {label}
    </button>
  );
};

Button.propTypes = {
  /** Is this the principal call to action on the page? */
  primary: PropTypes.bool,
  /** What background color to use */
  backgroundColor: PropTypes.string,
  /** How large should the button be? */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  /** Button contents */
  label: PropTypes.string.isRequired,
  /** Optional click handler */
  onClick: PropTypes.func,
};
