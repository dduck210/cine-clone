import React, { useState } from "react";
import { Edit, Trash2, X, Search, Shield, User } from "lucide-react";

export const UserEditModal = ({ user, onClose, onSave }) => {
  const [role, setRole] = useState(user.role);
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(user._id, { name, role });
    setSaving(false);
  };

  const unchanged = name === user.name && role === user.role;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-slate-800">Chỉnh sửa thành viên</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"><X size={20} /></button>
        </div>

        <div className="space-y-4 mb-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm text-slate-400">{user.email}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">Họ tên</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 font-medium outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">Vai trò</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 font-medium outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 text-sm"
            >
              <option value="user">Thành viên</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 text-sm">Hủy</button>
          <button
            onClick={handleSave}
            disabled={saving || unchanged}
            className="flex-1 py-2.5 bg-red-600 rounded-xl text-white font-bold shadow-lg shadow-red-100 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
};

export const UsersManager = ({ users, loading, onUpdate, onDelete }) => {
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d) => new Date(d).toLocaleDateString("vi-VN");

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(deleteTarget._id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Thành viên hệ thống</h2>
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 font-medium"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-6 py-3.5 font-bold text-slate-500 uppercase text-xs tracking-wider">Thành viên</th>
                    <th className="text-left px-6 py-3.5 font-bold text-slate-500 uppercase text-xs tracking-wider hidden md:table-cell">SĐT</th>
                    <th className="text-left px-6 py-3.5 font-bold text-slate-500 uppercase text-xs tracking-wider">Vai trò</th>
                    <th className="text-left px-6 py-3.5 font-bold text-slate-500 uppercase text-xs tracking-wider hidden lg:table-cell">Tham gia</th>
                    <th className="text-right px-6 py-3.5 font-bold text-slate-500 uppercase text-xs tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm flex-shrink-0">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{user.name}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 hidden md:table-cell">{user.phone || "—"}</td>
                      <td className="px-6 py-4">
                        {user.role === "admin" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600">
                            <Shield size={11} /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                            <User size={11} /> Thành viên
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs hidden lg:table-cell">{formatDate(user.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditUser(user)}
                            className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-[#dc2626] transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(user)}
                            disabled={user.email === currentUser?.email || user.role === "admin"}
                            className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                            title={user.role === "admin" ? "Không thể xóa admin" : "Xóa"}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400 font-medium">Không tìm thấy thành viên nào.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-400 font-medium">Tổng: {filtered.length} / {users.length} thành viên</p>
            </div>
          </>
        )}
      </div>

      {editUser && (
        <UserEditModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={async (id, data) => { await onUpdate(id, data); setEditUser(null); }}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
              <Trash2 size={26} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Xác nhận xóa?</h3>
            <p className="text-slate-500 text-sm mb-6">
              Xóa tài khoản <span className="font-bold text-slate-800">"{deleteTarget.name}"</span>? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 text-sm">Hủy</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 rounded-xl text-white font-bold shadow-lg shadow-red-100 hover:bg-red-700 disabled:opacity-50 text-sm"
              >
                {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
