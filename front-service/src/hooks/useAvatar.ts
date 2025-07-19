import { useState, useEffect } from 'react';

export const useAvatar = (avatarUrl?: string) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (avatarUrl) {
      setIsLoading(true);
      // Giả lập loading avatar
      setTimeout(() => {
        setImageUrl(avatarUrl);
        setIsLoading(false);
      }, 500);
    } else {
      setImageUrl('');
      setIsLoading(false);
    }
  }, [avatarUrl]);

  return {
    imageUrl,
    isLoading
  };
}; 