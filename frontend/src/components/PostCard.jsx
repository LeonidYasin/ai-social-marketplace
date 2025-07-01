import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, IconButton, Dialog, Avatar, Divider, Button, Popover, Stack, TextField, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import MoodBadIcon from '@mui/icons-material/MoodBad';

const REACTIONS = {
  like: { icon: '👍', label: 'Нравится', color: '#1877f2' },
  love: { icon: '❤️', label: 'Любовь', color: '#ed5167' },
  laugh: { icon: '😂', label: 'Смех', color: '#ffd96a' },
  wow: { icon: '😮', label: 'Вау', color: '#ffd96a' },
  sad: { icon: '😢', label: 'Грусть', color: '#ffd96a' },
  angry: { icon: '😠', label: 'Злость', color: '#f02849' },
};

const PostCard = ({ post, compact = false }) => {
  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  // Реакции
  const [userReaction, setUserReaction] = useState(null);
  const [reactions, setReactions] = useState(post.reactions || { like: 0, love: 0, laugh: 0, wow: 0, sad: 0, angry: 0 });
  const [reactionAnchor, setReactionAnchor] = useState(null);
  const [reactionAnim, setReactionAnim] = useState(null);
  // Комментарии
  const [comments, setComments] = useState(post.comments || []);
  const [commentValue, setCommentValue] = useState('');
  // Для ветвления комментариев
  const [replyValue, setReplyValue] = useState('');
  const [replyTo, setReplyTo] = useState(null);

  // Lightbox
  const handleImageClick = (idx) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  // Реакции
  const handleReaction = (type) => {
    setReactionAnim(type);
    setTimeout(() => setReactionAnim(null), 800);
    setReactions(prev => {
      const newReactions = { ...prev };
      if (userReaction && userReaction !== type) newReactions[userReaction] = Math.max(0, newReactions[userReaction] - 1);
      if (userReaction === type) {
        newReactions[type] = Math.max(0, newReactions[type] - 1);
        setUserReaction(null);
      } else {
        newReactions[type] = (newReactions[type] || 0) + 1;
        setUserReaction(type);
      }
      return newReactions;
    });
    setReactionAnchor(null);
  };

  // Комментарии
  const handleAddComment = () => {
    if (!commentValue.trim()) return;
    setComments(prev => [
      ...prev,
      { id: Date.now(), author: 'Вы', text: commentValue, time: new Date().toLocaleString(), replies: [], likes: 0, liked: false }
    ]);
    setCommentValue('');
  };
  const handleAddReply = (commentId) => {
    if (!replyValue.trim()) return;
    setComments(prev => prev.map(c =>
      c.id === commentId
        ? { ...c, replies: [...(c.replies || []), { id: Date.now(), author: 'Вы', text: replyValue, time: new Date().toLocaleString(), replies: [], likes: 0, liked: false }] }
        : c
    ));
    setReplyTo(null);
    setReplyValue('');
  };
  const handleLikeComment = (commentId) => {
    setComments(prev => prev.map(c =>
      c.id === commentId
        ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
        : c
    ));
  };

  // Ветвистый комментарий
  const Comment = ({ comment, depth = 0 }) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 1, ml: depth * 4 }}>
      <Avatar sx={{ width: 28, height: 28, bgcolor: 'grey.400', fontSize: 16, mr: 1 }}>
        {comment.author[0] || '?'}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ bgcolor: theme => theme.palette.background.default, borderRadius: 2, px: 2, py: 1, mb: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: 14 }}>{comment.author}</Typography>
          <Typography variant="body2" sx={{ fontSize: 15 }}>{comment.text}</Typography>
          <Typography variant="caption" color="text.secondary">{comment.time}</Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button size="small" sx={{ textTransform: 'none', fontSize: 13, minWidth: 0, p: 0, color: 'primary.main' }} onClick={() => setReplyTo(comment.id)}>
            Ответить
          </Button>
          <Button 
            size="small" 
            sx={{ 
              textTransform: 'none', 
              fontSize: 13, 
              minWidth: 0, 
              p: 0, 
              color: comment.liked ? 'primary.main' : 'text.secondary',
              fontWeight: comment.liked ? 600 : 400,
              transition: 'all 0.2s ease-in-out',
              '&:hover': { 
                transform: 'scale(1.05)',
                color: 'primary.main',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
            }} 
            onClick={() => handleLikeComment(comment.id)}
          >
            <ThumbUpIcon fontSize="small" sx={{ mr: 0.5, fontSize: 16 }} />
            {comment.likes || 0}
          </Button>
        </Stack>
        {replyTo === comment.id && (
          <Box sx={{ mt: 1, mb: 1 }}>
            <TextField
              size={compact ? 'small' : 'medium'}
              placeholder="Ваш ответ..."
              value={replyValue}
              onChange={e => setReplyValue(e.target.value)}
              sx={{ bgcolor: theme => theme.palette.background.paper, borderRadius: 2, mr: 1 }}
            />
            <Button variant="contained" size="small" onClick={() => handleAddReply(comment.id)} disabled={!replyValue}>Отправить</Button>
          </Box>
        )}
        {/* Вложенные комментарии */}
        {comment.replies && comment.replies.map((reply, i) => (
          <Comment key={i} comment={reply} depth={depth + 1} />
        ))}
      </Box>
    </Box>
  );

  // Lightbox
  const handleCloseLightbox = () => setLightboxOpen(false);

  // Основной рендер
  return (
    <Card sx={{ mb: 2, borderRadius: 2, boxShadow: 1 }}>
      <CardContent>
        {/* Автор и дата */}
        {post.author && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar sx={{ width: 32, height: 32, mr: 1 }}>{post.author[0]}</Avatar>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{post.author}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
              {post.createdAt ? new Date(post.createdAt).toLocaleString() : ''}
            </Typography>
          </Box>
        )}
        {/* Текст поста */}
        <Typography variant="body1" sx={{ mb: post.images && post.images.length > 0 ? 2 : 0 }}>
          {post.text}
        </Typography>
        {/* Картинки */}
        {post.images && post.images.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            {post.images.map((img, i) => (
              <Box
                key={i}
                sx={{
                  flex: '1 1 100%',
                  maxWidth: compact ? 120 : 400,
                  mb: 1,
                  cursor: 'pointer',
                  position: 'relative',
                  '&:hover::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    bgcolor: 'rgba(0,0,0,0.08)',
                    borderRadius: 2,
                  },
                }}
                onClick={() => handleImageClick(i)}
              >
                <img
                  src={img}
                  alt="Фото поста"
                  style={{
                    width: '100%',
                    maxHeight: compact ? 120 : 400,
                    objectFit: 'contain',
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    background: '#f5f5f5',
                    display: 'block',
                  }}
                />
              </Box>
            ))}
          </Box>
        )}
        {/* Реакции */}
        <Divider sx={{ my: 2 }} />
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap' }}>
          <Button
            size={compact ? 'small' : 'medium'}
            startIcon={
              <Box sx={{ position: 'relative' }}>
                <Typography sx={{ fontSize: compact ? 18 : 20 }}>
                  {userReaction ? REACTIONS[userReaction].icon : '👍'}
                </Typography>
                {reactionAnim && (
                  <Typography 
                    sx={{ 
                      position: 'absolute',
                      top: -20,
                      left: 0,
                      fontSize: compact ? 20 : 24,
                      animation: 'reactionFloat 0.8s ease-out',
                      '@keyframes reactionFloat': {
                        '0%': { transform: 'translateY(0) scale(1)', opacity: 1 },
                        '100%': { transform: 'translateY(-30px) scale(1.5)', opacity: 0 },
                      }
                    }}
                  >
                    {REACTIONS[reactionAnim].icon}
                  </Typography>
                )}
              </Box>
            }
            onClick={e => setReactionAnchor(e.currentTarget)}
            sx={{
              textTransform: 'none',
              color: userReaction ? REACTIONS[userReaction].color : 'text.secondary',
              fontWeight: userReaction ? 600 : 400,
              borderRadius: 2,
              px: compact ? 1.5 : 2,
              py: compact ? 0.25 : 0.5,
              fontSize: compact ? '0.75rem' : '0.875rem',
              bgcolor: userReaction ? `${REACTIONS[userReaction].color}20` : 'transparent',
              '&:hover': { 
                transform: 'scale(1.05)',
                bgcolor: userReaction ? `${REACTIONS[userReaction].color}30` : 'grey.100',
                boxShadow: 1,
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
            }}
          >
            {userReaction ? REACTIONS[userReaction].label : 'Нравится'}
          </Button>
          <Popover
            open={Boolean(reactionAnchor)}
            anchorEl={reactionAnchor}
            onClose={() => setReactionAnchor(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            PaperProps={{ sx: { borderRadius: 3, boxShadow: 3, bgcolor: '#fff', p: 1 } }}
          >
            <Stack direction="row" spacing={1}>
              {Object.entries(REACTIONS).map(([key, reaction]) => (
                <Tooltip key={key} title={reaction.label} placement="top">
                  <IconButton
                    size="small"
                    onClick={() => handleReaction(key)}
                    sx={{
                      width: compact ? 36 : 40,
                      height: compact ? 36 : 40,
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'scale(1.2)',
                        bgcolor: `${reaction.color}20`,
                      },
                      '&:active': {
                        transform: 'scale(0.9)',
                      },
                    }}
                  >
                    <Typography sx={{ fontSize: compact ? 18 : 20 }}>
                      {reaction.icon}
                    </Typography>
                  </IconButton>
                </Tooltip>
              ))}
            </Stack>
          </Popover>
          <Typography variant="caption" color="text.secondary">
            {Object.values(reactions).reduce((sum, c) => sum + c, 0)} реакций
          </Typography>
        </Stack>
        {/* Комментарии */}
        <Divider sx={{ my: 1 }} />
        <Box>
          {comments.map((comment, i) => (
            <Comment key={comment.id} comment={comment} />
          ))}
        </Box>
        {/* Ввод нового комментария */}
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
          <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 16 }}>
            {'В'}
          </Avatar>
          <TextField
            size={compact ? 'small' : 'medium'}
            placeholder="Написать комментарий..."
            value={commentValue}
            onChange={e => setCommentValue(e.target.value)}
            sx={{ bgcolor: theme => theme.palette.background.default, borderRadius: 2, flex: 1 }}
          />
          <Button 
            variant="contained" 
            size={compact ? 'small' : 'medium'} 
            onClick={handleAddComment} 
            disabled={!commentValue.trim()}
            sx={{ fontSize: compact ? '0.75rem' : '0.875rem', px: compact ? 1 : 2 }}
          >
            Отправить
          </Button>
        </Box>
      </CardContent>
      {/* Lightbox Dialog */}
      <Dialog
        open={lightboxOpen}
        onClose={handleCloseLightbox}
        maxWidth="md"
        PaperProps={{ sx: { bgcolor: '#111', boxShadow: 24, borderRadius: 2, p: 0 } }}
      >
        <Box sx={{ position: 'relative', bgcolor: '#111', p: 0 }}>
          <IconButton
            onClick={handleCloseLightbox}
            sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', zIndex: 2 }}
          >
            <CloseIcon />
          </IconButton>
          {post.images && post.images.length > 0 && (
            <img
              src={post.images[lightboxIndex]}
              alt="Фото поста"
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                display: 'block',
                margin: '0 auto',
                borderRadius: 8,
                background: '#222',
              }}
            />
          )}
          {post.images && post.images.length > 1 && (
            <>
              <IconButton
                onClick={() => setLightboxIndex((lightboxIndex - 1 + post.images.length) % post.images.length)}
                sx={{ position: 'absolute', top: '50%', left: 8, color: '#fff', zIndex: 2, transform: 'translateY(-50%)' }}
              >
                {'<'}
              </IconButton>
              <IconButton
                onClick={() => setLightboxIndex((lightboxIndex + 1) % post.images.length)}
                sx={{ position: 'absolute', top: '50%', right: 48, color: '#fff', zIndex: 2, transform: 'translateY(-50%)' }}
              >
                {'>'}
              </IconButton>
            </>
          )}
        </Box>
      </Dialog>
    </Card>
  );
};

export default PostCard; 