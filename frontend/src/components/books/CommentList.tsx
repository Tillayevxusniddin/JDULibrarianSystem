import React from 'react';
import { Box, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider, Rating } from '@mui/material';
import type { Comment } from '../../types';

interface CommentListProps {
  comments: Comment[];
}

const CommentList: React.FC<CommentListProps> = ({ comments }) => {
  if (comments.length === 0) {
    return <Typography color="text.secondary">Bu kitob uchun hali izohlar mavjud emas.</Typography>;
  }

  return (
    <List>
      {comments.map((comment, index) => (
        <React.Fragment key={comment.id}>
          <ListItem alignItems="flex-start">
            <ListItemAvatar>
              <Avatar>{comment.user.firstName.charAt(0)}</Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box className="flex items-center">
                  <Typography component="span" variant="body1" className="font-bold">
                    {comment.user.firstName} {comment.user.lastName}
                  </Typography>
                  {comment.rating && <Rating name="read-only" value={comment.rating} readOnly size="small" className="ml-2" />}
                </Box>
              }
              secondary={
                <>
                  <Typography component="span" variant="body2" color="text.primary" className="block">
                    {comment.comment}
                  </Typography>
                  {new Date(comment.createdAt).toLocaleDateString()}
                </>
              }
            />
          </ListItem>
          {index < comments.length - 1 && <Divider variant="inset" component="li" />}
        </React.Fragment>
      ))}
    </List>
  );
};

export default CommentList;