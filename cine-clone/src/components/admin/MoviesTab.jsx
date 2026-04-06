import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  AlertCircle,
  X,
  Eye,
  ChevronDown,
  Save,
  Filter,
  Plus,
  Clock,
  Edit,
  Trash2,
} from "lucide-react";

export const ErrorMsg = ({ msg }) => (
  <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1 animate-fade-in-down">
    <AlertCircle size={12} /> {msg}
  </p>
);

export const MovieModal = ({ currentMovie, setIsModalOpen, handleSave }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: currentMovie || {
      title: "",
      genre: "",
      duration: "",
      status: "Đang chiếu",
      poster: "",
    },
  });
  useEffect(() => {
    if (currentMovie) reset(currentMovie);
  }, [currentMovie, reset]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={() => setIsModalOpen(false)}
      ></div>
      <div className="relative bg-white rounded-2xl w-full max-w-lg p-6">
        <h3 className="font-bold text-lg mb-4">
          {currentMovie ? "Sửa Phim" : "Thêm Phim"}
        </h3>
        <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
          <input
            {...register("title", { required: "Nhập tên phim" })}
            className="w-full bg-slate-50 border p-3 rounded-xl"
            placeholder="Tên phim"
          />
          <button
            type="submit"
            className="w-full py-3 bg-[#dc2626] text-white rounded-xl"
          >
            Lưu Phim
          </button>
        </form>
      </div>
    </div>
  );
};
