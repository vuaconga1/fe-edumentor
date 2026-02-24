import React, { useEffect, useRef, useState } from "react";
import { X, UploadCloud, Calendar, DollarSign, Clock } from "lucide-react";

/**
 * ActionModals - Managing chat action popups
 * Props:
 * - isOpen: boolean
 * - onClose: function
 * - type: 'image' | 'deal-price' | 'start-work' | 'schedule' | null
 * - onSubmit: function(type, data)
 */
const ActionModals = ({ isOpen, onClose, type, onSubmit }) => {
  const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
    price: "",
    desc: "",
    date: "",
    time: "",
    file: null,
  });
  const isPickedImage = formData.file?.type?.startsWith("image/");


  const [filePreviewUrl, setFilePreviewUrl] = useState(null);

  // Create image preview
  useEffect(() => {
    if (!formData.file) {
      setFilePreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(formData.file);
    setFilePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [formData.file]);

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setFormData({ price: "", desc: "", date: "", time: "", file: null });
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const openFilePicker = () => fileInputRef.current?.click();

  const setPickedFile = (file) => {
    if (!file) return;


    // Only allow images


    setFormData((prev) => ({ ...prev, file }));
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    setPickedFile(file);
  };

  const removeFile = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFormData((prev) => ({ ...prev, file: null }));
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    setPickedFile(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const isConfirmDisabled = type === "image" ? !formData.file : false;

  const handleSubmit = () => {
    onSubmit(type, formData);
    onClose();
  };

  // --- RENDER CONTENT BY TYPE ---
  const renderContent = () => {
    switch (type) {
      case "deal-price":
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign size={24} />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                Đề xuất chi phí
              </h3>
              <p className="text-sm text-neutral-500">
                Nhập mức giá bạn muốn đề xuất cho mentor
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Mức giá (VND)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="Ví dụ: 500,000"
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-lg font-semibold"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Ghi chú
              </label>
              <textarea
                value={formData.desc}
                onChange={(e) =>
                  setFormData({ ...formData, desc: e.target.value })
                }
                placeholder="Mô tả công việc..."
                rows={3}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none"
              />
            </div>
          </div>
        );

      case "schedule":
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar size={24} />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                Đặt lịch hẹn
              </h3>
              <p className="text-sm text-neutral-500">
                Chọn thời gian phù hợp để trao đổi
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Ngày
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Giờ
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Nội dung buổi hẹn
              </label>
              <input
                type="text"
                placeholder="Example: Discuss React Project..."
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                onChange={(e) =>
                  setFormData({ ...formData, desc: e.target.value })
                }
              />
            </div>
          </div>
        );

      case "image":
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                Gửi hình ảnh hoặc file
              </h3>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={openFilePicker}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && openFilePicker()
              }
              onDrop={onDrop}
              onDragOver={onDragOver}
              className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors group"
            >
              {!formData.file ? (
                <>
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <UploadCloud size={32} />
                  </div>
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Nhấn để tải file lên
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    hoặc kéo thả vào đây
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-3">
                    Ảnh (PNG/JPG/GIF) hoặc File (PDF/DOC/XLS)
                  </p>
                </>
              ) : (
                <div className="w-full flex items-center gap-4">
                  {isPickedImage ? (
                    <img
                      src={filePreviewUrl}
                      alt="preview"
                      className="h-20 w-20 rounded-xl object-cover border border-neutral-200 dark:border-neutral-700"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-xs text-neutral-500">
                      FILE
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                      {formData.file.name}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {(formData.file.size / 1024).toFixed(1)} KB •{" "}
                      {formData.file.type}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openFilePicker();
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                      >
                        Đổi ảnh
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile();
                        }}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="*"
              onChange={onFileChange}
              className="hidden"
            />

          
          </div>
        );

      case "start-work":
        return (
          <div className="text-center space-y-4 py-2">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Clock size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                Bắt đầu phiên làm việc?
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 px-4">
                Hệ thống sẽ bắt đầu tính giờ làm việc. Hãy đảm bảo bạn đã trao
                đổi kỹ với Mentor.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // --- DETERMINE BUTTON COLOR BY TYPE ---
  const getButtonColor = () => {
    switch (type) {
      case "deal-price":
        return "bg-orange-500 hover:bg-orange-600";
      case "schedule":
        return "bg-purple-600 hover:bg-purple-700";
      case "start-work":
        return "bg-green-600 hover:bg-green-700";
      default:
        return "bg-blue-600 hover:bg-blue-700";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-all">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-6 pt-8">{renderContent()}</div>

        <div className="p-4 bg-neutral-50 dark:bg-neutral-950/50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isConfirmDisabled}
            className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl shadow-lg shadow-black/5 transition-all active:scale-95 ${getButtonColor()} ${isConfirmDisabled
              ? "opacity-50 cursor-not-allowed active:scale-100"
              : ""
              }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionModals;
