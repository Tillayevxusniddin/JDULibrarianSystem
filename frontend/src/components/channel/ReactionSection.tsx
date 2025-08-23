import React, { useState, useEffect, useMemo } from 'react';
import { Box, Chip, IconButton, Popover, Typography } from '@mui/material';
import AddReactionIcon from '@mui/icons-material/AddReaction';
import { useAuthStore } from '../../store/auth.store';
import type { Post } from '../../types';
import { socket } from '../../api/socket';
import api from '../../api';

interface ReactionSectionProps {
  post: Post;
}

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const ReactionSection: React.FC<ReactionSectionProps> = ({ post }) => {
  const { user } = useAuthStore();
  const [reactions, setReactions] = useState(post.reactions || []);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    socket.emit('joinPostReactions', post.id);

    const handleReactionsUpdated = ({ postId }: { postId: string }) => {
      if (postId === post.id) {
        // Eng ishonchli yechim: post ma'lumotlarini to'liq qayta so'rab olish
        api.get(`/posts/channel/${post.channelId}`).then(res => {
            const updatedPost = res.data.data.find((p: Post) => p.id === post.id);
            if (updatedPost) {
                setReactions(updatedPost.reactions);
            }
        });
      }
    };

    socket.on('reactions_updated', handleReactionsUpdated);

    return () => {
      socket.emit('leavePostReactions', post.id);
      socket.off('reactions_updated', handleReactionsUpdated);
    };
  }, [post.id, post.channelId]);

  const handleEmojiClick = (emoji: string) => {
    // Optimistik yangilanish
    const myCurrentReaction = reactions.find(r => r.userId === user?.id);
    let newReactions = [...reactions];

    if (myCurrentReaction) {
        newReactions = newReactions.filter(r => r.userId !== user?.id);
        if (myCurrentReaction.emoji !== emoji) {
            newReactions.push({ emoji, userId: user!.id });
        }
    } else {
        newReactions.push({ emoji, userId: user!.id });
    }
    setReactions(newReactions);

    api.post(`/reactions/${post.id}`, { emoji });
    setAnchorEl(null);
  };

  const myReaction = useMemo(() => {
    return reactions.find(r => r.userId === user?.id)?.emoji;
  }, [reactions, user]);

  const reactionGroups = useMemo(() => {
    return reactions.reduce((acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [reactions]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 1 }}>
      {Object.entries(reactionGroups).map(([emoji, count]) => (
        <Chip
          key={emoji}
          label={`${emoji} ${count}`}
          onClick={() => handleEmojiClick(emoji)}
          variant={myReaction === emoji ? 'filled' : 'outlined'}
          color={myReaction === emoji ? 'primary' : 'default'}
          size="small"
        />
      ))}
      <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
        <AddReactionIcon fontSize="small" />
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Box sx={{ p: 1, display: 'flex', gap: 0.5 }}>
          {EMOJI_OPTIONS.map(emoji => (
            <IconButton key={emoji} onClick={() => handleEmojiClick(emoji)}>
              <Typography>{emoji}</Typography>
            </IconButton>
          ))}
        </Box>
      </Popover>
    </Box>
  );
};

export default ReactionSection;
