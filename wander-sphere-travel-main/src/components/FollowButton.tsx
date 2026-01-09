/**
 * FollowButton Component
 * Reusable follow/unfollow button with loading states
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { followService } from '@/services/followService';
import { toast } from '@/components/ui/use-toast';

interface FollowButtonProps {
  userId: string;
  username?: string;
  initialIsFollowing?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showIcon?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  username,
  initialIsFollowing = false,
  variant = 'default',
  size = 'default',
  showIcon = true,
  onFollowChange,
}) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    e.preventDefault();

    setIsLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        await followService.unfollowUser(userId);
        setIsFollowing(false);
        toast({
          title: 'Unfollowed',
          description: username ? `You unfollowed ${username}` : 'User unfollowed',
        });
      } else {
        // Follow
        await followService.followUser(userId);
        setIsFollowing(true);
        toast({
          title: 'Following',
          description: username ? `You are now following ${username}` : 'User followed',
        });
      }

      // Notify parent component
      if (onFollowChange) {
        onFollowChange(!isFollowing);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isFollowing ? 'outline' : variant}
      size={size}
      onClick={handleToggleFollow}
      disabled={isLoading}
      className="min-w-[100px]"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {isFollowing ? 'Unfollowing...' : 'Following...'}
        </>
      ) : (
        <>
          {showIcon && (
            isFollowing ? (
              <UserMinus className="w-4 h-4 mr-2" />
            ) : (
              <UserPlus className="w-4 h-4 mr-2" />
            )
          )}
          {isFollowing ? 'Following' : 'Follow'}
        </>
      )}
    </Button>
  );
};

export default FollowButton;
