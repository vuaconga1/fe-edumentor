import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import groupApi from "../api/groupApi";

export default function JoinGroupPage() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const joinGroup = async () => {
      if (!inviteCode) {
        toast.error("Mã mời không hợp lệ");
        navigate("/");
        return;
      }

      try {
        const res = await groupApi.joinGroup(inviteCode);

        // ✅ AxiosResponse -> backend payload nằm trong res.data
        const api = res.data;

        if (api?.success) {
          const group = api.data;
          toast.success(`Đã tham gia nhóm "${group?.name ?? ""}"!`);
          navigate(`/messaging?groupId=${group?.id}`);
        } else {
          toast.error(api?.message || "Không thể tham gia nhóm");
          navigate("/messaging");
        }
      } catch (error) {
        // ✅ log rõ để debug 401/400
        console.error("Error joining group:", error?.response?.data || error);
        toast.error(error?.response?.data?.message || "Đã xảy ra lỗi khi tham gia nhóm");
        navigate("/messaging");
      }
    };

    joinGroup();
  }, [inviteCode, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang tham gia nhóm...</p>
      </div>
    </div>
  );
}
