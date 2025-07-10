import PropTypes from 'prop-types';

export const Header = ({ user, onLogin, onLogout, onCreateAccount }) => (
  <header style={{
    fontFamily: "'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    borderBottom: '1px solid #ddd',
    padding: '15px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }}>
    <div style={{
      fontWeight: 700,
      fontSize: '20px',
      display: 'flex',
      alignItems: 'center',
      lineHeight: 1,
    }}>
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{
        marginRight: '8px',
      }}>
        <g fill="none" fillRule="evenodd">
          <path
            d="M10 0h12a10 10 0 0110 10v12a10 10 0 01-10 10H10A10 10 0 010 22V10A10 10 0 0110 0z"
            fill="#FFF"
          />
          <path
            d="M5.3 10.6l10.4 6v11.1l-10.4-6v-11zm11.4-6.2l9.7 5.5-9.7 5.6V4.4z"
            fill="#555AB9"
          />
          <path
            d="M27.2 10.6v11.2l-10.5 6V16.5l10.5-6zM15.7 4.4v11L6 10l9.7-5.5z"
            fill="#91BAF8"
          />
        </g>
      </svg>
      Acme
    </div>
    <div style={{
      display: 'flex',
      gap: '10px',
    }}>
      {user ? (
        <>
          <span style={{
            color: '#333',
            fontSize: '14px',
            marginRight: '10px',
          }}>
            Welcome, <b>{user.name}</b>!
          </span>
          <button
            size="small"
            onClick={onLogout}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #333',
              borderRadius: '3em',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 700,
              lineHeight: 1,
              cursor: 'pointer',
            }}
          >
            Log out
          </button>
        </>
      ) : (
        <>
          <button
            size="small"
            onClick={onLogin}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #333',
              borderRadius: '3em',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 700,
              lineHeight: 1,
              cursor: 'pointer',
              marginRight: '10px',
            }}
          >
            Log in
          </button>
          <button
            primary
            size="small"
            onClick={onCreateAccount}
            style={{
              backgroundColor: '#1ea7fd',
              color: 'white',
              border: 0,
              borderRadius: '3em',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 700,
              lineHeight: 1,
              cursor: 'pointer',
            }}
          >
            Sign up
          </button>
        </>
      )}
    </div>
  </header>
);

Header.propTypes = {
  user: PropTypes.shape({}),
  onLogin: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  onCreateAccount: PropTypes.func.isRequired,
};

Header.defaultProps = {
  user: null,
};
