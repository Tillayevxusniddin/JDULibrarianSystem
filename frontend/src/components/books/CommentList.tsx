import React from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Rating,
} from "@mui/material";
import type { BookComment } from "../../types";

interface CommentListProps {
  comments: BookComment[];
}

const CommentList: React.FC<CommentListProps> = ({ comments }) => {
  if (comments.length === 0) {
    return (
      <Typography color="text.secondary">
        Bu kitob uchun hali izohlar mavjud emas.
      </Typography>
    );
  }

  return (
    <List
      sx={{
        width: "100%",
        bgcolor: (theme) =>
          theme.palette.mode === "dark" ? "transparent" : "background.paper",
      }}
    >
      {comments.map((comment, index) => (
        <React.Fragment key={comment.id}>
          <ListItem
            alignItems="flex-start"
            sx={{
              borderRadius: 2,
              mb: 1,
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(30, 41, 59, 0.4)"
                  : undefined,
              "&:hover": {
                background: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(30, 41, 59, 0.6)"
                    : "rgba(0, 0, 0, 0.02)",
              },
              transition: "all 0.3s ease",
            }}
          >
            <ListItemAvatar>
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  boxShadow: (theme) =>
                    theme.palette.mode === "dark"
                      ? "0 2px 10px rgba(96, 165, 250, 0.3)"
                      : undefined,
                }}
              >
                {comment.user.firstName.charAt(0)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Typography
                    component="span"
                    variant="body1"
                    sx={{ fontWeight: "bold" }}
                  >
                    {comment.user.firstName} {comment.user.lastName}
                  </Typography>
                  {comment.rating && (
                    <Rating
                      name="read-only"
                      value={comment.rating}
                      readOnly
                      size="small"
                      sx={{
                        ml: 2,
                        "& .MuiRating-iconFilled": {
                          color: (theme) =>
                            theme.palette.mode === "dark"
                              ? "#fbbf24"
                              : undefined,
                        },
                      }}
                    />
                  )}
                </Box>
              }
              secondary={
                <>
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.primary"
                    sx={{ display: "block" }}
                  >
                    {comment.comment}
                  </Typography>
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                  >
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </Typography>
                </>
              }
            />
          </ListItem>
          {index < comments.length - 1 && (
            <Divider
              variant="inset"
              component="li"
              sx={{
                borderColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(148, 163, 184, 0.1)"
                    : undefined,
              }}
            />
          )}
        </React.Fragment>
      ))}
    </List>
  );
};

export default CommentList;
