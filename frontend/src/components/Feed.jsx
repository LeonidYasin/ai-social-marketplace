import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Select, MenuItem, InputLabel, FormControl, CardMedia, Grid } from '@mui/material';

const initialPosts = [
  { id: 1, text: 'Продаю iPhone 13', images: [], price: '50 000 ₽', privacy: 'all' },
  { id: 2, text: 'MacBook Air, почти новый', images: [], price: '80 000 ₽', privacy: 'all' },
];

const Feed = () => {
  const [posts, setPosts] = useState(initialPosts);
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [privacy, setPrivacy] = useState('all');

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
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">Создать пост</Typography>
          <TextField
            label="Текст поста"
            multiline
            fullWidth
            value={text}
            onChange={e => setText(e.target.value)}
            sx={{ my: 1 }}
          />
          <Button variant="contained" component="label" sx={{ mr: 2 }}>
            Загрузить фото
            <input type="file" hidden multiple accept="image/*" onChange={handleImageChange} />
          </Button>
          <FormControl sx={{ minWidth: 120, mr: 2 }}>
            <InputLabel>Приватность</InputLabel>
            <Select value={privacy} label="Приватность" onChange={e => setPrivacy(e.target.value)}>
              <MenuItem value="all">Все</MenuItem>
              <MenuItem value="private">Только я</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handlePost} disabled={!text}>Опубликовать</Button>
          <Box sx={{ mt: 1 }}>
            {images.map((img, i) => (
              <Typography key={i} variant="caption">{img.name}</Typography>
            ))}
          </Box>
        </CardContent>
      </Card>
      <Grid container spacing={2}>
        {posts.map(post => (
          <Grid item xs={12} key={post.id}>
            <Card>
              <CardContent>
                <Typography variant="body1">{post.text}</Typography>
                {post.images.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    {post.images.map((img, i) => (
                      <CardMedia
                        key={i}
                        component="img"
                        image={img}
                        alt="Фото поста"
                        sx={{ width: 100, height: 100, objectFit: 'cover' }}
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