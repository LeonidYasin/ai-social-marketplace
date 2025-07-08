import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Select, MenuItem, InputLabel, FormControl, Avatar, Stack, IconButton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';

const SECTIONS = [
  { value: 'tribune', label: 'Трибуна' },
  { value: 'video', label: 'Видео' },
  { value: 'sell', label: 'Продам' },
  { value: 'buy', label: 'Куплю' },
  { value: 'give', label: 'Отдам' },
  { value: 'realty', label: 'Недвижимость' },
];

const BG_COLORS = [
  '',
  'linear-gradient(90deg, #fbc2eb 0%, #a6c1ee 100%)',
  'linear-gradient(90deg, #f9d423 0%, #ff4e50 100%)',
  'linear-gradient(90deg, #43cea2 0%, #185a9d 100%)',
  'linear-gradient(90deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(90deg, #a1c4fd 0%, #c2e9fb 100%)',
  '#fffde4',
  '#f0f2f5',
];

const CreatePostPage = ({ currentUser }) => {
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [doc, setDoc] = useState(null);
  const [privacy, setPrivacy] = useState('all');
  const [section, setSection] = useState('tribune');
  const [bg, setBg] = useState('');
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };
  const handleVideoChange = (e) => {
    setVideo(e.target.files[0]);
  };
  const handleDocChange = (e) => {
    setDoc(e.target.files[0]);
  };
  const handlePost = () => {
    // TODO: реализовать отправку поста
    navigate('/');
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
              {currentUser?.name?.[0] || 'A'}
            </Avatar>
            <Typography variant="h6">Создать пост</Typography>
            <IconButton onClick={() => navigate(-1)} sx={{ ml: 'auto' }}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <TextField
            label="Текст поста"
            multiline
            fullWidth
            minRows={4}
            value={text}
            onChange={e => setText(e.target.value)}
            sx={{ mb: 2, mt: 2, bgcolor: theme => theme.palette.background.default, borderRadius: 2 }}
          />
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Фон публикации:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {BG_COLORS.map((color, i) => (
                <Box
                  key={i}
                  onClick={() => setBg(color)}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: color && !color.startsWith('linear') ? color : undefined,
                    background: color && color.startsWith('linear') ? color : undefined,
                    border: bg === color ? '2px solid #1976d2' : '2px solid #fff',
                    boxShadow: bg === color ? 2 : 1,
                    cursor: 'pointer',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    transform: bg === color ? 'scale(1.15)' : 'scale(1)',
                    outline: 'none',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'scale(1.15)',
                    },
                  }}
                  title={color ? 'Выбрать фон' : 'Без фона'}
                >
                  {!color && (
                    <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: '#eee', m: 'auto', mt: '7px' }} />
                  )}
                </Box>
              ))}
            </Box>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Приватность</InputLabel>
              <Select value={privacy} label="Приватность" onChange={e => setPrivacy(e.target.value)}>
                <MenuItem value="all">Все</MenuItem>
                <MenuItem value="private">Только я</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Раздел</InputLabel>
              <Select value={section} label="Раздел" onChange={e => setSection(e.target.value)}>
                {SECTIONS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Tooltip title="Добавить фото">
              <IconButton component="label">
                <PhotoCameraIcon color={images.length ? 'primary' : 'action'} />
                <input type="file" hidden multiple accept="image/*" onChange={handleImageChange} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Добавить видео">
              <IconButton component="label">
                <VideoLibraryIcon color={video ? 'primary' : 'action'} />
                <input type="file" hidden accept="video/*" onChange={handleVideoChange} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Добавить документ">
              <IconButton component="label">
                <InsertDriveFileIcon color={doc ? 'primary' : 'action'} />
                <input type="file" hidden accept=".pdf,.doc,.docx,.txt" onChange={handleDocChange} />
              </IconButton>
            </Tooltip>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            {images.map((img, i) => (
              <Typography key={i} variant="caption">{img.name}</Typography>
            ))}
            {video && <Typography variant="caption">{video.name}</Typography>}
            {doc && <Typography variant="caption">{doc.name}</Typography>}
          </Stack>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={() => navigate(-1)}>Отмена</Button>
            <Button variant="contained" onClick={handlePost} disabled={!text && images.length === 0 && !video && !doc}>Опубликовать</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreatePostPage;