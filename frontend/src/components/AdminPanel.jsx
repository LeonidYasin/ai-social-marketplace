import React, { useState } from 'react';
import { api } from '../config/api';

const AdminPanel = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [dbInfo, setDbInfo] = useState(null);

  const handleAuthenticate = async () => {
    if (!password) {
      setMessage('Введите пароль администратора');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${api.baseURL}/admin/database-info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        const data = await response.json();
        setDbInfo(data);
        setIsAuthenticated(true);
        setMessage('Успешная авторизация');
      } else {
        setMessage('Неверный пароль');
      }
    } catch (error) {
      setMessage('Ошибка подключения: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFixDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${api.baseURL}/admin/fix-database`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('База данных успешно исправлена!');
        // Обновляем информацию о БД
        handleAuthenticate();
      } else {
        setMessage('Ошибка: ' + data.message);
      }
    } catch (error) {
      setMessage('Ошибка подключения: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecreateNotifications = async () => {
    if (!confirm('ВНИМАНИЕ! Это удалит все существующие уведомления. Продолжить?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${api.baseURL}/admin/recreate-notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Таблица notifications успешно пересоздана!');
        // Обновляем информацию о БД
        handleAuthenticate();
      } else {
        setMessage('Ошибка: ' + data.message);
      }
    } catch (error) {
      setMessage('Ошибка подключения: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-panel" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h2>🔧 Админская панель</h2>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px' }}>
            Пароль администратора:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginBottom: '10px'
            }}
            placeholder="Введите пароль"
          />
          <button
            onClick={handleAuthenticate}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Проверка...' : 'Войти'}
          </button>
        </div>
        {message && (
          <div style={{
            padding: '10px',
            backgroundColor: message.includes('Ошибка') ? '#f8d7da' : '#d4edda',
            border: '1px solid ' + (message.includes('Ошибка') ? '#f5c6cb' : '#c3e6cb'),
            borderRadius: '4px',
            color: message.includes('Ошибка') ? '#721c24' : '#155724'
          }}>
            {message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="admin-panel" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🔧 Админская панель - База данных</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setIsAuthenticated(false)}
          style={{
            padding: '5px 10px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Выйти
        </button>
      </div>

      {dbInfo && (
        <div style={{ marginBottom: '20px' }}>
          <h3>📊 Информация о базе данных</h3>
          <div style={{ marginBottom: '10px' }}>
            <strong>Таблицы:</strong> {dbInfo.tables.join(', ')}
          </div>
          
          <h4>Структура таблицы notifications:</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Колонка</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Тип</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Null</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>По умолчанию</th>
              </tr>
            </thead>
            <tbody>
              {dbInfo.notificationsStructure.map((column, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{column.column_name}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{column.data_type}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{column.is_nullable}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{column.column_default || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3>🛠️ Действия</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <button
            onClick={handleFixDatabase}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginRight: '10px'
            }}
          >
            {loading ? 'Исправление...' : 'Исправить структуру БД'}
          </button>
          <span style={{ fontSize: '14px', color: '#666' }}>
            Добавит недостающие колонки в таблицу notifications
          </span>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <button
            onClick={handleRecreateNotifications}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginRight: '10px'
            }}
          >
            {loading ? 'Пересоздание...' : 'Пересоздать таблицу notifications'}
          </button>
          <span style={{ fontSize: '14px', color: '#666' }}>
            Удалит и создаст заново таблицу notifications (ВНИМАНИЕ: удалит все данные!)
          </span>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '10px',
          backgroundColor: message.includes('Ошибка') ? '#f8d7da' : '#d4edda',
          border: '1px solid ' + (message.includes('Ошибка') ? '#f5c6cb' : '#c3e6cb'),
          borderRadius: '4px',
          color: message.includes('Ошибка') ? '#721c24' : '#155724'
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AdminPanel; 