import { toast } from "react-toastify";
import fileApi from "../api/fileApi";
import { toAbsolute } from "../utils/messageUtils";
import { sendMessage as hubSendMessage, sendGroupMessage as hubSendGroupMessage } from "../signalr/chatHub";

export function useImageUpload({
    activeConversationId,
    activeGroupId,
    currentUserId,
    currentUserName,
    setMessages,
    setGroupMessages,
    setGroups
}) {

    const handleSendImage = async ({ file, desc }) => {
        if (!activeConversationId || !file) return;

        const caption = (desc ?? "").trim();
        const isImage = file.type?.startsWith("image/");
        const tempId = `temp-att-${Date.now()}`;
        const localPreview = isImage ? URL.createObjectURL(file) : null;

        setMessages((prev) => [
            ...(Array.isArray(prev) ? prev : []),
            {
                id: tempId,
                conversationId: activeConversationId,
                messageType: isImage ? 1 : 2,
                content: isImage ? localPreview : file.name,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                isOwn: true,
                senderName: currentUserName || "You",
                createdAt: new Date().toISOString(),
                isUploading: true,
            },
        ]);

        try {
            const res = isImage
                ? await fileApi.uploadChatImage(file)
                : await fileApi.uploadChatFile(file);

            const data = res?.data?.data;
            const fileUrl = data?.fileUrl || data?.url || (Array.isArray(data?.fileUrls) ? data.fileUrls[0] : null);

            if (!fileUrl) throw new Error("Upload OK but missing fileUrl");

            setMessages((prev) =>
                (Array.isArray(prev) ? prev : []).map((m) =>
                    m.id === tempId ? { ...m, isUploading: false, content: toAbsolute(fileUrl) } : m
                )
            );

            await hubSendMessage({
                conversationId: activeConversationId,
                messageType: isImage ? 1 : 2,
                content: fileUrl,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
            });

            if (caption) {
                await hubSendMessage({
                    conversationId: activeConversationId,
                    messageType: 0,
                    content: caption,
                });
            }
        } catch (e) {
            console.error("Send attachment failed", e);
            setMessages((prev) =>
                (Array.isArray(prev) ? prev : []).map((m) =>
                    m.id === tempId ? { ...m, isUploading: false, isError: true } : m
                )
            );
        } finally {
            if (localPreview) URL.revokeObjectURL(localPreview);
        }
    };

    const handleSendGroupImage = async (fileData) => {
        if (!activeGroupId || !fileData) return;

        const file = fileData.file || fileData;
        const desc = fileData.desc || null;

        if (!(file instanceof File) && !(file instanceof Blob)) {
            console.error("Invalid file object:", fileData);
            toast.error("Invalid file");
            return;
        }

        const isImage = file.type?.startsWith("image/");
        const messageType = isImage ? 2 : 1;
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const tempUrl = isImage ? URL.createObjectURL(file) : null;

        try {
            const tempMessage = {
                id: tempId,
                groupId: activeGroupId,
                senderId: currentUserId,
                senderName: currentUserName || "You",
                content: isImage ? tempUrl : file.name,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                messageType: messageType,
                createdAt: new Date().toISOString(),
                isTemp: true,
                isUploading: true
            };

            setGroupMessages((prev) => [...prev, tempMessage]);

            const displayMessage = isImage ? "Image" : "File";
            setGroups((prev) => {
                const list = Array.isArray(prev) ? prev : [];
                return list.map((g) => {
                    if (g.id === activeGroupId) {
                        return {
                            ...g,
                            lastMessage: displayMessage,
                            lastMessageAt: new Date().toISOString(),
                            lastMessageSender: "You"
                        };
                    }
                    return g;
                });
            });

            const uploadResponse = isImage
                ? await fileApi.uploadChatImage(file)
                : await fileApi.uploadChatFile(file);
            const data = uploadResponse?.data?.data;
            const fileUrl = data?.fileUrl || data?.url || (Array.isArray(data?.fileUrls) ? data.fileUrls[0] : null);

            if (!fileUrl) {
                console.error("Upload response:", uploadResponse);
                throw new Error("No file URL returned from upload");
            }

            setGroupMessages((prev) =>
                prev.map((msg) =>
                    msg.id === tempId ? { ...msg, content: toAbsolute(fileUrl), isTemp: false, isUploading: false } : msg
                )
            );

            await hubSendGroupMessage({
                groupId: activeGroupId,
                content: fileUrl,
                messageType: messageType,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type
            });

            if (desc && desc.trim()) {
                await hubSendGroupMessage({
                    groupId: activeGroupId,
                    content: desc.trim(),
                    messageType: 0
                });
            }
        } catch (error) {
            console.error("Send group file failed:", error);
            toast.error(isImage ? "Failed to send image" : "Failed to send file");
            setGroupMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        } finally {
            if (tempUrl) URL.revokeObjectURL(tempUrl);
        }
    };

    return {
        handleSendImage,
        handleSendGroupImage
    };
}
