import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Select, MenuItem, InputLabel, FormControl, CardMedia, Grid, Avatar, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Stack, Tabs, Tab, Divider, Tooltip, ToggleButtonGroup, ToggleButton } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';

const initialPosts = [
  { id: 1, text: 'Продаю iPhone 13', images: [], video: null, doc: null, bg: '', section: 'sell', privacy: 'all' },
  { id: 2, text: 'MacBook Air, почти новый', images: [], video: null, doc: null, bg: '', section: 'sell', privacy: 'all' },
];

const initialAIMessages = [
  { text: 'Здравствуйте! Чем могу помочь?', isUser: false },
];

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

// Компонент для комментариев с ветками
const Comment = ({ comment, onReply, onSendReply, replyValue, setReplyValue, depth = 0 }) => {
  const [showReply, setShowReply] = useState(false);
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 1, ml: depth * 4 }}>
      <Avatar sx={{ width: 28, height: 28, bgcolor: comment.isAI ? 'primary.main' : 'grey.400', fontSize: 16, mr: 1 }}>
        {comment.isAI ? <SmartToyIcon fontSize="small" /> : (comment.author[0] || '?')}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ bgcolor: '#f0f2f5', borderRadius: 2, px: 2, py: 1, mb: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: 14 }}>{comment.author}</Typography>
          <Typography variant="body2" sx={{ fontSize: 15 }}>{comment.text}</Typography>
          <Typography variant="caption" color="text.secondary">{comment.time}</Typography>
        </Box>
        <Button size="small" sx={{ textTransform: 'none', fontSize: 13, minWidth: 0, p: 0, color: 'primary.main' }} onClick={() => setShowReply(!showReply)}>
          Ответить
        </Button>
        {showReply && (
          <Box sx={{ mt: 1, mb: 1 }}>
            <TextField
              size="small"
              placeholder="Ваш ответ..."
              value={replyValue}
              onChange={e => setReplyValue(e.target.value)}
              sx={{ bgcolor: '#fff', borderRadius: 2, mr: 1 }}
            />
            <Button variant="contained" size="small" onClick={onSendReply} disabled={!replyValue}>Отправить</Button>
          </Box>
        )}
        {/* Вложенные комментарии */}
        {comment.replies && comment.replies.map((reply, i) => (
          <Comment
            key={i}
            comment={reply}
            onReply={() => onReply(comment.id, reply.id)}
            onSendReply={() => onSendReply(comment.id, reply.id)}
            replyValue={replyValue}
            setReplyValue={setReplyValue}
            depth={depth + 1}
          />
        ))}
      </Box>
    </Box>
  );
};

const Feed = () => {
  const [posts, setPosts] = useState(initialPosts);
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [doc, setDoc] = useState(null);
  const [privacy, setPrivacy] = useState('all');
  const [section, setSection] = useState('tribune');
  const [bg, setBg] = useState('');
  const [open, setOpen] = useState(false);
  const [aiOpen, setAIOpen] = useState(false);
  const [aiMessages, setAIMessages] = useState(initialAIMessages);
  const [aiInput, setAIInput] = useState('');
  // Комментарии хранятся в состоянии по id поста
  const [comments, setComments] = useState({}); // { [postId]: [ {id, author, text, time, replies: []} ] }
  const [commentValue, setCommentValue] = useState({}); // { [postId]: '' }
  const [replyValue, setReplyValue] = useState('');

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
  };
  const handleVideoChange = (e) => {
    setVideo(e.target.files[0]);
  };
  const handleDocChange = (e) => {
    setDoc(e.target.files[0]);
  };

  const handlePost = (aiDialog = null) => {
    setPosts([
      {
        id: Date.now(),
        text: aiDialog ? aiDialog.map(m => (m.isUser ? 'Вы: ' : 'AI: ') + m.text).join('\n') : text,
        images: images.map(f => URL.createObjectURL(f)),
        video: video ? URL.createObjectURL(video) : null,
        doc: doc ? doc.name : null,
        bg,
        section,
        privacy,
      },
      ...posts,
    ]);
    setText('');
    setImages([]);
    setVideo(null);
    setDoc(null);
    setPrivacy('all');
    setSection('tribune');
    setBg('');
    setAIMessages(initialAIMessages);
    setAIInput('');
    setOpen(false);
    setAIOpen(false);
  };

  const handleAISend = () => {
    if (!aiInput.trim()) return;
    setAIMessages(prev => [
      ...prev,
      { text: aiInput, isUser: true },
      { text: 'AI: (заглушка ответа)', isUser: false },
    ]);
    setAIInput('');
  };

  const handleInsertAI = (msg) => {
    setText(text ? text + '\n' + msg : msg);
    setAIOpen(false);
  };

  // Добавить комментарий к посту
  const handleAddComment = (postId) => {
    const newComment = {
      id: Date.now(),
      author: 'Вы',
      text: commentValue[postId],
      time: new Date().toLocaleTimeString().slice(0, 5),
      replies: [],
      isAI: false,
    };
    setComments(prev => ({
      ...prev,
      [postId]: prev[postId] ? [ ...prev[postId], newComment ] : [ newComment ]
    }));
    setCommentValue(prev => ({ ...prev, [postId]: '' }));
  };

  // Добавить ответ к комментарию (ветка)
  const handleAddReply = (postId, commentId, text) => {
    setComments(prev => {
      const updateReplies = (arr) => arr.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            replies: [ ...(c.replies || []), {
              id: Date.now(),
              author: 'Вы',
              text,
              time: new Date().toLocaleTimeString().slice(0, 5),
              replies: [],
              isAI: false,
            } ]
          };
        } else if (c.replies) {
          return { ...c, replies: updateReplies(c.replies) };
        }
        return c;
      });
      return {
        ...prev,
        [postId]: updateReplies(prev[postId] || [])
      };
    });
    setReplyValue('');
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
      {/* Модальное окно создания поста с современным стилем */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3, boxShadow: 3, bgcolor: '#fff' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>A</Avatar>
            <Typography variant="h6">Создать пост</Typography>
          </Stack>
          <IconButton onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          {/* Тело поста */}
          <TextField
            label="Текст поста"
            multiline
            fullWidth
            minRows={4}
            value={text}
            onChange={e => setText(e.target.value)}
            sx={{ mb: 2, mt: 1, bgcolor: bg || '#fff', borderRadius: 2, transition: 'background 0.3s' }}
            InputProps={{ style: bg ? { background: bg, color: '#222', fontWeight: 600, fontSize: 20 } : {} }}
          />
          {/* Панелька выбора фона */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Фон публикации:</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
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
          {/* Все настройки под полем поста */}
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
          {/* Панелька дополнить публикацию */}
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
            <Tooltip title="AI-подсказка">
              <IconButton onClick={() => setAIOpen(true)}>
                <LightbulbIcon color="primary" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Эмодзи скоро!">
              <span><IconButton disabled><InsertEmoticonIcon /></IconButton></span>
            </Tooltip>
          </Stack>
          {/* Вывод выбранных файлов */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            {images.map((img, i) => (
              <Typography key={i} variant="caption">{img.name}</Typography>
            ))}
            {video && <Typography variant="caption">{video.name}</Typography>}
            {doc && <Typography variant="caption">{doc.name}</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={() => handlePost()} disabled={!text && images.length === 0 && !video && !doc}>Опубликовать</Button>
        </DialogActions>
      </Dialog>
      {/* AI-ассистент как отдельное модальное окно */}
      <Dialog open={aiOpen} onClose={() => setAIOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, boxShadow: 3, bgcolor: '#fff' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}><SmartToyIcon /></Avatar>
          <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>AI-ассистент</Typography>
          <IconButton onClick={() => setAIOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, pt: 1 }}>
          <Box sx={{ maxHeight: 220, overflowY: 'auto', px: 2, pb: 1 }}>
            {aiMessages.map((msg, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: msg.isUser ? 'flex-end' : 'flex-start', mb: 1 }}>
                <Box sx={{ bgcolor: msg.isUser ? 'primary.main' : 'grey.200', color: msg.isUser ? 'white' : 'black', borderRadius: 2, px: 2, py: 1, maxWidth: '80%' }}>
                  {msg.text}
                </Box>
                {msg.isUser === false && (
                  <Button size="small" sx={{ ml: 1 }} onClick={() => handleInsertAI(msg.text)}>Вставить в пост</Button>
                )}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2, pt: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Задать вопрос AI..."
            value={aiInput}
            onChange={e => setAIInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAISend()}
            sx={{ bgcolor: '#f0f2f5', borderRadius: 2 }}
          />
          <Button color="primary" variant="contained" onClick={handleAISend} sx={{ minWidth: 40, ml: 1, borderRadius: 2 }}>
            <SmartToyIcon />
          </Button>
        </DialogActions>
        <Divider sx={{ my: 1 }} />
        <Button variant="outlined" color="primary" fullWidth onClick={() => handlePost(aiMessages)}>
          Опубликовать диалог как пост
        </Button>
      </Dialog>
      {/* Лента постов */}
      <Grid container spacing={2}>
        {posts.map(post => (
          <Grid item xs={12} key={post.id}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, bgcolor: '#fff' }}>
              <CardContent sx={{ p: 2 }}>
                {/* Текст поста с фоном */}
                <Box
                  sx={{
                    background: post.bg || 'transparent',
                    borderRadius: 2,
                    p: post.bg ? 2 : 0,
                    mb: 1,
                    fontWeight: post.bg ? 600 : 400,
                    fontSize: post.bg ? 20 : 16,
                    whiteSpace: 'pre-line',
                    color: post.bg ? '#222' : 'inherit',
                    transition: 'background 0.3s'
                  }}
                >
                  {post.text}
                </Box>
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
                {post.video && (
                  <Box sx={{ mt: 1 }}>
                    <video src={post.video} controls style={{ width: 200, borderRadius: 8 }} />
                  </Box>
                )}
                {post.doc && (
                  <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 1 }}>Документ: {post.doc}</Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  Раздел: {SECTIONS.find(s => s.value === post.section)?.label || ''} | Приватность: {post.privacy === 'all' ? 'Все' : 'Только я'}
                </Typography>
                {/* Комментарии */}
                <Divider sx={{ my: 2 }} />
                <Box sx={{ mb: 1 }}>
                  <Button size="small" sx={{ textTransform: 'none', color: 'primary.main', fontWeight: 500 }}>
                    Комментировать ({(comments[post.id]?.length || 0)})
                  </Button>
                </Box>
                {/* Список комментариев */}
                <Box>
                  {(comments[post.id] || []).map((comment, i) => (
                    <Comment
                      key={comment.id}
                      comment={comment}
                      onReply={() => {}}
                      onSendReply={() => handleAddReply(post.id, comment.id, replyValue)}
                      replyValue={replyValue}
                      setReplyValue={setReplyValue}
                    />
                  ))}
                </Box>
                {/* Ввод нового комментария */}
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 16, mr: 1 }}>В</Avatar>
                  <TextField
                    size="small"
                    placeholder="Написать комментарий..."
                    value={commentValue[post.id] || ''}
                    onChange={e => setCommentValue(prev => ({ ...prev, [post.id]: e.target.value }))}
                    sx={{ bgcolor: '#f0f2f5', borderRadius: 2, flex: 1, mr: 1 }}
                  />
                  <Button variant="contained" size="small" onClick={() => handleAddComment(post.id)} disabled={!(commentValue[post.id] && commentValue[post.id].trim())}>Отправить</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Feed; 