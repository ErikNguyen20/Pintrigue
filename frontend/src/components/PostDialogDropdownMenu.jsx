import { Button, Dialog, Menu, Portal } from "@chakra-ui/react"
import { IoHeart, IoHeartOutline, IoEllipsisHorizontalSharp } from "react-icons/io5";
import { useDeletePostAPI } from "../utils/api_methods";
import { toaster } from "@/components/ui/toaster"

const PostDialogDropdownMenu = ({ dialog, post }) => {
    const { mutate: deletePost } = useDeletePostAPI();

    const handleCloseDialog = () => {
        if (dialog != null && dialog.setOpen) {
            dialog.setOpen(false);
        }
    };

    const handleDeletePost = () => {
        if (!post?.id) return;

        deletePost({ postId: post.id }, {
            onSuccess: () => {
                toaster.success("Post deleted successfully");
                handleCloseDialog();
            },
            onError: (error) => {
                toaster.error("Failed to delete post. Please try again later.");
                console.error("Failed to delete post:", error);
            }
        });
    }

    return (
        <Menu.Root>
        <Menu.Trigger asChild _hover={{ textDecoration: "underline" }} cursor="pointer" mr="4" ml="2">
            <IoEllipsisHorizontalSharp size={20} />
        </Menu.Trigger>
        <Menu.Positioner>
            <Menu.Content>
                <Menu.Item value="delete" color="fg.error" _hover={{ bg: "bg.error", color: "fg.error" }} cursor="pointer" onClick={handleDeletePost}>Delete</Menu.Item>
            </Menu.Content>
        </Menu.Positioner>
        </Menu.Root>
    )
}

export default PostDialogDropdownMenu;