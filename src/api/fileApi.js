import axiosClient from "./axios";

const fileApi = {
    uploadChatImage: (file) => {
        const formData = new FormData();
        formData.append("file", file); // ✅ đúng key backend: IFormFile file

        return axiosClient.post("/api/File/upload/chat-image", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
    uploadChatFile: (file) => {
        const formData = new FormData();
        formData.append("files", file); // ✅ đúng key theo swagger

        return axiosClient.post("/api/File/upload/chat-files", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },

};

export default fileApi;
