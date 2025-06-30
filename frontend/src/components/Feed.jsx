import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Select, MenuItem, InputLabel, FormControl, CardMedia, Grid, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Stack } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';

const initialPosts = [
  { id: 1, text: 'Продаю iPhone 13', images: [], price: '50 000 ₽', privacy: 'all' },
  { id: 2, text: 'MacBook Air, почти новый', images: [], price: '80 000 ₽', privacy: 'all' },
];

const Feed = () => {
  const [posts, setPosts] = useState(initialPosts);
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [privacy, setPrivacy] = useState('all');
  const [open, setOpen] = useState(false);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
  };

  const handlePost = () => {
    setPosts([
      {
        id: Date.now(),
        text,
        images: images.map(f => URL.createObjectURL(f)),
        price: '',
        privacy,
      },
      ...posts,
    ]);
    setText('');
    setImages([]);
    setPrivacy('all');
    setOpen(false);
  };

  return (
    <Box>
      {/* Facebook-style create post panel */}
      <Card sx={{ mb: 3, bgcolor: '#fff', borderRadius: 3, boxShadow: 2 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>A</Avatar>
          <Button
            variant="outlined"
            sx={{ borderRadius: 8, flex: 1, justifyContent: 'flex-start', color: 'text.secondary', bgcolor: '#f0f2f5', textTransform: 'none', pl: 2, boxShadow: 0 }}
            onClick={() => setOpen(true)}
          >
            Что у вас нового?
          </Button>
        </CardContent>
      </Card>
      {/* Модальное окно создания поста */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3, boxShadow: 3, bgcolor: '#fff' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Создать пост
          <IconButton onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>A</Avatar>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Приватность</InputLabel>
              <Select value={privacy} label="Приватность" onChange={e => setPrivacy(e.target.value)}>
                <MenuItem value="all">Все</MenuItem>
                <MenuItem value="private">Только я</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <TextField
            label="Текст поста"
            multiline
            fullWidth
            minRows={3}
            value={text}
            onChange={e => setText(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" component="label" startIcon={<PhotoCameraIcon />} sx={{ mb: 1 }}>
            Загрузить фото
            <input type="file" hidden multiple accept="image/*" onChange={handleImageChange} />
          </Button>
          <Box sx={{ mt: 1 }}>
            {images.map((img, i) => (
              <Typography key={i} variant="caption">{img.name}</Typography>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handlePost} disabled={!text}>Опубликовать</Button>
        </DialogActions>
      </Dialog>
      {/* Лента постов */}
      <Grid container spacing={2}>
        {posts.map(post => (
          <Grid item xs={12} key={post.id}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, bgcolor: '#fff' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="body1">{post.text}</Typography>
                {post.images.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    {post.images.map((img, i) => (
                      <CardMedia
                        key={i}
                        component="img"
                        image={img}
                        alt="Фото поста"
                        sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 2 }}
                      />
                    ))}
                  </Box>
                )}
                {post.price && <Typography color="text.secondary">Цена: {post.price}</Typography>}
                <Typography variant="caption" color="text.secondary">
                  Приватность: {post.privacy === 'all' ? 'Все' : 'Только я'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Feed; 