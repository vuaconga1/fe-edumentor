import axiosClient from "./axios";

const fileApi = {
    uploadChatImage: (file) => {
        const formData = new FormData();
        formData.append("file", file);

        return axiosClient.post("/api/File/upload/chat-image", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
    uploadChatFile: (file) => {
        const formData = new FormData();
        formData.append("files", file);

        return axiosClient.post("/api/File/upload/chat-files", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },

};

export default fileApi;
