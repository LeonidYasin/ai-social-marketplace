import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Avatar, 
  Stack, 
  TextField, 
  IconButton,
  Switch,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import LogoutIcon from '@mui/icons-material/Logout';

const ProfilePage = ({ currentUser, onLogout }) => {
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [profile, setProfile] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    bio: currentUser?.bio || '',
    avatar: currentUser?.avatar || ''
  });

  if (!currentUser) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Пользователь не найден</Typography>
      </Box>
    );
  }

  const startEdit = () => {
    setEditName(currentUser?.name || profile.name);
    setEditEmail(currentUser?.email || profile.email);
    setEditMode(true);
  };

  const saveEdit = () => {
    setProfile(prev => ({
      ...prev,
      name: editName,
      email: editEmail
    }));
    setEditMode(false);
    // Здесь можно добавить API вызов для сохранения
  };

  const cancelEdit = () => {
    setEditMode(false);
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfile(prev => ({ ...prev, avatar: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>Профиль пользователя</Typography>
      
      <Paper sx={{ p: { xs: 1, sm: 2 }, mt: 2 }}>
        <Stack spacing={3}>
          {/* Аватар и основная информация */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={currentUser?.avatar || profile.avatar}
                sx={{ width: 80, height: 80, fontSize: 32 }}
              >
                {(currentUser?.name || profile.name)[0]}
              </Avatar>
              <IconButton
                component="label"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                <PhotoCameraIcon />
                <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
              </IconButton>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {currentUser?.name || profile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentUser?.email || profile.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                @{currentUser?.username}
              </Typography>
            </Box>
          </Box>

          {/* Кнопки редактирования и выхода */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {!editMode ? (
                <Button
                  variant="outlined"
                  onClick={startEdit}
                  startIcon={<EditIcon />}
                >
                  Редактировать
                </Button>
              ) : (
                <>
                  <Button
                    variant="contained"
                    onClick={saveEdit}
                    startIcon={<SaveIcon />}
                  >
                    Сохранить
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={cancelEdit}
                    startIcon={<CancelIcon />}
                  >
                    Отмена
                  </Button>
                </>
              )}
            </Box>
            <Button
              variant="outlined"
              color="error"
              onClick={onLogout}
              startIcon={<LogoutIcon />}
            >
              Выйти
            </Button>
          </Box>

          <Divider />

          {/* Поля для редактирования */}
          <Stack spacing={3}>
            {/* Имя */}
            <TextField
              label="Имя"
              value={editMode ? editName : (currentUser?.name || profile.name)}
              onChange={(e) => editMode ? setEditName(e.target.value) : setProfile(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              disabled={!editMode}
            />

            {/* Email */}
            <TextField
              label="Email"
              type="email"
              value={editMode ? editEmail : (currentUser?.email || profile.email)}
              onChange={(e) => editMode ? setEditEmail(e.target.value) : setProfile(prev => ({ ...prev, email: e.target.value }))}
              fullWidth
              disabled={!editMode}
            />

            {/* Биография */}
            <TextField
              label="О себе"
              multiline
              rows={3}
              value={profile.bio}
              onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
              fullWidth
              disabled={!editMode}
            />
          </Stack>

          {/* Дополнительная информация */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Дополнительная информация</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Дата регистрации: {new Date(currentUser?.createdAt || Date.now()).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  ID пользователя: {currentUser?.id}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ProfilePage; 