import PropTypes from 'prop-types';

import { Header } from './Header';

export const Page = ({ user, onLogin, onLogout, onCreateAccount }) => (
  <article style={{
    fontFamily: "'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: '14px',
    lineHeight: '24px',
    padding: '48px 20px',
    margin: '0 auto',
    maxWidth: '600px',
    color: '#333',
  }}>
    <Header user={user} onLogin={onLogin} onLogout={onLogout} onCreateAccount={onCreateAccount} />
    <section style={{
      fontSize: '11px',
      lineHeight: '22px',
      margin: '0',
      marginTop: '64px',
      maxWidth: '600px',
    }}>
      <h2 style={{
        fontWeight: '700',
        fontSize: '32px',
        lineHeight: '1',
        margin: '0 0 4px',
        display: 'inline',
      }}>
        Pages in Storybook
      </h2>
      <p style={{
        margin: '1em 0',
      }}>
        We recommend building UIs with a{' '}
        <a
          href="https://componentdriven.org"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#1ea7fd',
            textDecoration: 'none',
          }}
        >
          <strong>component-driven</strong>
        </a>{' '}
        process starting with atomic components and ending with pages.
      </p>
      <p style={{
        margin: '1em 0',
      }}>
        Render pages with mock data. This makes it easy to build and review page states without
        needing to navigate to them in your app. Here are some handy patterns for managing page
        data in Storybook:
      </p>
      <ul style={{
        paddingLeft: '30px',
        margin: '1em 0',
      }}>
        <li style={{
          margin: '0.5em 0',
        }}>
          Use a higher-level connected component. Storybook helps you compose such data from the
          "args" of child component stories
        </li>
        <li style={{
          margin: '0.5em 0',
        }}>
          Assemble data in the page component from your services. You can mock these services out
          using Storybook.
        </li>
      </ul>
      <p style={{
        margin: '1em 0',
      }}>
        Get a guided tutorial on component-driven development at{' '}
        <a
          href="https://storybook.js.org/tutorials/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#1ea7fd',
            textDecoration: 'none',
          }}
        >
          Storybook tutorials
        </a>
        . Read more in the{' '}
        <a
          href="https://storybook.js.org/docs"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#1ea7fd',
            textDecoration: 'none',
          }}
        >
          docs
        </a>
        .
      </p>
      <div style={{
        fontSize: '13px',
        lineHeight: '20px',
        marginTop: '40px',
        paddingTop: '40px',
        borderTop: '1px solid #eee',
      }}>
        <span style={{
          display: 'inline-block',
          width: '10px',
          height: '10px',
          borderRadius: '10px',
          backgroundColor: '#85d2d2',
          marginRight: '10px',
        }} />
        <span style={{
          color: '#333',
        }}>
          Your stories on a dedicated or company server
        </span>
      </div>
    </section>
  </article>
);
Page.propTypes = {
  user: PropTypes.shape({}),
  onLogin: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  onCreateAccount: PropTypes.func.isRequired,
};

Page.defaultProps = {
  user: null,
};
