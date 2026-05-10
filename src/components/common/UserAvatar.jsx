import React from 'react';
import { Avatar } from '@mui/material';
import { getInitials, getAvatarColor } from '../../utils/formatUser';

const SIZES = { sm: 28, md: 36, lg: 48 };
const FONT_SIZES = { sm: 11, md: 13, lg: 16 };

export default function UserAvatar({ name, size = 'md', imageUrl, sx = {} }) {
  const px = SIZES[size] || SIZES.md;
  const fs = FONT_SIZES[size] || FONT_SIZES.md;

  if (imageUrl) {
    return (
      <Avatar
        src={imageUrl}
        alt={name}
        sx={{ width: px, height: px, ...sx }}
      />
    );
  }

  return (
    <Avatar
      sx={{
        width: px,
        height: px,
        fontSize: fs,
        fontFamily: 'DM Mono, monospace',
        fontWeight: 600,
        background: getAvatarColor(name),
        color: '#fff',
        ...sx,
      }}
    >
      {getInitials(name)}
    </Avatar>
  );
}
