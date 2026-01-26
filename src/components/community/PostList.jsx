import React from 'react';
import PostCard from './PostCard';
import postsData from '../../mock/posts.json';

const PostList = () => {
  return (
    <div className="flex flex-col gap-6">
      {postsData.map((post) => (
        // TRUYỀN PROP
        <PostCard 
          key={post.id} 
          post={post} />
      ))}
    </div>
  );
};

export default PostList;