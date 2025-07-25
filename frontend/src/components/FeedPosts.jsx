import { Container } from "@chakra-ui/react";
import FeedPost from "./FeedPost";
import { useEffect } from "react";

import { usePostFeedAPI } from '../utils/api_methods';
import { useInView } from "react-intersection-observer";

const FeedPosts = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = usePostFeedAPI();
  const { ref, inView } = useInView({ threshold: 1 });
  
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);
  
  const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <Container maxW="container.lg" py="10">

      {/* Render Skeletons while loading */}
      {isLoading && (
        Array.from({ length: 6 }).map((_, i) => <FeedPost.Skeleton key={i} />)
      )}

      {/* Render all posts */}
      {allPosts.map((post) => (
        <FeedPost key={post.id} post={post} />
      ))}

      {/* Infinite Scroll Trigger */}
      {/* Intersection Observer target */}
      {hasNextPage && (
        <div ref={ref}>
          {isFetchingNextPage && <FeedPost.Skeleton />}
        </div>
      )}
    </Container>
  );
}

export default FeedPosts;