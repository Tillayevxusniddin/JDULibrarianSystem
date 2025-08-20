import React from 'react';
import { Card, CardContent, Skeleton } from '@mui/material';

const BookCardSkeleton: React.FC = () => {
  return (
    <Card>
      <Skeleton variant="rectangular" height={256} />
      <CardContent>
        <Skeleton variant="text" sx={{ fontSize: '1.25rem' }} />
        <Skeleton variant="text" width="60%" />
        <div className="flex items-center justify-between mt-2">
          <Skeleton variant="rounded" width={80} height={24} />
          <Skeleton variant="rounded" width={80} height={24} />
        </div>
      </CardContent>
    </Card>
  );
};

export default BookCardSkeleton;